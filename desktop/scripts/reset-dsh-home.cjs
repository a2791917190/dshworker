'use strict';

/**
 * 安全删除 DSHwork 私有 home。
 *
 * 为什么不能直接 `rmdir /s /q`:
 * 私有 home 里现在有指向用户真实 `~/.dsh` 的目录链接(junction / symlink)——
 * sessions / storages / attachments / skills。Windows 的 `rmdir /s` 会**穿透 junction**
 * 把目标里的内容一起删掉,等于顺手删掉用户的会话历史与附件。
 * 这里自己做递归:遇到链接只摘链接本身(绝不跟随),再删剩余的真实文件。
 *
 * 用法:
 *   node scripts/reset-dsh-home.cjs              # 删默认位置
 *   node scripts/reset-dsh-home.cjs <homePath>   # 删指定位置
 *
 * 默认位置:
 *   %LOCALAPPDATA%\dshwork\dsh-home
 *   %APPDATA%\dshwork\dsh-home
 *   ~/.dshwork/dsh-home
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

function defaultHomes() {
  const out = [];
  if (process.env.LOCALAPPDATA) out.push(path.join(process.env.LOCALAPPDATA, 'dshwork', 'dsh-home'));
  if (process.env.APPDATA) out.push(path.join(process.env.APPDATA, 'dshwork', 'dsh-home'));
  out.push(path.join(os.homedir(), '.dshwork', 'dsh-home'));
  return out;
}

/** 摘掉链接本身,不跟随目标(junction 在 Windows 上必须用 rmdir)。 */
function removeLink(link) {
  try {
    fs.unlinkSync(link);
  } catch (_) {
    fs.rmdirSync(link);
  }
}

/**
 * 递归删除目录树;链接只摘链接。
 * @returns {{ removed: boolean, links: number }}
 */
function safeRemove(target) {
  let st;
  try {
    st = fs.lstatSync(target);
  } catch (_) {
    return { removed: false, links: 0 };
  }

  if (st.isSymbolicLink()) {
    removeLink(target); // ← 关键:只摘链接,目标数据毫发无损
    return { removed: true, links: 1 };
  }

  if (!st.isDirectory()) {
    fs.unlinkSync(target);
    return { removed: true, links: 0 };
  }

  let links = 0;
  let entries = [];
  try {
    entries = fs.readdirSync(target);
  } catch (_) {
    entries = [];
  }
  for (const name of entries) {
    links += safeRemove(path.join(target, name)).links;
  }
  fs.rmdirSync(target);
  return { removed: true, links };
}

function main() {
  const args = process.argv.slice(2);
  const homes = args.length > 0 ? args : defaultHomes();
  let totalLinks = 0;
  let removed = 0;

  for (const home of homes) {
    if (!fs.existsSync(home)) {
      console.log('  (skip) not found:', home);
      continue;
    }
    try {
      const r = safeRemove(home);
      totalLinks += r.links;
      if (r.removed) removed++;
      console.log(`  removed: ${home}  (unlinked ${r.links} link(s); targets untouched)`);
    } catch (err) {
      console.error(`  FAILED: ${home} :: ${err && err.message}`);
      process.exitCode = 1;
    }
  }

  console.log(`\ndone. removed ${removed} home(s), unlinked ${totalLinks} link(s) without following.`);
}

main();
