const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const contentSource = fs.readFileSync(path.join(root, "src/content.js"), "utf8");
const contentCss = fs.readFileSync(path.join(root, "src/content.css"), "utf8");

function extractFunction(name) {
  const start = contentSource.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `${name} should be defined`);

  const openBrace = contentSource.indexOf("{", start);
  let depth = 0;
  for (let index = openBrace; index < contentSource.length; index += 1) {
    if (contentSource[index] === "{") depth += 1;
    if (contentSource[index] === "}") {
      depth -= 1;
      if (depth === 0) return contentSource.slice(start, index + 1);
    }
  }

  assert.fail(`${name} should have a complete function body`);
}

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }

  contains(value) {
    return this.values.has(value);
  }
}

function createRuntimeHarness() {
  const createdElements = [];
  const appendedElements = [];
  const windowListeners = new Map();
  const timers = new Map();
  let nextTimerId = 1;

  const window = {
    setTimeout(callback, delay) {
      const id = nextTimerId++;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
    addEventListener(type, callback, capture) {
      const listeners = windowListeners.get(type) || [];
      listeners.push({ callback, capture });
      windowListeners.set(type, listeners);
    },
    removeEventListener(type, callback, capture) {
      const listeners = windowListeners.get(type) || [];
      windowListeners.set(
        type,
        listeners.filter((listener) => listener.callback !== callback || listener.capture !== capture)
      );
    },
    emit(type, event) {
      for (const { callback } of [...(windowListeners.get(type) || [])]) callback(event);
    }
  };

  const document = {
    createElement(tagName) {
      const listeners = new Map();
      const element = {
        tagName,
        className: "",
        dataset: {},
        children: [],
        classList: new FakeClassList(),
        style: {
          pointerEvents: "",
          values: {},
          setProperty(name, value) {
            this.values[name] = value;
          }
        },
        addEventListener(type, callback) {
          const callbacks = listeners.get(type) || [];
          callbacks.push(callback);
          listeners.set(type, callbacks);
        },
        fire(type, event = {}) {
          for (const callback of listeners.get(type) || []) callback(event);
        },
        append(...children) {
          this.children.push(...children);
        },
        getBoundingClientRect() {
          return { left: 10, top: 20, right: 110, bottom: 60 };
        }
      };
      createdElements.push(element);
      return element;
    },
    documentElement: {
      append(...elements) {
        appendedElements.push(...elements);
      }
    }
  };

  const context = vm.createContext({
    document,
    window,
    markerLabel: (environment) => environment.badge || environment.name,
    t: (key) => key
  });
  const names = ["enableBadgePeekThrough", "createBadge"];
  const declarations = names.map(extractFunction);
  const exports = names.map((name) => `globalThis.${name} = ${name};`);
  vm.runInContext([...declarations, ...exports].join("\n\n"), context, { filename: "src/content.js" });

  return {
    context,
    createdElements,
    appendedElements,
    timers,
    windowListeners,
    runTimer(id) {
      const timer = timers.get(id);
      assert.ok(timer, `timer ${id} should be pending`);
      timers.delete(id);
      timer.callback();
    },
    window
  };
}

test("page badge peek opacity is fixed at 6 percent regardless of its configured opacity", () => {
  const normalRule = contentCss.match(/\.envmate-badge\s*\{([^}]*)\}/)?.[1];
  const rule = contentCss.match(/\.envmate-badge\.envmate-badge--peek\s*\{([^}]*)\}/)?.[1];
  assert.ok(normalRule, "the normal page badge rule should exist");
  assert.ok(rule, "the page badge peek rule should exist");
  assert.match(normalRule, /opacity:\s*var\(--envmate-badge-opacity,\s*1\)\s*;/);
  assert.match(rule, /opacity:\s*0\.06\s*;/);
  assert.doesNotMatch(rule, /var\(|calc\(/);
});

test("page badge peek keeps the mouse interaction and restores its original state", () => {
  const harness = createRuntimeHarness();
  harness.context.createBadge({ badge: "Pre", badgeStyle: "pill", badgeOpacity: 0.5 }, {});
  const badge = harness.appendedElements[0];

  assert.equal(badge.style.values["--envmate-badge-opacity"], 0.5);
  assert.equal(badge.classList.contains("envmate-badge--peek"), false);
  assert.equal(badge.style.pointerEvents, "");

  badge.fire("mouseenter");
  assert.equal(badge.classList.contains("envmate-badge--peek"), true);
  assert.equal(badge.style.pointerEvents, "", "the badge should remain hit-testable during the fade delay");

  const [timerId] = harness.timers.keys();
  assert.equal(harness.timers.get(timerId).delay, 120);
  harness.runTimer(timerId);
  assert.equal(badge.style.pointerEvents, "none", "the page should receive pointer events after the delay");
  assert.equal(harness.windowListeners.get("mousemove").length, 1);

  harness.window.emit("mousemove", { clientX: 50, clientY: 40 });
  assert.equal(badge.classList.contains("envmate-badge--peek"), true, "moving within the badge should keep it faded");

  harness.window.emit("mousemove", { clientX: 0, clientY: 0 });
  assert.equal(badge.classList.contains("envmate-badge--peek"), false);
  assert.equal(badge.style.pointerEvents, "");
  assert.equal(harness.windowListeners.get("mousemove").length, 0);
});
