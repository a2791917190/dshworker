'use strict';

/**
 * Node 运行时供给器(给 DSHwork 桌面壳用)
 *
 * 目的:让 DSHwork 在「本机没有 Node」的情况下也能运行 DeepSeek Harness。
 * Harness 是 Node 程序,必须有一个 node 才能跑。本模块按优先级解析一个可用 node:
 *
 *   1) 内置 node     — 随包打进 <resources>/node(或 env DSHWORK_NODE_HOME)
 *   2) 已缓存 node   — 之前自动下载并缓存在 $DSH_HOME/runtimes/ 下
 *   3) 系统 node     — 用户机器已装的 node(on PATH)
 *   4) 自动下载 node — 都没有时,从 nodejs.org 下载一个官方便携版,解压并缓存
 *
 * 返回描述符: { node, npx, home, source } 或 null(全都得不到,Harness 拉不起)。
 *
 * 设计要点:
 *   - 本模块不 require('electron'),可在纯 Node 环境做单元测试。
 *   - 自动下载/解压依赖「联网 + 系统 tar / PowerShell Expand-Archive」;这两步
 *     只能在用户真机上验证(沙箱禁止创建子进程、限制网络)。
 *   - 下载带超时与 fallback,失败则返回 null,不阻塞窗口打开(降级为本地工作台)。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { spawn } = require('child_process');
const { log } = require('./log');

// 默认下载的 Node 版本(优先 env DSHWORK_NODE_VERSION,其次 config/harness.json 的 nodeVersion,最后兜底值)。选较稳的 LTS。
function configNodeVersion() {
  try {
    return require('../../config/harness.json').nodeVersion;
  } catch (_) {
    return null;
  }
}
const NODE_VERSION = process.env.DSHWORK_NODE_VERSION || configNodeVersion() || '20.19.0';
const PLATFORM = process.platform; // win32 | darwin | linux
const ARCH = process.arch; // x64 | arm64

// ---------------------------------------------------------------------------
// 路径 / 队列
// ---------------------------------------------------------------------------

function cacheRoot() {
  if (process.env.DSHWORK_NODE_CACHE) return process.env.DSHWORK_NODE_CACHE;
  const base = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
  return path.join(base, 'runtimes');
}

/** node 可执行文件名(win32 为 node.exe,其余为 bin/node)。 */
function nodeExeName() {
  return PLATFORM === 'win32' ? 'node.exe' : path.join('bin', 'node');
}

/** 从 node 可执行路径推出其「home」目录。 */
function homeOf(nodeExe) {
  if (PLATFORM === 'win32') return path.dirname(nodeExe);
  return path.dirname(path.dirname(nodeExe));
}

/** 从 node home 推出 npx/.cmd 或 bin/npx。 */
function npxOf(home) {
  return PLATFORM === 'win32'
    ? path.join(home, 'npx.cmd')
    : path.join(home, 'bin', 'npx');
}

/** 缓存目录里某个 node 版本的 node 可执行路径。 */
function cachedNodePath(version = NODE_VERSION) {
  return path.join(cacheRoot(), `node-v${version}`, nodeExeName());
}

// ---------------------------------------------------------------------------
// 各级解析
// ---------------------------------------------------------------------------

/** 内置 node(随包打包到 resources/node,或 env DSHWORK_NODE_HOME)。 */
function findBundledNode() {
  const candidates = [];
  if (process.env.DSHWORK_NODE_HOME) candidates.push(process.env.DSHWORK_NODE_HOME);
  if (process.resourcesPath) candidates.push(path.join(process.resourcesPath, 'node'));
  candidates.push(path.join(__dirname, '..', '..', 'runtime', 'node'));
  for (const dir of candidates) {
    const exe = path.join(dir, nodeExeName());
    if (fs.existsSync(exe)) return exe;
  }
  return null;
}

/** 已缓存的自动下载 node。 */
function findCachedNode() {
  const exe = cachedNodePath();
  return fs.existsSync(exe) ? exe : null;
}

/** 系统 node(on PATH)。 */
function findSystemNode() {
  const name = PLATFORM === 'win32' ? 'node.exe' : 'node';
  const pathEntries = (process.env.PATH || '').split(path.delimiter);
  for (const p of pathEntries) {
    if (!p) continue;
    const exe = path.join(p, name);
    if (fs.existsSync(exe)) return exe;
  }
  return null;
}

