'use strict';

/**
 * 生成 lib/client.js(DSHwork 品牌/入口客户端插件):
 *  - 首页 hero 品牌 mark = dshwork 小鲸鱼 logo;
 *  - 侧边栏底部「插件」「技能」入口 -> 弹出自定义清单页;
 *  - 会话头部右上角:用户头像 + 运行状态(占位,无真实接口)。
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

\t\t// ── overlay 可见性/当前页 store(模块级,两个入口共享) ──
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
\t\t\t\t".dsw-overlay{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(4,8,16,.55);padding:24px;box-sizing:border-box}",
\t\t\t\t".dsw-panel{width:min(720px,100%);max-height:86vh;overflow:auto;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-primary,#111);border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));border-radius:16px;box-shadow:0 24px 64px rgba(0,0,0,.35)}",
\t\t\t\t".dsw-top{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.08))}",
\t\t\t\t".dsw-brand{font-weight:700}",
\t\t\t\t".dsw-close{background:0 0;border:none;font-size:20px;line-height:1;cursor:pointer;color:var(--dsw-alias-label-secondary,#888)}",
\t\t\t\t".dsw-body{padding:16px 18px}",
\t\t\t\t".dsw-item{display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:10px;margin-bottom:8px}",
\t\t\t\t".dsw-item b{display:block;font-size:14px}",
\t\t\t\t".dsw-item span{font-size:12.5px;color:var(--dsw-alias-label-tertiary,#777)}",
\t\t\t\t".dsw-action{display:inline-flex;align-items:center;gap:6px;background:0 0;border:none;cursor:pointer;color:var(--dsw-alias-label-secondary,#666);font-size:13px;padding:6px 8px;border-radius:8px}",
\t\t\t\t".dsw-action:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06))}",
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

\t\t// ── 内置内容(占位/示例) ──
\t\tconst PLUGINS = [
\t\t\t{ name: "工作区", desc: "项目与会话集中管理(harness 原生)" },
\t\t\t{ name: "皮肤主题", desc: "界面皮肤:whale-girl(已启用)" },
\t\t\t{ name: "桌面宠物", desc: "dsh-desktop-pet(已启用)" },
\t\t\t{ name: "DSHwork 品牌", desc: "品牌 logo 与侧边栏入口(本插件)" }
\t\t];
\t\tconst SKILLS = [
\t\t\t{ name: "报告生成", desc: "把多来源信息整合成结构化报告 / 方案" },
\t\t\t{ name: "文献检索", desc: "多源检索、归纳要点与引用" }
\t\t];

\t\t// ── 组件 ──
\t\tfunction BrandMark({ size }) {
\t\t\tconst s = size || 24;
\t\t\treturn React.createElement("img", {
\t\t\t\tsrc: MARK, width: s, height: s, alt: "dshwork",
\t\t\t\tstyle: { objectFit: "contain", display: "block" }
\t\t\t});
\t\t}

\t\tfunction Panel({ title, items, onClose }) {
\t\t\treturn React.createElement("div", { className: "dsw-overlay", onClick: onClose },
\t\t\t\tReact.createElement("div", { className: "dsw-panel", onClick: (e) => e.stopPropagation() },
\t\t\t\t\tReact.createElement("div", { className: "dsw-top" },
\t\t\t\t\t\tReact.createElement("span", { className: "dsw-brand" }, title),
\t\t\t\t\t\tReact.createElement("button", { type: "button", className: "dsw-close", onClick: onClose }, "×")
\t\t\t\t\t),
\t\t\t\t\tReact.createElement("div", { className: "dsw-body" },
\t\t\t\t\t\titems.map((it) => React.createElement("div", { className: "dsw-item", key: it.name },
\t\t\t\t\t\t\tReact.createElement("div", null,
\t\t\t\t\t\t\t\tReact.createElement("b", null, it.name),
\t\t\t\t\t\t\t\tReact.createElement("span", null, it.desc)
\t\t\t\t\t\t\t)
\t\t\t\t\t\t))
\t\t\t\t\t)
\t\t\t\t)
\t\t\t);
\t\t}

\t\tfunction Overlay() {
\t\t\tconst page = useSyncExternalStore(store.subscribe, store.getSnapshot);
\t\t\tif (!page) return null;
\t\t\tconst isPlugins = page === "plugins";
\t\t\treturn React.createElement(Panel, {
\t\t\t\ttitle: isPlugins ? "我的插件" : "技能",
\t\t\t\titems: isPlugins ? PLUGINS : SKILLS,
\t\t\t\tonClose: store.close
\t\t\t});
\t\t}

\t\tfunction FooterAction() {
\t\t\treturn React.createElement("div", { style: { display: "flex", gap: 2 } },
\t\t\t\tReact.createElement("button", { type: "button", className: "dsw-action", title: "插件", onClick: () => store.openPage("plugins") },
\t\t\t\t\tReact.createElement("span", null, "\\uD83E\\uDDE9"), React.createElement("span", null, "插件")),
\t\t\t\tReact.createElement("button", { type: "button", className: "dsw-action", title: "技能", onClick: () => store.openPage("skills") },
\t\t\t\t\tReact.createElement("span", null, "\\u2728"), React.createElement("span", null, "技能"))
\t\t\t);
\t\t}

\t\tfunction Corner() {
\t\t\t// 右上角:运行状态 + 用户头像(占位,用户暂无真实接口)
\t\t\treturn React.createElement("div", { className: "dsw-corner" },
\t\t\t\tReact.createElement("span", { className: "dsw-status" }, React.createElement("span", { className: "dsw-dot" }), " 本地运行"),
\t\t\t\tReact.createElement("span", { className: "dsw-avatar", title: "未登录(占位)" }, "U")
\t\t\t);
\t\t}

\t\tconst inject = ["slots"];
\t\tfunction apply(ctx) {
\t\t\t// 首页 hero 品牌 mark(新会话时中间那个 logo)
\t\t\tctx.slots.inject("conversation.hero.brand.mark", () =>
\t\t\t\tctx.slots.register({ name: "conversation.hero.brand.mark" }, BrandMark));
\t\t\t// 侧边栏底部:插件 / 技能 入口
\t\t\tctx.slots.inject("sidebar.footer.action", () =>
\t\t\t\tctx.slots.register({ name: "sidebar.footer.action", id: "dshwork-entries" }, FooterAction));
\t\t\t// 弹出清单页
\t\t\tctx.slots.inject("shell.overlay", () =>
\t\t\t\tctx.slots.register({ name: "shell.overlay", id: "dshwork-entries" }, Overlay));
\t\t\t// 会话头部右上角:运行状态 + 用户占位
\t\t\tctx.slots.inject("conversation.session.header.corner", () =>
\t\t\t\tctx.slots.register({ name: "conversation.session.header.corner", id: "dshwork-corner" }, Corner));
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
