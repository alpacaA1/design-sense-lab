import { DOCUMENT_TYPES, findParameter } from "./config.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function valueLabel(config, id, value) {
  const parameter = findParameter(config, id);
  if (!parameter) return String(value);
  if (parameter.type === "select") return parameter.options.find((option) => option.value === String(value))?.label ?? value;
  if (parameter.type === "toggle") return value ? "开启" : "关闭";
  return `${value}${parameter.unit || ""}`;
}

export function renderStyleFilters(container, activeFilter, onFilter) {
  container.innerHTML = [
    `<button class="filter-chip ${activeFilter === "all" ? "is-active" : ""}" type="button" data-style-filter="all">全部模版 (${container.dataset.totalCount || ""})</button>`.replace(" ()", ""),
    ...Object.entries(DOCUMENT_TYPES).map(([id, config]) => `<button class="filter-chip ${activeFilter === id ? "is-active" : ""}" type="button" data-style-filter="${id}">${config.label}</button>`),
  ].join("");
  container.querySelectorAll("[data-style-filter]").forEach((button) => {
    button.addEventListener("click", () => onFilter(button.dataset.styleFilter));
  });
}

export function renderStyles(container, styles, filter, handlers) {
  const callbacks = typeof handlers === "function" ? { onApply: handlers } : (handlers || {});
  const filtered = filter === "all" ? styles : styles.filter((style) => style.type === filter);
  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state"><div><strong>还没有保存的文档排版模版</strong><span>返回文档工作台，调整排版参数与配色后点击「保存为模版」，或导入已有 JSON 备份。</span></div></div>`;
    return;
  }
  container.innerHTML = filtered.map((style) => {
    const config = DOCUMENT_TYPES[style.type];
    const summaryIds = ["pageFormat", "fontFamily", "bodySize", "lineHeight", "pageMargin"];
    const summary = summaryIds.filter((id) => Object.hasOwn(style.values, id)).map((id) => valueLabel(config, id, style.values[id])).join(" · ");
    const colors = [
      { label: "纸张", hex: style.values.pageColor },
      { label: "主字", hex: style.values.textColor },
      { label: "次字", hex: style.values.mutedColor },
      { label: "强调", hex: style.values.accentColor },
    ];
    return `
      <article class="style-card">
        <header><span>${escapeHtml(config.label)}模版</span><time>${escapeHtml(style.date)}</time></header>
        <h2>${escapeHtml(style.name)}</h2>
        <p class="style-card-summary">${escapeHtml(summary)}</p>
        ${style.note ? `<p class="style-card-note">${escapeHtml(style.note)}</p>` : ""}
        <div class="style-swatch" style="--style-paper:${escapeHtml(style.values.pageColor)}; --style-ink:${escapeHtml(style.values.textColor)}; --style-muted:${escapeHtml(style.values.mutedColor)}; --style-accent:${escapeHtml(style.values.accentColor)}" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="style-color-chips" aria-label="模版配色">
          ${colors.map((item) => `<span class="style-color-chip"><i style="background:${escapeHtml(item.hex)}"></i><small>${escapeHtml(item.label)}</small><code>${escapeHtml(String(item.hex || "").toUpperCase())}</code></span>`).join("")}
        </div>
        <div class="style-card-actions">
          <button class="primary-button compact" type="button" data-apply-style="${style.id}">应用完整模版</button>
          <button class="secondary-button" type="button" data-apply-style-colors="${style.id}">仅用此配色</button>
          <button class="secondary-button" type="button" data-save-style-palette="${style.id}">存入配色积累</button>
          <button class="secondary-button style-delete-button" type="button" data-delete-style="${style.id}" aria-label="删除模版：${escapeHtml(style.name)}">删除</button>
        </div>
      </article>`;
  }).join("");
  container.querySelectorAll("[data-apply-style]").forEach((button) => {
    button.addEventListener("click", () => callbacks.onApply?.(button.dataset.applyStyle));
  });
  container.querySelectorAll("[data-apply-style-colors]").forEach((button) => {
    button.addEventListener("click", () => callbacks.onApplyColors?.(button.dataset.applyStyleColors));
  });
  container.querySelectorAll("[data-save-style-palette]").forEach((button) => {
    button.addEventListener("click", () => callbacks.onSavePalette?.(button.dataset.saveStylePalette));
  });
  container.querySelectorAll("[data-delete-style]").forEach((button) => {
    button.addEventListener("click", () => callbacks.onDelete?.(button.dataset.deleteStyle));
  });
}
