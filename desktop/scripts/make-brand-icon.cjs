'use strict';

/**
 * 从 website/assets/img/logo.png 裁出「鲸鱼+笔记本」图标(左侧方形),
 * 输出 PNG + base64 data URI,供品牌客户端插件内嵌使用。
 *
 * 用法: node scripts/make-brand-icon.cjs
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..', '..');
const srcLogo = path.join(repoRoot, 'website', 'assets', 'img', 'logo.png');
const outDir = path.join(__dirname, '..', 'assets', 'brand');
const outPng = path.join(outDir, 'logo-mark.png');
const outB64 = path.join(outDir, 'logo-mark.base64.txt');

// 用 vendored harness 里的 sharp(win32-x64)做裁剪。
const sharpPath = path.join(__dirname, '..', 'dist', 'win-unpacked', 'resources', 'vendor', 'harness', 'node_modules', 'sharp');
const sharp = require(sharpPath);

async function main() {
  if (!fs.existsSync(srcLogo)) {
    console.error('找不到:', srcLogo);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });
  const meta = await sharp(srcLogo).metadata();
  console.log('源图尺寸:', meta.width, 'x', meta.height);

  // 图标在左侧,高度即整图高度;取一个略宽的区域,再补成正方形(透明)。
  const h = meta.height;
  const w = Math.min(112, meta.width);
  const side = Math.max(w, h);
  const pad = { top: 0, bottom: side - h, left: 0, right: side - w };
  const buf = await sharp(srcLogo)
    .extract({ left: 0, top: 0, width: w, height: h })
    .extend({ ...pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  fs.writeFileSync(outPng, buf);
  fs.writeFileSync(outB64, 'data:image/png;base64,' + buf.toString('base64'), 'utf8');
  console.log('已输出:', outPng, `(${w}x${h}, ${buf.length} bytes)`);
  console.log('已输出:', outB64);
}

main().catch((err) => {
  console.error('make-brand-icon failed:', err && err.message);
  process.exit(1);
});
