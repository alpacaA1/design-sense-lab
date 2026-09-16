import assert from "node:assert/strict";

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
};

const { CATEGORY_ORDER, DOCUMENT_TYPES, allParameters } = await import("../config.js");
const {
  applyStyle,
  createAppState,
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

const saved = saveCurrentStyle(state, "克制双栏简历");
assert.ok(saved);
setParameter(state, "bodySize", 13);
assert.equal(applyStyle(state, saved.id), true);
assert.equal(state.documents.resume.values.bodySize, 17);

const metrics = calculateMetrics("resume", state.documents.resume.values);
assert.ok(metrics.pages >= 1);
assert.ok(metrics.charsPerLine >= 10);
assert.ok(["紧凑", "舒适", "宽松"].includes(metrics.density));

resetCurrentDocument(state);
assert.equal(state.documents.resume.values.bodySize, 13);
assert.equal(state.documents.resume.activeCategory, "page");

console.log("document workspace tests passed: 4 types, 6 categories, persistence, styles, metrics, reset");
