const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.join(__dirname, "..");
const css = fs.readFileSync(path.join(root, "options/options.css"), "utf8");
const script = fs.readFileSync(path.join(root, "options/options.js"), "utf8");

function styleBlock(selector, nextSelector) {
  const start = css.indexOf(`${selector} {`);
  const end = css.indexOf(`${nextSelector} {`, start);
  assert.ok(start >= 0 && end > start, `${selector} styles should exist`);
  return css.slice(start, end);
}

test("disabled environment status stays on one line while the name takes the shrink", () => {
  const nameStyles = styleBlock(".environment-item__name", ".environment-item__name-text");
  assert.match(nameStyles, /display:\s*grid/);
  assert.match(nameStyles, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto\s+var\(--environment-badge-slot-width\)/);

  const nameTextStyles = styleBlock(".environment-item__name-text", ".environment-item__badge");
  assert.match(nameTextStyles, /grid-column:\s*1/);
  assert.match(nameTextStyles, /min-width:\s*0/);
  assert.match(nameTextStyles, /overflow:\s*hidden/);
  assert.match(nameTextStyles, /text-overflow:\s*ellipsis/);
  assert.match(nameTextStyles, /white-space:\s*nowrap/);

  const statusStyles = styleBlock(".environment-item__status", ".toggle-control__switch");
  assert.match(statusStyles, /grid-column:\s*2/);
  assert.match(statusStyles, /flex:\s*0\s+0\s+auto/);
  assert.match(statusStyles, /white-space:\s*nowrap/);

  const environmentRendererStart = script.indexOf("const nameText = document.createElement(\"span\");");
  const environmentRendererEnd = script.indexOf("const badge = document.createElement(\"span\");", environmentRendererStart);
  assert.ok(
    environmentRendererStart >= 0 && environmentRendererEnd > environmentRendererStart,
    "environment name renderer should exist"
  );
  assert.match(script.slice(environmentRendererStart, environmentRendererEnd), /nameText\.className\s*=\s*"environment-item__name-text"/);
});

test("long environment badges truncate in the list without changing their stored label", () => {
  const nameStyles = styleBlock(".environment-item__name", ".environment-item__name-text");
  assert.match(nameStyles, /min-width:\s*0/);

  const badgeSlotStyles = styleBlock(".environment-item__badge-slot", ".environment-item.is-active .environment-item__badge");
  assert.match(badgeSlotStyles, /grid-column:\s*3/);
  assert.match(badgeSlotStyles, /display:\s*grid/);
  assert.match(badgeSlotStyles, /width:\s*100%/);
  assert.match(badgeSlotStyles, /overflow:\s*hidden/);

  const badgeStyles = styleBlock(".environment-item__badge", ".environment-item__badge-slot");
  assert.match(badgeStyles, /justify-self:\s*end/);
  assert.match(badgeStyles, /min-width:\s*0/);
  assert.match(badgeStyles, /max-width:\s*100%/);
  assert.match(badgeStyles, /overflow:\s*hidden/);
  assert.match(badgeStyles, /text-overflow:\s*ellipsis/);
  assert.match(badgeStyles, /white-space:\s*nowrap/);

  const badgeRendererStart = script.indexOf('const badge = document.createElement("span");');
  const badgeRendererEnd = script.indexOf('const meta = document.createElement("div");', badgeRendererStart);
  assert.ok(
    badgeRendererStart >= 0 && badgeRendererEnd > badgeRendererStart,
    "environment badge renderer should exist"
  );
  const badgeRenderer = script.slice(badgeRendererStart, badgeRendererEnd);
  assert.match(badgeRenderer, /badge\.textContent\s*=\s*markerLabel\(environment\)/);
  assert.match(badgeRenderer, /badgeSlot\.className\s*=\s*"environment-item__badge-slot"/);
  assert.match(badgeRenderer, /badgeSlot\.append\(badge\)/);
});
