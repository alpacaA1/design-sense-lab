const SESSION_KEY = "design-sense-component-sessions-v1";
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;

const number = (id, label, target, min, max, step = 1, unit = "px") => ({ id, label, target, min, max, step, unit });

export const COMPONENT_TYPES = {
  button: {
    label: "Button",
    zh: "按钮",
    note: "观察高度、文字和左右留白如何共同决定按钮的重量。",
    parameters: [
      number("height", "组件高度", 40, 28, 52, 2), number("paddingX", "水平内边距", 16, 8, 28, 2),
      number("fontSize", "文字字号", 14, 12, 18), number("iconSize", "图标尺寸", 16, 12, 24, 2),
      number("gap", "图文间距", 8, 4, 16, 2), number("radius", "圆角", 6, 0, 16, 2),
    ],
  },
  input: {
    label: "Input",
    zh: "输入框",
    note: "输入框的舒适感来自控件高度、文字基线和边界之间的关系。",
    parameters: [
      number("height", "组件高度", 40, 28, 52, 2), number("paddingX", "水平内边距", 12, 6, 24, 2),
      number("fontSize", "文字字号", 14, 12, 18), number("labelGap", "标签间距", 8, 4, 16, 2),
      number("radius", "圆角", 6, 0, 16, 2), number("border", "边框宽度", 1, 0, 3),
    ],
  },
  tabs: {
    label: "Tabs",
    zh: "标签页",
    note: "标签页主要训练点击高度、标签间距与选中线粗细。",
    parameters: [
      number("height", "标签高度", 40, 28, 52, 2), number("paddingX", "标签内边距", 12, 6, 24, 2),
      number("fontSize", "文字字号", 14, 12, 18), number("gap", "标签间距", 20, 8, 36, 2),
      number("indicator", "选中线", 2, 1, 4), number("radius", "容器圆角", 6, 0, 16, 2),
    ],
  },
  card: {
    label: "Card",
    zh: "内容卡片",
    note: "卡片不靠阴影训练层级，而是观察内容边距和分组节奏。",
    parameters: [
      number("width", "卡片宽度", 320, 260, 420, 10), number("padding", "内容内边距", 20, 8, 36, 2),
      number("titleSize", "标题字号", 18, 14, 24), number("gap", "内容间距", 12, 6, 24, 2),
      number("radius", "圆角", 8, 0, 20, 2), number("border", "边框宽度", 1, 0, 3),
    ],
  },
  row: {
    label: "Table row",
    zh: "表格行",
    note: "高密度界面先练行高，再判断文字和横向留白是否匹配。",
    parameters: [
      number("height", "行高", 44, 28, 60, 2), number("paddingX", "水平内边距", 12, 6, 24, 2),
      number("fontSize", "文字字号", 13, 11, 17), number("columnGap", "列间距", 24, 8, 40, 4),
      number("statusHeight", "状态高度", 20, 16, 28, 2), number("border", "分割线", 1, 0, 3),
    ],
  },
  modal: {
    label: "Modal",
    zh: "对话框",
    note: "对话框训练宽度、内容留白和标题层级的整体尺度。",
    parameters: [
      number("width", "对话框宽度", 420, 320, 520, 10), number("padding", "内容内边距", 24, 12, 36, 2),
      number("titleSize", "标题字号", 20, 16, 28, 2), number("sectionGap", "区块间距", 20, 8, 32, 2),
      number("buttonHeight", "按钮高度", 36, 28, 48, 2), number("radius", "圆角", 10, 0, 20, 2),
    ],
  },
  sidebar: {
    label: "Sidebar",
    zh: "侧边导航",
    note: "侧边导航训练容器宽度、导航行高和信息密度。",
    parameters: [
      number("width", "侧栏宽度", 240, 180, 320, 10), number("padding", "容器内边距", 16, 8, 28, 2),
      number("rowHeight", "导航行高", 40, 28, 52, 2), number("fontSize", "文字字号", 14, 12, 18),
      number("gap", "导航间距", 6, 0, 16, 2), number("radius", "选中项圆角", 6, 0, 16, 2),
    ],
  },
};

