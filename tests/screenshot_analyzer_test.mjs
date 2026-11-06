import assert from "node:assert/strict";
import {
  extractPaletteFromImageData,
  inspectComponentRegion,
  samplePixelHex,
} from "../screenshot-analyzer.js";

function createCanvasImage(width, height, bgRgb = [255, 254, 251]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = bgRgb[0];
    data[i * 4 + 1] = bgRgb[1];
    data[i * 4 + 2] = bgRgb[2];
    data[i * 4 + 3] = 255;
  }
  return { width, height, data };
}

function setPixel(img, x, y, rgb) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const idx = (y * img.width + x) * 4;
  img.data[idx] = rgb[0];
  img.data[idx + 1] = rgb[1];
  img.data[idx + 2] = rgb[2];
  img.data[idx + 3] = 255;
}

function fillRoundedRect(img, rect, radius, rgb) {
  const { x, y, width, height } = rect;
  const r = Math.min(radius, Math.floor(Math.min(width, height) / 2));
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      let inside = true;
      if (dx < r && dy < r) {
        inside = Math.hypot(r - dx - 0.5, r - dy - 0.5) <= r;
      } else if (dx >= width - r && dy < r) {
        inside = Math.hypot(dx - (width - r) + 0.5, r - dy - 0.5) <= r;
      } else if (dx < r && dy >= height - r) {
        inside = Math.hypot(r - dx - 0.5, dy - (height - r) + 0.5) <= r;
      } else if (dx >= width - r && dy >= height - r) {
        inside = Math.hypot(dx - (width - r) + 0.5, dy - (height - r) + 0.5) <= r;
      }
      if (inside) setPixel(img, x + dx, y + dy, rgb);
    }
  }
}

// 1. Test palette extraction from a synthetic screenshot
// Background: #FAF9F5, Primary text: #262522, Muted text: #716D66, Accent button: #315F9E
const img = createCanvasImage(400, 300, [250, 249, 245]);
// Draw dark text blocks (#262522)
fillRoundedRect(img, { x: 40, y: 30, width: 220, height: 40 }, 0, [38, 37, 34]);
// Draw muted blocks (#716D66)
fillRoundedRect(img, { x: 40, y: 80, width: 180, height: 28 }, 0, [113, 109, 102]);
// Draw accent button at @2x: CSS 140x44, radius 8px, paddingX 18px -> physical 280x88, radius 16px, paddingX 36px
fillRoundedRect(img, { x: 60, y: 140, width: 280, height: 88 }, 16, [49, 95, 158]);
// Draw button label inside button: physical left=60+36=96, width=280-72=208, top=140+30=170, height=28 (CSS 14px text)
fillRoundedRect(img, { x: 96, y: 170, width: 208, height: 28 }, 0, [255, 254, 251]);

const extracted = extractPaletteFromImageData(img);
assert.equal(extracted.roles.pageColor, "#FAF9F5", "dominant background mapped to pageColor");
assert.equal(extracted.roles.textColor, "#262522", "high-contrast dark cluster mapped to textColor");
assert.equal(extracted.roles.accentColor, "#315F9E", "high-chroma cluster mapped to accentColor");
assert.equal(extracted.roles.mutedColor, "#716D66", "mid-tone cluster mapped to mutedColor");
assert.ok(extracted.swatches.length >= 4);
assert.equal(samplePixelHex(img, 100, 150), "#315F9E");

// 2. Test component geometry inspection with loose selection box around the @2x button
const looseSelection = { x: 42, y: 124, width: 316, height: 120 };
const inspection = inspectComponentRegion(img, looseSelection, { scale: 2 });

assert.deepEqual(inspection.snappedBox, { x: 60, y: 140, width: 280, height: 88 }, "edges snap tightly to button bounds");
assert.equal(inspection.css.width, 140, "CSS width at @2x is 140px");
assert.equal(inspection.css.height, 44, "CSS height at @2x is 44px");
assert.ok(Math.abs(inspection.css.radius - 8) <= 1, `estimated CSS radius (${inspection.css.radius}px) is within 1px of 8px`);
assert.equal(inspection.css.paddingX, 18, "CSS horizontal padding is 18px");
assert.ok(Math.abs(inspection.css.fontSize - 16) <= 2, "estimated CSS fontSize is reasonable");
assert.equal(inspection.colors.fillColor, "#315F9E");
assert.equal(inspection.suggestedType, "button");

console.log("screenshot analyzer tests passed: palette clustering, role assignment, edge snapping, radius fitting, inner padding");
