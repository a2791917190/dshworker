# DSHwork Desktop

> 给知识工作者的 DeepSeek Agent 工作台(薄壳 + 插件化)。
> 独立社区项目,与深度求索 / DeepSeek 官方**无隶属、合作、授权或背书关系**。

## 是什么

DSHwork 把 DeepSeek Harness 的强大能力,装进一个**像办公软件一样简单、零命令、开箱即用**的桌面工作空间:
- **薄壳层**:只负责窗口、托盘、深链(`dshwork://`)、安装器、自动更新,不魔改上游。
- **插件层**:主页 / 任务 / 工作区 / 模板库 / 我的插件,全部以官方插件机制接入 Harness。

## 目录结构

```
desktop/
├─ package.json            Electron + electron-builder 配置
├─ config/
│  └─ harness.json         内置 Harness 固定版本 / vendoring 配置
├─ src/
│  ├─ main/                薄壳主进程
│  │  ├─ main.js           窗口/单实例/深链转发/版本解析对接
│  │  ├─ harness.js        内置固定版本 + 检测更新的检测/拉起(不修改上游)
│  │  ├─ profile-mount.js  把 DSHwork 工作台插件自动装入启用的 harness profile(打开即见工作台)
│  │  ├─ updater.js        Harness 版本更新弹窗 + 应用更新(占位)
│  │  ├─ protocol.js       dshwork:// 协议注册
│  │  └─ tray.js           系统托盘
│  ├─ preload/preload.js   最小安全桥(window.dshwork)
│  └─ plugin/              产品核心(工作台)
│     ├─ index.js          插件注册(占位)
│     └─ workbench/        静态工作台 UI
├─ test/
│  ├─ harness.test.js      版本决策逻辑单测(node test/harness.test.js)
│  └─ fixtures/dsh/        findBundledHarness 的测试夹具
├─ assets/icons/           图标占位(见 README)
├─ scripts/
│  ├─ build-win.cmd        Windows 构建
│  └─ build-mac.sh         macOS 构建
└─ README.md
```

## Harness 版本策略

DSHwork 随包内置一个**固定版本的 DeepSeek Harness**(`config/harness.json` 的 `bundledVersion`)
作为默认运行基线,开箱即用、离线可用。启动时:

1. 向 npm registry 检测 `@deepseek-ai/dsh` 是否有**更新的版本**;
2. **无更新** → 直接使用内置固定版本;
3. **有更新** → 弹出对话框询问用户:
   - **不更新** → 仍用内置固定版本;
   - **更新** → 改用 `npx @deepseek-ai/dsh web` 拉取最新版启动;
4. 任何联网/检测失败都**优雅降级**为内置固定版本,保证离线可用。

> 复用已有实例:`harness.js` 会先探测 `DSHWORK_HARNESS_URL`(默认 `http://127.0.0.1:3080`);
> 若已有 Harness 在运行则直接复用,不会重复拉起。

### 内置固定版本的放置方式

`findBundledHarness()` 会按优先级在以下位置查找内置 Harness:

1. 环境变量 `DSHWORK_HARNESS_DIR`
2. 打包后的 `resources/vendor/dsh`(通过 `package.json` 的 `extraResources` 放置 `vendor/`)
3. 开发态 `desktop/vendor/dsh`
4. 开发态 `desktop/node_modules/@deepseek-ai/dsh`

`electron-builder` 已配置 `extraResources` 把 `vendor/` 完整拷进包。要真正打进 Harness,发布前把
一个未修改的 `@deepseek-ai/dsh`(含其依赖)放进 `desktop/vendor/dsh/` 即可;找不到内置时桌面会
退回 `npx` 按内置版本号取固定版本(开发态兜底)。

## Node 运行时供给(无 Node 也能拉起 Harness)

Harness 是 Node 程序,必须有 node 才能跑。`src/main/node-runtime.js` 在启动时按以下
优先级解析一个可用 node,让客户端在「本机没装 Node」时也能拉起 Harness:

1. **内置 node** — 随包放进 `<resources>/node`(或 env `DSHWORK_NODE_HOME`);
2. **已缓存 node** — 之前自动下载并缓存在 `$DSH_HOME/runtimes/`;
3. **系统 node** — 用户机器已装的 `node`(on PATH);
4. **自动下载 node** — 都没有时,从 `nodejs.org` 下载一个官方便携版,
   解压到缓存目录(默认下载 `config/harness.json` 的 `nodeVersion`),下次直接复用。

