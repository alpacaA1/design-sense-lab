import { COMPONENT_TYPES, DIFFICULTIES, QUESTION_BANK, analyzeSessions, createQuestion } from "../component-lab.js";

if (Object.keys(DIFFICULTIES).length !== 3) throw new Error("难度系统必须包含基础、进阶和综合");

for (const [type, config] of Object.entries(COMPONENT_TYPES)) {
  const bank = QUESTION_BANK[type];
  if (!bank) throw new Error(`${type} 缺少题库`);
  if (bank.presets.length < 3) throw new Error(`${type} 的尺度预设不足`);
  if (bank.groups.length < 3) throw new Error(`${type} 的参数主题不足`);

  for (const preset of bank.presets) {
    for (const parameter of config.parameters) {
      const value = preset.values[parameter.id];
      if (!Number.isFinite(value)) throw new Error(`${type}/${preset.id} 缺少 ${parameter.id}`);
      if (value < parameter.min || value > parameter.max) throw new Error(`${type}/${preset.id}/${parameter.id} 超出范围`);
      const steps = (value - parameter.min) / parameter.step;
      if (Math.abs(steps - Math.round(steps)) > 1e-8) throw new Error(`${type}/${preset.id}/${parameter.id} 未对齐步长`);
    }
  }

  const parameterIds = new Set(config.parameters.map((parameter) => parameter.id));
  for (const group of bank.groups) {
    if (group.parameters.length < 2 || group.parameters.length > 3) throw new Error(`${type}/${group.id} 不是二至三个参数`);
    if (group.parameters.some((id) => !parameterIds.has(id))) throw new Error(`${type}/${group.id} 包含未知参数`);
  }

  let previous = createQuestion(type);
  for (let index = 0; index < 100; index += 1) {
    const next = createQuestion(type, previous);
    if (next.presetId === previous.presetId) throw new Error(`${type} 连续重复尺度预设`);
    if (next.groupId === previous.groupId) throw new Error(`${type} 连续重复训练主题`);
    previous = next;
  }


  const advanced = createQuestion(type, null, { difficulty: "advanced" });
  if (advanced.difficultyId !== "advanced") throw new Error(`${type} 进阶题难度标记错误`);
  if (!advanced.parameterIds.some((id) => advanced.targets[id] !== bank.presets.find((item) => item.id === advanced.presetId).values[id])) {
    throw new Error(`${type} 进阶题没有生成相近但不同的目标值`);
  }

  const comprehensive = createQuestion(type, null, { difficulty: "comprehensive" });
  if (comprehensive.parameterIds.length !== config.parameters.length) throw new Error(`${type} 综合题未覆盖全部参数`);

  const preferred = config.parameters[0].id;
  const focused = createQuestion(type, null, { preferredParameterId: preferred });
  if (!focused.parameterIds.includes(preferred)) throw new Error(`${type} 弱项复练没有包含指定参数`);
}

const trendQuestion = createQuestion("button", null, { difficulty: "basic" });
const trendValues = { ...trendQuestion.targets };
const trendParameter = COMPONENT_TYPES.button.parameters.find((item) => item.id === trendQuestion.parameterIds[0]);
trendValues[trendParameter.id] += trendParameter.step * 2;
const sessions = [0, 1, 2, 3].map((id) => ({
  id,
  type: "button",
  mode: "guess",
  values: trendValues,
  targets: trendQuestion.targets,
  question: trendQuestion,
}));
const trends = analyzeSessions(sessions);
const trend = trends.find((item) => item.parameterId === trendParameter.id);
if (!trend || trend.count !== 4 || trend.direction !== "经常高估") throw new Error("偏差趋势聚合错误");

const versioned = analyzeSessions([{
  id: 10,
  type: "button",
  values: {},
  targets: {},
  analysis: {
    version: 1,
    errors: [{
      parameterId: "height",
      componentLabel: "按钮",
      parameterLabel: "组件高度",
      unit: "px",
      signedSteps: -1.5,
      absoluteSteps: 1.5,
    }],
  },
}]);
if (versioned[0]?.direction !== "经常低估" || versioned[0]?.meanAbsoluteSteps !== 1.5) {
  throw new Error("版本化偏差快照解析错误");
}

console.log("component lab tests passed: question bank, difficulty levels, weak focus, and trend analysis");
