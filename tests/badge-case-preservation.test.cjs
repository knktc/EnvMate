const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function getBadgeRuleBodies(relativePath, selector) {
  const css = fs.readFileSync(path.join(__dirname, "..", relativePath), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const selectorPattern = new RegExp(`^${escapedSelector}(?:$|\\[)`);
  const bodies = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors]) => selectors.split(",").some((entry) => selectorPattern.test(entry.trim())))
    .map(([, , body]) => body);

  assert.ok(bodies.length > 0, `${selector} rules should exist in ${relativePath}`);
  return bodies;
}

function assertBadgeKeepsInputCase(relativePath, selector) {
  for (const [index, body] of getBadgeRuleBodies(relativePath, selector).entries()) {
    assert.doesNotMatch(
      body,
      /text-transform\s*:\s*uppercase\b/i,
      `${relativePath} ${selector} rule ${index + 1} should preserve the configured casing`
    );
  }
}

test("page badges preserve entered casing for slanted and pill styles", () => {
  assertBadgeKeepsInputCase("src/content.css", ".envmate-badge");
});

test("options badge previews preserve entered casing for slanted and pill styles", () => {
  assertBadgeKeepsInputCase("options/options.css", ".marker-preview__badge");
});
