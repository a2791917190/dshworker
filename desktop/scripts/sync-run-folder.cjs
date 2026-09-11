'use strict';

/**
 * 把最新构建产物同步到「可运行目录」(默认 ../../DSHwork-win),便于直接重启测试。
 * 只同步会变化的部分:
 *   - resources/app.asar(源码改动的载体)
 *   - resources/plugins(有/无镜像过去)
 * 不重新压缩 zip(压缩包等需要时再打)。
 *
 * 用法(在 desktop 目录下):
 *   node scripts/sync-run-folder.cjs
 *   node scripts/sync-run-folder.cjs --to "C:/path/to/DSHwork-win"
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const o = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--to') o.to = argv[++i];
  }
  return o;
}

function main() {
  const args = parseArgs(process.argv);
  const srcResources = path.join(__dirname, '..', 'dist', 'win-unpacked', 'resources');
  const runDir = args.to || path.join(__dirname, '..', '..', '..', 'DSHwork-win');
  const dstResources = path.join(runDir, 'resources');

  if (!fs.existsSync(path.join(srcResources, 'app.asar'))) {
    console.error('未找到构建产物 app.asar:', srcResources);
    process.exit(1);
  }
  if (!fs.existsSync(runDir)) {
    console.error('可运行目录不存在:', runDir);
    process.exit(1);
  }
  fs.mkdirSync(dstResources, { recursive: true });

  // app.asar
  fs.copyFileSync(path.join(srcResources, 'app.asar'), path.join(dstResources, 'app.asar'));

  // plugins 目录(有则覆盖,无则删除)
  const sp = path.join(srcResources, 'plugins');
  const dp = path.join(dstResources, 'plugins');
  if (fs.existsSync(sp)) {
    fs.rmSync(dp, { recursive: true, force: true });
    fs.cpSync(sp, dp, { recursive: true });
  } else if (fs.existsSync(dp)) {
    fs.rmSync(dp, { recursive: true, force: true });
  }

  console.log('已同步 app.asar(+plugins) 到:', dstResources);
  console.log('重启', path.join(runDir, 'DSHwork.exe'), '即可看到效果。');
}

main();
