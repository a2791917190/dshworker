# 内置 Harness(可选)

把「未修改的固定版本」DeepSeek Harness 连同其依赖放进本目录,`desktop/vendor/dsh/`,
发布前 `electron-builder` 会通过 `package.json` 的 `extraResources` 把它整体打进
`resources/vendor/dsh`。

`src/main/harness.js` 的 `findBundledHarness()` 会按以下优先级查找内置 Harness:

1. 环境变量 `DSHWORK_HARNESS_DIR`
2. 打包后的 `resources/vendor/dsh`
3. 开发态 `desktop/vendor/dsh`
4. 开发态 `desktop/node_modules/@deepseek-ai/dsh`

**当前目录是空的** → 客户端找不到内置 Harness 时,会自动退回 `npx @deepseek-ai/dsh@内置版本 web`
兜底(需本机有 node/npm 且能联网)。若你想让客户端完全自包含、离线开箱即用,请把固定版本的
`@deepseek-ai/dsh`(含其 node_modules 依赖)放入本目录后再打包。
