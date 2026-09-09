'use strict';

/**
 * DSHwork 工作台插件自动挂载器(产品核心接入,路线 3:薄壳 + 插件化)
 *
 * 作用:桌面薄壳启动 Harness 之前,把本地 DSHwork 工作台 Cordis 插件
 * (`@deepseek-ai/dsh-client-ui-dshwork`)装入它将要启动的 profile,使工作台
 * (主页/任务/工作区/模板库/插件)真正出现在 Harness 界面里,而不是只开一个空壳网页。
 *
 * 机制(与生态完全一致):通过 dsh 官方的 `dsh plugin --profile <name> add <link:>` 命令,
 * 把本地插件包以 `link:` 依赖加入 profile,并由其 bundle patch(`dsh.bundle.patch`)
 * 把 `dshwork-workbench` 行插入 web 插件名册。全程走官方机制,不魔改上游。
 *
 * 设计要点:
 *  - 无 electron 依赖,可在纯 Node 下测试。
 *  - 幂等:已挂载则原样返回,不重复改 / 不重复装。
 *  - 容错:dsh 插件缺失 / pnpm 缺失 / 无网络等任一失败都只记录并返回 { ok:false },
 *    绝不阻塞 Harness 启动(降级为「无工作台」的裸 Harness)。
 *  - 可用环境变量开关与覆盖:
 *      DSHWORK_AUTO_MOUNT=0       关闭自动挂载
 *      DSHWORK_HARNESS_PROFILE    目标 profile(默认 web)
 *      DSHWORK_WORKBENCH_DIR     工作台插件目录(默认按 打包resources/开发态 解析)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { log } = require('./log');

const PLUGIN_NAME = '@deepseek-ai/dsh-client-ui-dshwork';

// ---------------------------------------------------------------------------
// 路径解析
// ---------------------------------------------------------------------------

function dshHome() {
  return process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
}

function defaultProfileName() {
  return process.env.DSHWORK_HARNESS_PROFILE || 'web';
}

function profileDirFor(name, home = dshHome()) {
  return path.join(home, 'profiles', name);
}

/** 内置 Harness 的 dsh CLI 入口(镜像 harness.js 的 findBundledHarness 候选)。 */
function resolveDshBin() {
  const candidates = [];
  if (process.env.DSHWORK_HARNESS_DIR) {
    candidates.push(path.join(process.env.DSHWORK_HARNESS_DIR, 'lib', 'bin.js'));
    candidates.push(path.join(process.env.DSHWORK_HARNESS_DIR, 'package.json'));
  }
  if (process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, 'vendor', 'harness', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js'));
    candidates.push(path.join(process.resourcesPath, 'vendor', 'harness', 'node_modules', '@deepseek-ai', 'dsh', 'bin.js'));
  }
  // 开发态
  candidates.push(path.join(__dirname, '..', '..', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js'));
  candidates.push(path.join(__dirname, '..', '..', '..', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js'));
  for (const c of candidates) {
    if (c.endsWith('bin.js') && fs.existsSync(c)) return c;
  }
  return null;
}

/** 工作台插件包的绝对目录(env 优先;其次打包 resources;最后开发态)。 */
function resolvePluginDir() {
  if (process.env.DSHWORK_WORKBENCH_DIR) return process.env.DSHWORK_WORKBENCH_DIR;
  const candidates = [];
  if (process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, 'plugins', 'dsh-client-ui-dshwork'));
  }
  // 开发态:desktop/src/main -> ../../../plugins/dsh-client-ui-dshwork
  candidates.push(path.join(__dirname, '..', '..', '..', 'plugins', 'dsh-client-ui-dshwork'));
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'package.json'))) return c;
  }
  return null;
}

/** 把 Windows 反斜杠路径转成正斜杠,便于写进 package.json. */
function toForwardSlashes(p) {
  return p.replace(/\\/g, '/');
}

// ---------------------------------------------------------------------------
// 已挂载检测
// ---------------------------------------------------------------------------

/** profile 的 package.json 里是否已声明该插件为 bundle。 */
function bundlesInclude(profilePkg) {
  const bundles = profilePkg && profilePkg.dsh && profilePkg.dsh.profile && profilePkg.dsh.profile.bundles;
  return Array.isArray(bundles) && bundles.includes(PLUGIN_NAME);
}

