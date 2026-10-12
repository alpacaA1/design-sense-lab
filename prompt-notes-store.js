export const PROMPT_NOTES_KEY = "design-sense-prompt-notes-v1";
const APP_ID = "design-sense-prompt-notes";

export function parseTechnologyTags(value) {
  const values = Array.isArray(value) ? value : String(value || "").split(/[,，、\n]+/);
  const seen = new Set();
  return values.map((tag) => String(tag).trim()).filter((tag) => {
    if (!tag || seen.has(tag.toLowerCase())) return false;
    seen.add(tag.toLowerCase());
    return true;
  });
}

function newId() {
  return globalThis.crypto?.randomUUID?.() || `note-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function validateNote(note) {
  if (!note || typeof note !== "object" || typeof note.id !== "string" || !note.id.trim()
    || typeof note.title !== "string" || !note.title.trim()
    || typeof note.prompt !== "string" || !note.prompt.trim()
    || typeof note.understanding !== "string" || !Array.isArray(note.tags)
    || note.tags.some((tag) => typeof tag !== "string")
    || !Number.isFinite(Date.parse(note.createdAt)) || !Number.isFinite(Date.parse(note.updatedAt))) {
    throw new Error("备份中的笔记格式不完整，请选择本应用导出的 JSON 文件。");
  }
  return {
    id: note.id, title: note.title.trim(), prompt: note.prompt,
    understanding: note.understanding, tags: parseTechnologyTags(note.tags),
    createdAt: note.createdAt, updatedAt: note.updatedAt,
  };
}

function payload(notes) {
  return { app: APP_ID, schemaVersion: 1, notes };
}

export function parsePromptNotesBackup(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("文件不是有效的 JSON，请选择提示词笔记备份。"); }
  if (data?.app !== APP_ID || data.schemaVersion !== 1 || !Array.isArray(data.notes)) {
    throw new Error("备份格式或版本不匹配，请选择本应用导出的 JSON 文件。");
  }
  return data.notes.map(validateNote);
}

export function createExampleNote() {
  const now = new Date().toISOString();
  return {
    id: "watercolor-prompt-example", title: "从参考画生成水彩动画",
    prompt: `请根据我提供的参考画，生成一个可运行的水彩绘画动画网页。

我提供两份参考：
1. 图片：作为构图、主体、配色和绘画质感的参考。
2. HTML 代码：作为 p5.js、p5.brush 和逐笔绘画动画的技术参考。

请先简要分析图片，再输出完整的单文件 HTML。

一、分析参考画
识别主体的位置、大小、比例，前中后景与遮挡关系，主要色彩、明暗和留白，以及笔触、晕染和细节密度。
把分析转化为适合程序绘制的形状、曲线和色块，避免只用“唯美、梦幻、高级”等形容词描述风格。

二、绘制要求
使用 p5.js 2.3.3 和 p5.brush 2.2.2，用程序生成主体形状、线条和色块。参考图只用于观察，不作为画面贴图。
优先还原构图、主体轮廓、色彩关系和留白，再补充纹理与细节。
用适量随机扰动表现手绘感，保持主体结构稳定。使用固定随机种子，让同一组参数能够重复生成，并保留参考图的长宽比。

三、水彩质感
参考现有代码中的 fill、fillBleed、fillTexture、半透明叠色和自定义笔刷。根据参考画分别调整晕染程度和笔触。

四、绘画动画
参考现有代码的 paint、buf 和 revealSlice 机制，从背景开始，逐步绘制主体与细节。每一步先在隐藏画布绘制，再逐渐显示，完成的笔画累积保留。
绘画过程约 12 秒，完成后停留 3 秒，再循环。绘画顺序符合新参考画，不机械照搬原代码。

五、交付
集中定义配色、随机种子、笔刷参数和动画时长，并用中文注释说明调整方式。
复用参考 HTML 中适用的绘画引擎，替换场景绘制逻辑，不自动保留原来的芦苇、睡莲等元素。
输出完整 HTML，包含全部函数，不省略代码。如能运行浏览器，请检查画面与控制台；如未实际运行，请明确说明。`,
    understanding: `提示词思路
“优先还原构图和色彩，再补充纹理”明确了任务优先级。
指定技术与交付格式，帮助 AI 确定实现方向。
参考画决定画什么，参考源码提供绘画与动画的实现方式。

涉及技术
p5.js：创建画布，管理绘制和动画。
官方文档：https://p5js.org/reference/

p5.brush：提供笔刷、水彩晕染、色块纹理和边缘效果。
官方说明：https://github.com/acamposuribe/p5.brush

复用方法
换一张参考画时，可以沿用技术与交付要求，重新描述主体、构图和配色。

这是本次讨论整理的示例理解，可按自己的认识修改。`,
    tags: ["p5.js", "p5.brush"], createdAt: now, updatedAt: now,
  };
}

export function createPromptNotesState(storage) {
  const state = { notes: [], storage: null, readError: false, rawBackup: null, error: "" };
  try {
    state.storage = storage || globalThis.localStorage;
    const raw = state.storage.getItem(PROMPT_NOTES_KEY);
    state.rawBackup = raw;
    if (raw !== null) {
      state.notes = parsePromptNotesBackup(raw);
      return state;
    }
    state.notes = [createExampleNote()];
    const serialized = JSON.stringify(payload(state.notes));
    state.storage.setItem(PROMPT_NOTES_KEY, serialized);
    state.rawBackup = serialized;
  } catch {
    if (state.rawBackup !== null) {
      state.readError = true;
      state.error = "本地记录读取失败，已保留原始数据。请先导出备份。";
    } else {
      state.error = "当前浏览器未能保存笔记，请检查存储设置，也可以导出备份。";
    }
  }
  return state;
}

function commitNotes(state, notes) {
  if (state.readError) throw new Error("请先导出原始备份，当前记录读取失败，暂不写入新数据。");
  let stored;
  try { stored = state.storage.getItem(PROMPT_NOTES_KEY); }
  catch { throw new Error("当前浏览器无法读取笔记，请先复制编辑中的内容备份。"); }
  if (stored !== state.rawBackup) {
    throw new Error("笔记已在另一窗口更新。请先复制当前编辑内容，再刷新页面，避免覆盖其他修改。");
  }
  const serialized = JSON.stringify(payload(notes));
  try {
    state.storage.setItem(PROMPT_NOTES_KEY, serialized);
  } catch {
    throw new Error("保存失败，浏览器存储可能不可用或已满。内容仍保留在编辑区，请先复制备份。");
  }
  state.notes = notes;
  state.rawBackup = serialized;
  state.error = "";
}

export function savePromptNote(state, fields, id = null) {
  if (typeof fields.title !== "string" || !fields.title.trim() || typeof fields.prompt !== "string" || !fields.prompt.trim()) {
    throw new Error("请填写标题和提示词原文。");
  }
  const previous = id ? state.notes.find((note) => note.id === id) : null;
  if (id && !previous) throw new Error("没有找到这条笔记，请返回列表后重试。");
  const now = new Date().toISOString();
  const note = {
    id: previous?.id || newId(), title: fields.title.trim(), prompt: fields.prompt,
    understanding: String(fields.understanding || ""), tags: parseTechnologyTags(fields.tags),
    createdAt: previous?.createdAt || now, updatedAt: now,
  };
  commitNotes(state, [note, ...state.notes.filter((item) => item.id !== note.id)]);
  return note;
}

export function filterPromptNotes(notes, query = "", tag = "") {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return notes.filter((note) => {
    const text = [note.title, note.prompt, note.understanding, ...note.tags].join("\n").toLowerCase();
    return (!tag || note.tags.some((item) => item.toLowerCase() === tag.toLowerCase()))
      && terms.every((term) => text.includes(term));
  });
}

export function exportPromptNotes(state) {
  if (state.readError) return state.rawBackup;
  return JSON.stringify({ ...payload(state.notes), exportedAt: new Date().toISOString() }, null, 2);
}

function noteSignature(note) {
  return JSON.stringify([note.title, note.prompt, note.understanding, note.tags.map((tag) => tag.toLowerCase()).sort()]);
}

export function importPromptNotes(state, text) {
  const incoming = parsePromptNotesBackup(text);
  const merged = [...state.notes];
  const signatures = new Set(merged.map(noteSignature));
  const ids = new Set(merged.map((note) => note.id));
  let added = 0, skipped = 0, conflicts = 0;
  for (const note of incoming) {
    const signature = noteSignature(note);
    if (signatures.has(signature)) { skipped++; continue; }
    if (ids.has(note.id)) { note.id = newId(); conflicts++; }
    ids.add(note.id);
    signatures.add(signature);
    merged.push(note);
    added++;
  }
  commitNotes(state, merged.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)));
  return { added, skipped, conflicts };
}
