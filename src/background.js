const STORAGE_KEY = "envmateSettings";
const DEFAULT_GROUP_ID = "default";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "ENVMATE_LOAD_FAVICON") return false;
  if (sender.id !== chrome.runtime.id || !sender.tab) return false;
  loadFavicon(message.url).then((dataUrl) => sendResponse({ dataUrl }), () => sendResponse({ error: "load_failed" }));
  return true;
});

async function loadFavicon(value) {
  const url = new URL(value);
  const limit = 2 * 1024 * 1024;
  if (url.protocol === "data:") {
    if (value.length > limit || !/^data:image\/(png|jpeg|webp|x-icon|vnd.microsoft.icon);base64,/i.test(value)) throw new Error("Invalid image");
    return value;
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid protocol");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url.href, { signal: controller.signal, credentials: "omit" });
    if (!response.ok || Number(response.headers.get("content-length")) > limit) throw new Error("Invalid response");
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      size += chunk.length;
      if (size > limit) { await reader.cancel(); throw new Error("Image too large"); }
      chunks.push(chunk);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    let binary = "";
    for (let i = 0; i < size; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    const mime = response.headers.get("content-type")?.split(";")[0] || "image/x-icon";
    if (!/^image\/[a-z0-9.+-]+$/i.test(mime)) throw new Error("Invalid image type");
    return `data:${mime};base64,${btoa(binary)}`;
  } finally { clearTimeout(timer); }
}

const DEFAULT_SETTINGS = {
  groups: [{ id: DEFAULT_GROUP_ID, name: "Default Group" }],
  environments: [
    {
      id: "local",
      groupId: DEFAULT_GROUP_ID,
      name: "Local Dev",
      homepageUrl: "http://localhost/",
      lastQuickAccessAt: 0,
      enabled: true,
      badge: "LOCAL",
      badgeEnabled: true,
      badgeColor: "#2563eb",
      badgeTextColor: "#ffffff",
      badgeStyle: "slanted",
      badgePosition: "top-right",
      badgeScale: 1,
      badgeSize: 14,
      badgeOffset: 12,
      badgeOpacity: 1,
      watermarkText: "Local Dev",
      watermarkEnabled: false,
      watermarkColor: "#2563eb",
      watermarkOpacity: 0.08,
      watermarkAngle: -24,
      watermarkSize: 42,
      watermarkGap: 80,
      titlePrefix: true,
      markerMode: "badge",
      rules: [{ type: "wildcard", value: "http://localhost:*/*" }],
      accounts: [
        {
          id: "admin",
          label: "Admin",
          username: "admin",
          password: "admin123",
          defaultFill: false
        }
      ]
    },
    {
      id: "test",
      groupId: DEFAULT_GROUP_ID,
      name: "Test Environment",
      homepageUrl: "https://test.example.com/",
      lastQuickAccessAt: 0,
      enabled: true,
      badge: "TEST",
      badgeEnabled: true,
      badgeColor: "#059669",
      badgeTextColor: "#ffffff",
      badgeStyle: "slanted",
      badgePosition: "top-right",
      badgeScale: 1,
      badgeSize: 14,
      badgeOffset: 12,
      badgeOpacity: 1,
      watermarkText: "Test Environment",
      watermarkEnabled: true,
      watermarkColor: "#059669",
      watermarkOpacity: 0.08,
      watermarkAngle: -24,
      watermarkSize: 42,
      watermarkGap: 80,
      titlePrefix: true,
      markerMode: "badge-watermark",
      rules: [{ type: "wildcard", value: "https://test.example.com/*" }],
      accounts: []
    }
  ]
};

const ICON_SIZES = [16, 32];
const ICON_STATE_COLORS = {
  matched: { background: "#2563eb", accent: "#93c5fd", foreground: "#ffffff" },
  unmatched: { background: "#cbd5e1", accent: "#94a3b8", foreground: "#ffffff" }
};

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get([STORAGE_KEY]);
  if (!stored[STORAGE_KEY]) {
    await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_SETTINGS });
  }
  await refreshAllTabIcons();
  await syncExistingTabs();
});

chrome.runtime.onStartup.addListener(() => {
  refreshAllTabIcons().catch(() => {});
  syncExistingTabs().catch(() => {});
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  refreshTabIcon(tabId).catch(() => {});
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    refreshTabIcon(tabId).catch(() => {});
  }
  if (changeInfo.status === "complete") ensureTabContent(tabId).catch(() => {});
});

chrome.windows.onFocusChanged.addListener(() => {
  refreshActiveTabIcon().catch(() => {});
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[STORAGE_KEY]) {
    refreshAllTabIcons().catch(() => {});
    syncExistingTabs().catch(() => {});
  }
});

const pendingContentInjections = new Map();
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "ENVMATE_SYNC_TABS" || sender.id !== chrome.runtime.id) return false;
  syncExistingTabs().then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
  return true;
});

async function syncExistingTabs() {
  const tabs = await chrome.tabs.query({});
  await Promise.allSettled(tabs.filter((tab) => tab.id !== undefined).map((tab) => ensureTabContent(tab.id)));
}

