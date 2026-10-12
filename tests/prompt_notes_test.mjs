import assert from "node:assert/strict";
import {
  PROMPT_NOTES_KEY, createPromptNotesState, exportPromptNotes, filterPromptNotes,
  importPromptNotes, parseTechnologyTags, savePromptNote,
} from "../prompt-notes-store.js";

const memory = new Map();
const storage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
};
const state = createPromptNotesState(storage);
assert.equal(state.notes.length, 1, "first visit starts with the agreed watercolor example");
assert.equal(createPromptNotesState(storage).notes.length, 1, "reload does not duplicate the example");
assert.deepEqual(parseTechnologyTags("p5.js，p5.brush, P5.js\nCanvas"), ["p5.js", "p5.brush", "Canvas"]);

const original = "  请保留换行\n<script>alert('literal prompt')</script>\n  ";
const saved = savePromptNote(state, {
  title: "  画布动画  ", prompt: original, understanding: "用晕染表现水彩", tags: "Canvas, canvas",
});
assert.equal(saved.title, "画布动画");
assert.equal(saved.prompt, original, "prompt whitespace and literal code round-trip unchanged");
assert.deepEqual(saved.tags, ["Canvas"]);
assert.equal(createPromptNotesState(storage).notes.find((note) => note.id === saved.id).prompt, original);
assert.equal(filterPromptNotes(state.notes, "晕染")[0].id, saved.id, "understanding is searchable");
assert.equal(filterPromptNotes(state.notes, "literal prompt", "canvas")[0].id, saved.id);
assert.equal(filterPromptNotes(state.notes, "不存在的词").length, 0);

const createdAt = saved.createdAt;
const edited = savePromptNote(state, { ...saved, title: "画布动画修改" }, saved.id);
assert.equal(edited.createdAt, createdAt);
assert.equal(state.notes.length, 2, "editing updates rather than appending");
assert.throws(() => savePromptNote(state, { title: "标题", prompt: "  " }), /填写/);

const backup = exportPromptNotes(state);
const result = importPromptNotes(state, backup);
assert.deepEqual(result, { added: 0, skipped: 2, conflicts: 0 }, "reimport skips duplicates");
const incoming = JSON.parse(backup);
incoming.notes = [{ ...saved, title: "来自另一设备的同一条笔记", prompt: "另一台设备修改的内容" }];
assert.deepEqual(importPromptNotes(state, JSON.stringify(incoming)), { added: 1, skipped: 0, conflicts: 1 });
assert.equal(state.notes.find((note) => note.id === saved.id).prompt, original, "import conflicts preserve the original");
assert.equal(new Set(state.notes.map((note) => note.id)).size, state.notes.length);
assert.equal(createPromptNotesState(storage).notes.length, 3);

const before = exportPromptNotes(state);
for (const text of ["invalid JSON", '{"notes":[]}', JSON.stringify({ ...incoming, schemaVersion: 2 }), JSON.stringify({ ...incoming, notes: [...incoming.notes, { title: "incomplete" }] })]) {
  assert.throws(() => importPromptNotes(state, text));
}
assert.deepEqual(JSON.parse(exportPromptNotes(state)).notes, JSON.parse(before).notes, "invalid import is atomic");

const refusingStorage = { getItem: storage.getItem, setItem() { throw new Error("quota exceeded"); } };
const refusing = createPromptNotesState(refusingStorage);
const oldNotes = JSON.stringify(refusing.notes);
assert.throws(() => savePromptNote(refusing, { title: "不能保存", prompt: "不要丢失" }), /保存失败/);
assert.equal(JSON.stringify(refusing.notes), oldNotes, "failed writes do not mutate saved notes");

const tabMemory = new Map();
const tabStorage = { getItem: (key) => tabMemory.get(key) ?? null, setItem: (key, value) => tabMemory.set(key, value) };
const firstTab = createPromptNotesState(tabStorage);
const olderTab = createPromptNotesState(tabStorage);
savePromptNote(firstTab, { title: "另一页的新笔记", prompt: "应保留的内容" });
assert.throws(() => savePromptNote(olderTab, { title: "旧页面的编辑", prompt: "不能覆盖另一页" }), /另一窗口/);
assert.equal(createPromptNotesState(tabStorage).notes.length, 2, "a stale tab cannot overwrite a newer save");

memory.set(PROMPT_NOTES_KEY, "corrupted original bytes");
const damaged = createPromptNotesState(storage);
assert.equal(damaged.readError, true);
assert.equal(exportPromptNotes(damaged), "corrupted original bytes");
assert.throws(() => savePromptNote(damaged, { title: "标题", prompt: "内容" }), /原始备份/);
assert.equal(memory.get(PROMPT_NOTES_KEY), "corrupted original bytes", "corrupt data is never silently overwritten");

console.log("prompt notes tests passed: persistence, exact text, search, backup merge, conflicts, invalid imports, storage failures");