走这条路径后,`bootHarness` 用解析出的 `node`(或其自带的 `npx`)来启动 Harness,
而不是依赖系统 `node` / `npx`。

> ⚠️ 第 4 步的「下载 + 解压」需要联网,并依赖系统 `tar.exe`(Windows 10+)或
> PowerShell `Expand-Archive`。这一步只能在真实机器上端到端验证;沙箱里无法创建子进程/联网解压大件。
> 解析与分类逻辑(内置→缓存→系统→下载)由 `test/node-runtime.test.cjs` 覆盖。

### 诊断与换源

Harness 拉不起来时,看日志(实时追加):

```powershell
$env:DSH_HOME   # 默认 C:\Users\<你>\.dsh
# 日志在 $DSH_HOME\logs\dshwork.log
```

若因**网络到 npmjs / nodejs.org 被阻断**(常见于国内)导致拉取失败,可用环境变量换源:

| 环境变量 | 作用 |
|---|---|
| `DSHWORK_NPM_REGISTRY` | npx 拉 `@deepseek-ai/dsh` 的 registry,如 `https://registry.npmmirror.com` |
| `DSHWORK_NODE_DIST_MIRROR` | 下载 node 的镜像基址,如 `https://npmmirror.com/mirrors/node` |
| `DSHWORK_LOG` | 覆盖日志文件路径 |

### 离线自包含(内置 node + Harness,任何机器都能拉起)

若要在"没装 node、没装 harness、甚至没网"的机器上也能拉起 Harness,把 **node + Harness
一并 vendor 进包**。在**有网络、有 node/npm** 的机器上运行:

```bash
cd dshwork
node plugins/vendor-runtime.cjs
# 国内网络可换镜像:
node plugins/vendor-runtime.cjs --node-mirror https://npmmirror.com/mirrors/node --npm-registry https://registry.npmmirror.com
```

脚本会:下载官方便携版 node → 解压到 `<resources>/node`;执行
`npm install --prefix <resources>/vendor/harness @deepseek-ai/dsh@<version> @deepseek-ai/dsh-web-app@<version>
@deepseek-ai/dsh-client-ui-primitives@<version> @deepseek-ai/dsh-client-ui-slots@<version> react-dom@<react 版>`
→ 装出自包含依赖树;最后重新压缩成新的 `DSHwork-portable-*.zip`。

> ⚠️ 关键:`npm install @deepseek-ai/dsh` **不会**自动带上 `dsh-client-ui-primitives` /
> `dsh-client-ui-slots` / `react-dom` 这三个共享库(官方 harness 靠 pnpm-workspace hoist 到根目录,
> 独立 npm 必须显式装,否则像 `dsh-client-ui-trajectory` 这类 client bundle 会因
> `require('@deepseek-ai/dsh-client-ui-primitives')` 找不到而加载失败)。本脚本已显式安装它们。

之后客户端启动即**优先使用内置 node + 内置 harness**,全程离线(见
`node-runtime.js` 的内置→缓存→系统→下载 + `harness.js` 的 `findBundledHarness`)。

> ⚠️ 这会让包体从 ~105MB 涨到数百 MB;并且该脚本只能在有网络的机器上执行,无法在
> 本沙箱验证(需联网 + spawn)。vendor 出来后请在无 node/无 harness 的机器上实测。
> 布局:`resources/node`(node 运行时)、`resources/vendor/harness/node_modules/@deepseek-ai/dsh`(harness)。

### 本地测试

```bash
npm test   # node test/harness.test.js + node test/node-runtime.test.cjs
```

## 本地开发

```bash
cd dshwork/desktop
npm install        # 或 npm.cmd install(见下方"Windows 注意")
npm start          # 或 npm.cmd start
```

> 首次运行需能访问 DeepSeek Harness(默认 `http://127.0.0.1:3080`,可通过环境变量
> `DSHWORK_HARNESS_URL` 指定已有服务)。壳会尝试用 `npx @deepseek-ai/dsh web` 拉起,
> 生产环境建议改为随包内置的固定版本。

## 构建安装包

