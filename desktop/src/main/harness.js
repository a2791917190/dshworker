'use strict';

/**
 * DeepSeek Harness 启动器(版本策略版)
 *
 * 版本策略(与产品一致):
 *   - 默认使用「内置固定版本」(bundled)。内置的 Harness 随包分发,开箱即用、不依赖联网。
 *   - 启动时向 npm registry 检测 Harness 是否发布更新。
 *       · 无更新            → 仍用内置固定版本。
 *       · 有更新            → 弹窗询问用户是否更新:
 *           - 不更新     → 用内置固定版本。
 *           - 更新       → 改用 npx 拉取最新版(或随包安装的新版)启动。
 *   - 任何联网/检测失败都优雅降级为「内置固定版本」,保证离线可用。
 *
 * 设计要点:
 *   - 本模块不 require('electron'),可在纯 Node 环境做单元测试。
 *   - 「内置固定版本」的查找策略见 findBundledHarness():支持
 *       `DSHWORK_HARNESS_DIR` 环境变量、打包后的 resources/vendor/dsh、以及
 *       本项目的 node_modules/@deepseek-ai/dsh。找不到时退回 npx(开发态兜底)。
 *   - 所有远程调用带超时与错误兜底,不阻塞窗口打开。
 */

const { spawn } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { ensureNodeRuntime, findSystemNode } = require('./node-runtime');
const { ensureWorkbenchMounted, resolveDshBin } = require('./profile-mount');
const { ensureDedicatedHome } = require('./dsh-home');
const { log } = require('./log');

const HARNESS_URL = process.env.DSHWORK_HARNESS_URL || 'http://127.0.0.1:3080';
const HARNESS_NPM_PKG = '@deepseek-ai/dsh';
// 内置固定版本:可通过环境变量覆盖(便于测试与本地调试)。
// 打包时如内置了其它版本,请同步更新 config/harness.json 与本值。
const BUNDLED_HARNESS_VERSION =
  process.env.DSHWORK_HARNESS_VERSION || require('../../config/harness.json').bundledVersion;

// harness 网页有 auth fence:`dsh web` 启动时会打印带 `?token=` 的 URL,
// 客户端必须带该 token 打开网页,否则被拦("dsh web authentication required")。
// 捕获 harness stdout 提取 token,打开窗口时带上。
let harnessOutput = '';
let harnessToken = null;

/** 从 harness 输出里提取 token(形如 ?token=<base64url>)。 */
function extractToken(output) {
  const m = /[?&]token=([A-Za-z0-9_\-\.]+)/.exec(String(output || ''));
  return m ? m[1] : null;
}

/** 带 token 的 harness URL(若有);没有则原样返回。 */
function getHarnessUrl() {
  if (!harnessToken) return HARNESS_URL;
  return `${HARNESS_URL}${HARNESS_URL.includes('?') ? '&' : '?'}token=${encodeURIComponent(harnessToken)}`;
}

/** 当前 harness token(测试/调试用)。 */
function getHarnessToken() {
  return harnessToken;
}

// ---------------------------------------------------------------------------
// 远程版本检查
// ---------------------------------------------------------------------------

/**
 * 向 npm registry 查询 @deepseek-ai/dsh 的最新版本号。
 * 任何错误/超时都返回 null(视为「无网络/无更新」),绝不抛出。
 */
function getLatestVersion(timeoutMs = 6000) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const req = https.get(
      `https://registry.npmjs.org/${HARNESS_NPM_PKG}/latest`,
      {
        headers: { Accept: 'application/json', 'User-Agent': 'dshwork' }
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return done(null);
        }
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            done(json && json.version ? String(json.version) : null);
          } catch (_) {
            done(null);
          }
        });
      }
    );
    req.on('error', () => done(null));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      done(null);
    });
  });
}

// ---------------------------------------------------------------------------
// 版本比较(轻量 semver,含 prerelease)
// ---------------------------------------------------------------------------

