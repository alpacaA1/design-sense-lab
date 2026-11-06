import { normalizeHex } from "./color-palettes-store.js?v=20261106c";

export const SITE_EXTRACTOR_APP_ID = "design-sense-site-extractor";

function clamp(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return min;
  return Math.min(max, Math.max(min, num));
}

function rgbStringToHex(str) {
  const direct = normalizeHex(str);
  if (direct) return direct;
  const m = String(str || "").match(/rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)/i);
  if (!m) return null;
  const toHex = (n) => Math.max(0, Math.min(255, parseInt(m[n], 10))).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(1)}${toHex(2)}${toHex(3)}`;
}

export function getConsoleExtractorScript() {
  return `(() => {
  const toHex = (c) => {
    if (!c || c === "transparent" || c === "rgba(0, 0, 0, 0)") return null;
    const m = c.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
    if (!m) return null;
    return "#" + [m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, "0")).join("").toUpperCase();
  };
  const px = (v, fb = 0) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? Math.round(n * 10) / 10 : fb;
  };
  const pickEl = (sel) => {
    for (const s of sel) {
      const list = [...document.querySelectorAll(s)].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 12 && r.height > 10 && getComputedStyle(el).visibility !== "hidden";
      });
      if (list.length) return list[0];
    }
    return null;
  };
  const bodyStyle = getComputedStyle(document.body);
  const mainEl = pickEl(["main", "article", "[role='main']", ".content", "#app"]) || document.body;
  const mainStyle = getComputedStyle(mainEl);
  const pageColor = toHex(mainStyle.backgroundColor) || toHex(bodyStyle.backgroundColor) || "#FFFEFB";
  const pEl = pickEl(["article p", "main p", "p"]) || document.body;
  const pStyle = getComputedStyle(pEl);
  const textColor = toHex(pStyle.color) || toHex(bodyStyle.color) || "#262522";
  const mutedEl = pickEl(["time", "small", "figcaption", "footer", "[class*='muted']", "[class*='secondary']", "aside"]);
  const mutedColor = (mutedEl && toHex(getComputedStyle(mutedEl).color)) || "#716D66";
  const btnEl = pickEl(["button:not([disabled])", "[role='button']", "a[class*='btn']", "a[class*='button']"]);
  const linkEl = pickEl(["main a", "article a", "a[href]"]);
  const btnStyle = btnEl ? getComputedStyle(btnEl) : null;
  const btnBg = btnStyle ? toHex(btnStyle.backgroundColor) : null;
  const accentColor = (btnBg && btnBg !== pageColor && btnBg !== "#FFFFFF" && btnBg !== "#000000" ? btnBg : null)
    || (linkEl && toHex(getComputedStyle(linkEl).color))
    || "#315F9E";

  const h1El = pickEl(["h1", "[class*='title']"]);
  const h1Style = h1El ? getComputedStyle(h1El) : null;
  const h2El = pickEl(["h2", "h3"]);
  const h2Style = h2El ? getComputedStyle(h2El) : null;
  const bodySize = Math.round(px(pStyle.fontSize, 16));
  const rawLh = parseFloat(pStyle.lineHeight);
  const lineHeight = Number.isFinite(rawLh) ? Number((rawLh / Math.max(10, bodySize)).toFixed(2)) : 1.65;

  const inputEl = pickEl(["input[type='text']", "input[type='search']", "input[type='email']", "input:not([type='hidden'])", "textarea"]);
  const inputStyle = inputEl ? getComputedStyle(inputEl) : null;
  const cardEl = pickEl(["article", "[class*='card']", "section > div"]);
  const cardStyle = cardEl ? getComputedStyle(cardEl) : null;

  const swatchCount = new Map();
  document.querySelectorAll("body, main, header, section, article, div, button, a, span, p, h1, h2").forEach((el, i) => {
    if (i > 260) return;
    const st = getComputedStyle(el);
    [toHex(st.backgroundColor), toHex(st.color)].forEach((hex) => {
      if (hex) swatchCount.set(hex, (swatchCount.get(hex) || 0) + 1);
    });
  });
  const swatches = [...swatchCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([hex]) => hex);

  const report = {
    app: "${SITE_EXTRACTOR_APP_ID}",
    schemaVersion: 1,
    site: {
      title: document.title || location.hostname,
      url: location.href,
      hostname: location.hostname,
      extractedAt: new Date().toISOString(),
    },
    colors: { pageColor, textColor, mutedColor, accentColor, swatches },
    typography: {
      fontFamilyStack: pStyle.fontFamily || bodyStyle.fontFamily || "",
      bodySize,
      lineHeight: Math.min(2, Math.max(1.3, lineHeight)),
      bodyWeight: pStyle.fontWeight || "400",
      letterSpacing: px(pStyle.letterSpacing, 0),
      titleSize: h1Style ? Math.round(px(h1Style.fontSize, 36)) : 36,
      sectionTitleSize: h2Style ? Math.round(px(h2Style.fontSize, 22)) : 22,
      titleWeight: h1Style ? h1Style.fontWeight : "600",
      paragraphGap: Math.round(px(pStyle.marginBottom, 16)) || 16,
    },
    components: {
      button: btnEl && btnStyle ? {
        height: Math.round(btnEl.getBoundingClientRect().height) || 40,
        paddingX: Math.round(px(btnStyle.paddingLeft, 16)),
        fontSize: Math.round(px(btnStyle.fontSize, 14)),
        radius: Math.round(px(btnStyle.borderTopLeftRadius, 6)),
      } : { height: 40, paddingX: 16, fontSize: 14, radius: 6 },
      input: inputEl && inputStyle ? {
        height: Math.round(inputEl.getBoundingClientRect().height) || 40,
        paddingX: Math.round(px(inputStyle.paddingLeft, 12)),
        fontSize: Math.round(px(inputStyle.fontSize, 14)),
        radius: Math.round(px(inputStyle.borderTopLeftRadius, 6)),
        border: Math.round(px(inputStyle.borderTopWidth, 1)),
      } : { height: 40, paddingX: 12, fontSize: 14, radius: 6, border: 1 },
      card: cardEl && cardStyle ? {
        width: Math.min(420, Math.max(260, Math.round(cardEl.getBoundingClientRect().width / 10) * 10)) || 320,
        padding: Math.round(px(cardStyle.paddingTop, 20)) || 20,
        titleSize: h2Style ? Math.round(px(h2Style.fontSize, 18)) : 18,
        radius: Math.round(px(cardStyle.borderTopLeftRadius, 8)),
        border: Math.round(px(cardStyle.borderTopWidth, 1)),
      } : { width: 320, padding: 20, titleSize: 18, radius: 8, border: 1 },
    },
  };
  const json = JSON.stringify(report, null, 2);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(json).then(() => alert("已提取「" + report.site.title + "」的配色与样式 JSON 并复制到剪贴板，请回到 Design Sense Lab 粘贴导入。")).catch(() => prompt("请复制以下网站拆解 JSON：", json));
  } else {
    prompt("请复制以下网站拆解 JSON：", json);
  }
  return report;
})();`;
}

export function getBookmarkletHref() {
  const compact = getConsoleExtractorScript().replace(/\n+/g, " ").replace(/\s{2,}/g, " ");
  return `javascript:${encodeURIComponent(compact)}`;
}

export function createDemoSiteReport() {
  return {
    app: SITE_EXTRACTOR_APP_ID,
    schemaVersion: 1,
    site: {
      title: "Linear / Editorial Docs 示例站点",
      url: "https://docs.example.com/design-system",
      hostname: "docs.example.com",
      extractedAt: new Date().toISOString(),
    },
    colors: {
      pageColor: "#FBFBF9",
      textColor: "#1D1E1C",
      mutedColor: "#6B6E68",
      accentColor: "#2E5A88",
      swatches: ["#FBFBF9", "#1D1E1C", "#6B6E68", "#2E5A88", "#EFECE6", "#D8D5CD"],
    },
    typography: {
      fontFamilyStack: "Inter, -apple-system, BlinkMacSystemFont, PingFang SC, sans-serif",
      bodySize: 15,
      lineHeight: 1.65,
      bodyWeight: "400",
      letterSpacing: 0,
      titleSize: 38,
      sectionTitleSize: 21,
      titleWeight: "600",
      paragraphGap: 16,
    },
    components: {
      button: { height: 36, paddingX: 14, fontSize: 13, radius: 6 },
      input: { height: 38, paddingX: 12, fontSize: 14, radius: 6, border: 1 },
      card: { width: 340, padding: 22, titleSize: 18, radius: 10, border: 1 },
    },
  };
}

function parseRawCssText(text) {
  const hexMatches = [...String(text || "").matchAll(/#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)]
    .map((m) => normalizeHex(m[0]))
    .filter(Boolean);
  const rgbMatches = [...String(text || "").matchAll(/rgba?\(\s*\d+\s*[, ]\s*\d+\s*[, ]\s*\d+[^)]*\)/gi)]
    .map((m) => rgbStringToHex(m[0]))
    .filter(Boolean);
  const uniqueColors = [...new Set([...hexMatches, ...rgbMatches])];
  if (!uniqueColors.length) {
    throw new Error("未在文本中识别到有效的网站拆解 JSON 或 CSS 颜色值（如 #RRGGBB）。");
  }

  const findVarColor = (pattern) => {
    const m = String(text).match(new RegExp(`--[\\w-]*(?:${pattern})[\\w-]*\\s*:\\s*([^;\\n}]+)`, "i"));
    return m ? rgbStringToHex(m[1].trim()) : null;
  };

  const pageColor = findVarColor("bg|background|page|surface|canvas") || uniqueColors[0] || "#FFFEFB";
  const textColor = findVarColor("text-primary|text|ink|fg|foreground|body") || uniqueColors[1] || "#262522";
  const mutedColor = findVarColor("muted|secondary|subtle|gray") || uniqueColors[2] || "#716D66";
  const accentColor = findVarColor("accent|brand|link") || findVarColor("primary") || uniqueColors[3] || uniqueColors[1] || "#315F9E";

  const fontSizeMatches = [...String(text).matchAll(/font-size\s*:\s*(\d+(?:\.\d+)?)px/gi)]
    .map((m) => Math.round(Number(m[1])))
    .filter((n) => n >= 11 && n <= 64);
  const radiusMatches = [...String(text).matchAll(/border-radius\s*:\s*(\d+(?:\.\d+)?)px/gi)]
    .map((m) => Math.round(Number(m[1])))
    .filter((n) => n >= 0 && n <= 32);

  const sortedSizes = [...new Set(fontSizeMatches)].sort((a, b) => a - b);
  const bodySize = sortedSizes.find((s) => s >= 14 && s <= 17) || 16;
  const titleSize = sortedSizes.findLast((s) => s >= 26) || 36;
  const sectionTitleSize = sortedSizes.find((s) => s >= 18 && s <= 25) || 22;
  const radius = radiusMatches[0] ?? 6;

  return {
    app: SITE_EXTRACTOR_APP_ID,
    schemaVersion: 1,
    site: {
      title: "CSS 样式代码解析",
      url: "",
      hostname: "css-snippet",
      extractedAt: new Date().toISOString(),
    },
    colors: {
      pageColor,
      textColor,
      mutedColor,
      accentColor,
      swatches: uniqueColors.slice(0, 8),
    },
    typography: {
      fontFamilyStack: "sans-serif",
      bodySize,
      lineHeight: 1.65,
      bodyWeight: "400",
      letterSpacing: 0,
      titleSize,
      sectionTitleSize,
      titleWeight: "600",
      paragraphGap: 16,
    },
    components: {
      button: { height: 40, paddingX: 16, fontSize: 14, radius },
      input: { height: 40, paddingX: 12, fontSize: 14, radius, border: 1 },
      card: { width: 320, padding: 20, titleSize: 18, radius: Math.min(20, radius + 2), border: 1 },
    },
  };
}

export function parseSiteStyleInput(input) {
  const raw = String(input || "").trim();
  if (!raw) throw new Error("请先粘贴从网站提取的 JSON 或 CSS 样式代码。");

  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return parseRawCssText(raw);
  }

  if (!parsed || typeof parsed !== "object" || !parsed.colors) {
    throw new Error("JSON 缺少配色与样式字段，请使用本工作台提供的提取脚本。");
  }

  const colors = {
    pageColor: normalizeHex(parsed.colors.pageColor) || "#FFFEFB",
    textColor: normalizeHex(parsed.colors.textColor) || "#262522",
    mutedColor: normalizeHex(parsed.colors.mutedColor) || "#716D66",
    accentColor: normalizeHex(parsed.colors.accentColor) || "#315F9E",
    swatches: Array.isArray(parsed.colors.swatches)
      ? parsed.colors.swatches.map((c) => normalizeHex(c)).filter(Boolean)
      : [],
  };

  const typo = parsed.typography || {};
  const comp = parsed.components || {};
  const bodySize = clamp(Math.round(Number(typo.bodySize) || 16), 12, 21);
  const titleSize = clamp(Math.round(Number(typo.titleSize) || 36), 26, 58);
  const sectionTitleSize = clamp(Math.round(Number(typo.sectionTitleSize) || 22), 17, 32);

  return {
    app: SITE_EXTRACTOR_APP_ID,
    schemaVersion: 1,
    site: {
      title: String(parsed.site?.title || "提取的网站样式").trim().slice(0, 100),
      url: String(parsed.site?.url || "").trim(),
      hostname: String(parsed.site?.hostname || "website").trim(),
      extractedAt: parsed.site?.extractedAt || new Date().toISOString(),
    },
    colors,
    typography: {
      fontFamilyStack: String(typo.fontFamilyStack || ""),
      bodySize,
      lineHeight: clamp(Number(typo.lineHeight) || 1.65, 1.3, 2),
      bodyWeight: ["400", "500", "600"].includes(String(typo.bodyWeight)) ? String(typo.bodyWeight) : "400",
      letterSpacing: clamp(Number(typo.letterSpacing) || 0, -1, 2),
      titleSize,
      sectionTitleSize,
      titleWeight: ["400", "500", "600"].includes(String(typo.titleWeight)) ? String(typo.titleWeight) : "600",
      paragraphGap: clamp(Math.round(Number(typo.paragraphGap) || 16), 6, 30),
      typeScaleRatio: Number((titleSize / bodySize).toFixed(2)),
      sectionScaleRatio: Number((sectionTitleSize / bodySize).toFixed(2)),
    },
    components: {
      button: {
        height: clamp(Math.round(Number(comp.button?.height) || 40), 28, 52),
        paddingX: clamp(Math.round(Number(comp.button?.paddingX) || 16), 8, 28),
        fontSize: clamp(Math.round(Number(comp.button?.fontSize) || 14), 12, 18),
        radius: clamp(Math.round(Number(comp.button?.radius) ?? 6), 0, 16),
      },
      input: {
        height: clamp(Math.round(Number(comp.input?.height) || 40), 28, 52),
        paddingX: clamp(Math.round(Number(comp.input?.paddingX) || 12), 6, 24),
        fontSize: clamp(Math.round(Number(comp.input?.fontSize) || 14), 12, 18),
        radius: clamp(Math.round(Number(comp.input?.radius) ?? 6), 0, 16),
        border: clamp(Math.round(Number(comp.input?.border) ?? 1), 0, 3),
      },
      card: {
        width: clamp(Math.round(Number(comp.card?.width) || 320), 260, 420),
        padding: clamp(Math.round(Number(comp.card?.padding) || 20), 8, 36),
        titleSize: clamp(Math.round(Number(comp.card?.titleSize) || 18), 14, 24),
        radius: clamp(Math.round(Number(comp.card?.radius) ?? 8), 0, 20),
        border: clamp(Math.round(Number(comp.card?.border) ?? 1), 0, 3),
      },
    },
  };
}

export function mapSiteReportToDocumentValues(report) {
  const stack = String(report.typography?.fontFamilyStack || "").toLowerCase().replace(/sans-serif/g, "");
  let fontFamily = "sans";
  if (/kaiti|stkaiti|楷/.test(stack)) fontFamily = "kai";
  else if (/song|\bserif\b|georgia|times|明|宋/.test(stack)) {
    fontFamily = "serif";
  }

  return {
    fontFamily,
    bodySize: report.typography.bodySize,
    lineHeight: report.typography.lineHeight,
    letterSpacing: report.typography.letterSpacing,
    bodyWeight: report.typography.bodyWeight,
    titleSize: report.typography.titleSize,
    sectionTitleSize: report.typography.sectionTitleSize,
    titleWeight: report.typography.titleWeight,
    paragraphGap: report.typography.paragraphGap,
    radius: report.components.button.radius,
    pageColor: report.colors.pageColor,
    textColor: report.colors.textColor,
    mutedColor: report.colors.mutedColor,
    accentColor: report.colors.accentColor,
  };
}
