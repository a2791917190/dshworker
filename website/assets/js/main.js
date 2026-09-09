'use strict';

/**
 * DSHwork 官网交互:双语切换、滚动导航态、粒子背景。
 */

const I18N = {
  zh: {
    'nav.tag': 'DeepSeek Agent 工作台',
    'nav.features': '特性',
    'nav.download': '下载',
    'nav.community': '社区 DeepSeek.club',
    'nav.cta': '下载',
    'hero.eyebrow': 'DSHWORK.AI · AI 生产力工作台',
    'hero.title': 'DSHwork,<em>解放你的生产力</em>。',
    'hero.sub': '零命令、开箱即用的 AI 工作台。打开它,你是用 AI 把活干完——而不是折腾开发者工具。',
    'p1': '零命令',
    'p2': '预置模板',
    'p3': '一个窗口搞定一天',
    'p4': '产物直接可用',
    'hero.cta': '下载 DSHwork',
    'hero.ghost': '查看 GitHub',
    'hero.badge': 'Windows / macOS · 双击即用 · 无需配置',
    'why.kicker': 'WHY DSHWORK',
    'why.title': 'AI 很强大,<br>它 <em>不该是道门槛</em>。',
    'why.sub': '对普通知识工作者来说,命令、环境、Agent、插件……每个词都是一道门槛。DSHwork 把这些都藏起来,只给你一张办公桌。',
    'w1.title': '门槛劝退',
    'w1.desc': '强 AI 很强大,但命令与配置把太多人挡在门外。',
    'w2.title': '双击即用',
    'w2.desc': '像普通软件一样,双击图标,工作台就绪。',
    'w3.title': '把事做成',
    'w3.desc': '你不折腾工具,只把报告、调研、文档做成型。',
    'features.kicker': 'FEATURES',
    'features.title': '把复杂留给我们,把简单还给你',
    'f1.title': '零命令',
    'f1.desc': '不用记命令、不用配环境,双击即用,自动检测并启动。',
    'f2.title': '预置模板',
    'f2.desc': '任务 = 模板:研究报告、资料调研、文献整理、长文起草……选一个就开工。',
    'f3.title': '一个窗口搞定一天',
    'f3.desc': '项目、资料、任务、产物集中一处,不用在多个工具间切换。',
    'f4.title': '产物直接可用',
    'f4.desc': '生成可编辑的 Office 文档,打开就能用、就能改。',
    'eco.kicker': 'ECOSYSTEM',
    'eco.title': '不只是工具,<br>是 <em>DeepSeek.club 生态</em>的落地窗口',
    'e1.title': '装个插件就变强',
    'e1.desc': 'DeepSeek.club 插件库 → 一键装进 DSHwork,能力随手扩展。',
    'e2.title': '学了就会用',
    'e2.desc': 'Harness 学院课程 → 学完直接在 DSHwork 里上手实践。',
    'e3.title': '今天就能干活',
    'e3.desc': '预置模板直接产出报告、调研、文档,打开就用。',
    'dl.kicker': 'DOWNLOAD',
    'dl.title': '下载 DSHwork',
    'dl.sub': 'Windows 与 macOS,双击即用。开源、免费、可审计。',
    'dl.win': 'Windows 版',
    'dl.winSub': 'x64 · 安装程序(NSIS)',
    'dl.mac': 'macOS 版',
    'dl.macSub': 'Universal · DMG',
    'dl.github': 'GitHub 入口 · 源码与 Releases',
    'dl.note': '安装包尚未发布时,请以 GitHub Releases 为准。',
    'community.kicker': 'COMMUNITY',
    'community.title': '由深求社区 DeepSeek.club 出品',
    'community.sub': '全球领先的第三方 DeepSeek 开源生态社区:模型库、插件库 Plugin Hub、应用榜、Harness 学院。DSHwork 是这些资产落地到你桌面上的"最后一公里"。',
    'community.club': '访问 deepseek.club →',
    'community.contact': '联系我们:',
    'dsh.title': 'DSH.club · Harness 专区',
    'dsh.text': '关于 Harness 的一切,在这里讨论、获取、共建。',
    'dsh.em': '开源,放大你的价值!',
    'dsh.cta': '进入 DSH.club →',
    'footer.tag': 'DeepSeek Agent 工作台',
    'footer.legal': 'DSHwork 是由深求社区(DeepSeek.club)维护的独立社区开源项目,与深度求索 / DeepSeek 官方无隶属、合作、授权或背书关系。'
  },
  en: {
    'nav.tag': 'DeepSeek Agent Workbench',
    'nav.features': 'Features',
    'nav.download': 'Download',
    'nav.community': 'DeepSeek.club',
    'nav.cta': 'Download',
    'hero.eyebrow': 'DSHWORK.AI · AI PRODUCTIVITY WORKSPACE',
    'hero.title': 'DSHwork, <em>unlock your productivity</em>.',
    'hero.sub': 'A zero-command, ready-out-of-the-box AI workspace. Open it to get things done with AI — not to wrestle with developer tools.',
    'p1': 'Zero commands',
    'p2': 'Ready templates',
    'p3': 'One window for the day',
    'p4': 'Usable output',
    'hero.cta': 'Download DSHwork',
    'hero.ghost': 'View on GitHub',
    'hero.badge': 'Windows / macOS · Double-click · No setup',
    'why.kicker': 'WHY DSHWORK',
    'why.title': 'AI is powerful —<br>it <em>should not be the barrier</em>.',
    'why.sub': 'For knowledge workers, every word — commands, environment, agents, plugins — is a hurdle. DSHwork hides all of them and just gives you a desk.',
    'w1.title': 'The hurdle',
    'w1.desc': 'Powerful AI, but commands and setup turn too many people away.',
    'w2.title': 'Double-click',
    'w2.desc': 'Just like normal software — double-click and the desk is ready.',
    'w3.title': 'Get things done',
    'w3.desc': 'You do not wrestle with tools; you finish reports, research, and docs.',
    'features.kicker': 'FEATURES',
    'features.title': 'We keep the complexity, you keep it simple',
    'f1.title': 'Zero commands',
    'f1.desc': 'No commands, no setup. Double-click, auto-detect, launch.',
    'f2.title': 'Ready templates',
    'f2.desc': 'A task = a template: research report, source survey, literature review, long-form draft…',
    'f3.title': 'One window for the day',
    'f3.desc': 'Projects, sources, tasks, and output in one place.',
    'f4.title': 'Usable output',
    'f4.desc': 'Generates editable Office docs — open and use them immediately.',
    'eco.kicker': 'ECOSYSTEM',
    'eco.title': 'Not just a tool —<br>the <em>DeepSeek.club ecosystem</em> on your desk',
    'e1.title': 'Install a plugin, get stronger',
    'e1.desc': 'DeepSeek.club Plugin Hub → one-click install into DSHwork.',
    'e2.title': 'Learn it, use it',
    'e2.desc': 'Harness Academy courses → practice right inside DSHwork.',
    'e3.title': 'Get things done today',
    'e3.desc': 'Ready templates produce reports, research, and docs immediately.',
    'dl.kicker': 'DOWNLOAD',
    'dl.title': 'Download DSHwork',
    'dl.sub': 'Windows and macOS. Double-click. Open source, free, auditable.',
    'dl.win': 'Windows',
    'dl.winSub': 'x64 · Installer (NSIS)',
    'dl.mac': 'macOS',
    'dl.macSub': 'Universal · DMG',
    'dl.github': 'GitHub · Source & Releases',
    'dl.note': 'When installers are not yet published, refer to GitHub Releases.',
    'community.kicker': 'COMMUNITY',
    'community.title': 'Made by the DeepSeek.club community',
    'community.sub': 'The leading third-party DeepSeek open-source community: model hub, Plugin Hub, app rankings, Harness Academy. DSHwork is the "last mile" that brings these to your desktop.',
    'community.club': 'Visit deepseek.club →',
    'community.contact': 'Contact:',
    'dsh.title': 'DSH.club · Harness Hub',
    'dsh.text': 'Everything about Harness — discuss, discover, and build it here.',
    'dsh.em': 'Open source, amplify your value!',
    'dsh.cta': 'Enter DSH.club →',
    'footer.tag': 'DeepSeek Agent Workbench',
    'footer.legal': 'DSHwork is an independent community open-source project maintained by DeepSeek.club, with no affiliation, partnership, authorization, or endorsement from DeepSeek.'
  }
};

