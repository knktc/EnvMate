const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const optionsSource = fs.readFileSync(path.join(root, "options/options.js"), "utf8");
const backgroundSource = fs.readFileSync(path.join(root, "src/background.js"), "utf8");
const contentSource = fs.readFileSync(path.join(root, "src/content.js"), "utf8");
const optionsCss = fs.readFileSync(path.join(root, "options/options.css"), "utf8");
const contentCss = fs.readFileSync(path.join(root, "src/content.css"), "utf8");

function extractFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} should be defined`);

  const openBrace = source.indexOf("{", start);
  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  assert.fail(`${name} should have a complete function body`);
}

function loadFunctions(source, names, globals, filename) {
  const context = vm.createContext({ ...globals });
  const declarations = names.map((name) => extractFunction(source, name));
  const exports = names.map((name) => `globalThis.${name} = ${name};`);
  vm.runInContext([...declarations, ...exports].join("\n\n"), context, { filename });
  return context;
}

function loadBackgroundDefaults() {
  const start = backgroundSource.indexOf("const DEFAULT_SETTINGS = ");
  const end = backgroundSource.indexOf("\n\nconst ICON_SIZES", start);
  assert.ok(start >= 0 && end > start, "background default settings should exist");
  const declaration = backgroundSource.slice(start, end);
  const context = vm.createContext({ DEFAULT_GROUP_ID: "default" });
  vm.runInContext(`${declaration}\nglobalThis.DEFAULT_SETTINGS = DEFAULT_SETTINGS;`, context, {
    filename: "src/background.js"
  });
  return context.DEFAULT_SETTINGS;
}

function createDomHarness() {
  const createdElements = [];
  const documentRoots = [];

  const document = {
    createElement(tagName) {
      const styleValues = {};
      const element = {
        tagName,
        className: "",
        dataset: {},
        textContent: "",
        children: [],
        style: {
          values: styleValues,
          setProperty(name, value) {
            styleValues[name] = value;
          }
        },
        append(...children) {
          this.children.push(...children);
        }
      };
      createdElements.push(element);
      return element;
    },
    documentElement: {
      append(...elements) {
        documentRoots.push(...elements);
      }
    }
  };

  return { document, createdElements, documentRoots };
}

function normalizeContext() {
  return loadFunctions(optionsSource, ["normalizeSettings"], {
    DEFAULT_GROUP_ID: "default",
    buildGroups: () => [{ id: "default", name: "Default" }],
    ensureGroupId: (groupId, groups) => groups.some((group) => group.id === groupId) ? groupId : "default",
    normalizeGroupName: (name) => name,
    normalizeHomepageUrl: (value) => value || "",
    normalizeQuickAccessTimestamp: (value) => Number(value || 0),
    markerLabel: () => "Fixture",
    TAB_DISPLAY_CONFIG: { normalizeTabDisplay: () => ({ enabled: false }) },
    uid: (prefix) => `${prefix}-generated`,
    t: (key) => key
  }, "options/options.js");
}

test("new, quick-add, sample, and first-install environments default watermark opacity to 6 percent", () => {
  const addContext = loadFunctions(optionsSource, ["addEnvironment"], {
    DEFAULT_GROUP_ID: "default",
    TAB_DISPLAY_CONFIG: { DEFAULT_PRESET_TYPE: "solid-rounded-square" },
    settings: { groups: [{ id: "default", name: "Default" }], environments: [] },
    selectedGroupId: "default",
    selectedId: null,
    confirmDiscardUnsavedChanges: () => true,
    pickEnvironmentColor: () => "#2563eb",
    t: (key) => key,
    uid: (prefix) => `${prefix}-manual`,
    ensureGroupId: (groupId, groups) => groups.some((group) => group.id === groupId) ? groupId : "default",
    render() {},
    markChanged() {}
  }, "options/options.js");
  addContext.addEnvironment();
  assert.equal(addContext.settings.environments[0].watermarkOpacity, 0.06);

  const quickContext = loadFunctions(optionsSource, ["buildQuickEnvironment"], {
    DEFAULT_GROUP_ID: "default",
    TAB_DISPLAY_CONFIG: { DEFAULT_PRESET_TYPE: "solid-rounded-square" },
    uid: (prefix) => `${prefix}-quick`,
    pickEnvironmentColor: () => "#2563eb",
    detectQuickBadge: () => "STAGE",
    buildQuickEnvironmentName: () => "A longer staging environment title",
    homepageUrlFromSource: () => "https://staging.example.com/"
  }, "options/options.js");
  const quickEnvironment = quickContext.buildQuickEnvironment(
    "A longer staging environment title",
    "https://staging.example.com/*",
    "https://staging.example.com/"
  );
  assert.equal(quickEnvironment.watermarkOpacity, 0.06);

  let uid = 0;
  const sampleContext = loadFunctions(optionsSource, ["buildLocalizedSampleGroup"], {
    SAMPLE_GROUP_ID: "sample",
    TAB_DISPLAY_CONFIG: { DEFAULT_PRESET_TYPE: "solid-rounded-square" },
    uid: (prefix) => `${prefix}-${++uid}`,
    t: (key) => key
  }, "options/options.js");
  const sampleEnvironments = sampleContext.buildLocalizedSampleGroup().environments;
  assert.deepEqual(Array.from(sampleEnvironments, (environment) => environment.watermarkOpacity), [0.06, 0.06]);

  const installedEnvironments = loadBackgroundDefaults().environments;
  assert.deepEqual(Array.from(installedEnvironments, (environment) => environment.watermarkOpacity), [0.06, 0.06]);

  const sampleConfig = JSON.parse(fs.readFileSync(path.join(root, "samples/envmate-config.sample.json"), "utf8"));
  assert.ok(sampleConfig.environments.length > 0);
  assert.ok(sampleConfig.environments.every((environment) => environment.watermarkOpacity === 0.06));
});

test("normalization uses 6 percent only when no saved opacity value exists", () => {
  const context = normalizeContext();
  const missingValue = context.normalizeSettings({
    environments: [{ id: "missing-opacity", groupId: "default", name: "Missing opacity" }]
  });
  assert.equal(missingValue.environments[0].watermarkOpacity, 0.06);

  const savedValues = context.normalizeSettings({
    appearance: { watermarkOpacity: 0.08 },
    environments: [
      { id: "explicit-opacity", groupId: "default", name: "Explicit opacity", watermarkOpacity: 0.08 },
      { id: "appearance-opacity", groupId: "default", name: "Appearance opacity" }
    ]
  });
  assert.equal(savedValues.environments[0].watermarkOpacity, 0.08);
  assert.equal(savedValues.environments[1].watermarkOpacity, 0.08);
});

test("runtime and preview use the same 6 percent opacity fallback", () => {
  const previewDom = createDomHarness();
  const previewContext = loadFunctions(optionsSource, ["renderPreviewWatermark"], {
    document: previewDom.document
  }, "options/options.js");
  const previewSurface = { children: [], append(child) { this.children.push(child); } };
  previewContext.renderPreviewWatermark(previewSurface, "MARK", {});
  assert.equal(previewSurface.children[0].style.values["--preview-watermark-opacity"], "0.06");

  const runtimeDom = createDomHarness();
  const runtimeContext = loadFunctions(contentSource, ["createWatermark"], {
    document: runtimeDom.document,
    watermarkLabel: () => "MARK"
  }, "src/content.js");
  runtimeContext.createWatermark({});
  assert.equal(runtimeDom.documentRoots[0].style.values["--envmate-watermark-opacity"], 0.06);

  assert.match(contentCss, /opacity:\s*var\(--envmate-watermark-opacity,\s*0\.06\)/);
  assert.match(optionsCss, /opacity:\s*var\(--preview-watermark-opacity,\s*0\.06\)/);
});
