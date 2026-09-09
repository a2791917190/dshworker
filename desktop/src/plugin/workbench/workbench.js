'use strict';

/**
 * DSHwork 工作台 UI 逻辑(骨架)。
 * 职责:
 *  - 视图切换(主页/任务/工作区/模板库/插件)
 *  - 深链消费(dshwork://open-template、add-plugin 等)
 *  - 占位的模板点击 → 进入任务(待接 Harness 执行)
 */

(function () {
  const nav = document.getElementById('nav');
  const status = document.getElementById('status');
  const taskList = document.getElementById('task-list');
  const pluginList = document.getElementById('plugin-list');

  function showView(name) {
    document.querySelectorAll('.wb__view').forEach((v) => {
      v.classList.toggle('is-hidden', v.dataset.panel !== name);
    });
    nav.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.view === name);
    });
  }

  nav.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-view]');
    if (btn) showView(btn.dataset.view);
  });

  // 模板点击 → 占位任务
  document.querySelectorAll('[data-task]').forEach((card) => {
    card.addEventListener('click', () => {
      const name = card.querySelector('strong').textContent;
      const li = document.createElement('li');
      li.textContent = `${name} — 已加入任务(执行引擎待接入 Harness)`;
      taskList.querySelector('.wb__empty')?.remove();
      taskList.appendChild(li);
      status.textContent = `已启动:${name}`;
      showView('tasks');
    });
  });

  // 深链消费(桥由 preload 提供;非 Electron 环境下降级为无操作)
  function handleDeepLink(link) {
    if (!link) return;
    const m = link.match(/^dshwork:\/\/([a-z-]+)(?:\/([^/?#]+))?/);
    if (!m) return;
    const [, action, id] = m;
    if (action === 'open-template') {
      status.textContent = `深链:打开模板 ${id || ''}`;
      showView('templates');
    } else if (action === 'add-plugin') {
      const li = document.createElement('li');
      li.textContent = `插件 ${id || ''}(来源:DeepSeek.club 插件库)`;
      pluginList.querySelector('.wb__empty')?.remove();
      pluginList.appendChild(li);
      status.textContent = `深链:安装插件 ${id || ''}`;
      showView('plugins');
    }
  }

  // 显示 Harness 连接状态(离线/开发时可见)
  if (window.dshwork && window.dshwork.getHarnessInfo) {
    window.dshwork.getHarnessInfo().then((info) => {
      if (info && info.label) {
        status.textContent = `${info.label} · 本地工作台(骨架)`;
      } else {
        status.textContent = '就绪 · 未取得 Harness 状态';
      }
    });
  }

  if (window.dshwork && window.dshwork.onDeepLink) {
    window.dshwork.onDeepLink(handleDeepLink);
  }

  if (!window.dshwork) {
    status.textContent = '就绪 · 骨架已加载(非 Electron 环境)';
  }
})();
