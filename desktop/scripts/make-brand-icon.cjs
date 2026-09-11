'use strict';

/**
 * 从 website/assets/img/logo.png 裁出「鲸鱼+笔记本」图标。
 * 自动探测:按列扫描内容,取第一段连续内容(图标),再裁其包围盒,补成正方形(透明)。
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

const ALPHA_MIN = 16; // 视为有内容的 alpha 阈值

async function main() {
  if (!fs.existsSync(srcLogo)) {
    console.error('找不到:', srcLogo);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  const meta = await sharp(srcLogo).metadata();
  const { data, info } = await sharp(srcLogo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  console.log('源图尺寸:', width, 'x', height, 'channels:', channels);

  const colHas = (x) => {
    for (let y = 0; y < height; y++) if (data[(y * width + x) * channels + 3] > ALPHA_MIN) return true;
    return false;
  };
  const rowHas = (y, x0, x1) => {
    for (let x = x0; x < x1; x++) if (data[(y * width + x) * channels + 3] > ALPHA_MIN) return true;
    return false;
  };

  // 找出所有「内容列」的连续段
  const runs = [];
  let start = -1;
  for (let x = 0; x < width; x++) {
    if (colHas(x)) {
      if (start < 0) start = x;
    } else if (start >= 0) {
      runs.push([start, x - 1]);
      start = -1;
    }
  }
  if (start >= 0) runs.push([start, width - 1]);
  console.log('内容列分段(前 6 段):', JSON.stringify(runs.slice(0, 6)));

  if (runs.length === 0) {
    console.error('未检测到内容');
    process.exit(1);
  }

  // 第一段 = 图标(鲸鱼+笔记本)
  const [gx0, gx1] = runs[0];
  // 该段内的行范围
  let gy0 = 0;
  let gy1 = height - 1;
  while (gy0 < height && !rowHas(gy0, gx0, gx1 + 1)) gy0++;
  while (gy1 > gy0 && !rowHas(gy1, gx0, gx1 + 1)) gy1--;

  const cw = gx1 - gx0 + 1;
  const ch = gy1 - gy0 + 1;
  const side = Math.max(cw, ch);
  const padX = side - cw;
  const padY = side - ch;
  console.log(`图标包围盒: x=${gx0}..${gx1} (${cw}), y=${gy0}..${gy1} (${ch}) -> 方形 ${side}`);

  const buf = await sharp(srcLogo)
    .ensureAlpha()
    .extract({ left: gx0, top: gy0, width: cw, height: ch })
    .extend({
      top: Math.floor(padY / 2),
      bottom: Math.ceil(padY / 2),
      left: Math.floor(padX / 2),
      right: Math.ceil(padX / 2),
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  fs.writeFileSync(outPng, buf);
  fs.writeFileSync(outB64, 'data:image/png;base64,' + buf.toString('base64'), 'utf8');
  console.log('已输出:', outPng, `(${side}x${side}, ${buf.length} bytes)`);
  console.log('已输出:', outB64);
}

main().catch((err) => {
  console.error('make-brand-icon failed:', err && err.message);
  process.exit(1);
});
