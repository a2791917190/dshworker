window.__ModuleLoader__.load({
	id: "@dshwork/dsh-client-ui-dshwork-brand",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var React = require("react");
		const { useState, useSyncExternalStore } = React;

		const MARK = "data:image/png;base64,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";
		const HERO_HEADLINE = "让DSH Work 帮你高效完成工作任务！";
		const HERO_OLD = ["探索未至之境", "Into the Unknown"];
		const PREVIEW_OLD = ["预览版", "Preview"];

		// ── overlay store ──
		var v = { open: false, page: "plugins" };
		const listeners = new Set();
		function emit() { for (const l of [...listeners]) l(); }
		const store = {
			subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); },
			getSnapshot() { return v.open ? v.page : ""; },
			openPage(page) { v.open = true; v.page = page; emit(); },
			close() { v.open = false; emit(); }
		};

		// ── 样式 ──
		(function injectStyles() {
			if (typeof document === "undefined") return;
			if (document.querySelector("style[data-dshwork-brand]") !== null) return;
			const css = [
				".dsw-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(4,8,16,.5);padding:24px;box-sizing:border-box}",
				".dsw-panel{width:min(680px,100%);max-height:86vh;overflow:auto;background:#ffffff;color:#141414;border:1px solid rgba(0,0,0,.12);border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.45)}",
				".dsw-top{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.08))}",
				".dsw-brand{font-weight:700}",
				".dsw-close{background:0 0;border:none;font-size:20px;line-height:1;cursor:pointer;color:var(--dsw-alias-label-secondary,#888)}",
				".dsw-body{padding:16px 18px}",
				".dsw-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid rgba(0,0,0,.1);border-radius:10px;margin-bottom:8px;background:#fff}",
				".dsw-item-main{flex:1;min-width:0}",
				".dsw-item b{display:block;font-size:14px;color:#141414}",
				".dsw-item-main span{font-size:12.5px;color:#7a7a7a}",
				".dsw-badge{flex:none;font-size:12px;color:#1f9d55;background:rgba(31,157,85,.12);border-radius:999px;padding:3px 10px}",
				".dsw-switch{position:relative;flex:none;width:38px;height:22px;border-radius:11px;border:none;background:rgba(0,0,0,.2);cursor:pointer;padding:0;transition:background .15s}",
				".dsw-switch.on{background:#3b82f6}",
				".dsw-switch.disabled{opacity:.45;cursor:default}",
				".dsw-knob{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .15s}",
				".dsw-switch.on .dsw-knob{transform:translateX(16px)}",
				".dsw-ref{flex:none;border:1px solid rgba(0,0,0,.16);background:transparent;border-radius:8px;padding:5px 12px;font-size:12.5px;cursor:pointer;color:#141414;font-family:inherit}",
				".dsw-ref:hover{background:rgba(0,0,0,.06)}",
				".dsw-foot{display:flex;align-items:center;padding:10px 18px 14px;border-top:1px solid rgba(0,0,0,.08)}",
				".dsw-hint{flex:1;font-size:12px;color:#8a8a8a}",
				".dsw-row{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;padding:7px 8px 7px 2px;margin:1px 0 1px -2px;background:transparent;border:none;border-left:2px solid transparent;border-radius:8px;cursor:pointer;color:var(--dsw-alias-label-primary,inherit);font-size:14px;text-align:left;font-family:inherit}",
				".dsw-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));border-left-color:var(--dsw-alias-state-business-primary,#3b82f6)}",
				".dsw-row-icon{display:inline-flex;width:18px;height:18px;align-items:center;justify-content:center;flex:none}",
				".dsw-corner{display:flex;align-items:center;gap:8px}",
				".dsw-dot{width:7px;height:7px;border-radius:50%;background:#3fd68f;display:inline-block}",
				".dsw-status{font-size:12.5px;color:var(--dsw-alias-label-secondary,#666)}",
				".dsw-avatar{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#4f7cff,#7aa2ff);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}"
			].join("");
			const tag = document.createElement("style");
			tag.dataset.dshworkBrand = "true";
			tag.textContent = css;
			document.head.appendChild(tag);
		})();

		// ── DOM 层:替换 hero 文案 + 藏预览角标 ──
		// 注意:只藏「角标元素本身」,绝不藏父元素(父元素里还包着标题)。
		// 同时:若标题的某个祖先曾被旧版误藏(display:none),这里负责恢复。
		let patching = false;
		function revealChain(el) {
			let p = el;
			while (p && p !== document.body && p.style) {
				if (p.style.display === "none") p.style.display = "";
				p = p.parentElement;
			}
		}
		// 把首页品牌区改成「竖排居中」:logo 在上、文字在下。
		function restructureHero(headlineEl) {
			try {
				const group = headlineEl.parentElement; // titleGroup(标题 + 角标)
				if (!group) return;
				const row = group.parentElement; // 品牌行(logo + titleGroup)
				if (row && row !== document.body) {
					row.style.display = "flex";
					row.style.flexDirection = "column";
					row.style.alignItems = "center";
					row.style.justifyContent = "center";
					row.style.gap = "14px";
				}
				group.style.display = "flex";
				group.style.flexDirection = "column";
				group.style.alignItems = "center";
				group.style.gap = "8px";
			} catch (_) {
				/* ignore */
			}
		}
		// 侧边栏左上角品牌 mark:官方 FishLogo(svg)→ 换成我们的 logo。
		function patchSidebarBrand() {
			try {
				if (document.querySelector("img[data-dshwork-brand-mark]")) return;
				// 品牌名是矢量字(不是文本节点),所以按「位置」找:左上角那块 svg。
				const svgs = document.querySelectorAll("svg");
				for (const svg of svgs) {
					const r = svg.getBoundingClientRect();
					if (r.width < 14 || r.width > 64 || r.height < 14 || r.height > 64) continue;
					if (r.left > 132 || r.top > 96) continue; // 必须在左上角
					const s = Math.round(r.width) || 24;
					const img = document.createElement("img");
					img.src = MARK;
					img.setAttribute("data-dshwork-brand-mark", "true");
					img.alt = "dshwork";
					img.width = s;
					img.height = s;
					img.style.objectFit = "contain";
					img.style.display = "block";
					svg.replaceWith(img);
					return;
				}
			} catch (_) {
				/* ignore */
			}
		}
		function patchHero() {
			if (patching || typeof document === "undefined") return;
			patching = true;
			try {
				const els = document.querySelectorAll("span,div,h1,p");
				for (const el of els) {
					if (el.children.length !== 0) continue;
					const txt = (el.textContent || "").trim();
					if (HERO_OLD.indexOf(txt) !== -1) {
						revealChain(el);
						el.textContent = HERO_HEADLINE;
						restructureHero(el);
					} else if (txt === HERO_HEADLINE) {
						revealChain(el);
						restructureHero(el);
					} else if (PREVIEW_OLD.indexOf(txt) !== -1) {
						el.style.display = "none";
					}
				}
				patchSidebarBrand();
			} finally {
				patching = false;
			}
		}
		if (typeof window !== "undefined" && typeof document !== "undefined") {
			patchHero();
			let n = 0;
			const timer = setInterval(() => { patchHero(); if (++n > 600 && timer) clearInterval(timer); }, 700);
			try { new MutationObserver(() => patchHero()).observe(document.documentElement, { childList: true, subtree: true, characterData: true }); } catch (_) {}
		}

		// ── 内置内容(占位/示例) ──
		const PLUGINS = [
			{ name: "工作区", desc: "项目与会话集中管理(harness 原生)" },
			{ name: "皮肤主题", desc: "界面皮肤:whale-girl(已启用)" },
			{ name: "桌面宠物", desc: "dsh-desktop-pet(已启用)" },
			{ name: "DSHwork 品牌", desc: "品牌 logo、首页文案与入口(本插件)" }
		];
		const SKILLS = [
			{ name: "报告生成", desc: "把多来源信息整合成结构化报告 / 方案", cite: "请使用「报告生成」技能:" },
			{ name: "文献检索", desc: "多源检索、归纳要点与引用", cite: "请使用「文献检索」技能:" }
		];

		// ── 组件 ──
		function BrandMark({ size }) {
			// harness 给的 size(首页约 34)偏小,这里放大 ~1.8 倍,竖排居中时更醒目。
			const s = Math.round((size || 34) * 1.8);
			return React.createElement("img", { src: MARK, width: s, height: s, alt: "dshwork", style: { objectFit: "contain", display: "block" } });
		}

		function Icon({ kind }) {
			const paths = {
				plugins: "M4 7h4V3h2v4h4V3h2v4h2v10H2V7h2zm0 2v6h12V9H4z",
				skills: "M10 2l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4L5.5 15.8l.9-5L2.8 7.3l5-.7L10 2z"
			};
			return React.createElement("svg", { viewBox: "0 0 20 20", width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinejoin: "round" },
				React.createElement("path", { d: paths[kind] || "" }));
		}

		function EntryRow({ icon, label, onClick }) {
			return React.createElement("button", { type: "button", className: "dsw-row", onClick: onClick },
				React.createElement("span", { className: "dsw-row-icon" }, React.createElement(Icon, { kind: icon })),
				React.createElement("span", null, label));
		}

		// 把技能引用插进输入框(真的写进 composer)。
		function insertToComposer(text) {
			try {
				const ta = document.querySelector("textarea");
				if (ta) {
					const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
					const next = (ta.value || "") + text;
					if (setter) setter.call(ta, next);
					else ta.value = next;
					ta.dispatchEvent(new Event("input", { bubbles: true }));
					ta.focus();
					return true;
				}
				const ce = document.querySelector('[contenteditable="true"]');
				if (ce) {
					ce.textContent = (ce.textContent || "") + text;
					ce.dispatchEvent(new Event("input", { bubbles: true }));
					ce.focus();
					return true;
				}
			} catch (_) {
				/* ignore */
			}
			return false;
		}

		function Switch({ on, disabled, onToggle }) {
			return React.createElement("button", {
				type: "button",
				className: "dsw-switch" + (on ? " on" : "") + (disabled ? " disabled" : ""),
				role: "switch",
				"aria-checked": on ? "true" : "false",
				disabled: !!disabled,
				title: disabled ? "内置插件,不可停用" : (on ? "已启用,点击停用" : "已停用,点击启用"),
				onClick: (e) => { e.stopPropagation(); if (!disabled) onToggle(!on); }
			}, React.createElement("span", { className: "dsw-knob" }));
		}

		// 技能面板
		function SkillsPanel({ onClose }) {
			return React.createElement("div", { className: "dsw-overlay", onClick: onClose },
				React.createElement("div", { className: "dsw-panel", onClick: (e) => e.stopPropagation() },
					React.createElement("div", { className: "dsw-top" },
						React.createElement("span", { className: "dsw-brand" }, "技能"),
						React.createElement("button", { type: "button", className: "dsw-close", onClick: onClose }, "\u00d7")),
					React.createElement("div", { className: "dsw-body" },
						SKILLS.map((it) => React.createElement("div", { className: "dsw-item", key: it.name },
							React.createElement("div", { className: "dsw-item-main" },
								React.createElement("b", null, it.name),
								React.createElement("span", null, it.desc)),
							React.createElement("button", {
								type: "button",
								className: "dsw-ref",
								title: "把该技能插入输入框",
								onClick: () => { insertToComposer((it.cite || it.name) + " "); onClose(); }
							}, "引用")))),
					React.createElement("div", { className: "dsw-foot" },
						React.createElement("span", { className: "dsw-hint" }, "点「引用」会把技能写进输入框。"))));
		}

		// 插件面板:走 host 的真实接口
		function PluginsPanel({ onClose }) {
			const [items, setItems] = useState(null);
			const [msg, setMsg] = useState("");
			const load = () => {
				fetch("/dshwork/api/plugins", { headers: { accept: "application/json" } })
					.then((r) => r.json())
					.then((d) => setItems(d && d.ok && Array.isArray(d.plugins) ? d.plugins : []))
					.catch(() => setItems([]));
			};
			React.useEffect(load, []);
			function toggle(name, next) {
				setMsg("");
				fetch("/dshwork/api/plugins", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ name: name, enabled: next })
				})
					.then((r) => r.json())
					.then((d) => {
						if (d && d.ok) { setMsg("已保存:" + name + (next ? " 已启用" : " 已停用") + ",重启后生效"); load(); }
						else setMsg("失败:" + ((d && d.error) || "未知错误"));
					})
					.catch((e) => setMsg("失败:" + e.message));
			}
			return React.createElement("div", { className: "dsw-overlay", onClick: onClose },
				React.createElement("div", { className: "dsw-panel", onClick: (e) => e.stopPropagation() },
					React.createElement("div", { className: "dsw-top" },
						React.createElement("span", { className: "dsw-brand" }, "我的插件"),
						React.createElement("button", { type: "button", className: "dsw-close", onClick: onClose }, "\u00d7")),
					React.createElement("div", { className: "dsw-body" },
						items === null ? React.createElement("div", { className: "dsw-hint" }, "读取中…")
							: items.length === 0 ? React.createElement("div", { className: "dsw-hint" }, "读取失败:host 接口未就绪(重启 harness 后可用)")
							: items.map((it) => React.createElement("div", { className: "dsw-item", key: it.name },
								React.createElement("div", { className: "dsw-item-main" },
									React.createElement("b", null, it.name),
									React.createElement("span", null, it.pinned ? "内置,不可停用" : "来自 profile 插件名单")),
								React.createElement(Switch, { on: it.enabled, disabled: it.pinned, onToggle: (v) => toggle(it.name, v) })))),
					React.createElement("div", { className: "dsw-foot" },
						React.createElement("span", { className: "dsw-hint" }, msg || "开关直接改写 profile 的插件名单,重启 harness 后生效。"))));
		}

		function Overlay() {
			const page = useSyncExternalStore(store.subscribe, store.getSnapshot);
			if (!page) return null;
			return page === "plugins"
				? React.createElement(PluginsPanel, { onClose: store.close })
				: React.createElement(SkillsPanel, { onClose: store.close });
		}

		function FooterAction() {
			return React.createElement("div", { style: { display: "flex", flexDirection: "column", width: "100%" } },
				React.createElement(EntryRow, { icon: "plugins", label: "插件", onClick: () => store.openPage("plugins") }),
				React.createElement(EntryRow, { icon: "skills", label: "技能", onClick: () => store.openPage("skills") }));
		}

		function Corner() {
			return React.createElement("div", { className: "dsw-corner" },
				React.createElement("span", { className: "dsw-status" }, React.createElement("span", { className: "dsw-dot" }), " 本地运行"),
				React.createElement("span", { className: "dsw-avatar", title: "未登录(占位)" }, "U"));
		}

		const inject = ["slots"];
		function apply(ctx) {
			ctx.slots.inject("conversation.hero.brand.mark", () => ctx.slots.register({ name: "conversation.hero.brand.mark" }, BrandMark));
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({ name: "sidebar.footer.action", id: "dshwork-entries" }, FooterAction));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({ name: "shell.overlay", id: "dshwork-entries" }, Overlay));
			ctx.slots.inject("conversation.session.header.corner", () => ctx.slots.register({ name: "conversation.session.header.corner", id: "dshwork-corner" }, Corner));
		}

		exports.BrandMark = BrandMark;
		exports.FooterAction = FooterAction;
		exports.Overlay = Overlay;
		exports.Corner = Corner;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