export const QUESTION_BANK = {
  button: {
    presets: [
      { id: "compact", label: "紧凑", values: { height: 32, paddingX: 12, fontSize: 13, iconSize: 14, gap: 6, radius: 4 } },
      { id: "standard", label: "标准", values: { height: 40, paddingX: 16, fontSize: 14, iconSize: 16, gap: 8, radius: 6 } },
      { id: "comfortable", label: "舒适", values: { height: 44, paddingX: 18, fontSize: 14, iconSize: 18, gap: 8, radius: 8 } },
      { id: "large", label: "大型", values: { height: 48, paddingX: 20, fontSize: 16, iconSize: 20, gap: 10, radius: 10 } },
    ],
    groups: [
      { id: "volume", label: "体积判断", parameters: ["height", "paddingX"] },
      { id: "content", label: "内容比例", parameters: ["fontSize", "iconSize", "gap"] },
      { id: "contour", label: "轮廓细节", parameters: ["height", "radius"] },
    ],
  },
  input: {
    presets: [
      { id: "compact", label: "紧凑", values: { height: 32, paddingX: 10, fontSize: 13, labelGap: 6, radius: 4, border: 1 } },
      { id: "standard", label: "标准", values: { height: 40, paddingX: 12, fontSize: 14, labelGap: 8, radius: 6, border: 1 } },
      { id: "comfortable", label: "舒适", values: { height: 44, paddingX: 14, fontSize: 14, labelGap: 8, radius: 8, border: 1 } },
      { id: "large", label: "大型", values: { height: 48, paddingX: 16, fontSize: 16, labelGap: 10, radius: 10, border: 2 } },
    ],
    groups: [
      { id: "volume", label: "控件体积", parameters: ["height", "paddingX"] },
      { id: "content", label: "文字关系", parameters: ["fontSize", "labelGap"] },
      { id: "surface", label: "表面细节", parameters: ["radius", "border"] },
    ],
  },
  tabs: {
    presets: [
      { id: "compact", label: "紧凑", values: { height: 32, paddingX: 10, fontSize: 13, gap: 12, indicator: 2, radius: 4 } },
      { id: "standard", label: "标准", values: { height: 40, paddingX: 12, fontSize: 14, gap: 20, indicator: 2, radius: 6 } },
      { id: "comfortable", label: "舒适", values: { height: 44, paddingX: 16, fontSize: 14, gap: 24, indicator: 2, radius: 8 } },
      { id: "large", label: "大型", values: { height: 48, paddingX: 18, fontSize: 16, gap: 28, indicator: 3, radius: 10 } },
    ],
    groups: [
      { id: "volume", label: "标签体积", parameters: ["height", "paddingX"] },
      { id: "rhythm", label: "标签节奏", parameters: ["fontSize", "gap"] },
      { id: "selection", label: "选中表达", parameters: ["indicator", "radius"] },
    ],
  },
  card: {
    presets: [
      { id: "compact", label: "紧凑", values: { width: 280, padding: 16, titleSize: 16, gap: 10, radius: 6, border: 1 } },
      { id: "standard", label: "标准", values: { width: 320, padding: 20, titleSize: 18, gap: 12, radius: 8, border: 1 } },
      { id: "comfortable", label: "舒适", values: { width: 360, padding: 24, titleSize: 20, gap: 16, radius: 10, border: 1 } },
      { id: "large", label: "大型", values: { width: 400, padding: 28, titleSize: 22, gap: 20, radius: 12, border: 2 } },
    ],
    groups: [
      { id: "container", label: "容器体积", parameters: ["width", "padding"] },
      { id: "hierarchy", label: "内容层级", parameters: ["titleSize", "gap"] },
      { id: "surface", label: "表面细节", parameters: ["radius", "border"] },
    ],
  },
  row: {
    presets: [
      { id: "compact", label: "紧凑", values: { height: 36, paddingX: 10, fontSize: 12, columnGap: 16, statusHeight: 18, border: 1 } },
      { id: "standard", label: "标准", values: { height: 44, paddingX: 12, fontSize: 13, columnGap: 24, statusHeight: 20, border: 1 } },
      { id: "comfortable", label: "舒适", values: { height: 48, paddingX: 16, fontSize: 14, columnGap: 28, statusHeight: 22, border: 1 } },
      { id: "large", label: "大型", values: { height: 56, paddingX: 20, fontSize: 15, columnGap: 32, statusHeight: 24, border: 2 } },
    ],
    groups: [
      { id: "density", label: "行密度", parameters: ["height", "paddingX"] },
      { id: "content", label: "内容节奏", parameters: ["fontSize", "columnGap"] },
      { id: "status", label: "状态细节", parameters: ["statusHeight", "border"] },
    ],
  },
  modal: {
    presets: [
      { id: "compact", label: "紧凑", values: { width: 340, padding: 18, titleSize: 18, sectionGap: 14, buttonHeight: 32, radius: 8 } },
      { id: "standard", label: "标准", values: { width: 420, padding: 24, titleSize: 20, sectionGap: 20, buttonHeight: 36, radius: 10 } },
      { id: "comfortable", label: "舒适", values: { width: 460, padding: 28, titleSize: 22, sectionGap: 24, buttonHeight: 40, radius: 12 } },
      { id: "large", label: "大型", values: { width: 500, padding: 32, titleSize: 24, sectionGap: 28, buttonHeight: 44, radius: 14 } },
    ],
    groups: [
      { id: "container", label: "容器体积", parameters: ["width", "padding"] },
      { id: "hierarchy", label: "内容层级", parameters: ["titleSize", "sectionGap"] },
      { id: "actions", label: "操作区域", parameters: ["buttonHeight", "radius"] },
    ],
  },
  sidebar: {
    presets: [
      { id: "compact", label: "紧凑", values: { width: 200, padding: 12, rowHeight: 36, fontSize: 13, gap: 4, radius: 4 } },
      { id: "standard", label: "标准", values: { width: 240, padding: 16, rowHeight: 40, fontSize: 14, gap: 6, radius: 6 } },
      { id: "comfortable", label: "舒适", values: { width: 280, padding: 20, rowHeight: 44, fontSize: 14, gap: 8, radius: 8 } },
      { id: "large", label: "大型", values: { width: 320, padding: 24, rowHeight: 48, fontSize: 16, gap: 10, radius: 10 } },
    ],
    groups: [
      { id: "container", label: "侧栏体积", parameters: ["width", "padding"] },
      { id: "navigation", label: "导航节奏", parameters: ["rowHeight", "gap"] },
      { id: "detail", label: "文字细节", parameters: ["fontSize", "radius"] },
    ],
  },
};

