window.__ModuleLoader__.load({
	id: "@deepseek-ai/dsh-client-ui-dshwork",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var React = require("react");
		const { useState, useSyncExternalStore, useCallback } = React;

		// ── UI-visibility store (module-scoped, shared by footer button + overlay) ──
		var v = { open: false };
		const listeners = new Set();
		function emit() {
			for (const l of [...listeners]) l();
		}
		const store = {
			subscribe(cb) {
				listeners.add(cb);
				return () => listeners.delete(cb);
			},
			// return the primitive so useSyncExternalStore detects change by Object.is
			getSnapshot() {
				return v.open;
			},
			toggle() {
				v.open = !v.open;
				emit();
			},
			open() {
				v.open = true;
				emit();
			},
			close() {
				v.open = false;
				emit();
			}
		};

		// ── locales ──
		const NS = "dshwork";
		const zh = {
			"templates": "模板库",
			"home": "主页",
			"tasks": "任务",
			"workspace": "工作区",
			"plugins": "我的插件",
			"home.title": "今天,做点什么?",
			"home.sub": "选一个模板开始,零命令、开箱即用。",
			"home.recent": "最近工作",
			"home.recent.empty": "还没有会话,选个模板开始吧。",
			"home.recent.open": "打开",
			"card.research": "研究报告",
			"card.research.desc": "把多来源资料整合成一份可编辑报告",
			"card.literature": "文献整理",
			"card.literature.desc": "梳理要点、生成提纲与引用",
			"card.draft": "长文起草",
			"card.draft.desc": "从提纲到成稿,一步步完成",
			"card.polish": "改写润色",
			"card.polish.desc": "让文字更清晰、更专业",
			"tasks.empty": "暂无任务,回「主页」选个模板开始吧。",
			"tasks.started": "新建会话已开始,输入你的首个指令。",
			"tasks.running": "运行中",
			"tasks.completed": "已完成",
			"tasks.idle": "空闲",
			"tasks.waiting": "待处理",
			"tasks.subagents": "{n} 个子代理运行中",
			"tasks.new": "新建会话",
			"workspace.empty": "还没有工作区。新建一个,把项目、资料与产物集中起来。",
			"workspace.new": "新建工作区",
			"workspace.add": "添加目录",
			"workspace.prompt": "输入一个文件夹路径作为工作区",
			"workspace.create.fail": "创建工作区失败",
			"workspace.sessions": "{n} 个会话",
			"workspace.open": "打开会话",
			"plugin.empty": "暂无插件,可通过插件库深链安装。",
			"open": "打开 DSHwork 工作台",
			"close": "关闭"
		};
		const en = {
			"templates": "Templates",
			"home": "Home",
			"tasks": "Tasks",
			"workspace": "Workspace",
			"plugins": "Plugins",
			"home.title": "What do you want to do today?",
			"home.sub": "Pick a template to start — zero commands, ready out of the box.",
			"home.recent": "Recent work",
			"home.recent.empty": "No sessions yet — pick a template to start.",
			"home.recent.open": "Open",
			"card.research": "Research report",
			"card.research.desc": "Turn multi-source material into an editable report",
			"card.literature": "Literature review",
			"card.literature.desc": "Extract points, outline, and citations",
			"card.draft": "Long-form drafting",
			"card.draft.desc": "From outline to finished draft",
			"card.polish": "Polish & rewrite",
			"card.polish.desc": "Make it clearer and more professional",
			"tasks.empty": "No tasks yet — pick a template from Home to start.",
			"tasks.started": "New session started — type your first prompt.",
			"tasks.running": "Running",
			"tasks.completed": "Completed",
			"tasks.idle": "Idle",
			"tasks.waiting": "Waiting",
			"tasks.subagents": "{n} subagents running",
			"tasks.new": "New session",
			"workspace.empty": "No workspaces yet. Create one to keep projects, material, and outputs together.",
			"workspace.new": "New workspace",
			"workspace.add": "Add folder",
			"workspace.prompt": "Enter a folder path for the workspace",
			"workspace.create.fail": "Failed to create workspace",
			"workspace.sessions": "{n} sessions",
			"workspace.open": "Open session",
			"plugin.empty": "No plugins yet — install from the plugin hub via deep link.",
			"open": "Open DSHwork workbench",
			"close": "Close"
		};

		// ── style injection ──
		(function injectStyles() {
			if (typeof document === "undefined") return;
			if (document.querySelector("style[data-dshwork]") !== null) return;
			const css = [
				".dshwork-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(4,8,16,.82);backdrop-filter:blur(4px);padding:24px;box-sizing:border-box}",
				".dshwork-panel{width:min(1080px,100%);max-height:92vh;background:#0b0f1a;color:#e8ecf5;border:1px solid rgba(255,255,255,.14);border-radius:16px;overflow:auto;display:flex;flex-direction:column;font-family:inherit;box-shadow:0 24px 64px rgba(0,0,0,.55)}",
				".dshwork-top{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.1)}",
				".dshwork-brand{font-weight:700;letter-spacing:.3px}",
				".dshwork-close{background:0 0;border:none;color:#98a3b8;font-size:20px;cursor:pointer;line-height:1}",
				".dshwork-close:hover{color:#e8ecf5}",
				".dshwork-nav{display:flex;gap:4px;padding:10px 14px 0;flex-wrap:wrap}",
				".dshwork-tab{padding:8px 14px;background:0 0;border:none;color:#98a3b8;cursor:pointer;font-size:14px;border-bottom:2px solid transparent}",
				".dshwork-tab:hover{color:#cdd4e3}",
				".dshwork-tab.active{color:#e8ecf5;border-bottom-color:#4f7cff}",
				".dshwork-body{padding:18px}",
				".dshwork-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}",
				".dshwork-card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:14px;text-align:left;cursor:pointer;color:inherit;transition:background .12s ease}",
				".dshwork-card:hover{background:rgba(255,255,255,.1)}",
				".dshwork-card b{display:block;font-size:15px;margin-bottom:4px}",
				".dshwork-card span{font-size:13px;color:#98a3b8}",
				".dshwork-muted{color:#98a3b8;font-size:14px}",
				".dshwork-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}",
				".dshwork-item{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 12px;text-align:left;cursor:pointer;color:inherit;width:100%;transition:background .12s ease}",
				".dshwork-item:hover{background:rgba(255,255,255,.1)}",
				".dshwork-dot{width:8px;height:8px;border-radius:50%;background:#66718a;flex:none}",
				".dshwork-dot.running{background:#3fd68f}",
				".dshwork-dot.busy{background:#f5a623}",
				".dshwork-item-title{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
				".dshwork-item-meta{font-size:12px;color:#66718a;flex:none}",
				".dshwork-actions{display:flex;gap:8px;margin-top:12px}",
				".dshwork-btn{background:rgba(255,255,255,.05);color:#e8ecf5;border:1px solid rgba(255,255,255,.16);border-radius:10px;padding:8px 12px;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;justify-content:flex-start}",
				".dshwork-btn:hover{background:rgba(255,255,255,.1)}",
				".dshwork-btn .glyph{font-size:15px}"
			].join("");
			const tag = document.createElement("style");
			tag.dataset.dshwork = "true";
			tag.textContent = css;
			document.head.appendChild(tag);
		})();

		// ── label helper (locale-aware, zh fallback) ──
		function t2(t, key, zhVal) {
			if (typeof t === "function") {
				const s = t(key);
				return s && s !== key ? s : zhVal;
			}
			return zhVal;
		}

		// Parameterized label helper (substitutes {n}); falls back to zhVal on no t.
		function tn(t, key, n, zhVal) {
			if (typeof t === "function") {
				const s = t(key, { n });
				return s && s !== key ? s : zhVal.replace(/\{n\}/g, String(n));
			}
			return zhVal.replace(/\{n\}/g, String(n));
		}

		// ── reactively subscribe to a harness snapshot store (null-safe) ──
		// `store` is an ObservableSnapshot<{getSnapshot(), subscribe(fn)}> exposed by
		// ctx.sessions.list / ctx.workspaces.list, or undefined when the services are
		// not present (fallback mode). Returns the snapshot, or null when disabled.
		function useSnapshot(store) {
			const subscribe = useCallback((cb) => (store ? store.subscribe(cb) : () => {}), [store]);
			const getSnapshot = useCallback(() => (store ? store.getSnapshot() : null), [store]);
			return useSyncExternalStore(subscribe, getSnapshot);
		}

		// ── render helpers ──
		function sessionStatus(s, t) {
			if (s.pendingInteraction === "approval" || s.pendingInteraction === "question" || s.pendingInteraction === "plan-review") {
				return { cls: "busy", label: t2(t, "tasks.waiting", "待处理") };
			}
			if (s.running) return { cls: "running", label: t2(t, "tasks.running", "运行中") };
			if (s.completed === true) return { cls: "", label: t2(t, "tasks.completed", "已完成") };
			return { cls: "", label: t2(t, "tasks.idle", "空闲") };
		}

		function displayTitle(s) {
			return s.blank ? "New Session" : (s.displayTitle || s.title || s.id);
		}

		function relativeTime(updatedAt) {
			const MIN = 6e4, HOUR = 36e5, DAY = 864e5;
			const diff = Math.max(0, Date.now() - (updatedAt || 0));
			if (diff < MIN) return "now";
			if (diff < HOUR) return Math.floor(diff / MIN) + "m";
			if (diff < DAY) return Math.floor(diff / HOUR) + "h";
			if (diff < 30 * DAY) return Math.floor(diff / DAY) + "d";
			return Math.floor(diff / (30 * DAY)) + "mo";
		}

		// ── components ──
		function WorkbenchView({ t, sessions, workspaces }) {
			const [tab, setTab] = useState("home");
			const [wsError, setWsError] = useState(null);
			const sessionsSnap = useSnapshot(sessions && sessions.list);
			const workspacesSnap = useSnapshot(workspaces && workspaces.list);
			const sessionList = sessionsSnap || null;
			const workspaceList = workspacesSnap || null;

			const nav = [
				["home", t2(t, "home", "主页")],
				["tasks", t2(t, "tasks", "任务")],
				["workspace", t2(t, "workspace", "工作区")],
				["templates", t2(t, "templates", "模板库")],
				["plugins", t2(t, "plugins", "我的插件")]
			];
			const cards = [
				["research-report", t2(t, "card.research", "研究报告"), t2(t, "card.research.desc", "把多来源资料整合成一份可编辑报告")],
				["literature", t2(t, "card.literature", "文献整理"), t2(t, "card.literature.desc", "梳理要点、生成提纲与引用")],
				["draft", t2(t, "card.draft", "长文起草"), t2(t, "card.draft.desc", "从提纲到成稿,一步步完成")],
				["polish", t2(t, "card.polish", "改写润色"), t2(t, "card.polish.desc", "让文字更清晰、更专业")]
			];

			// recent sessions, newest first, excluding blank ones
			const recent = sessionList && sessionList.ids
				? sessionList.ids.map((id) => sessionList.byId[id]).filter(Boolean).filter((s) => !s.blank).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5)
				: [];

			// all visible sessions for the tasks tab
			const sessionsVisible = sessionList && sessionList.ids
				? sessionList.ids.map((id) => sessionList.byId[id]).filter(Boolean).filter((s) => !s.blank)
				: [];

			const openSession = (id) => { if (sessions && typeof sessions.open === "function") sessions.open(id); };
			const startSession = (workspaceId) => {
				if (workspaces && typeof workspaces.startSession === "function") {
					workspaces.startSession(workspaceId);
					setTab("tasks");
				}
			};
			const createWorkspace = () => {
				if (!workspaces || typeof workspaces.create !== "function") return;
				const path = window.prompt(t2(t, "workspace.prompt", "输入一个文件夹路径作为工作区"));
				if (!path) return;
				setWsError(null);
				workspaces.create({ path }).then(() => {
					setTab("workspace");
				}).catch((e) => {
					setWsError((e && e.message) || String(e));
				});
			};

			const navEls = React.createElement("div", { className: "dshwork-nav" },
				nav.map(([id, label]) =>
					React.createElement("button", {
						key: id,
						type: "button",
						className: "dshwork-tab" + (tab === id ? " active" : ""),
						onClick: () => setTab(id)
					}, label)
				)
			);

			let body;
			if (tab === "home") {
				body = React.createElement("div", null,
					React.createElement("h2", { style: { margin: "6px 0 4px", fontSize: 22 } }, t2(t, "home.title", "今天,做点什么?")),
					React.createElement("p", { className: "dshwork-muted", style: { marginTop: 0 } }, t2(t, "home.sub", "选一个模板开始,零命令、开箱即用。")),
					React.createElement("div", { className: "dshwork-grid", style: { marginTop: 14 } },
						cards.map(([id, name, desc]) =>
							React.createElement("button", {
								key: id,
								type: "button",
								className: "dshwork-card",
								onClick: () => startSession()
							}, React.createElement("b", null, name), React.createElement("span", null, desc))
						)
					),
					React.createElement("h3", { className: "dshwork-muted", style: { margin: "22px 0 8px", fontWeight: 600 } }, t2(t, "home.recent", "最近工作")),
					recent.length === 0
						? React.createElement("p", { className: "dshwork-muted" }, t2(t, "home.recent.empty", "还没有会话,选个模板开始吧。"))
						: React.createElement("ul", { className: "dshwork-list" },
							recent.map((s) =>
								React.createElement("li", { key: s.id, className: "dshwork-item", onClick: () => openSession(s.id) },
									React.createElement("span", { className: "dshwork-dot" + (s.running ? " running" : "") }),
									React.createElement("span", { className: "dshwork-item-title" }, displayTitle(s)),
									React.createElement("span", { className: "dshwork-item-meta" }, relativeTime(s.updatedAt))
								)
							)
						)
				);
			} else if (tab === "tasks") {
				body = React.createElement("div", null,
					React.createElement("div", { className: "dshwork-actions" },
						React.createElement("button", { type: "button", className: "dshwork-btn", onClick: () => startSession() },
							React.createElement("span", { className: "glyph" }, "+"), t2(t, "tasks.new", "新建会话"))
					),
					sessionsVisible.length === 0
						? React.createElement("p", { className: "dshwork-muted", style: { marginTop: 14 } }, t2(t, "tasks.empty", "暂无任务,回「主页」选个模板开始吧。"))
						: React.createElement("ul", { className: "dshwork-list", style: { marginTop: 14 } },
							sessionsVisible.map((s) => {
								const st = sessionStatus(s, t);
								return React.createElement("li", { key: s.id, className: "dshwork-item", onClick: () => openSession(s.id) },
									React.createElement("span", { className: "dshwork-dot " + st.cls }),
									React.createElement("span", { className: "dshwork-item-title" }, displayTitle(s)),
									React.createElement("span", { className: "dshwork-item-meta" }, st.label)
								);
							})
						)
				);
			} else if (tab === "workspace") {
				const items = (workspaceList && workspaceList.items) ? workspaceList.items : [];
				body = React.createElement("div", null,
					React.createElement("div", { className: "dshwork-actions" },
						React.createElement("button", { type: "button", className: "dshwork-btn", onClick: createWorkspace },
							React.createElement("span", { className: "glyph" }, "+"), t2(t, "workspace.new", "新建工作区"))
					),
					wsError ? React.createElement("p", { className: "dshwork-muted", style: { color: "#f56a6a", marginTop: 12 } }, wsError) : null,
					items.length === 0
						? React.createElement("p", { className: "dshwork-muted", style: { marginTop: 14 } }, t2(t, "workspace.empty", "还没有工作区。新建一个,把项目、资料与产物集中起来。"))
						: React.createElement("ul", { className: "dshwork-list", style: { marginTop: 14 } },
							items.map((w) =>
								React.createElement("li", { key: w.workspaceId, className: "dshwork-item", onClick: () => { if (workspaces && typeof workspaces.startSession === "function") workspaces.startSession(w.workspaceId); } },
									React.createElement("span", { className: "dshwork-dot" }),
									React.createElement("span", { className: "dshwork-item-title" }, w.title || w.path),
									React.createElement("span", { className: "dshwork-item-meta" }, tn(t, "workspace.sessions", w.sessionIds ? w.sessionIds.length : 0, "{n} 个会话"))
								)
							)
						)
				);
			} else if (tab === "templates") {
				body = React.createElement("ul", { style: { lineHeight: 1.9 } },
					cards.map(([id, name, desc]) =>
						React.createElement("li", { key: id, style: { cursor: "pointer" }, onClick: () => startSession() }, name + " — " + desc)
					)
				);
			} else {
				body = React.createElement("p", { className: "dshwork-muted" }, t2(t, "plugins.empty", "暂无插件,可通过插件库深链安装。"));
			}

			return React.createElement("div", { className: "dshwork-body" }, navEls, body);
		}

		function WorkbenchButton({ t }) {
			const open = useSyncExternalStore(store.subscribe, store.getSnapshot);
			const label = t2(t, "open", "打开 DSHwork 工作台");
			return React.createElement("button", {
				type: "button",
				className: "dshwork-btn",
				"aria-label": label,
				title: label,
				onClick: store.toggle
			},
				React.createElement("span", { className: "glyph" }, "\u2699\uFE0F"),
				React.createElement("span", null, open ? "DSHwork ✓" : "DSHwork")
			);
		}

		function WorkbenchOverlay({ t, sessions, workspaces }) {
			const open = useSyncExternalStore(store.subscribe, store.getSnapshot);
			if (!open) return null;
			return React.createElement("div", { className: "dshwork-overlay", role: "dialog", "aria-modal": "true" },
				React.createElement("div", { className: "dshwork-panel" },
					React.createElement("div", { className: "dshwork-top" },
						React.createElement("span", { className: "dshwork-brand" }, "DSHwork · 工作台"),
						React.createElement("button", {
							type: "button",
							className: "dshwork-close",
							"aria-label": t2(t, "close", "关闭"),
							onClick: store.close
						}, "×")
					),
					React.createElement(WorkbenchView, { t: t, sessions: sessions, workspaces: workspaces })
				)
			);
		}

		// ── plugin contract ──
		const inject = ["slots", "locale", "sessions", "workspaces"];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dshwork: dictionaries");
			// Resolve sessions/workspaces lazily at mount (not apply), so the plugin
			// degrades gracefully when a surface omits them.
			const injected = () => ({ sessions: ctx.sessions, workspaces: ctx.workspaces });
			ctx.slots.inject("sidebar.footer.action", () =>
				ctx.slots.register({
					name: "sidebar.footer.action",
					id: "dshwork-workbench",
					locale: NS
				}, WorkbenchButton)
			);
			ctx.slots.inject("shell.overlay", () =>
				ctx.slots.register({
					name: "shell.overlay",
					id: "dshwork-workbench",
					locale: NS,
					inject: injected
				}, WorkbenchOverlay)
			);
		}

		exports.WorkbenchButton = WorkbenchButton;
		exports.WorkbenchOverlay = WorkbenchOverlay;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
