const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const {
  normalizeTabDisplay,
  normalizeEmoji,
  isSingleEmoji,
  normalizeFavicon,
  PRESET_TYPES,
  preferredFaviconSource,
  selectSingleUploadFile,
  MAX_RAW_UPLOAD_BYTES,
  MAX_NORMALIZED_PNG_BYTES,
  isRawUploadSizeAllowed,
  shouldInitializePrefix,
  initializePrefix,
  schedulePrefixCaret,
  validateFavicon,
  parseUploadDataUrl
} = require("../src/tab-display-config.js");
const { createTabDisplayManager, emojiDataUrl, iconHref } = require("../src/tab-display-manager.js");

const observers = new Set();
let fakeMutationCallbacks = 0;

class FakeMutationObserver {
  constructor(callback) {
    this.callback = (...args) => {
      fakeMutationCallbacks += 1;
      callback(...args);
    };
    this.registrations = [];
    observers.add(this);
  }

  observe(target, options) {
    this.registrations.push({ target, options });
  }

  disconnect() {
    this.registrations = [];
    observers.delete(this);
  }
}

function isWithin(node, ancestor) {
  for (let current = node; current; current = current.parentNode) {
    if (current === ancestor) return true;
  }
  return false;
}

function emitMutation(record) {
  for (const observer of observers) {
    if (observer.registrations.some(({ target, options }) => {
      if (target !== record.target && !(options.subtree && isWithin(record.target, target))) return false;
      if (record.type === "attributes" && options.attributes === false) return false;
      if (record.type === "attributes" && Array.isArray(options.attributeFilter) && !options.attributeFilter.includes(record.attributeName)) return false;
      return true;
    })) {
      observer.callback([record]);
    }
  }
}

class FakeNode {
  constructor(nodeName, ownerDocument) {
    this.nodeName = nodeName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.attributeWrites = 0;
  }

  get lastChild() {
    return this.children[this.children.length - 1] || null;
  }

  append(node) {
    if (node.parentNode) node.parentNode.removeChild(node);
    node.parentNode = this;
    this.children.push(node);
    emitMutation({ type: "childList", target: this, addedNodes: [node], removedNodes: [] });
  }

  removeChild(node) {
    const index = this.children.indexOf(node);
    if (index < 0) return node;
    this.children.splice(index, 1);
    node.parentNode = null;
    emitMutation({ type: "childList", target: this, addedNodes: [], removedNodes: [node] });
    return node;
  }

  insertBefore(node, referenceNode) {
    if (node.parentNode) node.parentNode.removeChild(node);
    const index = this.children.indexOf(referenceNode);
    node.parentNode = this;
    if (index < 0) this.children.push(node);
    else this.children.splice(index, 0, node);
    emitMutation({ type: "childList", target: this, addedNodes: [node], removedNodes: [] });
  }

  querySelectorAll(selector) {
    if (selector === "link[rel~='icon'],link[rel='shortcut icon']") {
      return this.children.filter((child) => child.nodeName === "LINK" && /(?:^|\s)icon(?:\s|$)/.test(child.rel));
    }
    if (selector === "link") {
      return this.children.filter((child) => child.nodeName === "LINK");
    }
    return [];
  }

  getAttribute(name) {
    return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
  }

  setAttribute(name, value) {
    const nextValue = String(value);
    if (this.getAttribute(name) === nextValue) return;
    this.attributes[name] = nextValue;
    this.attributeWrites += 1;
    emitMutation({ type: "attributes", target: this, attributeName: name });
  }

  removeAttribute(name) {
    if (!Object.hasOwn(this.attributes, name)) return;
    delete this.attributes[name];
    this.attributeWrites += 1;
    emitMutation({ type: "attributes", target: this, attributeName: name });
  }

