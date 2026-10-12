import { DOCUMENT_TYPES } from "./config.js";
import { renderControls } from "./controls.js";
import { renderDocument } from "./renderers.js";
import {
  applyStyle,
  createAppState,
  persistWorkspace,
  resetCurrentDocument,
  saveCurrentStyle,
  setCategory,
  setDocumentType,
  setParameter,
} from "./state.js";
import { renderStyleFilters, renderStyles } from "./styles-library.js";
import { initComponentLab } from "./component-lab.js";

const state = createAppState();

const documentTitles = {
  longdoc: "在日常选择中重新理解设计",
  onepager: "让每一次设计选择都有理由",
  resume: "林悦 · 产品设计师",
  letter: "关于建立产品设计实验机制的建议",
};

const elements = {
  typeTabs: document.querySelector("#type-tabs"),
  parameterGroups: document.querySelector("#parameter-groups"),
  workspaceTitle: document.querySelector("#workspace-title"),
  preview: document.querySelector("#document-preview"),
  controlPanel: document.querySelector(".control-panel"),
  workspace: document.querySelector("#workspace"),
  typebar: document.querySelector(".document-typebar"),
  stylesView: document.querySelector("#styles-view"),
  styleFilters: document.querySelector("#style-filters"),
  stylesGrid: document.querySelector("#styles-grid"),
  styleCount: document.querySelector("#style-count"),
  resetButton: document.querySelector("#reset-button"),
  saveStyleButton: document.querySelector("#save-style-button"),
  saveDialog: document.querySelector("#save-style-dialog"),
  saveForm: document.querySelector("#save-style-form"),
  styleName: document.querySelector("#style-name"),
  cancelSave: document.querySelector("#cancel-save"),
  libraryTrigger: document.querySelector("#library-trigger"),
  backToWorkspace: document.querySelector("#back-to-workspace"),
  brandHome: document.querySelector("#brand-home"),
  toast: document.querySelector("#toast"),
  componentLab: document.querySelector("#component-lab"),
  promptNotes: document.querySelector("#prompt-notes"),
  skipLink: document.querySelector("#skip-link"),
  studioSwitches: [...document.querySelectorAll("[data-studio-mode]")],
};

let componentLab;
let promptNotes;
let promptNotesLoading;

function current() {
  return {
    type: state.currentType,
    config: DOCUMENT_TYPES[state.currentType],
    documentState: state.documents[state.currentType],
  };
}

function renderWorkspace() {
  const { type, config, documentState } = current();
  renderTypeTabs();
  elements.workspaceTitle.textContent = documentTitles[type];

  renderControls(elements.parameterGroups, config, documentState, {
    getContrast: () => currentContrast(documentState.values),
    onCategory(categoryId) {
      setCategory(state, categoryId);
      persistWorkspace(state);
      renderWorkspace();
    },
    onValue(parameterId, value) {
      setParameter(state, parameterId, value);
      persistWorkspace(state);
      renderPreview();
      return {
        value: documentState.values[parameterId],
        contrast: currentContrast(documentState.values),
      };
    },
  });

  renderPreview();
  updateStyleCount();
}

function renderTypeTabs() {
  elements.typeTabs.innerHTML = Object.entries(DOCUMENT_TYPES).map(([id, config]) => `
    <button class="type-tab ${state.currentType === id ? "is-active" : ""}" type="button" data-document-type="${id}" aria-current="${state.currentType === id ? "page" : "false"}">
      <strong>${config.label}</strong>
    </button>`).join("");
  elements.typeTabs.querySelectorAll("[data-document-type]").forEach((button) => {
    button.addEventListener("click", () => {
      setDocumentType(state, button.dataset.documentType);
      persistWorkspace(state);
      showWorkspace();
      renderWorkspace();
    });
  });
}

function renderPreview() {
  const { type, documentState } = current();
  renderDocument(elements.preview, type, documentState.values);
}

function currentContrast(values) {
  const ratio = contrastRatio(values.textColor, values.pageColor);
  return { ratio: ratio.toFixed(1), pass: ratio >= 4.5 };
}