/** 逐级解析:内置 -> 缓存 -> 系统。都无则返回 null(交给 ensureNodeRuntime 下载)。 */
function resolveNodeRuntime() {
  const bundled = findBundledNode();
  if (bundled) return describe(bundled, 'bundled');
  const cached = findCachedNode();
  if (cached) return describe(cached, 'cached');
  const system = findSystemNode();
  if (system) return describe(system, 'system');
  return null;
}

function describe(nodeExe, source) {
  const home = homeOf(nodeExe);
  return { node: nodeExe, npx: npxOf(home), home, source };
}

// ---------------------------------------------------------------------------
// 下载 + 解压
// ---------------------------------------------------------------------------

/** node 分发镜像基址(可用 DSHWORK_NODE_DIST_MIRROR 覆盖,如 npmmirror)。 */
const DIST_MIRROR = process.env.DSHWORK_NODE_DIST_MIRROR || 'https://nodejs.org/dist';

/** node 官方便携版下载地址(win 为 zip,其余为 tar.gz)。 */
function nodeDownloadUrl(version = NODE_VERSION) {
  const v = `node-v${version}`;
  if (PLATFORM === 'win32') return `${DIST_MIRROR}/v${version}/${v}-win-${ARCH}.zip`;
  if (PLATFORM === 'darwin') return `${DIST_MIRROR}/v${version}/${v}-darwin-${ARCH}.tar.gz`;
  return `${DIST_MIRROR}/v${version}/${v}-linux-${ARCH}.tar.gz`;
}

function download(url, dest, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'dshwork' } }, (res) => {
      // 跟随重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        download(res.headers.location, dest, timeoutMs).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`download failed: HTTP ${res.statusCode} for ${url}`));
        return;
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

/**
 * 解压归档到 dest。Windows 优先系统 tar.exe(bsdtar 自动识别 zip/tgz),
 * 失败则回退 PowerShell Expand-Archive;POSIX 用系统 tar。
 * (这些系统工具在用户真机上存在;沙箱里无法验证。)
 */
function extractArchive(archive, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const run = (cmd, args) =>
    new Promise((resolve, reject) => {
      const child = spawn(cmd, args, { stdio: 'ignore' });
      child.on('error', reject);
      child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`))));
    });

  if (PLATFORM === 'win32') {
    return run('tar.exe', ['-xf', archive, '-C', dest])
      .catch(() =>
        run('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
          `Expand-Archive -LiteralPath '${archive}' -DestinationPath '${dest}' -Force`])
      );
  }
  return run('tar', ['-xf', archive, '-C', dest]);
}

/**
 * 确保有一个可用的 node 运行时;都不存在时自动下载并缓存。
 * 失败返回 null(不抛出,好让调用方降级)。
 * @param {object} [options]
 * @param {(msg: string)=>void} [options.onProgress] 进度回调。
 * @param {number} [options.downloadTimeoutMs]
 */
async function ensureNodeRuntime(options = {}) {
  const existing = resolveNodeRuntime();
  if (existing) {
    log('[node-runtime] using node runtime:', `source=${existing.source}`, `node=${existing.node}`);
    return existing;
  }

  const { onProgress, downloadTimeoutMs = 120000 } = options;
  const version = NODE_VERSION;
  const dest = path.join(cacheRoot(), `node-v${version}`);

  log('[node-runtime] no node found; downloading Node v' + version + ' from', nodeDownloadUrl(version));
  if (onProgress) onProgress(`首次启动,下载 Node v${version}…`);
  const archive = path.join(os.tmpdir(), `node-v${version}-${PLATFORM}-${ARCH}${PLATFORM === 'win32' ? '.zip' : '.tar.gz'}`);
  try {
    await download(nodeDownloadUrl(version), archive, downloadTimeoutMs);
  } catch (err) {
    log('[node-runtime] download failed:', err && err.message);
    return null;
  }
  log('[node-runtime] downloaded; extracting to', dest);
  if (onProgress) onProgress('解压 Node 运行时…');
  try {
    await extractArchive(archive, dest);
  } catch (err) {
    log('[node-runtime] extract failed:', err && err.message);
    return null;
  }
  const nodeExe = cachedNodePath(version);
  log('[node-runtime] node ready:', nodeExe);
  return fs.existsSync(nodeExe) ? describe(nodeExe, 'downloaded') : null;
}

module.exports = {
  NODE_VERSION,
  cacheRoot,
  nodeExeName,
  homeOf,
  npxOf,
  cachedNodePath,
  findBundledNode,
  findCachedNode,
  findSystemNode,
  resolveNodeRuntime,
  describe,
  ensureNodeRuntime,
  nodeDownloadUrl,
  download,
  extractArchive
};
