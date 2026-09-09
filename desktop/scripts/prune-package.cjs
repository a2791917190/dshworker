'use strict';

/**
 * DSHwork 瘦身脚本:在打包产物(win-unpacked)上做安全精简,不碰依赖树、不破坏启动。
 *
 * 主要削减(均为「目标平台用不到」的内容):
 *   1) Electron 语言文件只留 en-US / zh-CN / zh-TW(其余 ~52 个 .pak 删除);
 *   2) node-pty 只留 win32-x64 的 prebuild(删掉 darwin、linux、win32-arm64);
 *
 * 用法(在 desktop 目录下):
 *   node scripts/prune-package.cjs
 *   node scripts/prune-package.cjs --dir <win-unpacked目录>
 *   node scripts/prune-package.cjs --no-zip   # 只精简,不重新压缩
 *
 * 精简后需重新压缩成 zip(默认会重新打 DSHwork-portable-<version>-<platform>-<arch>.zip)。
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const KEEP_LOCALES = ['en-US.pak', 'zh-CN.pak', 'zh-TW.pak'];

function parseArgs(argv) {
  const o = { dir: null, noZip: false, help: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dir') o.dir = argv[++i];
    else if (a === '--no-zip') o.noZip = true;
    else if (a === '--help') o.help = true;
  }
  return o;
}

function defaultDir() {
  return path.join(__dirname, '..', 'dist', 'win-unpacked');
}

function stripLocales(dir) {
  const locales = path.join(dir, 'locales');
  if (!fs.existsSync(locales)) return 0;
  let removed = 0;
  for (const f of fs.readdirSync(locales)) {
    if (f.endsWith('.pak') && !KEEP_LOCALES.includes(f)) {
      try {
        fs.rmSync(path.join(locales, f), { force: true });
        removed++;
      } catch (_) {
        // 忽略单个删除失败
      }
    }
  }
  return removed;
}

function pruneNodePty(dir) {
  const prebuilds = path.join(dir, 'resources', 'vendor', 'harness', 'node_modules', 'node-pty', 'prebuilds');
  if (!fs.existsSync(prebuilds)) return 0;
  let removed = 0;
  for (const d of fs.readdirSync(prebuilds)) {
    if (d !== 'win32-x64') {
      try {
        fs.rmSync(path.join(prebuilds, d), { recursive: true, force: true });
        removed++;
      } catch (_) {}
    }
  }
  // conpty 的 arm64 目录
  const conpty = path.join(dir, 'resources', 'vendor', 'harness', 'node_modules', 'node-pty', 'third_party', 'conpty');
  if (fs.existsSync(conpty)) {
    for (const ver of fs.readdirSync(conpty)) {
      const vd = path.join(conpty, ver);
      for (const a of fs.readdirSync(vd)) {
        if (/arm64/.test(a)) {
          try {
            fs.rmSync(path.join(vd, a), { recursive: true, force: true });
            removed++;
          } catch (_) {}
        }
      }
    }
  }
  return removed;
}

function measure(dir) {
  const total = fs.readdirSync(dir).reduce((sum, name) => {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) {
      return sum + fs.readdirSync(p, { recursive: true }).reduce((s, f) => {
        try { return s + fs.statSync(path.join(p, f)).size; } catch (_) { return s; }
      }, 0);
    }
    return sum + fs.statSync(p).size;
  }, 0);
  return total;
}

function rezip(dir) {
  const out = path.join(__dirname, '..', 'dist');
  const version = require(path.join(__dirname, '..', 'package.json')).version;
  const zip = path.join(out, `DSHwork-portable-${version}-${process.platform}-${process.arch}.zip`);
  const names = fs.readdirSync(dir);
  if (fs.existsSync(zip)) fs.rmSync(zip, { force: true });
  const r = spawnSync('tar.exe', ['-a', '-c', '-f', zip, '-C', dir, ...names], { stdio: 'inherit', shell: false });
  if (r.error || r.status !== 0) throw new Error(`重新打包失败: ${r.error ? r.error.code : r.status}`);
  return zip;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log('prune-package.cjs — 安全精简 DSHwork 打包产物(locales + node-pty prebuilds)');
    console.log('  --dir <path>   win-unpacked 目录(默认 dist/win-unpacked)');
    console.log('  --no-zip      只精简,不重新压缩');
    return;
  }
  const dir = args.dir || defaultDir();
  if (!fs.existsSync(path.join(dir, 'DSHwork.exe')) && !fs.existsSync(path.join(dir, 'resources'))) {
    console.error('未找到打包产物:', dir);
    process.exit(1);
  }
  const beforeMb = Math.round(measure(dir) / 1048576);
  const l = stripLocales(dir);
  const p = pruneNodePty(dir);
  const afterMb = Math.round(measure(dir) / 1048576);

  console.log(`精简: locales 删除 ${l} 个, node-pty prebuild 删除 ${p} 个`);
  console.log(`win-unpacked: ${beforeMb} MB -> ${afterMb} MB(省 ${beforeMb - afterMb} MB)`);

  if (args.noZip) return;
  const zip = rezip(dir);
  const mb = Math.round((fs.statSync(zip).size / 1048576) * 10) / 10;
  console.log(`重新打包完成: ${zip} (${mb} MB)`);
}

main();
