'use strict';

/**
 * DSHwork —— 把「node 运行时 + DeepSeek Harness」vendor 进客户端,做成完全离线自包含包。
 *
 * 目的:让 DSHwork 在「朋友电脑没装 node、没装 harness、甚至没网」的情况下也能拉起 Harness。
 * 产物布局(写入 win-unpacked/resources):
 *   resources/node/                        <- node 运行时(扁平化,node.exe 直接在这)
 *   resources/vendor/harness/node_modules/ -< @deepseek-ai/dsh 及其依赖树(自包含)
 *
 * 之后 `src/main/node-runtime.js` 会优先用内置 node;`harness.js` 的 findBundledHarness
 * 会优先用 resources/vendor/harness/node_modules/@deepseek-ai/dsh,全程离线。
 *
 * ⚠️ 需要在「有 node + npm + 网络」的机器上运行(沙箱/无网机器跑不了)。
 *
 * 用法(在项目根 dshwork/ 下):
 *   node plugins/vendor-runtime.cjs                        # 目标默认 build 产物
 *   node plugins/vendor-runtime.cjs --node-mirror https://npmmirror.com/mirrors/node
 *   node plugins/vendor-runtime.cjs --npm-registry https://registry.npmmirror.com
 *   node plugins/vendor-runtime.cjs --resources <dir>      # 指定 resources 目录
 *   node plugins/vendor-runtime.cjs --skip-harness         # 只 vendor node
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const DESKTOP = path.join(__dirname, '..', 'desktop');
const HARNESS_PKG = '@deepseek-ai/dsh';

function configHarness() {
  try {
    return JSON.parse(fs.readFileSync(path.join(DESKTOP, 'config', 'harness.json'), 'utf8'));
  } catch (_) {
    return {};
  }
}

function parseArgs(argv) {
  const o = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--resources') o.resources = argv[++i];
    else if (a === '--node-version') o.nodeVersion = argv[++i];
    else if (a === '--harness-version') o.harnessVersion = argv[++i];
    else if (a === '--node-mirror') o.nodeMirror = argv[++i];
    else if (a === '--npm-registry') o.npmRegistry = argv[++i];
    else if (a === '--skip-node') o.skipNode = true;
    else if (a === '--skip-harness') o.skipHarness = true;
    else if (a === '--no-zip') o.noZip = true;
    else if (a === '--help') o.help = true;
  }
  return o;
}

// ── 下载(复用 node-runtime 的逻辑思路,但内联避免耦合) ──
function download(url, dest, timeoutMs = 180000) {
  return new Promise((resolve, reject) => {
    const https = require('https');
    const req = https.get(url, { headers: { 'User-Agent': 'dshwork' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        download(res.headers.location, dest, timeoutMs).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const out = fs.createWriteStream(dest);
      res.pipe(out);
      res.on('error', reject);
      out.on('error', reject);
      out.on('finish', () => out.close(() => resolve()));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('download timeout'));
    });
  });
}

function extractArchive(archive, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const run = (cmd, args) =>
    new Promise((resolve, reject) => {
      const child = require('child_process').spawn(cmd, args, { stdio: 'inherit' });
      child.on('error', reject);
      child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
    });
  if (process.platform === 'win32') {
    return run('tar.exe', ['-xf', archive, '-C', dest]).catch(() =>
      run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
        `Expand-Archive -LiteralPath '${archive}' -DestinationPath '${dest}' -Force`])
    );
  }
  return run('tar', ['-xf', archive, '-C', dest]);
}

function nodeDistBase(args) {
  return args.nodeMirror || process.env.DSHWORK_NODE_DIST_MIRROR || 'https://nodejs.org/dist';
}

/** 在 root 下递归找“存在 <rel> 这个相对路径”的目录(即 node home),找不到返回 null。 */
function findDirContaining(root, rel) {
  const stack = [root];
  while (stack.length) {
    const d = stack.pop();
    if (fs.existsSync(path.join(d, rel))) return d;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) stack.push(path.join(d, e.name));
    }
  }
  return null;
}

function nodeArchiveName(version) {
  const v = `node-v${version}`;
  if (process.platform === 'win32') return `${v}-win-${process.arch}.zip`;
  if (process.platform === 'darwin') return `${v}-darwin-${process.arch}.tar.gz`;
  return `${v}-linux-${process.arch}.tar.gz`;
}

