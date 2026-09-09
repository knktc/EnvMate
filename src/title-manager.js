(function (global) {
  function createTitleManager(options = {}) {
    const documentRef = options.document || global.document;
    const MutationObserverRef = options.MutationObserver || global.MutationObserver;
    const setTimeoutRef = options.setTimeout || global.setTimeout;
    const clearTimeoutRef = options.clearTimeout || global.clearTimeout;

    let enabled = false;
    let label = "";
    let renderedLabel = "";
    let baseTitle = String(documentRef?.title || "");
    let renderedTitle = "";
    let reconcileTimer = null;
    let started = false;
    let observedHead = null;
    let headObserver = null;
    let documentObserver = null;

    function prefixFor(value) {
      return value ? `[${value}] ` : "";
    }

    function stripPrefix(value, prefixLabel = renderedLabel) {
      const prefix = prefixFor(prefixLabel);
      return prefix && value.startsWith(prefix) ? value.slice(prefix.length) : value;
    }

    function titleNode(node) {
      return node?.nodeName?.toLowerCase() === "title";
    }

    function titleMutation(mutation) {
      if (mutation.type === "characterData") {
        return titleNode(mutation.target) || titleNode(mutation.target?.parentNode);
      }
      if (mutation.type !== "childList") return false;
      return (
        titleNode(mutation.target) ||
        Array.from(mutation.addedNodes || []).some(titleNode) ||
        Array.from(mutation.removedNodes || []).some(titleNode)
      );
    }

    function setRenderedTitle(nextTitle) {
      renderedTitle = nextTitle;
      if (documentRef.title !== nextTitle) documentRef.title = nextTitle;
    }

    function reconcile() {
      reconcileTimer = null;
      const currentTitle = String(documentRef.title || "");
      if (currentTitle === renderedTitle) return;

      baseTitle = stripPrefix(currentTitle);
      const nextTitle = enabled ? `${prefixFor(label)}${baseTitle}` : baseTitle;
      if (currentTitle === nextTitle) {
        renderedTitle = currentTitle;
        return;
      }
      setRenderedTitle(nextTitle);
    }

    function scheduleReconcile() {
      if (!started || reconcileTimer !== null) return;
      reconcileTimer = setTimeoutRef(reconcile, 0);
    }

    function observeHead() {
      const nextHead = documentRef.head || null;
      if (nextHead === observedHead) return;

      if (headObserver) headObserver.disconnect();
      observedHead = nextHead;
      headObserver = null;
      if (!MutationObserverRef || !observedHead) return;

      headObserver = new MutationObserverRef((mutations) => {
        if (mutations.some(titleMutation)) scheduleReconcile();
      });
      headObserver.observe(observedHead, {
        childList: true,
        subtree: true,
        characterData: true
      });
      scheduleReconcile();
    }

    function start() {
      if (started) return;
      started = true;
      observeHead();

      if (MutationObserverRef && documentRef.documentElement) {
        documentObserver = new MutationObserverRef(() => {
          observeHead();
          scheduleReconcile();
        });
        documentObserver.observe(documentRef.documentElement, { childList: true });
      }
    }

    function setState(nextState = {}) {
      const currentTitle = String(documentRef.title || "");
      if (currentTitle !== renderedTitle) baseTitle = stripPrefix(currentTitle);

      enabled = nextState.enabled === true;
      label = String(nextState.label || "").trim();
      renderedLabel = enabled ? label : "";

      const nextTitle = enabled ? `${prefixFor(label)}${baseTitle}` : baseTitle;
      if (currentTitle === nextTitle) {
        renderedTitle = currentTitle;
        return;
      }
      setRenderedTitle(nextTitle);
    }

    function stop() {
      started = false;
      if (reconcileTimer !== null) {
        clearTimeoutRef(reconcileTimer);
        reconcileTimer = null;
      }
      if (headObserver) headObserver.disconnect();
      if (documentObserver) documentObserver.disconnect();
      headObserver = null;
      documentObserver = null;
      observedHead = null;
    }

    return { start, stop, setState };
  }

  const api = { createTitleManager };
  global.EnvMateTitleManager = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
