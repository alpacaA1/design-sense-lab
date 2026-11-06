import assert from "node:assert/strict";
import {
  COLOR_PALETTES_KEY,
  createColorPalettesState,
  deleteColorPalette,
  evaluatePaletteContrast,
  exportColorPalettes,
  filterColorPalettes,
  formatPaletteText,
  importColorPalettes,
  normalizeHex,
  parsePaletteTags,
  saveColorPalette,
} from "../color-palettes-store.js";

const memory = new Map();
const storage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
};

const state = createColorPalettesState(storage);
assert.equal(state.palettes.length, 2, "first visit initializes with two curated example palettes");
assert.equal(createColorPalettesState(storage).palettes.length, 2, "reload does not duplicate starter palettes");
assert.equal(normalizeHex("#315f9e"), "#315F9E");
assert.equal(normalizeHex("abc"), "#AABBCC");
assert.equal(normalizeHex("invalid"), null);
assert.deepEqual(parsePaletteTags("长文档，暖纸, 长文档\n高对比"), ["长文档", "暖纸", "高对比"]);

const contrast = evaluatePaletteContrast(state.palettes[0].colors);
assert.equal(contrast.text.passAA, true);
assert.equal(contrast.text.passAAA, true);
assert.equal(contrast.muted.passLarge, true);

const saved = saveColorPalette(state, {
  title: "  夜读暗松绿  ",
  pageColor: "#f4f6f3",
  textColor: "#1d2420",
  mutedColor: "#5e6a63",
  accentColor: "#276249",
  notes: "松绿强调色控制在小标题与边线",
  tags: "长文档, 松绿, 长文档",
});

assert.equal(saved.title, "夜读暗松绿");
assert.equal(saved.colors.accentColor, "#276249");
assert.deepEqual(saved.tags, ["长文档", "松绿"]);
assert.equal(filterColorPalettes(state.palettes, "#276249")[0].id, saved.id, "searchable by hex code");
assert.equal(filterColorPalettes(state.palettes, "边线", "松绿")[0].id, saved.id, "searchable by notes and tag");
assert.ok(formatPaletteText(saved).includes("--doc-accent: #276249;"));

const createdAt = saved.createdAt;
const updated = saveColorPalette(state, {
  ...saved,
  ...saved.colors,
  title: "夜读暗松绿（修订）",
}, saved.id);
assert.equal(updated.createdAt, createdAt);
assert.equal(state.palettes.length, 3, "updating existing palette does not append duplicate");

assert.throws(() => saveColorPalette(state, {
  title: "   ",
  pageColor: "#FFFEFB",
  textColor: "#262522",
  mutedColor: "#716D66",
  accentColor: "#315F9E",
}), /名称/);

assert.throws(() => saveColorPalette(state, {
  title: "无效色值",
  pageColor: "not-a-hex",
  textColor: "#262522",
  mutedColor: "#716D66",
  accentColor: "#315F9E",
}), /纸张底色/);

const backup = exportColorPalettes(state);
assert.deepEqual(importColorPalettes(state, backup), { added: 0, skipped: 3, conflicts: 0 });

const incoming = JSON.parse(backup);
incoming.palettes = [{
  ...updated,
  title: "另一台设备修改的同名 ID 配色",
  colors: { ...updated.colors, accentColor: "#1B4D3E" },
}];
assert.deepEqual(importColorPalettes(state, JSON.stringify(incoming)), { added: 1, skipped: 0, conflicts: 1 });
assert.equal(state.palettes.length, 4);

assert.equal(deleteColorPalette(state, saved.id), true);
assert.equal(state.palettes.length, 3);

const tabMemory = new Map();
const tabStorage = {
  getItem: (key) => tabMemory.get(key) ?? null,
  setItem: (key, value) => tabMemory.set(key, value),
};
const tabA = createColorPalettesState(tabStorage);
const tabB = createColorPalettesState(tabStorage);
saveColorPalette(tabA, {
  title: "窗口 A 新配色",
  pageColor: "#FFFEFB",
  textColor: "#262522",
  mutedColor: "#716D66",
  accentColor: "#315F9E",
});
assert.throws(() => saveColorPalette(tabB, {
  title: "窗口 B 过期写入",
  pageColor: "#FFFEFB",
  textColor: "#262522",
  mutedColor: "#716D66",
  accentColor: "#315F9E",
}), /另一窗口/);

memory.set(COLOR_PALETTES_KEY, "corrupted json bytes");
const damaged = createColorPalettesState(storage);
assert.equal(damaged.readError, true);
assert.equal(exportColorPalettes(damaged), "corrupted json bytes");

console.log("color palettes tests passed: starter examples, contrast, CRUD, search, backup merge, multi-tab protection");
