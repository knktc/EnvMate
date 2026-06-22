const STORAGE_KEY = "envmateSettings";

const currentUrlNode = document.querySelector("#current-url");
const environmentNameNode = document.querySelector("#environment-name");
const environmentMetaNode = document.querySelector("#environment-meta");
const environmentCardNode = document.querySelector("#environment-card");
const popupNode = document.querySelector(".popup");
const environmentToggleNode = document.querySelector("#environment-toggle");
const environmentEnabledNode = document.querySelector("#environment-enabled");
const favoritesSectionNode = document.querySelector("#favorites-section");
const favoritesNode = document.querySelector("#favorites");
const favoritesMoreNode = document.querySelector("#favorites-more");
const accountsSectionNode = document.querySelector("#accounts-section");
const accountsNode = document.querySelector("#accounts");
const openOptionsButton = document.querySelector("#open-options");
const quickAddEnvironmentNode = document.querySelector("#quick-add-environment");
const t = window.envmateI18n.t;
const DEFAULT_VISIBLE_ACCOUNTS = 3;
const DEFAULT_VISIBLE_FAVORITE_GROUPS = 3;
const LUCIDE_ICON_ATTRS = {
  fill: "none",
  stroke: "currentColor",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "stroke-width": "2"
};

let currentTab = null;
let currentEnvironment = null;
let settings = null;
let expandedEnvironmentId = null;
let expandedFavoriteGroups = new Set();
let showAllFavoriteGroups = false;

function createLucideIcon(nodes, className = "popup-icon") {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add(className);

  nodes.forEach(([tagName, attrs]) => {
    const node = document.createElementNS(namespace, tagName);
    Object.entries(LUCIDE_ICON_ATTRS).forEach(([key, value]) => node.setAttribute(key, value));
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    svg.append(node);
  });

  return svg;
}

