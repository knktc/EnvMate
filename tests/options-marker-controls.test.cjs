const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "options/options.html"), "utf8");
const css = fs.readFileSync(path.join(root, "options/options.css"), "utf8");
const optionsSource = fs.readFileSync(path.join(root, "options/options.js"), "utf8");

function extractFunction(name) {
  const start = optionsSource.indexOf("function " + name + "(");
  assert.ok(start >= 0, name + " should be defined in options.js");

  const openBrace = optionsSource.indexOf("{", start);
  let depth = 0;
  for (let index = openBrace; index < optionsSource.length; index += 1) {
    if (optionsSource[index] === "{") depth += 1;
    if (optionsSource[index] === "}") {
      depth -= 1;
      if (depth === 0) return optionsSource.slice(start, index + 1);
    }
  }

  assert.fail(name + " should have a complete function body");
}

function loadFunctions(names, globals) {
  const context = vm.createContext({ ...globals });
  const source = [
    ...names.map(extractFunction),
    ...names.map((name) => "globalThis." + name + " = " + name + ";")
  ].join("\n\n");
  vm.runInContext(source, context, { filename: "options/options.js" });
  return context;
}

function bindMarkerToggleHandlers(context) {
  const start = optionsSource.indexOf('bindNodeEvent(nodes.badgeEnabled, "change"');
  const end = optionsSource.indexOf('bindNodeEvent(nodes.enabled, "change"', start);
  assert.ok(start >= 0 && end > start, "marker toggle handlers should be bound");
  vm.runInContext(optionsSource.slice(start, end), context, { filename: "options/options.js" });
}

function divMarkupById(id) {
  const openingStart = html.indexOf('<div id="' + id + '"');
  assert.ok(openingStart >= 0, id + " container should exist");
  const openingEnd = html.indexOf(">", openingStart);
  const tags = /<\/?div\b[^>]*>/g;
  tags.lastIndex = openingEnd + 1;
  let depth = 1;
  let match;
  while ((match = tags.exec(html))) {
    if (match[0].startsWith("</")) depth -= 1;
    else depth += 1;
    if (depth === 0) return html.slice(openingStart, tags.lastIndex);
  }
  assert.fail(id + " container should be closed");
}

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  toggle(name, force) {
    const shouldAdd = force === undefined ? !this.values.has(name) : Boolean(force);
    if (shouldAdd) this.values.add(name);
    else this.values.delete(name);
    return shouldAdd;
  }

  contains(name) {
    return this.values.has(name);
  }
}

class FakeElement {
  constructor(id, tagName = "div", value = "") {
    this.id = id;
    this.tagName = tagName.toLowerCase();
    this.value = value;
    this.disabled = false;
    this.checked = false;
    this.hidden = false;
    this.children = [];
    this.attributes = new Map();
    this.listeners = new Map();
    this.classList = new FakeClassList();
    this.style = { setProperty() {} };
    this._innerHTML = "";
  }