**Windows(NSIS):**
```bat
cd dshwork\desktop
scripts\build-win.cmd
```
产物在 `dist\` 下,得到 `DSHwork Setup x.x.x.exe`。

**macOS(DMG + 便携 zip):** 必须在 macOS 上运行
```bash
cd dshwork/desktop
bash scripts/build-mac.sh
```
- 产物:`DSHwork-<version>-mac-<arch>.zip`(便携压缩包)+ `DSHwork-<version>.dmg`。
- `scripts/after-pack-mac.cjs` 会在打完 .app 后自动把 **mac 版 node + mac 版 harness** 灌进
  app 的 `Contents/Resources`,使 mac 版也能「无环境自启动」。
- 若 vendoring 失败(联网/镜像问题),会回退为「用系统 node/npx 启动」的轻量模式,不阻塞打包。

> ⚠️ mac 版必须在 macOS 上构建(Windows 无法交叉出可用的 mac 包;本仓库的
> `resources/node` 与 harness 原生模块是 win 专属)。mac 上还要能访问
> `nodejs.org` / `registry.npmjs.org`,或用
> `DSHWORK_NODE_DIST_MIRROR` / `DSHWORK_NPM_REGISTRY` 换镜像。

## Windows 注意(执行策略)

你的 PowerShell 报过 `npm.ps1` 被禁止运行。三种解法任选:

1. **直接调 npm.cmd**:`npm.cmd install`、`npm.cmd run build:win`(上面的 .cmd 脚本已这么做)。
2. **用 cmd.exe**:`cmd /c "npm install"`。
3. **放开当前用户执行策略**:
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
   ```

## 代码签名(可选但建议)

未签名时,Windows 会提示"未知发布者"、macOS 会提示"无法验证开发者",均不影响本地自用。
正式分发前建议:
- Windows:购买代码签名证书,在 `electron-builder` 里配置 `win.certificateFile` 等。
- macOS:使用 Apple Developer ID 签名 + 公证(notarytool),否则 Gatekeeper 会拦截。

## 工作台嵌入 Harness(自动)

桌面壳在拉起一个**新** Harness 实例前,会调用 `src/main/profile-mount.js` 的
`ensureWorkbenchMounted()`,把本地 DSHwork 工作台插件 `@deepseek-ai/dsh-client-ui-dshwork`
以官方机制装入它启动的 profile(默认 `web`,可用 `DSHWORK_HARNESS_PROFILE` 覆盖):

- 走 `dsh plugin --profile <name> add link:<插件目录>`,由 harness 的 bundle patch
  (`dsh.bundle.patch` → `cordis.patch.yml`)把 `dshwork-workbench` 行插入 web 插件名册;
- 幂等(已挂载则跳过,不重复改/装)、容错(无 pnpm/无内置 dsh 等任一失败只记录,
  **绝不阻塞 Harness 启动**,降级为「无工作台」的裸 Harness);
- 其工作台(主页/任务/工作区/模板库/插件)作为真实 Cordis 客户端插件,通过
  `ctx.sessions` / `ctx.workspaces` 读取并驱动 Harness 的真实会话/项目数据。

关掉自动挂载:`DSHWORK_AUTO_MOUNT=0`。

## 待接入(重要)

当前交付的是**可构建、可运行的骨架** + **已接入的工作台插件**,以下仍为与上游对接的真实工作,尚未接:
1. **工作台执行引擎**:模板点击目前只「新建会话 / 打开会话 / 新建工作区」,尚未把 Agent
   执行、任务结果落为产物(Office 文档)等高级能力接齐。
2. **深链端到端**:协议与深链事件已打通到渲染进程,需在插件层补齐 `open-template` / `add-plugin` 的真实落地。
3. **DSHwork 应用自身自动更新**:当前只做了 **Harness 运行时版本**的检测+弹窗(`updater.js` 的 `promptHarnessUpdate`);应用自身(DSHwork App)的自动更新尚未接 `electron-updater` + GitHub Releases,`setupUpdater()` 为占位。
4. **图标**:见 `assets/icons/README.md`。
5. **随包内置 Harness 固定版本**:版本策略已实现(检测更新→弹窗问询→默认内置/可选 npx),但**尚未把 Harness 真正打进 `vendor/`**——需在发布前把一个未修改固定版本的 Harness 连同依赖放入 `desktop/vendor/dsh/`(见上方「内置固定版本的放置方式」)。当前开发态会自动退回 `npx @deepseek-ai/dsh@内置版本 web` 兜底。

## 相关文档

- 定位方案:`../docs/plans/2026-09-01-dshwork-positioning.md`
- 生态对接:`../docs/plans/2026-09-01-dshwork-community-integration.md`
- PRD:`../docs/plans/2026-09-01-dshwork-prd.md`
- 技术路线:`../docs/plans/2026-09-01-dshwork-technical-routes.md`

## License

MIT · 由 DeepSeek.club 社区出品。
