'use strict';

/**
 * 把 DSHwork 品牌插件(@dshwork/dsh-client-ui-dshwork-brand)挂进一个 dsh profile。
 * 做法与生态一致:复制插件包进 profile 的 node_modules,并写入 dsh.profile.bundles。
 * 无需 pnpm。之后重启 harness 即可生效。
 *
 * 用法: node plugins/mount-brand.cjs [--profile web] [--profile-dir <path>]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const PLUGIN = '@dshwork/dsh-client-ui-dshwork-brand';

function parseArgs(argv) {
  const o = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--profile') o.profile = argv[++i];
    else if (argv[i] === '--profile-dir') o.profileDir = argv[++i];
  }
  return o;
}

function main() {
  const args = parseArgs(process.argv);
  const pluginDir = path.join(__dirname, 'dsh-client-ui-dshwork-brand');
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
  const profileName = args.profile || process.env.DSHWORK_HARNESS_PROFILE || 'web';
  const profileDir = args.profileDir || path.join(home, 'profiles', profileName);
  const pkgPath = path.join(profileDir, 'package.json');

  console.log('插件目录 :', pluginDir);
  console.log('目标 profile:', profileDir);

  if (!fs.existsSync(path.join(pluginDir, 'package.json'))) {
    console.error('找不到插件包:', pluginDir);
    process.exit(1);
  }
  if (!fs.existsSync(pkgPath)) {
    console.error('找不到 profile package.json:', pkgPath);
    process.exit(1);
  }

  // 1) 复制插件进 profile 的 node_modules
  const target = path.join(profileDir, 'node_modules', '@dshwork', 'dsh-client-ui-dshwork-brand');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(pluginDir, target, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}node_modules`)
  });
  console.log('✓ 已复制插件到', target);

  // 2) 写入 bundles + dependencies
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.dsh = pkg.dsh || {};
  pkg.dsh.profile = pkg.dsh.profile || {};
  if (!Array.isArray(pkg.dsh.profile.bundles)) pkg.dsh.profile.bundles = [];
  if (!pkg.dsh.profile.bundles.includes(PLUGIN)) pkg.dsh.profile.bundles.push(PLUGIN);
  pkg.dependencies = pkg.dependencies || {};
  pkg.dependencies[PLUGIN] = 'link:' + pluginDir.replace(/\\/g, '/');
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log('✓ 已写入 bundles:', pkg.dsh.profile.bundles.join(', '));
  console.log('\n下一步:重启该 profile 的 harness(重新运行 dsh web / 重启 DSHwork 客户端)。');
}

main();