function parseVersion(v) {
  const s = String(v || '').trim().replace(/^v/, '');
  const idx = s.indexOf('-');
  const core = idx === -1 ? s : s.slice(0, idx);
  const pre = idx === -1 ? '' : s.slice(idx + 1);
  const nums = core.split('.').map((n) => parseInt(n, 10) || 0);
  return { nums, pre };
}

function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const len = Math.max(pa.nums.length, pb.nums.length);
  for (let i = 0; i < len; i++) {
    const na = pa.nums[i] || 0;
    const nb = pb.nums[i] || 0;
    if (na !== nb) return na > nb ? 1 : -1;
  }
  // 正式版高于同核的 prerelease
  const paPre = !!pa.pre;
  const pbPre = !!pb.pre;
  if (paPre !== pbPre) return paPre ? -1 : 1;
  if (pa.pre === pb.pre) return 0;
  return pa.pre > pb.pre ? 1 : -1;
}

/**
 * 是否提示「可更新」。只把**正式版**(无 -rc/-alpha/-beta 等 pre-release 后缀)视为可更新;
 * pre-release 一律不作为更新提示——避免用户拉到不稳定的最新 rc 导致 harness 启动失败
 * (内置版本本身就是预发布,默认用内置即可,足够稳定)。
 */
function isNewerVersion(latest, base) {
  if (!latest || !base) return false;
  if (String(latest).includes('-')) return false; // rc/alpha/beta … 不提示更新
  return compareVersions(latest, base) > 0;
}

// ---------------------------------------------------------------------------
// 内置固定版本查找
// ---------------------------------------------------------------------------

/**
 * 在一组候选目录里找内置的 @deepseek-ai/dsh。
 * 返回 { dir, version, binPath } 或 null。
 */
function findBundledHarness() {
  const candidates = [];
  if (process.env.DSHWORK_HARNESS_DIR) candidates.push(process.env.DSHWORK_HARNESS_DIR);
  // 打包后的 Electron:resources/vendor/dsh(需在 electron-builder extraResources 里放置)
  if (process.resourcesPath) {
    candidates.push(path.join(process.resourcesPath, 'vendor', 'dsh'));
    // 也可用 npm 装出的自包含布局:<resources>/vendor/harness/node_modules/@deepseek-ai/dsh
    candidates.push(path.join(process.resourcesPath, 'vendor', 'harness', 'node_modules', HARNESS_NPM_PKG));
  }
  // 开发态:项目内的 vendor 或本地依赖
  candidates.push(path.join(__dirname, '..', '..', 'vendor', 'dsh'));
  candidates.push(path.join(__dirname, '..', '..', 'node_modules', HARNESS_NPM_PKG));

  for (const dir of candidates) {
    try {
      const pkgJson = path.join(dir, 'package.json');
      if (!fs.existsSync(pkgJson)) continue;
      const meta = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
      if (!meta || meta.name !== HARNESS_NPM_PKG) continue;
      const binPath = resolveBinPath(dir, meta.bin);
      return { dir, version: meta.version || null, binPath };
    } catch (_) {
      // 目录不可读或解析失败 → 跳过,继续候选
    }
  }
  return null;
}

/** 从 package.json 的 bin 字段解析出脚本入口路径。 */
function resolveBinPath(dir, bin) {
  if (!bin) return path.join(dir, 'lib', 'bin.js');
  let rel = typeof bin === 'string' ? bin : bin.dsh;
  if (!rel) return path.join(dir, 'lib', 'bin.js');
  return path.join(dir, rel);
}

// ---------------------------------------------------------------------------
// 版本决策(可注入 prompt / 版本源,便于测试)
// ---------------------------------------------------------------------------

/**
 * 解析本次应使用的 Harness 版本模式。
 * 返回 { mode: 'bundled'|'npx', bundledVersion, latestVersion, hasUpdate, updated }
 *
 * @param {object} options
 * @param {function} [options.prompt]  异步 ({ bundledVersion, latestVersion }) => boolean
 *                                     返回 true 表示用户选择「更新」。
 * @param {function} [options.fetchLatest] 返回 Promise<version|null>,默认走 npm registry。
 */
