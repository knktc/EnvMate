const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "options/options.html"), "utf8");
const css = fs.readFileSync(path.join(root, "options/options.css"), "utf8");
const script = fs.readFileSync(path.join(root, "options/options.js"), "utf8");
const tabDisplayConfigScript = fs.readFileSync(path.join(root, "src/tab-display-config.js"), "utf8");
const enMessages = JSON.parse(fs.readFileSync(path.join(root, "_locales/en/messages.json"), "utf8"));
const zhMessages = JSON.parse(fs.readFileSync(path.join(root, "_locales/zh_CN/messages.json"), "utf8"));

test("tab management uses the compact editor and favicon popover contract", () => {
  [
    "tab-favicon-button",
    "tab-favicon-popover",
    "tab-favicon-tab-emoji",
    "tab-favicon-tab-preset",
    "tab-favicon-tab-upload",
    "tab-upload-dropzone",
    "tab-upload-dropzone-icon",
    "tab-upload-dropzone-title",
    "tab-upload-dropzone-hint",
    "tab-upload-status",
    "tab-upload-reselect",
    "tab-upload-preview",
    "tab-upload-preview-image",
    "tab-emoji-custom",
    "tab-emoji-custom-status",
    "env-title-prefix",
    "env-title-override",
    "tab-title-warning",
    "tab-display-preview",
    "tab-display-preview-surface",
    "tab-browser-preview",
    "tab-browser-preview-context-icon",
    "tab-browser-preview-active-tab",
    "tab-browser-preview-favicon",
    "tab-browser-preview-title",
    "tab-browser-preview-close",
    "tab-browser-preview-plus"
  ].forEach((id) => assert.match(html, new RegExp(`id=["']${id}["']`)));

  assert.doesNotMatch(html, /env-favicon-enabled|env-favicon-source|tab-display-effect/);
  assert.doesNotMatch(html, /tab-emoji-search|emojiSearch/);
  assert.doesNotMatch(html, /tab-upload-button|class="file-button tab-upload-button"/);
  assert.doesNotMatch(html, /id="tab-emoji-custom"[^>]*maxlength/);
  assert.match(html, /id="tab-upload-dropzone"[^>]*role="button"[^>]*tabindex="0"/);
  assert.match(html, /id="tab-favicon-file"[^>]*accept="image\/png,image\/jpeg,image\/webp"[^>]*hidden/);
  assert.match(html, /data-i18n-placeholder="emojiCustomPlaceholder"/);
  assert.match(html, /data-i18n="emojiCustomHint"/);
  assert.equal(enMessages.titlePrefixPlaceholder.message, "[PREFIX]");
  assert.equal(zhMessages.titlePrefixPlaceholder.message, "[前缀]");
  assert.match(css, /\.field \.emoji-custom-hint/);
  assert.match(css, /\.emoji-custom-hint\.is-error/);
  assert.doesNotMatch(html, /marker-preview__header|marker-preview__title|marker-preview__meta/);
  assert.doesNotMatch(html, /tab-browser-preview__toolbar|tab-browser-preview__address|tab-browser-preview__page/);
  assert.doesNotMatch(css, /tab-browser-preview__(toolbar|address|page)/);
  assert.match(html, /tab-browser-preview__strip/);
  assert.match(html, /tab-browser-preview__context-tab/);
  assert.match(html, /tab-browser-preview__active-tab/);
  assert.match(html, /tab-browser-preview__control/);
  assert.match(html, /class="marker-preview"/);
  assert.match(html, /aria-haspopup="dialog"/);
  assert.match(html, /aria-controls="tab-favicon-popover"/);
  assert.match(html, /tab-title-warning-icon/);
  assert.doesNotMatch(html, /tab-title-warning[^>]*>[\s\S]*⚠/);
  assert.match(script, /function setFaviconPopoverOpen\(/);
  assert.match(script, /setFaviconPopoverOpen\(!faviconPopoverOpen\)/);
  assert.match(script, /triangleAlert/);
  assert.doesNotMatch(script, /emojiSearch/);
  assert.match(script, /TAB_DISPLAY_CONFIG\.isSingleEmoji/);
  assert.match(script, /function applyCustomEmoji\(/);
  assert.match(script, /if \(!candidate\) \{[\s\S]*setEmojiCustomError\(false\)/);
  assert.match(script, /"emojiCustomError"/);
  assert.match(script, /t\(hasError \? "emojiCustomError" : "emojiCustomHint"\)/);
  assert.match(script, /setAttribute\("aria-invalid", String\(hasError\)\)/);
  assert.match(script, /function renderTabDisplayPreview\(/);
  assert.match(script, /favicon: \{ enabled: false \}/);
  assert.doesNotMatch(script, /prefixConfigured|setPrefixConfigured|isPrefixConfigured/);
  assert.match(script, /TAB_DISPLAY_CONFIG\.initializePrefix\(title, "\[\]"\)/);
  assert.match(script, /TAB_DISPLAY_CONFIG\.schedulePrefixCaret\(/);
  assert.match(tabDisplayConfigScript, /setSelectionRange\(1, 1\)/);
  assert.match(html, /<option value="solid-rounded-square" data-i18n="presetSolidRoundedSquare">Square<\/option>/);
  assert.match(html, /<option value="solid-circle" data-i18n="presetSolidCircle">Circle<\/option>/);
  assert.equal(enMessages.presetSolidRoundedSquare.message, "Square");
  assert.equal(enMessages.presetSolidCircle.message, "Circle");
  assert.equal(zhMessages.presetSolidRoundedSquare.message, "方形");
  assert.equal(zhMessages.presetSolidCircle.message, "圆形");
  assert.equal(enMessages.uploadFaviconDropzone.message, "Drag an image here, or choose a file");
  assert.equal(enMessages.uploadFaviconDropzoneHint.message, "PNG, JPEG, or WebP · max 2 MB");
  assert.equal(enMessages.uploadFaviconProcessing.message, "Processing image…");
  assert.equal(enMessages.uploadFaviconReselect.message, "Choose another");
  assert.equal(enMessages.websiteFavicon.message, "Original");
  assert.equal(enMessages.customTitlePlaceholder.message, "Keep original title");
  assert.equal(zhMessages.websiteFavicon.message, "原图标");
  assert.equal(zhMessages.customTitlePlaceholder.message, "保留网页原始标题");
  assert.match(html, /id="tab-favicon-button-original"[^>]*data-i18n="websiteFavicon">Original<\/span>/);
  assert.match(script, /nodes\.uploadDropzonePreviewImage\.alt = "";/);
  assert.doesNotMatch(script, /uploadDropzonePreviewImage\.alt = success \? t\("websiteFavicon"\)/);
  assert.equal(zhMessages.uploadFaviconDropzone.message, "拖拽图片到这里，或点击选择文件");
  assert.equal(zhMessages.uploadFaviconDropzoneHint.message, "支持 PNG、JPEG、WebP，最大 2 MB");
  assert.equal(zhMessages.uploadFaviconProcessing.message, "正在处理图片…");
  assert.equal(zhMessages.uploadFaviconReselect.message, "重新选择");
  assert.match(css, /\.tab-upload-dropzone\.is-dragover/);
  assert.match(css, /\.tab-upload-dropzone__preview/);
  const uploadDropzoneStyleStart = css.indexOf(".tab-upload-dropzone {");
  const uploadDropzoneStyleEnd = css.indexOf(".tab-favicon-reset", uploadDropzoneStyleStart);
  assert.ok(uploadDropzoneStyleStart >= 0 && uploadDropzoneStyleEnd > uploadDropzoneStyleStart, "upload dropzone styles should exist");
  const uploadDropzoneStyles = css.slice(uploadDropzoneStyleStart, uploadDropzoneStyleEnd);
  assert.match(uploadDropzoneStyles, /grid-template-columns:\s*40px\s+minmax\(0, 1fr\)/);
  assert.doesNotMatch(uploadDropzoneStyles, /grid-template-columns:\s*36px\s+minmax\(0, 1fr\)\s+auto/);
  assert.match(uploadDropzoneStyles, /\.tab-upload-dropzone__copy\s*\{[\s\S]*grid-column:\s*2[\s\S]*grid-row:\s*1/);
  assert.match(uploadDropzoneStyles, /\.tab-upload-dropzone__icon,\s*\.tab-upload-dropzone__preview\s*\{[\s\S]*grid-column:\s*1[\s\S]*grid-row:\s*1/);

  const previewStart = script.indexOf("function renderTabDisplayPreview(");
  const editorStart = script.indexOf("function renderTabDisplayEditor(", previewStart);
  assert.ok(previewStart >= 0 && editorStart > previewStart, "tab preview renderer should exist");
  assert.doesNotMatch(script.slice(previewStart, editorStart), /homepageUrl|tabBrowserPreviewAddress|toolbar|page/);

  const builderStart = script.indexOf("function buildPreviewCanvas()");
  const rendererStart = script.indexOf("function renderMarkerPreviews()", builderStart);
  assert.ok(builderStart >= 0 && rendererStart > builderStart, "badge/watermark builder should exist");
  const builder = script.slice(builderStart, rendererStart);
  assert.match(builder, /marker-preview__chrome/);
  assert.match(builder, /marker-preview__viewport/);
  assert.match(builder, /marker-preview__body/);
  assert.doesNotMatch(builder, /marker-preview__header|marker-preview__title|marker-preview__meta|Example Console|badgeConfig|watermarkConfig/);
  const renderer = script.slice(rendererStart, script.indexOf("function renderForm()", rendererStart));
  assert.match(renderer, /renderPreviewBadge\(badgePreview\.viewport/);
  assert.match(renderer, /renderPreviewWatermark\(watermarkPreview\.viewport/);
});

test("tab preview omits its status pill and keeps the disabled preview treatment", () => {
  const previewHead = html.match(/<div id="tab-display-preview"[^>]*>\s*<div class="marker-preview__head">([\s\S]*?)<\/div>/);
  assert.ok(previewHead, "tab preview header should exist");
  assert.match(previewHead[1], /data-i18n="tabDisplayPreview"/);
  assert.doesNotMatch(previewHead[1], /tab-display-preview-state/);
  assert.doesNotMatch(html, /id=["']tab-display-preview-state["']/);
  assert.doesNotMatch(script, /tabDisplayPreviewState/);

  const previewStart = script.indexOf("function renderTabDisplayPreview(");
  const editorStart = script.indexOf("function renderTabDisplayEditor(", previewStart);
  assert.ok(previewStart >= 0 && editorStart > previewStart, "tab preview renderer should exist");
  const renderer = script.slice(previewStart, editorStart);
  assert.doesNotMatch(renderer, /tabDisplayPreviewEnabled|tabDisplayPreviewDisabled/);
  assert.match(renderer, /nodes\.tabBrowserPreview\.classList\.toggle\("is-disabled", !enabled\)/);
  assert.match(css, /\.tab-browser-preview\.is-disabled/);
  assert.doesNotMatch(css, /\.tab-display-preview__state/);
  assert.equal(enMessages.tabDisplayPreviewEnabled, undefined);
  assert.equal(enMessages.tabDisplayPreviewDisabled, undefined);
  assert.equal(zhMessages.tabDisplayPreviewEnabled, undefined);
  assert.equal(zhMessages.tabDisplayPreviewDisabled, undefined);
});

test("switching favicon source tabs does not itself enable a favicon", () => {
  const sourceTabHandler = script.match(/nodes\.faviconTabs\.forEach\(\(tab\) => \{\n\s+bindNodeEvent\(tab, "click", \(\) => \{([\s\S]*?)\n\s+\}\);\n\}\);/);
  assert.ok(sourceTabHandler, "source tab handler should exist");
  assert.doesNotMatch(sourceTabHandler[1], /updateTabDisplay/);
  assert.match(script, /selected\.tabDisplay\.favicon = \{ enabled: true, source: "emoji"/);
  assert.match(script, /favicon: \{ enabled: true, source: "preset"/);
  assert.match(script, /favicon: \{ enabled: true, source: "upload"/);
  assert.match(script, /favicon: \{ enabled: true, source: "preset", type: selectedPresetType\(\), value \}/);
});

test("upload dropzone shares file processing across click, keyboard, and drag events", () => {
  assert.match(script, /applyIconOnlyNode\(nodes\.uploadDropzoneIcon, "upload", "tab-upload-dropzone__svg"\)/);
  assert.match(script, /function handleUploadFileSelection\(files\)/);
  assert.match(script, /bindNodeEvent\(nodes\.uploadDropzone, "click", \(\) => \{[\s\S]*nodes\.faviconFile\?\.click\(\)/);
  assert.match(script, /bindNodeEvent\(nodes\.uploadDropzone, "keydown", \(event\) => \{[\s\S]*\["Enter", " ", "Spacebar"\]/);
  assert.match(script, /bindNodeEvent\(nodes\.uploadDropzone, "dragover", \(event\) => \{[\s\S]*event\.preventDefault\(\)/);
  assert.match(script, /bindNodeEvent\(nodes\.uploadDropzone, "drop", async \(event\) => \{[\s\S]*event\.preventDefault\(\)[\s\S]*handleUploadFileSelection\(event\.dataTransfer\?\.files\)/);
  assert.match(script, /bindNodeEvent\(nodes\.faviconFile, "change", async \(\) => \{[\s\S]*handleUploadFileSelection\(nodes\.faviconFile\.files\)/);
  assert.match(script, /clearUploadDropzoneDragState\(\)/);
  assert.match(tabDisplayConfigScript, /function selectSingleUploadFile\(files\)/);

  const processStart = script.indexOf("async function processUploadedFavicon(");
  const processEnd = script.indexOf("\nasync function handleUploadFileSelection(", processStart);
  assert.ok(processStart >= 0 && processEnd > processStart, "upload processing helper should exist");
  const process = script.slice(processStart, processEnd);
  assert.match(process, /normalizeUploadedFavicon\(file\)/);
  assert.match(process, /updateTabDisplay\(environment, \{ favicon: \{ enabled: true, source: "upload"/);
  const errorBranch = process.slice(process.indexOf("} catch (error)"));
  assert.doesNotMatch(errorBranch, /updateTabDisplay/);
});

test("opens the favicon popover on the configured enabled source without replacing the favicon", () => {
  const openStart = script.indexOf("function setFaviconPopoverOpen(");
  const openEnd = script.indexOf("\nfunction renderEmojiPicker(", openStart);
  assert.ok(openStart >= 0 && openEnd > openStart, "favicon popover opener should exist");
  const opener = script.slice(openStart, openEnd);
  assert.match(opener, /if \(nextOpen\) \{\s*const favicon = tabDisplayFavicon\(selectedEnvironment\(\)\);\s*activeFaviconSource = TAB_DISPLAY_CONFIG\.preferredFaviconSource\(favicon\);\s*syncTabDisplayControls\(selectedEnvironment\(\)\);/);
  assert.match(tabDisplayConfigScript, /function preferredFaviconSource\(favicon\)/);
  assert.doesNotMatch(opener, /updateTabDisplay|selected\.tabDisplay\.favicon/);

  const syncStart = script.indexOf("function syncTabDisplayControls(");
  const syncEnd = script.indexOf("\nfunction updateTabDisplay(", syncStart);
  assert.ok(syncStart >= 0 && syncEnd > syncStart, "tab display sync should exist");
  const sync = script.slice(syncStart, syncEnd);
  assert.match(sync, /const source = faviconPopoverOpen \? activeFaviconSource : configuredSource/);
  assert.match(sync, /nodes\.emojiCustom\.value = favicon\.source === "emoji" \? String\(favicon\.value \|\| ""\) : ""/);
  assert.match(sync, /const sourceFavicon = favicon\.source === source \? favicon : \{[\s\S]*enabled: false/);
});

test("keeps the familiar emoji options and expands the fixed grid without duplicates", () => {
  const optionsStart = script.indexOf("const TAB_EMOJI_OPTIONS = [");
  const optionsEnd = script.indexOf("];", optionsStart);
  assert.ok(optionsStart >= 0 && optionsEnd > optionsStart, "emoji options should be declared");
  const entries = [...script.slice(optionsStart, optionsEnd).matchAll(/\["([^\"]+)",\s*"([^\"]+)"\]/g)];
  const emojis = entries.map(([, emoji]) => emoji);
  assert.ok(emojis.length <= 48, `expected at most 48 emoji options, got ${emojis.length}`);
  assert.equal(new Set(emojis).size, emojis.length, "emoji options should not repeat");
  ["🚧", "🚀", "🧑‍💻", "💻", "🖥️", "🌐", "🟩", "🟥", "🐛", "⚙️", "📊", "🔑"].forEach((emoji) => {
    assert.ok(emojis.includes(emoji), `${emoji} should be available`);
  });
});

test("keeps the favicon preset palette complete and unique", () => {
  const presetsStart = script.indexOf("const TAB_FAVICON_COLOR_PRESETS = [");
  const presetsEnd = script.indexOf("];", presetsStart);
  assert.ok(presetsStart >= 0 && presetsEnd > presetsStart, "favicon preset palette should be declared");
  const colors = [...script.slice(presetsStart, presetsEnd).matchAll(/"(#[0-9a-f]{6})"/gi)].map(([, color]) => color.toLowerCase());
  assert.equal(colors.length, 10);
  assert.equal(new Set(colors).size, colors.length, "favicon preset colors should not repeat");
  assert.deepEqual(colors, [
    "#2563eb", "#059669", "#dc2626", "#7c3aed", "#ea580c",
    "#0f766e", "#db2777", "#0f172a", "#ca8a04", "#64748b"
  ]);
  assert.match(script, /renderColorSwatches\(nodes\.presetColorSwatches, TAB_FAVICON_COLOR_PRESETS, sourceFavicon\.value, \(color\) => \{/);
  assert.match(script, /source: "preset", type: selectedPresetType\(\), value: color/);
});

test("keeps quick navigation and the focused form section on one active highlight", () => {
  const syncStart = script.indexOf("function syncRailNav()");
  const syncEnd = script.indexOf("\nfunction navSections()", syncStart);
  assert.ok(syncStart >= 0 && syncEnd > syncStart, "rail navigation sync should exist");
  const sync = script.slice(syncStart, syncEnd);
  assert.match(sync, /querySelectorAll\("\.form-section"\)/);
  assert.match(sync, /classList\.toggle\("is-nav-active", section\.id === activeSectionId\)/);

  const focusHandlerStart = script.indexOf('bindNodeEvent(nodes.form, "focusin"');
  const focusHandlerEnd = script.indexOf("\n\nwindow.addEventListener(", focusHandlerStart);
  assert.ok(focusHandlerStart >= 0 && focusHandlerEnd > focusHandlerStart, "form focus handler should exist");
  const focusHandler = script.slice(focusHandlerStart, focusHandlerEnd);
  assert.match(focusHandler, /closest\?\.\("\.form-section"\)/);
  assert.match(focusHandler, /activeSectionId = section\.id/);
  assert.match(focusHandler, /syncRailNav\(\)/);

  assert.match(css, /\.form-section:focus-within,\s*\.form-section\.is-nav-active\s*\{/);
  assert.match(css, /\.form-section:focus-within::after,\s*\.form-section\.is-nav-active::after\s*\{[\s\S]*?envmate-section-focus-breathe/);
  assert.match(css, /\.form-section:focus-within:not\(\.is-nav-active\)::after/);
  const reducedMotionStart = css.indexOf("@media (prefers-reduced-motion: reduce)");
  assert.ok(reducedMotionStart >= 0, "reduced-motion rule should exist");
  assert.match(css.slice(reducedMotionStart), /\.form-section:focus-within::after,\s*\.form-section\.is-nav-active::after/);
});
