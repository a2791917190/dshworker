# 内置 Harness(由 vendor 生成)

`node_modules/@deepseek-ai/dsh/` 放随包内置的固定版本 DeepSeek Harness(含其依赖闭包)。
当前内容:**0.1.5-rc.1**(版本号由 `desktop/config/harness.json` 的 `bundledVersion` 记录)。

`src/main/harness.js` 的 `findBundledHarness()` 会找
`<resources>/vendor/harness/node_modules/@deepseek-ai/dsh`(打包后)或环境变量 `DSHWORK_HARNESS_DIR`。

## 怎么生成

**联网**(推荐,和官方 pnpm-workspace 布局一致):

```sh
node plugins/vendor-runtime.cjs          # 仓库根目录下
```

**离线**(从一台已装好全局 `@deepseek-ai/dsh` 的机器搬):

```powershell
robocopy "$env:APPDATA\npm\node_modules\@deepseek-ai\dsh" `
         "desktop\vendor\harness\node_modules\@deepseek-ai\dsh" /E
```

该包是**自包含**的(依赖嵌在它自己的 `node_modules` 里),所以直接搬过来就能解析。

## 注意

本目录的**内容不入库**(200MB+),只保留这个 README 作为占位 —— `package.json` 的
`extraResources` 引用本目录,干净检出时必须存在,否则构建会失败。
