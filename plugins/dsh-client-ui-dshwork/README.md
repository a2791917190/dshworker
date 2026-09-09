# @deepseek-ai/dsh-client-ui-dshwork

DSHwork 工作台 — 一个**真正的 DeepSeek Harness Cordis 客户端插件**。

它把 DSHwork 工作台(主页 / 任务 / 工作区 / 模板库 / 插件)作为一个**可点击弹开的面板**,
长进 Harness Web 界面:在侧边栏底部(`sidebar.footer.action`)加一个「DSHwork」按钮,
点击后在 `shell.overlay` 全屏面板里展开完整工作台。

> 独立社区项目,与深度求索 / DeepSeek 官方**无隶属、合作、授权或背书关系**。

## 它做了什么(纯 UI 插件)

- **节点半** `lib/index.js`:空 `apply()`(host 侧无行为)。
- **浏览器半** `lib/client.js`:通过 `window.__ModuleLoader__.load({id, factory})` 注册,
  在 `apply(ctx)` 里:
  - `ctx.locale.register("dshwork", { zh, en })` 注册双语字典;
  - `ctx.slots.inject("sidebar.footer.action", …)` 加一个工作台入口按钮;
  - `ctx.slots.inject("shell.overlay", …)` 注册可弹开的工作台面板(主页 / 任务 /
    工作区 / 模板库 / 插件 5 个 Tab + 模板卡),并**接入 Harness 真实数据**:
    - `inject` 声明 `sessions` / `workspaces` 服务,经 slot 的注入工厂透传给面板组件;
    - 主页的「最近工作」、任务的「会话列表」、工作区的「项目/工作区列表」都通过
      `ctx.sessions.list` / `ctx.workspaces.list`(snapshot store)实时读取;
    - 点击会话「打开」,点击工作区「新建会话 / 开始」,均调用 `ctx.sessions.open` /
      `ctx.workspaces.startSession` / `ctx.workspaces.create`;
    - 任何服务缺失时优雅回退到骨架文案,不阻塞整个 web 启动。

`package.json` 的 `dsh.client` 声明(`platform: "web"` + `exports["./client"] → ./lib/client.js`)
让 `dsh-client-modules` 把它作为 `/plugins/@deepseek-ai/dsh-client-ui-dshwork/client.js` 服务出去,
并组进 `window.__DSH_BOOT__`。

## 目录结构

```
plugins/dsh-client-ui-dshwork/
├─ package.json        dsh.client 声明 + exports["./client"]
├─ lib/
│  ├─ index.js         节点半(空 apply)
│  ├─ invariant.js     包级 invariant 伴生(可选)
│  ├─ client.js        浏览器 bundle(编译形态,免构建即可加载)
│  └─ types/           (类型声明占位)
└─ test/smoke.test.cjs 契约冒烟测试(node test/smoke.test.cjs)
```

## 如何使用(挂载到 dsh profile)

DSHwork 工作台要进入 Harness 界面,需把它装进某个 profile 并被 Loader 加载。
本包是 **bundle-ready**(自带 `cordis.patch.yml` + `dsh.bundle.patch`),挂载方式与生态里
其它自定义插件(`dsh-desktop-pet`、`dsh-skin-whalegirl`)完全一致:通过 pnpm workspace 的
`link:` 依赖 + `dsh.profile.bundles`。

**一条命令(dry-run,默认不写):**
```bash
node plugins/mount-into-profile.cjs            # 目标 $DSH_HOME/profiles/web
node plugins/mount-into-profile.cjs --apply    # 真正写入 profile 的 package.json
node plugins/mount-into-profile.cjs --profile-dir "C:/path/to/profiles/web" --apply
```

脚本等价于手动在你的 profile `package.json` 里加两处:
- `dependencies` 加 `"@deepseek-ai/dsh-client-ui-dshwork": "link:<本插件绝对路径>"`
- `dsh.profile.bundles` 加 `"@deepseek-ai/dsh-client-ui-dshwork"`

然后:
```bash
cd <profile 目录>
pnpm install
dsh --profile web      # 或 dsh web(重启 profile)
```

本包的 `cordis.patch.yml` 会按需插入一行,把该插件放进 web 插件名册:
```yaml
- insert:
    - id: dshwork-workbench
      name: '@deepseek-ai/dsh-client-ui-dshwork'
```

无需前端重构建:客户端插件运行时经 `/plugins/<id>/client.js` 加载,不改变 bundle。

## 验证(在你自己的开发环境)

1. 启动 web profile:`dsh --profile web`(或 `dsh web`)。
2. 浏览器打开 `http://127.0.0.1:3080`。
3. 侧边栏底部应出现「DSHwork」按钮;点击弹出工作台面板。
4. 若侧边栏/控制台无该插件,排查:
   - `dsh-client-modules` 是否扫描到该包(其 host 侧会在启动时报「client bundle not found」类错误);
   - 包是否真的在 `<profile>/node_modules/@deepseek-ai/` 下;
   - `cordis.patch.yml` 是否已声明该行;
   - 运行 `node test/smoke.test.cjs` 确认本包契约合法。

> HMR:`dsh-client-hmr` 只重载**已存在**的客户端 bundle;新增/移除插件需重启 profile。

## License

MIT · 由 DeepSeek.club 社区出品。