const MODES = {
  guess: { label: "猜尺寸", hint: "观察目标后隐藏答案，再独立填写你的判断。" },
  match: { label: "临摹匹配", hint: "在目标、自己的版本和叠加视图之间来回校准。" },
  free: { label: "探索沙盒", hint: "看着数值自由改变组件，不计入正式训练。" },
};

function readSessions() {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY));
    return Array.isArray(value) ? value.slice(0, 30) : [];
  } catch {
    return [];
  }
}

function targetValues(config) {
  return Object.fromEntries(config.parameters.map((parameter) => [parameter.id, parameter.target]));
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomDifferent(items, previousId) {
  const candidates = items.filter((item) => item.id !== previousId);
  return randomItem(candidates.length ? candidates : items);
}

export function createQuestion(type, previous) {
  const bank = QUESTION_BANK[type];
  const preset = randomDifferent(bank.presets, previous?.presetId);
  const group = randomDifferent(bank.groups, previous?.groupId);
  return {
    id: `${type}:${preset.id}:${group.id}`,
    presetId: preset.id,
    presetLabel: preset.label,
    groupId: group.id,
    groupLabel: group.label,
    parameterIds: [...group.parameters],
    targets: { ...preset.values },
    difficulty: "基础",
  };
}

function randomStartValue(parameter, target) {
  const values = [];
  for (let value = parameter.min; value <= parameter.max; value += parameter.step) {
    if (Math.abs(value - target) > Number.EPSILON) values.push(Number(value.toFixed(4)));
  }
  return randomItem(values);
}

function initialTrainingValues(config, question) {
  const values = { ...question.targets };
  question.parameterIds.forEach((id) => {
    const parameter = config.parameters.find((item) => item.id === id);
    if (parameter) values[id] = randomStartValue(parameter, question.targets[id]);
  });
  return values;
}

function format(value) {
  return Number.isInteger(Number(value)) ? String(value) : Number(value).toFixed(1);
}

function clampZoom(value) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

function styleVars(values) {
  return Object.entries(values).map(([key, value]) => `--lab-${key}:${value}px`).join(";");
}

function componentMarkup(type, values, variant) {
  const style = styleVars(values);
  const common = `class="training-component training-${type} ${variant === "target" ? "is-target" : "is-current"}" style="${style}"`;
  if (type === "button") return `<button ${common} type="button"><span class="training-icon" aria-hidden="true">+</span><span>新建项目</span></button>`;
  if (type === "input") return `<label ${common}><span>项目名称</span><span class="training-input-box">设计规范整理</span><small>用于工作区和导出文件</small></label>`;
  if (type === "tabs") return `<div ${common}><span class="is-active">概览</span><span>活动</span><span>设置</span></div>`;
  if (type === "card") return `<article ${common}><span class="training-eyebrow">本周观察</span><h3>间距决定分组关系</h3><p>先判断内容属于同一组，再决定应该使用多大的距离。</p><button type="button">查看记录</button></article>`;
  if (type === "row") return `<div ${common}><strong>首页重构</strong><span>林悦</span><time>9 月 16 日</time><em>进行中</em></div>`;
  if (type === "modal") return `<section ${common}><span class="training-eyebrow">保存训练</span><h3>记录这次尺寸判断</h3><p>保存后可以回看误差，找到自己经常低估或高估的参数。</p><div class="training-modal-actions"><button type="button">取消</button><button type="button">保存记录</button></div></section>`;
  return `<aside ${common}><strong>Design Sense</strong><nav><span class="is-active">概览</span><span>组件</span><span>训练记录</span><span>个人刻度</span></nav><small>基础训练 · 02</small></aside>`;
}

function resultData(config, values, question) {
  const parameters = config.parameters.filter((parameter) => question.parameterIds.includes(parameter.id));
  const results = parameters.map((parameter) => {
    const current = Number(values[parameter.id]);
    const delta = current - question.targets[parameter.id];
    return { parameter, current, delta, distance: Math.abs(delta) / parameter.step };
  });
  const total = parameters.reduce((sum, parameter) => sum + Math.abs(Number(values[parameter.id]) - question.targets[parameter.id]) / parameter.step, 0);
  return { results, score: Math.max(0, Math.round(100 - total * 4)) };
}

function directionCopy(result) {
  if (result.delta === 0) return "判断准确";
  return `${result.delta > 0 ? "高估" : "低估"} ${format(Math.abs(result.delta))}${result.parameter.unit}`;
}

function tendencyCopy(result) {
  if (!result || result.delta === 0) return "这次没有明显的尺寸偏向";
  return `你容易${result.delta > 0 ? "高估" : "低估"}${result.parameter.label}`;
}

function anchorCopy(result, componentLabel) {
  if (!result) return `这次对 ${componentLabel} 的整体判断已经很接近目标。`;
  return `把 ${format(result.target)}${result.parameter.unit} 记作这类${componentLabel}的参考刻度；你这次判断为 ${format(result.current)}${result.parameter.unit}。`;
}

function errorMarkup(config, values, question) {
  const { results, score } = resultData(config, values, question);
  results.forEach((result) => { result.target = question.targets[result.parameter.id]; });
  const priorities = [...results].filter((item) => item.delta !== 0).sort((a, b) => b.distance - a.distance).slice(0, 3);
  const primary = priorities[0];
  const summary = priorities.length
    ? priorities.map((item, index) => `<li class="${index === 0 ? "is-primary" : ""}"><strong>${item.parameter.label}</strong><span>${directionCopy(item)}</span>${index === 0 ? `<small>目标 ${format(item.target)}${item.parameter.unit} · 你的判断 ${format(item.current)}${item.parameter.unit}</small>` : ""}</li>`).join("")
    : `<li class="is-exact"><strong>本轮参数</strong><span>判断准确</span></li>`;
  const rows = results.map((result) => `
    <li class="${result.delta === 0 ? "is-exact" : ""}">
      <span>${result.parameter.label}</span>
      <strong>${format(result.current)}${result.parameter.unit}</strong>
      <span>目标 ${format(result.target)}${result.parameter.unit}</span>
      <em>${directionCopy(result)}</em>
    </li>`).join("");
  return `<aside class="training-feedback" tabindex="-1" aria-live="polite">
    <header><div><span>${question.groupLabel} · 本轮主要偏差</span><strong>${primary ? `${primary.parameter.label}${directionCopy(primary).replace(" ", "")}` : "这次判断非常接近目标"}</strong></div><small>接近度 ${score}/100</small></header>
    <ul class="training-priorities">${summary}</ul>
    <div class="training-insight">
      <p><strong>判断倾向</strong><span>${tendencyCopy(primary)}</span></p>
      <p><strong>记忆锚点</strong><span>${anchorCopy(primary, config.zh)}</span></p>
    </div>
    <details><summary>查看本轮参数</summary><ul class="training-result-list">${rows}</ul></details>
    <div class="training-next-actions">
      <button class="primary-button compact" type="button" data-training-retry>下一题</button>
      <button class="secondary-button" type="button" data-training-next>换一个组件</button>
      <button class="text-button" type="button" data-save-training>保存结果</button>
    </div>
  </aside>`;
}

function measurementMarkup(type, values) {
  return `<div class="measurement-frame">
    <span class="dimension-line dimension-width"><i data-measure-width>你的宽度</i></span>
    <span class="dimension-line dimension-height"><i data-measure-height>你的高度</i></span>
    ${componentMarkup(type, values, "current")}
    ${type === "button" ? `<div class="measurement-relations" data-button-anatomy>
      <div class="relation-track" aria-hidden="true">
        <span class="relation-padding" data-relation="padding-left"><i>内</i></span>
        <span class="relation-icon" data-relation="icon"><i>图</i></span>
        <span class="relation-gap" data-relation="gap"><i>距</i></span>
        <span class="relation-text" data-relation="text"><i>文</i></span>
        <span class="relation-padding" data-relation="padding-right"><i>内</i></span>
      </div>
      <p>
        <span>左右内边距 <strong data-relation-value="padding">${format(values.paddingX)}px</strong></span>
        <span>图标 <strong data-relation-value="icon">${format(values.iconSize)}px</strong></span>
        <span>图文间距 <strong data-relation-value="gap">${format(values.gap)}px</strong></span>
      </p>
      <small data-button-formula>内部尺寸关系</small>
    </div>` : ""}
  </div>`;
}

export function initComponentLab(root, { showToast } = {}) {
  const questions = Object.fromEntries(Object.keys(COMPONENT_TYPES).map((type) => [type, createQuestion(type)]));
  const state = {
    type: "button",
    mode: "guess",
    phase: "observe",
    preview: "target",
    revealed: false,
    confirmed: false,
    zoom: 1,
    questions,
    values: Object.fromEntries(Object.entries(COMPONENT_TYPES).map(([id, currentConfig]) => [id, initialTrainingValues(currentConfig, questions[id])])),
    sessions: readSessions(),
  };

  function config() {
    return COMPONENT_TYPES[state.type];
  }

  function question() {
    return state.questions[state.type];
  }

  function resetExercise() {
    state.revealed = false;
    state.confirmed = false;
    if (state.mode !== "free") state.zoom = 1;
    if (state.mode === "free") {
      state.values[state.type] = targetValues(config());
    } else {
      state.questions[state.type] = createQuestion(state.type, question());
      state.values[state.type] = initialTrainingValues(config(), question());
    }
    if (state.mode === "guess") {
      state.phase = "observe";
      state.preview = "target";
    } else if (state.mode === "match") {
      state.phase = "answer";
      state.preview = "target";
    } else {
      state.phase = "explore";
      state.preview = "current";
    }
  }

  function progressMarkup() {
    if (state.mode !== "guess") return "";
    const active = state.phase === "observe" ? 0 : state.phase === "answer" ? 1 : 2;
    return `<ol class="training-progress" aria-label="训练进度">
      ${["观察目标", "独立判断", "校准误差"].map((label, index) => `<li class="${index === active ? "is-active" : ""} ${index < active ? "is-done" : ""}"><span>${index + 1}</span>${label}</li>`).join("")}
    </ol>`;
  }

  function questionMarkup(currentConfig, currentQuestion) {
    if (state.mode === "free") return "";
    const labels = currentQuestion.parameterIds.map((id) => currentConfig.parameters.find((item) => item.id === id)?.label).filter(Boolean);
    return `<div class="training-question" data-question-id="${currentQuestion.id}" data-preset-id="${currentQuestion.presetId}" data-group-id="${currentQuestion.groupId}">
      <span>本轮主题</span><strong>${currentQuestion.groupLabel}</strong><small>${labels.join(" · ")}</small>
    </div>`;
  }

  function primaryActionMarkup() {
    if (state.mode === "free" || state.revealed) return "";
    if (state.mode === "guess" && state.phase === "observe") {
      return `<button class="primary-button compact" type="button" data-start-answer>开始作答</button>`;
    }
    if (state.mode === "guess") {
      return `<button class="primary-button compact" type="button" data-training-reveal ${state.confirmed ? "" : "disabled"}>提交并揭晓</button>`;
    }
    return `<button class="primary-button compact" type="button" data-training-reveal>检查误差</button>`;
  }

  function previewMarkup() {
    const allowSwitch = state.mode === "match" || state.revealed;
    if (allowSwitch) return `<div class="preview-switch" role="group" aria-label="预览视图">
      <button type="button" data-preview="target" aria-pressed="${state.preview === "target"}" class="${state.preview === "target" ? "is-active" : ""}">目标</button>
      <button type="button" data-preview="current" aria-pressed="${state.preview === "current"}" class="${state.preview === "current" ? "is-active" : ""}">我的版本</button>
      <button type="button" data-preview="overlay" aria-pressed="${state.preview === "overlay"}" class="${state.preview === "overlay" ? "is-active" : ""}">叠加</button>
    </div>`;
    const label = state.phase === "observe" ? "正在观察目标" : state.mode === "free" ? "实时尺寸" : "目标已隐藏 · 正在作答";
    return `<span class="free-mode-label">${label}</span>`;
  }

  function comparisonLegendMarkup() {
    if (!state.revealed || state.preview !== "overlay") return "";
    return `<div class="comparison-legend" aria-label="叠加视图图例"><span class="is-target">目标轮廓</span><span class="is-current">你的判断</span></div>`;
  }

  function zoomMarkup() {
    const percent = Math.round(state.zoom * 100);
    const note = state.zoom === 1 ? "原始尺寸" : "仅改变显示倍率";
    return `<div class="stage-view-tools">
      <span class="stage-scale" aria-live="polite">${note} · 8px 网格</span>
      <div class="stage-zoom" role="group" aria-label="画布缩放">
        <button type="button" data-zoom-out aria-label="缩小预览" title="缩小预览" ${state.zoom <= ZOOM_MIN ? "disabled" : ""}>−</button>
        <button type="button" data-zoom-reset aria-label="恢复百分之一百" title="恢复 100% 原始尺寸">${percent}%</button>
        <button type="button" data-zoom-in aria-label="放大预览" title="放大预览" ${state.zoom >= ZOOM_MAX ? "disabled" : ""}>+</button>
      </div>
    </div>`;
  }

  function render() {
    const currentConfig = config();
    const currentQuestion = question();
    const values = state.values[state.type];
    const training = state.mode !== "free";
    const controlsLocked = state.mode === "guess" && state.phase === "observe";
    const visibleParameters = training
      ? currentConfig.parameters.filter((parameter) => currentQuestion.parameterIds.includes(parameter.id))
      : currentConfig.parameters;
    const targets = training ? currentQuestion.targets : targetValues(currentConfig);
    if (!training) state.preview = "current";
    root.innerHTML = `
      <aside class="training-panel">
        <header class="training-heading">
          <p class="panel-kicker">Pixel training</p>
          <h1>组件像素训练</h1>
          <p>先判断，再查看数值。把“看起来差不多”练成可复用的尺度感。</p>
        </header>
        <div class="training-section">
          <span class="training-label">训练方式</span>
          <div class="training-mode-tabs" role="group" aria-label="训练方式">
            ${Object.entries(MODES).map(([id, mode]) => `<button type="button" data-training-mode="${id}" aria-pressed="${state.mode === id}" class="${state.mode === id ? "is-active" : ""}">${mode.label}</button>`).join("")}
          </div>
          <p class="training-mode-hint">${MODES[state.mode].hint}</p>
          ${progressMarkup()}
          ${questionMarkup(currentConfig, currentQuestion)}
        </div>
        <div class="training-parameters ${controlsLocked ? "is-locked" : ""}">
          ${visibleParameters.map((parameter) => {
            const value = values[parameter.id];
            const progress = (value - parameter.min) / (parameter.max - parameter.min) * 100;
            return `<label class="training-parameter">
              <span><strong>${parameter.label}</strong><small>${training && !state.revealed ? (controlsLocked ? "作答阶段填写" : "目标已隐藏") : `目标 ${targets[parameter.id]}${parameter.unit}`}</small></span>
              <div>
                <input type="range" min="${parameter.min}" max="${parameter.max}" step="${parameter.step}" value="${value}" data-training-param="${parameter.id}" aria-label="${parameter.label}" style="--range-progress:${progress}%" ${controlsLocked || state.revealed ? "disabled" : ""} />
                <span class="training-number"><input type="number" min="${parameter.min}" max="${parameter.max}" step="${parameter.step}" value="${format(value)}" data-training-param="${parameter.id}" aria-label="${parameter.label}估计值" ${controlsLocked || state.revealed ? "disabled" : ""} /><i>${parameter.unit}</i></span>
              </div>
            </label>`;
          }).join("")}
        </div>
        ${state.mode === "guess" && state.phase === "answer" ? `<label class="answer-confirm"><input type="checkbox" data-answer-confirm ${state.confirmed ? "checked" : ""} /><span>我已确认以上尺寸判断</span></label>` : ""}
      </aside>
      <section class="training-workspace">
        <header class="training-toolbar">
          <div><strong>${currentConfig.label} · ${currentConfig.zh}</strong><span>${currentConfig.note}</span></div>
          <div class="training-actions">
            <button class="secondary-button" type="button" data-training-reset>${training ? "换一题" : "重置参数"}</button>
            ${primaryActionMarkup()}
          </div>
        </header>
        <div class="training-canvas">
          <nav class="component-rail" aria-label="训练组件">
            ${Object.entries(COMPONENT_TYPES).map(([id, item]) => `<button type="button" data-component-type="${id}" aria-current="${state.type === id ? "true" : "false"}" class="${state.type === id ? "is-active" : ""}"><span>${item.label}</span><small>${item.zh}</small></button>`).join("")}
          </nav>
          <div class="training-stage-wrap ${state.revealed ? "has-result" : ""}">
            <div class="stage-contextbar">${previewMarkup()}${comparisonLegendMarkup()}${zoomMarkup()}</div>
            <div class="training-main ${state.revealed ? "has-result" : ""}">
              <div class="training-stage" data-stage-view="${state.preview}" style="--training-zoom:${state.zoom}">
                <div class="stage-grid" aria-hidden="true"></div>
                <div class="stage-component stage-target" aria-hidden="true" inert>${componentMarkup(state.type, targets, "target")}</div>
                <div class="stage-component stage-current" aria-hidden="true" inert>${state.revealed ? measurementMarkup(state.type, values) : componentMarkup(state.type, values, "current")}</div>
              </div>
              ${state.revealed && training ? errorMarkup(currentConfig, values, currentQuestion) : ""}
            </div>
          </div>
        </div>
      </section>`;
    bind();
    if (state.revealed) window.requestAnimationFrame(updateMeasurementDimensions);
  }

  function updateMeasurementDimensions() {
    const component = root.querySelector(".measurement-frame .training-component");
    if (!component) return;
    const widthLabel = root.querySelector("[data-measure-width]");
    const heightLabel = root.querySelector("[data-measure-height]");
    widthLabel?.replaceChildren(`你的宽度 ${Math.round(component.offsetWidth)}px`);
    heightLabel?.replaceChildren(`你的高度 ${Math.round(component.offsetHeight)}px`);
    if (widthLabel?.parentElement) {
      widthLabel.parentElement.style.left = `${component.offsetLeft}px`;
      widthLabel.parentElement.style.right = "auto";
      widthLabel.parentElement.style.width = `${component.offsetWidth}px`;
    }
    if (heightLabel?.parentElement) {
      heightLabel.parentElement.style.top = `${component.offsetTop}px`;
      heightLabel.parentElement.style.bottom = "auto";
      heightLabel.parentElement.style.height = `${component.offsetHeight}px`;
    }

    const anatomy = root.querySelector("[data-button-anatomy]");
    if (!anatomy || !component.matches(".training-button")) return;
    const icon = component.querySelector(".training-icon");
    const label = icon?.nextElementSibling;
    if (!icon || !label) return;
    const styles = getComputedStyle(component);
    const paddingLeft = Number.parseFloat(styles.paddingLeft);
    const paddingRight = Number.parseFloat(styles.paddingRight);
    const gap = Number.parseFloat(styles.columnGap || styles.gap);
    const borderLeft = Number.parseFloat(styles.borderLeftWidth);
    const borderRight = Number.parseFloat(styles.borderRightWidth);
    const innerWidth = component.clientWidth;
    const textWidth = label.getBoundingClientRect().width / state.zoom;
    anatomy.style.left = `${component.offsetLeft + borderLeft}px`;
    anatomy.style.top = `${component.offsetTop + component.offsetHeight + 18}px`;
    anatomy.style.width = `${innerWidth}px`;
    anatomy.style.setProperty("--relation-columns", `${paddingLeft}px ${icon.offsetWidth}px ${gap}px ${textWidth}px ${paddingRight}px`);
    anatomy.querySelector("[data-button-formula]")?.replaceChildren(
      `${format(paddingLeft)} + ${icon.offsetWidth} + ${format(gap)} + ${Math.round(textWidth)} + ${format(paddingRight)} + ${format(borderLeft + borderRight)}px 边框 = ${component.offsetWidth}px`,
    );
  }

  function updateStage() {
    const currentConfig = config();
    const stageCurrent = root.querySelector(".stage-current");
    if (stageCurrent) stageCurrent.innerHTML = state.revealed
      ? measurementMarkup(state.type, state.values[state.type])
      : componentMarkup(state.type, state.values[state.type], "current");
    if (state.revealed) {
      const oldResult = root.querySelector(".training-feedback");
      if (oldResult) oldResult.outerHTML = errorMarkup(currentConfig, state.values[state.type], question());
      window.requestAnimationFrame(updateMeasurementDimensions);
    }
  }

  function updateZoom(nextZoom) {
    state.zoom = clampZoom(nextZoom);
    const stage = root.querySelector(".training-stage");
    if (stage) stage.style.setProperty("--training-zoom", state.zoom);
    const percent = Math.round(state.zoom * 100);
    const reset = root.querySelector("[data-zoom-reset]");
    if (reset) reset.textContent = `${percent}%`;
    const scale = root.querySelector(".stage-scale");
    if (scale) scale.textContent = `${state.zoom === 1 ? "原始尺寸" : "仅改变显示倍率"} · 8px 网格`;
    const out = root.querySelector("[data-zoom-out]");
    const zoomIn = root.querySelector("[data-zoom-in]");
    if (out) out.disabled = state.zoom <= ZOOM_MIN;
    if (zoomIn) zoomIn.disabled = state.zoom >= ZOOM_MAX;
  }

  function bind() {
    root.querySelectorAll("[data-training-mode]").forEach((button) => button.addEventListener("click", () => {
      state.mode = button.dataset.trainingMode;
      resetExercise();
      render();
    }));
    root.querySelectorAll("[data-component-type]").forEach((button) => button.addEventListener("click", () => {
      state.type = button.dataset.componentType;
      resetExercise();
      render();
    }));
    root.querySelectorAll("[data-preview]").forEach((button) => button.addEventListener("click", () => {
      state.preview = button.dataset.preview;
      root.querySelectorAll("[data-preview]").forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      root.querySelector(".training-stage").dataset.stageView = state.preview;
      const contextbar = root.querySelector(".stage-contextbar");
      contextbar?.querySelector(".comparison-legend")?.remove();
      if (state.revealed && state.preview === "overlay") {
        contextbar?.querySelector(".stage-scale")?.insertAdjacentHTML("beforebegin", comparisonLegendMarkup());
      }
    }));
    root.querySelector("[data-zoom-out]")?.addEventListener("click", () => updateZoom(state.zoom - ZOOM_STEP));
    root.querySelector("[data-zoom-in]")?.addEventListener("click", () => updateZoom(state.zoom + ZOOM_STEP));
    root.querySelector("[data-zoom-reset]")?.addEventListener("click", () => updateZoom(1));
    root.querySelectorAll("[data-training-param]").forEach((input) => input.addEventListener("input", () => {
      const parameter = config().parameters.find((item) => item.id === input.dataset.trainingParam);
      if (!parameter) return;
      const numeric = Math.min(parameter.max, Math.max(parameter.min, Number(input.value)));
      state.values[state.type][parameter.id] = numeric;
      root.querySelectorAll(`[data-training-param="${parameter.id}"]`).forEach((linked) => {
        if (linked !== input) linked.value = numeric;
        if (linked.type === "range") linked.style.setProperty("--range-progress", `${(numeric - parameter.min) / (parameter.max - parameter.min) * 100}%`);
      });
      updateStage();
    }));
    root.querySelector("[data-training-reset]")?.addEventListener("click", () => {
      resetExercise();
      render();
    });
    root.querySelector("[data-start-answer]")?.addEventListener("click", () => {
      state.phase = "answer";
      state.preview = "current";
      render();
      root.querySelector("[data-training-param]")?.focus();
    });
    root.querySelector("[data-answer-confirm]")?.addEventListener("change", (event) => {
      state.confirmed = event.target.checked;
      const submit = root.querySelector("[data-training-reveal]");
      if (submit) submit.disabled = !state.confirmed;
    });
    root.querySelector("[data-training-reveal]")?.addEventListener("click", () => {
      state.revealed = true;
      state.phase = "revealed";
      state.preview = "overlay";
      render();
      window.requestAnimationFrame(() => root.querySelector(".training-feedback")?.focus({ preventScroll: true }));
    });
    root.querySelector("[data-training-retry]")?.addEventListener("click", () => {
      resetExercise();
      render();
    });
    root.querySelector("[data-training-next]")?.addEventListener("click", () => {
      const ids = Object.keys(COMPONENT_TYPES);
      state.type = ids[(ids.indexOf(state.type) + 1) % ids.length];
      resetExercise();
      render();
    });
    root.querySelector("[data-save-training]")?.addEventListener("click", () => {
      const item = {
        id: Date.now(), type: state.type, mode: state.mode,
        values: { ...state.values[state.type] },
        targets: { ...question().targets },
        question: {
          id: question().id,
          presetId: question().presetId,
          presetLabel: question().presetLabel,
          groupId: question().groupId,
          groupLabel: question().groupLabel,
          parameterIds: [...question().parameterIds],
          difficulty: question().difficulty,
        },
        date: new Date().toISOString(),
      };
      state.sessions.unshift(item);
      state.sessions = state.sessions.slice(0, 30);
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(state.sessions));
        showToast?.(`已保存 ${config().zh} 训练结果`);
      } catch {
        state.sessions.shift();
        showToast?.("训练结果未保存，请检查浏览器存储设置");
      }
    });
  }

  render();
  return { refresh: render, sessionCount: () => state.sessions.length };
}
