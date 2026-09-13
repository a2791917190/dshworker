'use strict';

/**
 * DSHwork 私有 DSH_HOME:可执行部分自包含,用户数据与全局 ~/.dsh 共享。
 *
 * 为什么需要私有 home:
 * 内置 harness 启动时会执行 `healProfilesModuleFallback`,在
 * `$DSH_HOME/profiles/node_modules` 里建一个指向「本次安装内置 dsh」的 Junction。
 * 只要那台机器已经装过全局 harness(或从别的路径运行过本客户端),该 Junction 就指向
 * 别处;Windows 上 `unlink` 一个目录 Junction 会 EPERM,导致内置 harness 启动即崩溃。
 * 所以 `profiles/`(可执行包、插件激活、锁文件、包管理器状态)必须隔离。
 *
 * 为什么还要共享数据:
 * 完全隔离的代价是读不到用户已有的 `~/.dsh` —— 会话、工作区、设置全都不可见。
 * 官方桌面端的做法是「共享 $DSH_HOME 下的数据,只隔离可执行部分」。这里保持 DSH_HOME
 * 私有(避免内置 0.1.x 与全局 harness 争抢同一份 profiles/node_modules 而版本拉锯),
 * 但把用户的**数据项**逐个链接进私有 home:
 *   - 目录(sessions/storages/attachments/skills)→ 目录链接(junction / dir symlink);
 *   - 文件(settings.yaml/.credentials.yaml/.anonymous-user-id)→ 硬链接;
 *     硬链接不可用(跨卷/无权限)时退化为「取较新者同步 + 拷贝」,并且每次启动都重新同步,
 *     保证应用内的改动最终会回到全局 home。
 *
 * 可用环境变量覆盖:
 *   DSHWORK_DATA_DIR   私有 DSH_HOME 的父目录(默认取 Electron userData)
 *   DSHWORK_ISOLATED=0 禁用隔离,直接用全局 ~/.dsh(可执行部分也共享,有版本冲突风险)
 *   DSHWORK_SHARE=0    仍然隔离,但不共享用户数据(退回旧的纯隔离行为)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { log } = require('./log');

/**
 * 与全局 home 共享的数据目录(整目录链接)。
 * `attachments` 必须一起共享 —— 会话里的图片/附件按 id 存在那里,只共享 sessions 会读到断链。
 */
const SHARED_DIRS = ['sessions', 'storages', 'attachments', 'skills'];

/** 与全局 home 共享的数据文件(优先硬链接)。 */
const SHARED_FILES = ['settings.yaml', '.credentials.yaml', '.anonymous-user-id'];

/** 传统全局 home(~/.dsh),用户真实数据所在。 */
function globalDshHome() {
  if (process.env.DSH_HOME) return process.env.DSH_HOME;
  return path.join(os.homedir(), '.dsh');
}

/** 本客户端应使用的私有 DSH_HOME。 */
function dedicatedHome(appOrOptions) {
  const base = appOrOptions && typeof appOrOptions.getPath === 'function'
    ? appOrOptions.getPath('userData')
    : (typeof appOrOptions === 'string' ? appOrOptions : (process.env.DSHWORK_DATA_DIR || path.join(os.homedir(), '.dshwork')));
  return path.join(base, 'dsh-home');
}

/** 路径是否存在(不跟随链接)。 */
function exists(p) {
  try {
    fs.lstatSync(p);
    return true;
  } catch (_) {
    return false;
  }
}

/** 是否为符号链接/junction。 */
function isLink(p) {
  try {
    return fs.lstatSync(p).isSymbolicLink();
  } catch (_) {
    return false;
  }
}

/** 两个路径是否指向同一份文件(硬链接或同一文件)。 */
function sameFile(a, b) {
  try {
    const sa = fs.statSync(a);
    const sb = fs.statSync(b);
    return sa.ino === sb.ino && sa.dev === sb.dev;
  } catch (_) {
    return false;
  }
}

/** a 是否比 b 新。 */
function isNewer(a, b) {
  try {
    return fs.statSync(a).mtimeMs > fs.statSync(b).mtimeMs;
  } catch (_) {
    return false;
  }
}

/**
 * 把 src 目录的内容并入 dest(不覆盖 dest 已存在的同名项)。
 * 用于把「升级前遗留在私有 home 里的数据」迁回全局 home,避免用户数据被孤立。
 * @returns {boolean} 是否全部并入成功(有残留则返回 false,调用方不得删除 src)。
 */
