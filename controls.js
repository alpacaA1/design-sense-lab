import { CATEGORY_META, CATEGORY_ORDER } from "./config.js";

document.addEventListener("pointerdown", (event) => {
  document.querySelectorAll("[data-select]").forEach((select) => {
    if (select.contains(event.target)) return;
    select.querySelector(".select-menu")?.setAttribute("hidden", "");
    select.querySelector("[data-select-trigger]")?.setAttribute("aria-expanded", "false");
  });
});

function formatNumber(value) {
  return Number.isInteger(Number(value)) ? String(value) : Number(value).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function renderNumber(parameter, value) {
  const progress = ((Number(value) - parameter.min) / (parameter.max - parameter.min)) * 100;
  return `
    <div class="numeric-control">
      <input class="numeric-range" type="range" min="${parameter.min}" max="${parameter.max}" step="${parameter.step}" value="${value}" data-param="${parameter.id}" aria-label="${parameter.label}" style="--range-progress:${progress}%" />
      <label class="numeric-field">
        <input type="number" min="${parameter.min}" max="${parameter.max}" step="${parameter.step}" value="${formatNumber(value)}" data-param="${parameter.id}" aria-label="${parameter.label}精确数值" />
        <span>${parameter.unit}</span>
      </label>
    </div>`;
}

function renderSelect(parameter, value) {
  const selected = parameter.options.find((option) => String(value) === option.value) ?? parameter.options[0];
  return `
    <div class="select-control" data-select="${parameter.id}">
      <button class="select-trigger" type="button" data-select-trigger aria-label="${parameter.label}" aria-haspopup="listbox" aria-expanded="false">
        <span>${selected.label}</span>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
      </button>
      <ul class="select-menu" role="listbox" aria-label="${parameter.label}" hidden>
        ${parameter.options.map((option) => `<li><button class="select-option" type="button" role="option" data-option-value="${option.value}" aria-selected="${String(value) === option.value}">${option.label}</button></li>`).join("")}
      </ul>
    </div>`;
}

function renderColor(parameter, value) {
  return `
    <div class="color-control">
      <label class="color-swatch" style="--swatch:${value}">
        <input type="color" value="${value}" data-param="${parameter.id}" aria-label="${parameter.label}" />
      </label>
      <input class="color-value" type="text" value="${value}" maxlength="7" pattern="#[0-9a-fA-F]{6}" data-param="${parameter.id}" aria-label="${parameter.label}颜色值" />
    </div>`;
}

function renderToggle(parameter, value) {
  return `
    <label class="switch-control">
      <input type="checkbox" ${value ? "checked" : ""} data-param="${parameter.id}" aria-label="${parameter.label}" />
      <span class="switch-track" aria-hidden="true"><span></span></span>
      <span class="switch-label">${value ? "开启" : "关闭"}</span>
    </label>`;
}

function renderInput(parameter, value) {
  if (parameter.type === "number") return renderNumber(parameter, value);
  if (parameter.type === "select") return renderSelect(parameter, value);
  if (parameter.type === "color") return renderColor(parameter, value);
  return renderToggle(parameter, value);
}

export function renderControls(container, config, documentState, callbacks) {
  container.innerHTML = CATEGORY_ORDER.map((categoryId) => {
    const category = config.categories[categoryId];
    const meta = CATEGORY_META[categoryId];
    const active = documentState.activeCategory === categoryId;
    return `
      <section class="parameter-group ${active ? "is-open" : ""}">
        <button class="group-button ${active ? "is-active" : ""}" type="button" data-category="${categoryId}" aria-expanded="${active}">
          <span class="group-icon" aria-hidden="true">${meta.icon}</span>
          <span class="group-label">${meta.label} <small>${meta.zh}</small></span>
          <span class="group-chevron" aria-hidden="true">${active ? "−" : "+"}</span>
        </button>
        ${active ? `
          <div class="group-panel">
            <p class="group-summary">${category.summary}</p>
            ${categoryId === "color" ? renderContrast(callbacks.getContrast()) : ""}
            ${category.parameters.map((parameter) => `
              <section class="parameter-item">
                <div class="parameter-copy"><strong>${parameter.label}</strong><small>${parameter.description}</small></div>
                <div class="parameter-control">${renderInput(parameter, documentState.values[parameter.id])}</div>
              </section>`).join("")}
          </div>` : ""}
      </section>`;
  }).join("");

  container.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", () => callbacks.onCategory(button.dataset.category));
  });

  container.querySelectorAll("[data-param]").forEach((control) => {
    const eventName = control.matches('input[type="range"], input[type="number"], input[type="color"]') ? "input" : "change";
    control.addEventListener(eventName, () => {
      let value = control.value;
      if (control.type === "checkbox") value = control.checked;
      if (["number", "range"].includes(control.type)) value = Number(value);
      const result = callbacks.onValue(control.dataset.param, value);
      syncControls(container, control.dataset.param, result.value, control.type);
      updateContrast(container, result.contrast);
    });
  });

  container.querySelectorAll("[data-select]").forEach((select) => {
    const trigger = select.querySelector("[data-select-trigger]");
    const menu = select.querySelector(".select-menu");
    const options = [...select.querySelectorAll(".select-option")];
    const close = () => {
      menu.hidden = true;
      trigger.setAttribute("aria-expanded", "false");
    };
    const open = () => {
      container.querySelectorAll('[data-select-trigger][aria-expanded="true"]').forEach((openTrigger) => {
        if (openTrigger !== trigger) {
          openTrigger.setAttribute("aria-expanded", "false");
          openTrigger.closest("[data-select]").querySelector(".select-menu").hidden = true;
        }
      });
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
    };

    trigger.addEventListener("click", () => menu.hidden ? open() : close());
    trigger.addEventListener("keydown", (event) => {
      if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
      event.preventDefault();
      open();
      (options.find((option) => option.getAttribute("aria-selected") === "true") ?? options[0])?.focus();
    });

    options.forEach((option, index) => {
      option.addEventListener("click", () => {
        const result = callbacks.onValue(select.dataset.select, option.dataset.optionValue);
        options.forEach((item) => item.setAttribute("aria-selected", String(item === option)));
        trigger.querySelector("span").textContent = option.textContent;
        close();
        trigger.focus();
        updateContrast(container, result.contrast);
      });
      option.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          close();
          trigger.focus();
        }
        if (["ArrowDown", "ArrowUp"].includes(event.key)) {
          event.preventDefault();
          const direction = event.key === "ArrowDown" ? 1 : -1;
          options[(index + direction + options.length) % options.length].focus();
        }
      });
    });
  });
}

