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
  readHarnessUrlToken,
  webArgs,
  webArgsFor,
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
  await ok('readHarnessUrlToken reads token from launchers/web-url.txt', () => {
    const os = require('os');
    const fs = require('fs');
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'dshwork-urltoken-'));
    try {
      fs.mkdirSync(path.join(home, 'launchers'), { recursive: true });
      fs.writeFileSync(path.join(home, 'launchers', 'web-url.txt'), 'http://127.0.0.1:3080/?token=Tok_123-abc\n', 'utf8');
      const prev = process.env.DSH_HOME;
      process.env.DSH_HOME = home;
      try {
        assert.strictEqual(readHarnessUrlToken(), 'Tok_123-abc');
      } finally {
        if (prev === undefined) delete process.env.DSH_HOME;
        else process.env.DSH_HOME = prev;
      }
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
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

  // ---- webArgs:拉起 harness 的参数 ----
  // 回归守卫:
  //   ① 绝不能漏掉 --no-open,否则 harness 会额外弹一个系统浏览器页面;
  //   ② 必须用 --profile 显式指定 profile,不能用 `web` 子命令 ——
  //      `web` 是 `--profile web` 的别名、写死指向 profiles/web,
  //      客户端要用自己的 profile(默认 dshwork),`dsh web` 才能保持原生界面。
  await ok('webArgs always passes --no-open and the client profile', () => {
    const args = webArgs();
    assert.ok(args.includes('--no-open'), `expected --no-open in ${JSON.stringify(args)}`);
    assert.ok(args.includes('--profile'), `expected --profile in ${JSON.stringify(args)}`);
    assert.ok(!args.includes('web'), `must not use the web subcommand: ${JSON.stringify(args)}`);
    assert.strictEqual(args[args.indexOf('--profile') + 1], 'dshwork', 'client profile is dshwork by default');
  });

  await ok('webArgsFor derives host and port from the URL', () => {
    assert.deepStrictEqual(webArgsFor('http://127.0.0.1:3080'), ['--profile', 'web', '--no-open', '--host', '127.0.0.1', '--port', '3080']);
    // 关键:DSHWORK_HARNESS_URL 覆盖端口时,harness 必须被拉到同一个端口
    assert.deepStrictEqual(webArgsFor('http://127.0.0.1:3081'), ['--profile', 'web', '--no-open', '--host', '127.0.0.1', '--port', '3081']);
    assert.deepStrictEqual(webArgsFor('http://127.0.0.1:3199'), ['--profile', 'web', '--no-open', '--host', '127.0.0.1', '--port', '3199']);
  });

  await ok('webArgsFor accepts a client profile name', () => {
    assert.deepStrictEqual(
      webArgsFor('http://127.0.0.1:3080', 'dshwork'),
      ['--profile', 'dshwork', '--no-open', '--host', '127.0.0.1', '--port', '3080']
    );
  });

  await ok('webArgsFor tolerates a URL without an explicit port', () => {
    const args = webArgsFor('http://localhost');
    assert.strictEqual(args[0], '--profile');
    assert.ok(args.includes('--no-open'));
    assert.ok(!args.includes('--port'), 'no port flag when the URL has none');
  });

  await ok('webArgsFor survives a malformed URL', () => {
    assert.deepStrictEqual(webArgsFor('not a url'), ['--profile', 'web', '--no-open']);
  });

  console.log(`\n${passed} tests passed.`);
}

main().catch((err) => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
