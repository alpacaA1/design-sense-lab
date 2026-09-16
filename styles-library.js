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
    `<button class="filter-chip ${activeFilter === "all" ? "is-active" : ""}" type="button" data-style-filter="all">全部</button>`,
    ...Object.entries(DOCUMENT_TYPES).map(([id, config]) => `<button class="filter-chip ${activeFilter === id ? "is-active" : ""}" type="button" data-style-filter="${id}">${config.label}</button>`),
  ].join("");
  container.querySelectorAll("[data-style-filter]").forEach((button) => {
    button.addEventListener("click", () => onFilter(button.dataset.styleFilter));
  });
}

export function renderStyles(container, styles, filter, onApply) {
  const filtered = filter === "all" ? styles : styles.filter((style) => style.type === filter);
  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state"><div><strong>还没有保存的文档样式</strong><span>返回工作台，调整一份真实文档后保存。</span></div></div>`;
    return;
  }
  container.innerHTML = filtered.map((style) => {
    const config = DOCUMENT_TYPES[style.type];
    const summaryIds = ["fontFamily", "bodySize", "lineHeight", "pageMargin", "accentColor"];
    const summary = summaryIds.filter((id) => Object.hasOwn(style.values, id)).map((id) => valueLabel(config, id, style.values[id])).join(" · ");
    return `
      <article class="style-card">
        <header><span>${escapeHtml(config.label)}</span><time>${escapeHtml(style.date)}</time></header>
        <h2>${escapeHtml(style.name)}</h2>
        <p>${escapeHtml(summary)}</p>
        <div class="style-swatch" style="--style-paper:${style.values.pageColor}; --style-ink:${style.values.textColor}; --style-accent:${style.values.accentColor}" aria-hidden="true"><i></i><i></i><i></i></div>
        <button class="secondary-button" type="button" data-apply-style="${style.id}">应用到工作台</button>
      </article>`;
  }).join("");
  container.querySelectorAll("[data-apply-style]").forEach((button) => {
    button.addEventListener("click", () => onApply(button.dataset.applyStyle));
  });
}