function mergeDirInto(src, dest) {
  let entries = [];
  try {
    entries = fs.readdirSync(src, { withFileTypes: true });
  } catch (_) {
    return false;
  }
  try {
    fs.mkdirSync(dest, { recursive: true });
  } catch (_) {
    return false;
  }
  let ok = true;
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (exists(to)) continue; // 全局侧已有 → 以全局为准
    try {
      fs.renameSync(from, to);
    } catch (_) {
      try {
        fs.cpSync(from, to, { recursive: true, force: false, errorOnExist: false });
        fs.rmSync(from, { recursive: true, force: true });
      } catch (_) {
        ok = false;
      }
    }
  }
  return ok;
}

/**
 * 摘掉一个目录链接,**不跟随目标**。
 * Windows 上 junction 是目录 reparse point,`unlink` 会 EPERM,必须用 `rmdir` ——
 * `rmdir` 只删除链接本身,不会动目标里的内容。
 */
function removeLink(link) {
  try {
    fs.unlinkSync(link);
  } catch (_) {
    fs.rmdirSync(link);
  }
}

/**
 * 把私有 home 的目录指向全局 home 的同名目录。
 * 已存在的真实目录会先尝试并入全局(不丢数据);并残留则保留原目录,不强行删除。
 * @returns {'linked'|'kept'|'occupied'|'failed'}
 */
function linkDir(target, link) {
  try {
    fs.mkdirSync(target, { recursive: true });
    if (exists(link)) {
      if (isLink(link)) {
        let current;
        try {
          current = fs.readlinkSync(link);
        } catch (_) {
          current = undefined;
        }
        if (current === target) return 'kept';
        removeLink(link); // 只拆链接,不动目标
      } else {
        const merged = mergeDirInto(link, target);
        let rest = [];
        try {
          rest = fs.readdirSync(link);
        } catch (_) {
          rest = [];
        }
        if (!merged || rest.length > 0) return 'occupied'; // 有残留 → 保守起见不碰
        fs.rmdirSync(link);
      }
    }
    fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
    return 'linked';
  } catch (err) {
    log('[dsh-home] share dir failed:', link, err && err.message);
    return 'failed';
  }
}

/**
 * 把私有 home 的文件指向全局 home 的同名文件(硬链接优先)。
 * 两边都有且不是同一份时,以**较新**的一方为准单向补齐 —— 这样应用内改过的配置/凭据
 * 会在下次启动时回到全局 home,而不会永远留在私有孤岛里。
 * @returns {'hardlinked'|'kept'|'copied'|'absent'|'failed'}
 */
function linkFile(target, link) {
  try {
    const hasTarget = exists(target);
    const hasLink = exists(link);

    if (hasTarget && hasLink) {
      if (sameFile(link, target)) return 'kept';
      if (isNewer(link, target)) fs.copyFileSync(link, target);
      fs.unlinkSync(link);
    } else if (!hasTarget && hasLink) {
      fs.copyFileSync(link, target); // 全局没有、私有有 → 内容回到全局
      fs.unlinkSync(link);
    } else if (!hasTarget && !hasLink) {
      return 'absent'; // 两边都没有 → 不凭空造文件
    }
    // 其余情况(全局有、私有没有)直接落到下面建链接。

    try {
      fs.linkSync(target, link); // 硬链接:两边同一份 inode,任一侧写入彼此可见
      return 'hardlinked';
    } catch (_) {
      fs.copyFileSync(target, link); // 跨卷/无权限 → 退化拷贝(下次启动会重新同步)
      return 'copied';
    }
  } catch (err) {
    log('[dsh-home] share file failed:', link, err && err.message);
    return 'failed';
  }
}

/**
 * 把全局 home 的用户数据(会话/工作区/附件/技能/设置/凭据)链接进私有 home。
 * 任何一项失败都不致命:私有 home 仍然可用,只是该项没共享上。
 * @param {string} home - 私有 DSH_HOME
 * @param {string} srcHome - 全局 DSH_HOME(~/.dsh)
 * @returns {{dirs: number, files: number}} 成功共享的数量
 */
function shareUserData(home, srcHome) {
  if (!srcHome || srcHome === home) return { dirs: 0, files: 0 };
  let dirs = 0;
  let files = 0;
  for (const name of SHARED_DIRS) {
    const r = linkDir(path.join(srcHome, name), path.join(home, name));
    if (r === 'linked' || r === 'kept') dirs++;
  }
  for (const name of SHARED_FILES) {
    const r = linkFile(path.join(srcHome, name), path.join(home, name));
    if (r === 'hardlinked' || r === 'kept' || r === 'copied') files++;
  }
  return { dirs, files };
}

