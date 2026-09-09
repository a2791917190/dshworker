# DSHwork · Harness 客户端插件

本目录存放把 DSHwork 工作台**作为真正的 DeepSeek Harness Cordis 客户端插件**嵌进 Harness 界面的组件。

| 条目 | 说明 |
|---|---|
| `dsh-client-ui-dshwork/` | DSHwork 工作台插件包:`sidebar.footer.action` 按钮 + `shell.overlay` 工作台面板(主页/任务/工作区/模板库/插件 + 模板卡)。 |
| `mount-into-profile.cjs` | 把该插件挂载到一个 dsh profile(与现有 `link:` + `dsh.profile.bundles` 生态一致,默认 dry-run)。 |
| `vendor-runtime.cjs` | 把 node + Harness vendor 进客户端(离线自包含,需在有 node/网络的机器上运行)。 |

> 桌面壳已自动挂载:`desktop/src/main/profile-mount.js` 会在拉起一个新的 Harness 实例前,
> 自动把本插件装入它启动的 profile(`dsh plugin --profile <name> add link:<插件目录>`)。
> 因此终端用户**无需**手动运行 `mount-into-profile.cjs`;它只在你手工开发/调试时有用。

## 挂载(在你自己环境执行)

```bash
node plugins/mount-into-profile.cjs            # dry-run 查看差异
node plugins/mount-into-profile.cjs --apply    # 写入目标 profile 的 package.json
cd <profile 目录>
pnpm install
dsh --profile web                              # 或 dsh web(重启生效)
```

详见 `dsh-client-ui-dshwork/README.md`。

## 为什么这么嵌(背景)

Harness 的 Web 界面是"会话为中心 + 侧边栏 + 输入坞",**没有独立的上层"4-Tab 页面" slot**。
所以 DSHwork 工作台不是做成一个新的顶层页面,而是作为**可开合的整块面板**:侧边栏底部一个
「DSHwork」按钮(`sidebar.footer.action`),点开全屏工作台(`shell.overlay`)。这就是
"嵌入 Harness 界面"的实现路径,且完全走官方 Cordis 客户端插件机制,不魔改上游。
