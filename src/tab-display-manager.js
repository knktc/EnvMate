(function (global) {
  const FALLBACK_COLOR = "#2563eb";
  const PRESET_TYPE = "solid-rounded-square";
  const PRESET_CIRCLE_TYPE = "solid-circle";

  function escapeSvgText(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function svgDataUrl(svg) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function emojiDataUrl(value) {
    const emoji = escapeSvgText(value || "🧪");
    return svgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">` +
        `<text x="32" y="32" text-anchor="middle" dominant-baseline="central" font-size="58" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${emoji}</text>` +
      `</svg>`
    );
  }

  function presetDataUrl(type, value) {
    const color = /^#[0-9a-f]{6}$/i.test(String(value || "")) ? String(value).toUpperCase() : FALLBACK_COLOR;
    const shape = type === PRESET_CIRCLE_TYPE ? PRESET_CIRCLE_TYPE : PRESET_TYPE;
    const shapeMarkup = shape === PRESET_CIRCLE_TYPE
      ? `<circle cx="32" cy="32" r="29" fill="${color}" stroke="#0f172a" stroke-opacity=".18" stroke-width="2"/>`
      : `<rect x="3" y="3" width="58" height="58" rx="15" fill="${color}" stroke="#0f172a" stroke-opacity=".18" stroke-width="2"/>`;
    return svgDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">` +
        shapeMarkup +
      `</svg>`
    );
  }

  function iconHref(favicon) {
    if (!favicon || typeof favicon !== "object") return "";
    if (favicon.source === "upload" && typeof favicon.value === "string") return favicon.value;
    if (favicon.source === "emoji") return emojiDataUrl(favicon.value);
    return presetDataUrl(favicon.type, favicon.value);
  }

  function createTabDisplayManager(options = {}) {
    const documentRef = options.document || global.document;
    const MutationObserverRef = options.MutationObserver || global.MutationObserver;
    const setTimeoutRef = options.setTimeout || global.setTimeout;
    const clearTimeoutRef = options.clearTimeout || global.clearTimeout;

    let started = false;
    let enabled = false;
    let faviconEnabled = false;
    let favicon = null;
    let prefix = "";
    let override = "";
    let baseTitle = String(documentRef?.title || "");
    let renderedTitle = "";
    let renderedPrefix = "";
    let managedIcon = null;
    let observedHead = null;
    let originalIconRecords = [];
    let headObserver = null;
    let documentObserver = null;
    let reconcileTimer = null;

    function titleNode(node) {
      return node?.nodeName?.toLowerCase() === "title";
    }

    function getHead() {
      return documentRef?.head || null;
    }

    function removeManagedIcon() {
      if (managedIcon?.parentNode?.removeChild) {
        managedIcon.parentNode.removeChild(managedIcon);
      }
      managedIcon = null;
    }

    function iconLinks(head) {
      if (!head?.querySelectorAll) return [];
      return Array.from(head.querySelectorAll("link[rel~='icon'],link[rel='shortcut icon']"));
    }

    function cloneNode(node) {
      if (typeof node?.cloneNode === "function") return node.cloneNode(true);
      return node;
    }

    function attributeEntries(node) {
      const attributes = node?.attributes;
      if (!attributes) return [];
      if (typeof attributes.length === "number") {
        return Array.from(attributes, (attribute) => [attribute.name, String(attribute.value)]);
      }
      return Object.entries(attributes).map(([name, value]) => [name, String(value)]);
    }

    function attributeState(node, name) {
      if (!node) return { present: false, value: "" };
      if (typeof node.hasAttribute === "function") {
        return { present: node.hasAttribute(name), value: node.getAttribute(name) || "" };
      }
      const value = node.getAttribute?.(name);
      return { present: value !== null && value !== undefined, value: String(value ?? "") };
    }

    function restoreNodeAttributes(node, snapshot) {
      if (!node || !snapshot) return;
      const expected = new Map(attributeEntries(snapshot));
      for (const [name] of attributeEntries(node)) {
        if (!expected.has(name) && node.removeAttribute) node.removeAttribute(name);
      }
      for (const [name, value] of expected) {
        const current = attributeState(node, name);
        if (!current.present || current.value !== value) {
          if (node.setAttribute) node.setAttribute(name, value);
          else node[name] = value;
        }
      }
    }

    function childIndex(head, node) {
      const children = Array.from(head?.children || head?.childNodes || []);
      const index = children.indexOf(node);
      return index < 0 ? children.length : index;
    }

    function isInHead(head, node) {
      return Boolean(head && node && (node.parentNode === head || Array.from(head.children || []).includes(node)));
    }

    function insertAt(head, node, index) {
      if (!head || !node) return;
      const children = Array.from(head.children || head.childNodes || []);
      const reference = children[Math.min(Math.max(index, 0), children.length)] || null;
      if (reference && head.insertBefore) head.insertBefore(node, reference);
      else if (head.append) head.append(node);
    }

    function isManagedIcon(node) {
      return node === managedIcon || node?.dataset?.envmateManaged === "favicon" ||
        node?.getAttribute?.("data-envmate-managed") === "favicon";
    }

    function findOriginalRecord(node) {
      return originalIconRecords.find((record) => record.node === node) || null;
    }

    function observeOriginalNode(record) {
      if (!headObserver || !record?.node || record.observedWith === headObserver) return;
      headObserver.observe(record.node, {
        attributes: true
      });
      record.observedWith = headObserver;
    }

    function captureOriginalIcon(head, node, index = childIndex(head, node)) {
      if (!node || isManagedIcon(node)) return null;
      let record = findOriginalRecord(node);
      if (!record) {
        record = { node, snapshot: cloneNode(node), index, order: originalIconRecords.length };
        originalIconRecords.push(record);
      } else {
        record.index = index;
        record.snapshot = cloneNode(node);
      }
      observeOriginalNode(record);
      return record;
    }

    function captureOriginalIcons(head) {
      if (!head) return;
      const nodes = iconLinks(head).filter((node) => !isManagedIcon(node));
      nodes.forEach((node) => captureOriginalIcon(head, node, childIndex(head, node)));
    }

    function quarantineOriginalIcons(head) {
      if (!head) return;
      const nodes = iconLinks(head).filter((node) => !isManagedIcon(node));
      const positions = new Map(nodes.map((node) => [node, childIndex(head, node)]));
      nodes.forEach((node) => {
        const record = captureOriginalIcon(head, node, positions.get(node));
        if (record && node.parentNode === head && head.removeChild) head.removeChild(node);
      });
    }

    function restoreOriginalIcons(head) {
      if (!head || !originalIconRecords.length) return;
      const records = [...originalIconRecords].sort((left, right) => left.index - right.index || left.order - right.order);
      records.forEach((record) => {
        const node = record.node || cloneNode(record.snapshot);
        if (!node) return;
        if (node.parentNode && node.parentNode !== head && node.parentNode.removeChild) node.parentNode.removeChild(node);
        if (!isInHead(head, node)) insertAt(head, node, record.index);
        restoreNodeAttributes(node, record.snapshot);
      });
      originalIconRecords = [];
    }

    function refreshOriginalSnapshots() {
      originalIconRecords.forEach((record) => {
        if (record?.node && !isManagedIcon(record.node)) record.snapshot = cloneNode(record.node);
      });
    }

    function setManagedAttribute(node, propertyName, attributeName, value) {
      const nextValue = String(value);
      const currentValue = node?.getAttribute
        ? node.getAttribute(attributeName)
        : String(node?.[propertyName] ?? "");
      if (currentValue === nextValue) return;
      if (node?.setAttribute) node.setAttribute(attributeName, nextValue);
      else if (node) node[propertyName] = nextValue;
    }

    function stripRenderedTitle(value) {
      const nextValue = String(value || "");
      if (renderedTitle && nextValue === renderedTitle) return baseTitle;
      if (renderedPrefix && nextValue.startsWith(renderedPrefix)) return nextValue.slice(renderedPrefix.length);
      return nextValue;
    }

    function capturePageTitle() {
      const currentTitle = String(documentRef?.title || "");
      if (currentTitle !== renderedTitle) baseTitle = stripRenderedTitle(currentTitle);
      return currentTitle;
    }

    function effectiveTitle() {
      const customTitle = String(override || "").trim();
      return `${prefix}${customTitle ? override : baseTitle}`;
    }

    function applyTitle() {
      const currentTitle = String(documentRef?.title || "");
      const nextTitle = enabled ? effectiveTitle() : baseTitle;
      renderedPrefix = enabled ? prefix : "";
      renderedTitle = nextTitle;
      if (currentTitle !== nextTitle && documentRef) documentRef.title = nextTitle;
    }

    function applyFavicon() {
      const head = getHead();
      const href = iconHref(favicon);
      if (!head || !enabled || !faviconEnabled || !favicon || !href) {
        refreshOriginalSnapshots();
        captureOriginalIcons(head);
        removeManagedIcon();
        restoreOriginalIcons(head);
        return;
      }

      refreshOriginalSnapshots();
      quarantineOriginalIcons(head);

      if (!managedIcon || managedIcon.ownerDocument !== documentRef) {
        removeManagedIcon();
        managedIcon = documentRef.createElement("link");
        if (managedIcon.dataset) managedIcon.dataset.envmateManaged = "favicon";
        setManagedAttribute(managedIcon, "envmateManaged", "data-envmate-managed", "favicon");
      }
      setManagedAttribute(managedIcon, "rel", "rel", "icon");
      setManagedAttribute(managedIcon, "type", "type", favicon.source === "upload" ? "image/png" : "image/svg+xml");
      setManagedAttribute(managedIcon, "sizes", "sizes", "64x64");
      setManagedAttribute(managedIcon, "href", "href", href);
      if (managedIcon.parentNode !== head) head.append(managedIcon);
      else if (head.lastChild !== managedIcon && head.append) head.append(managedIcon);
    }

    function reconcile() {
      reconcileTimer = null;
      if (!started) return;
      const currentTitle = capturePageTitle();
      if (!enabled && currentTitle === baseTitle) renderedTitle = currentTitle;
      applyTitle();
      applyFavicon();
    }

    function scheduleReconcile() {
      if (!started || reconcileTimer !== null) return;
      reconcileTimer = setTimeoutRef(reconcile, 0);
    }

    function mutationTouchesTitle(mutation) {
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

    function observeHead() {
      const nextHead = getHead();
      if (nextHead === observedHead) return;
      if (headObserver) headObserver.disconnect();
      removeManagedIcon();
      observedHead = nextHead;
      originalIconRecords = [];
      headObserver = null;
      if (!MutationObserverRef || !observedHead) return;
      headObserver = new MutationObserverRef((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type !== "attributes") return;
          const record = findOriginalRecord(mutation.target);
          if (record && !isManagedIcon(record.node)) record.snapshot = cloneNode(record.node);
        });
        if (mutations.length) scheduleReconcile();
      });
      headObserver.observe(observedHead, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      });
    }

    function start() {
      if (started) return;
      started = true;
      baseTitle = String(documentRef?.title || "");
      observeHead();
      if (MutationObserverRef && documentRef?.documentElement) {
        documentObserver = new MutationObserverRef(() => {
          observeHead();
          scheduleReconcile();
        });
        documentObserver.observe(documentRef.documentElement, { childList: true, subtree: false });
      }
      scheduleReconcile();
    }

    function setState(nextState = {}) {
      if (!started) start();
      capturePageTitle();
      enabled = nextState.enabled === true;
      faviconEnabled = nextState.faviconEnabled === true;
      favicon = nextState.favicon && typeof nextState.favicon === "object" ? nextState.favicon : null;
      prefix = String(nextState.prefix ?? "");
      override = String(nextState.override ?? "");
      observeHead();
      reconcile();
    }

    function stop() {
      started = false;
      refreshOriginalSnapshots();
      if (reconcileTimer !== null) {
        clearTimeoutRef(reconcileTimer);
        reconcileTimer = null;
      }
      if (headObserver) headObserver.disconnect();
      if (documentObserver) documentObserver.disconnect();
      headObserver = null;
      documentObserver = null;
      observedHead = null;
      removeManagedIcon();
      restoreOriginalIcons(getHead());
      originalIconRecords = [];
      if (documentRef && String(documentRef.title || "") !== baseTitle) documentRef.title = baseTitle;
      renderedTitle = baseTitle;
      renderedPrefix = "";
    }

    return { start, stop, setState };
  }

  const api = { createTabDisplayManager, emojiDataUrl, iconHref };
  global.EnvMateTabDisplayManager = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
