'use strict';

/**
 * electron-builder 的 afterPack 钩子:macOS 打包完成后,把 mac 版 node + mac 版 harness
 * 灌进 .app 的 Contents/Resources,实现「无环境自启动」。
 *
 * 只在 darwin 平台生效;若 vendor 失败(联网/依赖问题)则打日志后继续,回退为
 * 「用系统 node/npx 启动」的轻量模式,不阻塞打包。
 *
 * 需要(在 mac 上):
 *   - 能访问 nodejs.org / registry.npmjs.org(或配置 DSHWORK_NODE_DIST_MIRROR / DSHWORK_NPM_REGISTRY);
 *   - 系统有 node + npm(用于 vendor 脚本)。
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

exports.default = async function afterPackMac(context) {
  if (context.electronPlatformName !== 'darwin') return;

  // 只有在 mac 主机上构建才做 self-contained vendoring(会装 mac 版 node/harness)。
  // 在 Windows/Linux 上交叉构建 mac 目标时,跳过 vendoring(否则会装 win 平台原生模块,
  // 打进 mac app 必然损坏);此时产物为「thin」版,依赖 mac 上的系统 node/npx 拉 harness。
  if (process.platform !== 'darwin') {
    console.warn('[after-pack-mac] 非 mac 主机交叉构建:跳过 self-contained vendoring,产物为 thin 版(需 mac 的 node/npx)');
    return;
  }

  const appOutDir = context.appOutDir; // 例如 dist/mac/DSHwork.app 或 dist/mac-arm64/DSHwork.app
  const resources = path.join(appOutDir, 'Contents', 'Resources');
  const vendorScript = path.join(__dirname, '..', '..', 'plugins', 'vendor-runtime.cjs');

  // 构建前已经 vendor 过时(desktop/vendor/{node,harness} 经 extraResources 打进 Resources),
  // 这里什么都不用做 —— 重复下载 node、重装 harness 只会拖慢构建,还可能覆盖已就位的版本。
  // (CI 用的是「构建前 vendor + 校验」,所以正常路径都会命中这里。)
  const alreadyVendored =
    fs.existsSync(path.join(resources, 'vendor', 'harness', 'node_modules', '@deepseek-ai', 'dsh', 'package.json')) &&
    fs.existsSync(path.join(resources, 'node', 'bin', 'node'));
  if (alreadyVendored) {
    console.log('[after-pack-mac] 内置运行时已随 extraResources 打入,跳过重复 vendoring');
    return;
  }

  console.log('[after-pack-mac] vendoring mac node + harness into', resources);

  const r = spawnSync(process.execPath, [
    vendorScript,
    '--resources', resources,
    '--no-zip'
  ], { stdio: 'inherit', shell: process.platform === 'win32' });

  if (r.error || r.status !== 0) {
    // 回退为轻量模式(用系统 node/npx 启动 harness),不阻塞打包。
    console.warn('[after-pack-mac] vendor 失败,将回退为轻量(系统 node/npx 启动)模式:', r.error ? r.error.message : `exit ${r.status}`);
    return;
  }
  console.log('[after-pack-mac] 已把 mac node + harness 打进', resources);
};