async function resolveHarnessVersion(options = {}) {
  const fetchLatest = options.fetchLatest || getLatestVersion;
  const bundledVersion = options.bundledVersion || BUNDLED_HARNESS_VERSION;

  let latestVersion = null;
  try {
    latestVersion = await fetchLatest(options.timeoutMs);
  } catch (_) {
    latestVersion = null;
  }

  const hasUpdate = isNewerVersion(latestVersion, bundledVersion);
  if (!hasUpdate) {
    return { mode: 'bundled', bundledVersion, latestVersion, hasUpdate: false, updated: false };
  }

  let updated = false;
  if (typeof options.prompt === 'function') {
    try {
      updated = !!(await options.prompt({ bundledVersion, latestVersion }));
    } catch (_) {
      updated = false;
    }
  }
  return { mode: updated ? 'npx' : 'bundled', bundledVersion, latestVersion, hasUpdate: true, updated };
}

// ---------------------------------------------------------------------------
// 拉起 Harness
// ---------------------------------------------------------------------------

/**
 * 查找用户「已安装的 harness」:全局 npm 里装的 @deepseek-ai/dsh 的 bin。
 * 有用户自有 harness 时优先用它(及其 ~/.dsh profile),而不是内置保底。
 */
function findInstalledDsh() {
  const candidates = [];
  // Windows 全局 npm node_modules
  if (process.env.APPDATA) candidates.push(path.join(process.env.APPDATA, 'npm', 'node_modules', HARNESS_NPM_PKG, 'lib', 'bin.js'));
  if (process.env.LOCALAPPDATA) candidates.push(path.join(process.env.LOCALAPPDATA, 'npm', 'node_modules', HARNESS_NPM_PKG, 'lib', 'bin.js'));
  // POSIX 全局 prefix / nvm
  if (process.env.PREFIX) candidates.push(path.join(process.env.PREFIX, 'lib', 'node_modules', HARNESS_NPM_PKG, 'lib', 'bin.js'));
  for (const p of [process.env.NVM_SYMLINK, process.env.NVM_BIN]) {
    if (p) candidates.push(path.join(path.dirname(p), 'lib', 'node_modules', HARNESS_NPM_PKG, 'lib', 'bin.js'));
  }
  candidates.push(path.join('/usr/local/lib/node_modules', HARNESS_NPM_PKG, 'lib', 'bin.js'));
  candidates.push(path.join(os.homedir(), '.npm-global', 'lib', 'node_modules', HARNESS_NPM_PKG, 'lib', 'bin.js'));
  // 扫描 PATH 上的 dsh/dsh.cmd:定位它实际指向的 @deepseek-ai/dsh 安装
  // (覆盖「dsh 在 PATH 上、但不在标准全局目录」的情况,如本机手动装的、或 nvm 非默认目录)。
  const shimName = process.platform === 'win32' ? 'dsh.cmd' : 'dsh';
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    try {
      const shim = path.join(dir, shimName);
      if (fs.existsSync(shim)) {
        candidates.push(path.join(dir, 'node_modules', HARNESS_NPM_PKG, 'lib', 'bin.js'));
      }
    } catch (_) {
      // 跳过不可读 PATH 段
    }
  }
  for (const c of candidates) {
    try {
      if (c && fs.existsSync(c)) return c;
    } catch (_) {
      // 跳过不可读候选
    }
  }
  return null;
}

/**
 * 启动 Harness。优先级(用户优先、内置保底):
 *   1) 已有实例在 HARNESS_URL 上运行 → 直接复用;
 *   2) 用户已安装的 harness(全局 @deepseek-ai/dsh)→ 用它的 bin 拉起(用用户 ~/.dsh);
 *   3) 都没有 → 用内置保底 harness,并切到私有 DSH_HOME,避免与全局 harness 的
 *      Junction/profile 冲突、也避免 EPERM 崩溃;
 *   4) mode 'npx' → 用户明确要求更新,用 npx 拉最新版。
 * @param {string} [mode] 'bundled'(默认)| 'npx'
 */
