# 内置运行时(由 vendor 生成)

本目录放**随包内置的运行时**,`package.json` 的 `extraResources` 把它们打进应用:

```
desktop/vendor/
├── harness/          →  <resources>/vendor/harness   (内置 DeepSeek Harness,固定版本)
├── node/             →  <resources>/node             (内置 Node 运行时)
└── README.md
```

`src/main/harness.js` 的 `findBundledHarness()` 按以下优先级查找内置 Harness:

1. 环境变量 `DSHWORK_HARNESS_DIR`
2. 打包后 `<resources>/vendor/harness/node_modules/@deepseek-ai/dsh`
3. 开发态 `desktop/vendor/dsh`
4. 开发态 `desktop/node_modules/@deepseek-ai/dsh`

## 怎么填

**联网**(推荐):

```sh
node plugins/vendor-runtime.cjs      # 下载 node + npm/pnpm 安装 harness
```

**离线**(从一台已装好全局 `@deepseek-ai/dsh` 的机器搬,该包自包含):

```powershell
robocopy "$env:APPDATA\npm\node_modules\@deepseek-ai\dsh" `
         "desktop\vendor\harness\node_modules\@deepseek-ai\dsh" /E
robocopy "<已有的 node 目录>" "desktop\vendor\node" /E
```

各子目录的细节见 `harness/README.md` 与 `node/README.md`。

## 注意

- 本目录的**内容不入库**(300MB+);只保留各子目录的 README 作为占位。
  `extraResources` 引用这两个目录,**干净检出(如 CI)时目录必须存在**,否则构建会失败 ——
  所以 `.gitignore` 是「忽略内容、保留 README」,不要改成忽略整个目录。
- `desktop/config/harness.json` 记录当前内置的 `bundledVersion` 与 `nodeVersion`,
  换版本时**两处一起改**。
- 只放运行时(`dsh`、node),**不要**放 `node_modules` 之外的大文件。
