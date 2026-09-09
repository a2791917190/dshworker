'use strict';

/**
 * 把 @deepseek-ai/dsh-client-ui-dshwork 挂载到一个 dsh profile,方式与现有生态一致:
 * 通过 pnpm workspace 的 `link:` 依赖 + `dsh.profile.bundles`(参考 skin / dsh-desktop-pet)。
 *
 * 脚本只做「安全、可逆」的 package.json 编辑:
 *   1) dependencies 加一行 `"@deepseek-ai/dsh-client-ui-dshwork": "link:<plugin-abs-dir>"`
 *   2) dsh.profile.bundles 追加 `"@deepseek-ai/dsh-client-ui-dshwork"`
 * 然后打印你需要执行的 `pnpm install` 与重启命令。
 *
 * 不会自动跑 pnpm / 不会重启,避免在运行中的 profile 上误操作。
 *
 * 用法:
 *   node mount-into-profile.cjs                    # 目标 = $DSH_HOME/profiles/web (默认)
 *   node mount-into-profile.cjs --profile web
 *   node mount-into-profile.cjs --profile-dir "C:/Users/MECHREVO/.dsh/profiles/web"
 *   node mount-into-profile.cjs --plugin-dir "..." # 默认取本脚本同级的插件包
 *   node mount-into-profile.cjs --apply            # 真正写 package.json(默认只 dry-run)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const PLUGIN_NAME = '@deepseek-ai/dsh-client-ui-dshwork';
const EXE_DIR = __dirname;

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--profile') out.profile = argv[++i];
    else if (a === '--profile-dir') out.profileDir = argv[++i];
    else if (a === '--plugin-dir') out.pluginDir = argv[++i];
    else if (a === '--apply') out.apply = true;
    else if (a === '--help') out.help = true;
  }
  return out;
}

function defaultPluginDir() {
  return path.join(EXE_DIR, 'dsh-client-ui-dshwork');
}

function defaultProfileDir(profileName) {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
  return path.join(home, 'profiles', profileName);
}

function toForwardSlashes(p) {
  return p.replace(/\\/g, '/');
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log('mount-into-profile.cjs — link the DSHwork workbench plugin into a dsh profile');
    console.log('  --profile <name>       profile name (default: web)');
    console.log('  --profile-dir <path>   explicit profile dir (overrides --profile)');
    console.log('  --plugin-dir <path>    plugin package dir (default: sibling dsh-client-ui-dshwork)');
    console.log('  --apply                write package.json (default: dry-run, print only)');
    return;
  }

  const pluginDir = toForwardSlashes(path.resolve(args.pluginDir || defaultPluginDir()));
  if (!fs.existsSync(path.join(pluginDir, 'package.json'))) {
    console.error(`plugin package not found at ${pluginDir}`);
    process.exit(1);
  }

  const profileName = args.profile || 'web';
  const profileDir = args.profileDir || defaultProfileDir(profileName);
  const pkgPath = path.join(profileDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error(`profile package.json not found: ${pkgPath}`);
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = pkg.dependencies || (pkg.dependencies = {});
  const bundles = (pkg.dsh && pkg.dsh.profile && pkg.dsh.profile.bundles) || null;

  const linkSpec = `link:${pluginDir}`;
  const needDep = deps[PLUGIN_NAME] !== linkSpec;
  const needBundle = !(bundles && bundles.includes(PLUGIN_NAME));

  console.log(`Profile: ${profileDir}`);
  console.log(`  dependency   : ${PLUGIN_NAME}: ${deps[PLUGIN_NAME] || '(none)'} -> ${linkSpec}  ${needDep ? '[add]' : '[ok]'}`);
  console.log(`  bundles      : ${bundles ? (bundles.includes(PLUGIN_NAME) ? PLUGIN_NAME + ' [ok]' : PLUGIN_NAME + ' [add]') : '(no bundles array)'}`);

  if (args.apply) {
    if (needDep) deps[PLUGIN_NAME] = linkSpec;
    if (needBundle) {
      if (!pkg.dsh) pkg.dsh = {};
      if (!pkg.dsh.profile) pkg.dsh.profile = {};
      if (!Array.isArray(pkg.dsh.profile.bundles)) pkg.dsh.profile.bundles = [];
      pkg.dsh.profile.bundles.push(PLUGIN_NAME);
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    console.log('  ✓ wrote', pkgPath);
  } else {
    console.log('\ndry-run. Re-run with --apply to write. Then:');
  }

  console.log('\n激活(在你自己的环境执行):');
  console.log(`  1) cd "${profileDir}"`);
  console.log('  2) pnpm install');
  console.log('  3) 重启该 profile: dsh --profile ' + profileName + '  (或 dsh web)');
  console.log('\n⚠️ 该插件是 dsh.client 插件;若其 client bundle 加载失败,会影响整个 web 启动。');
  console.log('   建议先在一个临时/测试 profile 上验证,再用于正式 web profile。');
}

main();
