'use strict';

/**
 * 更新逻辑(两个层面,职责分离):
 *
 * 1) Harness 运行时版本更新(本次核心)——
 *    DSHwork 桌面「随包内置固定版本」的 Harness;启动时检测 npm registry 是否有更新,
 *    有更新则弹窗询问用户是否更新:
 *       · 不更新 → 继续用内置固定版本;
 *       · 更新   → 改用 npx 拉取最新版 Harness 启动。
 *    具体「检测 + 决策」在 harness.js(resolveHarnessVersion),本文件只负责 Electron 侧的用户确认弹窗。
 *
 * 2) DSHwork 应用自身更新(脚手架)——
 *    通过 electron-updater + GitHub Releases 后台检查稳定版,用户确认后下载安装。
 *    依赖未安装,保留占位 TODO。
 */

const { dialog } = require('electron');

/**
 * 弹窗询问用户是否更新 Harness 到最新版。
 * @returns {Promise<boolean>} true = 更新(用 npx);false = 不更新(用内置固定版本)
 */
async function promptHarnessUpdate({ bundledVersion, latestVersion, getWindow }) {
  const win = typeof getWindow === 'function' ? getWindow() : null;
  const options = {
    type: 'info',
    buttons: ['使用内置版本(暂不更新)', '更新到新版本'],
    defaultId: 0,
    cancelId: 0,
    noLink: true,
    message: `检测到 DeepSeek Harness 新版本 (${latestVersion})`,
    detail:
      `当前内置固定版本:${bundledVersion}\n` +
      `最新可用版本:${latestVersion}\n\n` +
      `「更新」将改用 npx 拉取最新版并启动(需联网)。\n` +
      `「不更新」则继续使用随包内置的固定版本,开箱即用、离线可用。`
  };
  const { response } = win ? await dialog.showMessageBox(win, options) : await dialog.showMessageBox(options);
  return response === 1;
}

/**
 * DSHwork 应用自身自动更新(占位)。
 * 生产接入 electron-updater + GitHub Releases。
 * 原则:后台检查稳定版 → 用户确认后下载安装;失败不破坏当前安装。
 */
function setupUpdater(app) {
  // TODO(integrate): 安装 electron-updater(devDependency),然后:
  //   const { autoUpdater } = require('electron-updater');
  //   autoUpdater.autoDownload = false;
  //   autoUpdater.on('update-available', (info) => promptAppUpdate(app, info));
  //   autoUpdater.checkForUpdatesAndNotify();
  // 需要在 package.json 的 build 里配置 publish 指向真实 GitHub Releases。
  console.log('[updater] DSHwork app auto-update is a scaffolding placeholder.');
}

module.exports = { promptHarnessUpdate, setupUpdater };