async function vendorNode(args, resources) {
  const version = args.nodeVersion || configHarness().nodeVersion || '20.19.0';
  const target = path.join(resources, 'node');
  const exeName = process.platform === 'win32' ? 'node.exe' : path.join('bin', 'node');
  if (fs.existsSync(path.join(target, exeName))) {
    console.log(`  ✓ node 已就绪(node/v${version}) — 跳过`);
    return;
  }
  console.log(`  • 下载 node v${version}...`);
  const name = nodeArchiveName(version);
  const url = `${nodeDistBase(args)}/v${version}/${name}`;
  const archive = path.join(os.tmpdir(), name);
  await download(url, archive);
  console.log('  • 解压 node...');
  const staging = path.join(os.tmpdir(), `dshwork-node-${Date.now()}`);
  await extractArchive(archive, staging);

  // 不假设压缩包内的目录名:递归找到“含 node 可执行文件”的根目录(node home)。
  // 之后把该根目录的【内容】平铺进 target,使 target/<exeName> 直接可见。
  const exeRel = process.platform === 'win32' ? 'node.exe' : path.join('bin', 'node');
  const root = findDirContaining(staging, exeRel);
  if (!root) throw new Error(`node 解压异常:未找到 ${exeRel}`);

  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(root)) {
    fs.cpSync(path.join(root, entry), path.join(target, entry), { recursive: true });
  }
  if (!fs.existsSync(path.join(target, exeName))) throw new Error(`node 解压异常:未找到 ${exeName}`);
  console.log(`  ✓ node 已写入 ${target}`);
}

function vendorHarness(args, resources) {
  const version = args.harnessVersion || configHarness().bundledVersion || '0.1.1-rc.2';
  const prefix = path.join(resources, 'vendor', 'harness');
  const nm = path.join(prefix, 'node_modules');
  const dshPkg = path.join(nm, HARNESS_PKG, 'package.json');
  fs.mkdirSync(prefix, { recursive: true });

  const registry = args.npmRegistry || process.env.DSHWORK_NPM_REGISTRY;

  // 共享 UI 库:官方 pnpm-workspace 会 hoist,独立 npm install 不会装,必须显式补。
  const shared = [
    `@deepseek-ai/dsh-web-app@${version}`,
    `@deepseek-ai/dsh-client-ui-primitives@${version}`,
    `@deepseek-ai/dsh-client-ui-slots@${version}`
  ];
  // react-dom 需匹配已装的 react 版本(若还没有 react 就先装 react)。
  const reactV = readInstalledReact(nm) || '18.3.1';
  shared.push(`react@${reactV}`, `react-dom@${reactV}`);
  const targets = [`${HARNESS_PKG}@${version}`, ...shared];

  // 关键:Harness 官方用 pnpm-workspace;独立 npm 装出的依赖树与客户端模块系统不兼容,
  // 会导致 cordis-client-runner 等 client bundle 加载失败。优先用 pnpm + hoisted(自包含)。
  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  const usePnpm = hasCmd(pnpm);
  const pkgMgr = usePnpm ? pnpm : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
  console.log(`  • 用 ${usePnpm ? 'pnpm' : 'npm'} install harness + web 共享依赖(${version})...`);

  let argsList;
  if (usePnpm) {
    // 用 pnpm 需要干净的树:先清掉旧 node_modules,再 hoisted 安装(自包含、无 symlink)。
    if (fs.existsSync(nm)) fs.rmSync(nm, { recursive: true, force: true });
    fs.mkdirSync(nm, { recursive: true });
    fs.writeFileSync(path.join(prefix, 'package.json'), JSON.stringify({ name: 'dshwork-vendor-harness', private: true }, null, 2));
    argsList = ['install', '--dir', prefix, '--node-linker=hoisted'];
    if (registry) argsList.push('--registry=' + registry);
    argsList.push(...targets);
  } else {
    argsList = ['install', '--prefix', prefix, ...targets];
    if (registry) argsList.push('--registry=' + registry);
  }

  const r = spawnSync(pkgMgr, argsList, {
    cwd: process.cwd(),
    stdio: 'inherit',
    // Windows 上 .cmd(.npm/pnpm)都需要 shell:true,否则 EINVAL
    shell: process.platform === 'win32'
  });

  if (r.error) {
    throw new Error(`${usePnpm ? 'pnpm' : 'npm'} install spawn 失败: ${r.error.code || r.error.message}\n  请确认包管理器可用,可用 \`${pkgMgr} -v\` 验证。`);
  }
  if (r.status !== 0) {
    throw new Error(`${usePnpm ? 'pnpm' : 'npm'} install 失败(exit ${r.status})。请确认网络/registry,或用 --npm-registry 指定镜像。`);
  }

  // 校验关键依赖都到位(注意 pnpm hoisted 会把包放在顶层 node_modules)。
  for (const rp of [
    path.join(nm, HARNESS_PKG, 'package.json'),
    path.join(nm, '@deepseek-ai', 'dsh-client-ui-primitives', 'package.json'),
    path.join(nm, '@deepseek-ai', 'dsh-client-ui-slots', 'package.json'),
    path.join(nm, 'react-dom', 'package.json')
  ]) {
    if (!fs.existsSync(rp)) throw new Error(`harness 依赖未装到位:${rp}`);
  }
  if (!fs.existsSync(dshPkg)) throw new Error(`harness 未装到预期位置:${dshPkg}`);
  console.log(`  ✓ harness + 共享依赖已写入 ${prefix}`);
}

