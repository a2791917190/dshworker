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
\t\tconst { useSyncExternalStore } = React;

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
\t\t\t\t".dsw-panel{width:min(680px,100%);max-height:86vh;overflow:auto;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-primary,#111);border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.35)}",
\t\t\t\t".dsw-top{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.08))}",
\t\t\t\t".dsw-brand{font-weight:700}",
\t\t\t\t".dsw-close{background:0 0;border:none;font-size:20px;line-height:1;cursor:pointer;color:var(--dsw-alias-label-secondary,#888)}",
\t\t\t\t".dsw-body{padding:16px 18px}",
\t\t\t\t".dsw-item{padding:10px 12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:10px;margin-bottom:8px}",
\t\t\t\t".dsw-item b{display:block;font-size:14px}",
\t\t\t\t".dsw-item span{font-size:12.5px;color:var(--dsw-alias-label-tertiary,#777)}",
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
\t\t// 注意:只藏「角标元素本身」,不要藏它的父元素 —— 父元素里通常同时包着标题,
\t\t// 藏父元素会把标题一起藏掉(之前的 bug)。
\t\tfunction patchHero() {
\t\t\tif (typeof document === "undefined") return;
\t\t\tconst els = document.querySelectorAll("span,div");
\t\t\tfor (const el of els) {
\t\t\t\tif (el.children.length !== 0) continue;
\t\t\t\tconst txt = (el.textContent || "").trim();
\t\t\t\tif (HERO_OLD.indexOf(txt) !== -1) {
\t\t\t\t\tel.textContent = HERO_HEADLINE;
\t\t\t\t} else if (PREVIEW_OLD.indexOf(txt) !== -1) {
\t\t\t\t\tel.style.display = "none";
\t\t\t\t}
\t\t\t}
\t\t}
\t\tif (typeof window !== "undefined" && typeof document !== "undefined") {
\t\t\tlet n = 0;
\t\t\tconst timer = setInterval(() => { patchHero(); if (++n > 400 && timer) clearInterval(timer); }, 800);
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
\t\t\t{ name: "报告生成", desc: "把多来源信息整合成结构化报告 / 方案" },
\t\t\t{ name: "文献检索", desc: "多源检索、归纳要点与引用" }
\t\t];

\t\t// ── 组件 ──
\t\tfunction BrandMark({ size }) {
\t\t\tconst s = size || 24;
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

\t\tfunction Panel({ title, items, onClose }) {
\t\t\treturn React.createElement("div", { className: "dsw-overlay", onClick: onClose },
\t\t\t\tReact.createElement("div", { className: "dsw-panel", onClick: (e) => e.stopPropagation() },
\t\t\t\t\tReact.createElement("div", { className: "dsw-top" },
\t\t\t\t\t\tReact.createElement("span", { className: "dsw-brand" }, title),
\t\t\t\t\t\tReact.createElement("button", { type: "button", className: "dsw-close", onClick: onClose }, "\\u00d7")),
\t\t\t\t\tReact.createElement("div", { className: "dsw-body" },
\t\t\t\t\t\titems.map((it) => React.createElement("div", { className: "dsw-item", key: it.name },
\t\t\t\t\t\t\tReact.createElement("b", null, it.name),
\t\t\t\t\t\t\tReact.createElement("span", null, it.desc))))));
\t\t}

\t\tfunction Overlay() {
\t\t\tconst page = useSyncExternalStore(store.subscribe, store.getSnapshot);
\t\t\tif (!page) return null;
\t\t\tconst isPlugins = page === "plugins";
\t\t\treturn React.createElement(Panel, { title: isPlugins ? "我的插件" : "技能", items: isPlugins ? PLUGINS : SKILLS, onClose: store.close });
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