/** 该插件包是否已「安装」到 profile(link 或 node_modules 之一可解析)。 */
function pluginInstalled(profileDir) {
  const rel = path.join('node_modules', '@deepseek-ai', 'dsh-client-ui-dshwork', 'package.json');
  const check = [
    path.join(profileDir, rel),
    path.join(dshHome(), 'profiles', 'node_modules', '@deepseek-ai', 'dsh-client-ui-dshwork', 'package.json')
  ];
  for (const p of check) {
    try {
      if (fs.existsSync(p)) {
        const meta = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (meta && meta.name === PLUGIN_NAME) return true;
      }
    } catch (_) {
      // 目录不可读 → 继续下一个候选
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// 无 pnpm 的直装兜底(把插件包直接放进 profile 的 node_modules + 加进 bundles)
// ---------------------------------------------------------------------------

/**
 * 把插件包复制到 profile 的 node_modules/@deepseek-ai/<name>,使其可被
 * 客户端模块系统(createRequire)解析;无需 pnpm。返回是否已就位。
 */
function installByCopy(profileDir, pluginDir) {
  const target = path.join(profileDir, 'node_modules', '@deepseek-ai', 'dsh-client-ui-dshwork');
  const pkgJson = path.join(target, 'package.json');
  try {
    // 已存在且名字正确 → 视为已安装,不重复复制
    if (fs.existsSync(pkgJson)) {
      const meta = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
      if (meta && meta.name === PLUGIN_NAME) return true;
    }
    fs.mkdirSync(target, { recursive: true });
    for (const name of fs.readdirSync(pluginDir)) {
      if (name === 'test' || name === 'node_modules') continue; // 运行时不需要
      fs.cpSync(path.join(pluginDir, name), path.join(target, name), { recursive: true });
    }
    return fs.existsSync(pkgJson);
  } catch (err) {
    log('[profile-mount] installByCopy failed:', err && err.message);
    return false;
  }
}

/** 把插件加进 profile 的 dsh.profile.bundles(幂等)。返回是否写入了 package.json。 */
function addBundleToProfile(profileDir, pluginDir) {
  const pkgPath = path.join(profileDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    log('[profile-mount] profile package.json missing; cannot add bundle:', pkgPath);
    return false;
  }
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (bundlesInclude(pkg)) return true;
    if (!pkg.dsh) pkg.dsh = {};
    if (!pkg.dsh.profile) pkg.dsh.profile = {};
    if (!Array.isArray(pkg.dsh.profile.bundles)) pkg.dsh.profile.bundles = [];
    pkg.dsh.profile.bundles.push(PLUGIN_NAME);
    // 一并登记依赖(供 pnpm 后续识别,非启动必需)
    if (!pkg.dependencies) pkg.dependencies = {};
    if (!pkg.dependencies[PLUGIN_NAME]) pkg.dependencies[PLUGIN_NAME] = 'link:' + toForwardSlashes(path.resolve(pluginDir));
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    return true;
  } catch (err) {
    log('[profile-mount] addBundleToProfile failed:', err && err.message);
    return false;
  }
}

/**
 * 撤销工作台插件挂载(还原用户原有 harness profile):
 *   - 从 profile 的 dsh.profile.bundles 与 dependencies 里移除该插件;
 *   - 删除 profile node_modules 与共享 flat-fallback 里的该插件包。
 * @param {string} profileDir - profile 目录。
 * @returns {boolean} 是否成功(至少改了 package.json)。
 */
function removeWorkbenchMounted(profileDir) {
  const pkgPath = path.join(profileDir, 'package.json');
  let changed = false;
  try {
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      if (pkg.dependencies && pkg.dependencies[PLUGIN_NAME]) {
        delete pkg.dependencies[PLUGIN_NAME];
        changed = true;
      }
      if (pkg.dsh && pkg.dsh.profile && Array.isArray(pkg.dsh.profile.bundles) && pkg.dsh.profile.bundles.includes(PLUGIN_NAME)) {
        pkg.dsh.profile.bundles = pkg.dsh.profile.bundles.filter((b) => b !== PLUGIN_NAME);
        changed = true;
      }
      if (changed) fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    }
  } catch (err) {
    log('[profile-mount] removeWorkbenchMounted(manifest) failed:', err && err.message);
  }
  // 删除 profile node_modules 里的插件包(可能是真实目录或 link)。
  const locations = [
    path.join(profileDir, 'node_modules', '@deepseek-ai', 'dsh-client-ui-dshwork'),
    path.join(dshHome(), 'profiles', 'node_modules', '@deepseek-ai', 'dsh-client-ui-dshwork')
  ];
  for (const loc of locations) {
    try {
      if (fs.existsSync(loc)) {
        fs.rmSync(loc, { recursive: true, force: true });
        changed = true;
      }
    } catch (err) {
      log('[profile-mount] removeWorkbenchMounted(unlink) failed:', err && err.message);
    }
  }
  return changed;
}

/**
 * 判断是否已挂载:bundles 声明 + 已安装,缺一不可。
 * 返回 { mounted, bundle, installed }。
 */
function mountState(profileDir) {
  let profilePkg = null;
  const pkgPath = path.join(profileDir, 'package.json');
  try {
    profilePkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (_) {
    profilePkg = null;
  }
  return {
    mounted: !!profilePkg && bundlesInclude(profilePkg) && pluginInstalled(profileDir),
    bundle: !!profilePkg && bundlesInclude(profilePkg),
    installed: pluginInstalled(profileDir),
    profileExists: !!profilePkg,
    pkgPath
  };
}

/**
 * 初始化(若缺失)一个 profile:manifest(base bundles)+ 空 patch 层 + pnpm 设置。
 * 镜像 harness `dsh-app-boot` 的 initProfile,让「全新机器」也能在启动前就带上工作台。
 * @param {string} profileDir - profile 目录。
 * @param {string} profileName - profile 名(决定默认 base bundles)。
 * @returns {boolean} 是否新建了 profile。
 */
function createProfile(profileDir, profileName) {
  const pkgPath = path.join(profileDir, 'package.json');
  if (fs.existsSync(pkgPath)) return false;
  const bundles = profileName === 'web' ? ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app'] : ['@deepseek-ai/dsh-base'];
  try {
    fs.mkdirSync(profileDir, { recursive: true });
    const manifest = { name: `dsh-profile-${profileName}`, private: true, dependencies: {}, dsh: { profile: { bundles } } };
    fs.writeFileSync(pkgPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    const patchPath = path.join(profileDir, 'cordis.patch.yml');
    if (!fs.existsSync(patchPath)) fs.writeFileSync(patchPath, '# Your patch layer...\n[]\n', 'utf8');
    const wsPath = path.join(profileDir, 'pnpm-workspace.yaml');
    if (!fs.existsSync(wsPath)) fs.writeFileSync(wsPath, 'packages:\n  - .\n\nnodeLinker: hoisted\nautoInstallPeers: false\n', 'utf8');
    log('[profile-mount] created profile at', profileDir);
    return true;
  } catch (err) {
    log('[profile-mount] createProfile failed:', err && err.message);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

/**
 * 确保工作台插件已挂载到目标 profile。
 * @param {object} [options]
 * @param {string} [options.node]       解析出的 node 可执行路径;缺省用系统 node。
 * @param {string} [options.profileName] 目标 profile 名(默认 web)。
 * @param {string} [options.pluginDir]  插件包目录(缺省自动解析)。
 * @param {string} [options.dshBin]     dsh CLI 的 bin.js 路径(缺省自动解析)。
 * @param {boolean} [options.noInstall] 只干跑,不真正执行 dsh plugin add(测试用)。
 * @returns {Promise<{ok: boolean, mounted: boolean, reason?: string, profileDir: string}>}
 */
async function ensureWorkbenchMounted(options = {}) {
  if (process.env.DSHWORK_AUTO_MOUNT === '0') {
    log('[profile-mount] auto-mount disabled (DSHWORK_AUTO_MOUNT=0)');
    return { ok: false, mounted: false, reason: 'disabled', profileDir: undefined };
  }

  const profileName = options.profileName || defaultProfileName();
  const profileDir = profileDirFor(profileName);
  const pluginDir = options.pluginDir || resolvePluginDir();
  const logPrefix = `[profile-mount] ${profileName}`;

  const state = mountState(profileDir);
  if (state.mounted) {
    log(logPrefix, 'workbench already mounted');
    return { ok: true, mounted: true, profileDir };
  }

  if (!pluginDir) {
    log(logPrefix, 'workbench plugin dir not found; skipping mount (bare harness)');
    return { ok: false, mounted: false, reason: 'no-plugin-dir', profileDir };
  }
  if (!fs.existsSync(path.join(pluginDir, 'package.json'))) {
    log(logPrefix, 'plugin dir has no package.json; skipping:', pluginDir);
    return { ok: false, mounted: false, reason: 'no-plugin-package', profileDir };
  }

  if (options.noInstall) {
    log(logPrefix, 'dry-run: would copy-install plugin into', profileDir);
    return { ok: false, mounted: false, reason: 'dry-run', profileDir };
  }

  // 确保 profile 存在(镜像 harness 的 initProfile:base bundles + patch + pnpm-workspace)。
  // 不依赖 pnpm / 不依赖 dsh plugin add,也就不受「路径带空格」影响。
  createProfile(profileDir, profileName);

  // 把插件包直接复制进 profile 的 node_modules,并加进 bundles(无需 pnpm / shell)。
  const installed = installByCopy(profileDir, pluginDir);
  const bundled = addBundleToProfile(profileDir, pluginDir);
  const after = mountState(profileDir);
  if (installed && bundled && after.mounted) {
    log(logPrefix, 'workbench mounted OK (copy install)');
    return { ok: true, mounted: true, profileDir };
  }
  log(logPrefix, 'copy install incomplete; installed=%s bundled=%s mounted=%s', String(installed), String(bundled), String(after.mounted));
  return { ok: false, mounted: false, reason: 'copy-incomplete', profileDir };
}

/** 系统 node(on PATH),作为兜底 node。 */
function findSystemNode() {
  const name = process.platform === 'win32' ? 'node.exe' : 'node';
  const entries = (process.env.PATH || '').split(path.delimiter);
  for (const p of entries) {
    if (!p) continue;
    const exe = path.join(p, name);
    if (fs.existsSync(exe)) return exe;
  }
  return null;
}

module.exports = {
  PLUGIN_NAME,
  dshHome,
  defaultProfileName,
  profileDirFor,
  resolveDshBin,
  resolvePluginDir,
  toForwardSlashes,
  mountState,
  createProfile,
  installByCopy,
  addBundleToProfile,
  removeWorkbenchMounted,
  ensureWorkbenchMounted,
  findSystemNode
};
