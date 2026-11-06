import {
  extractPaletteFromImageData,
  inspectComponentRegion,
} from "./screenshot-analyzer.js?v=20261106c";

const SESSION_KEY = "design-sense-component-sessions-v1";
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.25;

export const DIFFICULTIES = {
  basic: { label: "基础", hint: "从常见尺度中判断二至三个相关参数。" },
  advanced: { label: "进阶", hint: "目标会偏离常见预设一个刻度，差异更细微。" },
  comprehensive: { label: "综合", hint: "一次判断组件的全部参数关系。" },
};

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

function clampParameterValue(parameter, value) {
  const clamped = Math.min(parameter.max, Math.max(parameter.min, value));
  const steps = Math.round((clamped - parameter.min) / parameter.step);
  return Number((parameter.min + steps * parameter.step).toFixed(4));
}

function advancedTargets(config, preset, parameterIds) {
  const targets = { ...preset.values };
  parameterIds.forEach((id, index) => {
    const parameter = config.parameters.find((item) => item.id === id);
    if (!parameter) return;
    const direction = (preset.id.length + id.length + index) % 2 === 0 ? 1 : -1;
    let next = clampParameterValue(parameter, targets[id] + direction * parameter.step);
    if (next === targets[id]) next = clampParameterValue(parameter, targets[id] - direction * parameter.step);
    targets[id] = next;
  });
  return targets;
}

export function createQuestion(type, previous, { difficulty = "basic", preferredParameterId } = {}) {
  const bank = QUESTION_BANK[type];
  const config = COMPONENT_TYPES[type];
  const preset = randomDifferent(bank.presets, previous?.presetId);
  const preferredGroups = preferredParameterId
    ? bank.groups.filter((item) => item.parameters.includes(preferredParameterId))
    : bank.groups;
  const group = randomDifferent(preferredGroups.length ? preferredGroups : bank.groups, previous?.groupId);
  const parameterIds = difficulty === "comprehensive"
    ? config.parameters.map((parameter) => parameter.id)
    : [...group.parameters];
  const targets = difficulty === "advanced"
    ? advancedTargets(config, preset, parameterIds)
    : { ...preset.values };
  return {
    id: `${type}:${preset.id}:${group.id}:${difficulty}`,
    presetId: preset.id,
    presetLabel: preset.label,
    groupId: group.id,
    groupLabel: difficulty === "comprehensive" ? "全参数综合" : group.label,
    parameterIds,
    targets,
    difficulty: DIFFICULTIES[difficulty]?.label ?? DIFFICULTIES.basic.label,
    difficultyId: DIFFICULTIES[difficulty] ? difficulty : "basic",
    focusParameterId: preferredParameterId && parameterIds.includes(preferredParameterId) ? preferredParameterId : null,
  };
}

