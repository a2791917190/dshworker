'use strict';

/**
 * 注册 dshwork:// 自定义协议。
 * 在 Windows / macOS 上由 electron-builder 的 `protocols` 配置声明系统级关联,
 * 这里再通过 setAsDefaultProtocolClient 确保应用被识别为协议处理器。
 */

const { app } = require('electron');

function registerProtocol(scheme, handler) {
  if (process.defaultApp) {
    // 开发模式:协议参数在 argv 里,由 second-instance / ready 后读取。
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(scheme, process.execPath, [
        require('path').resolve(process.argv[1])
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient(scheme);
  }

  // macOS 通过 open-url 事件接收深链。
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handler(url);
  });
}

module.exports = { registerProtocol };