/** 从源 home 拷贝「模型凭据/设置」到目标 home(已存在则不覆盖)。 */
function copyCredentials(srcHome, destHome) {
  if (!srcHome || srcHome === destHome) return false;
  let copied = false;
  for (const name of ['.credentials.yaml', 'settings.yaml', '.anonymous-user-id']) {
    const src = path.join(srcHome, name);
    const dest = path.join(destHome, name);
    try {
      if (fs.existsSync(src) && !fs.existsSync(dest)) {
        fs.copyFileSync(src, dest);
        copied = true;
      }
    } catch (_) {
      // 单个文件失败不致命;其余照常
    }
  }
  return copied;
}

/**
 * 记住第一次解析出的「来源 home」。
 * `ensureDedicatedHome` 会把 `process.env.DSH_HOME` 改写成私有 home,同一次进程里再调用
 * 时 `globalDshHome()` 就会返回私有 home —— 那会把私有 home 当成共享来源(静默失效),
 * 所以来源只认第一次解析的结果。
 */
let sourceHomeMemo = null;

/**
 * 确保 DSHwork 使用私有 DSH_HOME:
 *   1. 计算并设置 process.env.DSH_HOME 为私有 home;
 *   2. 建目录;
 *   3. 把全局 ~/.dsh 的用户数据链接进来(可用 DSHWORK_SHARE=0 关闭);
 *   4. 补拷仍缺失的模型凭据(共享关闭时的兜底);
 *   5. 清空私有 home 的 profiles/node_modules(避免 stale Junction 导致 EPERM)。
 * @param {object} [appOrOptions] Electron app(或一个 userData 路径 / 字符串),测试时可传字符串。
 * @returns {{ home: string, isolated: boolean }}
 */
function ensureDedicatedHome(appOrOptions) {
  if (process.env.DSHWORK_ISOLATED === '0') {
    const home = globalDshHome();
    log('[dsh-home] isolation disabled; using global home', home);
    return { home, isolated: false };
  }

  const home = dedicatedHome(appOrOptions);
  // 在改写 DSH_HOME 之前先固定「来源 home」:优先调用方显式指定的 DSH_HOME;
  // 若它已经就是我们的私有 home(同进程第二次调用),则沿用上次记下的来源。
  const explicit = process.env.DSH_HOME;
  let srcHome;
  if (explicit && explicit !== home) {
    srcHome = explicit;
    sourceHomeMemo = explicit;
  } else {
    srcHome = sourceHomeMemo || globalDshHome();
  }

  const prev = process.env.DSH_HOME;
  process.env.DSH_HOME = home;
  fs.mkdirSync(home, { recursive: true });

  // 用户数据共享(默认开):会话/工作区/附件/技能 + 设置/凭据。
  if (process.env.DSHWORK_SHARE !== '0') {
    const shared = shareUserData(home, srcHome);
    log('[dsh-home] shared user data from', srcHome, `(dirs=${shared.dirs}, files=${shared.files})`);
  }

  // 兜底:共享关闭、或某项链接失败时,至少把凭据/设置补上。
  const copied = copyCredentials(srcHome, home);
  if (copied) log('[dsh-home] copied model credentials from', srcHome, 'to', home);

  // 关键:清空私有 home 的 flat module fallback,让 harness 为当前安装路径重建 Junction。
  // 只清私有的这一份;全局 ~/.dsh/profiles/node_modules 不碰(那是全局 harness 的)。
  const pinned = path.join(home, 'profiles', 'node_modules');
  try {
    if (fs.existsSync(pinned)) {
      fs.rmSync(pinned, { recursive: true, force: true });
      log('[dsh-home] cleared stale profiles/node_modules at', pinned);
    }
  } catch (err) {
    log('[dsh-home] could not clear profiles/node_modules:', err && err.message);
  }

  log('[dsh-home] using private DSH_HOME:', home, prev !== home ? '(was ' + prev + ')' : '');
  return { home, isolated: true };
}

module.exports = {
  globalDshHome,
  dedicatedHome,
  copyCredentials,
  shareUserData,
  ensureDedicatedHome,
  SHARED_DIRS,
  SHARED_FILES
};
