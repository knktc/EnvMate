const test = require("node:test");
const assert = require("node:assert/strict");
const { normalize, tintPixels, upload, createFaviconManager } = require("../src/favicon-manager.js");
const tick = () => new Promise((resolve) => setTimeout(resolve, 10));

function fixture() {
  let callback;
  class Observer {
    constructor(fn) { callback = fn; }
    observe() {}
    disconnect() {}
  }
  const nodes = [];
  function link(href) {
    const attributes = { rel: "icon", href };
    const node = {
      nodeName: "LINK", isConnected: true,
      get href() { return new URL(attributes.href, "https://example.test/").href; },
      getAttribute: (key) => attributes[key] ?? null,
      setAttribute: (key, value) => { attributes[key] = value; },
      removeAttribute: (key) => { delete attributes[key]; },
      remove() { this.isConnected = false; }
    };
    nodes.push(node);
    return node;
  }
  const document = { documentElement: {}, baseURI: "https://example.test/page", head: { append() {} },
    querySelectorAll: () => nodes.filter((n) => n.isConnected), createElement: () => link(undefined) };
  return { document, Observer, link, nodes, mutate(node) { callback([{ type: "attributes", target: node }]); },
    replaceHead() { nodes.forEach((n) => { n.isConnected = false; }); callback([{ type: "childList", addedNodes: [{ nodeName: "HEAD" }], removedNodes: [] }]); } };
}
function manager(f, options = {}) {
  const result = createFaviconManager({ document: f.document, MutationObserver: f.Observer,
    load: async (url) => url, render: async (url, state) => `${url}:${state.faviconColor}`, ...options });
  result.start(); return result;
}
test("old and malformed configuration defaults to original; JSON round trip preserves icon", () => {
  assert.equal(normalize().faviconMode, "original");
  assert.equal(normalize({ faviconMode: "invalid", faviconColor: "oops" }).faviconColor, "#2563eb");
  assert.equal(normalize({ badgeColor: "#abcdef" }).faviconColor, "#abcdef");
  assert.equal(normalize({ faviconIntensity: 8 }).faviconIntensity, 1);
  assert.equal(normalize({ faviconDataUrl: "https://example.test/icon.png" }).faviconDataUrl, "");
  const config = normalize({ faviconMode: "custom", faviconDataUrl: "data:image/png;base64,AAAA" });
  assert.deepEqual(normalize(JSON.parse(JSON.stringify(config))), config);
});
test("upload rejects oversized and unsupported files before decoding", async () => {
  await assert.rejects(upload({ name: "large.png", size: 2097153 }));
  await assert.rejects(upload({ name: "script.svg", size: 10 }));
  await assert.rejects(upload({ name: "fake.png", size: 10, slice: () => new Blob(["<svg/>"]) }));
});

test("multiple icons restore attributes and keep latest site changes", async () => {
  const f = fixture(), a = f.link("/a.ico"), b = f.link("/b.png"), m = manager(f);
  m.setState({ faviconMode: "tint" }); await tick();
  assert.match(a.getAttribute("href"), /#2563eb$/); assert.equal(b.getAttribute("type"), "image/png");
  a.setAttribute("href", "/new.ico"); f.mutate(a); await tick();
  m.setState({}); await tick();
  assert.equal(a.getAttribute("href"), "/new.ico"); assert.equal(b.getAttribute("href"), "/b.png");
  assert.equal(b.getAttribute("type"), null); assert.equal(b.getAttribute("sizes"), null);
  m.stop();
});
test("head replacement and newly inserted icons get the current filter", async () => {
  const f = fixture(); f.link("/old.ico"); const m = manager(f);
  m.setState({ faviconMode: "tint" }); await tick();
  f.replaceHead(); const node = f.link("/new.ico"); await tick();
  assert.match(node.getAttribute("href"), /new.ico:#2563eb$/);
  m.stop(); assert.equal(node.getAttribute("href"), "/new.ico");
});
test("failed reads preserve originals and missing icons use root favicon", async () => {
  const f = fixture(), node = f.link("/private.ico"), m = manager(f, { load: async () => { throw Error("fail"); } });
  m.setState({ faviconMode: "tint" }); await tick(); assert.equal(node.getAttribute("href"), "/private.ico"); m.stop();
  const empty = fixture(); let source;
  const fallback = manager(empty, { load: async (url) => { source = url; return url; } });
  fallback.setState({ faviconMode: "tint" }); await tick(); assert.equal(source, "https://example.test/favicon.ico");
  fallback.stop(); assert.equal(empty.nodes[0].isConnected, false);
});
test("late async results cannot overwrite a newer environment or disabled state", async () => {
  const f = fixture(), node = f.link("/base.ico"), pending = [];
  const m = manager(f, { render: () => new Promise((resolve) => pending.push(resolve)) });
  m.setState({ faviconMode: "tint", faviconColor: "#ff0000" }); await tick();
  m.setState({ faviconMode: "tint", faviconColor: "#00ff00" }); await tick();
  pending[1]("green"); await tick(); pending[0]("red"); await tick();
  assert.equal(node.getAttribute("href"), "green");
  m.setState({}); await tick(); assert.equal(node.getAttribute("href"), "/base.ico"); m.stop();
});
