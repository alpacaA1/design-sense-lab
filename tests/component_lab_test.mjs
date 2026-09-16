import { COMPONENT_TYPES, QUESTION_BANK, createQuestion } from "../component-lab.js";

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
}

console.log("component lab question bank tests passed: presets, groups, ranges, and consecutive deduplication");
