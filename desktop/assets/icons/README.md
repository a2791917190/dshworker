# 应用图标

由 `desktop/scripts/make-app-icons.cjs` 从品牌 mark 生成,**不要手改**:

```sh
cd desktop
npm run icons            # 透明底版本
npm run icons -- --flat  # 白色圆角底板(深色任务栏上更清楚)
```

源图:`desktop/assets/brand/logo-mark.png`(140×140,由 `scripts/make-brand-icon.cjs` 裁出)。

| 文件 | 用途 | 要求 |
|---|---|---|
| `icon.ico` | Windows 应用图标 | 内嵌 16/24/32/48/64/128/256 各档 PNG,≥256 满足 electron-builder |
| `icon.icns` | macOS 应用图标 | icp4/icp5/icp6/ic07/ic08/ic09 + ic11~ic14 |
| `tray.png` | 系统托盘图标 | 32×32 |

引用位置:`package.json` 的 `build.win.icon` / `build.mac.icon`;
`src/main/main.js` 的 `BrowserWindow.icon`(开发态窗口;打包后 Windows 用 exe 内嵌图标)。
`icon.ico` 同时列在 `build.files` 里,才能进 asar 供窗口图标读取。

## 已知限制

源图只有 **140×140**,而 256 档需要 256px —— 这一档是**放大**出来的(lanczos3 + 轻锐化),
大图标视图下会偏软。拿到更大或矢量的原图后,替换 `logo-mark.png` 再跑 `npm run icons` 即可。

`preview-transparent.png` / `preview-flat.png` 是两版的 256 预览,用来肉眼挑选,不参与打包。
