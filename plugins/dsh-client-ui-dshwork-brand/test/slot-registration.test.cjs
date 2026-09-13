'use strict';

/**
 * slot-registration 单元测试:验证 lib/client.js 的槽位占位行为。
 *
 * 为什么需要它:桌面端的单测只覆盖主进程,而品牌行为全在客户端 bundle 里 ——
 * 一次模板改动就可能让 bundle 在浏览器里抛错。这里用 vm + 最小 slot registry
 * 把 bundle 真正跑一遍,断言:
 *   1. sidebar.brand.mark / sidebar.brand.name 正常占位;
 *   2. conversation.hero.brand.mark 以 priority -1 注册(遮蔽官方,而不是同优先级硬撞);
 *   3. 官方已占 priority 0 时**不抛错**,我们的占位仍然建立;
 *   4. 槽位未声明 / 连 -1 都被占时,apply 不抛错(插件其余部分照常加载)。
 *
 * 运行: node test/slot-registration.test.cjs
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const bundlePath = path.join(__dirname, '..', 'lib', 'client.js');
const source = fs.readFileSync(bundlePath, 'utf8');

/** 在受控沙箱里加载 bundle,返回插件的 exports。 */
function loadPlugin() {
  let captured = null;
  const sandbox = {
    console,
    window: { __ModuleLoader__: { load: (mod) => { captured = mod; } } }
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'client.js' });
  assert.ok(captured, 'bundle 应该调用 window.__ModuleLoader__.load');
  assert.strictEqual(captured.id, '@dshwork/dsh-client-ui-dshwork-brand', 'bundle id 应匹配包名');

  const React = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children }),
    useState: (value) => [value, () => {}],
    useSyncExternalStore: () => undefined
  };

  return captured.factory((name) => {
    if (name === 'react') return React;
    if (name === 'react/jsx-runtime') return {};
    throw new Error(`unexpected require("${name}")`);
  });
}

/**
 * 最小 slot registry:复刻真实实现里 single 槽「同优先级重复注册抛错」的规则。
 * @param {string[]} declared - 已声明的槽位名
 * @param {Object<string, number>} occupied - 槽位名 → 已有占位的 priority
 */
function createSlots(declared, occupied = {}) {
  const entries = new Map();
  for (const [name, priority] of Object.entries(occupied)) {
    entries.set(name, [{ options: { priority }, component: null }]);
  }
  const prioOf = (o) => (o.priority === undefined ? 0 : o.priority);
  return {
    register(options, Component) {
      if (!declared.includes(options.name)) {
        throw new Error(`slot "${options.name}" is not declared`);
      }
      const list = entries.get(options.name) || [];
      if (list.some((e) => prioOf(e.options) === prioOf(options))) {
        throw new Error(`single slot "${options.name}" already has a registration at priority ${prioOf(options)}`);
      }
      list.push({ options, component: Component });
      entries.set(options.name, list);
      return () => {};
    },
    occupants(name) {
      return entries.get(name) || [];
    }
  };
}

/** 跑一遍 apply,并立即触发所有 inject 回调(真实环境里由槽位声明驱动)。 */
function applyPlugin(slots) {
  const pending = [];
  const ctx = {
    slots: {
      inject: (name, cb) => {
        pending.push({ name, cb });
        return () => {};
      },
      register: (options, Component) => slots.register(options, Component)
    }
  };
  const plugin = loadPlugin();
  plugin.apply(ctx);
  for (const p of pending) p.cb();
  return plugin;
}

const ALL_SLOTS = [
  'sidebar.brand.mark',
  'sidebar.brand.name',
  'conversation.hero.brand.mark',
  'sidebar.footer.action',
  'shell.overlay',
  'conversation.session.header.corner'
];

let passed = 0;
const tests = [
  ['registers the sidebar brand mark and deliberately leaves the official name alone', () => {
    const slots = createSlots(ALL_SLOTS);
    applyPlugin(slots);
    assert.strictEqual(slots.occupants('sidebar.brand.mark').length, 1, 'sidebar.brand.mark occupied');
    assert.strictEqual(slots.occupants('sidebar.brand.name').length, 0, 'sidebar.brand.name left to the official wordmark');
    const hero = slots.occupants('conversation.hero.brand.mark');
    assert.strictEqual(hero.length, 1, 'hero mark occupied');
    assert.strictEqual(hero[0].options.priority, -1, 'hero registered at the shadowing priority');
  }],

  ['shadows an official occupant at priority 0 instead of colliding', () => {
    const slots = createSlots(ALL_SLOTS, {
      'conversation.hero.brand.mark': 0,
      'sidebar.brand.mark': 0,
      'sidebar.brand.name': 0
    });
    applyPlugin(slots); // 不应抛错
    const hero = slots.occupants('conversation.hero.brand.mark').map((e) => e.options.priority ?? 0);
    assert.deepStrictEqual(hero.sort(), [-1, 0], 'both occupants coexist; ours at -1 (lowest renders)');
    const mark = slots.occupants('sidebar.brand.mark').map((e) => e.options.priority ?? 0);
    assert.deepStrictEqual(mark.sort(), [-1, 0], 'sidebar mark coexists too');
    const name = slots.occupants('sidebar.brand.name').map((e) => e.options.priority ?? 0);
    assert.deepStrictEqual(name, [0], 'the official wordmark is untouched');
  }],

  ['does not throw when a slot is not declared', () => {
    const slots = createSlots(['sidebar.footer.action', 'shell.overlay', 'conversation.session.header.corner']);
    assert.doesNotThrow(() => applyPlugin(slots), 'a missing slot must not break the whole plugin');
    assert.strictEqual(slots.occupants('sidebar.footer.action').length, 1, 'the remaining registrations still land');
  }],

  ['does not throw when even the shadowing priority is taken', () => {
    const slots = createSlots(ALL_SLOTS, {
      'conversation.hero.brand.mark': -1,
      'sidebar.brand.mark': -1,
      'sidebar.brand.name': -1
    });
    assert.doesNotThrow(() => applyPlugin(slots), 'a hard collision must degrade, not fail the entry');
    assert.strictEqual(slots.occupants('shell.overlay').length, 1, 'other slots still register');
  }],

  ['the slot mark carries the marker the DOM fallback keys off', () => {
    const slots = createSlots(ALL_SLOTS);
    applyPlugin(slots);
    const component = slots.occupants('sidebar.brand.mark')[0].component;
    assert.strictEqual(typeof component, 'function', 'a real component is registered');
    const vnode = component({ size: 24 });
    // DOM 兜底只有在找不到这个标记时才动手 —— 契约必须守住,否则 logo 会两边都不出现。
    assert.strictEqual(vnode.props['data-dshwork-slot-mark'], 'true', 'standdown marker present');
    assert.strictEqual(vnode.props.width, 24, 'renders at the host-provided size');
    assert.ok(String(vnode.props.src).startsWith('data:image/'), 'embeds the dshwork logo');
  }],

  ['exposes only the cordis-loading surface', () => {
    const plugin = loadPlugin();
    assert.strictEqual(typeof plugin.apply, 'function', 'apply exported');
    // 展开成当前 realm 的数组:vm 里造出来的数组原型不同,直接 deepStrictEqual 会比原型。
    assert.deepStrictEqual([...plugin.inject], ['slots'], 'inject declares the slots service');
  }]
];

console.log('slot-registration unit tests');
for (const [name, fn] of tests) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(err);
    process.exit(1);
  }
}
console.log(`\n${passed} slot-registration tests passed.`);