function contrastRatio(foreground, background) {
  const luminance = (hex) => {
    const channels = String(hex).slice(1).match(/.{2}/g).map((part) => parseInt(part, 16) / 255);
    const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function showWorkspace() {
  if (promptNotes && !promptNotes.canLeave()) return;
  setStudioMode("documents");
  elements.promptNotes.hidden = true;
  elements.controlPanel.hidden = false;
  elements.workspace.hidden = false;
  elements.stylesView.hidden = true;
  elements.componentLab.hidden = true;
}

function showLibrary() {
  if (promptNotes && !promptNotes.canLeave()) return;
  setStudioMode("documents");
  elements.promptNotes.hidden = true;
  elements.controlPanel.hidden = true;
  elements.workspace.hidden = true;
  elements.stylesView.hidden = false;
  elements.componentLab.hidden = true;
  renderLibrary();
}

function setStudioMode(mode) {
  const isDocuments = mode === "documents";
  document.body.dataset.studio = mode;
  elements.brandHome.querySelector("small").textContent = mode === "prompts" ? "Prompt Notes" : mode === "components" ? "Component Lab" : "Document Studio";
  elements.typebar.hidden = !isDocuments;
  elements.libraryTrigger.hidden = !isDocuments;
  elements.skipLink.href = mode === "prompts" ? "#prompt-notes" : mode === "components" ? "#component-lab" : "#document-canvas";
  elements.skipLink.textContent = mode === "prompts" ? "跳到提示词笔记" : mode === "components" ? "跳到组件训练" : "跳到文档画布";
  if (mode === "prompts") history.replaceState(null, "", `${location.pathname}${location.search}#prompts`);
  else if (location.hash === "#prompts") history.replaceState(null, "", `${location.pathname}${location.search}`);
  elements.studioSwitches.forEach((button) => {
    const active = button.dataset.studioMode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
}

function showComponentLab() {
  if (promptNotes && !promptNotes.canLeave()) return;
  setStudioMode("components");
  elements.promptNotes.hidden = true;
  elements.controlPanel.hidden = true;
  elements.workspace.hidden = true;
  elements.stylesView.hidden = true;
  elements.componentLab.hidden = false;
  componentLab?.refresh();
}

async function showPromptNotes() {
  setStudioMode("prompts");
  elements.controlPanel.hidden = true;
  elements.workspace.hidden = true;
  elements.stylesView.hidden = true;
  elements.componentLab.hidden = true;
  elements.promptNotes.hidden = false;
  if (!promptNotesLoading) {
    elements.promptNotes.textContent = "正在打开提示词笔记…";
    promptNotesLoading = import("./prompt-notes.js").then(({ initPromptNotes }) => {
      promptNotes = initPromptNotes(elements.promptNotes, { showToast });
    }).catch(() => {
      elements.promptNotes.textContent = "笔记模块加载失败，请刷新后重试。";
      promptNotesLoading = null;
    });
  }
  await promptNotesLoading;
}

function renderLibrary() {
  renderStyleFilters(elements.styleFilters, state.styleFilter, (filter) => {
    state.styleFilter = filter;
    renderLibrary();
  });
  renderStyles(elements.stylesGrid, state.styles, state.styleFilter, (styleId) => {
    if (!applyStyle(state, styleId)) return;
    showWorkspace();
    renderWorkspace();
    showToast("样式已应用到文档工作台");
  });
}

function openSaveDialog() {
  const { config, documentState } = current();
  elements.styleName.value = `${config.label} · ${documentState.values.bodySize}px / ${documentState.values.lineHeight}`;
  elements.saveDialog.showModal();
  elements.styleName.focus();
  elements.styleName.select();
}

function updateStyleCount() {
  elements.styleCount.textContent = state.styles.length;
  elements.styleCount.setAttribute("aria-label", `已保存 ${state.styles.length} 个样式`);
}

let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.querySelector("span").textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2200);
}

elements.resetButton.addEventListener("click", () => {
  resetCurrentDocument(state);
  persistWorkspace(state);
  renderWorkspace();
  showToast("已恢复当前文档类型的默认样式");
});

elements.saveStyleButton.addEventListener("click", openSaveDialog);
elements.cancelSave.addEventListener("click", () => elements.saveDialog.close());
elements.saveForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const style = saveCurrentStyle(state, elements.styleName.value);
  if (!style) {
    showToast("样式未保存，请检查浏览器存储设置");
    return;
  }
  elements.saveDialog.close();
  updateStyleCount();
  showToast("当前参数已保存到 My Styles");
});

elements.libraryTrigger.addEventListener("click", showLibrary);
elements.backToWorkspace.addEventListener("click", showWorkspace);
elements.brandHome.addEventListener("click", () => {
  showWorkspace();
  renderWorkspace();
});
elements.studioSwitches.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.dataset.studioMode === "components") showComponentLab();
    else if (button.dataset.studioMode === "prompts") showPromptNotes();
    else {
      showWorkspace();
      renderWorkspace();
    }
  });
});

componentLab = initComponentLab(elements.componentLab, { showToast });
renderWorkspace();
if (location.hash === "#prompts") showPromptNotes();
