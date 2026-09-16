import { CATEGORY_ORDER, DOCUMENT_TYPES, allParameters, findParameter } from "./config.js";

const STATE_KEY = "design-sense-doc-workspace-v1";
const STYLES_KEY = "design-sense-my-styles-v1";

function normalizeValue(parameter, value) {
  if (parameter.type === "number") {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return parameter.default;
    const clamped = Math.min(parameter.max, Math.max(parameter.min, numeric));
    const steps = Math.round((clamped - parameter.min) / parameter.step);
    return Number((parameter.min + steps * parameter.step).toFixed(4));
  }
  if (parameter.type === "toggle") return value === true || value === "true";
  if (parameter.type === "select") {
    return parameter.options.some((option) => option.value === String(value)) ? String(value) : parameter.default;
  }
  if (parameter.type === "color") return /^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : parameter.default;
  return parameter.default;
}

function defaultsFor(config) {
  return {
    activeCategory: config.defaultCategory,
    values: Object.fromEntries(allParameters(config).map((parameter) => [parameter.id, parameter.default])),
  };
}

function hydrateType(config, saved) {
  const fresh = defaultsFor(config);
  if (!saved || typeof saved !== "object") return fresh;
  if (saved.activeCategory === null || CATEGORY_ORDER.includes(saved.activeCategory)) fresh.activeCategory = saved.activeCategory;
  allParameters(config).forEach((parameter) => {
    if (saved.values && Object.hasOwn(saved.values, parameter.id)) {
      fresh.values[parameter.id] = normalizeValue(parameter, saved.values[parameter.id]);
    }
  });
  return fresh;
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function hydrateStyle(style, index) {
  if (!style || !Object.hasOwn(DOCUMENT_TYPES, style.type)) return null;
  const config = DOCUMENT_TYPES[style.type];
  const values = defaultsFor(config).values;
  allParameters(config).forEach((parameter) => {
    if (style.values && Object.hasOwn(style.values, parameter.id)) {
      values[parameter.id] = normalizeValue(parameter, style.values[parameter.id]);
    }
  });
  return {
    schemaVersion: 1,
    id: Number.isFinite(Number(style.id)) ? Number(style.id) : Date.now() + index,
    name: typeof style.name === "string" ? style.name.slice(0, 60) : `${config.label}样式`,
    type: style.type,
    values,
    date: typeof style.date === "string" ? style.date.slice(0, 20) : "",
  };
}

export function createAppState() {
  const saved = readJson(STATE_KEY, {});
  const rawStyles = readJson(STYLES_KEY, []);
  return {
    currentType: Object.hasOwn(DOCUMENT_TYPES, saved.currentType) ? saved.currentType : "longdoc",
    documents: Object.fromEntries(Object.entries(DOCUMENT_TYPES).map(([id, config]) => [id, hydrateType(config, saved.documents?.[id])])),
    styles: Array.isArray(rawStyles) ? rawStyles.map(hydrateStyle).filter(Boolean) : [],
    styleFilter: "all",
  };
}

export function persistWorkspace(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({ currentType: state.currentType, documents: state.documents }));
    return true;
  } catch {
    return false;
  }
}

export function persistStyles(state) {
  try {
    localStorage.setItem(STYLES_KEY, JSON.stringify(state.styles));
    return true;
  } catch {
    return false;
  }
}

export function setDocumentType(state, type) {
  if (Object.hasOwn(DOCUMENT_TYPES, type)) state.currentType = type;
}

export function setCategory(state, categoryId) {
  if (!CATEGORY_ORDER.includes(categoryId)) return;
  const documentState = state.documents[state.currentType];
  documentState.activeCategory = documentState.activeCategory === categoryId ? null : categoryId;
}

export function setParameter(state, parameterId, value) {
  const config = DOCUMENT_TYPES[state.currentType];
  const parameter = findParameter(config, parameterId);
  if (!parameter) return;
  state.documents[state.currentType].values[parameterId] = normalizeValue(parameter, value);
}

export function resetCurrentDocument(state) {
  state.documents[state.currentType] = defaultsFor(DOCUMENT_TYPES[state.currentType]);
}

export function saveCurrentStyle(state, name) {
  const config = DOCUMENT_TYPES[state.currentType];
  const style = {
    schemaVersion: 1,
    id: Date.now(),
    name: String(name).trim().slice(0, 60) || `${config.label}样式`,
    type: state.currentType,
    values: { ...state.documents[state.currentType].values },
    date: new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()),
  };
  state.styles.unshift(style);
  if (!persistStyles(state)) {
    state.styles.shift();
    return null;
  }
  return style;
}

export function applyStyle(state, styleId) {
  const style = state.styles.find((item) => String(item.id) === String(styleId));
  if (!style || !Object.hasOwn(DOCUMENT_TYPES, style.type)) return false;
  state.currentType = style.type;
  const config = DOCUMENT_TYPES[style.type];
  allParameters(config).forEach((parameter) => {
    if (style.values && Object.hasOwn(style.values, parameter.id)) {
      state.documents[style.type].values[parameter.id] = normalizeValue(parameter, style.values[parameter.id]);
    }
  });
  persistWorkspace(state);
  return true;
}
