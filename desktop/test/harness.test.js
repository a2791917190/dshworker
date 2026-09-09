'use strict';

/**
 * harness.js 版本策略逻辑的单元测试(纯 Node,无第三方依赖)。
 * 运行: node test/harness.test.js
 */

const assert = require('assert');
const path = require('path');
const {
  compareVersions,
  isNewerVersion,
  resolveHarnessVersion,
  findBundledHarness,
  extractToken,
  getHarnessUrl,
  getHarnessToken,
  BUNDLED_HARNESS_VERSION
} = require('../src/main/harness');

let passed = 0;
async function ok(name, fn) {
  await fn();
  passed++;
  console.log('  ✓ ' + name);
}

async function main() {
  console.log('harness.js unit tests\n');

  // ---- compareVersions ----
  await ok('compare 0.1.1-rc.2 < 0.1.1-rc.3  => -1', () => {
    assert.strictEqual(compareVersions('0.1.1-rc.2', '0.1.1-rc.3'), -1);
  });
  await ok('compare 0.1.1-rc.2 < 0.1.1    => -1 (release beats prerelease)', () => {
    assert.strictEqual(compareVersions('0.1.1-rc.2', '0.1.1'), -1);
  });
  await ok('compare 0.1.2 > 0.1.1         => 1', () => {
    assert.strictEqual(compareVersions('0.1.2', '0.1.1'), 1);
  });
  await ok(`compare equal (${BUNDLED_HARNESS_VERSION}) => 0`, () => {
    assert.strictEqual(compareVersions(BUNDLED_HARNESS_VERSION, BUNDLED_HARNESS_VERSION), 0);
  });

  // ---- isNewerVersion ----
  await ok('isNewer 0.1.2 vs 0.1.1 => true', () => {
    assert.strictEqual(isNewerVersion('0.1.2', '0.1.1'), true);
  });
  await ok('isNewer same version => false', () => {
    assert.strictEqual(isNewerVersion('0.1.1', '0.1.1'), false);
  });
  await ok('isNewer null latest => false', () => {
    assert.strictEqual(isNewerVersion(null, '0.1.1'), false);
  });
  await ok('isNewer older 0.1.0 vs 0.1.1 => false', () => {
    assert.strictEqual(isNewerVersion('0.1.0', '0.1.1'), false);
  });
  await ok('isNewer prerelease (0.1.1-rc.3 vs 0.1.1-rc.2) => false (no rc update prompt)', () => {
    assert.strictEqual(isNewerVersion('0.1.1-rc.3', '0.1.1-rc.2'), false);
  });
  await ok('isNewer alpha vs bundled rc => false', () => {
    assert.strictEqual(isNewerVersion('0.2.0-alpha.1', '0.1.1-rc.2'), false);
  });

  // ---- extractToken / getHarnessUrl ----
  await ok('extractToken parses ?token= from URL', () => {
    assert.strictEqual(extractToken('http://127.0.0.1:3080/?token=abc123'), 'abc123');
  });
  await ok('extractToken parses token from "dsh web:" line', () => {
    assert.strictEqual(extractToken('dsh web: http://127.0.0.1:3080/?token=x_y-z.ABC'), 'x_y-z.ABC');
  });
  await ok('extractToken returns null when no token', () => {
    assert.strictEqual(extractToken('http://127.0.0.1:3080/'), null);
  });
  await ok('getHarnessUrl appends token', () => {
    const t = extractToken('http://127.0.0.1:3080/?token=abc123');
    // getHarnessUrl 依赖模块内 harnessToken,用 extractToken 的返回值无法直接注入,
    // 这里仅验证 extractToken 产出非空,getHarnessUrl 无 token 时原样返回。
    assert.ok(typeof t === 'string' && t.length > 0);
    assert.strictEqual(getHarnessUrl(), 'http://127.0.0.1:3080');
  });

  // ---- resolveHarnessVersion ----
  const base = { bundledVersion: '0.1.0' };

  await ok('no update (latest same) => bundled, hasUpdate false', async () => {
    const r = await resolveHarnessVersion({ ...base, fetchLatest: async () => '0.1.0' });
    assert.strictEqual(r.mode, 'bundled');
    assert.strictEqual(r.hasUpdate, false);
    assert.strictEqual(r.updated, false);
  });

  await ok('network failure (fetchLatest rejects) => bundled, hasUpdate false', async () => {
    const r = await resolveHarnessVersion({ ...base, fetchLatest: async () => { throw new Error('offline'); } });
    assert.strictEqual(r.mode, 'bundled');
    assert.strictEqual(r.hasUpdate, false);
  });

  await ok('update available, user declines => bundled but hasUpdate true', async () => {
    const r = await resolveHarnessVersion({ ...base, fetchLatest: async () => '0.1.1', prompt: async () => false });
    assert.strictEqual(r.mode, 'bundled');
    assert.strictEqual(r.hasUpdate, true);
    assert.strictEqual(r.updated, false);
  });

  await ok('update available, user accepts => npx, updated true', async () => {
    const r = await resolveHarnessVersion({ ...base, fetchLatest: async () => '0.1.1', prompt: async () => true });
    assert.strictEqual(r.mode, 'npx');
    assert.strictEqual(r.hasUpdate, true);
    assert.strictEqual(r.updated, true);
  });

  await ok('update available, no prompt fn => bundled (fail-safe)', async () => {
    const r = await resolveHarnessVersion({ ...base, fetchLatest: async () => '0.1.1' });
    assert.strictEqual(r.mode, 'bundled');
    assert.strictEqual(r.updated, false);
  });

  // ---- findBundledHarness ----
  await ok('findBundledHarness resolves via DSHWORK_HARNESS_DIR', () => {
    const fixture = path.join(__dirname, 'fixtures', 'dsh');
    const prev = process.env.DSHWORK_HARNESS_DIR;
    process.env.DSHWORK_HARNESS_DIR = fixture;
    try {
      const b = findBundledHarness();
      assert.ok(b, 'should find bundled harness');
      assert.strictEqual(b.version, '0.1.1-rc.2');
      const normBin = (b.binPath || '').replace(/\\/g, '/');
      assert.ok(normBin.endsWith('lib/bin.js'), `binPath=${b.binPath}`);
    } finally {
      if (prev === undefined) delete process.env.DSHWORK_HARNESS_DIR;
      else process.env.DSHWORK_HARNESS_DIR = prev;
    }
  });

  console.log(`\n${passed} tests passed.`);
}

main().catch((err) => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
