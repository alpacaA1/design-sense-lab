export const COLOR_PALETTES_KEY = "design-sense-color-palettes-v1";
const APP_ID = "design-sense-color-palettes";

export const COLOR_ROLES = [
  { id: "pageColor", label: "纸张底色", token: "--doc-page", description: "决定页面冷暖与长文阅读底调", default: "#FFFEFB" },
  { id: "textColor", label: "主要文字", token: "--doc-text", description: "用于标题与正文，决定核心对比度", default: "#262522" },
  { id: "mutedColor", label: "次级文字", token: "--doc-muted", description: "用于标签、日期、页码与辅助信息", default: "#716D66" },
  { id: "accentColor", label: "强调色", token: "--doc-accent", description: "只用于少量标题、链接和关键重点", default: "#315F9E" },
];

export function parsePaletteTags(value) {
  const values = Array.isArray(value) ? value : String(value || "").split(/[,，、\n]+/);
  const seen = new Set();
  return values.map((tag) => String(tag).trim()).filter((tag) => {
    if (!tag || seen.has(tag.toLowerCase())) return false;
    seen.add(tag.toLowerCase());
    return true;
  });
}

export function normalizeHex(value) {
  const cleaned = String(value || "").trim();
  const match3 = /^#?([0-9a-fA-F]{3})$/.exec(cleaned);
  if (match3) {
    const [r, g, b] = match3[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  const match6 = /^#?([0-9a-fA-F]{6})$/.exec(cleaned);
  if (match6) return `#${match6[1].toUpperCase()}`;
  return null;
}

export function normalizePaletteColors(colors = {}) {
  const normalized = {};
  for (const role of COLOR_ROLES) {
    const hex = normalizeHex(colors[role.id]);
    if (!hex) {
      throw new Error(`请填写有效的${role.label}（#RRGGBB 六位十六进制色值）。`);
    }
    normalized[role.id] = hex;
  }
  return normalized;
}

export function contrastRatio(foreground, background) {
  const fg = normalizeHex(foreground) || "#000000";
  const bg = normalizeHex(background) || "#FFFFFF";
  const luminance = (hex) => {
    const channels = hex.slice(1).match(/.{2}/g).map((part) => parseInt(part, 16) / 255);
    const linear = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function evaluatePaletteContrast(colors) {
  const textRatio = contrastRatio(colors.textColor, colors.pageColor);
  const mutedRatio = contrastRatio(colors.mutedColor, colors.pageColor);
  const accentRatio = contrastRatio(colors.accentColor, colors.pageColor);
  return {
    text: {
      ratio: textRatio.toFixed(1),
      numeric: textRatio,
      passAA: textRatio >= 4.5,
      passAAA: textRatio >= 7,
      level: textRatio >= 7 ? "AAA 通过" : textRatio >= 4.5 ? "AA 通过" : "AA 未通过",
    },
    muted: {
      ratio: mutedRatio.toFixed(1),
      numeric: mutedRatio,
      passAA: mutedRatio >= 4.5,
      passLarge: mutedRatio >= 3,
      level: mutedRatio >= 4.5 ? "AA 通过" : mutedRatio >= 3 ? "大字/辅助可读" : "对比偏弱",
    },
    accent: {
      ratio: accentRatio.toFixed(1),
      numeric: accentRatio,
      passAA: accentRatio >= 4.5,
      passLarge: accentRatio >= 3,
      level: accentRatio >= 4.5 ? "AA 通过" : accentRatio >= 3 ? "标题/图形可读" : "仅适合底纹或装饰",
    },
  };
}

function newId() {
  return globalThis.crypto?.randomUUID?.() || `palette-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function validatePalette(item) {
  if (
    !item || typeof item !== "object"
    || typeof item.id !== "string" || !item.id.trim()
    || typeof item.title !== "string" || !item.title.trim()
    || !item.colors || typeof item.colors !== "object"
    || typeof item.notes !== "string"
    || !Array.isArray(item.tags) || item.tags.some((t) => typeof t !== "string")
    || !Number.isFinite(Date.parse(item.createdAt))
    || !Number.isFinite(Date.parse(item.updatedAt))
  ) {
    throw new Error("备份中的配色记录格式不完整，请选择本应用导出的 JSON 文件。");
  }
  let colors;
  try {
    colors = normalizePaletteColors(item.colors);
  } catch {
    throw new Error("备份中的颜色值无效，请选择本应用导出的 JSON 文件。");
  }
  return {
    id: item.id.trim(),
    title: item.title.trim(),
    colors,
    notes: item.notes,
    tags: parsePaletteTags(item.tags),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function payload(palettes) {
  return { app: APP_ID, schemaVersion: 1, palettes };
}

export function parseColorPalettesBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("文件不是有效的 JSON，请选择配色积累备份。");
  }
  if (data?.app !== APP_ID || data.schemaVersion !== 1 || !Array.isArray(data.palettes)) {
    throw new Error("备份格式或版本不匹配，请选择本应用导出的配色 JSON 文件。");
  }
  return data.palettes.map(validatePalette);
}

export function createExamplePalettes() {
  const now = new Date().toISOString();
  return [
    {
      id: "warm-parchment-ink-example",
      title: "暖羊皮纸与深油墨蓝",
      colors: {
        pageColor: "#FFFEFB",
        textColor: "#262522",
        mutedColor: "#716D66",
        accentColor: "#315F9E",
      },
      notes: `搭配思路
纸张底色避开纯白（#FFFFFF），加入极微弱的暖黄底调，减轻长文阅读时的刺眼感。
主要文字采用带暖灰的近黑（#262522），与纸张保持 15:1 以上的充足对比，同时比纯黑更柔和。
次级文字（#716D66）降低明度对比但维持约 4.9:1，保证页眉页脚与日期清晰可读却不抢正文视线。
强调色使用克制的深油墨蓝（#315F9E），只在章节小标和重点引用块中点缀。`,
      tags: ["长文档", "暖纸", "油墨蓝"],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "fir-gray-ochre-example",
      title: "冷杉灰纸与赭石重点",
      colors: {
        pageColor: "#F6F5F0",
        textColor: "#1E2220",
        mutedColor: "#636B66",
        accentColor: "#9A4B26",
      },
      notes: `搭配思路
纸张略带冷杉灰绿感，适合一页纸简报或结构感较强的双栏简历。
文字与次级文字均混入微弱青灰，使整体页面呈冷静的铅印质感。
强调色改用暖调赭石（#9A4B26），在偏冷的纸墨基底上形成明确但不刺眼的冷暖对比，适合突出核心数字或经历节点。`,
      tags: ["一页纸", "简历", "冷暖对比"],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function createColorPalettesState(storage) {
  const state = { palettes: [], storage: null, readError: false, rawBackup: null, error: "" };
  try {
    state.storage = storage || globalThis.localStorage;
    const raw = state.storage.getItem(COLOR_PALETTES_KEY);
    state.rawBackup = raw;
    if (raw !== null) {
      state.palettes = parseColorPalettesBackup(raw);
      return state;
    }
    state.palettes = createExamplePalettes();
    const serialized = JSON.stringify(payload(state.palettes));
    state.storage.setItem(COLOR_PALETTES_KEY, serialized);
    state.rawBackup = serialized;
  } catch {
    if (state.rawBackup !== null) {
      state.readError = true;
      state.error = "本地配色记录读取失败，已保留原始数据。请先导出备份。";
    } else {
      state.error = "当前浏览器未能保存配色记录，请检查存储设置，也可以导出备份。";
    }
  }
  return state;
}

function commitPalettes(state, palettes) {
  if (state.readError) throw new Error("请先导出原始备份，当前记录读取失败，暂不写入新数据。");
  let stored;
  try {
    stored = state.storage.getItem(COLOR_PALETTES_KEY);
  } catch {
    throw new Error("当前浏览器无法读取配色记录，请先复制编辑中的内容备份。");
  }
  if (stored !== state.rawBackup) {
    throw new Error("配色记录已在另一窗口更新。请先复制当前内容，再刷新页面，避免覆盖其他修改。");
  }
  const serialized = JSON.stringify(payload(palettes));
  try {
    state.storage.setItem(COLOR_PALETTES_KEY, serialized);
  } catch {
    throw new Error("保存失败，浏览器存储可能不可用或已满。内容仍保留在编辑区，请先复制备份。");
  }
  state.palettes = palettes;
  state.rawBackup = serialized;
  state.error = "";
}

export function saveColorPalette(state, fields, id = null) {
  if (typeof fields?.title !== "string" || !fields.title.trim()) {
    throw new Error("请填写配色方案名称。");
  }
  const colors = normalizePaletteColors(fields.colors || fields);
  const previous = id ? state.palettes.find((item) => item.id === id) : null;
  if (id && !previous) throw new Error("没有找到这组配色，请返回列表后重试。");
  const now = new Date().toISOString();
  const palette = {
    id: previous?.id || newId(),
    title: fields.title.trim().slice(0, 120),
    colors,
    notes: String(fields.notes || ""),
    tags: parsePaletteTags(fields.tags),
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };
  commitPalettes(state, [palette, ...state.palettes.filter((item) => item.id !== palette.id)]);
  return palette;
}

export function deleteColorPalette(state, id) {
  const exists = state.palettes.some((item) => item.id === id);
  if (!exists) return false;
  commitPalettes(state, state.palettes.filter((item) => item.id !== id));
  return true;
}

export function filterColorPalettes(palettes, query = "", tag = "") {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return palettes.filter((palette) => {
    const colorValues = Object.values(palette.colors).join(" ");
    const text = [palette.title, palette.notes, colorValues, ...palette.tags].join("\n").toLowerCase();
    return (!tag || palette.tags.some((item) => item.toLowerCase() === tag.toLowerCase()))
      && terms.every((term) => text.includes(term));
  });
}

export function exportColorPalettes(state) {
  if (state.readError) return state.rawBackup;
  return JSON.stringify({ ...payload(state.palettes), exportedAt: new Date().toISOString() }, null, 2);
}

function paletteSignature(palette) {
  return JSON.stringify([
    palette.title,
    palette.colors.pageColor,
    palette.colors.textColor,
    palette.colors.mutedColor,
    palette.colors.accentColor,
    palette.notes,
    palette.tags.map((t) => t.toLowerCase()).sort(),
  ]);
}

export function importColorPalettes(state, text) {
  const incoming = parseColorPalettesBackup(text);
  const merged = [...state.palettes];
  const signatures = new Set(merged.map(paletteSignature));
  const ids = new Set(merged.map((item) => item.id));
  let added = 0;
  let skipped = 0;
  let conflicts = 0;
  for (const palette of incoming) {
    const signature = paletteSignature(palette);
    if (signatures.has(signature)) {
      skipped++;
      continue;
    }
    if (ids.has(palette.id)) {
      palette.id = newId();
      conflicts++;
    }
    ids.add(palette.id);
    signatures.add(signature);
    merged.push(palette);
    added++;
  }
  commitPalettes(state, merged.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)));
  return { added, skipped, conflicts };
}

export function formatPaletteText(palette) {
  return [
    `/* ${palette.title} */`,
    `:root {`,
    `  --doc-page: ${palette.colors.pageColor}; /* 纸张底色 */`,
    `  --doc-text: ${palette.colors.textColor}; /* 主要文字 */`,
    `  --doc-muted: ${palette.colors.mutedColor}; /* 次级文字 */`,
    `  --doc-accent: ${palette.colors.accentColor}; /* 强调色 */`,
    `}`,
  ].join("\n");
}
