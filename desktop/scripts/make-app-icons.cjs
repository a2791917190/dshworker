'use strict';

/**
 * 从品牌 mark 生成 Electron 需要的应用图标:
 *   assets/icons/icon.ico   — Windows 应用图标(16/24/32/48/64/128/256,内嵌 PNG)
 *   assets/icons/icon.icns  — macOS 应用图标
 *   assets/icons/tray.png   — 系统托盘图标(32×32)
 *
 * 源图是 `assets/brand/logo-mark.png`(140×140,由 make-brand-icon.cjs 裁出)。
 * ⚠️ 256 档是**放大**出来的:源图分辨率不够(140 < 256),这一档会偏软。
 *    有更大/矢量的原图时,直接替换 logo-mark.png 再跑本脚本即可。
 *
 * 用法:
 *   node scripts/make-app-icons.cjs
 *   node scripts/make-app-icons.cjs --flat     # 加白色圆角底板(深色任务栏上更清楚)
 *
 * 用 vendored harness 里的 sharp,和 make-brand-icon.cjs 保持一致。
 */

const fs = require('fs');
const path = require('path');

const desktopDir = path.join(__dirname, '..');
const srcMark = path.join(desktopDir, 'assets', 'brand', 'logo-mark.png');
const outDir = path.join(desktopDir, 'assets', 'icons');
const sharpPath = path.join(desktopDir, 'dist', 'win-unpacked', 'resources', 'vendor', 'harness', 'node_modules', 'sharp');
const sharp = require(fs.existsSync(sharpPath) ? sharpPath : 'sharp');

const FLAT = process.argv.includes('--flat');

/** ICO 容器:头部 + 目录项 + 各档 PNG(Windows Vista+ 支持 PNG 内嵌)。 */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;
  entries.forEach((entry, i) => {
    const at = i * 16;
    const dim = entry.size >= 256 ? 0 : entry.size; // 0 表示 256
    dir.writeUInt8(dim, at + 0);
    dir.writeUInt8(dim, at + 1);
    dir.writeUInt8(0, at + 2); // 调色板数
    dir.writeUInt8(0, at + 3); // reserved
    dir.writeUInt16LE(1, at + 4); // 颜色平面
    dir.writeUInt16LE(32, at + 6); // 位深
    dir.writeUInt32LE(entry.png.length, at + 8);
    dir.writeUInt32LE(offset, at + 12);
    offset += entry.png.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.png)]);
}

/** ICNS 容器:magic + 总长 + 若干 (type, size, PNG) 块。 */
function buildIcns(entries) {
  const chunks = entries.map((entry) => {
    const head = Buffer.alloc(8);
    head.write(entry.type, 0, 4, 'ascii');
    head.writeUInt32BE(8 + entry.png.length, 4);
    return Buffer.concat([head, entry.png]);
  });
  const body = Buffer.concat(chunks);
  const head = Buffer.alloc(8);
  head.write('icns', 0, 4, 'ascii');
  head.writeUInt32BE(8 + body.length, 4);
  return Buffer.concat([head, body]);
}

/** 白色圆角底板(可选):深色任务栏上深蓝 logo 才看得清。 */
function flatBackdrop(size) {
  const r = Math.round(size * 0.18);
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="0" y="0" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#ffffff"/>` +
    `</svg>`
  );
}

/** 渲染一档位图;大于源图分辨率时用 lanczos3 放大并轻微锐化。 */
async function render(size, master) {
  const natural = master.info.width; // 140
  let img = sharp(master.buffer);
  if (size > natural) {
    img = img.resize(size, size, { kernel: 'lanczos3', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).sharpen();
  } else {
    img = img.resize(size, size, { kernel: 'lanczos3', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }
  const markPng = await img.png().toBuffer();
  if (!FLAT) return markPng;

  // 底板 + 内缩 12% 的 logo 叠加
  const inner = Math.round(size * 0.76);
  const logo = await sharp(master.buffer)
    .resize(inner, inner, { kernel: 'lanczos3', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp(flatBackdrop(size))
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(srcMark)) {
    console.error('缺少品牌 mark:', srcMark, '(先跑 desktop/scripts/make-brand-icon.cjs)');
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  const master = { buffer: fs.readFileSync(srcMark), info: await sharp(srcMark).metadata() };
  console.log(`源图: ${path.basename(srcMark)} ${master.info.width}x${master.info.height}${FLAT ? '  (白色圆角底板)' : ''}`);
  if (master.info.width < 256) {
    console.log(`⚠️  源图 ${master.info.width}px < 256px,256 档是放大出来的,会偏软。`);
  }

  // ① icon.ico —— 小档直接从源图缩(更清晰),256 档用放大结果
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const icoEntries = [];
  for (const size of icoSizes) icoEntries.push({ size, png: await render(size, master) });
  const ico = buildIco(icoEntries);
  fs.writeFileSync(path.join(outDir, 'icon.ico'), ico);
  console.log(`  ✓ icon.ico   ${icoSizes.join('/')}  ${ico.length} bytes`);

  // ② icon.icns
  const icnsPlan = [
    ['icp4', 16], ['icp5', 32], ['icp6', 64], ['ic07', 128], ['ic08', 256], ['ic09', 512],
    ['ic11', 32], ['ic12', 64], ['ic13', 256], ['ic14', 512]
  ];
  const cache = new Map();
  const icnsEntries = [];
  for (const [type, size] of icnsPlan) {
    if (!cache.has(size)) cache.set(size, await render(size, master));
    icnsEntries.push({ type, png: cache.get(size) });
  }
  const icns = buildIcns(icnsEntries);
  fs.writeFileSync(path.join(outDir, 'icon.icns'), icns);
  console.log(`  ✓ icon.icns  ${[...new Set(icnsPlan.map((p) => p[1]))].join('/')}  ${icns.length} bytes`);

  // ③ tray.png(32×32)+ 一张 256 预览方便肉眼检查
  fs.writeFileSync(path.join(outDir, 'tray.png'), await render(32, master));
  console.log('  ✓ tray.png   32×32');
  const preview = await render(256, master);
  fs.writeFileSync(path.join(outDir, 'preview-256.png'), preview);
  console.log('  ✓ preview-256.png  (用来肉眼检查放大质量)');

  console.log('\n完成。electron-builder 会按 package.json 的 build.win.icon / build.mac.icon 引用它们。');
}

main().catch((err) => {
  console.error('make-app-icons failed:', err && err.message);
  process.exit(1);
});
