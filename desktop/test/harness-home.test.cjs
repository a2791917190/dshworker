'use strict';

/**
 * harness-home 单元测试:用户已有 harness 检测 + 内置保底私有 DSH_HOME。
 *
 * 运行: node test/harness-home.test.cjs
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { findInstalledDsh } = require('../src/main/harness');
const { ensureDedicatedHome, globalDshHome, dedicatedHome, copyCredentials } = require('../src/main/dsh-home');

function tmpdir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

const allTmp = [];
function track(d) {
  allTmp.push(d);
  return d;
}

function cleanupAll() {
  for (const d of allTmp) fs.rmSync(d, { recursive: true, force: true });
}

let passed = 0;
async function run() {
  const tests = [
    ['findInstalledDsh finds a global @deepseek-ai/dsh under APPDATA', () => {
      const base = track(tmpdir('dshwork-find-'));
      const bin = path.join(base, 'npm', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js');
      fs.mkdirSync(path.dirname(bin), { recursive: true });
      fs.writeFileSync(bin, '#!/usr/bin/env node\n', 'utf8');
      const prev = process.env.APPDATA;
      process.env.APPDATA = base;
      try {
        const found = findInstalledDsh();
        assert.strictEqual(found, bin, 'should resolve the global dsh bin');
      } finally {
        if (prev === undefined) delete process.env.APPDATA;
        else process.env.APPDATA = prev;
      }
    }],
    ['findInstalledDsh returns null with no global dsh', () => {
      const base = track(tmpdir('dshwork-nofind-'));
      const prevAppData = process.env.APPDATA;
      const prevPath = process.env.PATH;
      process.env.APPDATA = base;
      process.env.PATH = base; // 清空 PATH,避免扫描到本机真实 dsh
      try {
        assert.strictEqual(findInstalledDsh(), null);
      } finally {
        if (prevAppData === undefined) delete process.env.APPDATA;
        else process.env.APPDATA = prevAppData;
        if (prevPath === undefined) delete process.env.PATH;
        else process.env.PATH = prevPath;
      }
    }],
    ['globalDshHome prefers DSH_HOME then ~/.dsh', () => {
      const prev = process.env.DSH_HOME;
      process.env.DSH_HOME = 'C:/custom/home';
      assert.strictEqual(globalDshHome(), 'C:/custom/home');
      if (prev === undefined) delete process.env.DSH_HOME;
      else process.env.DSH_HOME = prev;
      assert.ok(globalDshHome().endsWith(path.sep + '.dsh') || globalDshHome().includes('.dsh'));
    }],
    ['dedicatedHome builds a dsh-home under a base path', () => {
      const base = track(tmpdir('dshwork-base-'));
      assert.strictEqual(dedicatedHome(base), path.join(base, 'dsh-home'));
    }],
    ['copyCredentials copies missing files only', () => {
      const src = track(tmpdir('dshwork-cred-src-'));
      const dest = track(tmpdir('dshwork-cred-dst-'));
      fs.writeFileSync(path.join(src, '.credentials.yaml'), 'k: v\n');
      fs.writeFileSync(path.join(src, 'settings.yaml'), 's: 1\n');
      fs.writeFileSync(path.join(dest, 'settings.yaml'), 'keep: me\n');
      const copied = copyCredentials(src, dest);
      assert.strictEqual(copied, true, 'should copy the missing credential file');
      assert.ok(fs.existsSync(path.join(dest, '.credentials.yaml')), 'credential copied');
      assert.strictEqual(fs.readFileSync(path.join(dest, 'settings.yaml'), 'utf8'), 'keep: me\n', 'existing file untouched');
    }],
    ['ensureDedicatedHome sets DSH_HOME, copies creds, clears profiles/node_modules', () => {
      const globalHome = track(tmpdir('dshwork-global-'));
      fs.writeFileSync(path.join(globalHome, '.credentials.yaml'), 'api: xxx\n');
      const base = track(tmpdir('dshwork-appdata-'));
      const prev = process.env.DSH_HOME;
      process.env.DSH_HOME = globalHome;
      try {
        const res = ensureDedicatedHome(base);
        assert.strictEqual(res.home, path.join(base, 'dsh-home'));
        assert.strictEqual(res.isolated, true);
        assert.strictEqual(process.env.DSH_HOME, path.join(base, 'dsh-home'));
        // 凭据被拷入
        assert.ok(fs.existsSync(path.join(path.join(base, 'dsh-home'), '.credentials.yaml')), 'credentials copied into private home');
        // 清空 profiles/node_modules(先造一个)
        const pinned = path.join(path.join(base, 'dsh-home'), 'profiles', 'node_modules', '@deepseek-ai', 'dsh');
        fs.mkdirSync(pinned, { recursive: true });
        fs.writeFileSync(path.join(pinned, 'package.json'), '{}');
        ensureDedicatedHome(base); // 第二次,应清空 pinned
        assert.ok(!fs.existsSync(path.join(path.join(base, 'dsh-home'), 'profiles', 'node_modules', '@deepseek-ai', 'dsh')), 'profiles/node_modules cleared on second run');
      } finally {
        if (prev === undefined) delete process.env.DSH_HOME;
        else process.env.DSH_HOME = prev;
      }
    }],
    ['ensureDedicatedHome honors DSHWORK_ISOLATED=0', () => {
      const prevIsolated = process.env.DSHWORK_ISOLATED;
      const prevHome = process.env.DSH_HOME;
      process.env.DSHWORK_ISOLATED = '0';
      const g = track(tmpdir('dshwork-global2-'));
      process.env.DSH_HOME = g;
      try {
        const res = ensureDedicatedHome(track(tmpdir('dshwork-appdata2-')));
        assert.strictEqual(res.isolated, false);
        assert.strictEqual(res.home, g);
      } finally {
        if (prevIsolated === undefined) delete process.env.DSHWORK_ISOLATED;
        else process.env.DSHWORK_ISOLATED = prevIsolated;
        if (prevHome === undefined) delete process.env.DSH_HOME;
        else process.env.DSH_HOME = prevHome;
      }
    }]
  ];

  console.log('harness-home unit tests');
  for (const [name, fn] of tests) {
    try {
      await fn();
      passed++;
      console.log(`  ✓ ${name}`);
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(err);
      cleanupAll();
      process.exit(1);
    }
  }
}

run().then(() => {
  console.log(`\n${passed} harness-home tests passed.`);
  cleanupAll();
});
