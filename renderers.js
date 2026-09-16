const fontStacks = {
  serif: "Songti SC, STSong, Noto Serif CJK SC, Georgia, serif",
  sans: "ui-sans-serif, -apple-system, BlinkMacSystemFont, PingFang SC, sans-serif",
  kai: "Kaiti SC, STKaiti, KaiTi, serif",
};

const pageSizes = {
  a4: { width: 210, height: 297, label: "A4" },
  a5: { width: 148, height: 210, label: "A5" },
  letter: { width: 216, height: 279, label: "Letter" },
};

function styleVars(values) {
  const surface = {
    flat: { background: "transparent", border: "1px solid transparent" },
    quiet: { background: `color-mix(in oklch, ${values.accentColor} 6%, ${values.pageColor})`, border: "1px solid transparent" },
    outlined: { background: "transparent", border: `1px solid color-mix(in oklch, ${values.textColor} 18%, transparent)` },
  }[values.surfaceStyle];
  const callout = {
    plain: { background: "transparent", border: "0 solid transparent" },
    fill: { background: `color-mix(in oklch, ${values.accentColor} 8%, ${values.pageColor})`, border: "0 solid transparent" },
    rule: { background: "transparent", border: `1px solid color-mix(in oklch, ${values.accentColor} 35%, transparent)` },
  }[values.calloutStyle];
  return `
    --doc-font:${fontStacks[values.fontFamily]};
    --doc-body-size:${values.bodySize}px;
    --doc-line-height:${values.lineHeight};
    --doc-letter-spacing:${values.letterSpacing}px;
    --doc-body-weight:${values.bodyWeight};
    --doc-title-size:${values.titleSize}px;
    --doc-title-width:${values.titleWidth}em;
    --doc-section-size:${values.sectionTitleSize}px;
    --doc-title-weight:${values.titleWeight};
    --doc-title-tracking:${values.titleTracking}px;
    --doc-paragraph-gap:${values.paragraphGap}px;
    --doc-section-gap:${values.sectionGap}px;
    --doc-heading-after:${values.headingAfter}px;
    --doc-item-gap:${values.itemGap}px;
    --doc-margin:${values.pageMargin}px;
    --doc-radius:${values.radius}px;
    --doc-text:${values.textColor};
    --doc-muted:${values.mutedColor};
    --doc-page:${values.pageColor};
    --doc-accent:${values.accentColor};
    --doc-surface-bg:${surface.background};
    --doc-surface-border:${surface.border};
    --doc-callout-bg:${callout.background};
    --doc-callout-border:${callout.border};
    --doc-divider:${values.showDividers ? `1px solid color-mix(in oklch, ${values.textColor} 16%, transparent)` : "1px solid transparent"};`;
}

function paper(content, values, pageNumber, extraClass = "") {
  const format = pageSizes[values.pageFormat];
  return `
    <article class="paper-page ${extraClass}" data-format="${values.pageFormat}" style="${styleVars(values)}; --page-ratio:${format.width}/${format.height}">
      ${content}
      ${values.showHeaderFooter ? `<footer class="paper-footer"><span>Design Sense · ${format.label}</span><span>${pageNumber}</span></footer>` : ""}
    </article>`;
}

export function renderDocument(container, type, values) {
  const pages = type === "longdoc"
    ? renderLongDocument(values)
    : type === "onepager"
      ? [renderOnePager(values)]
      : type === "resume"
        ? [renderResume(values)]
        : [renderLetter(values)];
  container.innerHTML = pages.join("");
}

