'use strict';

/**
 * 撤销 DSHwork 工作台插件在某个 dsh profile 上的挂载,还原用户原有 harness profile。
 *
 * 用途:DSHwork 客户端旧版把工作台插件挂进了用户的全局 ~/.dsh/profiles/web,
 * 可能导致用户原有 harness 启动异常、网页用不了。运行本脚本即可还原。
 *
 * 用法(在 desktop 目录下):
 *   node scripts/unmount-workbench.cjs                # 默认还原 $DSH_HOME/profiles/web
 *   node scripts/unmount-workbench.cjs --profile tui  # 指定 profile
 *   node scripts/unmount-workbench.cjs --profile-dir "C:/path/to/profiles/web"
 *
 * 之后:重新运行你自己的 `dsh web`,并打开它打印的 URL(带 token)。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const { removeWorkbenchMounted, profileDirFor, dshHome, defaultProfileName } = require('../src/main/profile-mount');

function parseArgs(argv) {
  const o = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--profile') o.profile = argv[++i];
    else if (a === '--profile-dir') o.profileDir = argv[++i];
    else if (a === '--help') o.help = true;
  }
  return o;
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log('unmount-workbench.cjs — 撤销 DSHwork 工作台插件挂载,还原用户 harness profile');
    console.log('  --profile <name>       目标 profile 名(默认 web)');
    console.log('  --profile-dir <path>   显式指定 profile 目录');
    return;
  }

  const profileName = args.profile || defaultProfileName();
  const profileDir = args.profileDir || profileDirFor(profileName);
  const home = dshHome();
  console.log(`DSH_HOME     : ${home}`);
  console.log(`目标 profile : ${profileDir}`);

  if (!fs.existsSync(profileDir)) {
    console.error('该 profile 目录不存在,可能没有需要还原的东西。');
    process.exit(1);
  }

  const changed = removeWorkbenchMounted(profileDir);
  if (changed) {
    console.log('\n✓ 已撤销工作台插件挂载(从 bundles + dependencies + node_modules 移除)。');
  } else {
    console.log('\n(未发现需要移除的工作台插件挂载。)');
  }

  console.log('\n下一步:');
  console.log('  1) 重新运行你自己的 harness:`dsh web`(或你的启动方式)。');
  console.log('  2) 打开它打印的 URL(**带 ?token= 那个**)——这是你原来的工作网页。');
  console.log('  3) 若之前有卡住的进程,请先结束 node.exe(或重启电脑)。');
}

main();
