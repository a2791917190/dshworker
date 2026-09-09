'use strict';

/**
 * node-runtime.js 可确定逻辑的单元测试(无需网络/无需 spawn)。
 * 覆盖:node 可执行名、npx/home 推导、下载地址、内置/缓存/系统的逐级解析。
 * 运行: node test/node-runtime.test.cjs
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const nr = require('../src/main/node-runtime');

let passed = 0;
async function ok(name, fn) {
  await fn();
  passed++;
  console.log('  ✓ ' + name);
}

async function withEnv(key, value, fn) {
  const prev = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
  try {
    await fn();
  } finally {
    if (prev === undefined) delete process.env[key];
    else process.env[key] = prev;
  }
}

async function main() {
  console.log('node-runtime unit tests\n');

  await ok('nodeExeName matches platform', () => {
    assert.strictEqual(nr.nodeExeName(), process.platform === 'win32' ? 'node.exe' : path.join('bin', 'node'));
  });

  await ok('nodeDownloadUrl embeds version + platform', () => {
    const url = nr.nodeDownloadUrl();
    assert.ok(url.startsWith('https://nodejs.org/dist/v' + nr.NODE_VERSION + '/'), url);
    assert.ok(url.includes(`node-v${nr.NODE_VERSION}-${process.platform === 'win32' ? 'win' : process.platform === 'darwin' ? 'darwin' : 'linux'}-`), url);
    assert.ok(url.endsWith(process.platform === 'win32' ? '.zip' : '.tar.gz'), url);
  });

  if (process.platform === 'win32') {
    await ok('describe computes home + npx (win32)', () => {
      const desc = nr.describe('C:\\node\\node.exe', 'bundled');
      assert.strictEqual(desc.home, 'C:\\node');
      assert.strictEqual(desc.npx, path.join('C:\\node', 'npx.cmd'));
      assert.strictEqual(desc.source, 'bundled');
    });
  }

  await ok('findBundledNode via DSHWORK_NODE_HOME', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'dshnr-'));
    const home = path.join(base, 'home');
    fs.mkdirSync(home, { recursive: true });
    const fake = path.join(home, nr.nodeExeName());
    fs.writeFileSync(fake, '');
    try {
      await withEnv('DSHWORK_NODE_HOME', home, () => {
        assert.strictEqual(nr.findBundledNode(), fake);
      });
    } finally {
      fs.rmSync(base, { recursive: true, force: true });
    }
  });

  await ok('findSystemNode via PATH', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'dshsys-'));
    const bin = path.join(base, 'bin');
    fs.mkdirSync(bin, { recursive: true });
    const fake = path.join(bin, nr.nodeExeName());
    fs.writeFileSync(fake, '');
    const prev = process.env.PATH;
    try {
      process.env.PATH = bin + path.delimiter + (prev || '');
      assert.strictEqual(nr.findSystemNode(), fake);
    } finally {
      process.env.PATH = prev;
      fs.rmSync(base, { recursive: true, force: true });
    }
  });

  await ok('findCachedNode via DSHWORK_NODE_CACHE', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'dshcache-'));
    const cache = path.join(base, `node-v${nr.NODE_VERSION}`);
    fs.mkdirSync(cache, { recursive: true });
    const fake = path.join(cache, nr.nodeExeName());
    fs.writeFileSync(fake, '');
    try {
      await withEnv('DSHWORK_NODE_CACHE', base, () => {
        assert.strictEqual(nr.findCachedNode(), fake);
      });
    } finally {
      fs.rmSync(base, { recursive: true, force: true });
    }
  });

  await ok('resolveNodeRuntime prefers bundled over system', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'dshpref-'));
    const home = path.join(base, 'bundled');
    fs.mkdirSync(home, { recursive: true });
    const fake = path.join(home, nr.nodeExeName());
    fs.writeFileSync(fake, '');
    const prevPath = process.env.PATH;
    try {
      process.env.PATH = ''; // 不暴露系统 node
      await withEnv('DSHWORK_NODE_HOME', home, () => {
        const r = nr.resolveNodeRuntime();
        assert.strictEqual(r.source, 'bundled');
        assert.strictEqual(r.node, fake);
      });
    } finally {
      process.env.PATH = prevPath;
      fs.rmSync(base, { recursive: true, force: true });
    }
  });

  console.log(`\n${passed} tests passed.`);
}

main().catch((err) => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