async function bootHarness(mode = 'bundled', options = {}) {
  if (await isUp(HARNESS_URL)) return true;

  // 解析出可用的 node 运行时(内置/缓存/系统/自动下载),没有则无法拉起 Harness。
  const runtime = await ensureNodeRuntime({ onProgress: options.onNodeProgress });
  if (!runtime) {
    log('[harness] no node runtime available; cannot launch harness');
    return false;
  }

  const bundled = findBundledHarness();
  const userDsh = mode === 'npx' ? null : findInstalledDsh();

  // 决定本次拉起的 home / dsh bin。私有 home 仅在「内置保底」分支启用。
  let dshBin = null;
  if (mode === 'npx') {
    log('[harness] mode=npx: using npx latest');
    dshBin = resolveDshBin() || null;
  } else if (userDsh) {
    log('[harness] using user-installed harness:', userDsh);
    dshBin = userDsh;
  } else if (bundled) {
    const prep = ensureDedicatedHome(process.env.DSHWORK_PRIVATE_HOME_BASE);
    log('[harness] bundled fallback; private DSH_HOME=', prep.home, 'isolated=', prep.isolated);
    dshBin = bundled.binPath;
  } else {
    dshBin = resolveDshBin() || null;
  }

  // 在「确定 home 之后」挂载工作台插件(私有 home 时 ensureDedicatedHome 已改 DSH_HOME)。
  const mount = await ensureWorkbenchMounted({
    node: runtime.node,
    dshBin: dshBin || undefined
  });
  log('[profile-mount] result:', mount ? (mount.ok ? 'mounted' : `not-mounted:${mount.reason}`) : 'skipped');

  // 捕获 harness 输出,用于提取其网页 auth token(dsh web 打印的 ?token=)。
  // 限制缓存大小,避免 run 久了输出无限膨胀。
  const onOutput = (d) => {
    if (harnessOutput.length < 100000) harnessOutput += d;
  };
  let spawned = false;
  if (mode === 'npx') {
    spawned = await spawnNpxHarness(runtime, null, onOutput); // 更新场景:拉取最新版
  } else if (userDsh) {
    // 用户已有 harness:必须用「用户系统 node」跑,而不是内置 node v20
    // (其全局 dsh 的原生模块是从系统 node 装的,ABI 不同会导致崩溃)。
    const userNode = findSystemNode() || runtime.node;
    log('[harness] user harness will use node:', userNode, '(', userNode === runtime.node ? 'bundled(提醒:可能 ABI 不匹配)' : 'system', ')');
    spawned = await spawnInstalledHarness({ node: userNode, npx: runtime.npx }, userDsh, onOutput);
  } else if (bundled) {
    spawned = await spawnBundledHarness(runtime, bundled, onOutput); // 内置保底
  } else {
    // 开发态没有内置时,用 npx 按内置版本号取固定版本
    spawned = await spawnNpxHarness(runtime, BUNDLED_HARNESS_VERSION, onOutput);
  }

  if (!spawned) {
    log('[harness] failed to spawn harness process');
  }
  // npx 首次安装/下载较慢,放宽到 90s;内置/用户 harness 较快(45s 足够)。
  const waitMs = mode === 'npx' ? 90000 : 45000;
  log('[harness] waiting for harness at', HARNESS_URL, `(${waitMs}ms)`);
  let up = await waitForUp(HARNESS_URL, waitMs);
  log('[harness] harness up?', up);

  // 双保险:「更新(npx)」失败了,自动回退到内置稳定版,而不是让用户看到骨架/黑屏。
  if (!up && mode === 'npx' && bundled) {
    log('[harness] npx update failed; falling back to bundled harness');
    const prep = ensureDedicatedHome(process.env.DSHWORK_PRIVATE_HOME_BASE);
    log('[harness] bundled fallback; private DSH_HOME=', prep.home);
    await ensureWorkbenchMounted({ node: runtime.node, dshBin: bundled.binPath });
    spawned = await spawnBundledHarness(runtime, bundled, onOutput);
    // 清理 npx 可能留下的 3080 占用(若有)
    up = await waitForUp(HARNESS_URL, 45000);
    log('[harness] bundled fallback up?', up);
  }

  // 从 harness 输出提取 auth token,窗口打开网页时带上(否则被 auth fence 拦截)。
  harnessToken = extractToken(harnessOutput);
  if (harnessToken) log('[harness] captured harness auth token (len=' + harnessToken.length + ')');
  return up;
}

