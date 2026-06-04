const STORAGE_KEY = "envmateSettings";

const currentUrlNode = document.querySelector("#current-url");
const environmentNameNode = document.querySelector("#environment-name");
const environmentMetaNode = document.querySelector("#environment-meta");
const environmentCardNode = document.querySelector("#environment-card");
const popupNode = document.querySelector(".popup");
const environmentToggleNode = document.querySelector("#environment-toggle");
const environmentEnabledNode = document.querySelector("#environment-enabled");
const accountsSectionNode = document.querySelector("#accounts-section");
const accountsNode = document.querySelector("#accounts");
const openOptionsButton = document.querySelector("#open-options");
const t = window.envmateI18n.t;
const DEFAULT_VISIBLE_ACCOUNTS = 3;

let currentTab = null;
let currentEnvironment = null;
let settings = null;
let expandedEnvironmentId = null;

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

function findEnvironment(config, url, includeDisabled = false) {
  return (config.environments || []).find((environment) => {
    if (!includeDisabled && environment.enabled === false) return false;
    return (environment.rules || []).some((rule) => matchesRule(url, rule));
  });
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

function renderEnvironment() {
  const url = currentTab?.url || "";
  currentUrlNode.textContent = url || t("noActiveTab");
  currentEnvironment = settings ? findEnvironment(settings, url, true) : null;

  if (!currentEnvironment) {
    environmentCardNode.style.borderColor = "";
    environmentCardNode.classList.add("environment-card--empty");
    popupNode.classList.add("is-unmatched");
    environmentToggleNode.hidden = true;
    accountsSectionNode.hidden = true;
    environmentNameNode.textContent = t("noMatch");
    environmentMetaNode.textContent = t("addRuleForUrl");
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

openOptionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

init();
