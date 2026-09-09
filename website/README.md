# DSHwork 官网

`dshwork.ai` 落地页:纯静态站点(HTML + CSS + 原生 JS),无构建步骤。

## 本地预览

```bash
cd dshwork/website
python -m http.server 5173
# 打开 http://localhost:5173
```

或直接双击 `index.html`。

## 下载文件放置

下载区引用以下两个文件(占位链接,构建桌面应用后把产物放进来):

| 引用路径 | 实际产物 |
|---|---|
| `website/dist/DSHwork-Setup-0.1.0.exe` | Windows 构建产物(`desktop/dist/` 下的 NSIS 安装包) |
| `website/dist/DSHwork-0.1.0.dmg` | macOS 构建产物(`desktop/dist/` 下的 DMG) |

> 当前 `dist/` 目录没有实际安装包。发布前:先在 `desktop/` 构建,再把安装包复制/软链到 `website/dist/`(文件名与 `index.html` 里的 `href` 保持一致),或直接把下载链接改为 GitHub Releases 的固定地址。

## 占位资源

- `assets/img/favicon.png`:占位。请替换为 DSHwork 图标(建议 128×128 圆角 PNG)。
- 未放置图片时,首页 brand 的 favicon 图可能显示空图,不影响其它内容。

## 待替换

- GitHub 仓库地址:当前写 `https://github.com/DeepSeek-club/dshwork`(占位),请改为真实仓库。
- 下载 `href`:见上表。
- 联系邮箱:`hello@deepseek.club`。

## 结构

```
website/
├─ index.html            落地页
├─ assets/
│  ├─ css/style.css      aurora 主题 + 工作台 mock
│  ├─ js/main.js         双语切换 / 滚动导航 / 粒子
│  └─ img/               图标占位
└─ dist/                 下载安装包(发布时放入)
```