  cloneNode(deep = false) {
    const clone = new FakeNode(this.nodeName, this.ownerDocument);
    clone.attributes = { ...this.attributes };
    clone.dataset = { ...this.dataset };
    if (deep) this.children.forEach((child) => clone.append(child.cloneNode(true)));
    return clone;
  }

  set rel(value) { this.setAttribute("rel", value); }
  get rel() { return this.attributes.rel || ""; }
  set type(value) { this.setAttribute("type", value); }
  get type() { return this.attributes.type || ""; }
  set href(value) { this.setAttribute("href", value); }
  get href() { return this.attributes.href || ""; }
  set sizes(value) { this.setAttribute("sizes", value); }
}

function createDocument(initialTitle = "Console") {
  const documentElement = new FakeNode("html");
  const document = {
    documentElement,
    createElement(nodeName) { return new FakeNode(nodeName, document); },
    head: null,
    titleNode: null,
    get title() { return this._title; },
    set title(value) {
      this._title = String(value);
      emitMutation({ type: "characterData", target: this.titleNode });
    },
    replaceHead() {
      const previous = this.head;
      this.head = new FakeNode("head", document);
      this.head.parentNode = documentElement;
      this.titleNode = new FakeNode("title", document);
      this.titleNode.parentNode = this.head;
      emitMutation({ type: "childList", target: documentElement, addedNodes: [this.head], removedNodes: [previous] });
    },
    _title: initialTitle
  };
  document.replaceHead();
  return document;
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function decodeSvgDataUrl(value) {
  const [, payload = ""] = String(value).split(",", 2);
  return decodeURIComponent(payload);
}

function browserIconLinks(document) {
  return document.head.querySelectorAll("link[rel~='icon'],link[rel='shortcut icon']");
}

test("renders emoji favicons with a transparent SVG shared by previews and runtime", () => {
  const favicon = { source: "emoji", type: "native", value: "🧪" };
  const directSvg = decodeSvgDataUrl(emojiDataUrl(favicon.value));
  const sharedSvg = decodeSvgDataUrl(iconHref(favicon));
  const optionsScript = fs.readFileSync(path.join(__dirname, "../options/options.js"), "utf8");
  const managerScript = fs.readFileSync(path.join(__dirname, "../src/tab-display-manager.js"), "utf8");

  assert.equal(emojiDataUrl(favicon.value), iconHref(favicon));
  for (const svg of [directSvg, sharedSvg]) {
    assert.doesNotMatch(svg, /<rect\b/i);
    assert.doesNotMatch(svg, /<circle\b|<path\b|<image\b/i);
    assert.doesNotMatch(svg, /#ffffff/i);
    assert.match(svg, /<text x="32" y="32" text-anchor="middle" dominant-baseline="central" font-size="58"[^>]*>🧪<\/text>/u);
  }
  assert.match(managerScript, /const href = iconHref\(favicon\);/);
  assert.equal((optionsScript.match(/EnvMateTabDisplayManager\.iconHref\(favicon\)/g) || []).length, 2);

  const presetSvg = decodeSvgDataUrl(iconHref({ source: "preset", type: "solid-rounded-square", value: "#059669" }));
  assert.match(presetSvg, /<rect\b/);
  assert.match(presetSvg, /fill="#059669"/);
  const uploaded = "data:image/png;base64," + Buffer.from("png-fixture").toString("base64");
  assert.equal(iconHref({ source: "upload", type: "image/png", value: uploaded }), uploaded);
});

test("supports square and circle preset favicons with a safe square fallback", () => {
  assert.deepEqual(PRESET_TYPES, ["solid-rounded-square", "solid-circle"]);

  const circle = { enabled: true, source: "preset", type: "solid-circle", value: "#059669" };
  assert.deepEqual(normalizeFavicon(circle), circle);
  assert.equal(validateFavicon(circle).valid, true);
  const circleSvg = decodeSvgDataUrl(iconHref(circle));
  assert.match(circleSvg, /<circle\b/);
  assert.doesNotMatch(circleSvg, /<rect\b/);
  assert.doesNotMatch(circleSvg, /#ffffff/i);
  assert.match(circleSvg, /fill="#059669"/);

  const square = { enabled: true, source: "preset", type: "solid-rounded-square", value: "#059669" };
  assert.deepEqual(normalizeFavicon(square), square);
  assert.equal(validateFavicon(square).valid, true);
  const squareSvg = decodeSvgDataUrl(iconHref(square));
  assert.match(squareSvg, /<rect\b/);
  assert.doesNotMatch(squareSvg, /<circle\b/);
  assert.match(squareSvg, /rx="15"/);

  const unknown = normalizeFavicon({ enabled: true, source: "preset", type: "future-shape", value: "#dc2626" });
  assert.deepEqual(unknown, {
    enabled: false,
    source: "preset",
    type: "solid-rounded-square",
    value: "#2563eb"
  });
  assert.equal(validateFavicon({ enabled: true, source: "preset", type: "future-shape", value: "#dc2626" }).valid, false);
});

test("prefers an enabled favicon source for the popover and otherwise returns Emoji", () => {
  const cases = [
    [{ enabled: true, source: "emoji", type: "native", value: "🧪" }, "emoji"],
    [{ enabled: true, source: "preset", type: "solid-circle", value: "#059669" }, "preset"],
    [{ enabled: true, source: "upload", type: "image/png", value: "data:image/png;base64,AA==" }, "upload"],
    [{ enabled: false, source: "preset", type: "solid-rounded-square", value: "#059669" }, "emoji"],
    [{ enabled: true, source: "future-shape", value: "anything" }, "emoji"],
    [{ source: "preset", type: "solid-rounded-square", value: "#059669" }, "emoji"]
  ];
  cases.forEach(([favicon, expected]) => {
    const snapshot = JSON.stringify(favicon);
    assert.equal(preferredFaviconSource(favicon), expected);
    assert.equal(JSON.stringify(favicon), snapshot);
  });
});

test("normalizes legacy titlePrefix and keeps raw prefix whitespace", () => {
  const migrated = normalizeTabDisplay({ titlePrefix: true, badge: "DEV", name: "Development" }, "DEV");
  assert.equal(migrated.enabled, true);
  assert.equal(migrated.title.prefix, "[DEV] ");

  const disabled = normalizeTabDisplay({ titlePrefix: false, badge: "DEV" }, "DEV");
  assert.equal(disabled.enabled, false);

  const custom = normalizeTabDisplay({ tabDisplay: { enabled: true, title: { prefix: "  DEV → ", override: "Console  " } } });
  assert.equal(custom.title.prefix, "  DEV → ");
  assert.equal(custom.title.override, "Console  ");

  const fresh = normalizeTabDisplay({ tabDisplay: { enabled: false, title: { override: "" } } });
  assert.equal(Object.hasOwn(fresh.title, "prefix"), false);

  const invalidFavicon = normalizeTabDisplay({ tabDisplay: {
    enabled: true,
    favicon: { enabled: true, source: "preset", type: "future-shape", value: "not-a-color" }
  } });
  assert.equal(invalidFavicon.favicon.enabled, false);
});

test("initializes every empty prefix and ignores the removed prefixConfigured field", () => {
  const untouched = normalizeTabDisplay({ tabDisplay: { title: { prefix: "" } } });
  assert.equal(shouldInitializePrefix(untouched.title), true);
  assert.equal(initializePrefix(untouched.title), true);
  assert.equal(untouched.title.prefix, "[]");
  assert.equal(shouldInitializePrefix(untouched.title), false);

  const previouslyConfiguredEmpty = normalizeTabDisplay({ tabDisplay: { title: { prefix: "", prefixConfigured: true } } });
  assert.equal(Object.hasOwn(previouslyConfiguredEmpty.title, "prefixConfigured"), false);
  assert.doesNotMatch(JSON.stringify(previouslyConfiguredEmpty), /prefixConfigured/);
  assert.equal(shouldInitializePrefix(previouslyConfiguredEmpty.title), true);
  assert.equal(initializePrefix(previouslyConfiguredEmpty.title), true);
  assert.equal(previouslyConfiguredEmpty.title.prefix, "[]");

  const clearedRoundTrip = JSON.parse(JSON.stringify({ tabDisplay: { title: { prefix: "", prefixConfigured: true } } }));
  const cleared = normalizeTabDisplay(clearedRoundTrip);
  assert.equal(shouldInitializePrefix(cleared.title), true);
  assert.equal(initializePrefix(cleared.title), true);

  const initializedThenCleared = normalizeTabDisplay({ tabDisplay: { title: { prefix: "" } } });
  initializePrefix(initializedThenCleared.title);
  initializedThenCleared.title.prefix = "";
  const reloadedAfterClear = normalizeTabDisplay(JSON.parse(JSON.stringify(initializedThenCleared)));
  assert.equal(shouldInitializePrefix(reloadedAfterClear.title), true);

  const nonEmptyWithoutFlag = normalizeTabDisplay({ tabDisplay: { title: { prefix: "[DEV] " } } });
  assert.equal(shouldInitializePrefix(nonEmptyWithoutFlag.title), false);

  const legacyEnabled = normalizeTabDisplay({ titlePrefix: true, badge: "DEV" }, "DEV");
  assert.equal(shouldInitializePrefix(legacyEnabled.title), false);
  const legacyDisabled = normalizeTabDisplay({ titlePrefix: false, title: { prefix: "" } }, "DEV");
  assert.equal(shouldInitializePrefix(legacyDisabled.title), true);
});

test("delays prefix caret placement and ignores stale focus callbacks", () => {
  let queuedCallback = null;
  let selection = null;
  let currentEnvironment = true;
  const input = {
    value: "[]",
    ownerDocument: { activeElement: null },
    setSelectionRange(start, end) {
      selection = [start, end];
    }
  };
  input.ownerDocument.activeElement = input;
  const schedule = (callback) => {
    queuedCallback = callback;
  };

  assert.equal(schedulePrefixCaret(input, "[]", () => currentEnvironment, schedule), true);
  assert.equal(selection, null);
  assert.equal(queuedCallback(), true);
  assert.deepEqual(selection, [1, 1]);

  selection = null;
  input.value = "[]";
  currentEnvironment = true;
  schedulePrefixCaret(input, "[]", () => currentEnvironment, schedule);
  input.value = "user input";
  assert.equal(queuedCallback(), false);
  assert.equal(selection, null);

  input.value = "[]";
  currentEnvironment = false;
  schedulePrefixCaret(input, "[]", () => currentEnvironment, schedule);
  assert.equal(queuedCallback(), false);
  assert.equal(selection, null);
});

test("accepts one complete emoji grapheme and rejects text or multiple graphemes", () => {
  ["🧪", "👨‍💻", "🏳️‍🌈", "👍🏽", "1️⃣", "🇨🇳"].forEach((emoji) => {
    assert.equal(isSingleEmoji(emoji), true, emoji);
    assert.equal(normalizeEmoji(emoji), emoji, emoji);
    assert.equal(validateFavicon({ source: "emoji", type: "native", value: emoji }).valid, true, emoji);
    assert.equal(normalizeTabDisplay({ tabDisplay: { favicon: { enabled: true, source: "emoji", type: "native", value: emoji } } }).favicon.value, emoji);
  });

  ["test", "😀😀", "😀 😃", "   ", "1", "hello😀"].forEach((value) => {
    assert.equal(isSingleEmoji(value), false, value);
    assert.equal(normalizeEmoji(value), "🧪", value);
    assert.equal(validateFavicon({ source: "emoji", type: "native", value }).valid, false, value);
    assert.equal(normalizeTabDisplay({ tabDisplay: { favicon: { enabled: true, source: "emoji", type: "native", value } } }).favicon.source, "preset", value);
  });
});

test("validates upload data URLs without accepting arbitrary remote content", () => {
  const valid = "data:image/png;base64," + Buffer.from("png-fixture").toString("base64");
  assert.equal(parseUploadDataUrl(valid).valid, true);
  assert.equal(validateFavicon({ source: "upload", type: "image/png", value: valid }).valid, true);
  assert.equal(validateFavicon({ source: "upload", type: "image/svg+xml", value: "data:image/svg+xml;base64,PHN2Zy8+" }).valid, false);
  assert.equal(validateFavicon({ source: "upload", type: "image/png", value: "https://example.com/icon.png" }).valid, false);
  const oversizedNormalized = "data:image/png;base64," + Buffer.alloc(256 * 1024 + 1).toString("base64");
  assert.equal(parseUploadDataUrl(oversizedNormalized).reason, "size-limit");
});

test("keeps raw upload and normalized PNG limits separate at their exact boundaries", () => {
  assert.equal(MAX_RAW_UPLOAD_BYTES, 2 * 1024 * 1024);
  assert.equal(MAX_NORMALIZED_PNG_BYTES, 256 * 1024);

  const acceptedRaw = { name: "favicon.png", size: MAX_RAW_UPLOAD_BYTES };
  const rejectedRaw = { name: "favicon.png", size: MAX_RAW_UPLOAD_BYTES + 1 };
  assert.equal(isRawUploadSizeAllowed(acceptedRaw.size), true);
  assert.equal(isRawUploadSizeAllowed(rejectedRaw.size), false);

  const acceptedNormalized = "data:image/png;base64," + Buffer.alloc(MAX_NORMALIZED_PNG_BYTES).toString("base64");
  const rejectedNormalized = "data:image/png;base64," + Buffer.alloc(MAX_NORMALIZED_PNG_BYTES + 1).toString("base64");
  assert.equal(parseUploadDataUrl(acceptedNormalized).valid, true);
  assert.equal(parseUploadDataUrl(rejectedNormalized).reason, "size-limit");
});

test("accepts exactly one dropped upload file and reports multiple files", () => {
  const file = { name: "favicon.png", type: "image/png" };
  assert.deepEqual(selectSingleUploadFile([file]), { file, reason: "" });
  assert.deepEqual(selectSingleUploadFile([]), { file: null, reason: "empty" });
  assert.deepEqual(selectSingleUploadFile([file, { name: "other.png" }]), { file: null, reason: "multiple" });
});

test("applies and restores title and favicon while surviving SPA/head changes", async () => {
  const document = createDocument();
  const original = document.createElement("link");
  original.rel = "shortcut icon";
  original.type = "image/x-icon";
  original.sizes = "32x32";
  original.href = "/original.ico";
  original.setAttribute("data-page-owner", "site");
  document.head.append(original);

  const manager = createTabDisplayManager({ document, MutationObserver: FakeMutationObserver });
  manager.start();
  manager.setState({
    enabled: true,
    prefix: "[DEV] ",
    override: "",
    faviconEnabled: true,
    favicon: { source: "preset", type: "solid-rounded-square", value: "#059669" }
  });

  assert.equal(document.title, "[DEV] Console");
  assert.equal(browserIconLinks(document).length, 1);
  const managedIcon = browserIconLinks(document)[0];
  assert.equal(managedIcon.dataset.envmateManaged, "favicon");
  assert.equal(managedIcon.getAttribute("sizes"), "64x64");
  const initialAttributeWrites = managedIcon.attributeWrites;
  for (let index = 0; index < 3; index += 1) await flush();
  const settledMutationCallbacks = fakeMutationCallbacks;
  for (let index = 0; index < 3; index += 1) await flush();
  assert.equal(managedIcon.attributeWrites, initialAttributeWrites);
  assert.equal(fakeMutationCallbacks, settledMutationCallbacks);

  manager.setState({ enabled: false, faviconEnabled: false });
  assert.equal(browserIconLinks(document).length, 1);
  assert.equal(browserIconLinks(document)[0].href, "/original.ico");
  assert.equal(browserIconLinks(document)[0].rel, "shortcut icon");
  assert.equal(browserIconLinks(document)[0].type, "image/x-icon");
  assert.equal(browserIconLinks(document)[0].getAttribute("sizes"), "32x32");
  assert.equal(browserIconLinks(document)[0].getAttribute("data-page-owner"), "site");
  const disabledMutationCallbacks = fakeMutationCallbacks;
  await flush();
  assert.equal(fakeMutationCallbacks, disabledMutationCallbacks);

  manager.setState({
    enabled: true,
    prefix: "[DEV] ",
    override: "",
    faviconEnabled: true,
    favicon: { source: "preset", type: "solid-rounded-square", value: "#059669" }
  });

  document.title = "Users";
  await flush();
  assert.equal(document.title, "[DEV] Users");

  document.replaceHead();
  const replacementOriginal = document.createElement("link");
  replacementOriginal.rel = "icon";
  replacementOriginal.href = "/replacement.ico";
  document.head.append(replacementOriginal);
  await flush();
  assert.equal(document.title, "[DEV] Users");
  assert.equal(browserIconLinks(document).length, 1);
  assert.equal(browserIconLinks(document)[0].dataset.envmateManaged, "favicon");

  manager.setState({ enabled: false, faviconEnabled: false });
  assert.equal(document.title, "Users");
  assert.equal(browserIconLinks(document).length, 1);
  assert.equal(browserIconLinks(document)[0].href, "/replacement.ico");
  manager.stop();
});

test("reconciles dynamically added and rewritten favicons and restores their latest state", async () => {
  const document = createDocument();
  const original = document.createElement("link");
  original.rel = "icon";
  original.href = "/original.ico";
  document.head.append(original);

  const manager = createTabDisplayManager({ document, MutationObserver: FakeMutationObserver });
  manager.start();
  manager.setState({
    enabled: true,
    faviconEnabled: true,
    favicon: { source: "upload", type: "image/png", value: "data:image/png;base64,AA==" }
  });

  const added = document.createElement("link");
  added.rel = "shortcut icon";
  added.href = "/added.ico";
  added.setAttribute("data-page-owner", "spa");
  document.head.append(added);

  original.rel = "shortcut icon";
  original.href = "/rewritten.ico";
  original.sizes = "48x48";
  await flush();

  assert.equal(browserIconLinks(document).length, 1);
  assert.equal(browserIconLinks(document)[0].dataset.envmateManaged, "favicon");

  manager.setState({ enabled: false, faviconEnabled: false });
  const restored = browserIconLinks(document);
  assert.equal(restored.length, 2);
  assert.deepEqual(restored.map((node) => node.href), ["/rewritten.ico", "/added.ico"]);
  assert.equal(restored[0].rel, "shortcut icon");
  assert.equal(restored[0].getAttribute("sizes"), "48x48");
  assert.equal(restored[1].rel, "shortcut icon");
  assert.equal(restored[1].getAttribute("data-page-owner"), "spa");
  manager.stop();
});

test("uses a custom title only when it has nonblank content", () => {
  const document = createDocument("Console");
  const manager = createTabDisplayManager({ document, MutationObserver: FakeMutationObserver });
  manager.start();
  manager.setState({ enabled: true, prefix: "ENV - ", override: "Billing Console", faviconEnabled: false });
  assert.equal(document.title, "ENV - Billing Console");
  manager.setState({ enabled: true, prefix: "ENV - ", override: "   ", faviconEnabled: false });
  assert.equal(document.title, "ENV - Console");
  manager.stop();
});
