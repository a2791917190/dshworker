# 上游 issue 草稿:Electron 宿主下 Windows 每条命令闪一个控制台窗口

## 一、先说受理概率

**值得提,受理概率高。** 依据不是感觉,是三条可核对的事实:

1. **同一个包里已经有同款修法。** `packages/subprocess/subprocess-local/src/spawn.ts` 的
   `spawnSubprocess()` 里已经写着 `windowsHide: platform === 'win32'`(从 0.1.5-rc.1 起每个已发布版本里都有)。
   维护者已经认可并采纳了这个修法,漏掉的只是 **Windows 实际上走的那条路**。
   对上游来说这不是"新需求",是"补齐一处遗漏"。
2. **改一行,零语义变化。** 只影响控制台窗口可见性(见第六节的实测:不加隐藏 → 子进程有可见控制台;
   加隐藏 → 句柄为 0、不可见),不动 stdio 布局、Job 归属、生命周期、错误映射、返回值。
3. **上游现有测试不会挂。** `tests/windows-job.spec.ts` 对 spawn 选项一律用
   `expect.objectContaining({...})`(只断言 `cwd` / `stdio`),没有全等比较 → 加一个键即通过。

保留意见(不粉饰):

- 上游是 monorepo,CI 严格(oxlint / 类型 / coverage 注释)。所以 **先提 issue 比直接甩 PR 更稳**;
  若要提 PR,应按仓库风格同时补一条 `expect.objectContaining({ windowsHide: true })` 断言。
- 这是"体验缺陷"而非功能 / 安全缺陷,排期可能靠后。会被受理的是**证据**,不是措辞 —— 所以正文里
  给的是可复现的事实与产物内证据。

## 二、事实(全部已核实)

| 项 | 值 |
| --- | --- |
| 仓库 | https://github.com/deepseek-ai/deepseek-harness |
| 影响版本 | `0.1.5-rc.1`(npm `latest`)、`0.1.5-rc.2`(`next`)、`0.1.6-alpha.1`(`alpha`)、`master` |
| 位置 | `packages/subprocess/subprocess-local/src/windows-job.ts` → `launchWindowsJob()` |
| 路径选择 | `selectContainmentMode('ordinary')` 在 win32 上只要 `probeWindowsJob()` 通过就返回 `"windows-job"` → 走 `launchWindowsJob`,**不走** 已有 `windowsHide` 的 `spawnSubprocess` |

已发布产物里的直接证据(同一包内对比):

| 文件 | 含 | `windowsHide` 出现次数 |
| --- | --- | --- |
| `lib/index.js` | `launchWindowsJob` / `taskkillProcessTree` / `launchLinuxScope` | **0** |
| `lib/runner-launch-*.js` | `spawnSubprocess`(fallback) | **3** |

`0.1.5-rc.1`、`0.1.5-rc.2`、`0.1.6-alpha.1` 三个版本逐文件计数完全一致 —— 即"修了 fallback、漏了主路径"
这个状态从 0.1.5 一直带到最新 alpha,`master` 的源码同样如此(`spawn.ts` 有、`windows-job.ts` 没有)。

## 三、病因(一句话版)

Electron 宿主是 GUI 子系统进程、**自己没有控制台**;`launchWindowsJob` 拉起的是 `node`(控制台子系统程序)
且未要求隐藏 → Windows 找不到可继承的控制台,于是**新建**一个 → 桌面版每跑一条命令闪一个黑框。
命令行下父子继承同一终端,不需要新建控制台,所以 CLI 天然看不到这个现象。

## 四、issue 正文(可直接粘贴)

**Title:** `[subprocess-local] Windows GUI host: every command flashes a visible console window`

**Body:**

