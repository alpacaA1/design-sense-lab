import {
  createPromptNotesState, exportPromptNotes, filterPromptNotes,
  importPromptNotes, savePromptNote,
} from "./prompt-notes-store.js";

const icons = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
  back: '<path d="m10 5-7 7 7 7M3 12h18"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  edit: '<path d="m15 4 5 5M4 20l1-6L16 3l5 5L10 19Z"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const escapeHtml = (text) => String(text ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

function linkedText(text) {
  return String(text).split(/(https?:\/\/[^\s<>]+)/g).map((part) => {
    if (!/^https?:\/\//.test(part)) return escapeHtml(part);
    const url = part.replace(/[。，、；）)]+$/, "");
    try { new URL(url); } catch { return escapeHtml(part); }
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>${escapeHtml(part.slice(url.length))}`;
  }).join("");
}

const dateLabel = (date) => new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(new Date(date));

export function initPromptNotes(root, { showToast }) {
  const state = createPromptNotesState();
  let selectedId = null;
  let editing = false;
  let dirty = false;
  let query = "";
  let activeTag = "";

  function current() { return state.notes.find((note) => note.id === selectedId); }
  function resetScroll() { root.scrollTop = 0; }
  function focusHeading() { root.querySelector("h1")?.focus({ preventScroll: true }); }

  function canLeave() {
    if (dirty && !window.confirm("当前修改还未保存，确定放弃修改？")) return false;
    if (editing) {
      editing = false;
      dirty = false;
      render();
    }
    return true;
  }

  function tagButtons(tags, filter = false) {
    return tags.map((tag) => `<button class="prompt-tag${activeTag.toLowerCase() === tag.toLowerCase() ? " is-active" : ""}" type="button" data-note-tag="${escapeHtml(tag)}" ${filter ? `aria-pressed="${activeTag.toLowerCase() === tag.toLowerCase()}"` : `aria-label="查找技术：${escapeHtml(tag)}"`}>${escapeHtml(tag)}</button>`).join("");
  }

  function renderResults() {
    const notes = filterPromptNotes(state.notes, query, activeTag);
    root.querySelector("#prompt-note-count").textContent = query || activeTag ? `找到 ${notes.length} 条笔记` : `${notes.length} 条笔记`;
    root.querySelector("#prompt-note-results").innerHTML = notes.length ? notes.map((note) => `
      <article class="prompt-note-row">
        <div class="prompt-note-row__main">
          <button class="prompt-note-open" type="button" data-open-note="${escapeHtml(note.id)}"><h2>${escapeHtml(note.title)}</h2></button>
          <p>${escapeHtml(note.prompt.replace(/\s+/g, " ").slice(0, 130))}</p>
          <div class="prompt-note-row__meta">${tagButtons(note.tags)}<time datetime="${escapeHtml(note.updatedAt)}">${dateLabel(note.updatedAt)}</time>${note.id === "watercolor-prompt-example" ? '<span class="prompt-note-example">可编辑的起始示例</span>' : ""}</div>
        </div>
        <button class="secondary-button prompt-row-copy" type="button" data-copy-note="${escapeHtml(note.id)}" aria-label="复制：${escapeHtml(note.title)}">${icon("copy")}<span>复制</span></button>
      </article>`).join("") : `<div class="prompt-empty"><h2>${state.notes.length ? "没有找到匹配的笔记" : "保存你的第一条提示词"}</h2><p>${state.notes.length ? "换个关键词，或清除技术筛选再试试。" : "先记下原文，自己的理解可以以后再补。"}</p><button class="secondary-button" type="button" data-note-action="${state.notes.length ? "clear" : "new"}">${state.notes.length ? "清除筛选" : "新建笔记"}</button></div>`;
  }

  function renderList() {
    const tags = [...new Set(state.notes.flatMap((note) => note.tags))].sort((a, b) => a.localeCompare(b));
    root.innerHTML = `
      <div class="prompt-notes-page">
        <header class="prompt-page-heading">
          <div><h1 tabindex="-1">提示词笔记</h1><p>保存原文，记下理解，查找涉及的技术。</p></div>
          <div class="prompt-actions"><button class="secondary-button" type="button" data-note-action="import">导入</button><button class="secondary-button" type="button" data-note-action="export">导出备份</button><button class="primary-button" type="button" data-note-action="new">${icon("plus")}新建笔记</button></div>
        </header>
        ${state.error ? `<p class="prompt-storage-error" role="alert">${escapeHtml(state.error)}</p>` : ""}
        <div class="prompt-searchbar"><label class="prompt-search">${icon("search")}<input id="prompt-note-search" type="search" aria-label="搜索提示词笔记" placeholder="搜索标题、原文、理解或技术…" value="${escapeHtml(query)}"></label><span id="prompt-note-count" role="status"></span></div>
        ${tags.length ? `<div class="prompt-tag-filters" aria-label="按涉及技术筛选"><span>涉及技术</span><button class="prompt-tag${!activeTag ? " is-active" : ""}" type="button" data-note-tag="" aria-pressed="${!activeTag}">全部</button>${tagButtons(tags, true)}</div>` : ""}
        <div id="prompt-note-results" class="prompt-note-results"></div>
        <footer class="prompt-local-note">笔记保存在此浏览器。导出备份后，可以在另一台设备导入。</footer>
        <input id="prompt-note-import" type="file" accept=".json,application/json" hidden />
      </div>`;
    renderResults();
    root.querySelector("#prompt-note-search").addEventListener("input", (event) => {
      query = event.target.value;
      renderResults();
    });
    root.querySelector("#prompt-note-import").addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        if (dirty) throw new Error("请先保存编辑中的笔记，再导入备份。");
        const result = importPromptNotes(state, text);
        query = "";
        activeTag = "";
        render();
        showToast(`已导入 ${result.added} 条，跳过 ${result.skipped} 条重复记录${result.conflicts ? `；${result.conflicts} 条冲突内容已另存，原笔记保留` : ""}`);
      } catch (error) {
        showToast(error.message);
      } finally { event.target.value = ""; }
    });
  }

  function renderDetail(note) {
    root.innerHTML = `
      <article class="prompt-notes-page prompt-note-detail">
        <button class="prompt-back" type="button" data-note-action="back">${icon("back")}返回笔记列表</button>
        <header class="prompt-page-heading"><div><h1 tabindex="-1">${escapeHtml(note.title)}</h1><p>更新于 ${dateLabel(note.updatedAt)} · 保存在此浏览器</p></div><div class="prompt-actions"><button class="primary-button" type="button" data-copy-note="${escapeHtml(note.id)}">${icon("copy")}复制提示词</button><button class="secondary-button" type="button" data-note-action="edit">${icon("edit")}编辑</button></div></header>
        ${note.tags.length ? `<div class="prompt-detail-tags"><span>涉及技术</span>${tagButtons(note.tags)}</div>` : ""}
        <section class="prompt-reading-section"><h2>提示词原文</h2><pre class="prompt-original">${escapeHtml(note.prompt)}</pre></section>
        <section class="prompt-reading-section prompt-understanding"><h2>我的理解</h2>${note.understanding.trim() ? `<div class="prompt-understanding-text">${linkedText(note.understanding)}</div>` : '<p class="prompt-unwritten">还没有写下理解。可以记一句关键要求为什么这样写，或涉及的技术负责什么。</p>'}</section>
      </article>`;
  }

  function renderEditor(note) {
    root.innerHTML = `
      <div class="prompt-notes-page prompt-note-editor">
        <button class="prompt-back" type="button" data-note-action="cancel">${icon("back")}${note ? "返回笔记" : "返回笔记列表"}</button>
        <header class="prompt-page-heading"><div><h1 tabindex="-1">${note ? "编辑笔记" : "新建笔记"}</h1><p>只需标题和原文，理解与技术标签可以后补。</p></div></header>
        <form id="prompt-note-form">
          <label for="prompt-title">标题 <span>必填</span></label><input id="prompt-title" name="title" required maxlength="180" placeholder="例如：从参考画生成水彩动画" value="${escapeHtml(note?.title || "")}" />
          <label for="prompt-original">提示词原文 <span>必填</span></label><textarea id="prompt-original" name="prompt" required rows="14" placeholder="粘贴完整提示词，保留原有换行。">${escapeHtml(note?.prompt || "")}</textarea>
          <label for="prompt-understanding">我的理解 <span>选填</span></label><textarea id="prompt-understanding" name="understanding" rows="6" placeholder="哪些要求起作用？为什么这样写？涉及的技术分别做什么？也可以记下官方文档链接。">${escapeHtml(note?.understanding || "")}</textarea>
          <label for="prompt-tags">涉及技术 <span>选填，用逗号分隔</span></label><input id="prompt-tags" name="tags" placeholder="p5.js, p5.brush" value="${escapeHtml(note?.tags.join(", ") || "")}" />
          <p id="prompt-form-error" class="prompt-form-error" role="alert" hidden></p>
          <div class="prompt-form-actions"><button class="primary-button" type="submit">保存笔记</button><button class="secondary-button" type="button" data-note-action="cancel">取消</button><span>保存到当前浏览器</span></div>
        </form>
      </div>`;
    const form = root.querySelector("#prompt-note-form");
    form.addEventListener("input", () => { dirty = true; });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        const fields = Object.fromEntries(new FormData(form));
        const saved = savePromptNote(state, fields, note?.id || null);
        selectedId = saved.id;
        dirty = false;
        editing = false;
        render();
        resetScroll();
        focusHeading();
        showToast("笔记已保存到此浏览器");
      } catch (error) {
        const message = root.querySelector("#prompt-form-error");
        message.textContent = error.message;
        message.hidden = false;
      }
    });
  }

  function render() {
    if (editing) renderEditor(current());
    else if (current()) renderDetail(current());
    else renderList();
  }

  async function copyNote(id) {
    const note = state.notes.find((item) => item.id === id);
    if (!note) return;
    try {
      await navigator.clipboard.writeText(note.prompt);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = note.prompt;
      textarea.className = "prompt-copy-helper";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      if (!copied) { showToast("复制失败，请选中原文后手动复制。"); return; }
    }
    showToast("已复制提示词原文");
  }

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button || !root.contains(button)) return;
    if (button.hasAttribute("data-copy-note")) { await copyNote(button.dataset.copyNote); return; }
    if (button.hasAttribute("data-open-note")) {
      selectedId = button.dataset.openNote;
      render(); resetScroll(); focusHeading(); return;
    }
    if (button.hasAttribute("data-note-tag")) {
      selectedId = null;
      activeTag = button.dataset.noteTag;
      render(); resetScroll(); return;
    }
    const action = button.dataset.noteAction;
    if (action === "new" || action === "edit") {
      if (state.readError) { showToast(state.error); return; }
      if (action === "new") selectedId = null;
      editing = true; dirty = false;
      render(); resetScroll();
      root.querySelector("#prompt-title").focus({ preventScroll: true });
    } else if (action === "back" || action === "cancel") {
      if (!canLeave()) return;
      if (action === "back" || !current()) selectedId = null;
      render(); resetScroll(); focusHeading();
    } else if (action === "clear") {
      query = ""; activeTag = ""; render();
    } else if (action === "import") {
      root.querySelector("#prompt-note-import").click();
    } else if (action === "export") {
      const text = exportPromptNotes(state);
      const blob = new Blob([text], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const today = new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      link.download = `提示词笔记-${today}${state.readError ? "-原始数据" : ""}.json`;
      document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("备份已导出");
    }
  });

  window.addEventListener("beforeunload", (event) => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
  render();
  return { canLeave };
}
