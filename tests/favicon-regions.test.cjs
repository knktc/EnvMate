const test = require("node:test");
const assert = require("node:assert/strict");
const { tintPixels, normalize } = require("../src/favicon-manager.js");
const size = 16;
const red = [220, 38, 38, 255];
const white = [255, 255, 255, 255];
const blue = [40, 70, 180, 255];
const center = (x, y) => x >= 5 && x <= 10 && y >= 5 && y <= 10;
function make(pixel) {
  return new Uint8ClampedArray(Array.from({ length: size * size }, (_, p) => pixel(p % size, Math.floor(p / size))).flat());
}
function get(data, x, y) { return Array.from(data.slice((y * size + x) * 4, (y * size + x) * 4 + 4)); }
function apply(data, region = "auto", intensity = 1) {
  return tintPixels(data, "#dc2626", intensity, { width: size, height: size, region });
}
function near(actual, expected) { actual.forEach((v, i) => assert.ok(Math.abs(v - expected[i]) <= 1, `${actual} != ${expected}`)); }

test("transparent black silhouette becomes the chosen color without filling transparency", () => {
  const data = make((x, y) => center(x, y) ? [0, 0, 0, 255] : [0, 0, 0, 0]);
  apply(data);
  near(get(data, 7, 7), red);
  assert.deepEqual(get(data, 0, 0), [0, 0, 0, 0]);
});
test("white-background pastel logo becomes saturated while its background stays white", () => {
  const data = make((x, y) => center(x, y) ? [170, 180, 220, 255] : white);
  apply(data);
  near(get(data, 7, 7), red);
  assert.deepEqual(get(data, 0, 0), white);
});
test("colored background changes color while white lettering stays white", () => {
  const data = make((x, y) => center(x, y) ? white : blue);
  apply(data);
  near(get(data, 0, 0), red);
  assert.deepEqual(get(data, 7, 7), white);
});
test("manual foreground recolors white lettering and preserves its colored background", () => {
  const data = make((x, y) => center(x, y) ? white : blue);
  apply(data, "foreground");
  assert.deepEqual(get(data, 0, 0), blue);
  near(get(data, 7, 7), red);
});
test("manual background recolors white background and preserves its logo", () => {
  const data = make((x, y) => center(x, y) ? blue : white);
  apply(data, "background");
  near(get(data, 0, 0), red);
  assert.deepEqual(get(data, 7, 7), blue);
});
test("enclosed white holes are preserved along with the white background", () => {
  const data = make((x, y) => center(x, y) && !(x === 7 && y === 7) ? blue : white);
  apply(data);
  assert.deepEqual(get(data, 7, 7), white);
  near(get(data, 6, 6), red);
});
test("zero intensity and fully transparent images are unchanged; alpha survives partial strength", () => {
  const original = make((x, y) => center(x, y) ? [0, 0, 0, 180] : [255, 255, 255, 0]);
  assert.deepEqual(apply(original.slice(), "auto", 0), original);
  const partial = apply(original.slice(), "foreground", 0.5);
  near(get(partial, 7, 7), [110, 19, 19, 180]);
  for (let i = 3; i < partial.length; i += 4) assert.equal(partial[i], original[i]);
  const transparent = make(() => [90, 90, 90, 0]);
  assert.deepEqual(apply(transparent.slice()), transparent);
});
test("background mode does not paint a transparent background", () => {
  const original = make((x, y) => center(x, y) ? blue : [0, 0, 0, 0]);
  assert.deepEqual(apply(original.slice(), "background"), original);
});
test("shading remains ordered inside a foreground region", () => {
  const data = make((x, y) => center(x, y) ? [30 + x * 8, 30 + x * 8, 30 + x * 8, 255] : white);
  apply(data);
  const brightness = (pixel) => pixel[0] * 0.2126 + pixel[1] * 0.7152 + pixel[2] * 0.0722;
  assert.ok(brightness(get(data, 9, 7)) > brightness(get(data, 6, 7)));
});
test("old settings default to auto and explicit regions survive JSON import/export", () => {
  assert.equal(normalize().faviconRegion, "auto");
  assert.equal(normalize({ faviconRegion: "bad" }).faviconRegion, "auto");
  for (const faviconRegion of ["auto", "foreground", "background"]) {
    const config = normalize({ faviconRegion });
    assert.deepEqual(normalize(JSON.parse(JSON.stringify(config))), config);
  }
});