export function analyzeSessions(sessions) {
  const buckets = new Map();
  const append = (session, point) => {
    const config = COMPONENT_TYPES[session?.type];
    const parameter = config?.parameters.find((item) => item.id === point.parameterId);
    const key = `${session.type}:${point.parameterId}`;
    const bucket = buckets.get(key) ?? {
      key,
      type: session.type,
      componentLabel: point.componentLabel ?? config?.zh ?? session.type,
      parameterId: point.parameterId,
      parameterLabel: point.parameterLabel ?? parameter?.label ?? point.parameterId,
      unit: point.unit ?? parameter?.unit ?? "px",
      points: [],
    };
    bucket.points.push({ signed: point.signed, absolute: point.absolute });
    buckets.set(key, bucket);
  };
  [...sessions].reverse().forEach((session) => {
    const config = COMPONENT_TYPES[session?.type];
    const storedErrors = session?.analysis?.version === 1 && Array.isArray(session.analysis.errors)
      ? session.analysis.errors
      : null;
    if (storedErrors) {
      storedErrors.forEach((error) => {
        const signed = Number(error.signedSteps);
        const absolute = Number(error.absoluteSteps);
        if (!error.parameterId || !Number.isFinite(signed) || !Number.isFinite(absolute)) return;
        append(session, { ...error, signed, absolute });
      });
      return;
    }

    // Backward compatibility for existing v1 records that predate normalized error snapshots.
    const ids = session?.question?.parameterIds;
    if (!config || !Array.isArray(ids)) return;
    ids.forEach((parameterId) => {
      const parameter = config.parameters.find((item) => item.id === parameterId);
      const current = Number(session?.values?.[parameterId]);
      const target = Number(session?.targets?.[parameterId]);
      if (!parameter || !Number.isFinite(current) || !Number.isFinite(target)) return;
      append(session, {
        parameterId,
        componentLabel: config.zh,
        parameterLabel: parameter.label,
        unit: parameter.unit,
        signed: (current - target) / parameter.step,
        absolute: Math.abs(current - target) / parameter.step,
      });
    });
  });

  return [...buckets.values()].map((bucket) => {
    const count = bucket.points.length;
    const average = (items, field) => items.reduce((sum, item) => sum + item[field], 0) / items.length;
    const meanSignedSteps = average(bucket.points, "signed");
    const meanAbsoluteSteps = average(bucket.points, "absolute");
    let movement = "样本积累中";
    if (count >= 4) {
      const midpoint = Math.floor(count / 2);
      const earlier = average(bucket.points.slice(0, midpoint), "absolute");
      const recent = average(bucket.points.slice(midpoint), "absolute");
      movement = recent <= earlier - 0.5 ? "正在改善" : recent >= earlier + 0.5 ? "近期波动" : "保持稳定";
    }
    return {
      ...bucket,
      count,
      meanSignedSteps,
      meanAbsoluteSteps,
      direction: Math.abs(meanSignedSteps) < 0.25 ? "偏向不明显" : meanSignedSteps > 0 ? "经常高估" : "经常低估",
      movement,
    };
  }).sort((a, b) => b.meanAbsoluteSteps - a.meanAbsoluteSteps || b.count - a.count);
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

function trendMarkup(sessions) {
  const trends = analyzeSessions(sessions);
  const reliable = trends.filter((item) => item.count >= 2);
  if (!sessions.length) {
    return `<section class="trend-view" tabindex="-1" aria-labelledby="trend-title">
      <header><div><span>训练复盘</span><h2 id="trend-title">偏差趋势</h2><p>完成训练并保存结果后，这里会汇总你经常高估或低估的尺寸。</p></div><button class="secondary-button" type="button" data-close-trends>返回训练</button></header>
      <div class="trend-empty"><strong>还没有可分析的训练记录</strong><span>先完成一轮猜尺寸或临摹匹配，并在揭晓后保存结果。</span></div>
    </section>`;
  }

  const top = reliable[0];
  const rows = trends.map((item) => {
    const width = Math.min(100, Math.round(item.meanAbsoluteSteps / 4 * 100));
    return `<li>
      <div><strong>${item.componentLabel} · ${item.parameterLabel}</strong><span>${item.count} 次判断 · ${item.direction}</span></div>
      <div class="trend-meter" aria-label="平均偏差 ${item.meanAbsoluteSteps.toFixed(1)} 个刻度"><i style="width:${width}%"></i></div>
      <span>${item.meanAbsoluteSteps.toFixed(1)} 刻度</span><em>${item.movement}</em>
    </li>`;
  }).join("");
  return `<section class="trend-view" tabindex="-1" aria-labelledby="trend-title">
    <header><div><span>训练复盘 · 最近 ${sessions.length} 次</span><h2 id="trend-title">偏差趋势</h2><p>${top ? `当前最值得校准的是${top.componentLabel}的${top.parameterLabel}。至少两次样本后才会开放专项复练。` : "记录正在积累；同一参数至少出现两次后才会判断弱项。"}</p></div><button class="secondary-button" type="button" data-close-trends>返回训练</button></header>
    ${top ? `<div class="trend-focus"><div><span>当前弱项</span><strong>${top.componentLabel} · ${top.parameterLabel}</strong><small>${top.direction}，平均偏差 ${top.meanAbsoluteSteps.toFixed(1)} 个刻度</small></div><button class="primary-button" type="button" data-start-weak-practice data-weak-key="${top.key}">开始专项复练</button></div>` : `<div class="trend-notice">再保存一些同类训练结果，即可开启弱项复练。</div>`}
    <ol class="trend-list" aria-label="参数偏差趋势">${rows}</ol>
  </section>`;
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

function createDemoScreenshot() {
  const width = 760;
  const height = 420;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const roundRect = (x, y, w, h, r, fill, stroke = null, lineW = 2) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.lineWidth = lineW;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  };

  // @2x Retina surface (#FAF9F5)
  ctx.fillStyle = "#FAF9F5";
  ctx.fillRect(0, 0, width, height);

  // Header text blocks (#262522 and #716D66)
  roundRect(56, 44, 240, 32, 4, "#262522");
  roundRect(56, 90, 360, 20, 4, "#716D66");

  // 1. Primary Button (@2x: 280x88 -> CSS 140x44, radius 16 -> CSS 8px, paddingX 36 -> CSS 18px)
  roundRect(56, 148, 280, 88, 16, "#315F9E");
  roundRect(56 + 36, 148 + 30, 280 - 72, 28, 3, "#FFFEFB");

  // 2. Input Box (@2x: 360x80 -> CSS 180x40, radius 12 -> CSS 6px, border 2 -> CSS 1px)
  roundRect(368, 152, 336, 80, 12, "#FFFEFB", "#716D66", 2);
  roundRect(368 + 24, 152 + 26, 180, 28, 3, "#262522");

  // 3. Card container (@2x: 648x124 -> CSS 324x62, radius 20 -> CSS 10px)
  roundRect(56, 264, 648, 116, 20, "#EFEDE5", "#716D66", 2);
  roundRect(56 + 40, 264 + 32, 220, 24, 3, "#262522");
  roundRect(56 + 40, 264 + 68, 420, 20, 3, "#716D66");

  const imageData = ctx.getImageData(0, 0, width, height);
  const dataUrl = canvas.toDataURL("image/png");
  const palette = extractPaletteFromImageData(imageData, 8);
  const defaultSelection = { x: 42, y: 134, width: 308, height: 116 };
  const inspection = inspectComponentRegion(imageData, defaultSelection, { scale: 2 });

  return {
    fileName: "示例软件界面截图 (@2x)",
    imageData,
    dataUrl,
    scale: 2,
    palette,
    selection: defaultSelection,
    inspection,
  };
}

export function initComponentLab(root, { showToast, onSavePalette } = {}) {
  const questions = Object.fromEntries(Object.keys(COMPONENT_TYPES).map((type) => [type, createQuestion(type)]));
  const state = {
    type: "button",
    mode: "guess",
    phase: "observe",
    preview: "target",
    revealed: false,
    confirmed: false,
    zoom: 1,
    difficulty: "basic",
    view: "training",
    weakPractice: null,
    currentSaved: false,
    questions,
    values: Object.fromEntries(Object.entries(COMPONENT_TYPES).map(([id, currentConfig]) => [id, initialTrainingValues(currentConfig, questions[id])])),
    sessions: readSessions(),
    inspector: null,
  };

  function config() {
    return COMPONENT_TYPES[state.type];
  }

  function question() {
    return state.questions[state.type];
  }

  function weakness() {
    if (!state.weakPractice) return null;
    return analyzeSessions(state.sessions).find((item) => item.key === state.weakPractice && item.count >= 2) ?? null;
  }

  function resetExercise() {
    state.revealed = false;
    state.confirmed = false;
    state.currentSaved = false;
    if (state.mode !== "free") state.zoom = 1;
    if (state.mode === "free") {
      state.values[state.type] = targetValues(config());
    } else {
      state.questions[state.type] = createQuestion(state.type, question(), {
        difficulty: state.difficulty,
        preferredParameterId: weakness()?.parameterId,
      });
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
    return `<div class="training-question" data-question-id="${currentQuestion.id}" data-preset-id="${currentQuestion.presetId}" data-group-id="${currentQuestion.groupId}" data-difficulty="${currentQuestion.difficultyId}">
      <span>本轮主题</span><strong>${currentQuestion.groupLabel}</strong><small>${currentQuestion.difficulty}${currentQuestion.focusParameterId ? " · 弱项复练" : ""} · ${labels.join(" · ")}</small>
    </div>`;
  }

  function difficultyMarkup() {
    if (state.mode === "free") return "";
    return `<div class="difficulty-control">
      <span class="training-label">训练难度</span>
      <div class="difficulty-tabs" role="group" aria-label="训练难度">
        ${Object.entries(DIFFICULTIES).map(([id, item]) => `<button type="button" data-difficulty="${id}" aria-pressed="${state.difficulty === id}" class="${state.difficulty === id ? "is-active" : ""}">${item.label}</button>`).join("")}
      </div>
      <p>${DIFFICULTIES[state.difficulty].hint}</p>
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

  function inspectorMarkup() {
    if (!state.inspector) state.inspector = createDemoScreenshot();
    const insp = state.inspector;
    const { imageData, dataUrl, scale, palette, selection, inspection, fileName } = insp;
    const snapped = inspection?.snappedBox || selection;
    const css = inspection?.css || { width: 0, height: 0, radius: 0, border: 0, paddingX: 0, paddingY: 0, fontSize: 14 };
    const suggestedLabel = COMPONENT_TYPES[inspection?.suggestedType || "button"]?.zh || "按钮";
    const leftPct = (snapped.x / imageData.width) * 100;
    const topPct = (snapped.y / imageData.height) * 100;
    const widthPct = (snapped.width / imageData.width) * 100;
    const heightPct = (snapped.height / imageData.height) * 100;

    return `<section class="trend-view inspector-view" tabindex="-1" aria-labelledby="inspector-title">
      <header>
        <div>
          <span>截图几何与配色拆解 · ${fileName}</span>
          <h2 id="inspector-title">从软件截图识别配色、组件宽高与圆角</h2>
          <p>在下方截图上按住鼠标框选任意按钮、输入框或卡片（也可直接按 Ctrl/Cmd + V 粘贴新截图），自动边缘吸附并推算 CSS 尺寸、圆角和内边距。</p>
        </div>
        <div class="inspector-header-actions">
          <button class="secondary-button" type="button" data-trigger-inspector-upload>上传截图</button>
          <button class="secondary-button" type="button" data-close-inspector>返回训练</button>
        </div>
      </header>
      <div class="inspector-toolbar">
        <div class="inspector-scale-switch" role="group" aria-label="截图像素倍率">
          <span>截图倍率</span>
          ${[1, 2, 3].map((dpr) => `<button type="button" class="${scale === dpr ? "is-active" : ""}" data-inspector-scale="${dpr}" aria-pressed="${scale === dpr}">@${dpr}x${dpr === 2 ? " (Retina)" : ""}</button>`).join("")}
        </div>
        <span class="inspector-hint">提示：直接拖动鼠标框选目标组件周围，蓝框会自动贴合组件四边。</span>
      </div>
      <div class="inspector-grid">
        <div class="inspector-stage-card">
          <div class="inspector-canvas-wrap" id="inspector-canvas-wrap">
            <img id="inspector-screenshot-img" src="${dataUrl}" alt="待拆解的软件截图" draggable="false" />
            <div class="inspector-snapped-box" id="inspector-snapped-box" style="left:${leftPct}%;top:${topPct}%;width:${widthPct}%;height:${heightPct}%">
              <span class="inspector-box-badge">${css.width} × ${css.height}px · R${css.radius}</span>
            </div>
            <div class="inspector-drag-box" id="inspector-drag-box" hidden></div>
          </div>
        </div>
        <aside class="inspector-results-card" aria-label="组件与配色识别结果">
          <section class="inspector-result-block">
            <h3>框选组件尺寸与圆角（@${scale}x 换算）</h3>
            <dl class="inspector-metrics-grid">
              <div><dt>CSS 宽 × 高</dt><dd><strong data-inspected-size>${css.width} × ${css.height}px</strong><small>物理像素 ${snapped.width} × ${snapped.height}px</small></dd></div>
              <div><dt>组件圆角</dt><dd><strong data-inspected-radius>${css.radius}px${css.isPill ? " (胶囊)" : ""}</strong><small>四角曲率自动拟合</small></dd></div>
              <div><dt>内边距估计</dt><dd><strong data-inspected-padding>左右 ${css.paddingX}px · 上下 ${css.paddingY}px</strong><small>基于内部文字/图标包围盒</small></dd></div>
              <div><dt>边框与字号</dt><dd><strong data-inspected-font>边框 ${css.border}px · 字号约 ${css.fontSize}px</strong><small>推荐归类：${suggestedLabel}</small></dd></div>
            </dl>
            <div class="inspector-component-colors">
              <span>组件局部色值</span>
              <span class="inspector-color-pill"><i style="background:${inspection?.colors?.fillColor || "#315F9E"}"></i>底色 <code>${inspection?.colors?.fillColor || "#315F9E"}</code></span>
              <span class="inspector-color-pill"><i style="background:${inspection?.colors?.contentColor || "#FFFEFB"}"></i>内容 <code>${inspection?.colors?.contentColor || "#FFFEFB"}</code></span>
            </div>
            <button class="primary-button compact inspector-full-btn" type="button" data-apply-inspector-sandbox>带入「${suggestedLabel}」探索沙盒 1:1 复刻</button>
          </section>
          <section class="inspector-result-block">
            <h3>全图自动识别配色</h3>
            <div class="inspector-palette-roles">
              ${[
                { label: "纸张/背景", hex: palette.roles.pageColor },
                { label: "主要文字", hex: palette.roles.textColor },
                { label: "次级文字", hex: palette.roles.mutedColor },
                { label: "强调色", hex: palette.roles.accentColor },
              ].map((item) => `<div class="inspector-role-item"><i style="background:${item.hex}"></i><span>${item.label}</span><code>${item.hex}</code></div>`).join("")}
            </div>
            <button class="secondary-button inspector-full-btn" type="button" data-save-inspector-palette>将此截图配色存入「配色积累」</button>
          </section>
        </aside>
      </div>
      <input id="inspector-file-input" type="file" accept="image/*" hidden />
    </section>`;
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
    if (state.view === "trends") {
      root.innerHTML = `<aside class="training-panel">
        <header class="training-heading"><p class="panel-kicker">Pixel training</p><h1>组件像素训练</h1><p>复盘保存的判断，找到反复出现的尺寸偏差。</p></header>
        <div class="training-section">
          <button class="history-entry is-active" type="button" data-close-trends aria-current="page"><strong>偏差趋势</strong><span>${state.sessions.length} 条记录</span></button>
          <button class="history-entry" type="button" data-open-inspector><strong>截图拆解</strong><span>测配色与圆角尺寸</span></button>
        </div>
      </aside><section class="training-workspace">${trendMarkup(state.sessions)}</section>`;
      bind();
      return;
    }
    if (state.view === "inspector") {
      root.innerHTML = `<aside class="training-panel">
        <header class="training-heading"><p class="panel-kicker">Screenshot Inspector</p><h1>截图像素拆解</h1><p>上传软件截图，自动提取四色并框选测量组件宽高、圆角与内边距。</p></header>
        <div class="training-section">
          <button class="history-entry" type="button" data-close-inspector><strong>返回组件训练</strong><span>猜尺寸 · 临摹 · 沙盒</span></button>
          <button class="history-entry is-active" type="button" data-close-inspector aria-current="page"><strong>截图拆解</strong><span>已启用自动边缘吸附</span></button>
        </div>
      </aside><section class="training-workspace">${inspectorMarkup()}</section>`;
      bind();
      return;
    }
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
          ${difficultyMarkup()}
          ${progressMarkup()}
          ${questionMarkup(currentConfig, currentQuestion)}
          ${state.weakPractice ? `<div class="weak-practice-note"><span>专项复练中</span><button type="button" data-stop-weak-practice>退出专项</button></div>` : ""}
          <button class="history-entry" type="button" data-open-trends><strong>查看偏差趋势</strong><span>${state.sessions.length ? `${state.sessions.length} 条记录` : "保存结果后生成"}</span></button>
          <button class="history-entry" type="button" data-open-inspector><strong>截图拆解（测尺寸/圆角）</strong><span>上传截图自动识别</span></button>
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
    root.querySelectorAll("[data-difficulty]").forEach((button) => button.addEventListener("click", () => {
      state.difficulty = button.dataset.difficulty;
      resetExercise();
      render();
    }));
    root.querySelector("[data-open-trends]")?.addEventListener("click", () => {
      state.view = "trends";
      render();
      window.requestAnimationFrame(() => root.querySelector(".trend-view")?.focus({ preventScroll: true }));
    });
    root.querySelectorAll("[data-close-trends]").forEach((button) => button.addEventListener("click", () => {
      state.view = "training";
      render();
    }));
    root.querySelectorAll("[data-open-inspector]").forEach((button) => button.addEventListener("click", () => {
      state.view = "inspector";
      if (!state.inspector) state.inspector = createDemoScreenshot();
      render();
      window.requestAnimationFrame(() => root.querySelector(".inspector-view")?.focus({ preventScroll: true }));
    }));
    root.querySelectorAll("[data-close-inspector]").forEach((button) => button.addEventListener("click", () => {
      state.view = "training";
      render();
    }));
    root.querySelector("[data-trigger-inspector-upload]")?.addEventListener("click", () => {
      root.querySelector("#inspector-file-input")?.click();
    });
    root.querySelector("#inspector-file-input")?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (file) loadInspectorFile(file);
      event.target.value = "";
    });
    root.querySelectorAll("[data-inspector-scale]").forEach((button) => button.addEventListener("click", () => {
      if (!state.inspector) return;
      state.inspector.scale = Number(button.dataset.inspectorScale) || 2;
      state.inspector.inspection = inspectComponentRegion(
        state.inspector.imageData,
        state.inspector.selection,
        { scale: state.inspector.scale },
      );
      render();
    }));
    root.querySelector("[data-apply-inspector-sandbox]")?.addEventListener("click", () => {
      const inspection = state.inspector?.inspection;
      if (!inspection) return;
      const targetType = inspection.suggestedType || "button";
      state.type = targetType;
      state.mode = "free";
      state.view = "training";
      state.revealed = false;
      const targetConfig = COMPONENT_TYPES[targetType];
      const nextValues = targetValues(targetConfig);
      const mapField = (paramId, rawVal) => {
        const param = targetConfig.parameters.find((p) => p.id === paramId);
        if (param && Number.isFinite(rawVal)) {
          nextValues[paramId] = clampParameterValue(param, rawVal);
        }
      };
      mapField("height", inspection.css.height);
      mapField("width", inspection.css.width);
      mapField("paddingX", inspection.css.paddingX);
      mapField("padding", Math.max(inspection.css.paddingX, inspection.css.paddingY));
      mapField("radius", inspection.css.radius);
      mapField("border", inspection.css.border);
      mapField("fontSize", inspection.css.fontSize);
      state.values[targetType] = nextValues;
      render();
      showToast?.(`已按识别尺寸复刻到「${targetConfig.zh}」探索沙盒`);
    });
    root.querySelector("[data-save-inspector-palette]")?.addEventListener("click", () => {
      if (!state.inspector?.palette || !onSavePalette) return;
      onSavePalette(state.inspector.palette.roles, {
        title: `${state.inspector.fileName.replace(/\.[a-z0-9]+$/i, "")} · 配色`,
        tags: ["截图拆解"],
      });
    });

    const canvasWrap = root.querySelector("#inspector-canvas-wrap");
    const dragBox = root.querySelector("#inspector-drag-box");
    if (canvasWrap && dragBox && state.inspector) {
      let dragStart = null;
      const toImageCoords = (clientX, clientY) => {
        const rect = canvasWrap.getBoundingClientRect();
        const x = Math.max(0, Math.min(state.inspector.imageData.width, ((clientX - rect.left) / Math.max(1, rect.width)) * state.inspector.imageData.width));
        const y = Math.max(0, Math.min(state.inspector.imageData.height, ((clientY - rect.top) / Math.max(1, rect.height)) * state.inspector.imageData.height));
        return { x, y, rect };
      };

      canvasWrap.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        canvasWrap.setPointerCapture?.(event.pointerId);
        dragStart = toImageCoords(event.clientX, event.clientY);
        dragBox.hidden = false;
        dragBox.style.left = `${(dragStart.x / state.inspector.imageData.width) * 100}%`;
        dragBox.style.top = `${(dragStart.y / state.inspector.imageData.height) * 100}%`;
        dragBox.style.width = "0%";
        dragBox.style.height = "0%";
      });

      canvasWrap.addEventListener("pointermove", (event) => {
        if (!dragStart) return;
        const curr = toImageCoords(event.clientX, event.clientY);
        const x0 = Math.min(dragStart.x, curr.x);
        const y0 = Math.min(dragStart.y, curr.y);
        const w = Math.abs(curr.x - dragStart.x);
        const h = Math.abs(curr.y - dragStart.y);
        dragBox.style.left = `${(x0 / state.inspector.imageData.width) * 100}%`;
        dragBox.style.top = `${(y0 / state.inspector.imageData.height) * 100}%`;
        dragBox.style.width = `${(w / state.inspector.imageData.width) * 100}%`;
        dragBox.style.height = `${(h / state.inspector.imageData.height) * 100}%`;
      });

      const finishSelection = (event) => {
        if (!dragStart) return;
        const curr = toImageCoords(event.clientX, event.clientY);
        dragBox.hidden = true;
        let x0 = Math.min(dragStart.x, curr.x);
        let y0 = Math.min(dragStart.y, curr.y);
        let w = Math.abs(curr.x - dragStart.x);
        let h = Math.abs(curr.y - dragStart.y);
        dragStart = null;
        if (w < 12 || h < 12) {
          // Single click: expand search window around click point
          w = Math.min(340, state.inspector.imageData.width * 0.45);
          h = Math.min(120, state.inspector.imageData.height * 0.3);
          x0 = Math.max(0, curr.x - w * 0.5);
          y0 = Math.max(0, curr.y - h * 0.5);
        }
        state.inspector.selection = { x: x0, y: y0, width: w, height: h };
        state.inspector.inspection = inspectComponentRegion(
          state.inspector.imageData,
          state.inspector.selection,
          { scale: state.inspector.scale },
        );
        render();
      };

      canvasWrap.addEventListener("pointerup", finishSelection);
    }
    root.querySelector("[data-start-weak-practice]")?.addEventListener("click", (event) => {
      const selected = analyzeSessions(state.sessions).find((item) => item.key === event.currentTarget.dataset.weakKey && item.count >= 2);
      if (!selected) return;
      state.weakPractice = selected.key;
      state.type = selected.type;
      state.mode = "guess";
      state.view = "training";
      resetExercise();
      render();
      showToast?.(`开始复练${selected.componentLabel}的${selected.parameterLabel}`);
    });
    root.querySelector("[data-stop-weak-practice]")?.addEventListener("click", () => {
      state.weakPractice = null;
      resetExercise();
      render();
      showToast?.("已退出弱项复练");
    });
    root.querySelectorAll("[data-training-mode]").forEach((button) => button.addEventListener("click", () => {
      state.mode = button.dataset.trainingMode;
      resetExercise();
      render();
    }));
    root.querySelectorAll("[data-component-type]").forEach((button) => button.addEventListener("click", () => {
      state.type = button.dataset.componentType;
      if (weakness()?.type !== state.type) state.weakPractice = null;
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
      if (state.currentSaved) {
        showToast?.("本轮训练结果已经保存");
        return;
      }
      const analysisResults = resultData(config(), state.values[state.type], question()).results;
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
          difficultyId: question().difficultyId,
        },
        analysis: {
          version: 1,
          errors: analysisResults.map((result) => ({
            parameterId: result.parameter.id,
            componentLabel: config().zh,
            parameterLabel: result.parameter.label,
            unit: result.parameter.unit,
            signedSteps: result.delta / result.parameter.step,
            absoluteSteps: result.distance,
          })),
        },
        date: new Date().toISOString(),
      };
      state.sessions.unshift(item);
      state.sessions = state.sessions.slice(0, 30);
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(state.sessions));
        state.currentSaved = true;
        const saveButton = root.querySelector("[data-save-training]");
        if (saveButton) {
          saveButton.disabled = true;
          saveButton.textContent = "已保存";
        }
        showToast?.(`已保存 ${config().zh} 训练结果`);
      } catch {
        state.sessions.shift();
        showToast?.("训练结果未保存，请检查浏览器存储设置");
      }
    });
  }

  function loadInspectorFile(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxDim = 1040;
      const ratio = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
      const width = Math.max(20, Math.round((img.naturalWidth || 1) * ratio));
      const height = Math.max(20, Math.round((img.naturalHeight || 1) * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/png");
      URL.revokeObjectURL(url);

      const palette = extractPaletteFromImageData(imageData, 8);
      const scale = state.inspector?.scale || 2;
      const selection = {
        x: Math.round(width * 0.1),
        y: Math.round(height * 0.12),
        width: Math.round(width * 0.8),
        height: Math.round(height * 0.76),
      };
      const inspection = inspectComponentRegion(imageData, selection, { scale });
      state.inspector = {
        fileName: file.name || "上传截图",
        imageData,
        dataUrl,
        scale,
        palette,
        selection,
        inspection,
      };
      state.view = "inspector";
      render();
      showToast?.("已识别截图配色与初始区域，可拖动鼠标框选具体组件");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      showToast?.("截图加载失败，请选择有效的图片文件");
    };
    img.src = url;
  }

  window.addEventListener("paste", (event) => {
    if (root.hidden) return;
    const items = [...(event.clipboardData?.items || [])];
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (file) {
      event.preventDefault();
      loadInspectorFile(file);
    }
  });

  function applyCustomValues(type, customValues = {}) {
    const targetType = COMPONENT_TYPES[type] ? type : "button";
    state.type = targetType;
    state.view = "training";
    state.mode = "free";
    state.phase = "explore";
    state.preview = "current";
    state.revealed = false;
    state.confirmed = false;
    const targetConfig = COMPONENT_TYPES[targetType];
    const nextValues = targetValues(targetConfig);
    Object.entries(customValues || {}).forEach(([paramId, rawVal]) => {
      const param = targetConfig.parameters.find((p) => p.id === paramId);
      if (param && Number.isFinite(Number(rawVal))) {
        nextValues[paramId] = clampParameterValue(param, Number(rawVal));
      }
    });
    state.values[targetType] = nextValues;
    render();
    return targetConfig.zh;
  }

  render();
  return { refresh: render, sessionCount: () => state.sessions.length, applyCustomValues };
}
