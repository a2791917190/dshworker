'use strict';

/**
 * 生成 lib/client.js(DSHwork 品牌/入口客户端插件):
 *  - 首页 hero 品牌 mark = dshwork 小鲸鱼 logo;
 *  - hero 文案:DOM 层把 "探索未至之境" 换成 "让DSH Work 帮你高效完成工作任务!",并藏掉"预览版"角标;
 *  - 侧边栏底部「插件」「技能」入口,样式仿「设置」行;
 *  - 会话头部右上角:用户头像 + 运行状态(占位)。
 *
 * 用法(在插件目录下): node build-client.cjs
 */

const fs = require('fs');
const path = require('path');

const b64Path = path.join(__dirname, '..', '..', 'desktop', 'assets', 'brand', 'logo-mark.base64.txt');
if (!fs.existsSync(b64Path)) {
  console.error('缺少图标 base64:', b64Path, '(先跑 desktop/scripts/make-brand-icon.cjs)');
  process.exit(1);
}
const MARK = fs.readFileSync(b64Path, 'utf8').trim();

const template = `window.__ModuleLoader__.load({
\tid: "@dshwork/dsh-client-ui-dshwork-brand",
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
\t\tvar React = require("react");
\t\tconst { useState, useSyncExternalStore } = React;

\t\tconst MARK = __MARK__;
\t\tconst HERO_HEADLINE = "让DSH Work 帮你高效完成工作任务！";
\t\tconst HERO_OLD = ["探索未至之境", "Into the Unknown"];
\t\tconst PREVIEW_OLD = ["预览版", "Preview"];

\t\t// ── overlay store ──
\t\tvar v = { open: false, page: "plugins" };
\t\tconst listeners = new Set();
\t\tfunction emit() { for (const l of [...listeners]) l(); }
\t\tconst store = {
\t\t\tsubscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); },
\t\t\tgetSnapshot() { return v.open ? v.page : ""; },
\t\t\topenPage(page) { v.open = true; v.page = page; emit(); },
\t\t\tclose() { v.open = false; emit(); }
\t\t};

\t\t// ── 样式 ──
\t\t(function injectStyles() {
\t\t\tif (typeof document === "undefined") return;
\t\t\tif (document.querySelector("style[data-dshwork-brand]") !== null) return;
\t\t\tconst css = [
\t\t\t\t".dsw-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(4,8,16,.5);padding:24px;box-sizing:border-box}",
\t\t\t\t".dsw-panel{width:min(680px,100%);max-height:86vh;overflow:auto;background:#ffffff;color:#141414;border:1px solid rgba(0,0,0,.12);border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.45)}",
\t\t\t\t".dsw-top{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.08))}",
\t\t\t\t".dsw-brand{font-weight:700}",
\t\t\t\t".dsw-close{background:0 0;border:none;font-size:20px;line-height:1;cursor:pointer;color:var(--dsw-alias-label-secondary,#888)}",
\t\t\t\t".dsw-body{padding:16px 18px}",
\t\t\t\t".dsw-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid rgba(0,0,0,.1);border-radius:10px;margin-bottom:8px;background:#fff}",
\t\t\t\t".dsw-item-main{flex:1;min-width:0}",
\t\t\t\t".dsw-item b{display:block;font-size:14px;color:#141414}",
\t\t\t\t".dsw-item-main span{font-size:12.5px;color:#7a7a7a}",
\t\t\t\t".dsw-badge{flex:none;font-size:12px;color:#1f9d55;background:rgba(31,157,85,.12);border-radius:999px;padding:3px 10px}",
\t\t\t\t".dsw-switch{position:relative;flex:none;width:38px;height:22px;border-radius:11px;border:none;background:rgba(0,0,0,.2);cursor:pointer;padding:0;transition:background .15s}",
\t\t\t\t".dsw-switch.on{background:#3b82f6}",
\t\t\t\t".dsw-switch.disabled{opacity:.45;cursor:default}",
\t\t\t\t".dsw-knob{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:transform .15s}",
\t\t\t\t".dsw-switch.on .dsw-knob{transform:translateX(16px)}",
\t\t\t\t".dsw-ref{flex:none;border:1px solid rgba(0,0,0,.16);background:transparent;border-radius:8px;padding:5px 12px;font-size:12.5px;cursor:pointer;color:#141414;font-family:inherit}",
\t\t\t\t".dsw-ref:hover{background:rgba(0,0,0,.06)}",
\t\t\t\t".dsw-foot{display:flex;align-items:center;padding:10px 18px 14px;border-top:1px solid rgba(0,0,0,.08)}",
\t\t\t\t".dsw-hint{flex:1;font-size:12px;color:#8a8a8a}",
\t\t\t\t".dsw-row{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;padding:7px 8px 7px 2px;margin:1px 0 1px -2px;background:transparent;border:none;border-left:2px solid transparent;border-radius:8px;cursor:pointer;color:var(--dsw-alias-label-primary,inherit);font-size:14px;text-align:left;font-family:inherit}",
\t\t\t\t".dsw-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));border-left-color:var(--dsw-alias-state-business-primary,#3b82f6)}",
\t\t\t\t".dsw-row-icon{display:inline-flex;width:18px;height:18px;align-items:center;justify-content:center;flex:none}",
\t\t\t\t".dsw-corner{display:flex;align-items:center;gap:8px}",
\t\t\t\t".dsw-dot{width:7px;height:7px;border-radius:50%;background:#3fd68f;display:inline-block}",
\t\t\t\t".dsw-status{font-size:12.5px;color:var(--dsw-alias-label-secondary,#666)}",
\t\t\t\t".dsw-avatar{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#4f7cff,#7aa2ff);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700}"
\t\t\t].join("");
\t\t\tconst tag = document.createElement("style");
\t\t\ttag.dataset.dshworkBrand = "true";
\t\t\ttag.textContent = css;
\t\t\tdocument.head.appendChild(tag);
\t\t})();

\t\t// ── DOM 层:替换 hero 文案 + 藏预览角标 ──
\t\t// 注意:只藏「角标元素本身」,绝不藏父元素(父元素里还包着标题)。
\t\t// 同时:若标题的某个祖先曾被旧版误藏(display:none),这里负责恢复。
\t\tlet patching = false;
\t\tfunction revealChain(el) {
\t\t\tlet p = el;
\t\t\twhile (p && p !== document.body && p.style) {
\t\t\t\tif (p.style.display === "none") p.style.display = "";
\t\t\t\tp = p.parentElement;
\t\t\t}
\t\t}
\t\t// 把首页品牌区改成「竖排居中」:logo 在上、文字在下。
\t\tfunction restructureHero(headlineEl) {
\t\t\ttry {
\t\t\t\tconst group = headlineEl.parentElement; // titleGroup(标题 + 角标)
\t\t\t\tif (!group) return;
\t\t\t\tconst row = group.parentElement; // 品牌行(logo + titleGroup)
\t\t\t\tif (row && row !== document.body) {
\t\t\t\t\trow.style.display = "flex";
\t\t\t\t\trow.style.flexDirection = "column";
\t\t\t\t\trow.style.alignItems = "center";
\t\t\t\t\trow.style.justifyContent = "center";
\t\t\t\t\trow.style.gap = "14px";
\t\t\t\t}
\t\t\t\tgroup.style.display = "flex";
\t\t\t\tgroup.style.flexDirection = "column";
\t\t\t\tgroup.style.alignItems = "center";
\t\t\t\tgroup.style.gap = "8px";
\t\t\t} catch (_) {
\t\t\t\t/* ignore */
\t\t\t}
\t\t}
\t\t// 侧边栏左上角品牌 mark:官方 FishLogo(svg)→ 换成我们的 logo。
\t\tfunction patchSidebarBrand() {
\t\t\ttry {
\t\t\t\tif (document.querySelector("img[data-dshwork-brand-mark]")) return;
\t\t\t\t// 品牌名是矢量字(不是文本节点),所以按「位置」找:左上角那块 svg。
\t\t\t\tconst svgs = document.querySelectorAll("svg");
\t\t\t\tfor (const svg of svgs) {
\t\t\t\t\tconst r = svg.getBoundingClientRect();
\t\t\t\t\tif (r.width < 14 || r.width > 64 || r.height < 14 || r.height > 64) continue;
\t\t\t\t\tif (r.left > 132 || r.top > 96) continue; // 必须在左上角
\t\t\t\t\tconst s = Math.round(r.width) || 24;
\t\t\t\t\tconst img = document.createElement("img");
\t\t\t\t\timg.src = MARK;
\t\t\t\t\timg.setAttribute("data-dshwork-brand-mark", "true");
\t\t\t\t\timg.alt = "dshwork";
\t\t\t\t\timg.width = s;
\t\t\t\t\timg.height = s;
\t\t\t\t\timg.style.objectFit = "contain";
\t\t\t\t\timg.style.display = "block";
\t\t\t\t\tsvg.replaceWith(img);
\t\t\t\t\treturn;
\t\t\t\t}
\t\t\t} catch (_) {
\t\t\t\t/* ignore */
\t\t\t}
\t\t}
\t\tfunction patchHero() {
\t\t\tif (patching || typeof document === "undefined") return;
\t\t\tpatching = true;
\t\t\ttry {
\t\t\t\tconst els = document.querySelectorAll("span,div,h1,p");
\t\t\t\tfor (const el of els) {
\t\t\t\t\tif (el.children.length !== 0) continue;
\t\t\t\t\tconst txt = (el.textContent || "").trim();
\t\t\t\t\tif (HERO_OLD.indexOf(txt) !== -1) {
\t\t\t\t\t\trevealChain(el);
\t\t\t\t\t\tel.textContent = HERO_HEADLINE;
\t\t\t\t\t\trestructureHero(el);
\t\t\t\t\t} else if (txt === HERO_HEADLINE) {
\t\t\t\t\t\trevealChain(el);
\t\t\t\t\t\trestructureHero(el);
\t\t\t\t\t} else if (PREVIEW_OLD.indexOf(txt) !== -1) {
\t\t\t\t\t\tel.style.display = "none";
\t\t\t\t\t}
\t\t\t\t}
\t\t\t\tpatchSidebarBrand();
\t\t\t} finally {
\t\t\t\tpatching = false;
\t\t\t}
\t\t}
\t\tif (typeof window !== "undefined" && typeof document !== "undefined") {
\t\t\tpatchHero();
\t\t\tlet n = 0;
\t\t\tconst timer = setInterval(() => { patchHero(); if (++n > 600 && timer) clearInterval(timer); }, 700);
\t\t\ttry { new MutationObserver(() => patchHero()).observe(document.documentElement, { childList: true, subtree: true, characterData: true }); } catch (_) {}
\t\t}

\t\t// ── 内置内容(占位/示例) ──
\t\tconst PLUGINS = [
\t\t\t{ name: "工作区", desc: "项目与会话集中管理(harness 原生)" },
\t\t\t{ name: "皮肤主题", desc: "界面皮肤:whale-girl(已启用)" },
\t\t\t{ name: "桌面宠物", desc: "dsh-desktop-pet(已启用)" },
\t\t\t{ name: "DSHwork 品牌", desc: "品牌 logo、首页文案与入口(本插件)" }
\t\t];
\t\tconst SKILLS = [
\t\t\t{ name: "报告生成", desc: "把多来源信息整合成结构化报告 / 方案", cite: "请使用「报告生成」技能:" },
\t\t\t{ name: "文献检索", desc: "多源检索、归纳要点与引用", cite: "请使用「文献检索」技能:" }
\t\t];

\t\t// ── 组件 ──
\t\tfunction BrandMark({ size }) {
\t\t\t// harness 给的 size(首页约 34)偏小,这里放大 ~1.8 倍,竖排居中时更醒目。
\t\t\tconst s = Math.round((size || 34) * 1.8);
\t\t\treturn React.createElement("img", { src: MARK, width: s, height: s, alt: "dshwork", style: { objectFit: "contain", display: "block" } });
\t\t}

\t\tfunction Icon({ kind }) {
\t\t\tconst paths = {
\t\t\t\tplugins: "M4 7h4V3h2v4h4V3h2v4h2v10H2V7h2zm0 2v6h12V9H4z",
\t\t\t\tskills: "M10 2l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4L5.5 15.8l.9-5L2.8 7.3l5-.7L10 2z"
\t\t\t};
\t\t\treturn React.createElement("svg", { viewBox: "0 0 20 20", width: 18, height: 18, fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinejoin: "round" },
\t\t\t\tReact.createElement("path", { d: paths[kind] || "" }));
\t\t}

\t\tfunction EntryRow({ icon, label, onClick }) {
\t\t\treturn React.createElement("button", { type: "button", className: "dsw-row", onClick: onClick },
\t\t\t\tReact.createElement("span", { className: "dsw-row-icon" }, React.createElement(Icon, { kind: icon })),
\t\t\t\tReact.createElement("span", null, label));
\t\t}

\t\t// 把技能引用插进输入框(真的写进 composer)。
\t\tfunction insertToComposer(text) {
\t\t\ttry {
\t\t\t\tconst ta = document.querySelector("textarea");
\t\t\t\tif (ta) {
\t\t\t\t\tconst setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
\t\t\t\t\tconst next = (ta.value || "") + text;
\t\t\t\t\tif (setter) setter.call(ta, next);
\t\t\t\t\telse ta.value = next;
\t\t\t\t\tta.dispatchEvent(new Event("input", { bubbles: true }));
\t\t\t\t\tta.focus();
\t\t\t\t\treturn true;
\t\t\t\t}
\t\t\t\tconst ce = document.querySelector('[contenteditable="true"]');
\t\t\t\tif (ce) {
\t\t\t\t\tce.textContent = (ce.textContent || "") + text;
\t\t\t\t\tce.dispatchEvent(new Event("input", { bubbles: true }));
\t\t\t\t\tce.focus();
\t\t\t\t\treturn true;
\t\t\t\t}
\t\t\t} catch (_) {
\t\t\t\t/* ignore */
\t\t\t}
\t\t\treturn false;
\t\t}

\t\tfunction Switch({ on, disabled, onToggle }) {
\t\t\treturn React.createElement("button", {
\t\t\t\ttype: "button",
\t\t\t\tclassName: "dsw-switch" + (on ? " on" : "") + (disabled ? " disabled" : ""),
\t\t\t\trole: "switch",
\t\t\t\t"aria-checked": on ? "true" : "false",
\t\t\t\tdisabled: !!disabled,
\t\t\t\ttitle: disabled ? "内置插件,不可停用" : (on ? "已启用,点击停用" : "已停用,点击启用"),
\t\t\t\tonClick: (e) => { e.stopPropagation(); if (!disabled) onToggle(!on); }
\t\t\t}, React.createElement("span", { className: "dsw-knob" }));
\t\t}

\t\t// 技能面板
\t\tfunction SkillsPanel({ onClose }) {
\t\t\treturn React.createElement("div", { className: "dsw-overlay", onClick: onClose },
\t\t\t\tReact.createElement("div", { className: "dsw-panel", onClick: (e) => e.stopPropagation() },
\t\t\t\t\tReact.createElement("div", { className: "dsw-top" },
\t\t\t\t\t\tReact.createElement("span", { className: "dsw-brand" }, "技能"),
\t\t\t\t\t\tReact.createElement("button", { type: "button", className: "dsw-close", onClick: onClose }, "\\u00d7")),
\t\t\t\t\tReact.createElement("div", { className: "dsw-body" },
\t\t\t\t\t\tSKILLS.map((it) => React.createElement("div", { className: "dsw-item", key: it.name },
\t\t\t\t\t\t\tReact.createElement("div", { className: "dsw-item-main" },
\t\t\t\t\t\t\t\tReact.createElement("b", null, it.name),
\t\t\t\t\t\t\t\tReact.createElement("span", null, it.desc)),
\t\t\t\t\t\t\tReact.createElement("button", {
\t\t\t\t\t\t\t\ttype: "button",
\t\t\t\t\t\t\t\tclassName: "dsw-ref",
\t\t\t\t\t\t\t\ttitle: "把该技能插入输入框",
\t\t\t\t\t\t\t\tonClick: () => { insertToComposer((it.cite || it.name) + " "); onClose(); }
\t\t\t\t\t\t\t}, "引用")))),
\t\t\t\t\tReact.createElement("div", { className: "dsw-foot" },
\t\t\t\t\t\tReact.createElement("span", { className: "dsw-hint" }, "点「引用」会把技能写进输入框。"))));
\t\t}

\t\t// 插件面板:走 host 的真实接口
\t\tfunction PluginsPanel({ onClose }) {
\t\t\tconst [items, setItems] = useState(null);
\t\t\tconst [msg, setMsg] = useState("");
\t\t\tconst load = () => {
\t\t\t\tfetch("/dshwork/api/plugins", { headers: { accept: "application/json" } })
\t\t\t\t\t.then((r) => r.json())
\t\t\t\t\t.then((d) => setItems(d && d.ok && Array.isArray(d.plugins) ? d.plugins : []))
\t\t\t\t\t.catch(() => setItems([]));
\t\t\t};
\t\t\tReact.useEffect(load, []);
\t\t\tfunction toggle(name, next) {
\t\t\t\tsetMsg("");
\t\t\t\tfetch("/dshwork/api/plugins", {
\t\t\t\t\tmethod: "POST",
\t\t\t\t\theaders: { "content-type": "application/json" },
\t\t\t\t\tbody: JSON.stringify({ name: name, enabled: next })
\t\t\t\t})
\t\t\t\t\t.then((r) => r.json())
\t\t\t\t\t.then((d) => {
\t\t\t\t\t\tif (d && d.ok) { setMsg("已保存:" + name + (next ? " 已启用" : " 已停用") + ",重启后生效"); load(); }
\t\t\t\t\t\telse setMsg("失败:" + ((d && d.error) || "未知错误"));
\t\t\t\t\t})
\t\t\t\t\t.catch((e) => setMsg("失败:" + e.message));
\t\t\t}
\t\t\treturn React.createElement("div", { className: "dsw-overlay", onClick: onClose },
\t\t\t\tReact.createElement("div", { className: "dsw-panel", onClick: (e) => e.stopPropagation() },
\t\t\t\t\tReact.createElement("div", { className: "dsw-top" },
\t\t\t\t\t\tReact.createElement("span", { className: "dsw-brand" }, "我的插件"),
\t\t\t\t\t\tReact.createElement("button", { type: "button", className: "dsw-close", onClick: onClose }, "\\u00d7")),
\t\t\t\t\tReact.createElement("div", { className: "dsw-body" },
\t\t\t\t\t\titems === null ? React.createElement("div", { className: "dsw-hint" }, "读取中…")
\t\t\t\t\t\t\t: items.length === 0 ? React.createElement("div", { className: "dsw-hint" }, "读取失败:host 接口未就绪(重启 harness 后可用)")
\t\t\t\t\t\t\t: items.map((it) => React.createElement("div", { className: "dsw-item", key: it.name },
\t\t\t\t\t\t\t\tReact.createElement("div", { className: "dsw-item-main" },
\t\t\t\t\t\t\t\t\tReact.createElement("b", null, it.name),
\t\t\t\t\t\t\t\t\tReact.createElement("span", null, it.pinned ? "内置,不可停用" : "来自 profile 插件名单")),
\t\t\t\t\t\t\t\tReact.createElement(Switch, { on: it.enabled, disabled: it.pinned, onToggle: (v) => toggle(it.name, v) })))),
\t\t\t\t\tReact.createElement("div", { className: "dsw-foot" },
\t\t\t\t\t\tReact.createElement("span", { className: "dsw-hint" }, msg || "开关直接改写 profile 的插件名单,重启 harness 后生效。"))));
\t\t}

\t\tfunction Overlay() {
\t\t\tconst page = useSyncExternalStore(store.subscribe, store.getSnapshot);
\t\t\tif (!page) return null;
\t\t\treturn page === "plugins"
\t\t\t\t? React.createElement(PluginsPanel, { onClose: store.close })
\t\t\t\t: React.createElement(SkillsPanel, { onClose: store.close });
\t\t}

\t\tfunction FooterAction() {
\t\t\treturn React.createElement("div", { style: { display: "flex", flexDirection: "column", width: "100%" } },
\t\t\t\tReact.createElement(EntryRow, { icon: "plugins", label: "插件", onClick: () => store.openPage("plugins") }),
\t\t\t\tReact.createElement(EntryRow, { icon: "skills", label: "技能", onClick: () => store.openPage("skills") }));
\t\t}

\t\tfunction Corner() {
\t\t\treturn React.createElement("div", { className: "dsw-corner" },
\t\t\t\tReact.createElement("span", { className: "dsw-status" }, React.createElement("span", { className: "dsw-dot" }), " 本地运行"),
\t\t\t\tReact.createElement("span", { className: "dsw-avatar", title: "未登录(占位)" }, "U"));
\t\t}

\t\tconst inject = ["slots"];
\t\tfunction apply(ctx) {
\t\t\tctx.slots.inject("conversation.hero.brand.mark", () => ctx.slots.register({ name: "conversation.hero.brand.mark" }, BrandMark));
\t\t\tctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({ name: "sidebar.footer.action", id: "dshwork-entries" }, FooterAction));
\t\t\tctx.slots.inject("shell.overlay", () => ctx.slots.register({ name: "shell.overlay", id: "dshwork-entries" }, Overlay));
\t\t\tctx.slots.inject("conversation.session.header.corner", () => ctx.slots.register({ name: "conversation.session.header.corner", id: "dshwork-corner" }, Corner));
\t\t}

\t\texports.BrandMark = BrandMark;
\t\texports.FooterAction = FooterAction;
\t\texports.Overlay = Overlay;
\t\texports.Corner = Corner;
\t\texports.apply = apply;
\t\texports.inject = inject;
\t\treturn module.exports;
\t}
});
`;

const out = path.join(__dirname, 'lib', 'client.js');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, template.replace('__MARK__', JSON.stringify(MARK)), 'utf8');
console.log('已生成:', out, `(${fs.statSync(out).size} bytes)`);
