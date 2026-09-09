'use strict';

/**
 * 冒烟测试:在不依赖浏览器的前提下,加载 dsh-client-ui-dshwork 的 client.js,
 * 验证它产出合法的客户端插件契约,且 apply() 能正确注册
 * `sidebar.footer.action` 与 `shell.overlay` 两个 slot。
 *
 * 运行: node test/smoke.test.js   (在插件包根目录)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 俘获 __ModuleLoader__.load 的注册对象
let registration = null;
global.window = {
  __ModuleLoader__: {
    load: (reg) => {
      registration = reg;
    }
  }
};

// 伪造 React(只需用到 useState / useSyncExternalStore / createElement)
const fakeReact = {
  useState: (init) => [init, () => {}],
  useCallback: (fn) => fn,
  useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot(),
  createElement: (type, props, ...children) => ({ type, props, children })
};
function fakeRequire(spec) {
  if (spec === 'react') return fakeReact;
  throw new Error('unexpected require: ' + spec);
}

const clientPath = path.join(__dirname, '..', 'lib', 'client.js');
const code = fs.readFileSync(clientPath, 'utf8');

// 执行脚本,触发 window.__ModuleLoader__.load
// eslint-disable-next-line no-eval
(0, eval)(code);

assert.ok(registration, 'client.js should call __ModuleLoader__.load');
assert.strictEqual(registration.id, '@deepseek-ai/dsh-client-ui-dshwork');

// 材料化工厂
const exportsObj = registration.factory(fakeRequire);
assert.strictEqual(typeof exportsObj.apply, 'function', 'exports.apply must be a function');
assert.ok(Array.isArray(exportsObj.inject), 'exports.inject must be an array');
assert.deepStrictEqual(exportsObj.inject, ['slots', 'locale', 'sessions', 'workspaces'], 'inject must include sessions + workspaces');

// 假 ctx:提供真实的 sessions / workspaces 快照存储,验证注入工厂能透传
const sessionsList = {
  getSnapshot: () => ({ ids: [1, 2], byId: {}, current: undefined, phase: 'ready' }),
  subscribe: () => () => {}
};
const workspacesList = {
  getSnapshot: () => ({ items: [], archivedSessionIds: [], state: 'idle', phase: 'ready', baselinesReady: true, recentWorkspaceId: undefined }),
  subscribe: () => () => {}
};
const registrations = [];
const effects = [];
const capturedRegs = [];
const sessions = { list: sessionsList, open: () => {}, create: async () => 1 };
const workspaces = { list: workspacesList, startSession: () => {}, create: async () => ({ workspaceId: 'w', title: 'W', path: '/p', sessionIds: [] }) };
const ctx = {
  effect: (fn, label) => {
    fn();
    effects.push(label);
  },
  sessions,
  workspaces,
  locale: {
    register: (ns, dict) => {
      assert.strictEqual(ns, 'dshwork');
      assert.ok(dict.zh && dict.en, 'locale should register zh + en');
    }
  },
  slots: {
    inject: (name, mount) => registrations.push({ name, mount }),
    register: (def, Component) => {
      assert.ok(def && def.name, 'register definition must carry a name');
      assert.strictEqual(typeof Component, 'function', 'register component must be a function');
      capturedRegs.push({ def, Component });
      return () => {};
    }
  }
};

exportsObj.apply(ctx);

// 断言注册了目标 slot
const names = registrations.map((r) => r.name);
assert.ok(names.includes('sidebar.footer.action'), `should register sidebar.footer.action (got ${names.join(',')})`);
assert.ok(names.includes('shell.overlay'), `should register shell.overlay (got ${names.join(',')})`);
assert.ok(effects.length >= 1, 'should register effect for dictionaries');

// 尝试 mount() footer / overlay 的 register 分支,确认 register 面用法不抛错
for (const { mount } of registrations) {
  const regFn = mount();
  assert.strictEqual(typeof regFn, 'function', 'slots.inject should return a registration function');
}

// 校验 shell.overlay 的注入工厂把 sessions / workspaces 透传给组件
const overlayReg = capturedRegs.find(({ def }) => def.name === 'shell.overlay');
assert.ok(overlayReg, 'shell.overlay should be registered');
assert.strictEqual(typeof overlayReg.def.inject, 'function', 'shell.overlay register must carry an inject (props) factory');
const injectedProps = overlayReg.def.inject();
assert.strictEqual(injectedProps.sessions, sessions, 'inject should expose sessions to the overlay composant');
assert.strictEqual(injectedProps.workspaces, workspaces, 'inject should expose workspaces to the overlay composant');

// ── 回退模式:ctx 缺 sessions / workspaces 时,注册不抛错,注入工厂返回 undefined ──
const fallbackRegs = [];
const fallbackDefs = [];
const fallbackEffectCount = { n: 0 };
const fallbackCtx = {
  effect: (fn) => {
    fn();
    fallbackEffectCount.n++;
  },
  locale: {
    register: () => {}
  },
  slots: {
    inject: (name, mount) => fallbackRegs.push({ name, mount }),
    register: (def) => {
      fallbackDefs.push(def);
      return () => {};
    }
  }
};
exportsObj.apply(fallbackCtx);
assert.ok(fallbackEffectCount.n >= 1, 'fallback apply should still register dictionaries');
const overlayInject = fallbackRegs.find((r) => r.name === 'shell.overlay' && typeof r.mount === 'function');
assert.ok(overlayInject, 'fallback overlay inject must be present');
overlayInject.mount(); // 触发 register → fallbackDefs 收集 def
const overlayFallbackDef = fallbackDefs.find((d) => d.name === 'shell.overlay');
assert.ok(overlayFallbackDef, 'fallback overlay must still register a def');
assert.strictEqual(typeof overlayFallbackDef.inject, 'function', 'fallback overlay register must carry an inject (props) factory');
const fallbackProps = overlayFallbackDef.inject();
assert.strictEqual(fallbackProps.sessions, undefined, 'fallback inject should expose undefined sessions');
assert.strictEqual(fallbackProps.workspaces, undefined, 'fallback inject should expose undefined workspaces');

console.log('smoke test passed: plugin contract valid; slots =', names.join(', '));
