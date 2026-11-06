import { normalizeHex } from "./color-palettes-store.js?v=20261106c";

function rgbToHex(r, g, b) {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function hexToRgb(hex) {
  const normalized = normalizeHex(hex) || "#000000";
  return [
    parseInt(normalized.slice(1, 3), 16),
    parseInt(normalized.slice(3, 5), 16),
    parseInt(normalized.slice(5, 7), 16),
  ];
}

function colorDistance(a, b) {
  const rMean = (a[0] + b[0]) * 0.5;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt((2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db);
}

function relativeLuminance(rgb) {
  const linear = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastBetweenRgb(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function rgbChroma(rgb) {
  const max = Math.max(rgb[0], rgb[1], rgb[2]) / 255;
  const min = Math.min(rgb[0], rgb[1], rgb[2]) / 255;
  const delta = max - min;
  if (delta === 0) return 0;
  const lightness = (max + min) * 0.5;
  const saturation = delta / (1 - Math.abs(2 * lightness - 1) + 0.05);
  return delta * 0.65 + saturation * 0.35;
}

function mixRgb(a, b, ratio = 0.5) {
  return [
    Math.round(a[0] * (1 - ratio) + b[0] * ratio),
    Math.round(a[1] * (1 - ratio) + b[1] * ratio),
    Math.round(a[2] * (1 - ratio) + b[2] * ratio),
  ];
}

export function extractPaletteFromImageData(imageData, maxSwatches = 8) {
  const { width, height, data } = imageData || {};
  if (!width || !height || !data || data.length < width * height * 4) {
    throw new Error("图像数据无效，请选择清晰的截图文件。");
  }

  const totalPixels = width * height;
  const step = Math.max(1, Math.floor(Math.sqrt(totalPixels / 10000)));
  const buckets = new Map();
  let sampledCount = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const alpha = data[idx + 3];
      if (alpha < 128) continue;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const key = `${r >> 3},${g >> 3},${b >> 3}`;
      let entry = buckets.get(key);
      if (!entry) {
        entry = { count: 0, rSum: 0, gSum: 0, bSum: 0 };
        buckets.set(key, entry);
      }
      entry.count += 1;
      entry.rSum += r;
      entry.gSum += g;
      entry.bSum += b;
      sampledCount += 1;
    }
  }

  if (!sampledCount) {
    throw new Error("未在截图中检测到有效像素。");
  }

  const rawClusters = [...buckets.values()]
    .map((entry) => ({
      count: entry.count,
      rgb: [
        Math.round(entry.rSum / entry.count),
        Math.round(entry.gSum / entry.count),
        Math.round(entry.bSum / entry.count),
      ],
    }))
    .sort((a, b) => b.count - a.count);

  const merged = [];
  for (const item of rawClusters) {
    const existing = merged.find((cluster) => colorDistance(cluster.rgb, item.rgb) < 42);
    if (existing) {
      const nextCount = existing.count + item.count;
      existing.rgb = [
        Math.round((existing.rgb[0] * existing.count + item.rgb[0] * item.count) / nextCount),
        Math.round((existing.rgb[1] * existing.count + item.rgb[1] * item.count) / nextCount),
        Math.round((existing.rgb[2] * existing.count + item.rgb[2] * item.count) / nextCount),
      ];
      existing.count = nextCount;
    } else {
      merged.push({ ...item });
    }
  }

  const swatches = merged
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(maxSwatches, 10))
    .map((cluster) => {
      const hex = rgbToHex(cluster.rgb[0], cluster.rgb[1], cluster.rgb[2]);
      const share = cluster.count / sampledCount;
      const luminance = relativeLuminance(cluster.rgb);
      const chroma = rgbChroma(cluster.rgb);
      return {
        hex,
        rgb: cluster.rgb,
        share: Number((share * 100).toFixed(1)),
        rawShare: share,
        luminance,
        chroma,
      };
    });

  // 1. Page / background color: dominant cluster
  const pageCluster = swatches[0] || { hex: "#FFFEFB", rgb: [255, 254, 251], luminance: 0.99, chroma: 0.01 };

  // 2. Primary text color: highest contrast against pageCluster, preferring low-to-moderate chroma
  const textCandidates = swatches
    .slice(1)
    .map((item) => {
      const contrast = contrastBetweenRgb(item.rgb, pageCluster.rgb);
      const score = contrast * (1 - Math.min(0.45, item.chroma * 0.5));
      return { ...item, contrast, score };
    })
    .sort((a, b) => b.score - a.score);

  let textCluster = textCandidates.find((item) => item.contrast >= 4.2) || textCandidates[0];
  if (!textCluster || contrastBetweenRgb(textCluster.rgb, pageCluster.rgb) < 3.2) {
    const fallbackRgb = pageCluster.luminance > 0.45 ? [38, 37, 34] : [245, 244, 237];
    textCluster = {
      hex: rgbToHex(...fallbackRgb),
      rgb: fallbackRgb,
      luminance: relativeLuminance(fallbackRgb),
      chroma: 0.04,
    };
  }

  // 3. Accent color: highest colorfulness/chroma among clusters distinct from page & text
  const accentCandidates = swatches
    .filter((item) => item.hex !== pageCluster.hex && item.hex !== textCluster.hex)
    .filter((item) => colorDistance(item.rgb, pageCluster.rgb) > 48)
    .map((item) => ({
      ...item,
      accentScore: item.chroma * 2.4 + Math.min(0.35, Math.sqrt(item.rawShare)) + (contrastBetweenRgb(item.rgb, pageCluster.rgb) >= 2.2 ? 0.25 : 0),
    }))
    .sort((a, b) => b.accentScore - a.accentScore);

  const accentCluster = accentCandidates[0] || {
    hex: "#315F9E",
    rgb: [49, 95, 158],
  };

  // 4. Muted color: intermediate contrast against pageCluster, lower chroma than accent
  const mutedCandidates = swatches
    .filter((item) => item.hex !== pageCluster.hex && item.hex !== textCluster.hex && item.hex !== accentCluster.hex)
    .map((item) => {
      const cPage = contrastBetweenRgb(item.rgb, pageCluster.rgb);
      const cText = contrastBetweenRgb(item.rgb, textCluster.rgb);
      const balance = cPage >= 2.0 && cPage <= 7.5 ? 1.5 : 0.4;
      return {
        ...item,
        mutedScore: balance - Math.abs(cPage - 4.2) * 0.18 - item.chroma * 0.8 + (cText > 1.3 ? 0.3 : 0),
      };
    })
    .sort((a, b) => b.mutedScore - a.mutedScore);

  let mutedRgb = mutedCandidates[0]?.rgb;
  if (!mutedRgb || contrastBetweenRgb(mutedRgb, pageCluster.rgb) < 1.8) {
    mutedRgb = mixRgb(textCluster.rgb, pageCluster.rgb, 0.42);
  }

  const roles = {
    pageColor: pageCluster.hex,
    textColor: textCluster.hex,
    mutedColor: rgbToHex(...mutedRgb),
    accentColor: accentCluster.hex,
  };

  return {
    roles,
    swatches: swatches.slice(0, maxSwatches).map((item) => ({
      hex: item.hex,
      share: item.share,
    })),
  };
}

function getPixelRgb(imageData, x, y) {
  const { width, height, data } = imageData;
  const cx = Math.max(0, Math.min(width - 1, Math.round(x)));
  const cy = Math.max(0, Math.min(height - 1, Math.round(y)));
  const idx = (cy * width + cx) * 4;
  return [data[idx], data[idx + 1], data[idx + 2]];
}

export function samplePixelHex(imageData, x, y) {
  const rgb = getPixelRgb(imageData, x, y);
  return rgbToHex(rgb[0], rgb[1], rgb[2]);
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) * 0.5;
}

