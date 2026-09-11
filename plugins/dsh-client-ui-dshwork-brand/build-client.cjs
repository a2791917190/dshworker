'use strict';

/**
 * 生成 lib/client.js:把品牌图标(base64)内嵌进客户端插件,占住 harness 的
 * 品牌 slot(首页 hero + 侧边栏)。
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

\t\t// dshwork 品牌图标(鲸鱼+笔记本,base64 内嵌,免额外资源服务)
\t\tconst MARK = ${JSON.stringify(MARK)};

\t\tfunction BrandMark({ size }) {
\t\t\tconst s = size || 24;
\t\t\treturn React.createElement("img", {
\t\t\t\tsrc: MARK, width: s, height: s, alt: "dshwork",
\t\t\t\tstyle: { objectFit: "contain", display: "block" }
\t\t\t});
\t\t}
\t\tfunction BrandName() {
\t\t\treturn React.createElement("span", { style: { fontWeight: 700, letterSpacing: ".3px" } }, "dshwork");
\t\t}

\t\tconst inject = ["slots"];
\t\tfunction apply(ctx) {
\t\t\t// 只占「首页 hero 的品牌 mark」(新会话时中间那个 logo)。
\t\t\t// 侧边栏品牌(sidebar.brand.mark/name)是 single slot,官方插件已占用,
\t\t\t// 不再抢占,保持官方 "deepseek HARNESS" 不动。
\t\t\tctx.slots.inject("conversation.hero.brand.mark", () =>
\t\t\t\tctx.slots.register({ name: "conversation.hero.brand.mark" }, BrandMark));
\t\t}

\t\texports.BrandMark = BrandMark;
\t\texports.BrandName = BrandName;
\t\texports.apply = apply;
\t\texports.inject = inject;
\t\treturn module.exports;
\t}
});
`;

const out = path.join(__dirname, 'lib', 'client.js');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, template, 'utf8');
console.log('已生成:', out, `(mark ${MARK.length} chars)`);
