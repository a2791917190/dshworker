#!/usr/bin/env node
/**
 * patch-windows-hide.cjs — 给**已经装好**的 dsh 打 Windows 控制台隐藏补丁。
 *
 * 为什么需要单独一个脚本:`vendor-runtime.cjs` 只补「随包 vendor 进来的」那份 harness,
 * 而客户端启动时**优先用用户全局装的 dsh**(desktop/src/main/harness.js 的 findInstalledDsh)。
 * 所以全局那份不补,桌面上每跑一条命令照样弹控制台窗口。
 *
 * 用法:
 *   node plugins/patch-windows-hide.cjs                 # 自动找全局 dsh(npm -g / PATH)
 *   node plugins/patch-windows-hide.cjs <path>          # 指定 dsh 安装目录 / node_modules / app.asar 解包目录
 *   node plugins/patch-windows-hide.cjs --dry-run <path>
 *
 * 行为:
 *   - 幂等:文件里已有 windowsHide 直接跳过;
 *   - 写之前备份成 lib/index.js.bak-winhide(已存在则不覆盖备份);
 *   - 找不到锚点 → 报错退出 1,不静默放过(说明上游改写了这段,需要人看一眼)。
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { WINDOWS_HIDE_PATCHES } = require('./vendor-runtime.cjs');

const SUBPKG = 'dsh-subprocess-local';
const ENTRY = path.join('lib', 'index.js');

/** 单个文件打补丁;返回 'patched' | 'already' | 'missing'。 */
function patchFile(file, dryRun) {
  if (!fs.existsSync(file)) return 'missing';
  const src = fs.readFileSync(file, 'utf8');
  if (src.includes('windowsHide')) return 'already';

  const rule = WINDOWS_HIDE_PATCHES.find((r) => r.match.test(src));
  if (rule === void 0) {
    throw new Error(
      `${file}\n  既没有 windowsHide、也没有可识别的锚点 —— 上游可能改写了这段,`
      + '请人工确认 Windows 控制台窗口补丁是否还需要'
    );
  }
  const next = src.replace(rule.match, rule.replace);
  if (!next.includes('windowsHide')) throw new Error(`补丁写入失败(替换后仍无 windowsHide): ${file}`);

  if (!dryRun) {
    const bak = `${file}.bak-winhide`;
    if (!fs.existsSync(bak)) fs.writeFileSync(bak, src, 'utf8');
    fs.writeFileSync(file, next, 'utf8');
  }
  console.log(`  ✓ ${dryRun ? '[dry-run] ' : ''}已打补丁(${rule.label}): ${file}`);
  return 'patched';
}

/** 在给定目录附近找 dsh-subprocess-local/lib/index.js。 */
function findEntry(target) {
  let st;
  try {
    st = fs.statSync(target);
  } catch (_) {
    return null;
  }
  if (st.isFile()) return target.endsWith('.js') ? target : null;

  const candidates = [
    path.join(target, ENTRY),                                                          // target 就是 dsh-subprocess-local
    path.join(target, 'node_modules', '@deepseek-ai', SUBPKG, ENTRY),                  // 装在 target 下面
    path.join(target, '..', SUBPKG, ENTRY),                                            // target 是 node_modules/@deepseek-ai/dsh
    path.join(target, '..', '@deepseek-ai', SUBPKG, ENTRY),                            // target 是 node_modules
    path.join(target, 'node_modules', '@deepseek-ai', 'dsh', 'node_modules', '@deepseek-ai', SUBPKG, ENTRY),
    path.join(target, 'vendor', 'harness', 'node_modules', '@deepseek-ai', SUBPKG, ENTRY)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  // 兜底:有界深度递归(harnes 安装树不大;跳过明显无关的大目录)
  const skip = new Set(['.git', '.cache', '_cacache', 'dist', 'out', 'build', 'test', 'tests', '__tests__']);
  const walk = (dir, depth) => {
    if (depth > 5) return null;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
      return null;
    }
    for (const e of entries) {
      if (!e.isDirectory() || skip.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.name === SUBPKG && fs.existsSync(path.join(full, ENTRY))) return path.join(full, ENTRY);
      const hit = walk(full, depth + 1);
      if (hit) return hit;
    }
    return null;
  };
  return walk(target, 0);
}

/** 自动定位全局 dsh 安装目录。 */
function findGlobalDsh() {
  const candidates = [];
  if (process.env.APPDATA) candidates.push(path.join(process.env.APPDATA, 'npm', 'node_modules', '@deepseek-ai', 'dsh'));
  if (process.env.LOCALAPPDATA) candidates.push(path.join(process.env.LOCALAPPDATA, 'npm', 'node_modules', '@deepseek-ai', 'dsh'));
  if (process.env.PREFIX) candidates.push(path.join(process.env.PREFIX, 'lib', 'node_modules', '@deepseek-ai', 'dsh'));
  candidates.push(path.join('/usr/local/lib/node_modules', '@deepseek-ai', 'dsh'));
  candidates.push(path.join(os.homedir(), '.npm-global', 'lib', 'node_modules', '@deepseek-ai', 'dsh'));
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'package.json'))) return c;
  }
  return null;
}

function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const target = argv.find((a) => !a.startsWith('--'));

  const dir = target ? path.resolve(target) : findGlobalDsh();
  if (!dir) {
    throw new Error('没找到全局 dsh —— 请显式传路径:node plugins/patch-windows-hide.cjs <dsh 安装目录>');
  }
  if (!target) console.log('自动定位到全局 dsh:', dir);

  const entry = findEntry(dir);
  if (!entry) throw new Error(`在 ${dir} 里没找到 ${SUBPKG}/${ENTRY}`);

  const result = patchFile(entry, dryRun);
  if (result === 'already') console.log('  ✓ 已含 windowsHide —— 跳过:', entry);
  console.log(result === 'patched'
    ? '\n完成。下次启动 harness 生效(正在跑的那个进程不受影响)。'
    : '\n无需改动。');
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('\npatch-windows-hide failed:', err && err.message);
    process.exit(1);
  }
}

module.exports = { patchFile, findEntry, findGlobalDsh };