function hasCmd(cmd) {
  const r = spawnSync(cmd, ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' });
  return !r.error && r.status === 0;
}

function readInstalledReact(nm) {
  const p = path.join(nm, 'react', 'package.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')).version;
  } catch (_) {
    return null;
  }
}

function rezip(args, resources) {
  if (args.noZip) return;
  if (!resources.endsWith('win-unpacked')) {
    // 若 resources 是 win-unpacked/resources,则 zip win-unpacked
  }
  const winUnpacked = path.dirname(resources);
  const zip = path.join(DESKTOP, 'dist', `DSHwork-portable-0.1.0-${process.platform}-${process.arch}.zip`);
  console.log('  • 重新打包为', zip);
  // 用 bsdtar 打包:传「显式子项名」(而非 '.' 或 'dir\*'),避免条目带 './' 前缀,
  // 也避免 Compress-Archive 在 node_modules 里被占用文件上失败。node_modules 文件可能被
  // 杀软/索引偶发占用,故失败时重试几次。
  const names = fs.readdirSync(winUnpacked);
  let ok = false;
  let lastErr = 'unknown';
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    if (fs.existsSync(zip)) fs.rmSync(zip, { force: true });
    const ps = spawnSync('tar.exe', ['-a', '-c', '-f', zip, '-C', winUnpacked, ...names], { stdio: 'inherit' });
    if (ps.error || ps.status !== 0) {
      lastErr = ps.error ? ps.error.code : ps.status;
      console.log(`    zip 出问题,重试 ${attempt}/3...`);
      if (attempt < 3) {
        const sleep = spawnSync('powershell.exe', ['-NoProfile', '-Command', 'Start-Sleep -Seconds 3'], { stdio: 'ignore' });
      }
      continue;
    }
    ok = true;
  }
  if (!ok) throw new Error('重新打包 zip 失败: ' + lastErr);
  console.log('  ✓ zip 已生成:', zip);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log('vendor-runtime.cjs — 把 node + harness vendor 进客户端(离线自包含)');
    console.log('  --resources <dir>       resources 目录(默认 <desktop>/dist/win-unpacked/resources)');
    console.log('  --node-version <v>      内置 node 版本(默认取 config/harness.json)');
    console.log('  --harness-version <v>   内置 harness 版本(默认取 config/harness.json)');
    console.log('  --node-mirror <url>     node 分发镜像,如 https://npmmirror.com/mirrors/node');
    console.log('  --npm-registry <url>    npm 镜像,如 https://registry.npmmirror.com');
    console.log('  --skip-node/--skip-harness  只做其中一个');
    console.log('  --no-zip                vendor 后不重新压缩');
    return;
  }

  const resources = args.resources || path.join(DESKTOP, 'dist', 'win-unpacked', 'resources');
  console.log('resources 目标:', resources);

  if (!args.skipNode) await vendorNode(args, resources);
  if (!args.skipHarness) vendorHarness(args, resources);

  console.log('\n验证:');
  const nodeExe = process.platform === 'win32' ? 'node.exe' : path.join('bin', 'node');
  console.log('  node  :', fs.existsSync(path.join(resources, 'node', nodeExe)) ? 'ok' : 'MISSING');
  console.log('  harness:', fs.existsSync(path.join(resources, 'vendor', 'harness', 'node_modules', HARNESS_PKG, 'package.json')) ? 'ok' : 'MISSING');

  rezip(args, resources);
  console.log('\n完成。请把新的 zip 拿到无 node / 无 harness 的机器上测试。');
}

main().catch((err) => {
  console.error('\nvendor-runtime failed:', err && err.message);
  process.exit(1);
});
