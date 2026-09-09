'use strict';

/**
 * 系统托盘:常驻入口 + 打开/退出。
 * 图标为占位,正式打包前请替换 assets/icons/tray 下的真实图标。
 */

const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let tray = null;

function createTray(app, getWindow, harnessInfo) {
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'icons', 'tray.png');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  const label = harnessInfo && harnessInfo.label ? harnessInfo.label : 'DSHwork';
  tray.setToolTip(`DSHwork · ${label}`);

  const menu = Menu.buildFromTemplate([
    {
      label: '打开 DSHwork',
      click: () => {
        const win = getWindow();
        if (win) {
          win.show();
          win.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => app.quit()
    }
  ]);

  tray.setContextMenu(menu);
  tray.on('click', () => {
    const win = getWindow();
    if (win) {
      win.isVisible() ? win.hide() : win.show();
    }
  });
}

module.exports = { createTray };
