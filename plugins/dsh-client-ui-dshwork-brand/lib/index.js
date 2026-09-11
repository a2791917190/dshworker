/**
 * DSHwork brand plugin — host (node) half.
 *
 * 给客户端面板提供真实接口:
 *   GET  /dshwork/api/plugins                 → 当前 profile 的插件名单(读 dsh.profile.bundles)
 *   POST /dshwork/api/plugins {name,enabled}  → 真正把插件加进/移出名单(写 profile package.json)
 *   GET  /dshwork/api/market                  → 插件市场列表(从外部源拉取)
 *   POST /dshwork/api/market/install {name,version} → 从市场安装插件到 profile
 *
 * 市场「源」可配置(待定,先用 npm registry 关键词搜索兜底):
 *   DSHWORK_MARKET_URL    自定义市场索引 URL(返回数组或 {plugins:[...]} 或 npm search 形状)
 *   DSHWORK_MARKET_QUERY  npm 搜索词,默认 keywords:dsh-plugin
 *   DSHWORK_NPM_REGISTRY  npm registry,默认 https://registry.npmjs.org
 *
 * 说明:插件名单在 harness 启动时读取,所以改动「重启后生效」——这是真改文件,不是前端假开关。
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const PLUGINS_ROUTE = '/dshwork/api/plugins';
const MARKET_ROUTE = '/dshwork/api/market';
const MARKET_INSTALL_ROUTE = '/dshwork/api/market/install';

const PROFILE_NAME = process.env.DSHWORK_HARNESS_PROFILE || 'web';
const MARKET_URL = process.env.DSHWORK_MARKET_URL || '';
const MARKET_QUERY = process.env.DSHWORK_MARKET_QUERY || 'keywords:dsh-plugin';
const NPM_REGISTRY = (process.env.DSHWORK_NPM_REGISTRY || 'https://registry.npmjs.org').replace(/\/+$/, '');

/**
 * 锁定名单:
 *  - `@dshwork/*`(本插件自身,DSHwork 客户端启动时会重新挂载,关掉也会被加回来);
 *  - `@deepseek-ai/dsh-base` / `@deepseek-ai/dsh-web-app`(harness 必需,关掉会起不来);
 *  - `@deepseek-club/dsh-desktop`(负责写 launchers/web-url.txt 的 token,客户端依赖它)。
 * 其余(皮肤、桌宠等)一律允许用户自行关闭。
 */
const PINNED_PREFIX = '@dshwork/';
const PINNED = [
  '@deepseek-ai/dsh-base',
  '@deepseek-ai/dsh-web-app',
  '@deepseek-club/dsh-desktop'
];

function dshHome() {
  return process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
}

function profileDir() {
  return path.join(dshHome(), 'profiles', PROFILE_NAME);
}

function profilePackagePath() {
  return path.join(profileDir(), 'package.json');
}

function readProfile() {
  const p = profilePackagePath();
  const pkg = JSON.parse(fs.readFileSync(p, 'utf8'));
  pkg.dsh = pkg.dsh || {};
  pkg.dsh.profile = pkg.dsh.profile || {};
  if (!Array.isArray(pkg.dsh.profile.bundles)) pkg.dsh.profile.bundles = [];
  return { pkg, p, bundles: pkg.dsh.profile.bundles };
}

function isPinned(name) {
  return PINNED.indexOf(name) !== -1 || name.indexOf(PINNED_PREFIX) === 0;
}

/**
 * 列出「全部已安装插件」:profile 的 dependencies ∪ bundles。
 * 关键:已关闭的插件(在 dependencies、不在 bundles)也要列出来并标 enabled=false,
 * 否则用户一关就再也找不到、无法重新打开。
 */
function listPlugins() {
  const { pkg, bundles } = readProfile();
  const deps = Object.keys(pkg.dependencies || {});
  const names = Array.from(new Set(deps.concat(bundles)));
  return names.map((name) => ({
    name,
    enabled: bundles.indexOf(name) !== -1,
    pinned: isPinned(name)
  }));
}

function setEnabled(name, enabled) {
  const { pkg, p, bundles } = readProfile();
  const set = new Set(bundles);
  if (enabled) set.add(name);
  else set.delete(name);
  pkg.dsh.profile.bundles = Array.from(set);
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  return pkg.dsh.profile.bundles;
}

// ---------------------------------------------------------------------------
// 插件市场
// ---------------------------------------------------------------------------

function normalizeItem(p) {
  if (!p || typeof p.name !== 'string') return null;
  const author = p.author && typeof p.author === 'object' ? p.author.name : p.author;
  return {
    name: p.name,
    description: p.description || '',
    version: p.version || (p.distTags && p.distTags.latest) || '',
    author: author || p.publisher || p.maintainers?.[0]?.name || '',
    homepage: (p.links && p.links.homepage) || p.homepage || ''
  };
}