> ### What happens
>
> When `@deepseek-ai/dsh-subprocess-local` runs a command on Windows with a GUI host process
> (e.g. an Electron app, which has no console of its own), a console window is created and
> shown for the duration of every single command.
>
> A GUI-subsystem host has no console to inherit. `launchWindowsJob()` spawns `node.exe`,
> a console-subsystem program, without asking Windows to hide it, so Windows creates a new
> visible console for each command.
>
> ### Why the CLI does not show it
>
> Under a terminal the child inherits the parent's console, so no new console is ever created.
> The problem only appears when the host is a GUI process.
>
> ### Root cause
>
> `packages/subprocess/subprocess-local/src/windows-job.ts`, in `launchWindowsJob()`:
>
> ```ts
>     child = (internals.spawn ?? spawn)(command, [
>       ...prefix,
>       '--',
>       ...spec.argv,
>     ], {
>       cwd: process.cwd(),
>       env: runnerEnvironment(WINDOWS_RUNNER_SELECTION, invocation),
>       stdio: runnerStdio(spec, true, ignoredStdinFd ?? 'pipe'),
>     }) as RunnerProcess
> ```
>
> No `windowsHide`.
>
> ### The inconsistency
>
> The sibling path in `packages/subprocess/subprocess-local/src/spawn.ts` (`spawnSubprocess()`)
> already sets it:
>
> ```ts
>     detached: platform !== 'win32',
>     windowsHide: platform === 'win32',
> ```
>
> `launchWindowsJob()` is the path Windows actually takes: `selectContainmentMode('ordinary')`
> returns `'windows-job'` on win32 whenever `probeWindowsJob()` succeeds, and only falls back to
> `spawnSubprocess()` when it does not. So the fix landed on the fallback path and the primary
> one was missed.
>
> This is observable in the published artifacts: in `@deepseek-ai/dsh-subprocess-local`
> `0.1.6-alpha.1`, `lib/index.js` (which contains `launchWindowsJob`) has **zero** occurrences of
> `windowsHide`, while `lib/runner-launch-*.js` (which contains `spawnSubprocess`) has **three**.
> Same for `0.1.5-rc.1` and `0.1.5-rc.2`.
>
> ### Reproduction
>
> Any Windows GUI host (no console) driving `subprocess-local`. Minimal shape:
>
> ```js
> // Electron main process — no console attached
> const { SubprocessRuntime } = require('@deepseek-ai/dsh-subprocess')
> // ... run any ordinary command; a console window appears and disappears per command
> ```
>
> ### Suggested fix
>
> One line, no behavior change beyond console visibility:
>
> ```diff
>      ], {
>        cwd: process.cwd(),
>        env: runnerEnvironment(WINDOWS_RUNNER_SELECTION, invocation),
>        stdio: runnerStdio(spec, true, ignoredStdinFd ?? 'pipe'),
> +      windowsHide: true,
>      }) as RunnerProcess
> ```
>
> `true` rather than `platform === 'win32'` because `launchWindowsJob` is Windows-only already.
> The target process is created by the runner inside the Job; it inherits the runner's (now hidden)
> console, so this single site covers the whole tree.
>
> ### Environment
>
> - `@deepseek-ai/dsh-subprocess-local`: `0.1.5-rc.1` / `0.1.5-rc.2` / `0.1.6-alpha.1`, and `master`
> - Host: Electron 3x (GUI subsystem), Windows 10/11 x64
> - Trigger: any ordinary command execution

## 五、附:本仓库已采取的措施

在等上游期间,补丁已经打在本地可控的三处(见 `plugins/vendor-runtime.cjs` 与 `plugins/patch-windows-hide.cjs`):

1. **随包 vendor 的 harness** —— `vendor-runtime.cjs` 在 vendor 之后调 `patchWindowsConsoleHide()`,
   按锚点自动适配 0.1.5+ 与 0.1.1 两代布局;CI 每次构建都会跑,锚点找不到就**报错**(不静默发出带 bug 的包)。
2. **本机全局装的 dsh** —— `patch-windows-hide.cjs` 自动定位 `npm -g` 的安装并补同一处
   (客户端 `findInstalledDsh()` 优先用全局那份,不补就等于没修);写前备份 `.bak-winhide`,幂等。
3. **判据**:`lib/index.js` 里 `windowsHide` 由 0 变 1,且 `node --check` 通过。

## 六、机制实测(GUI 宿主下控制台到底可不可见)

在 Windows 上用 **GUI 子系统宿主**(自身没有控制台)拉起同一个控制台子进程,由子进程自报
`GetConsoleWindow()` 与 `IsWindowVisible()`:

| 宿主 → 子进程 | 子进程的控制台句柄 | 是否可见 |
| --- | --- | --- |
| 不要求隐藏(≈ 补丁前的 `launchWindowsJob`) | `6949514` | **true** ← 就是那个黑框 |
| 要求隐藏(≈ 补丁后的 `launchWindowsJob`) | `0` | **false** |

- 要求隐藏后句柄直接是 `0`:控制台**根本没有被创建**(`CREATE_NO_WINDOW` 那一支),不是"建好了再藏起来"。
- 对照组:同一台机器上从命令行(父进程自带控制台)拉起同样两个子进程,二者都**继承**父控制台、都不新建窗口 ——
  所以 CLI 下永远看不到这个现象,这正是它一路漏到最新版的原因。
- 脚本:`docs/repro-windows-console/`(用 `pythonw.exe host.pyw` 跑,结果落在 `result.txt`)。
  Node 的 `windowsHide: true` 走的是隐藏控制台的同一族
  进程创建标志(`STARTF_USESHOWWINDOW`+`SW_HIDE` 或 `CREATE_NO_WINDOW`);上表测的是后者那一支。
  端到端的 Electron 版没跑成 —— 本机沙箱里 Electron 起不来,所以 GUI 宿主用了 Python 的最小替身。

