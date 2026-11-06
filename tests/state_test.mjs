import assert from "node:assert/strict";

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
};

const { CATEGORY_ORDER, DOCUMENT_TYPES, allParameters } = await import("../config.js");
const {
  applyColorsToCurrentDocument,
  applyStyle,
  applyStyleColors,
  createAppState,
  deleteStyle,
  exportStylesBackup,
  importStylesBackup,
  persistWorkspace,
  resetCurrentDocument,
  saveCurrentStyle,
  setCategory,
  setDocumentType,
  setParameter,
} = await import("../state.js");
const { calculateMetrics } = await import("../renderers.js");

const state = createAppState();
assert.equal(Object.keys(DOCUMENT_TYPES).length, 4);

for (const [type, config] of Object.entries(DOCUMENT_TYPES)) {
  assert.deepEqual(Object.keys(config.categories), CATEGORY_ORDER, `${type} should expose six document categories`);
  const parameters = allParameters(config);
  assert.ok(parameters.length >= 20, `${type} should provide a useful parameter set`);
  assert.ok(parameters.some((parameter) => parameter.type === "number"));
  assert.ok(parameters.some((parameter) => parameter.type === "select"));
  assert.ok(parameters.some((parameter) => parameter.type === "color"));
  assert.ok(parameters.some((parameter) => parameter.type === "toggle"));
}

setDocumentType(state, "resume");
setCategory(state, "typography");
setCategory(state, "typography");
assert.equal(state.documents.resume.activeCategory, null, "clicking the active category should collapse it");
setCategory(state, "typography");
setParameter(state, "bodySize", 17);
setParameter(state, "lineHeight", 99);
setParameter(state, "titleWidth", 14);
assert.equal(state.documents.resume.activeCategory, "typography");
assert.equal(state.documents.resume.values.bodySize, 17);
assert.equal(state.documents.resume.values.lineHeight, 2, "number should clamp to maximum");
assert.equal(state.documents.resume.values.titleWidth, 14);

assert.equal(persistWorkspace(state), true);
const restored = createAppState();
assert.equal(restored.currentType, "resume");
assert.equal(restored.documents.resume.values.bodySize, 17);
setCategory(restored, "typography");
assert.equal(restored.documents.resume.activeCategory, null);
assert.equal(persistWorkspace(restored), true);
const restoredCollapsed = createAppState();
assert.equal(restoredCollapsed.documents.resume.activeCategory, null, "collapsed category state should survive reload");

const saved = saveCurrentStyle(state, "克制双栏简历", "适合产品与设计岗位");
assert.ok(saved);
assert.equal(saved.note, "适合产品与设计岗位");
setParameter(state, "bodySize", 13);
assert.equal(applyStyle(state, saved.id), true);
assert.equal(state.documents.resume.values.bodySize, 17);

assert.equal(applyColorsToCurrentDocument(state, {
  pageColor: "#F6F5F0",
  textColor: "#1E2220",
  mutedColor: "#636B66",
  accentColor: "#9A4B26",
}), true);
assert.equal(state.documents.resume.values.accentColor, "#9A4B26");

const coloredStyle = saveCurrentStyle(state, "赭石简历模版");
setDocumentType(state, "longdoc");
assert.equal(applyStyleColors(state, coloredStyle.id), true);
assert.equal(state.documents.longdoc.values.accentColor, "#9A4B26", "template colors can apply across document types");

const backup = exportStylesBackup(state);
assert.deepEqual(importStylesBackup(state, backup), { added: 0, skipped: 2, conflicts: 0 });
assert.equal(deleteStyle(state, coloredStyle.id), true);
assert.equal(state.styles.length, 1);
assert.deepEqual(importStylesBackup(state, backup), { added: 1, skipped: 1, conflicts: 0 });
assert.equal(state.styles.length, 2);

const metrics = calculateMetrics("resume", state.documents.resume.values);
assert.ok(metrics.pages >= 1);
assert.ok(metrics.charsPerLine >= 10);
assert.ok(["紧凑", "舒适", "宽松"].includes(metrics.density));

setDocumentType(state, "resume");
resetCurrentDocument(state);
assert.equal(state.documents.resume.values.bodySize, 13);
assert.equal(state.documents.resume.activeCategory, "page");

console.log("document workspace tests passed: 4 types, 6 categories, persistence, styles, metrics, reset");