(function () {
  // 语言
  const saved = localStorage.getItem('dshwork-lang') || (navigator.language.startsWith('zh') ? 'zh' : 'en');
  let lang = saved === 'en' ? 'en' : 'zh';

  function applyLang() {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    const dict = I18N[lang];
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const key = el.getAttribute('data-i18n-html');
      if (dict[key] !== undefined) el.innerHTML = dict[key];
    });
    document.querySelectorAll('.lang-btn').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.lang === lang);
    });
  }

  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      lang = btn.dataset.lang;
      localStorage.setItem('dshwork-lang', lang);
      applyLang();
    });
  });

  applyLang();

  // 导航滚动态
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 粒子背景
  const canvas = document.getElementById('particles');
  if (canvas && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    const ctx = canvas.getContext('2d');
    let w, h, particles = [];
    const N = 60;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < N; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - .5) * .3,
        vy: (Math.random() - .5) * .3,
        r: Math.random() * 1.6 + .4
      });
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(53,224,255,.35)';
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  // 滚动揭示动画
  const revealEls = document.querySelectorAll(
    '.section__head, .why__item, .feature-card, .eco-card, .dl-card, .dshclub-card'
  );
  if (revealEls.length && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    revealEls.forEach((el) => el.classList.add('reveal'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => io.observe(el));
  }
})();
