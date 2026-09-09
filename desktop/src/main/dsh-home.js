'use strict';

/**
 * DSHwork 私有 DSH_HOME(让客户端自包含、不污染/不依赖全局 ~/.dsh)。
 *
 * 背景:内置 harness 启动时会执行 `healProfilesModuleFallback`,在
 * `$DSH_HOME/profiles/node_modules` 里建一个指向「本次安装内置 dsh」的 Junction。
 * 只要那台机器已经装过全局 harness(或从别的路径运行过本客户端),该 Junction 就指向
 * 别处;Windows 上 `unlink` 一个目录 Junction 会 EPERM,导致内置 harness 启动即崩溃。
 *
 * 解法:让客户端使用一个**私有、独立**的 DSH_HOME(默认 `<userData>/dsh-home`),
 * 完全隔离于全局 `~/.dsh`:
 *  - 不与全局 harness 的 Junction 冲突;
 *  - 每次启动前清空私有 home 的 `profiles/node_modules`,令 harness 为「当前安装路径」
 *    重新生成 Junction(移动/换路径解压也不会踩 EPERM);
 *  - 首次运行把全局 `~/.dsh` 的模型凭据拷进私有 home,保证模型可用。
 *
 * 可用环境变量覆盖数据目录:
 *   DSHWORK_DATA_DIR   私有 DSH_HOME 的父目录(默认取 Electron userData)
 *   DSHWORK_ISOLATED=0 禁用隔离,继续用全局 ~/.dsh
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { log } = require('./log');

/** 传统全局 home(~/.dsh),用于读取模型凭据。 */
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
 * 确保 DSHwork 使用私有 DSH_HOME:
 *   1. 计算并设置 process.env.DSH_HOME 为私有 home;
 *   2. 建目录;
 *   3. 首次运行拷贝全局 ~/.dsh 的模型凭据;
 *   4. 清空私有 home 的 profiles/node_modules(避免 stale Junction 导致 EPERM)。
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
  // 在改写 DSH_HOME 之前先固定「来源 home」(全局 ~/.dsh)。
  const srcHome = globalDshHome();
  const prev = process.env.DSH_HOME;
  process.env.DSH_HOME = home;
  fs.mkdirSync(home, { recursive: true });

  // 从全局 ~/.dsh 拷贝模型凭据(仅首次;不影响已有本地配置)
  const copied = copyCredentials(srcHome, home);
  if (copied) log('[dsh-home] copied model credentials from', srcHome, 'to', home);

  // 关键:清空私有 home 的 flat module fallback,让 harness 为当前安装路径重建 Junction。
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
  ensureDedicatedHome
};
