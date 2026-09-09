const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");

function background({ online = false, tabs = [{ id: 1, url: "https://example.test/", status: "complete" }], fail = false } = {}) {
  const calls = [];
  const event = { addListener() {} };
  const context = vm.createContext({ URL, console,
    chrome: {
      runtime: { id: "test", onInstalled: event, onStartup: event, onMessage: event },
      storage: { onChanged: event, local: { get: async () => ({ envmateSettings: { environments: [{ rules: [{ type: "prefix", value: "https://example.test/" }] }] } }) } },
      windows: { onFocusChanged: event },
      tabs: { onActivated: event, onUpdated: event, query: async () => tabs,
        get: async (id) => tabs.find((tab) => tab.id === id),
        sendMessage: async (id, message, target) => { calls.push(["ping", id, target.frameId]); if (!online) throw Error("No receiver"); return { ready: true }; } },
      scripting: {
        insertCSS: async ({ target }) => { calls.push(["css", target.tabId]); },
        executeScript: async ({ target, files }) => { calls.push(["js", target.tabId, ...files]); if (fail && target.tabId === 1) throw Error("Cannot access page"); },
        removeCSS: async ({ target }) => { calls.push(["remove", target.tabId]); }
      }
    }
  });
  vm.runInContext(fs.readFileSync(require.resolve("../src/background.js"), "utf8"), context);
  return { context, calls };
}

test("missing scripts are injected in dependency order without reloading the tab", async () => {
  const { context, calls } = background();
  await context.ensureTabContent(1);
  assert.deepEqual(calls, [["ping", 1, 0], ["css", 1], ["js", 1, "src/title-manager.js", "src/favicon-manager.js", "src/content.js"]]);
});
test("an online page is not reinjected", async () => {
  const { context, calls } = background({ online: true });
  await context.ensureTabContent(1);
  assert.deepEqual(calls, [["ping", 1, 0]]);
});
test("concurrent saves share one injection", async () => {
  const { context, calls } = background();
  await Promise.all([context.ensureTabContent(1), context.ensureTabContent(1)]);
  assert.equal(calls.filter(([type]) => type === "js").length, 1);
});
test("unmatched, internal, loading and discarded pages are skipped", async () => {
  const { context, calls } = background({ tabs: [
    { id: 1, url: "https://other.test/" }, { id: 2, url: "chrome://settings" },
    { id: 3, url: "https://example.test/", status: "loading" },
    { id: 4, url: "https://example.test/", discarded: true }
  ] });
  await context.syncExistingTabs();
  assert.deepEqual(calls, []);
});
test("a failed injection removes its CSS, releases the lock and does not block other tabs", async () => {
  const { context, calls } = background({ fail: true, tabs: [
    { id: 1, url: "https://example.test/" }, { id: 2, url: "https://example.test/" }
  ] });
  await context.syncExistingTabs();
  assert.ok(calls.some(([type, id]) => type === "remove" && id === 1));
  assert.ok(calls.some(([type, id]) => type === "js" && id === 2));
  await assert.rejects(context.ensureTabContent(1));
  assert.equal(calls.filter(([type, id]) => type === "js" && id === 1).length, 2);
});
test("content script initialization is idempotent in the same live runtime", () => {
  let managers = 0, messages = 0, intervals = 0;
  const context = vm.createContext({
    chrome: { runtime: { id: "test", onMessage: { addListener() { messages++; } } },
      storage: { local: { get: async () => ({}) }, onChanged: { addListener() {} } } },
    document: {},
    EnvMateTitleManager: { createTitleManager() { managers++; return { start() {} }; } },
    EnvMateFavicon: { createFaviconManager() { managers++; return { start() {} }; } },
    window: { location: { href: "https://example.test/" }, history: { pushState() {}, replaceState() {} },
      setInterval() { intervals++; }, addEventListener() {} }
  });
  const source = fs.readFileSync(require.resolve("../src/content.js"), "utf8");
  vm.runInContext(source, context); vm.runInContext(source, context);
  assert.equal(managers, 2); assert.equal(messages, 1); assert.equal(intervals, 1);
});