/** 用用户已安装的 harness(全局 @deepseek-ai/dsh)的 bin 拉起。 */
function spawnInstalledHarness(runtime, userDsh, onOutput) {
  log('[harness] spawn user harness:', runtime.node, userDsh);
  return spawnProcess(runtime.node, [userDsh, 'web'], { shell: false, onOutput });
}

/** 用内置的 harness(通过解析出的 node 运行其 bin 入口)。 */
function spawnBundledHarness(runtime, bundled, onOutput) {
  log('[harness] spawn bundled harness:', runtime.node, bundled.binPath);
  return spawnProcess(runtime.node, [bundled.binPath, 'web'], { shell: false, onOutput });
}

/** 用解析出的 node 自带的 npx 拉起 harness。可传固定版本标签,不传则取最新版。 */
function spawnNpxHarness(runtime, pinnedVersion, onOutput) {
  const pkg = pinnedVersion ? `${HARNESS_NPM_PKG}@${pinnedVersion}` : HARNESS_NPM_PKG;
  const exe = runtime.npx;
  // Windows 上 npx 是 .cmd,需 shell 解析;POSIX 的 npx 是可执行脚本,直接 spawn。
  const shell = process.platform === 'win32' && exe.endsWith('.cmd');
  const args = [];
  // 非交互安装:npx 默认会在首次安装时询问 "Ok to proceed? (y)" 而卡住。
  args.push('--yes');
  // 允许用环境变量指定 npm 镜像(如 npmmirror),绕过 registry.npmjs.org 阻断。
  const registry = process.env.DSHWORK_NPM_REGISTRY;
  if (registry) args.push('--registry', registry);
  args.push(pkg, 'web');
  log('[harness] spawn npx:', exe, args.join(' '));
  return spawnProcess(exe, args, { shell, onOutput });
}

/** 通用 spawn 包装:拉起后 unref,脱离于 Electron 生命周期;失败返回 false。
 *  `onOutput` 可选:捕获子进程 stdout(用于提取 harness 的 auth token)。 */
function spawnProcess(exe, args, { shell = false, onOutput } = {}) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(exe, args, { stdio: ['ignore', onOutput ? 'pipe' : 'ignore', 'ignore'], detached: true, shell });
    } catch (err) {
      log('[harness] spawn threw:', err && err.message);
      return resolve(false);
    }
    if (onOutput && child.stdout) {
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (d) => onOutput(String(d)));
    }
    child.on('error', (err) => {
      log('[harness] spawn error:', err.message);
      resolve(false);
    });
    child.on('spawn', () => {
      child.unref();
      resolve(true);
    });
    child.on('exit', (code) => log('[harness] harness process exited early:', code));
  });
}

function isUp(url) {
  return new Promise((resolve) => {
    const req = httpGet(url, (statusCode) => resolve(statusCode < 500));
    req.on('error', () => resolve(false));
  });
}

function httpGet(url, onStatus) {
  const { get } = /^https:/.test(url) ? { get: https.get } : { get: require('http').get };
  const req = get(url, (res) => {
    res.resume();
    onStatus(res.statusCode);
  });
  req.setTimeout(2000, () => {
    req.destroy();
    onStatus(0);
  });
  return req;
}

function waitForUp(url, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve) => {
    const tick = async () => {
      if (await isUp(url)) return resolve(true);
      if (Date.now() - started > timeoutMs) return resolve(false);
      setTimeout(tick, 500);
    };
    tick();
  });
}

module.exports = {
  HARNESS_URL,
  HARNESS_NPM_PKG,
  BUNDLED_HARNESS_VERSION,
  getLatestVersion,
  findBundledHarness,
  resolveHarnessVersion,
  bootHarness,
  findInstalledDsh,
  getHarnessUrl,
  getHarnessToken,
  extractToken,
  compareVersions,
  isNewerVersion,
  isUp,
  waitForUp
};
