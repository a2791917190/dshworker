# 图标占位说明

构建前请把真实图标放到本目录,electron-builder 会按 `package.json` 的 `build` 配置引用:

| 文件 | 用途 | 要求 |
|---|---|---|
| `icon.ico` | Windows 应用图标 | 至少 256×256 的 .ico |
| `icon.icns` | macOS 应用图标 | .icns(可由 1024×1024 png 生成) |
| `tray.png` | 系统托盘图标 | 建议 32×32 或 44×44 png(模板用 32×32) |

> 当前目录只有本说明,没有实际图标文件;未放置图标时 electron-builder 会用 Electron 默认图标,可正常构建,只是外观为占位。