function estimatePerimeterBg(imageData, rect) {
  const samples = [];
  const x0 = Math.max(0, Math.floor(rect.x));
  const y0 = Math.max(0, Math.floor(rect.y));
  const x1 = Math.min(imageData.width - 1, Math.ceil(rect.x + rect.width - 1));
  const y1 = Math.min(imageData.height - 1, Math.ceil(rect.y + rect.height - 1));
  const stepX = Math.max(1, Math.floor((x1 - x0) / 24));
  const stepY = Math.max(1, Math.floor((y1 - y0) / 24));
  for (let x = x0; x <= x1; x += stepX) {
    samples.push(getPixelRgb(imageData, x, y0));
    samples.push(getPixelRgb(imageData, x, y1));
  }
  for (let y = y0; y <= y1; y += stepY) {
    samples.push(getPixelRgb(imageData, x0, y));
    samples.push(getPixelRgb(imageData, x1, y));
  }
  return [
    Math.round(median(samples.map((s) => s[0]))),
    Math.round(median(samples.map((s) => s[1]))),
    Math.round(median(samples.map((s) => s[2]))),
  ];
}

export function inspectComponentRegion(imageData, rawBox, { scale = 2 } = {}) {
  const { width: imgW, height: imgH } = imageData || {};
  if (!imgW || !imgH) throw new Error("图像数据无效。");
  const dpr = Number(scale) > 0 ? Number(scale) : 1;

  const selX = Math.max(0, Math.min(imgW - 4, Math.round(rawBox.x)));
  const selY = Math.max(0, Math.min(imgH - 4, Math.round(rawBox.y)));
  const selW = Math.max(4, Math.min(imgW - selX, Math.round(rawBox.width)));
  const selH = Math.max(4, Math.min(imgH - selY, Math.round(rawBox.height)));

  const outerBg = estimatePerimeterBg(imageData, { x: selX, y: selY, width: selW, height: selH });
  const threshold = 24;

  const isForeground = (x, y) => colorDistance(getPixelRgb(imageData, x, y), outerBg) > threshold;

  // Row and column foreground counts inside selection
  const rowCounts = new Array(selH).fill(0);
  const colCounts = new Array(selW).fill(0);
  for (let dy = 0; dy < selH; dy++) {
    for (let dx = 0; dx < selW; dx++) {
      if (isForeground(selX + dx, selY + dy)) {
        rowCounts[dy]++;
        colCounts[dx]++;
      }
    }
  }

  const minRowPixels = Math.max(2, Math.floor(selW * 0.08));
  const minColPixels = Math.max(2, Math.floor(selH * 0.08));

  let top = 0;
  while (top < selH - 1 && rowCounts[top] < minRowPixels) top++;
  let bottom = selH - 1;
  while (bottom > top && rowCounts[bottom] < minRowPixels) bottom--;
  let left = 0;
  while (left < selW - 1 && colCounts[left] < minColPixels) left++;
  let right = selW - 1;
  while (right > left && colCounts[right] < minColPixels) right--;

  // Fallback to full selection if no inner boundary contrast found
  if (right - left < 6 || bottom - top < 6) {
    left = 0;
    top = 0;
    right = selW - 1;
    bottom = selH - 1;
  }

  const box = {
    x: selX + left,
    y: selY + top,
    width: right - left + 1,
    height: bottom - top + 1,
  };

  // Sample component fill color around quarter-points (avoiding dead center text and outer border)
  const fillSamples = [
    getPixelRgb(imageData, box.x + Math.floor(box.width * 0.5), box.y + Math.max(2, Math.floor(box.height * 0.18))),
    getPixelRgb(imageData, box.x + Math.floor(box.width * 0.5), box.y + Math.min(box.height - 3, Math.floor(box.height * 0.82))),
    getPixelRgb(imageData, box.x + Math.max(2, Math.floor(box.width * 0.12)), box.y + Math.floor(box.height * 0.5)),
    getPixelRgb(imageData, box.x + Math.min(box.width - 3, Math.floor(box.width * 0.88)), box.y + Math.floor(box.height * 0.5)),
  ];
  const fillRgb = [
    Math.round(median(fillSamples.map((s) => s[0]))),
    Math.round(median(fillSamples.map((s) => s[1]))),
    Math.round(median(fillSamples.map((s) => s[2]))),
  ];

  // Estimate corner radius from the 4 corners of the snapped box using exact arc equation R = x + y + sqrt(2xy)
  const maxCornerSearch = Math.floor(Math.min(box.width, box.height) * 0.5);
  const cornerThreshold = Math.max(24, colorDistance(fillRgb, outerBg) * 0.48);
  const isCornerInside = (x, y) => colorDistance(getPixelRgb(imageData, x, y), outerBg) > cornerThreshold;
  const cornerRadii = [];
  const corners = [
    { cx: box.x, cy: box.y, dx: 1, dy: 1 },
    { cx: box.x + box.width - 1, cy: box.y, dx: -1, dy: 1 },
    { cx: box.x, cy: box.y + box.height - 1, dx: 1, dy: -1 },
    { cx: box.x + box.width - 1, cy: box.y + box.height - 1, dx: -1, dy: -1 },
  ];

  for (const corner of corners) {
    if (isCornerInside(corner.cx, corner.cy)) {
      cornerRadii.push(0);
      continue;
    }
    const estimates = [];
    // 1. Diagonal scan: x = y = d + 0.25 -> R = (2 + sqrt(2)) * x
    let diagInset = 0;
    while (
      diagInset < maxCornerSearch
      && !isCornerInside(corner.cx + diagInset * corner.dx, corner.cy + diagInset * corner.dy)
    ) {
      diagInset++;
    }
    if (diagInset > 0) {
      const u = diagInset + 0.15;
      estimates.push((2 + Math.SQRT2) * u);
    }

    // 2. Multi-row chord scan: for small y offsets, find x where arc begins and apply R = x + y + sqrt(2xy)
    const maxSlice = Math.min(6, Math.max(2, diagInset + 1));
    for (let step = 1; step <= maxSlice; step++) {
      let spanX = 0;
      while (
        spanX < maxCornerSearch
        && !isCornerInside(corner.cx + spanX * corner.dx, corner.cy + step * corner.dy)
      ) {
        spanX++;
      }
      if (spanX > 0 && spanX < maxCornerSearch) {
        const x = spanX + 0.15;
        const y = step + 0.5;
        estimates.push(x + y + Math.sqrt(2 * x * y));
      }
    }
    cornerRadii.push(estimates.length ? median(estimates) : 0);
  }

  const physicalRadius = Math.min(Math.min(box.width, box.height) * 0.5, Math.max(0, median(cornerRadii)));

  // Estimate border thickness along top and bottom midpoints
  const midX = box.x + Math.floor(box.width * 0.5);
  let borderPx = 0;
  const maxBorderCheck = Math.min(8, Math.floor(box.height * 0.25));
  for (let offset = 0; offset < maxBorderCheck; offset++) {
    const px = getPixelRgb(imageData, midX, box.y + offset);
    if (colorDistance(px, fillRgb) > 22 && colorDistance(px, outerBg) > 22) {
      borderPx++;
    } else {
      break;
    }
  }

  // Estimate inner content bounding box (text/icons contrasting with fillRgb)
  const edgeInset = Math.max(borderPx + 2, 2);
  const cornerSkip = Math.ceil(physicalRadius) + borderPx + 2;
  const innerX0 = box.x + edgeInset;
  const innerX1 = box.x + box.width - 1 - edgeInset;
  const innerY0 = box.y + edgeInset;
  const innerY1 = box.y + box.height - 1 - edgeInset;

  let contentLeft = innerX1;
  let contentRight = innerX0;
  let contentTop = innerY1;
  let contentBottom = innerY0;
  let contentFound = 0;
  const contentColors = [];

  for (let y = innerY0; y <= innerY1; y++) {
    const dyTop = y - box.y;
    const dyBot = box.y + box.height - 1 - y;
    for (let x = innerX0; x <= innerX1; x++) {
      const dxLeft = x - box.x;
      const dxRight = box.x + box.width - 1 - x;
      if ((dxLeft < cornerSkip || dxRight < cornerSkip) && (dyTop < cornerSkip || dyBot < cornerSkip)) {
        continue;
      }
      const rgb = getPixelRgb(imageData, x, y);
      if (colorDistance(rgb, fillRgb) > 36) {
        contentFound++;
        if (x < contentLeft) contentLeft = x;
        if (x > contentRight) contentRight = x;
        if (y < contentTop) contentTop = y;
        if (y > contentBottom) contentBottom = y;
        if (contentColors.length < 200) contentColors.push(rgb);
      }
    }
  }

  const cssWidth = Math.max(1, Math.round(box.width / dpr));
  const cssHeight = Math.max(1, Math.round(box.height / dpr));
  const rawCssRadius = Math.round(physicalRadius / dpr);
  const isPill = rawCssRadius >= Math.floor(cssHeight * 0.45);
  const cssRadius = isPill ? Math.round(cssHeight * 0.5) : rawCssRadius;
  const cssBorder = Math.min(4, Math.round(borderPx / dpr));

  let cssPaddingX = Math.round(cssWidth * 0.12);
  let cssPaddingY = Math.round(cssHeight * 0.25);
  let cssFontSize = 14;

  if (contentFound >= 4 && contentRight > contentLeft && contentBottom > contentTop) {
    const padLeft = contentLeft - box.x;
    const padRight = box.x + box.width - 1 - contentRight;
    const padTop = contentTop - box.y;
    const padBottom = box.y + box.height - 1 - contentBottom;
    cssPaddingX = Math.max(0, Math.round(Math.min(padLeft, padRight) / dpr));
    cssPaddingY = Math.max(0, Math.round(Math.min(padTop, padBottom) / dpr));
    const rawContentH = (contentBottom - contentTop + 1) / dpr;
    if (cssHeight <= 68 && rawContentH <= cssHeight * 0.75) {
      cssFontSize = Math.max(11, Math.min(24, Math.round(rawContentH * 1.12)));
    }
  }

  const contentRgb = contentColors.length
    ? [
        Math.round(median(contentColors.map((c) => c[0]))),
        Math.round(median(contentColors.map((c) => c[1]))),
        Math.round(median(contentColors.map((c) => c[2]))),
      ]
    : (relativeLuminance(fillRgb) > 0.45 ? [38, 37, 34] : [250, 249, 245]);

  // Suggest closest component type in Component Lab
  const aspect = cssWidth / Math.max(1, cssHeight);
  let suggestedType = "button";
  if (cssHeight <= 64 && aspect >= 4.2 && cssBorder >= 1) suggestedType = "input";
  else if (cssHeight <= 64 && aspect >= 5.5) suggestedType = "row";
  else if (cssHeight > 90 && cssWidth >= 360) suggestedType = "modal";
  else if (cssHeight > 90 && aspect < 1.1) suggestedType = "sidebar";
  else if (cssHeight > 72) suggestedType = "card";

  return {
    snappedBox: box,
    scale: dpr,
    css: {
      width: cssWidth,
      height: cssHeight,
      radius: cssRadius,
      isPill,
      border: cssBorder,
      paddingX: cssPaddingX,
      paddingY: cssPaddingY,
      fontSize: cssFontSize,
    },
    colors: {
      outerBg: rgbToHex(...outerBg),
      fillColor: rgbToHex(...fillRgb),
      contentColor: rgbToHex(...contentRgb),
    },
    suggestedType,
  };
}
