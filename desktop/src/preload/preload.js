'use strict';

/**
 * 预加载脚本:在隔离的渲染进程与主进程之间暴露最小安全桥。
 * 只暴露必要能力:深链事件、平台信息、打开外链、Harness 状态查询。
 */

const { contextBridge, ipcRenderer, shell } = require('electron');

contextBridge.exposeInMainWorld('dshwork', {
  platform: process.platform,
  onDeepLink(callback) {
    ipcRenderer.on('dshwork:deeplink', (_event, link) => callback(link));
  },
  getHarnessInfo() {
    return ipcRenderer.invoke('dshwork:harness-info').catch((err) => {
      console.warn('[preload] harness-info unavailable:', err && err.message);
      return null;
    });
  },
  openExternal(url) {
    shell.openExternal(url);
  }
});
