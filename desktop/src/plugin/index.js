'use strict';

/**
 * DSHwork 插件层(产品核心)。
 *
 * 设计原则:
 *  - "桌面本身也是插件" —— 本插件作为普通成员接入官方 Harness 插件体系。
 *  - 薄壳只负责窗口/托盘/深链/更新;工作台的所有界面与业务都在这里。
 *  - 插件通过 window.dshwork 桥(见 preload)消费深链事件。
 *
 * TODO(integrate): 与官方 Harness 的 Cordis 插件注册 API 对齐后,
 * 把本骨架的"静态工作台 UI"挂载为 Harness 的一个 slot / 视图。
 */

const WORKBENCH_URL = require('path').join(__dirname, 'workbench', 'index.html');

/**
 * 当插件被 Harness 加载时调用(以官方插件机制为准)。
 * 本骨架提供一个可独立打开的静态工作台 UI,便于先跑通界面。
 */
function register(context) {
  // 占位:context 为 Harness 提供的插件上下文。
  // 正式接入后,在此注册工作台 slot、service 与深链处理器。
  console.log('[dshwork] plugin registered', { workbench: WORKBENCH_URL });
}

module.exports = { register, WORKBENCH_URL };
