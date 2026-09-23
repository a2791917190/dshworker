# 内置 Node 运行时(由 vendor 生成)

放随包内置的 node,打包后由 `package.json` 的 `extraResources`
映射到 **`<resources>/node`**(`src/main/node-runtime.js` 的 `findBundledNode()` 找这里)。

- Windows:`node.exe` + `npm.cmd` 等
- macOS / Linux:`bin/node`

当前内容:**Node 24.19.0**(版本号由 `desktop/config/harness.json` 的 `nodeVersion` 记录)。

## 怎么生成

```sh
node plugins/vendor-runtime.cjs          # 从 nodejs.org 或其镜像下载
```

国内可指定镜像:`--node-mirror https://npmmirror.com/mirrors/node`

## 注意

本目录的**内容不入库**(100MB+),只保留这个 README 作为占位 —— `package.json` 的
`extraResources` 引用本目录,干净检出时必须存在,否则构建会失败。
