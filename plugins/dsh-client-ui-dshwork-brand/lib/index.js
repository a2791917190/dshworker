/**
 * DSHwork brand plugin — host (node) half.
 *
 * 提供两个真实接口,供客户端「插件」面板使用:
 *   GET  /dshwork/api/plugins                → 当前 profile 的插件名单(读 dsh.profile.bundles)
 *   POST /dshwork/api/plugins {name,enabled} → 真正把插件加进/移出名单(写 profile package.json)
 *
 * 说明:插件名单在 harness 启动时读取,所以改动「重启后生效」——这是真改文件,不是前端假开关。
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROUTE = '/dshwork/api/plugins';
const PROFILE_NAME = process.env.DSHWORK_HARNESS_PROFILE || 'web';
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

function profilePackagePath() {
  return path.join(dshHome(), 'profiles', PROFILE_NAME, 'package.json');
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

export const inject = ['webServer'];

export function apply(ctx) {
  ctx.effect(() =>
    ctx.webServer.register({
      kind: 'exact',
      path: ROUTE,
      handler: async (req, res) => {
        try {
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
        } catch (err) {
          return sendJson(res, 500, { ok: false, error: String((err && err.message) || err) });
        }
      }
    })
  );
}