  set innerHTML(value) {
    this._innerHTML = value;
    this.children = [];
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set value(value) {
    this._value = String(value);
  }

  get value() {
    return this._value;
  }

  append(...children) {
    children.forEach((child) => {
      child.parentElement = this;
      this.children.push(child);
    });
  }

  querySelectorAll(selector) {
    const acceptedTags = new Set(selector.split(",").map((tag) => tag.trim().toLowerCase()));
    const matches = [];
    const visit = (node) => {
      node.children.forEach((child) => {
        if (acceptedTags.has(child.tagName)) matches.push(child);
        visit(child);
      });
    };
    visit(this);
    return matches;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) || [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }

  fire(type) {
    for (const handler of this.listeners.get(type) || []) handler({ target: this });
  }
}

function makeNode(id, tagName, value) {
  return new FakeElement(id, tagName, value);
}

function makeHarness() {
  const environment = {
    id: "environment-1",
    groupId: "default",
    name: "Staging",
    homepageUrl: "https://staging.example.com/",
    enabled: true,
    badge: "STAGE",
    badgeEnabled: false,
    badgeColor: "#123456",
    badgeTextColor: "#abcdef",
    badgeStyle: "pill",
    badgePosition: "bottom-left",
    badgeScale: 1.2,
    badgeSize: 22,
    badgeOpacity: 0.75,
    watermarkEnabled: false,
    watermarkText: "STAGE",
    watermarkColor: "#654321",
    watermarkOpacity: 0.14,
    watermarkAngle: -20,
    watermarkSize: 44,
    watermarkGap: 100,
    tabDisplay: { enabled: false },
    rules: [],
    accounts: []
  };

  const nodes = {
    form: makeNode("environment-form", "form"),
    toolbox: makeNode("workspace-toolbox"),
    deleteEnvironment: makeNode("delete-environment", "button"),
    addRule: makeNode("add-rule", "button"),
    addAccount: makeNode("add-account", "button"),
    enabled: makeNode("env-enabled", "input"),
    tabDisplayEnabled: makeNode("env-tab-display-enabled", "input"),
    save: makeNode("save-config", "button"),
    sectionNavButtons: [],
    name: makeNode("env-name", "input"),
    group: makeNode("env-group", "select"),
    homepageUrl: makeNode("env-homepage-url", "input"),
    badge: makeNode("env-badge", "input"),
    badgeEnabled: makeNode("env-badge-enabled", "input"),
    watermarkEnabled: makeNode("env-watermark-enabled", "input"),
    watermarkText: makeNode("env-watermark-text", "input"),
    badgeLayout: makeNode("badge-layout"),
    watermarkLayout: makeNode("watermark-layout"),
    badgeColor: makeNode("badge-color", "input", "#123456"),
    badgeColorSwatches: makeNode("badge-color-swatches"),
    badgeTextColor: makeNode("badge-text-color", "input", "#abcdef"),
    badgeTextColorSwatches: makeNode("badge-text-color-swatches"),
    badgePosition: makeNode("badge-position", "select", "bottom-left"),
    badgeScale: makeNode("badge-scale", "input", "1.2"),
    badgeSize: makeNode("badge-size", "input", "22"),
    badgeOpacity: makeNode("badge-opacity", "input", "0.75"),
    watermarkColor: makeNode("watermark-color", "input", "#654321"),
    watermarkColorSwatches: makeNode("watermark-color-swatches"),
    watermarkOpacity: makeNode("watermark-opacity", "input", "0.14"),
    watermarkAngle: makeNode("watermark-angle", "input", "-20"),
    watermarkSize: makeNode("watermark-size", "input", "44"),
    watermarkGap: makeNode("watermark-gap", "input", "100"),
    badgePreviewSurface: makeNode("badge-preview-surface"),
    watermarkPreviewSurface: makeNode("watermark-preview-surface"),
    badgeStyleOptions: ["slanted", "pill", "edge-glow"].map((style) => {
      const option = makeNode("badge-style-" + style, "input");
      option.value = style;
      return option;
    })
  };

  nodes.badgeLayout.append(
    nodes.badge,
    nodes.badgeColorSwatches,
    nodes.badgeColor,
    nodes.badgeTextColorSwatches,
    nodes.badgeTextColor,
    ...nodes.badgeStyleOptions,
    nodes.badgePosition,
    nodes.badgeScale,
    nodes.badgeSize,
    nodes.badgeOpacity
  );
  nodes.watermarkLayout.append(
    nodes.watermarkText,
    nodes.watermarkColorSwatches,
    nodes.watermarkColor,
    nodes.watermarkOpacity,
    nodes.watermarkAngle,
    nodes.watermarkSize,
    nodes.watermarkGap
  );

  const document = {
    createElement: (tagName) => makeNode("", tagName)
  };
  const context = loadFunctions([
    "selectedBadgeStyle",
    "syncBadgeStyleOptions",
    "renderColorSwatches",
    "syncColorControls",
    "syncMarkerLayoutControls",
    "syncMarkerControlStates",
    "renderForm"
  ], {
    nodes,
    document,
    settings: { groups: [{ id: "default", name: "Default" }] },
    prefixFocusToken: 0,
    faviconPopoverOpen: false,
    isRendering: false,
    selectedEnvironment: () => environment,
    watermarkLabel: (selected) => selected.watermarkText,
    bindNodeEvent: (node, eventName, handler) => node?.addEventListener(eventName, handler),
    clearBasicValidationError() {},
    renderGroupOptions() {},
    ensureGroupId: (groupId) => groupId,
    syncEnabledLabel() {},
    syncTabDisplayControls() {},
    renderRows() {},
    renderMarkerPreviews() {},
    ENVIRONMENT_COLOR_PRESETS: ["#2563eb", "#059669"],
    TEXT_COLOR_PRESETS: ["#ffffff", "#111827"],
    updateSelectedEnvironment(patch) {
      Object.assign(environment, patch);
    }
  });

  return { context, environment, nodes };
}

test("initial render disables marker configuration controls while preserving their values and switches", () => {
  const { context, environment, nodes } = makeHarness();

  context.renderForm();

  const disabledControls = [
    nodes.badge, nodes.badgeColor, nodes.badgeTextColor, ...nodes.badgeStyleOptions,
    nodes.badgePosition, nodes.badgeScale, nodes.badgeSize, nodes.badgeOpacity,
    nodes.watermarkText, nodes.watermarkColor, nodes.watermarkOpacity,
    nodes.watermarkAngle, nodes.watermarkSize, nodes.watermarkGap,
    ...nodes.badgeColorSwatches.children, ...nodes.badgeTextColorSwatches.children,
    ...nodes.watermarkColorSwatches.children
  ];
  assert.ok(disabledControls.length > 0, "render should include controls and dynamic color swatches");
  disabledControls.forEach((control) => assert.equal(control.disabled, true, control.id || control.title));
  assert.equal(nodes.badgeLayout.getAttribute("aria-disabled"), "true");
  assert.equal(nodes.watermarkLayout.getAttribute("aria-disabled"), "true");
  assert.equal(nodes.badgeLayout.classList.contains("is-disabled"), true);
  assert.equal(nodes.watermarkLayout.classList.contains("is-disabled"), true);
  assert.match(css, /\.badge-layout\.is-disabled,\s*\.watermark-layout\.is-disabled\s*\{[^}]*opacity:/);

  assert.equal(nodes.badge.value, environment.badge);
  assert.equal(nodes.badgeColor.value, environment.badgeColor);
  assert.equal(nodes.badgeTextColor.value, environment.badgeTextColor);
  assert.equal(nodes.badgePosition.value, environment.badgePosition);
  assert.equal(nodes.badgeScale.value, String(environment.badgeScale));
  assert.equal(nodes.badgeSize.value, String(environment.badgeSize));
  assert.equal(nodes.badgeOpacity.value, String(environment.badgeOpacity));
  assert.equal(nodes.watermarkText.value, environment.watermarkText);
  assert.equal(nodes.watermarkColor.value, environment.watermarkColor);
  assert.equal(nodes.watermarkOpacity.value, String(environment.watermarkOpacity));
  assert.equal(nodes.watermarkAngle.value, String(environment.watermarkAngle));
  assert.equal(nodes.watermarkSize.value, String(environment.watermarkSize));
  assert.equal(nodes.watermarkGap.value, String(environment.watermarkGap));
  assert.equal(nodes.badgeEnabled.checked, false);
  assert.equal(nodes.watermarkEnabled.checked, false);
  assert.equal(nodes.badgeEnabled.disabled, false);
  assert.equal(nodes.watermarkEnabled.disabled, false);
});

test("the enable switches stay outside their disabled configuration layouts", () => {
  const badgeSwitch = html.indexOf('id="env-badge-enabled"');
  const badgeLayout = html.indexOf('id="badge-layout"');
  const watermarkSwitch = html.indexOf('id="env-watermark-enabled"');
  const watermarkLayout = html.indexOf('id="watermark-layout"');
  assert.ok(badgeSwitch >= 0 && badgeLayout > badgeSwitch, "badge switch should precede the configurable layout");
  assert.ok(watermarkSwitch >= 0 && watermarkLayout > watermarkSwitch, "watermark switch should precede the configurable layout");
  assert.doesNotMatch(divMarkupById("badge-layout"), /id="env-badge-enabled"/);
  assert.doesNotMatch(divMarkupById("watermark-layout"), /id="env-watermark-enabled"/);
});

test("changing either enable switch immediately disables or restores only its own controls", () => {
  const { context, environment, nodes } = makeHarness();
  context.renderForm();
  bindMarkerToggleHandlers(context);

  nodes.badgeEnabled.checked = true;
  nodes.badgeEnabled.fire("change");
  assert.equal(environment.badgeEnabled, true);
  assert.equal(nodes.badgeLayout.getAttribute("aria-disabled"), "false");
  assert.equal(nodes.badgeLayout.classList.contains("is-disabled"), false);
  nodes.badgeLayout.querySelectorAll("input, select, button, textarea")
    .forEach((control) => assert.equal(control.disabled, false, control.id || control.title));
  assert.equal(nodes.watermarkLayout.getAttribute("aria-disabled"), "true");
  assert.equal(nodes.watermarkText.disabled, true);

  nodes.watermarkEnabled.checked = true;
  nodes.watermarkEnabled.fire("change");
  assert.equal(environment.watermarkEnabled, true);
  assert.equal(nodes.watermarkLayout.getAttribute("aria-disabled"), "false");
  nodes.watermarkLayout.querySelectorAll("input, select, button, textarea")
    .forEach((control) => assert.equal(control.disabled, false, control.id || control.title));

  nodes.badgeEnabled.checked = false;
  nodes.badgeEnabled.fire("change");
  nodes.watermarkEnabled.checked = false;
  nodes.watermarkEnabled.fire("change");
  assert.equal(nodes.badgeLayout.getAttribute("aria-disabled"), "true");
  assert.equal(nodes.watermarkLayout.getAttribute("aria-disabled"), "true");
  assert.equal(nodes.badgeEnabled.disabled, false);
  assert.equal(nodes.watermarkEnabled.disabled, false);
  assert.equal(nodes.badge.value, environment.badge);
  assert.equal(nodes.watermarkText.value, environment.watermarkText);
  assert.equal(nodes.badgeScale.value, String(environment.badgeScale));
  assert.equal(nodes.watermarkGap.value, String(environment.watermarkGap));
});

test("rebuilt color swatches stay disabled and cannot change colors until their marker is enabled", () => {
  const { context, environment, nodes } = makeHarness();
  const changes = [];
  context.updateSelectedEnvironment = (patch) => {
    changes.push(patch);
    Object.assign(environment, patch);
  };
  context.renderForm();
  bindMarkerToggleHandlers(context);

  const badgeSwatch = nodes.badgeColorSwatches.children.find((button) => button.title === "#059669");
  let watermarkSwatch = nodes.watermarkColorSwatches.children.find((button) => button.title === "#059669");
  assert.ok(badgeSwatch && watermarkSwatch, "render should create dynamic marker color swatches");
  assert.equal(badgeSwatch.disabled, true);
  assert.equal(watermarkSwatch.disabled, true);

  badgeSwatch.fire("click");
  watermarkSwatch.fire("click");
  assert.equal(changes.length, 0, "synthetic clicks on disabled swatches should not update saved colors");

  context.updateSelectedEnvironment = (patch) => {
    changes.push(patch);
    Object.assign(environment, patch);
    if ("badgeColor" in patch || "badgeTextColor" in patch || "watermarkColor" in patch) {
      context.syncColorControls(environment);
    }
  };
  nodes.badgeEnabled.checked = true;
  nodes.badgeEnabled.fire("change");
  nodes.watermarkEnabled.checked = true;
  nodes.watermarkEnabled.fire("change");
  assert.equal(badgeSwatch.disabled, false);
  assert.equal(watermarkSwatch.disabled, false);
  badgeSwatch.fire("click");
  watermarkSwatch = nodes.watermarkColorSwatches.children.find((button) => button.title === "#059669");
  assert.ok(watermarkSwatch, "swatch updates should rebuild the palette");
  watermarkSwatch.fire("click");
  assert.equal(environment.badgeColor, "#059669");
  assert.equal(environment.watermarkColor, "#059669");

  nodes.badgeEnabled.checked = false;
  nodes.badgeEnabled.fire("change");
  nodes.watermarkEnabled.checked = false;
  nodes.watermarkEnabled.fire("change");
  context.syncColorControls(environment);
  const rebuiltBadgeSwatch = nodes.badgeColorSwatches.children.find((button) => button.title === "#2563eb");
  const rebuiltWatermarkSwatch = nodes.watermarkColorSwatches.children.find((button) => button.title === "#2563eb");
  assert.ok(rebuiltBadgeSwatch && rebuiltWatermarkSwatch, "color sync should recreate both swatch palettes");
  assert.equal(rebuiltBadgeSwatch.disabled, true);
  assert.equal(rebuiltWatermarkSwatch.disabled, true);
  const changeCount = changes.length;
  rebuiltBadgeSwatch.fire("click");
  rebuiltWatermarkSwatch.fire("click");
  assert.equal(changes.length, changeCount, "disabled swatches should remain inert after an on/off cycle");
  assert.equal(environment.badgeColor, "#059669");
  assert.equal(environment.watermarkColor, "#059669");
});
