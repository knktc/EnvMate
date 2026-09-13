const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const optionsSource = fs.readFileSync(path.join(__dirname, "..", "options/options.js"), "utf8");

function extractFunction(name) {
  const start = optionsSource.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} should be defined in options.js`);

  const openBrace = optionsSource.indexOf("{", start);
  let depth = 0;
  for (let index = openBrace; index < optionsSource.length; index += 1) {
    if (optionsSource[index] === "{") depth += 1;
    if (optionsSource[index] === "}") {
      depth -= 1;
      if (depth === 0) return optionsSource.slice(start, index + 1);
    }
  }

  assert.fail(`${name} should have a complete function body`);
}

function loadOptionsFunctions(names, globals) {
  const context = vm.createContext({ ...globals });
  const source = [
    ...names.map(extractFunction),
    ...names.map((name) => `globalThis.${name} = ${name};`)
  ].join("\n\n");
  vm.runInContext(source, context, { filename: "options/options.js" });
  return context;
}

function markerEnabledSettings() {
  return {
    groups: [{ id: "default", name: "Default" }],
    environments: []
  };
}

test("manually added environments enable both page markers by default", () => {
  const context = loadOptionsFunctions(["addEnvironment"], {
    DEFAULT_GROUP_ID: "default",
    TAB_DISPLAY_CONFIG: { DEFAULT_PRESET_TYPE: "solid-rounded-square" },
    settings: markerEnabledSettings(),
    selectedGroupId: "default",
    selectedId: null,
    confirmDiscardUnsavedChanges: () => true,
    pickEnvironmentColor: () => "#2563eb",
    t: (key) => (key === "newEnvironment" ? "New Environment" : key),
    uid: (prefix) => `${prefix}-manual`,
    ensureGroupId: (groupId, groups) => groups.some((group) => group.id === groupId) ? groupId : "default",
    render() {},
    markChanged() {}
  });

  context.addEnvironment();
  const [environment] = context.settings.environments;

  assert.equal(environment.badgeEnabled, true);
  assert.equal(environment.watermarkEnabled, true);
  assert.equal(environment.markerMode, "badge-watermark");
  assert.equal(environment.watermarkText, environment.badge);
});

test("URL quick-add environments enable both page markers by default", async () => {
  const search = new URLSearchParams({
    quickAdd: "1",
    title: "Staging Console With A Very Long Product Administration Dashboard",
    prefix: "https://staging.example.com/*",
    url: "https://staging.example.com/"
  });
  const context = loadOptionsFunctions(["buildQuickEnvironment", "handleQuickAddFromQuery"], {
    DEFAULT_GROUP_ID: "default",
    TAB_DISPLAY_CONFIG: { DEFAULT_PRESET_TYPE: "solid-rounded-square" },
    settings: markerEnabledSettings(),
    selectedGroupId: "default",
    selectedId: null,
    URLSearchParams,
    window: {
      location: { search: `?${search}` },
      history: { replaceState() {} }
    },
    document: { title: "EnvMate Settings", pathname: "/options.html" },
    uid: (prefix) => `${prefix}-quick`,
    pickEnvironmentColor: () => "#2563eb",
    t: (key) => key,
    detectQuickBadge: () => "STAGE",
    buildQuickEnvironmentName: (title) => title,
    homepageUrlFromSource: (sourceUrl) => sourceUrl,
    findEnvironmentByPrefixRule: () => null,
    render() {},
    markChanged() {},
    setStatus() {}
  });

  await context.handleQuickAddFromQuery();
  const [environment] = context.settings.environments;

  assert.equal(environment.badgeEnabled, true);
  assert.equal(environment.watermarkEnabled, true);
  assert.equal(environment.markerMode, "badge-watermark");
  assert.equal(environment.badge, "STAGE");
  assert.equal(environment.watermarkText, "STAGE");
  assert.notEqual(environment.watermarkText, environment.name);
});

test("normalizing saved settings preserves explicit marker opt-outs", () => {
  const context = loadOptionsFunctions(["normalizeSettings"], {
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
  });

  const normalized = context.normalizeSettings({
    environments: [{
      id: "existing",
      groupId: "default",
      name: "Existing environment",
      badge: "PROD",
      watermarkText: "My short mark",
      badgeEnabled: false,
      watermarkEnabled: false,
      markerMode: "badge-watermark"
    }]
  });

  assert.equal(normalized.environments[0].badgeEnabled, false);
  assert.equal(normalized.environments[0].watermarkEnabled, false);
  assert.equal(normalized.environments[0].watermarkText, "My short mark");
});