function renderLongDocument(values) {
  const columns = Number(values.columns);
  const first = `
    <header class="document-coverline"><span>FIELD NOTES</span><span>2026 · 09</span></header>
    <section class="document-title-block">
      <p class="document-label">设计感知研究</p>
      <h1>在日常选择中<br>重新理解设计</h1>
      <p class="document-lead">设计并不只存在于专业领域。它潜藏在每天的阅读、操作与判断之中，影响我们如何理解信息，也影响我们如何行动。</p>
    </section>
    <aside class="document-callout"><strong>核心观点</strong><p>好的设计不是更多装饰，而是让内容的关系变得容易理解。</p></aside>
    <section class="document-section"><h2>从感觉走向判断</h2><div class="document-prose" style="--doc-columns:${columns}">
      <p>我们经常说一个页面“看起来更舒服”，却很少继续追问这种感受来自哪里。字号、行高、栏宽与间距共同形成阅读节奏；颜色、边框和底色则决定信息如何被分组。</p>
      <p>建立设计判断的第一步，是一次只改变一个变量。只有保持其他条件稳定，我们才能看见某个参数真正造成的结果。</p>
      <p>判断并不要求统一答案。适合长文阅读的设置，未必适合高密度后台；适合屏幕的留白，也不一定适合打印页面。</p>
    </div></section>`;
  const second = `
    <header class="document-running-head"><span>在日常选择中重新理解设计</span><span>第二章</span></header>
    <section class="document-section document-section-first"><h2>参数之间存在关系</h2><div class="document-prose" style="--doc-columns:${columns}">
      <p>单独讨论十六像素是否合适并没有太大意义。字号必须与字体、行高和内容宽度一起理解。相同字号在不同字体中会呈现不同的视觉大小。</p>
      <p>标题与正文的距离也不只是数值问题。标题下方间距应该明显小于上方间距，这样标题才会自然属于后面的内容。</p>
      <h3>观察清单</h3>
      <ul><li>一行文字是否需要频繁移动视线？</li><li>段落之间是否既能区分又保持连续？</li><li>强调元素是否真的承载了信息？</li></ul>
      <p>当这些问题可以被准确描述时，个人风格才开始从稳定的选择中形成，而不是来自偶然的视觉偏好。</p>
    </div></section>
    <dl class="document-facts"><div><dt>正文</dt><dd>${values.bodySize}px / ${values.lineHeight}</dd></div><div><dt>页面边距</dt><dd>${values.pageMargin}px</dd></div><div><dt>结构</dt><dd>${columns === 2 ? "双栏" : "单栏"}</dd></div></dl>`;
  return [paper(first, values, 1), paper(second, values, 2)];
}

function renderOnePager(values) {
  const columns = Number(values.columns);
  const content = `
    <header class="onepager-head"><span>DESIGN SENSE LAB</span><span>PRODUCT BRIEF · 2026</span></header>
    <section class="onepager-hero"><p class="document-label">个人视觉设计实验室</p><h1>让每一次设计选择<br>都有理由</h1><p>实时调整排版和界面参数，理解不同选择带来的结果，逐步形成自己的设计判断。</p></section>
    <section class="onepager-metrics"><div><strong>3</strong><span>类设计画布</span></div><div><strong>6</strong><span>组核心参数</span></div><div><strong>1</strong><span>套个人规则</span></div></section>
    <section class="onepager-grid" style="--onepager-columns:${columns}">
      <article><span>01</span><h2>实时感知</h2><p>修改字号、行高、间距和颜色，立即观察完整页面的变化。</p></article>
      <article><span>02</span><h2>理解关系</h2><p>不孤立判断数值，而是理解参数如何共同影响阅读与层级。</p></article>
      <article><span>03</span><h2>沉淀风格</h2><p>保存有效组合，在不同内容中复用、验证并持续修正。</p></article>
      <article class="onepager-action"><span>START HERE</span><h2>从一份真实文档开始</h2><p>选择文档类型，调整到你愿意长期使用的状态。</p></article>
    </section>
    <footer class="onepager-foot"><strong>Good judgment grows from repeated attention.</strong><span>design-sense.local</span></footer>`;
  return paper(content, { ...values, showHeaderFooter: false }, 1, values.fitOnePage ? "fit-one-page" : "");
}

