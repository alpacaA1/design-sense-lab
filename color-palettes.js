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
} from "./color-palettes-store.js?v=20261106c";
import {
  extractPaletteFromImageData,
  samplePixelHex,
} from "./screenshot-analyzer.js?v=20261106c";
import {
  createDemoSiteReport,
  getBookmarkletHref,
  getConsoleExtractorScript,
  parseSiteStyleInput,
} from "./site-extractor.js?v=20261106c";

const icons = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
  back: '<path d="m10 5-7 7 7 7M3 12h18"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  edit: '<path d="m15 4 5 5M4 20l1-6L16 3l5 5L10 19Z"/>',
  apply: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="m21 15-5-5L5 20"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18"/>',
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

function loadFileToImageData(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxDim = 960;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
      const width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
      const height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/png");
      URL.revokeObjectURL(url);
      resolve({ imageData, dataUrl, width, height, fileName: file.name || "截图" });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("截图读取失败，请上传 PNG、JPG 或 WebP 图片。"));
    };
    img.src = url;
  });
}

export function initColorPalettes(
  root,
  { showToast, getCurrentDocumentColors, onApplyToDocument, onCreateSiteTemplate, onApplySiteComponent },
) {
  const state = createColorPalettesState();
  let selectedId = null;
  let editing = false;
  let siteExtractorMode = false;
  let siteReport = parseSiteStyleInput(JSON.stringify(createDemoSiteReport()));
  let siteRawInput = "";
  let dirty = false;
  let query = "";
  let activeTag = "";
  let draftFields = null;
  let screenshotContext = null; // { imageData, dataUrl, swatches, activeRole }

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
    if (editing || siteExtractorMode) {
      editing = false;
      siteExtractorMode = false;
      dirty = false;
      draftFields = null;
      screenshotContext = null;
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
    siteExtractorMode = false;
    editing = true;
    dirty = false;
    screenshotContext = meta.screenshotContext || null;
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

  async function processScreenshotFile(file) {
    try {
      const loaded = await loadFileToImageData(file);
      const extracted = extractPaletteFromImageData(loaded.imageData, 8);
      const cleanName = loaded.fileName.replace(/\.[a-z0-9]+$/i, "");
      screenshotContext = {
        imageData: loaded.imageData,
        dataUrl: loaded.dataUrl,
        swatches: extracted.swatches,
        activeRole: "accentColor",
      };
      if (!editing) {
        selectedId = null;
        editing = true;
        dirty = true;
        draftFields = {
          title: cleanName && cleanName !== "image" ? `${cleanName} · 截图配色` : "软件截图提取配色",
          notes: `从截图自动提取的四角色配色（主色块占比：${extracted.swatches.slice(0, 4).map((s) => `${s.hex} ${s.share}%`).join("、")}）。`,
          tags: ["截图提取"],
          colors: extracted.roles,
        };
        render();
        resetScroll();
      } else {
        // Update current editor form inputs
        const form = root.querySelector("#color-palette-form");
        if (form) {
          const currentTitle = form.querySelector("#palette-title")?.value || "";
          const currentNotes = form.querySelector("#palette-notes")?.value || "";
          const currentTags = form.querySelector("#palette-tags")?.value || "";
          draftFields = {
            title: currentTitle || (cleanName && cleanName !== "image" ? `${cleanName} · 截图配色` : "软件截图提取配色"),
            notes: currentNotes || `从截图自动提取的四角色配色（主色块占比：${extracted.swatches.slice(0, 4).map((s) => `${s.hex} ${s.share}%`).join("、")}）。`,
            tags: currentTags ? currentTags.split(/[,，、]+/).map((s) => s.trim()).filter(Boolean) : ["截图提取"],
            colors: extracted.roles,
          };
          dirty = true;
          render();
        }
      }
      showToast("已从截图自动识别四角色配色，可点击画面或色块微调");
    } catch (error) {
      showToast(error.message);
    }
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
            <p>记录纸张底色、主次文字与强调色的搭配尝试，支持上传或粘贴软件截图自动提取配色。</p>
          </div>
          <div class="palette-actions">
            <button class="secondary-button" type="button" data-palette-action="site-extractor">${icon("globe")}拆解网站样式</button>
            <button class="secondary-button" type="button" data-palette-action="upload-screenshot">${icon("image")}从截图识别配色</button>
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
        <footer class="palette-local-note">配色记录保存在此浏览器。也可直接按 Ctrl/Cmd + V 粘贴软件截图自动识别配色。</footer>
        <input id="color-palette-import" type="file" accept=".json,application/json" hidden />
        <input id="color-palette-screenshot" type="file" accept="image/*" hidden />
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
    root.querySelector("#color-palette-screenshot").addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        await processScreenshotFile(file);
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

  function renderScreenshotExtractorBox() {
    if (!screenshotContext) return "";
    const activeRole = screenshotContext.activeRole || "accentColor";
    return `
      <section class="palette-screenshot-box" aria-label="截图取色与候选色板">
        <header class="palette-screenshot-box__head">
          <div>
            <strong>截图色彩拆解与吸管</strong>
            <span>点击下方截图任意位置或右侧候选色块，可将颜色赋给所选角色。</span>
          </div>
          <div class="palette-role-target-tabs" role="group" aria-label="吸管赋值目标角色">
            ${COLOR_ROLES.map((role) => `
              <button type="button" class="palette-target-chip ${activeRole === role.id ? "is-active" : ""}" data-pick-role="${role.id}" aria-pressed="${activeRole === role.id}">
                吸取到：${escapeHtml(role.label)}
              </button>`).join("")}
          </div>
        </header>
        <div class="palette-screenshot-box__body">
          <div class="palette-screenshot-stage">
            <img id="palette-screenshot-img" src="${screenshotContext.dataUrl}" alt="待取色的软件截图" />
          </div>
          <div class="palette-extracted-swatches">
            <span>识别出的主色块（点击赋给当前选中角色）</span>
            <div class="palette-swatch-grid">
              ${screenshotContext.swatches.map((s) => `
                <button type="button" class="palette-extracted-chip" data-Assign-swatch="${escapeHtml(s.hex)}">
                  <i style="background:${escapeHtml(s.hex)}"></i>
                  <code>${escapeHtml(s.hex)}</code>
                  <small>${s.share}%</small>
                </button>`).join("")}
            </div>
          </div>
        </div>
      </section>`;
  }

  function renderEditor(palette) {
    const initial = draftFields || palette || {
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
            <p>调整四个语义角色颜色，或上传/粘贴软件截图自动识别配色。</p>
          </div>
          <div class="palette-actions">
            <button class="secondary-button" type="button" data-palette-action="upload-screenshot">${icon("image")}从截图识别配色</button>
            <button class="secondary-button" type="button" data-palette-action="fill-from-doc">填入当前文档配色</button>
          </div>
        </header>
        ${renderScreenshotExtractorBox()}
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
        <input id="color-palette-screenshot" type="file" accept="image/*" hidden />
      </div>`;

    const form = root.querySelector("#color-palette-form");
    const titleInput = root.querySelector("#palette-title");

    function setRoleHex(roleId, rawHex) {
      const hex = normalizeHex(rawHex);
      if (!hex || !form) return;
      const textInput = form.querySelector(`[data-color-hex="${roleId}"]`);
      const picker = form.querySelector(`[data-color-picker="${roleId}"]`);
      if (textInput) textInput.value = hex;
      if (picker) {
        picker.value = hex.toLowerCase();
        picker.closest(".color-swatch")?.style.setProperty("--swatch", hex);
      }
      dirty = true;
      refreshLivePreview();
    }

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

    root.querySelector("#color-palette-screenshot")?.addEventListener("change", async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        await processScreenshotFile(file);
      } finally {
        event.target.value = "";
      }
    });

    const screenshotImg = root.querySelector("#palette-screenshot-img");
    screenshotImg?.addEventListener("click", (event) => {
      if (!screenshotContext?.imageData) return;
      const rect = screenshotImg.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * screenshotContext.imageData.width;
      const y = ((event.clientY - rect.top) / Math.max(1, rect.height)) * screenshotContext.imageData.height;
      const pickedHex = samplePixelHex(screenshotContext.imageData, x, y);
      const roleId = screenshotContext.activeRole || "accentColor";
      const roleLabel = COLOR_ROLES.find((r) => r.id === roleId)?.label || roleId;
      setRoleHex(roleId, pickedHex);
      showToast(`已吸取 ${pickedHex} 到「${roleLabel}」`);
    });

    root.querySelectorAll("[data-pick-role]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!screenshotContext) return;
        screenshotContext.activeRole = btn.dataset.pickRole;
        root.querySelectorAll("[data-pick-role]").forEach((item) => {
          const active = item === btn;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", String(active));
        });
      });
    });

    root.querySelectorAll("[data-assign-swatch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const hex = btn.dataset.assignSwatch;
        const roleId = screenshotContext?.activeRole || "accentColor";
        const roleLabel = COLOR_ROLES.find((r) => r.id === roleId)?.label || roleId;
        setRoleHex(roleId, hex);
        showToast(`已将 ${hex} 设为「${roleLabel}」`);
      });
    });

    form.querySelectorAll("[data-color-picker]").forEach((picker) => {
      picker.addEventListener("input", () => {
        setRoleHex(picker.dataset.colorPicker, picker.value);
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
        screenshotContext = null;
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

  function renderSiteExtractor() {
    const r = siteReport;
    root.innerHTML = `
      <div class="color-palettes-page site-extractor-page">
        <button class="palette-back" type="button" data-palette-action="back">${icon("back")}返回配色列表</button>
        <header class="palette-page-heading">
          <div>
            <h1 tabindex="-1">拆解网站配色与样式</h1>
            <p>由于浏览器跨域安全限制，无需后端代理，用书签小工具或控制台脚本即可读取任意网站真实渲染的 getComputedStyle 配色、字阶与组件尺寸。</p>
          </div>
          <div class="palette-actions">
            <a class="secondary-button site-bookmarklet-link" href="${getBookmarkletHref()}" data-bookmarklet-link>拖到书签栏：拆解当前网站</a>
            <button class="secondary-button" type="button" data-site-action="copy-script">${icon("copy")}复制控制台提取脚本</button>
            <button class="secondary-button" type="button" data-site-action="load-demo">加载示例站点数据</button>
          </div>
        </header>

        <div class="site-extractor-layout">
          <section class="site-extractor-input-card" aria-label="粘贴网站拆解数据或 CSS 变量">
            <div class="site-extractor-step-head">
              <strong>第一步 · 粘贴提取到的 JSON 或网站 CSS 变量</strong>
              <span>支持粘贴上方脚本自动复制的 JSON，或直接从开发者工具复制 <code>:root { --bg: ... }</code> 样式代码。</span>
            </div>
            <textarea id="site-extractor-input" rows="7" placeholder="在此粘贴从目标网站提取的 JSON，或直接粘贴包含 #RRGGBB / rgb() / font-size / border-radius 的 CSS 代码…">${escapeHtml(siteRawInput)}</textarea>
            <p id="site-extractor-error" class="palette-form-error" role="alert" hidden></p>
            <div class="site-extractor-input-actions">
              <button class="primary-button compact" type="button" data-site-action="parse">解析网站样式</button>
              <span>已在下方展示「${escapeHtml(r.site.title)}」的拆解结果</span>
            </div>
          </section>

          <section class="site-extractor-report" aria-label="网站样式拆解报告">
            <header class="site-report-head">
              <div>
                <span class="site-report-kicker">WEBSITE STYLE REPORT · ${escapeHtml(r.site.hostname)}</span>
                <h2>${escapeHtml(r.site.title)}</h2>
              </div>
              <div class="site-report-actions">
                <button class="secondary-button" type="button" data-site-action="save-palette">存入配色积累</button>
                <button class="primary-button compact" type="button" data-site-action="save-doc-template">${icon("apply")}生成并应用文档模版</button>
              </div>
            </header>

            <div class="site-report-grid">
              <div class="site-report-block">
                <h3>1. 四角色语义配色</h3>
                <div class="palette-strip-group">
                  ${COLOR_ROLES.map((role) => {
                    const hex = r.colors[role.id];
                    return `
                      <span class="palette-role-pill">
                        <i class="palette-role-dot" style="background:${escapeHtml(hex)}"></i>
                        <small>${escapeHtml(role.label)}</small>
                        <code>${escapeHtml(hex)}</code>
                      </span>`;
                  }).join("")}
                </div>
                ${renderSpecimenCard(r.colors, r.site.title)}
                ${renderContrastPanel(r.colors)}
              </div>

              <div class="site-report-block">
                <h3>2. 排版与字阶关系 (Typography Scale)</h3>
                <dl class="site-metric-list">
                  <div><dt>主标题 (H1)</dt><dd>${r.typography.titleSize}px · 字重 ${escapeHtml(r.typography.titleWeight)}</dd></div>
                  <div><dt>小节标题 (H2)</dt><dd>${r.typography.sectionTitleSize}px · 比例 ${r.typography.sectionScaleRatio}×</dd></div>
                  <div><dt>正文与行高</dt><dd>${r.typography.bodySize}px / 行高 ${r.typography.lineHeight}</dd></div>
                  <div><dt>标题/正文字阶比</dt><dd>${r.typography.typeScaleRatio}× · 段距 ${r.typography.paragraphGap}px</dd></div>
                  <div><dt>字体栈</dt><dd class="site-font-stack">${escapeHtml(r.typography.fontFamilyStack || "系统默认字体")}</dd></div>
                </dl>

                <h3>3. 核心组件尺寸与圆角 (Component Specs)</h3>
                <div class="site-component-cards">
                  <div class="site-comp-card">
                    <div>
                      <strong>按钮 Button</strong>
                      <span>高 ${r.components.button.height}px · 水平内边距 ${r.components.button.paddingX}px · 字号 ${r.components.button.fontSize}px · 圆角 ${r.components.button.radius}px</span>
                    </div>
                    <button class="secondary-button" type="button" data-site-action="apply-component" data-comp-type="button">送入组件沙盒</button>
                  </div>
                  <div class="site-comp-card">
                    <div>
                      <strong>输入框 Input</strong>
                      <span>高 ${r.components.input.height}px · 内边距 ${r.components.input.paddingX}px · 圆角 ${r.components.input.radius}px · 边框 ${r.components.input.border}px</span>
                    </div>
                    <button class="secondary-button" type="button" data-site-action="apply-component" data-comp-type="input">送入组件沙盒</button>
                  </div>
                  <div class="site-comp-card">
                    <div>
                      <strong>卡片 Card</strong>
                      <span>宽 ${r.components.card.width}px · 内边距 ${r.components.card.padding}px · 标题 ${r.components.card.titleSize}px · 圆角 ${r.components.card.radius}px</span>
                    </div>
                    <button class="secondary-button" type="button" data-site-action="apply-component" data-comp-type="card">送入组件沙盒</button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>`;

    root.querySelector("[data-bookmarklet-link]")?.addEventListener("click", (event) => {
      event.preventDefault();
      showToast("请将此按钮拖拽到浏览器书签栏，在目标网页点击书签即可一键提取；或点击右侧复制控制台脚本");
    });
  }

  function render() {
    if (siteExtractorMode) renderSiteExtractor();
    else if (editing) renderEditor(current());
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

    const siteAction = button.dataset.siteAction;
    if (siteAction === "copy-script") {
      await writeClipboard(getConsoleExtractorScript(), "已复制控制台提取脚本，可在目标网页按 F12 粘贴到 Console 运行");
      return;
    }
    if (siteAction === "load-demo") {
      const demo = createDemoSiteReport();
      siteRawInput = JSON.stringify(demo, null, 2);
      siteReport = parseSiteStyleInput(siteRawInput);
      render();
      showToast("已加载示例站点拆解数据");
      return;
    }
    if (siteAction === "parse") {
      const inputEl = root.querySelector("#site-extractor-input");
      const errEl = root.querySelector("#site-extractor-error");
      siteRawInput = inputEl?.value || "";
      try {
        siteReport = parseSiteStyleInput(siteRawInput);
        render();
        showToast(`已解析「${siteReport.site.title}」的配色、字阶与组件尺寸`);
      } catch (error) {
        if (errEl) {
          errEl.textContent = error.message;
          errEl.hidden = false;
        } else {
          showToast(error.message);
        }
      }
      return;
    }
    if (siteAction === "save-palette") {
      const r = siteReport;
      siteExtractorMode = false;
      openDraftWithColors(r.colors, {
        title: `${r.site.title} · 网站配色`,
        tags: ["网站拆解", r.site.hostname].filter(Boolean),
        notes: [
          r.site.url ? `来源网址：${r.site.url}` : "",
          `排版字阶：H1 ${r.typography.titleSize}px / H2 ${r.typography.sectionTitleSize}px / 正文 ${r.typography.bodySize}px（行高 ${r.typography.lineHeight}，字阶比 ${r.typography.typeScaleRatio}×）`,
          `组件规范：按钮高 ${r.components.button.height}px、内边距 ${r.components.button.paddingX}px、圆角 ${r.components.button.radius}px；卡片内边距 ${r.components.card.padding}px、圆角 ${r.components.card.radius}px。`,
        ].filter(Boolean).join("\n"),
      });
      return;
    }
    if (siteAction === "save-doc-template") {
      onCreateSiteTemplate?.(siteReport);
      return;
    }
    if (siteAction === "apply-component") {
      const compType = button.dataset.compType || "button";
      onApplySiteComponent?.(compType, siteReport.components[compType], siteReport.site.title);
      return;
    }

    const action = button.dataset.paletteAction;
    if (action === "site-extractor") {
      if (!canLeave()) return;
      selectedId = null;
      editing = false;
      siteExtractorMode = true;
      render();
      resetScroll();
      focusHeading();
      return;
    }
    if (action === "new" || action === "edit") {
      if (state.readError) {
        showToast(state.error);
        return;
      }
      if (action === "new") {
        selectedId = null;
        draftFields = null;
        screenshotContext = null;
      }
      editing = true;
      dirty = false;
      render();
      resetScroll();
      root.querySelector("#palette-title")?.focus({ preventScroll: true });
    } else if (action === "upload-screenshot") {
      root.querySelector("#color-palette-screenshot")?.click();
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
      siteExtractorMode = false;
      if (action === "back" || !current()) selectedId = null;
      draftFields = null;
      screenshotContext = null;
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

  window.addEventListener("paste", async (event) => {
    if (root.hidden) return;
    const items = [...(event.clipboardData?.items || [])];
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (file) {
      event.preventDefault();
      await processScreenshotFile(file);
    }
  });

  window.addEventListener("beforeunload", (event) => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  render();
  return { canLeave, openDraftWithColors, processScreenshotFile };
}
