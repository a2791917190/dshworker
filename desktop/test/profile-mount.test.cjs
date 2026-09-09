'use strict';

/**
 * profile-mount 单元测试:验证工作台插件挂载的状态机与幂等逻辑。
 *
 * 不真正跑 pnpm / dsh plugin add(避免在运行中的 profile 上误操作),依靠
 * `noInstall` 干跑 + 用临时 DSH_HOME 伪造 profile 来断言 `mountState`。
 *
 * 运行: node test/profile-mount.test.cjs
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  PLUGIN_NAME,
  profileDirFor,
  resolvePluginDir,
  toForwardSlashes,
  mountState,
  ensureWorkbenchMounted,
  removeWorkbenchMounted
} = require('../src/main/profile-mount');

// -- 临时 DSH_HOME ----------------------------------------------------------
const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'dshwork-mount-'));
const prevDshHome = process.env.DSH_HOME;
process.env.DSH_HOME = tmpHome;

function cleanup() {
  if (prevDshHome === undefined) delete process.env.DSH_HOME;
  else process.env.DSH_HOME = prevDshHome;
  fs.rmSync(tmpHome, { recursive: true, force: true });
}

function makeProfile(name, { bundles = [], deps = {}, install = false } = {}) {
  const dir = profileDirFor(name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
    name: `dsh-profile-${name}`,
    private: true,
    dependencies: deps,
    dsh: { profile: { bundles } }
  }, null, 2) + '\n', 'utf8');
  if (install) {
    const inst = path.join(dir, 'node_modules', '@deepseek-ai', 'dsh-client-ui-dshwork');
    fs.mkdirSync(inst, { recursive: true });
    fs.writeFileSync(path.join(inst, 'package.json'), JSON.stringify({ name: PLUGIN_NAME, version: '0.1.0' }, null, 2) + '\n', 'utf8');
  }
  return dir;
}

let passed = 0;

/**
 * 顺序执行测试(await 异步测试),任一失败即清理退出。
 * `t()` 现在会 await 异步测试,避免异步体在 cleanup 之后才继续跑。
 */
async function run() {
  const tests = [
    ['profileDirFor resolves under DSH_HOME', () => {
      assert.strictEqual(profileDirFor('web'), path.join(tmpHome, 'profiles', 'web'));
    }],
    ['toForwardSlashes normalizes Windows paths', () => {
      assert.strictEqual(toForwardSlashes('C:\\a\\b'), 'C:/a/b');
    }],
    ['mountState: bare profile is not mounted', () => {
      const dir = makeProfile('bare');
      const s = mountState(dir);
      assert.strictEqual(s.mounted, false);
      assert.strictEqual(s.bundle, false);
      assert.strictEqual(s.installed, false);
      assert.strictEqual(s.profileExists, true);
    }],
    ['mountState: bundled but not installed is not mounted', () => {
      const dir = makeProfile('bundle-only', { bundles: [PLUGIN_NAME] });
      const s = mountState(dir);
      assert.strictEqual(s.mounted, false, 'must not claim mounted when not installed');
      assert.strictEqual(s.bundle, true);
      assert.strictEqual(s.installed, false);
    }],
    ['mountState: installed but not bundled is not mounted', () => {
      const dir = makeProfile('installed-only', { install: true });
      const s = mountState(dir);
      assert.strictEqual(s.mounted, false);
      assert.strictEqual(s.bundle, false);
      assert.strictEqual(s.installed, true);
    }],
    ['mountState: bundled + installed is mounted', () => {
      const dir = makeProfile('ready', { bundles: [PLUGIN_NAME], install: true });
      const s = mountState(dir);
      assert.strictEqual(s.mounted, true);
      assert.strictEqual(s.bundle, true);
      assert.strictEqual(s.installed, true);
    }],
    ['ensureWorkbenchMounted: already mounted is a fast no-op', async () => {
      makeProfile('ready2', { bundles: [PLUGIN_NAME], install: true });
      const res = await ensureWorkbenchMounted({ profileName: 'ready2', noInstall: true });
      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.mounted, true);
    }],
    ['ensureWorkbenchMounted: needs install → dry-run reports reason', async () => {
      makeProfile('needs-install', { bundles: [] });
      const res = await ensureWorkbenchMounted({
        profileName: 'needs-install',
        node: (process.platform === 'win32' ? 'node.exe' : 'node'),
        dshBin: path.join(tmpHome, 'dsh', 'bin.js'),
        noInstall: true
      });
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.mounted, false);
      assert.ok(res.reason === 'dry-run', `expected dry-run, got ${res.reason}`);
    }],
    ['ensureWorkbenchMounted: missing plugin dir → reason no-plugin-package', async () => {
      makeProfile('no-plugin');
      const res = await ensureWorkbenchMounted({
        profileName: 'no-plugin',
        pluginDir: path.join(tmpHome, 'does-not-exist'),
        node: (process.platform === 'win32' ? 'node.exe' : 'node'),
        dshBin: path.join(tmpHome, 'dsh', 'bin.js'),
        noInstall: true
      });
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.reason, 'no-plugin-package', 'reason should be no-plugin-package');
    }],
    ['ensureWorkbenchMounted: pnpm-free copy fallback mounts when dsh/pnpm unavailable', async () => {
      const dir = makeProfile('copy-fallback', { bundles: [] });
      const pluginDir = resolvePluginDir();
      assert.ok(pluginDir && fs.existsSync(path.join(pluginDir, 'package.json')), 'real plugin dir should resolve for the test');
      const res = await ensureWorkbenchMounted({
        profileName: 'copy-fallback',
        pluginDir,
        node: 'nonexistent-node-exe',   // 让 dsh plugin 路径失败
        dshBin: 'nonexistent-dsh-bin'
      });
      assert.strictEqual(res.ok, true, `copy fallback should mount (got ${res.reason})`);
      assert.strictEqual(res.mounted, true);
      const after = mountState(dir);
      assert.strictEqual(after.mounted, true, 'profile should now be mounted');
      assert.strictEqual(after.bundle, true);
      assert.strictEqual(after.installed, true);
    }],
    ['removeWorkbenchMounted undoes a mounted plugin', async () => {
      const dir = makeProfile('undo', { bundles: [] });
      const pluginDir = resolvePluginDir();
      const res = await ensureWorkbenchMounted({ profileName: 'undo', pluginDir });
      assert.strictEqual(res.mounted, true, 'should mount first');
      const removed = removeWorkbenchMounted(dir);
      assert.strictEqual(removed, true, 'should report removed');
      const after = mountState(dir);
      assert.strictEqual(after.mounted, false, 'should be unmounted after remove');
      assert.strictEqual(after.bundle, false);
      assert.strictEqual(after.installed, false);
    }],
    ['ensureWorkbenchMounted: auto-mount disabled via env', async () => {
      const prev = process.env.DSHWORK_AUTO_MOUNT;
      process.env.DSHWORK_AUTO_MOUNT = '0';
      makeProfile('disabled');
      const res = await ensureWorkbenchMounted({ profileName: 'disabled' });
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.reason, 'disabled');
      if (prev === undefined) delete process.env.DSHWORK_AUTO_MOUNT;
      else process.env.DSHWORK_AUTO_MOUNT = prev;
    }]
  ];

  for (const [name, fn] of tests) {
    try {
      await fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(err);
      cleanup();
      process.exit(1);
    }
  }
}

console.log('profile-mount unit tests');
run().then(() => {
  console.log(`\n${passed} profile-mount tests passed.`);
  cleanup();
});
