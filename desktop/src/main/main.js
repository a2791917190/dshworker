'use strict';

/**
 * DSHwork Desktop — 薄壳主进程(路线 3:薄壳 + 插件化)
 *
 * 职责(刻意保持"薄"):
 *  - 单实例锁 + 深链(dshwork://)二次启动转发
 *  - 启动 DeepSeek Harness(内置固定版本,先启动 harness,再由它带动工作台插件)
 *  - 创建承载 Harness Web UI 的窗口
 *  - 托盘、自动更新
 */

const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const { registerProtocol } = require('./protocol');
const { createTray } = require('./tray');
const { promptHarnessUpdate, setupUpdater } = require('./updater');
const {
  bootHarness,
  resolveHarnessVersion,
  HARNESS_URL,
  getHarnessUrl,
  BUNDLED_HARNESS_VERSION
} = require('./harness');
const { WORKBENCH_URL } = require('../plugin');

const DEEP_LINK_SCHEME = 'dshwork';

let mainWindow = null;
// 本次启动选定 / 检测到的 Harness 版本信息(供 UI 与 IPC 使用)。
let harnessInfo = null;
// Harness 是否已实际拉起(供工作台显示状态)。
let harnessUp = false;

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    const link = argv.find((a) => a.startsWith(`${DEEP_LINK_SCHEME}://`));
    if (link) dispatchDeepLink(link);
  });

  app.whenReady().then(onReady);
}

async function onReady() {
  registerProtocol(DEEP_LINK_SCHEME, dispatchDeepLink);

  // 内置 harness 作为「保底」时用的私有数据目录基址(避免与用户已有 harness 的
  // Junction/profile 冲突)。默认取 Electron userData。bootHarness 仅在「没有可用
  // harness」时才会切到私有 home。
  process.env.DSHWORK_PRIVATE_HOME_BASE = app.getPath('userData');

  // 供渲染进程(工作台)查询 Harness 状态。需在窗口加载前注册好 handler。
  ipcMain.handle('dshwork:harness-info', () => getHarnessInfoSnapshot());

  // 1) 解析 Harness 版本:检测更新 → 需要时弹窗询问 → 得到 bundled / npx。
  //    resolveHarnessVersion 内部对网络失败会优雅降级为「内置固定版本」。
  harnessInfo = await resolveHarnessVersion({
    prompt: (info) => promptHarnessUpdate({ ...info, getWindow: () => mainWindow })
  });

  // 2) 拉起对应版本的 Harness(先启动 harness;若已有实例在跑则直接复用)。
  //    工作台窗口在 harness 起来后再打开,由 harness 网页带动工作台插件加载。
  const up = await bootHarness(harnessInfo.mode);
  harnessUp = !!up;

  // 3) 打开承载 Harness Web UI 的窗口(工作台插件在其中加载)。
  //    若 Harness 不可达(离线/未启动),降级加载本地工作台 UI。
  createWindow();

  createTray(app, () => mainWindow, getHarnessInfoSnapshot());
  setupUpdater(app);
}

function getHarnessInfoSnapshot() {
  const current = getCurrentVersionLabel();
  return {
    url: getHarnessUrl(),
    bundledVersion: BUNDLED_HARNESS_VERSION,
    latestVersion: harnessInfo ? harnessInfo.latestVersion : null,
    hasUpdate: harnessInfo ? harnessInfo.hasUpdate : false,
    updated: harnessInfo ? harnessInfo.updated : false,
    mode: harnessInfo ? harnessInfo.mode : 'bundled',
    running: harnessUp && !!current.running,
    label: current.running ? current.label : '',
    statusText: harnessUp ? 'Harness 已连接' : 'Harness 未连接'
  };
}

function getCurrentVersionLabel() {
  const mode = harnessInfo ? harnessInfo.mode : 'bundled';
  const version = harnessInfo && harnessInfo.updated ? harnessInfo.latestVersion : BUNDLED_HARNESS_VERSION;
  return { running: true, label: `Harness v${version} · ${mode === 'npx' ? 'npx 最新版' : '内置固定版'}` };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    title: 'DSHwork',
    backgroundColor: '#04070f',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // 加载 Harness Web UI(内置/最新版)。DSHwork 工作台插件在其中注入界面。
  // 若 Harness 不可达(离线/未启动),降级加载本地工作台 UI,便于查看/开发界面。
  // 带 harness 的 auth token(没有 token 会被 auth fence 拦成 "authentication required")。
  mainWindow.loadURL(getHarnessUrl());
  let hasFallenBack = false;
  let autoReloaded = false;
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url, isMainFrame) => {
    if (isMainFrame && !hasFallenBack && code === -102) {
      // ERR_CONNECTION_REFUSED → 加载本地工作台骨架
      hasFallenBack = true;
      mainWindow.loadFile(WORKBENCH_URL);
    }
  });

  // 兜底 A:harness 冷启动时客户端 bundle 可能偶发加载失败(console 里的
  // "failed to load plugins / bundle script ... failed to load")。检测到后自动刷新一次。
  mainWindow.webContents.on('console-message', (_e, level, message) => {
    if (autoReloaded || hasFallenBack) return;
    if (!/failed to load|failed to import loader|client-modules|bundle script/i.test(String(message || ''))) return;
    autoReloaded = true;
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isDestroyed()) {
        mainWindow.webContents.reload();
      }
    }, 900);
  });

  // 兜底 B:页面加载了但渲染成空白(黑屏)——常见于 harness Web UI 客户端模块图冷启动
  // 竞态。加载完成 2.5s 后检查 body 是否无文本;若空白则刷新一次(刷新后已稳定)。
  mainWindow.webContents.on('did-finish-load', () => {
    if (autoReloaded || hasFallenBack) return;
    setTimeout(async () => {
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed() && !autoReloaded && !hasFallenBack) {
        try {
          const hasText = await mainWindow.webContents.executeJavaScript('document.body ? document.body.innerText.trim().length > 0 : false');
          if (!hasText) {
            autoReloaded = true;
            mainWindow.webContents.reload();
          }
        } catch (_) {
          // executeJavaScript 失败 → 忽略,交给兜底 A / 用户手动刷新
        }
      }
    }, 2500);
  });

  // 标题前缀固定为 DSHwork,避免被页面 <title> 覆盖。
  mainWindow.webContents.on('page-title-updated', (_e, title) => {
    mainWindow.setTitle(`DSHwork · ${title}`);
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // 外部链接一律走系统浏览器,不新开 Electron 窗口。
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * 深链统一入口:
 *   dshwork://open
 *   dshwork://add-plugin/<id>
 *   dshwork://open-template/<id>
 *   dshwork://run-task/<id>
 * 转发给渲染进程,由 DSHwork 工作台消费。
 */
function dispatchDeepLink(link) {
  if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
    mainWindow.webContents.send('dshwork:deeplink', link);
  }
}

// macOS:应用重新激活时若无窗口则重建(符合平台惯例)。
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