function syncControls(container, parameterId, value, sourceType) {
  container.querySelectorAll(`[data-param="${parameterId}"]`).forEach((control) => {
    if (control.type === "checkbox") {
      control.checked = Boolean(value);
      control.closest(".switch-control")?.querySelector(".switch-label")?.replaceChildren(value ? "开启" : "关闭");
      return;
    }
    if (sourceType === "text" && !/^#[0-9a-f]{6}$/i.test(String(value))) return;
    if (control !== document.activeElement || control.type === "range" || control.type === "color" || sourceType === "text") control.value = value;
    if (control.type === "range") {
      const progress = ((Number(value) - Number(control.min)) / (Number(control.max) - Number(control.min))) * 100;
      control.style.setProperty("--range-progress", `${progress}%`);
    }
    if (control.type === "color") control.closest(".color-swatch")?.style.setProperty("--swatch", value);
  });
}

function renderContrast(contrast) {
  return `<p class="contrast-status ${contrast.pass ? "is-pass" : "is-fail"}"><span>文字与纸张对比度</span><strong>${contrast.ratio}:1 · ${contrast.pass ? "AA 通过" : "AA 未通过"}</strong></p>`;
}

function updateContrast(container, contrast) {
  const status = container.querySelector(".contrast-status");
  if (!status) return;
  status.classList.toggle("is-pass", contrast.pass);
  status.classList.toggle("is-fail", !contrast.pass);
  status.querySelector("strong").textContent = `${contrast.ratio}:1 · ${contrast.pass ? "AA 通过" : "AA 未通过"}`;
}