function renderResume(values) {
  const twoColumns = values.resumeLayout === "two";
  const content = `
    <header class="resume-header">
      ${values.showPhoto ? '<span class="resume-avatar">林</span>' : ""}
      <div><h1>林 悦</h1><p>产品设计师 · 设计系统与复杂工具</p></div>
      <ul><li>shanghai@example.com</li><li>+86 138 0000 0000</li><li>portfolio.example.com</li></ul>
    </header>
    <div class="resume-layout ${twoColumns ? "is-two" : "is-single"}" style="--resume-sidebar:${values.sidebarWidth}%">
      <main>
        <section class="resume-section"><h2>个人简介</h2><p>专注复杂产品与设计系统，将业务结构转化为清晰、稳定且可扩展的使用体验。</p></section>
        <section class="resume-section"><h2>工作经历</h2>
          ${resumeRole("高级产品设计师", "造物科技", "2023 — 至今", ["建立跨 Web 与 App 的设计系统，减少重复设计决策。", "负责 IoT 控制台核心流程与状态模型。"])}
          ${resumeRole("产品设计师", "北岸工作室", "2020 — 2023", ["设计数据产品与内部工具，提升复杂任务的操作效率。", "推动组件库和无障碍规范落地。"])}
        </section>
        <section class="resume-section"><h2>代表项目</h2>${resumeRole("Design Sense Lab", "个人项目", "2026", ["通过实时参数实验建立可解释的设计判断。"] )}</section>
      </main>
      <aside>
        <section class="resume-section"><h2>核心能力</h2><div class="resume-tags"><span>Product Design</span><span>Design System</span><span>Prototyping</span><span>IoT</span></div></section>
        <section class="resume-section"><h2>工具</h2><p>Figma · HTML/CSS · Research · Data Visualization</p></section>
        <section class="resume-section"><h2>教育经历</h2><p><strong>工业设计硕士</strong><br><small>同济大学 · 2020</small></p></section>
      </aside>
    </div>`;
  return paper(content, { ...values, showHeaderFooter: false }, 1, "resume-page");
}

function resumeRole(role, company, date, bullets) {
  return `<article class="resume-role"><header><div><h3>${role}</h3><p>${company}</p></div><time>${date}</time></header><ul>${bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul></article>`;
}

function renderLetter(values) {
  const content = `
    ${values.letterhead ? '<header class="letterhead"><strong>LIN YUE STUDIO</strong><span>产品设计与设计系统<br>Shanghai · China</span></header>' : ""}
    <time class="letter-date" style="text-align:${values.dateAlign}">2026 年 9 月 15 日</time>
    <address class="letter-recipient">致：产品与设计负责人<br>造物科技有限公司<br>上海市徐汇区</address>
    <section class="letter-subject"><span>主题</span><h1>关于建立产品设计实验机制的建议</h1></section>
    <div class="letter-body">
      <p>尊敬的负责人：</p>
      <p>为了让设计决策从个人经验转化为团队可以理解和复用的判断，我建议建立一套轻量的视觉实验机制。它不以增加规范数量为目标，而是帮助我们明确每个选择的原因、适用条件与代价。</p>
      <p>具体做法是从真实页面出发，一次只验证一个变量，并记录它对信息层级、阅读效率和操作体验的影响。经过多个场景验证后，再将稳定结论沉淀为 Token、组件或页面模式。</p>
      <aside class="document-callout"><strong>建议原则</strong><p>先验证，后抽象；先解决真实问题，再进入设计系统。</p></aside>
      <p>如获认可，我将以一份长文档和一份设置页面作为首轮样例，并在完成后提交可复用的实验结论。</p>
      <p>感谢您的时间与审阅。</p>
    </div>
    <footer class="letter-signature" style="--signature-gap:${values.signatureGap}px"><span>此致<br>敬礼</span><strong>林悦</strong><small>产品设计师</small></footer>`;
  return paper(content, { ...values, showHeaderFooter: false }, 1, "letter-page");
}

export function calculateMetrics(type, values) {
  const format = pageSizes[values.pageFormat];
  const pageWidthPx = format.width * 3.78;
  const usableWidth = Math.max(160, pageWidthPx - values.pageMargin * 2);
  const columns = type === "longdoc" || type === "onepager" ? Number(values.columns) : 1;
  const charsPerLine = Math.max(10, Math.floor((usableWidth / columns - (columns - 1) * values.sectionGap * 0.5) / values.bodySize));
  const usableHeight = format.height * 3.78 - values.pageMargin * 2;
  const linesPerPage = Math.max(12, Math.floor(usableHeight / (values.bodySize * values.lineHeight)));
  const contentWeight = { longdoc: 2500, onepager: 520, resume: 780, letter: 650 }[type];
  let pages = Math.max(1, Math.ceil(contentWeight / Math.max(1, charsPerLine * linesPerPage)));
  if (type === "onepager" && values.fitOnePage) pages = 1;
  const rhythm = values.bodySize * values.lineHeight + values.paragraphGap * 0.35 + values.sectionGap * 0.12;
  const density = rhythm < 31 ? "紧凑" : rhythm > 39 ? "宽松" : "舒适";
  return { pages, charsPerLine, density, format: format.label };
}
