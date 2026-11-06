import {
  COLOR_ROLES,
  createColorPalettesState,
  deleteColorPalette,
  evaluatePaletteContrast,
  exportColorPalettes,
  filterColorPalettes,
  formatPaletteText,
  importColorPalettes,
  normalizeHex,
  saveColorPalette,
} from "./color-palettes-store.js?v=20261106";

const icons = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
  back: '<path d="m10 5-7 7 7 7M3 12h18"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  edit: '<path d="m15 4 5 5M4 20l1-6L16 3l5 5L10 19Z"/>',
  apply: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const escapeHtml = (text) => String(text ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

function linkedText(text) {
  return String(text).split(/(https?:\/\/[^\s<>]+)/g).map((part) => {
    if (!/^https?:\/\//.test(part)) return escapeHtml(part);
    const url = part.replace(/[。，、；）)]+$/, "");
    try { new URL(url); } catch { return escapeHtml(part); }
    return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>${escapeHtml(part.slice(url.length))}`;
  }).join("");
}

const dateLabel = (date) => new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(new Date(date));

function isExampleId(id) {
  return id === "warm-parchment-ink-example" || id === "fir-gray-ochre-example";
}

function defaultDraftColors(getCurrentDocumentColors) {
  const docColors = getCurrentDocumentColors?.();
  return {
    pageColor: normalizeHex(docColors?.pageColor) || "#FFFEFB",
    textColor: normalizeHex(docColors?.textColor) || "#262522",
    mutedColor: normalizeHex(docColors?.mutedColor) || "#716D66",
    accentColor: normalizeHex(docColors?.accentColor) || "#315F9E",
  };
}

function renderSpecimenCard(colors, title = "在日常选择中重新理解配色") {
  const c = {
    pageColor: normalizeHex(colors.pageColor) || "#FFFEFB",
    textColor: normalizeHex(colors.textColor) || "#262522",
    mutedColor: normalizeHex(colors.mutedColor) || "#716D66",
    accentColor: normalizeHex(colors.accentColor) || "#315F9E",
  };
  return `
    <div class="palette-specimen" style="--sp-page:${escapeHtml(c.pageColor)}; --sp-text:${escapeHtml(c.textColor)}; --sp-muted:${escapeHtml(c.mutedColor)}; --sp-accent:${escapeHtml(c.accentColor)}">
      <div class="palette-specimen__head">
        <span>COLOR SPECIMEN</span>
        <span>A4 · 样张预览</span>
      </div>
      <p class="palette-specimen__kicker">视觉层级与纸墨关系</p>
      <h3 class="palette-specimen__title">${escapeHtml(title)}</h3>
      <p class="palette-specimen__body">好的配色不只看孤立色卡，而是在纸张底色、正文浓度、次级信息与少量强调色之间建立稳定秩序。</p>
      <div class="palette-specimen__callout">
        <strong>关键重点</strong>
        <span>强调色控制在小面积内，既能引导视线，又不破坏整体阅读的安静感。</span>
      </div>
      <div class="palette-specimen__foot">
        <span>次级文字 · 页眉页脚与日期</span>
        <span>01</span>
      </div>
    </div>`;
}

function renderContrastPanel(colors) {
  const contrast = evaluatePaletteContrast(colors);
  return `
    <div class="palette-contrast-panel" aria-label="色彩对比度校验">
      <div class="palette-contrast-row ${contrast.text.passAA ? "is-pass" : "is-fail"}">
        <span>主要文字 / 纸张底色</span>
        <strong>${contrast.text.ratio}:1 · ${contrast.text.level}</strong>
      </div>
      <div class="palette-contrast-row ${contrast.muted.passLarge ? "is-pass" : "is-warn"}">
        <span>次级文字 / 纸张底色</span>
        <strong>${contrast.muted.ratio}:1 · ${contrast.muted.level}</strong>
      </div>
      <div class="palette-contrast-row ${contrast.accent.passLarge ? "is-pass" : "is-warn"}">
        <span>强调色 / 纸张底色</span>
        <strong>${contrast.accent.ratio}:1 · ${contrast.accent.level}</strong>
      </div>
    </div>`;
}

export function initColorPalettes(root, { showToast, getCurrentDocumentColors, onApplyToDocument }) {
  const state = createColorPalettesState();
  let selectedId = null;
  let editing = false;
  let dirty = false;
  let query = "";
  let activeTag = "";
  let draftFields = null;

  function current() {
    return state.palettes.find((item) => item.id === selectedId);
  }
  function resetScroll() {
    root.scrollTop = 0;
  }
  function focusHeading() {
    root.querySelector("h1")?.focus({ preventScroll: true });
  }

  function canLeave() {
    if (dirty && !window.confirm("当前配色修改还未保存，确定放弃修改？")) return false;
    if (editing) {
      editing = false;
      dirty = false;
      draftFields = null;
      render();
    }
    return true;
  }

  function openDraftWithColors(colors, meta = {}) {
    if (!canLeave()) return false;
    if (state.readError) {
      showToast(state.error);
      return false;
    }
    selectedId = null;
    editing = true;
    dirty = false;
    draftFields = {
      title: meta.title || "",
      notes: meta.notes || "",
      tags: Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []),
      colors: {
        ...defaultDraftColors(getCurrentDocumentColors),
        ...Object.fromEntries(
          Object.entries(colors || {}).map(([k, v]) => [k, normalizeHex(v)]).filter(([, v]) => Boolean(v)),
        ),
      },
    };
    render();
    resetScroll();
    root.querySelector("#palette-title")?.focus({ preventScroll: true });
    return true;
  }

  function tagButtons(tags, filter = false) {
    return tags.map((tag) => {
      const isActive = activeTag.toLowerCase() === tag.toLowerCase();
      return `<button class="palette-tag${isActive ? " is-active" : ""}" type="button" data-palette-tag="${escapeHtml(tag)}" ${filter ? `aria-pressed="${isActive}"` : `aria-label="查找标签：${escapeHtml(tag)}"`}>${escapeHtml(tag)}</button>`;
    }).join("");
  }

  function renderResults() {
    const list = filterColorPalettes(state.palettes, query, activeTag);
    root.querySelector("#color-palette-count").textContent = query || activeTag ? `找到 ${list.length} 组配色` : `${list.length} 组配色`;
    root.querySelector("#color-palette-results").innerHTML = list.length ? list.map((palette) => {
      const contrast = evaluatePaletteContrast(palette.colors);
      return `
        <article class="palette-row">
          <div class="palette-row__main">
            <div class="palette-row__header">
              <button class="palette-open" type="button" data-open-palette="${escapeHtml(palette.id)}">
                <h2>${escapeHtml(palette.title)}</h2>
              </button>
              <span class="palette-contrast-badge ${contrast.text.passAA ? "is-pass" : "is-fail"}">
                正文 ${contrast.text.ratio}:1 · ${contrast.text.level}
              </span>
            </div>
            <div class="palette-strip-group" aria-label="四色比例与色值">
              ${COLOR_ROLES.map((role) => {
                const hex = palette.colors[role.id];
                return `
                  <span class="palette-role-pill">
                    <i class="palette-role-dot" style="background:${escapeHtml(hex)}"></i>
                    <small>${escapeHtml(role.label)}</small>
                    <code>${escapeHtml(hex)}</code>
                  </span>`;
              }).join("")}
            </div>
            ${palette.notes.trim() ? `<p class="palette-row__notes">${escapeHtml(palette.notes.replace(/\s+/g, " ").slice(0, 140))}</p>` : ""}
            <div class="palette-row__meta">
              ${tagButtons(palette.tags)}
              <time datetime="${escapeHtml(palette.updatedAt)}">${dateLabel(palette.updatedAt)}</time>
              ${isExampleId(palette.id) ? '<span class="palette-example-badge">可编辑的起始示例</span>' : ""}
            </div>
          </div>
          <div class="palette-row__aside">
            <div class="palette-mini-specimen" style="--sp-page:${escapeHtml(palette.colors.pageColor)}; --sp-text:${escapeHtml(palette.colors.textColor)}; --sp-muted:${escapeHtml(palette.colors.mutedColor)}; --sp-accent:${escapeHtml(palette.colors.accentColor)}" aria-hidden="true">
              <span>SPECIMEN</span>
              <strong>标题与正文层级</strong>
              <small>辅助说明与边注</small>
              <i></i>
            </div>
            <div class="palette-row__actions">
              <button class="primary-button compact" type="button" data-apply-palette="${escapeHtml(palette.id)}" aria-label="应用到当前文档：${escapeHtml(palette.title)}">应用到文档</button>
              <button class="secondary-button" type="button" data-copy-palette="${escapeHtml(palette.id)}" aria-label="复制 CSS 变量：${escapeHtml(palette.title)}">${icon("copy")}<span>复制</span></button>
            </div>
          </div>
        </article>`;
    }).join("") : `
      <div class="palette-empty">
        <h2>${state.palettes.length ? "没有找到匹配的配色" : "保存你的第一组配色尝试"}</h2>
        <p>${state.palettes.length ? "换个关键词、色值，或清除标签筛选再试试。" : "记录纸张、文字与强调色的搭配关系，并随时应用到真实文档中检验。"}</p>
        <button class="secondary-button" type="button" data-palette-action="${state.palettes.length ? "clear" : "new"}">${state.palettes.length ? "清除筛选" : "新建配色"}</button>
      </div>`;
  }

  function renderList() {
    const tags = [...new Set(state.palettes.flatMap((item) => item.tags))].sort((a, b) => a.localeCompare(b));
    root.innerHTML = `
      <div class="color-palettes-page">
        <header class="palette-page-heading">
          <div>
            <h1 tabindex="-1">配色积累</h1>
            <p>记录纸张底色、主次文字与强调色的搭配尝试，记下心得并一键应用到文档工作台。</p>
          </div>
          <div class="palette-actions">
            <button class="secondary-button" type="button" data-palette-action="import">导入</button>
            <button class="secondary-button" type="button" data-palette-action="export">导出备份</button>
            <button class="primary-button" type="button" data-palette-action="new">${icon("plus")}新建配色</button>
          </div>
        </header>
        ${state.error ? `<p class="palette-storage-error" role="alert">${escapeHtml(state.error)}</p>` : ""}
        <div class="palette-searchbar">
          <label class="palette-search">
            ${icon("search")}
            <input id="color-palette-search" type="search" aria-label="搜索配色积累" placeholder="搜索名称、色值（如 #315F9E）、搭配心得或标签…" value="${escapeHtml(query)}">
          </label>
          <span id="color-palette-count" role="status"></span>
        </div>
        ${tags.length ? `
          <div class="palette-tag-filters" aria-label="按场景标签筛选">
            <span>场景标签</span>
            <button class="palette-tag${!activeTag ? " is-active" : ""}" type="button" data-palette-tag="" aria-pressed="${!activeTag}">全部</button>
            ${tagButtons(tags, true)}
          </div>` : ""}
        <div id="color-palette-results" class="palette-results"></div>
        <footer class="palette-local-note">配色记录保存在此浏览器。导出 JSON 备份后，可以在另一台设备合并导入。</footer>
        <input id="color-palette-import" type="file" accept=".json,application/json" hidden />
      </div>`;
    renderResults();
    root.querySelector("#color-palette-search").addEventListener("input", (event) => {
      query = event.target.value;
      renderResults();
    });
    root.querySelector("#color-palette-import").addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        if (dirty) throw new Error("请先保存编辑中的配色，再导入备份。");
        const result = importColorPalettes(state, text);
        query = "";
        activeTag = "";
        render();
        showToast(`已导入 ${result.added} 组，跳过 ${result.skipped} 组重复记录${result.conflicts ? `；${result.conflicts} 组冲突内容已另存` : ""}`);
      } catch (error) {
        showToast(error.message);
      } finally {
        event.target.value = "";
      }
    });
  }

  function renderDetail(palette) {
    root.innerHTML = `
      <article class="color-palettes-page palette-detail">
        <button class="palette-back" type="button" data-palette-action="back">${icon("back")}返回配色列表</button>
        <header class="palette-page-heading">
          <div>
            <h1 tabindex="-1">${escapeHtml(palette.title)}</h1>
            <p>更新于 ${dateLabel(palette.updatedAt)} · 保存在此浏览器</p>
          </div>
          <div class="palette-actions">
            <button class="primary-button" type="button" data-apply-palette="${escapeHtml(palette.id)}">${icon("apply")}应用到当前文档</button>
            <button class="secondary-button" type="button" data-copy-palette="${escapeHtml(palette.id)}">${icon("copy")}复制 CSS 变量</button>
            <button class="secondary-button" type="button" data-palette-action="edit">${icon("edit")}编辑</button>
            <button class="secondary-button palette-delete-button" type="button" data-palette-action="delete">删除</button>
          </div>
        </header>
        ${palette.tags.length ? `<div class="palette-detail-tags"><span>场景标签</span>${tagButtons(palette.tags)}</div>` : ""}
        <div class="palette-detail-grid">
          <section class="palette-roles-section" aria-label="四角色语义色值">
            <h2>四角色语义色板</h2>
            <div class="palette-role-cards">
              ${COLOR_ROLES.map((role) => {
                const hex = palette.colors[role.id];
                return `
                  <div class="palette-role-card">
                    <div class="palette-role-card__swatch" style="background:${escapeHtml(hex)}"></div>
                    <div class="palette-role-card__body">
                      <div>
                        <strong>${escapeHtml(role.label)}</strong>
                        <small>${escapeHtml(role.description)}</small>
                      </div>
                      <button class="secondary-button palette-hex-copy" type="button" data-copy-hex="${escapeHtml(hex)}" aria-label="复制${escapeHtml(role.label)}色值 ${escapeHtml(hex)}">
                        <code>${escapeHtml(hex)}</code>
                      </button>
                    </div>
                  </div>`;
              }).join("")}
            </div>
          </section>
          <section class="palette-preview-section" aria-label="真实样张与对比度">
            <h2>样张预览与对比度刻度</h2>
            ${renderSpecimenCard(palette.colors, palette.title)}
            ${renderContrastPanel(palette.colors)}
          </section>
        </div>
        <section class="palette-notes-section">
          <h2>搭配心得与尝试记录</h2>
          ${palette.notes.trim()
            ? `<div class="palette-notes-text">${linkedText(palette.notes)}</div>`
            : '<p class="palette-unwritten">还没有写下搭配心得。可以记下纸张冷暖、正文与次级文字的灰度梯度，或强调色的使用边界。</p>'}
        </section>
      </article>`;
  }

  function renderEditor(palette) {
    const initial = palette || draftFields || {
      title: "",
      notes: "",
      tags: [],
      colors: defaultDraftColors(getCurrentDocumentColors),
    };
    const colors = { ...defaultDraftColors(getCurrentDocumentColors), ...(initial.colors || {}) };

    root.innerHTML = `
      <div class="color-palettes-page palette-editor">
        <button class="palette-back" type="button" data-palette-action="cancel">${icon("back")}${palette ? "返回配色详情" : "返回配色列表"}</button>
        <header class="palette-page-heading">
          <div>
            <h1 tabindex="-1">${palette ? "编辑配色" : "新建配色"}</h1>
            <p>调整四个语义角色颜色，右侧实时检视样张效果与对比度。</p>
          </div>
          <div class="palette-actions">
            <button class="secondary-button" type="button" data-palette-action="fill-from-doc">填入当前文档配色</button>
          </div>
        </header>
        <div class="palette-editor-layout">
          <form id="color-palette-form" class="palette-form">
            <label for="palette-title">配色名称 <span>必填</span></label>
            <input id="palette-title" name="title" required maxlength="120" placeholder="例如：暖羊皮纸与深油墨蓝" value="${escapeHtml(initial.title || "")}" />

            <fieldset class="palette-color-fieldset">
              <legend>四角色色值 <span>点击色块选色或输入 #RRGGBB</span></legend>
              <div class="palette-color-inputs">
                ${COLOR_ROLES.map((role) => {
                  const hex = colors[role.id];
                  return `
                    <div class="palette-color-field" data-role-field="${role.id}">
                      <div class="palette-color-field__meta">
                        <strong>${escapeHtml(role.label)}</strong>
                        <small>${escapeHtml(role.description)}</small>
                      </div>
                      <div class="color-control">
                        <label class="color-swatch" style="--swatch:${escapeHtml(hex)}">
                          <input type="color" value="${escapeHtml(hex.toLowerCase())}" data-color-picker="${role.id}" aria-label="${escapeHtml(role.label)}取色器" />
                        </label>
                        <input class="color-value" type="text" name="${role.id}" value="${escapeHtml(hex)}" maxlength="7" required data-color-hex="${role.id}" aria-label="${escapeHtml(role.label)}十六进制色值" />
                      </div>
                    </div>`;
                }).join("")}
              </div>
            </fieldset>

            <label for="palette-tags">场景/气质标签 <span>选填，用逗号分隔</span></label>
            <input id="palette-tags" name="tags" placeholder="长文档, 暖纸, 冷暖对比" value="${escapeHtml((initial.tags || []).join(", "))}" />

            <label for="palette-notes">搭配心得与复盘 <span>选填</span></label>
            <textarea id="palette-notes" name="notes" rows="6" placeholder="为什么这样搭配？纸张与正文的冷暖关系如何？哪个颜色需要注意面积控制？">${escapeHtml(initial.notes || "")}</textarea>

            <p id="palette-form-error" class="palette-form-error" role="alert" hidden></p>
            <div class="palette-form-actions">
              <button class="primary-button" type="submit">保存配色</button>
              <button class="secondary-button" type="button" data-palette-action="cancel">取消</button>
              <span>保存到当前浏览器</span>
            </div>
          </form>

          <aside class="palette-live-preview" aria-label="实时配色样张预览">
            <h2>实时样张与对比度</h2>
            <div id="palette-editor-specimen">${renderSpecimenCard(colors, initial.title || "在日常选择中重新理解配色")}</div>
            <div id="palette-editor-contrast">${renderContrastPanel(colors)}</div>
          </aside>
        </div>
      </div>`;

    const form = root.querySelector("#color-palette-form");
    const titleInput = root.querySelector("#palette-title");

    function currentEditorColors() {
      const next = {};
      COLOR_ROLES.forEach((role) => {
        const textInput = form.querySelector(`[data-color-hex="${role.id}"]`);
        const picker = form.querySelector(`[data-color-picker="${role.id}"]`);
        next[role.id] = normalizeHex(textInput?.value) || normalizeHex(picker?.value) || role.default;
      });
      return next;
    }

    function refreshLivePreview() {
      const liveColors = currentEditorColors();
      const liveTitle = titleInput.value.trim() || "在日常选择中重新理解配色";
      root.querySelector("#palette-editor-specimen").innerHTML = renderSpecimenCard(liveColors, liveTitle);
      root.querySelector("#palette-editor-contrast").innerHTML = renderContrastPanel(liveColors);
    }

    form.querySelectorAll("[data-color-picker]").forEach((picker) => {
      picker.addEventListener("input", () => {
        dirty = true;
        const roleId = picker.dataset.colorPicker;
        const hex = normalizeHex(picker.value);
        if (!hex) return;
        const textInput = form.querySelector(`[data-color-hex="${roleId}"]`);
        if (textInput) textInput.value = hex;
        picker.closest(".color-swatch")?.style.setProperty("--swatch", hex);
        refreshLivePreview();
      });
    });

    form.querySelectorAll("[data-color-hex]").forEach((textInput) => {
      textInput.addEventListener("input", () => {
        dirty = true;
        const roleId = textInput.dataset.colorHex;
        const hex = normalizeHex(textInput.value);
        if (!hex) return;
        const picker = form.querySelector(`[data-color-picker="${roleId}"]`);
        if (picker) {
          picker.value = hex.toLowerCase();
          picker.closest(".color-swatch")?.style.setProperty("--swatch", hex);
        }
        refreshLivePreview();
      });
    });

    titleInput.addEventListener("input", () => {
      dirty = true;
      refreshLivePreview();
    });

    form.addEventListener("input", () => {
      dirty = true;
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      try {
        const formData = Object.fromEntries(new FormData(form));
        const saved = saveColorPalette(state, formData, palette?.id || null);
        selectedId = saved.id;
        dirty = false;
        editing = false;
        draftFields = null;
        render();
        resetScroll();
        focusHeading();
        showToast("配色已保存到此浏览器");
      } catch (error) {
        const message = root.querySelector("#palette-form-error");
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

  async function writeClipboard(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.className = "palette-copy-helper";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      if (!copied) {
        showToast("复制失败，请手动选中复制。");
        return;
      }
    }
    showToast(successMessage);
  }

  root.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button || !root.contains(button)) return;

    if (button.hasAttribute("data-copy-palette")) {
      const palette = state.palettes.find((item) => item.id === button.dataset.copyPalette);
      if (palette) await writeClipboard(formatPaletteText(palette), "已复制 CSS 配色变量");
      return;
    }

    if (button.hasAttribute("data-copy-hex")) {
      const hex = button.dataset.copyHex;
      if (hex) await writeClipboard(hex, `已复制色值 ${hex}`);
      return;
    }

    if (button.hasAttribute("data-apply-palette")) {
      const palette = state.palettes.find((item) => item.id === button.dataset.applyPalette);
      if (palette && onApplyToDocument) {
        onApplyToDocument(palette.colors, palette.title);
      }
      return;
    }

    if (button.hasAttribute("data-open-palette")) {
      selectedId = button.dataset.openPalette;
      render();
      resetScroll();
      focusHeading();
      return;
    }

    if (button.hasAttribute("data-palette-tag")) {
      selectedId = null;
      activeTag = button.dataset.paletteTag;
      render();
      resetScroll();
      return;
    }

    const action = button.dataset.paletteAction;
    if (action === "new" || action === "edit") {
      if (state.readError) {
        showToast(state.error);
        return;
      }
      if (action === "new") {
        selectedId = null;
        draftFields = null;
      }
      editing = true;
      dirty = false;
      render();
      resetScroll();
      root.querySelector("#palette-title")?.focus({ preventScroll: true });
    } else if (action === "fill-from-doc") {
      const docColors = defaultDraftColors(getCurrentDocumentColors);
      const form = root.querySelector("#color-palette-form");
      if (!form) return;
      COLOR_ROLES.forEach((role) => {
        const hex = docColors[role.id];
        const hexInput = form.querySelector(`[data-color-hex="${role.id}"]`);
        const picker = form.querySelector(`[data-color-picker="${role.id}"]`);
        if (hexInput) hexInput.value = hex;
        if (picker) {
          picker.value = hex.toLowerCase();
          picker.closest(".color-swatch")?.style.setProperty("--swatch", hex);
        }
      });
      dirty = true;
      const titleVal = form.querySelector("#palette-title")?.value.trim() || "在日常选择中重新理解配色";
      root.querySelector("#palette-editor-specimen").innerHTML = renderSpecimenCard(docColors, titleVal);
      root.querySelector("#palette-editor-contrast").innerHTML = renderContrastPanel(docColors);
      showToast("已填入当前文档的四色配置");
    } else if (action === "delete") {
      const target = current();
      if (!target) return;
      if (!window.confirm(`确定删除配色「${target.title}」吗？`)) return;
      try {
        deleteColorPalette(state, target.id);
        selectedId = null;
        render();
        resetScroll();
        focusHeading();
        showToast("已删除该配色方案");
      } catch (error) {
        showToast(error.message);
      }
    } else if (action === "back" || action === "cancel") {
      if (!canLeave()) return;
      if (action === "back" || !current()) selectedId = null;
      draftFields = null;
      render();
      resetScroll();
      focusHeading();
    } else if (action === "clear") {
      query = "";
      activeTag = "";
      render();
    } else if (action === "import") {
      root.querySelector("#color-palette-import")?.click();
    } else if (action === "export") {
      const text = exportColorPalettes(state);
      const blob = new Blob([text], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const today = new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      link.download = `配色积累-${today}${state.readError ? "-原始数据" : ""}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("配色备份已导出");
    }
  });

  window.addEventListener("beforeunload", (event) => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  render();
  return { canLeave, openDraftWithColors };
}