function normalizeList(data) {
  if (Array.isArray(data)) return data.map(normalizeItem).filter(Boolean);
  if (data && Array.isArray(data.plugins)) return data.plugins.map(normalizeItem).filter(Boolean);
  if (data && Array.isArray(data.objects)) return data.objects.map((o) => normalizeItem(o.package || o)).filter(Boolean);
  if (data && data.results) return normalizeList(data.results);
  return [];
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

async function marketList() {
  if (MARKET_URL) {
    return { source: MARKET_URL, items: normalizeList(await fetchJson(MARKET_URL)) };
  }
  const url = `${NPM_REGISTRY}/-/v1/search?text=${encodeURIComponent(MARKET_QUERY)}&size=50`;
  return { source: `npm:${MARKET_QUERY}`, items: normalizeList(await fetchJson(url)) };
}

function npmInstall(spec) {
  return new Promise((resolve) => {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const child = spawn(npm, ['install', spec, '--no-audit', '--no-fund', '--save'], {
      cwd: profileDir(),
      shell: true,
      env: process.env
    });
    let out = '';
    child.stdout?.on('data', (d) => { out += d; });
    child.stderr?.on('data', (d) => { out += d; });
    child.on('error', (err) => resolve({ code: -1, out: String((err && err.message) || err) }));
    child.on('close', (code) => resolve({ code, out }));
  });
}

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) {
        req.destroy();
        reject(new Error('body too large'));
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function handlePlugins(req, res) {
  if (req.method === 'GET') {
    return sendJson(res, 200, { ok: true, profile: PROFILE_NAME, plugins: listPlugins() });
  }
  if (req.method === 'POST') {
    const raw = await readBody(req);
    const body = raw ? JSON.parse(raw) : {};
    if (typeof body.name !== 'string' || !body.name) {
      return sendJson(res, 400, { ok: false, error: 'name required' });
    }
    if (isPinned(body.name)) {
      return sendJson(res, 400, { ok: false, error: 'pinned plugin cannot be toggled' });
    }
    const bundles = setEnabled(body.name, body.enabled !== false);
    return sendJson(res, 200, { ok: true, restartRequired: true, plugins: bundles });
  }
  return sendJson(res, 405, { ok: false, error: 'method not allowed' });
}

async function handleMarket(req, res) {
  if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'method not allowed' });
  try {
    const { source, items } = await marketList();
    return sendJson(res, 200, { ok: true, source, items });
  } catch (err) {
    return sendJson(res, 502, { ok: false, error: String((err && err.message) || err), source: MARKET_URL || `npm:${MARKET_QUERY}` });
  }
}

async function handleMarketInstall(req, res) {
  if (req.method !== 'POST') return sendJson(res, 405, { ok: false, error: 'method not allowed' });
  try {
    const raw = await readBody(req);
    const body = raw ? JSON.parse(raw) : {};
    if (typeof body.name !== 'string' || !body.name) {
      return sendJson(res, 400, { ok: false, error: 'name required' });
    }
    const spec = body.version ? `${body.name}@${body.version}` : body.name;
    const result = await npmInstall(spec);
    if (result.code !== 0) {
      return sendJson(res, 500, { ok: false, error: `npm install exited ${result.code}`, log: result.out.slice(-2000) });
    }
    // 装好后加入插件名单
    let bundles;
    try {
      bundles = setEnabled(body.name, true);
    } catch (err) {
      return sendJson(res, 500, { ok: false, error: String((err && err.message) || err), log: result.out.slice(-2000) });
    }
    return sendJson(res, 200, { ok: true, restartRequired: true, installed: body.name, plugins: bundles, log: result.out.slice(-2000) });
  } catch (err) {
    return sendJson(res, 500, { ok: false, error: String((err && err.message) || err) });
  }
}

export const inject = ['webServer'];

export function apply(ctx) {
  const register = (pathname, handler) =>
    ctx.effect(() => ctx.webServer.register({ kind: 'exact', path: pathname, handler }));

  register(PLUGINS_ROUTE, (req, res) =>
    handlePlugins(req, res).catch((err) => sendJson(res, 500, { ok: false, error: String((err && err.message) || err) })));

  register(MARKET_ROUTE, (req, res) =>
    handleMarket(req, res).catch((err) => sendJson(res, 500, { ok: false, error: String((err && err.message) || err) })));

  register(MARKET_INSTALL_ROUTE, (req, res) =>
    handleMarketInstall(req, res).catch((err) => sendJson(res, 500, { ok: false, error: String((err && err.message) || err) })));
}
