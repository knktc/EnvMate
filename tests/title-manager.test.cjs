const assert = require("node:assert/strict");
const test = require("node:test");
const { createTitleManager } = require("../src/title-manager.js");

const observers = new Set();

class FakeMutationObserver {
  constructor(callback) {
    this.callback = callback;
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
    if (
      observer.registrations.some(
        ({ target, options }) => target === record.target || (options.subtree && isWithin(record.target, target))
      )
    ) {
      observer.callback([record]);
    }
  }
}

function createDocument(initialTitle) {
  const documentElement = { nodeName: "HTML" };
  const head = { nodeName: "HEAD", parentNode: documentElement };
  let currentHead = head;
  let titleNode = { nodeName: "TITLE", parentNode: currentHead };
  let title = initialTitle;

  return {
    documentElement,
    get head() {
      return currentHead;
    },
    replaceHead() {
      const previousHead = currentHead;
      currentHead = { nodeName: "HEAD", parentNode: documentElement };
      titleNode = { nodeName: "TITLE", parentNode: currentHead };
      emitMutation({
        type: "childList",
        target: documentElement,
        addedNodes: [currentHead],
        removedNodes: [previousHead]
      });
    },
    get title() {
      return title;
    },
    set title(nextTitle) {
      title = String(nextTitle);
      emitMutation({ type: "childList", target: titleNode, addedNodes: [], removedNodes: [] });
    }
  };
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

test("keeps the environment prefix when the page changes its title", async () => {
  const document = createDocument("Console");
  const manager = createTitleManager({ document, MutationObserver: FakeMutationObserver });
  manager.start();
  manager.setState({ enabled: true, label: "DEV" });

  assert.equal(document.title, "[DEV] Console");
  document.title = "Users";
  await flush();
  assert.equal(document.title, "[DEV] Users");

  manager.stop();
});

test("does not duplicate the prefix and restores the latest base title", async () => {
  const document = createDocument("Console");
  const manager = createTitleManager({ document, MutationObserver: FakeMutationObserver });
  manager.start();
  manager.setState({ enabled: true, label: "DEV" });

  document.title = "[DEV] Users";
  await flush();
  assert.equal(document.title, "[DEV] Users");

  manager.setState({ enabled: false });
  assert.equal(document.title, "Users");

  document.title = "Settings";
  await flush();
  manager.setState({ enabled: true, label: "PROD" });
  assert.equal(document.title, "[PROD] Settings");

  manager.stop();
});

test("reconnects when the page replaces the head and title nodes", async () => {
  const document = createDocument("Console");
  const manager = createTitleManager({ document, MutationObserver: FakeMutationObserver });
  manager.start();
  manager.setState({ enabled: true, label: "TEST" });

  document.replaceHead();
  document.title = "Reports";
  await flush();
  assert.equal(document.title, "[TEST] Reports");

  manager.stop();
});
