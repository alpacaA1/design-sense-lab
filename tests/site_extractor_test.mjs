import assert from "node:assert/strict";
import {
  createDemoSiteReport,
  getBookmarkletHref,
  getConsoleExtractorScript,
  mapSiteReportToDocumentValues,
  parseSiteStyleInput,
} from "../site-extractor.js";

// 1. Test bookmarklet and console script generation
const script = getConsoleExtractorScript();
assert.ok(script.includes("getComputedStyle"));
assert.ok(getBookmarkletHref().startsWith("javascript:"));

// 2. Test parsing structured JSON report from bookmarklet/console
const demo = createDemoSiteReport();
const report = parseSiteStyleInput(JSON.stringify(demo));
assert.equal(report.site.title, "Linear / Editorial Docs 示例站点");
assert.equal(report.colors.pageColor, "#FBFBF9");
assert.equal(report.colors.accentColor, "#2E5A88");
assert.equal(report.typography.bodySize, 15);
assert.equal(report.typography.typeScaleRatio, Number((38 / 15).toFixed(2)));
assert.equal(report.components.button.height, 36);
assert.equal(report.components.button.radius, 6);

// 3. Test mapping site report to Document Studio values
const docValues = mapSiteReportToDocumentValues(report);
assert.equal(docValues.fontFamily, "sans");
assert.equal(docValues.bodySize, 15);
assert.equal(docValues.titleSize, 38);
assert.equal(docValues.radius, 6);
assert.equal(docValues.accentColor, "#2E5A88");

// 4. Test parsing raw CSS / :root variables snippet
const cssSnippet = `
:root {
  --bg-canvas: #f7f6f2;
  --text-primary: #1f1e1c;
  --text-muted: #6e6a63;
  --brand-accent: #2b5b84;
}
body { font-size: 16px; }
h2 { font-size: 22px; }
h1 { font-size: 40px; }
.btn { border-radius: 8px; }
`;
const fromCss = parseSiteStyleInput(cssSnippet);
assert.equal(fromCss.colors.pageColor, "#F7F6F2");
assert.equal(fromCss.colors.textColor, "#1F1E1C");
assert.equal(fromCss.colors.mutedColor, "#6E6A63");
assert.equal(fromCss.colors.accentColor, "#2B5B84");
assert.equal(fromCss.typography.bodySize, 16);
assert.equal(fromCss.typography.sectionTitleSize, 22);
assert.equal(fromCss.typography.titleSize, 40);
assert.equal(fromCss.components.button.radius, 8);

console.log("site extractor tests passed: script generation, JSON report parsing, CSS snippet parsing, document mapping");
