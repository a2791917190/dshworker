'use strict';

/**
 * DSHwork 文件日志:写到 $DSH_HOME/logs/dshwork.log(可用 DSHWORK_LOG 覆盖)。
 * 用于在无控制台的打包客户端里诊断「Harness 为什么没拉起」。同时会 console.warn 一份。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function logFile() {
  if (process.env.DSHWORK_LOG) return process.env.DSHWORK_LOG;
  const base = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
  return path.join(base, 'logs', 'dshwork.log');
}

let cached = null;
function ensurePath() {
  if (cached) return cached;
  const f = logFile();
  try {
    fs.mkdirSync(path.dirname(f), { recursive: true });
  } catch (_) {}
  cached = f;
  return f;
}

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args
    .map((a) => (typeof a === 'string' ? a : safeJson(a)))
    .join(' ')}\n`;
  try {
    fs.appendFileSync(ensurePath(), line);
  } catch (_) {}
  // 同步到标准输出便于开发/调试
  // eslint-disable-next-line no-console
  console.warn(line.trimEnd());
}

function safeJson(v) {
  try {
    return JSON.stringify(v);
  } catch (_) {
    return String(v);
  }
}

module.exports = { log, logFile };