function decoratePopupButtons() {
  openOptionsButton.textContent = "";
  openOptionsButton.append(
    createLucideIcon([
      ["path", { d: "M3.828 9.56a3.1 3.1 0 0 1-.002 4.865 2 2 0 0 0 1.98 3.425 3.1 3.1 0 0 1 4.211 2.434 2 2 0 0 0 3.958.002 3.1 3.1 0 0 1 4.213-2.431 2 2 0 0 0 1.983-3.424 3.1 3.1 0 0 1 .001-4.866 2 2 0 0 0-1.978-3.425 3.1 3.1 0 0 1-4.214-2.421 2 2 0 0 0-3.961.004A3.1 3.1 0 0 1 5.81 6.135 2 2 0 0 0 3.828 9.56" }],
      ["circle", { cx: "12", cy: "12", r: "3" }]
    ])
  );
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

function findEnvironment(config, url, includeDisabled = false) {
  let matchedEnvironment = null;
  let highestSpecificity = -1;

  (config.environments || []).forEach((environment) => {
    if (!includeDisabled && environment.enabled === false) return;
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

function findGroupName(config, environment) {
  if (!environment) return "";
  if (environment.groupId && Array.isArray(config?.groups)) {
    return config.groups.find((group) => group.id === environment.groupId)?.name || "";
  }
  return environment.group || "";
}

function markerLabel(environment) {
  const badge = typeof environment?.badge === "string" ? environment.badge.trim() : "";
  const name = typeof environment?.name === "string" ? environment.name.trim() : "";
  return badge || name || t("environmentFallback");
}

function homepageUrl(environment) {
  return String(environment?.homepageUrl || "").trim();
}

function quickAccessTimestamp(environment) {
  const nextValue = Number(environment?.lastQuickAccessAt ?? 0);
  return Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 0;
}

function accountDisplayLabel(account) {
  const username = String(account?.username || "").trim();
  const label = String(account?.label || "").trim();
  if (username && label) return `${username} (${label})`;
  return username || label || t("accountFallback");
}

function createAccountButtonContent(account) {
  const username = String(account?.username || "").trim();
  const label = String(account?.label || "").trim();
  const primaryText = username || label || t("accountFallback");

  const summary = document.createElement("span");
  summary.className = "account-button__summary";

  const title = document.createElement("span");
  title.className = "account-button__title";
  title.textContent = primaryText;
  summary.append(title);

  if (username && label) {
    const tag = document.createElement("span");
    tag.className = "account-button__tag";
    tag.textContent = label;
    summary.append(tag);
  }

  const fragment = document.createDocumentFragment();
  fragment.append(summary);
  if (account.defaultFill) {
    const status = document.createElement("span");
    status.className = "account-button__status";
    status.textContent = t("defaultFill");
    fragment.append(status);
  }
  return fragment;
}

function setEmpty(node, text) {
  node.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "empty";
  empty.textContent = text;
  node.append(empty);
}

function buildSuggestedPrefix(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return "";
    return `${parsed.origin}/`;
  } catch (_) {
    return "";
  }
}

function isReusableCurrentTab(url) {
  const nextUrl = String(url || "").trim();
  return !nextUrl || nextUrl === "about:blank" || nextUrl === "chrome://newtab/" || nextUrl.startsWith("chrome://new-tab-page/");
}

function groupedFavoriteEnvironments(config) {
  const environments = Array.isArray(config?.environments) ? config.environments : [];
  const configuredGroups = Array.isArray(config?.groups) ? config.groups : [];
  const groupOrder = configuredGroups.length
    ? configuredGroups
    : [{ id: "default", name: t("defaultGroup") }];
  const knownGroups = new Map(groupOrder.map((group) => [group.id, { group, environments: [] }]));

  environments.forEach((environment, index) => {
    if (environment.enabled === false || !homepageUrl(environment)) return;
    const groupId = environment.groupId || "default";
    if (!knownGroups.has(groupId)) {
      knownGroups.set(groupId, {
        group: { id: groupId, name: environment.group || t("defaultGroup") },
        environments: []
      });
    }
    knownGroups.get(groupId).environments.push({ environment, originalIndex: index });
  });

  return Array.from(knownGroups.values())
    .map((entry) => ({
      ...entry,
      environments: entry.environments
        .sort((left, right) => {
          const leftTimestamp = quickAccessTimestamp(left.environment);
          const rightTimestamp = quickAccessTimestamp(right.environment);
          if (leftTimestamp && rightTimestamp && leftTimestamp !== rightTimestamp) {
            return rightTimestamp - leftTimestamp;
          }
          if (leftTimestamp && !rightTimestamp) return -1;
          if (!leftTimestamp && rightTimestamp) return 1;
          return left.originalIndex - right.originalIndex;
        })
        .map((item) => item.environment)
    }))
    .filter((entry) => entry.environments.length);
}

async function openFavoriteEnvironment(environment) {
  const url = homepageUrl(environment);
  if (!url) return;
  const visitedAt = Date.now();
  if (settings?.environments) {
    settings.environments = settings.environments.map((item) =>
      item.id === environment.id ? { ...item, lastQuickAccessAt: visitedAt } : item
    );
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
  }
  if (currentTab?.id !== undefined && isReusableCurrentTab(currentTab?.url)) {
    await chrome.tabs.update(currentTab.id, { url, active: true });
  } else {
    await chrome.tabs.create({ url, active: true });
  }
  window.close();
}

function renderFavorites() {
  favoritesNode.innerHTML = "";
  const groups = groupedFavoriteEnvironments(settings);
  if (!groups.length) {
    favoritesSectionNode.hidden = true;
    favoritesMoreNode.hidden = true;
    return;
  }

  favoritesSectionNode.hidden = false;
  const visibleGroups = showAllFavoriteGroups ? groups : groups.slice(0, DEFAULT_VISIBLE_FAVORITE_GROUPS);

  visibleGroups.forEach(({ group, environments }) => {
    const wrap = document.createElement("section");
    wrap.className = "favorite-group";
    const isExpanded = expandedFavoriteGroups.has(group.id);
    wrap.classList.toggle("is-expanded", isExpanded);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "favorite-group__toggle";

    const summary = document.createElement("div");
    summary.className = "favorite-group__summary";
    const title = document.createElement("div");
    title.className = "favorite-group__title";
    title.textContent = group.name;
    const meta = document.createElement("div");
    meta.className = "favorite-group__meta";
    meta.textContent = t("groupEnvironmentCount", [String(environments.length)]);
    summary.append(title, meta);

    const chevron = document.createElement("span");
    chevron.className = "favorite-group__chevron";
    chevron.textContent = "›";

    toggle.append(summary, chevron);
    toggle.addEventListener("click", () => {
      if (expandedFavoriteGroups.has(group.id)) {
        expandedFavoriteGroups.delete(group.id);
      } else {
        expandedFavoriteGroups.add(group.id);
      }
      renderFavorites();
    });
    wrap.append(toggle);

    if (isExpanded) {
      const list = document.createElement("div");
      list.className = "favorite-group__list";
      environments.forEach((environment) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "favorite-link link-button";
        button.addEventListener("click", () => {
          openFavoriteEnvironment(environment).catch(() => {});
        });

        const head = document.createElement("div");
        head.className = "favorite-link__head";

        const name = document.createElement("span");
        name.className = "favorite-link__name";
        name.textContent = environment.name || t("environmentFallback");
        head.append(name);

        const badge = markerLabel(environment);
        if (badge) {
          const badgeNode = document.createElement("span");
          badgeNode.className = "favorite-link__badge";
          badgeNode.style.setProperty("--favorite-badge-color", environment.badgeColor || environment.color || "#2563eb");
          badgeNode.style.setProperty("--favorite-badge-text", environment.badgeTextColor || environment.textColor || "#ffffff");
          badgeNode.textContent = badge;
          head.append(badgeNode);
        }

        const urlNode = document.createElement("div");
        urlNode.className = "favorite-link__url";
        urlNode.textContent = homepageUrl(environment);

        button.append(head, urlNode);
        list.append(button);
      });
      wrap.append(list);
    }

    favoritesNode.append(wrap);
  });

  const hasMoreGroups = groups.length > DEFAULT_VISIBLE_FAVORITE_GROUPS;
  favoritesMoreNode.hidden = !hasMoreGroups;
  favoritesMoreNode.textContent = showAllFavoriteGroups ? t("showLessGroups") : t("showMoreGroups");
}

async function openQuickAddEnvironment() {
  const sourceUrl = currentTab?.url || "";
  const urlPrefix = buildSuggestedPrefix(sourceUrl);
  if (!urlPrefix) return;
  const title = String(currentTab?.title || "").trim() || t("newEnvironment");
  const params = new URLSearchParams({
    source: "popup",
    quickAdd: "1",
    title,
    prefix: urlPrefix,
    url: sourceUrl
  });
  await chrome.tabs.create({
    url: `${chrome.runtime.getURL("options/options.html")}?${params.toString()}`
  });
  window.close();
}

async function openCurrentEnvironmentInOptions() {
  const params = new URLSearchParams({ source: "popup" });
  if (currentEnvironment?.id) {
    params.set("environmentId", currentEnvironment.id);
  }
  if (currentTab?.url) {
    params.set("url", currentTab.url);
  }
  await chrome.tabs.create({
    url: `${chrome.runtime.getURL("options/options.html")}?${params.toString()}`
  });
  window.close();
}

function renderEnvironment() {
  const url = currentTab?.url || "";
  const suggestedPrefix = buildSuggestedPrefix(url);
  currentUrlNode.textContent = url || t("noActiveTab");
  quickAddEnvironmentNode.hidden = true;
  currentEnvironment = settings ? findEnvironment(settings, url, true) : null;
  renderFavorites();

  if (!currentEnvironment) {
    environmentCardNode.style.borderColor = "";
    environmentCardNode.classList.add("environment-card--empty");
    popupNode.classList.add("is-unmatched");
    environmentToggleNode.hidden = true;
    accountsSectionNode.hidden = true;
    environmentNameNode.textContent = t("noMatch");
    environmentMetaNode.textContent = "";
    quickAddEnvironmentNode.hidden = !suggestedPrefix;
    return;
  }

  environmentCardNode.style.borderColor = currentEnvironment.badgeColor || currentEnvironment.color || "#2563eb";
  environmentCardNode.classList.remove("environment-card--empty");
  popupNode.classList.remove("is-unmatched");
  environmentToggleNode.hidden = false;
  environmentEnabledNode.checked = currentEnvironment.enabled !== false;
  accountsSectionNode.hidden = false;
  environmentNameNode.textContent = currentEnvironment.name || t("environmentFallback");
  const metaParts = [findGroupName(settings, currentEnvironment) || t("defaultGroup"), markerLabel(currentEnvironment)];
  if (currentEnvironment.enabled === false) metaParts.push(t("disabled"));
  environmentMetaNode.textContent = metaParts.join(" · ");
  renderAccounts();
}

function releaseDynamicI18nPlaceholders() {
  [currentUrlNode, environmentNameNode].forEach((node) => {
    node.removeAttribute("data-i18n");
  });
}

function renderUnavailableState() {
  currentTab = null;
  settings = settings || { environments: [] };
  currentUrlNode.textContent = t("noActiveTab");
  quickAddEnvironmentNode.hidden = true;
  environmentCardNode.style.borderColor = "";
  environmentCardNode.classList.add("environment-card--empty");
  popupNode.classList.add("is-unmatched");
  environmentToggleNode.hidden = true;
  accountsSectionNode.hidden = true;
  environmentNameNode.textContent = t("noMatch");
  environmentMetaNode.textContent = "";
  renderFavorites();
}

function renderAccounts() {
  accountsNode.innerHTML = "";
  const accounts = currentEnvironment?.accounts || [];
  if (!accounts.length) {
    setEmpty(accountsNode, t("noAccountsConfigured"));
    return;
  }

  const environmentId = currentEnvironment?.id || currentEnvironment?.name || "";
  const isExpanded = expandedEnvironmentId === environmentId;
  const visibleAccounts = isExpanded ? accounts : accounts.slice(0, DEFAULT_VISIBLE_ACCOUNTS);

  visibleAccounts.forEach((account) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "account-button";
    button.title = accountDisplayLabel(account);
    button.append(createAccountButtonContent(account));
    button.addEventListener("click", async () => {
      try {
        await chrome.tabs.sendMessage(currentTab.id, {
          type: "ENVMATE_FILL_ACCOUNT",
          account
        });
      } catch (_) {
        // The active tab may be a browser page where content scripts cannot run.
      }
      window.close();
    });
    accountsNode.append(button);
  });

  const hiddenCount = accounts.length - visibleAccounts.length;
  if (hiddenCount > 0) {
    const moreButton = document.createElement("button");
    moreButton.type = "button";
    moreButton.className = "link-button account-list__more";
    moreButton.textContent = t("showMoreAccounts", [String(hiddenCount)]);
    moreButton.addEventListener("click", () => {
      expandedEnvironmentId = environmentId;
      renderAccounts();
    });
    accountsNode.append(moreButton);
  }
}

async function init() {
  await window.envmateI18n.ready;
  releaseDynamicI18nPlaceholders();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  const result = await chrome.storage.local.get([STORAGE_KEY]);
  settings = result[STORAGE_KEY] || { environments: [] };
  renderEnvironment();
}

environmentEnabledNode.addEventListener("change", async () => {
  if (!currentEnvironment || !settings) return;
  settings.environments = (settings.environments || []).map((environment) =>
    environment.id === currentEnvironment.id ? { ...environment, enabled: environmentEnabledNode.checked } : environment
  );
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
  renderEnvironment();
});

openOptionsButton.addEventListener("click", openCurrentEnvironmentInOptions);

quickAddEnvironmentNode.addEventListener("click", openQuickAddEnvironment);
favoritesMoreNode.addEventListener("click", () => {
  showAllFavoriteGroups = !showAllFavoriteGroups;
  renderFavorites();
});

decoratePopupButtons();
init().catch(() => {
  renderUnavailableState();
});
