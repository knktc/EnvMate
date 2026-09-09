const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
function loader(fetch) {
  const context = vm.createContext({ URL, AbortController, setTimeout, clearTimeout, Uint8Array, btoa, fetch,
    chrome: { runtime: { onMessage: { addListener() {} } } } });
  const source = fs.readFileSync(require.resolve("../src/background.js"), "utf8").split("const DEFAULT_SETTINGS =")[0];
  vm.runInContext(source, context);
  return context.loadFavicon;
}
test("background reads cross-origin images without cookies and encodes bytes", async () => {
  let options;
  const load = loader(async (_, init) => { options = init; return new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/png" } }); });
  assert.equal(await load("https://cdn.example.test/icon.png"), "data:image/png;base64,AQID");
  assert.equal(options.credentials, "omit"); assert.ok(options.signal);
});
test("background rejects unsupported protocols, errors, and oversized streamed images", async () => {
  const load = loader(async () => new Response("missing", { status: 404 }));
  await assert.rejects(load("file:///private.ico"));
  await assert.rejects(load("https://example.test/missing.ico"));
  const oversized = loader(async () => new Response(new Uint8Array(2097153), { headers: { "content-type": "image/png" } }));
  await assert.rejects(oversized("https://example.test/large.png"));
});
