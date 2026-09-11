'use strict';

/**
 * 随包内置技能:把 DSHwork 内置的 SKILL.md 安装到当前 harness home 的技能目录。
 *
 * 技能目录解析(harness 会扫描):
 *   - 用户级:`$DSH_HOME/skills/<name>/SKILL.md`
 * 参考 @deepseek-ai/dsh-skill-filesystem 的 roots。
 *
 * 幂等:目标已存在则跳过(不覆盖用户后续的改动)。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { log } = require('./log');

/** 内置技能源目录:打包后在 <resources>/skills;开发态在 ../../../plugins/dshwork-skills。 */
function bundledSkillsDir() {
  const candidates = [];
  if (process.resourcesPath) candidates.push(path.join(process.resourcesPath, 'skills'));
  candidates.push(path.join(__dirname, '..', '..', '..', 'plugins', 'dshwork-skills'));
  for (const c of candidates) {
    try {
      if (c && fs.existsSync(c)) return c;
    } catch (_) {
      /* 跳过不可读候选 */
    }
  }
  return null;
}

/** 目标技能目录:$DSH_HOME/skills(当前 harness home)。 */
function skillsTargetDir() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh');
  return path.join(home, 'skills');
}

/**
 * 把随包内置技能复制进技能目录(缺失才复制)。
 * @returns {{installed: string[], skipped: string[], src: (string|null), dest: string}}
 */
function installBundledSkills() {
  const src = bundledSkillsDir();
  const dest = skillsTargetDir();
  const result = { installed: [], skipped: [], src, dest };
  if (!src) {
    log('[skills] bundled skills dir not found; skip');
    return result;
  }
  let entries = [];
  try {
    entries = fs.readdirSync(src, { withFileTypes: true });
  } catch (err) {
    log('[skills] read failed:', err && err.message);
    return result;
  }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const srcSkill = path.join(src, e.name, 'SKILL.md');
    if (!fs.existsSync(srcSkill)) continue;
    const destSkill = path.join(dest, e.name, 'SKILL.md');
    try {
      if (fs.existsSync(destSkill)) {
        result.skipped.push(e.name);
        continue;
      }
      fs.mkdirSync(path.dirname(destSkill), { recursive: true });
      fs.copyFileSync(srcSkill, destSkill);
      result.installed.push(e.name);
    } catch (err) {
      log('[skills] copy failed for', e.name, ':', err && err.message);
    }
  }
  if (result.installed.length) log('[skills] installed bundled skills:', result.installed.join(', '));
  return result;
}

module.exports = {
  bundledSkillsDir,
  skillsTargetDir,
  installBundledSkills
};
