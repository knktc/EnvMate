const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(root, "options/options.css"), "utf8");
const script = fs.readFileSync(path.join(root, "options/options.js"), "utf8");

test("watermark preview layers the configured mark over a subdued clipped page skeleton", () => {
  const viewportStart = css.indexOf(".marker-preview__viewport {");
  const viewportEnd = css.indexOf(".marker-preview__body {", viewportStart);
  assert.ok(viewportStart >= 0 && viewportEnd > viewportStart, "watermark preview viewport styles should exist");
  const viewportStyles = css.slice(viewportStart, viewportEnd);
  assert.match(viewportStyles, /overflow:\s*hidden/);
  assert.match(viewportStyles, /isolation:\s*isolate/);

  const watermarkStart = css.indexOf(".marker-preview__watermark {");
  const watermarkEnd = css.indexOf(".marker-preview__watermark-grid {", watermarkStart);
  assert.ok(watermarkStart >= 0 && watermarkEnd > watermarkStart, "watermark layer styles should exist");
  const watermarkStyles = css.slice(watermarkStart, watermarkEnd);
  assert.match(watermarkStyles, /inset:\s*0/);
  assert.match(watermarkStyles, /z-index:\s*2/);
  assert.match(watermarkStyles, /overflow:\s*hidden/);
  assert.doesNotMatch(watermarkStyles, /opacity:/);

  const watermarkSkeletonStart = css.indexOf(".marker-preview__canvas--watermark .marker-preview__viewport {");
  const watermarkSkeletonEnd = css.indexOf(".marker-preview__watermark {", watermarkSkeletonStart);
  assert.ok(
    watermarkSkeletonStart >= 0 && watermarkSkeletonEnd > watermarkSkeletonStart,
    "watermark preview should scope its subdued skeleton styles"
  );
  const watermarkSkeletonStyles = css.slice(watermarkSkeletonStart, watermarkSkeletonEnd);
  assert.match(watermarkSkeletonStyles, /\.marker-preview__canvas--watermark \.marker-preview__panel[\s\S]*background:\s*rgba\(/);
  assert.match(watermarkSkeletonStyles, /\.marker-preview__canvas--watermark \.marker-preview__metric[\s\S]*rgba\(/);
  assert.doesNotMatch(css.slice(0, watermarkSkeletonStart), /\.marker-preview__canvas--watermark/);

  const rendererStart = script.indexOf("function renderMarkerPreviews()");
  const rendererEnd = script.indexOf("function renderForm()", rendererStart);
  assert.ok(rendererStart >= 0 && rendererEnd > rendererStart, "marker preview renderer should exist");
  const renderer = script.slice(rendererStart, rendererEnd);
  assert.match(renderer, /const watermarkPreview = buildPreviewCanvas\(\);/);
  assert.match(renderer, /watermarkPreview\.canvas\.classList\.add\("marker-preview__canvas--watermark"\)/);
  assert.match(renderer, /renderPreviewWatermark\(watermarkPreview\.viewport, watermarkText, environment\)/);

  const watermarkRendererStart = script.indexOf("function renderPreviewWatermark(");
  const watermarkRendererEnd = script.indexOf("function renderPreviewBadge(", watermarkRendererStart);
  assert.ok(
    watermarkRendererStart >= 0 && watermarkRendererEnd > watermarkRendererStart,
    "watermark renderer should exist"
  );
  const watermarkRenderer = script.slice(watermarkRendererStart, watermarkRendererEnd);
  [
    "environment.watermarkColor",
    "environment.watermarkOpacity",
    "environment.watermarkAngle",
    "environment.watermarkSize",
    "environment.watermarkGap"
  ].forEach((property) => assert.match(watermarkRenderer, new RegExp(property.replace(".", "\\."))));
});