function ensureTabContent(tabId) {
  if (pendingContentInjections.has(tabId)) return pendingContentInjections.get(tabId);
  const pending = (async () => {
    const tab = await chrome.tabs.get(tabId);
    if (tab.discarded || tab.status === "loading" || !/^(https?|file):/.test(tab.url || "")) return;
    const settings = await getSettings();
    if (!findEnvironment(settings, tab.url)) return;
    try {
      const response = await chrome.tabs.sendMessage(tabId, { type: "ENVMATE_PING" }, { frameId: 0 });
      if (response?.ready) return;
    } catch (_) {
      // Already-open pages may not have a content script after install/reload.
    }
    const target = { tabId, frameIds: [0] };
    const files = ["src/content.css"];
    await chrome.scripting.insertCSS({ target, files });
    try {
      await chrome.scripting.executeScript({ target, files: ["src/title-manager.js", "src/favicon-manager.js", "src/content.js"] });
    } catch (error) {
      await chrome.scripting.removeCSS({ target, files }).catch(() => {});
      throw error;
    }
  })().finally(() => pendingContentInjections.delete(tabId));
  pendingContentInjections.set(tabId, pending);
  return pending;
}

function wildcardToRegExp(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`);
}

function matchesRule(url, rule) {
  if (!rule || !rule.value) return false;
  try {
    if (rule.type === "prefix") return url.startsWith(rule.value);
    if (rule.type === "regex") return new RegExp(rule.value).test(url);
    return wildcardToRegExp(rule.value).test(url);
  } catch (_) {
    return false;
  }
}

function ruleSpecificity(rule) {
  if (!rule?.value) return -1;
  if (rule.type === "prefix") return 3000 + rule.value.length;
  if (rule.type === "wildcard") return 2000 + rule.value.replace(/\*/g, "").length;
  if (rule.type === "regex") return 1000 + rule.value.length;
  return rule.value.length;
}

function findEnvironment(settings, url) {
  let matchedEnvironment = null;
  let highestSpecificity = -1;

  (settings.environments || []).forEach((environment) => {
    if (environment.enabled === false) return;
    const environmentSpecificity = Math.max(
      ...((environment.rules || [])
        .filter((rule) => matchesRule(url, rule))
        .map((rule) => ruleSpecificity(rule))),
      -1
    );
    if (environmentSpecificity > highestSpecificity) {
      matchedEnvironment = environment;
      highestSpecificity = environmentSpecificity;
    }
  });

  return matchedEnvironment;
}

function drawIcon(size, colors) {
  const canvas = new OffscreenCanvas(size, size);
  const context = canvas.getContext("2d");
  const inset = Math.max(1, Math.round(size * 0.04));
  const radius = Math.round(size * 0.22);
  const innerSize = size - inset * 2;

  context.clearRect(0, 0, size, size);

  context.fillStyle = colors.background;
  roundRect(context, inset, inset, innerSize, innerSize, radius);
  context.fill();

  context.fillStyle = "rgba(255, 255, 255, 0.18)";
  roundRect(context, inset, inset, innerSize, innerSize, radius);
  context.fill();

  const stemX = size * 0.22;
  const stemY = size * 0.16;
  const stemWidth = size * 0.16;
  const stemHeight = size * 0.68;
  const barWidth = size * 0.48;
  const midBarWidth = size * 0.4;
  const barHeight = Math.max(2, size * 0.125);
  const barRadius = Math.max(2, size * 0.05);

  context.fillStyle = colors.foreground;
  roundRect(context, stemX, stemY, stemWidth, stemHeight, barRadius);
  context.fill();

  roundRect(context, stemX, stemY, barWidth, barHeight, barRadius);
  context.fill();

  roundRect(context, stemX, size * 0.438, midBarWidth, barHeight, barRadius);
  context.fill();

  roundRect(context, stemX, size * 0.716, barWidth, barHeight, barRadius);
  context.fill();

  return context.getImageData(0, 0, size, size);
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

async function getSettings() {
  const stored = await chrome.storage.local.get([STORAGE_KEY]);
  return stored[STORAGE_KEY] || DEFAULT_SETTINGS;
}

async function refreshActiveTabIcon() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id !== undefined) await refreshTabIcon(tab.id, tab);
}

async function refreshAllTabIcons() {
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs
      .filter((tab) => tab.id !== undefined)
      .map((tab) => refreshTabIcon(tab.id, tab))
  );
}

async function refreshTabIcon(tabId, tab) {
  const nextTab = tab || (await chrome.tabs.get(tabId));
  const url = nextTab.url || "";
  const settings = await getSettings();
  const environment = url ? findEnvironment(settings, url) : null;
  const state = environment ? "matched" : "unmatched";
  const colors = ICON_STATE_COLORS[state];

  const imageData = {};
  for (const size of ICON_SIZES) {
    imageData[size] = drawIcon(size, colors);
  }

  await chrome.action.setIcon({ tabId, imageData });
  await chrome.action.setTitle({
    tabId,
    title: environment ? `EnvMate · ${environment.name || environment.badge || "Matched"}` : "EnvMate · No match"
  });
}
