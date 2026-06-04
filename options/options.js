const STORAGE_KEY = "envmateSettings";
const DEFAULT_GROUP_ID = "default";
const ENVIRONMENT_COLOR_PRESETS = ["#2563eb", "#059669", "#dc2626", "#7c3aed", "#ea580c", "#0f766e", "#db2777", "#4f46e5"];
const TEXT_COLOR_PRESETS = ["#ffffff", "#f8fafc", "#e2e8f0", "#111827", "#0f172a", "#334155"];

const SAMPLE_SETTINGS = {
  groups: [
    { id: DEFAULT_GROUP_ID, name: "Default Group" },
    { id: "boss", name: "BOSS System" },
    { id: "installer", name: "Installer System" }
  ],
  environments: [
    {
      id: "dev",
      groupId: "boss",
      name: "Development",
      enabled: true,
      badge: "DEV",
      badgeEnabled: true,
      badgeColor: "#2563eb",
      badgeTextColor: "#ffffff",
      badgeStyle: "slanted",
      badgePosition: "top-right",
      badgeOffset: 12,
      badgeOpacity: 1,
      badgeScale: 1,
      badgeSize: 14,
      watermarkText: "Development",
      watermarkColor: "#2563eb",
      watermarkEnabled: false,
      watermarkOpacity: 0.08,
      watermarkAngle: -24,
      watermarkSize: 42,
      watermarkGap: 80,
      titlePrefix: true,
      markerMode: "badge",
      rules: [
        { type: "wildcard", value: "https://dev.example.com/*" },
        { type: "wildcard", value: "http://localhost:*/*" }
      ],
      accounts: [
        { id: "dev-admin", label: "Admin", username: "admin", password: "admin123", defaultFill: false },
        { id: "dev-user", label: "Tester", username: "tester", password: "tester123", defaultFill: false }
      ]
    },
    {
      id: "test",
      groupId: "boss",
      name: "Test",
      enabled: true,
      badge: "TEST",
      badgeEnabled: true,
      badgeColor: "#059669",
      badgeTextColor: "#ffffff",
      badgeStyle: "slanted",
      badgePosition: "top-right",
      badgeOffset: 12,
      badgeOpacity: 1,
      badgeScale: 1,
      badgeSize: 14,
      watermarkText: "Test",
      watermarkColor: "#059669",
      watermarkEnabled: true,
      watermarkOpacity: 0.08,
      watermarkAngle: -24,
      watermarkSize: 42,
      watermarkGap: 80,
      titlePrefix: true,
      markerMode: "badge-watermark",
      rules: [{ type: "wildcard", value: "https://test.example.com/*" }],
      accounts: [{ id: "test-admin", label: "Admin", username: "admin", password: "test123", defaultFill: false }]
    },
    {
      id: "pre",
      groupId: "installer",
      name: "Pre Release",
      enabled: true,
      badge: "PRE",
      badgeEnabled: true,
      badgeColor: "#dc2626",
      badgeTextColor: "#ffffff",
      badgeStyle: "slanted",
      badgePosition: "top-right",
      badgeOffset: 12,
      badgeOpacity: 1,
      badgeScale: 1,
      badgeSize: 14,
      watermarkText: "Pre Release",
      watermarkColor: "#dc2626",
      watermarkEnabled: true,
      watermarkOpacity: 0.08,
      watermarkAngle: -24,
      watermarkSize: 42,
      watermarkGap: 80,
      titlePrefix: true,
      markerMode: "badge-watermark",
      rules: [{ type: "prefix", value: "https://pre.example.com/" }],
      accounts: []
    }
  ]
};

const nodes = {
  list: document.querySelector("#environment-list"),
  status: document.querySelector("#status"),
  addGroup: document.querySelector("#add-group"),
  deleteEnvironment: document.querySelector("#delete-environment"),
  save: document.querySelector("#save-config"),
  exportConfig: document.querySelector("#export-config"),
  importConfig: document.querySelector("#import-config"),
  loadSample: document.querySelector("#load-sample"),
  addRule: document.querySelector("#add-rule"),
  addAccount: document.querySelector("#add-account"),
  form: document.querySelector("#environment-form"),
  name: document.querySelector("#env-name"),
  group: document.querySelector("#env-group"),
  badge: document.querySelector("#env-badge"),
  badgeEnabled: document.querySelector("#env-badge-enabled"),
  enabled: document.querySelector("#env-enabled"),
  enabledLabel: document.querySelector("#env-enabled-label"),
  titlePrefix: document.querySelector("#env-title-prefix"),
  rules: document.querySelector("#rules-list"),
  accounts: document.querySelector("#accounts-list"),
  accountsValidation: document.querySelector("#accounts-validation"),
  badgeColor: document.querySelector("#badge-color"),
  badgeColorSwatches: document.querySelector("#badge-color-swatches"),
  badgeTextColor: document.querySelector("#badge-text-color"),
  badgeTextColorSwatches: document.querySelector("#badge-text-color-swatches"),
  badgePosition: document.querySelector("#badge-position"),
  badgeStyleOptions: Array.from(document.querySelectorAll("input[name='badge-style']")),
  badgeScale: document.querySelector("#badge-scale"),
  badgeSize: document.querySelector("#badge-size"),
  badgeOpacity: document.querySelector("#badge-opacity"),
  watermarkText: document.querySelector("#env-watermark-text"),
  watermarkColor: document.querySelector("#watermark-color"),
  watermarkColorSwatches: document.querySelector("#watermark-color-swatches"),
  watermarkEnabled: document.querySelector("#env-watermark-enabled"),
  watermarkOpacity: document.querySelector("#watermark-opacity"),
  watermarkAngle: document.querySelector("#watermark-angle"),
  watermarkSize: document.querySelector("#watermark-size"),
  watermarkGap: document.querySelector("#watermark-gap"),
  badgePreviewSurface: document.querySelector("#badge-preview-surface"),
  watermarkPreviewSurface: document.querySelector("#watermark-preview-surface"),
  sectionNavButtons: Array.from(document.querySelectorAll("[data-scroll-target]")),
  workspaceShell: document.querySelector(".workspace-shell"),
  toolbox: document.querySelector("#workspace-toolbox")
};

const t = window.envmateI18n.t;

let settings = structuredClone(SAMPLE_SETTINGS);
let savedSettingsSnapshot = clone(SAMPLE_SETTINGS);
let selectedId = null;
let selectedGroupId = DEFAULT_GROUP_ID;
let isRendering = false;
let activeSectionId = "section-basic";
let hasUnsavedChanges = false;
let scrollTargetLockId = "";
let scrollSettleTimer = 0;
let draggingAccountId = "";

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function pickEnvironmentColor() {
  return ENVIRONMENT_COLOR_PRESETS[Math.floor(Math.random() * ENVIRONMENT_COLOR_PRESETS.length)];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setStatus(message, isError = false) {
  if (!nodes.status) return;
  nodes.status.textContent = message;
  nodes.status.style.color = isError ? "#dc2626" : "#64748b";
}

function syncSaveButtonState() {
  if (!nodes.save) return;
  nodes.save.classList.toggle("is-dirty", hasUnsavedChanges);
  nodes.save.textContent = hasUnsavedChanges ? t("savePending") : t("save");
}

function restoreSavedSettingsSnapshot() {
  settings = clone(savedSettingsSnapshot);
  hasUnsavedChanges = false;
  syncSaveButtonState();
}

function confirmDiscardUnsavedChanges() {
  if (!hasUnsavedChanges) return true;
  if (!window.confirm(t("confirmUnsavedSwitch"))) return false;
  restoreSavedSettingsSnapshot();
  return true;
}

function selectEnvironment(groupId, environmentId) {
  if (groupId === selectedGroupId && environmentId === selectedId) return true;
  if (!confirmDiscardUnsavedChanges()) return false;
  selectedGroupId = groupId;
  selectedId = environmentId;
  clearAccountsValidationError();
  render();
  return true;
}

function syncEnabledLabel() {
  if (!nodes.enabled || !nodes.enabledLabel) return;
  nodes.enabledLabel.textContent = nodes.enabled.checked ? t("environmentEnabledOn") : t("environmentEnabledOff");
}

function selectedBadgeStyle() {
  return nodes.badgeStyleOptions.find((option) => option.checked)?.value || "slanted";
}

function syncBadgeStyleOptions(value) {
  nodes.badgeStyleOptions.forEach((option) => {
    option.checked = option.value === value;
  });
}

function clearAccountsValidationError() {
  if (!nodes.accountsValidation) return;
  nodes.accountsValidation.hidden = true;
  nodes.accountsValidation.textContent = "";
}

function clearAccountDropIndicators() {
  if (!nodes.accounts) return;
  nodes.accounts.querySelectorAll(".row-card.account").forEach((row) => {
    row.classList.remove("is-drag-source", "is-drop-before", "is-drop-after");
  });
}

function setAccountDropIndicator(targetRow, placement) {
  if (!nodes.accounts) return;
  nodes.accounts.querySelectorAll(".row-card.account").forEach((row) => {
    const isTarget = row === targetRow;
    row.classList.toggle("is-drop-before", isTarget && placement === "before");
    row.classList.toggle("is-drop-after", isTarget && placement === "after");
  });
}

function reorderAccounts(environment, sourceId, targetId, placement) {
  const accounts = environment?.accounts || [];
  const sourceIndex = accounts.findIndex((account) => account.id === sourceId);
  const targetIndex = accounts.findIndex((account) => account.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return false;

  const [movedAccount] = accounts.splice(sourceIndex, 1);
  const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  const insertIndex = placement === "after" ? adjustedTargetIndex + 1 : adjustedTargetIndex;
  accounts.splice(insertIndex, 0, movedAccount);
  return true;
}

function accountHasInput(account) {
  return Boolean(
    String(account?.label || "").trim() ||
      String(account?.username || "").trim() ||
      String(account?.password || "").trim()
  );
}

function findEmptyAccount() {
  for (const environment of settings.environments) {
    const accountIndex = (environment.accounts || []).findIndex((account) => !accountHasInput(account));
    if (accountIndex !== -1) {
      return { environment, accountIndex };
    }
  }
  return null;
}

function showAccountsValidationError(message) {
  if (nodes.accountsValidation) {
    nodes.accountsValidation.hidden = false;
    nodes.accountsValidation.textContent = message;
  }
  const accountsSection = document.getElementById("section-accounts");
  if (accountsSection) {
    activeSectionId = "section-accounts";
    syncRailNav();
    scrollSectionIntoView(accountsSection);
  }
}

function bindNodeEvent(node, eventName, handler) {
  if (!node) return;
  node.addEventListener(eventName, handler);
}

function syncRailNav() {
  nodes.sectionNavButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.scrollTarget === activeSectionId);
  });
}

function navSections() {
  return nodes.sectionNavButtons
    .map((button) => document.getElementById(button.dataset.scrollTarget))
    .filter(Boolean);
}

function sectionAnchorOffset() {
  return 112;
}

function scrollSectionIntoView(section) {
  const top = window.scrollY + section.getBoundingClientRect().top - sectionAnchorOffset();
  window.scrollTo({
    top: Math.max(0, top),
    behavior: "smooth"
  });
}

function currentSectionFromScroll() {
  const sections = navSections();
  if (!sections.length) return null;

  const anchor = sectionAnchorOffset();
  let current = sections[0];

  for (const section of sections) {
    const rect = section.getBoundingClientRect();
    if (rect.top <= anchor) {
      current = section;
    }
    if (rect.top <= anchor && rect.bottom >= anchor) {
      return section;
    }
  }

  return current;
}

function clearScrollSettleTimer() {
  if (!scrollSettleTimer) return;
  window.clearTimeout(scrollSettleTimer);
  scrollSettleTimer = 0;
}

function scheduleScrollSettle() {
  clearScrollSettleTimer();
  scrollSettleTimer = window.setTimeout(() => {
    scrollSettleTimer = 0;
    const current = currentSectionFromScroll();
    if (scrollTargetLockId) {
      activeSectionId = scrollTargetLockId;
      scrollTargetLockId = "";
      syncRailNav();
      return;
    }
    if (current?.id && current.id !== activeSectionId) {
      activeSectionId = current.id;
      syncRailNav();
    }
  }, 140);
}

function positionToolbox() {
  if (!nodes.workspaceShell || !nodes.toolbox) return;
  if (window.innerWidth <= 1280) {
    nodes.toolbox.style.left = "";
    nodes.toolbox.style.top = "";
    return;
  }

  const shellRect = nodes.workspaceShell.getBoundingClientRect();
  const firstSectionRect =
    nodes.form?.querySelector(".form-section")?.getBoundingClientRect() ||
    shellRect;
  const toolboxRect = nodes.toolbox.getBoundingClientRect();
  const gap = 18;
  const maxLeft = window.innerWidth - toolboxRect.width - 12;
  const left = Math.min(maxLeft, shellRect.right + gap);
  const minTop = 16;
  const maxTop = Math.max(minTop, shellRect.bottom - toolboxRect.height - 16);
  const desiredTop = Math.max(minTop, firstSectionRect.top);
  const top = Math.min(desiredTop, maxTop);

  nodes.toolbox.style.left = `${Math.max(12, left)}px`;
  nodes.toolbox.style.top = `${top}px`;
}

function markerLabel(environment) {
  const badge = typeof environment?.badge === "string" ? environment.badge.trim() : "";
  const name = typeof environment?.name === "string" ? environment.name.trim() : "";
  return badge || name || t("environmentFallback");
}

function watermarkLabel(environment) {
  const watermarkText = typeof environment?.watermarkText === "string" ? environment.watermarkText.trim() : "";
  const name = typeof environment?.name === "string" ? environment.name.trim() : "";
  return watermarkText || name || t("environmentFallback");
}

function selectedEnvironment() {
  return settings.environments.find((environment) => environment.id === selectedId) || null;
}

function selectedGroup() {
  return settings.groups.find((group) => group.id === selectedGroupId) || null;
}

function defaultGroupName() {
  return settings.groups.find((group) => group.id === DEFAULT_GROUP_ID)?.name || t("defaultGroup");
}

function normalizeGroupName(value) {
  const nextValue = typeof value === "string" ? value.trim() : "";
  return nextValue || t("defaultGroup");
}

function slug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildGroups(rawGroups, rawEnvironments) {
  const groups = [];
  const nameToId = new Map();

  groups.push({ id: DEFAULT_GROUP_ID, name: t("defaultGroup") });
  nameToId.set(groups[0].name, DEFAULT_GROUP_ID);

  if (Array.isArray(rawGroups)) {
    rawGroups.forEach((group) => {
      if (!group || !group.name) return;
      const name = normalizeGroupName(group.name);
      const id = group.id || (name === t("defaultGroup") ? DEFAULT_GROUP_ID : slug(name) || uid("group"));
      if (groups.some((item) => item.id === id) || nameToId.has(name)) return;
      groups.push({ id, name });
      nameToId.set(name, id);
    });
  }

  (rawEnvironments || []).forEach((environment) => {
    const legacyName = typeof environment.group === "string" ? normalizeGroupName(environment.group) : "";
    if (!legacyName || nameToId.has(legacyName)) return;
    const id = slug(legacyName) || uid("group");
    groups.push({ id, name: legacyName });
    nameToId.set(legacyName, id);
  });

  return groups;
}

function ensureGroupId(groupId, groups) {
  return groups.some((group) => group.id === groupId) ? groupId : DEFAULT_GROUP_ID;
}

function normalizeSettings(value) {
  const next = {
    groups: [],
    environments: Array.isArray(value.environments) ? value.environments : []
  };

  next.groups = buildGroups(value.groups, next.environments);
  const legacyGroupMap = new Map(next.groups.map((group) => [group.name, group.id]));

  next.environments = next.environments.map((environment) => {
    let hasDefaultAccount = false;
    const legacyGroupName = typeof environment.group === "string" ? normalizeGroupName(environment.group) : "";
    const resolvedGroupId =
      environment.groupId ||
      legacyGroupMap.get(legacyGroupName) ||
      DEFAULT_GROUP_ID;

    const legacyMarkerMode = environment.markerMode || "badge";
    const badgeEnabled =
      typeof environment.badgeEnabled === "boolean"
        ? environment.badgeEnabled
        : legacyMarkerMode !== "watermark";
    const watermarkEnabled =
      typeof environment.watermarkEnabled === "boolean"
        ? environment.watermarkEnabled
        : legacyMarkerMode === "watermark" || legacyMarkerMode === "badge-watermark";

    return {
      id: environment.id || uid("env"),
      groupId: ensureGroupId(resolvedGroupId, next.groups),
      name: environment.name || t("newEnvironment"),
      enabled: environment.enabled !== false,
      badge: typeof environment.badge === "string" ? environment.badge : "",
      badgeEnabled,
      badgeColor: environment.badgeColor || environment.color || "#2563eb",
      badgeTextColor: environment.badgeTextColor || environment.textColor || "#ffffff",
      badgeStyle: environment.badgeStyle || value.appearance?.badgeStyle || "slanted",
      badgePosition: environment.badgePosition || value.appearance?.badgePosition || "top-right",
      badgeScale: Number(environment.badgeScale ?? 1),
      badgeSize: Number(environment.badgeSize ?? 14),
      badgeOffset: Number(environment.badgeOffset ?? value.appearance?.badgeOffset ?? 12),
      badgeOpacity: Number(environment.badgeOpacity ?? value.appearance?.badgeOpacity ?? 1),
      watermarkText:
        typeof environment.watermarkText === "string"
          ? environment.watermarkText
          : environment.name || t("newEnvironment"),
      watermarkEnabled,
      watermarkColor: environment.watermarkColor || environment.color || "#2563eb",
      watermarkOpacity: Number(environment.watermarkOpacity ?? value.appearance?.watermarkOpacity ?? 0.08),
      watermarkAngle: Number(environment.watermarkAngle ?? value.appearance?.watermarkAngle ?? -24),
      watermarkSize: Number(environment.watermarkSize ?? value.appearance?.watermarkSize ?? 42),
      watermarkGap: Number(environment.watermarkGap ?? value.appearance?.watermarkGap ?? 80),
      titlePrefix: environment.titlePrefix !== false,
      rules: Array.isArray(environment.rules) ? environment.rules : [],
      accounts: Array.isArray(environment.accounts)
        ? environment.accounts.map((account) => {
            const defaultFill = Boolean(account.defaultFill && !hasDefaultAccount);
            if (defaultFill) hasDefaultAccount = true;
            return {
              id: account.id || uid("account"),
              label: account.label || "",
              username: account.username || "",
              password: account.password || "",
              defaultFill
            };
          })
        : []
    };
  });

  return next;
}

function groupNameById(groupId) {
  return settings.groups.find((group) => group.id === groupId)?.name || defaultGroupName();
}

function ruleTypeLabel(type) {
  if (type === "prefix") return t("ruleTypePrefix");
  if (type === "regex") return t("ruleTypeRegex");
  return t("ruleTypeWildcard");
}

function createIconGraphic(name) {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("group-icon");

  const path = document.createElementNS(namespace, "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "currentColor");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  path.setAttribute("stroke-width", "1.8");

  if (name === "edit") {
    path.setAttribute("d", "M12 20h9M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z");
  } else if (name === "drag") {
    path.setAttribute("d", "M9 5v14M15 5v14M6 8h0M6 12h0M6 16h0M18 8h0M18 12h0M18 16h0");
  } else {
    path.setAttribute("d", "M3 6h18M8 6V4h8v2m-7 0v13m6-13v13M6 6l1 14h10l1-14");
  }

  svg.append(path);
  return svg;
}

function createGroupIconButton(iconName, className, title, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.title = title;
  button.append(createIconGraphic(iconName));
  button.addEventListener("click", onClick);
  return button;
}

function markChanged() {
  if (!isRendering) {
    hasUnsavedChanges = true;
    syncSaveButtonState();
    setStatus(t("unsavedChanges"));
  }
}

function renderGroupOptions() {
  const environment = selectedEnvironment();
  nodes.group.innerHTML = "";
  settings.groups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group.id;
    option.textContent = group.name;
    nodes.group.append(option);
  });
  if (environment) {
    nodes.group.value = ensureGroupId(environment.groupId, settings.groups);
  }
}

function renderColorSwatches(node, colors, value, onSelect) {
  node.innerHTML = "";
  colors.forEach((color) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "color-swatch";
    button.classList.toggle("is-active", color.toLowerCase() === String(value || "").toLowerCase());
    button.style.setProperty("--swatch-color", color);
    button.title = color;
    button.addEventListener("click", () => onSelect(color));
    node.append(button);
  });
}

function renderEnvironmentList() {
  nodes.list.innerHTML = "";

  if (!settings.groups.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = t("noEnvironments");
    nodes.list.append(empty);
    return;
  }

  settings.groups.forEach((group) => {
    const wrap = document.createElement("section");
    wrap.className = "environment-group";
    wrap.classList.toggle("is-active", group.id === selectedGroupId);

    const header = document.createElement("div");
    header.className = "environment-group__title";
    header.addEventListener("click", () => {
      const nextSelectedId = settings.environments.some((environment) => environment.id === selectedId && environment.groupId === group.id)
        ? selectedId
        : settings.environments.find((environment) => environment.groupId === group.id)?.id || null;
      selectEnvironment(group.id, nextSelectedId);
    });

    const titleWrap = document.createElement("div");
    titleWrap.className = "environment-group__title-main";
    const title = document.createElement("span");
    title.className = "environment-group__name";
    title.textContent = group.name;
    titleWrap.append(title);

    const actions = document.createElement("div");
    actions.className = "environment-group__actions";

    const rename = createGroupIconButton("edit", "group-icon-button", t("renameGroup"), (event) => {
      event.stopPropagation();
      renameGroup(group.id);
    });
    titleWrap.append(rename);

    if (group.id !== DEFAULT_GROUP_ID) {
      const remove = createGroupIconButton("trash", "group-icon-button group-icon-button--danger", t("deleteGroup"), (event) => {
        event.stopPropagation();
        deleteGroup(group.id);
      });
      titleWrap.append(remove);
    }

    const addEnvironmentButton = document.createElement("button");
    addEnvironmentButton.type = "button";
    addEnvironmentButton.className = "group-action";
    addEnvironmentButton.textContent = t("addEnvironment");
    addEnvironmentButton.addEventListener("click", (event) => {
      event.stopPropagation();
      addEnvironment(group.id);
    });
    actions.append(addEnvironmentButton);

    const duplicate = document.createElement("button");
    duplicate.type = "button";
    duplicate.className = "group-action";
    duplicate.textContent = t("duplicate");
    duplicate.disabled = !settings.environments.some((environment) => environment.groupId === group.id);
    duplicate.addEventListener("click", (event) => {
      event.stopPropagation();
      duplicateEnvironment(group.id);
    });
    actions.append(duplicate);

    header.append(titleWrap, actions);
    wrap.append(header);

    const stack = document.createElement("div");
    stack.className = "environment-group__list";
    const groupEnvironments = settings.environments.filter((environment) => environment.groupId === group.id);

    if (!groupEnvironments.length) {
      const empty = document.createElement("div");
      empty.className = "empty empty--compact";
      empty.textContent = t("emptyGroup");
      stack.append(empty);
    } else {
      groupEnvironments.forEach((environment) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "environment-item";
        button.classList.toggle("is-active", environment.id === selectedId);
        button.classList.toggle("is-disabled", environment.enabled === false);
        button.style.setProperty("--item-color", environment.badgeColor || "#2563eb");
        button.style.setProperty("--badge-text", environment.badgeTextColor || "#ffffff");

        const name = document.createElement("div");
        name.className = "environment-item__name";
        const nameText = document.createElement("span");
        nameText.textContent = environment.name || t("environmentFallback");
        name.append(nameText);

        if (environment.enabled === false) {
          const status = document.createElement("span");
          status.className = "environment-item__status";
          status.textContent = t("disabled");
          name.append(status);
        }

        const badge = document.createElement("span");
        badge.className = "environment-item__badge";
        badge.textContent = markerLabel(environment);
        name.append(badge);

        const meta = document.createElement("div");
        meta.className = "environment-item__meta";
        meta.textContent = environment.rules?.[0]?.value || t("noUrlRules");

        button.append(name, meta);
        button.addEventListener("click", () => selectEnvironment(group.id, environment.id));
        stack.append(button);
      });
    }

    wrap.append(stack);
    nodes.list.append(wrap);
  });
}

function createRuleRow(rule, index) {
  const row = document.createElement("div");
  row.className = "row-card";

  const type = document.createElement("select");
  ["wildcard", "prefix", "regex"].forEach((optionValue) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = ruleTypeLabel(optionValue);
    type.append(option);
  });
  type.value = rule.type || "wildcard";

  const value = document.createElement("input");
  value.type = "text";
  value.placeholder = "https://test.example.com/*";
  value.value = rule.value || "";

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove-button";
  remove.textContent = "x";
  remove.title = t("removeRule");

  type.addEventListener("change", () => {
    const environment = selectedEnvironment();
    environment.rules[index].type = type.value;
    markChanged();
  });

  value.addEventListener("input", () => {
    const environment = selectedEnvironment();
    environment.rules[index].value = value.value;
    renderEnvironmentList();
    markChanged();
  });

  remove.addEventListener("click", () => {
    const environment = selectedEnvironment();
    environment.rules.splice(index, 1);
    render();
    markChanged();
  });

  row.append(type, value, remove);
  return row;
}

function createAccountRow(account, index) {
  const row = document.createElement("div");
  row.className = "row-card account";
  row.dataset.accountId = account.id;

  const dragHandle = document.createElement("button");
  dragHandle.type = "button";
  dragHandle.className = "account-drag-handle";
  dragHandle.title = t("dragToReorder");
  dragHandle.draggable = true;
  dragHandle.textContent = String(index + 1);

  const username = document.createElement("input");
  username.type = "text";
  username.placeholder = t("usernamePlaceholder");
  username.value = account.username || "";

  const password = document.createElement("input");
  password.type = "password";
  password.placeholder = t("passwordPlaceholder");
  password.value = account.password || "";

  const label = document.createElement("input");
  label.type = "text";
  label.placeholder = t("accountLabelPlaceholder");
  label.value = account.label || "";

  const defaultWrap = document.createElement("label");
  defaultWrap.className = "row-check";
  const defaultFill = document.createElement("input");
  defaultFill.type = "checkbox";
  defaultFill.checked = Boolean(account.defaultFill);
  const defaultText = document.createElement("span");
  defaultText.textContent = t("defaultFill");
  defaultWrap.append(defaultFill, defaultText);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove-button";
  remove.textContent = "x";
  remove.title = t("removeAccount");

  dragHandle.addEventListener("dragstart", (event) => {
    draggingAccountId = account.id;
    clearAccountDropIndicators();
    row.classList.add("is-drag-source");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", account.id);
    }
  });

  dragHandle.addEventListener("dragend", () => {
    draggingAccountId = "";
    clearAccountDropIndicators();
  });

  row.addEventListener("dragover", (event) => {
    if (!draggingAccountId || draggingAccountId === account.id) return;
    event.preventDefault();
    const rect = row.getBoundingClientRect();
    const placement = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    setAccountDropIndicator(row, placement);
    if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  });

  row.addEventListener("drop", (event) => {
    if (!draggingAccountId || draggingAccountId === account.id) return;
    event.preventDefault();
    const placement = row.classList.contains("is-drop-after") ? "after" : "before";
    const environment = selectedEnvironment();
    const didMove = reorderAccounts(environment, draggingAccountId, account.id, placement);
    draggingAccountId = "";
    clearAccountDropIndicators();
    if (!didMove) return;
    render();
    markChanged();
  });

  const update = () => {
    const environment = selectedEnvironment();
    clearAccountsValidationError();
    environment.accounts[index] = {
      ...environment.accounts[index],
      label: label.value,
      username: username.value,
      password: password.value,
      defaultFill: defaultFill.checked
    };
    markChanged();
  };

  label.addEventListener("input", update);
  username.addEventListener("input", update);
  password.addEventListener("input", update);
  defaultFill.addEventListener("change", () => {
    const environment = selectedEnvironment();
    if (defaultFill.checked) {
      environment.accounts.forEach((item, itemIndex) => {
        item.defaultFill = itemIndex === index;
      });
      render();
    } else {
      environment.accounts[index].defaultFill = false;
    }
    markChanged();
  });

  remove.addEventListener("click", () => {
    const environment = selectedEnvironment();
    clearAccountsValidationError();
    environment.accounts.splice(index, 1);
    render();
    markChanged();
  });

  row.append(dragHandle, username, password, label, defaultWrap, remove);
  return row;
}

function renderRows() {
  const environment = selectedEnvironment();
  nodes.rules.innerHTML = "";
  nodes.accounts.innerHTML = "";

  if (!environment.rules.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = t("noRulesHint");
    nodes.rules.append(empty);
  } else {
    environment.rules.forEach((rule, index) => nodes.rules.append(createRuleRow(rule, index)));
  }

  if (!environment.accounts.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = t("noAccountsHint");
    nodes.accounts.append(empty);
  } else {
    environment.accounts.forEach((account, index) => nodes.accounts.append(createAccountRow(account, index)));
  }
}

function previewStyleLabel(environment) {
  return environment.badgeStyle === "slanted" ? t("badgeStyleSlanted") : t("badgeStylePill");
}

function renderPreviewWatermark(surface, label, environment) {
  const watermark = document.createElement("div");
  watermark.className = "marker-preview__watermark";
  watermark.style.setProperty("--preview-watermark-color", environment.watermarkColor || "#2563eb");
  watermark.style.setProperty("--preview-watermark-opacity", String(environment.watermarkOpacity ?? 0.08));
  watermark.style.setProperty("--preview-watermark-angle", `${environment.watermarkAngle ?? -24}deg`);
  watermark.style.setProperty("--preview-watermark-size", `${environment.watermarkSize ?? 42}px`);
  watermark.style.setProperty("--preview-watermark-gap", `${environment.watermarkGap ?? 80}px`);

  const grid = document.createElement("div");
  grid.className = "marker-preview__watermark-grid";
  for (let index = 0; index < 16; index += 1) {
    const item = document.createElement("span");
    item.className = "marker-preview__watermark-item";
    item.textContent = label;
    grid.append(item);
  }

  watermark.append(grid);
  surface.append(watermark);
}

function renderPreviewBadge(surface, label, environment) {
  const badge = document.createElement("div");
  badge.className = "marker-preview__badge";
  badge.dataset.position = environment.badgePosition || "top-right";
  badge.dataset.style = environment.badgeStyle || "slanted";
  badge.style.setProperty("--preview-badge-color", environment.badgeColor || "#2563eb");
  badge.style.setProperty("--preview-badge-text", environment.badgeTextColor || "#ffffff");
  badge.style.setProperty("--preview-badge-offset", "12px");
  badge.style.setProperty("--preview-badge-opacity", String(environment.badgeOpacity ?? 1));
  badge.style.setProperty("--preview-badge-scale", String(environment.badgeScale ?? 1));
  badge.style.setProperty("--preview-badge-size", `${environment.badgeSize ?? 14}px`);
  badge.textContent = label;
  surface.append(badge);
}

function buildPreviewCanvas(environment, label) {
  const canvas = document.createElement("div");
  canvas.className = "marker-preview__canvas";

  const chromeBar = document.createElement("div");
  chromeBar.className = "marker-preview__chrome";
  chromeBar.innerHTML = '<span></span><span></span><span></span>';

  const header = document.createElement("div");
  header.className = "marker-preview__header";
  const title = document.createElement("div");
  title.className = "marker-preview__title";
  title.textContent = environment.titlePrefix ? `[${label}] Example Console` : "Example Console";
  const meta = document.createElement("div");
  meta.className = "marker-preview__meta";
  const previewParts = [];
  if (environment.badgeEnabled !== false) previewParts.push(t("badgeConfig"));
  if (environment.watermarkEnabled === true) previewParts.push(t("watermarkConfig"));
  meta.textContent = previewParts.join(" · ") || t("marker");
  header.append(title, meta);

  const body = document.createElement("div");
  body.className = "marker-preview__body";
  body.innerHTML = `
    <div class="marker-preview__panel marker-preview__panel--side"></div>
    <div class="marker-preview__panel marker-preview__panel--main">
      <div class="marker-preview__metric"></div>
      <div class="marker-preview__metric marker-preview__metric--wide"></div>
      <div class="marker-preview__metric"></div>
      <div class="marker-preview__metric"></div>
    </div>
  `;

  canvas.append(chromeBar, header, body);
  return canvas;
}

function renderMarkerPreviews() {
  const environment = selectedEnvironment();
  if (!nodes.badgePreviewSurface || !nodes.watermarkPreviewSurface) return;
  nodes.badgePreviewSurface.innerHTML = "";
  nodes.watermarkPreviewSurface.innerHTML = "";
  if (!environment) return;

  const label = markerLabel(environment);
  const watermarkText = watermarkLabel(environment);
  const badgeCanvas = buildPreviewCanvas(environment, label);
  if (environment.badgeEnabled !== false) {
    renderPreviewBadge(badgeCanvas, label, environment);
  }
  nodes.badgePreviewSurface.append(badgeCanvas);

  const watermarkCanvas = buildPreviewCanvas(environment, label);
  if (environment.watermarkEnabled === true) {
    renderPreviewWatermark(watermarkCanvas, watermarkText, environment);
  }
  nodes.watermarkPreviewSurface.append(watermarkCanvas);
}

function renderForm() {
  const environment = selectedEnvironment();
  const hasEnvironment = Boolean(environment);
  nodes.form.hidden = !hasEnvironment;
  nodes.deleteEnvironment.disabled = !hasEnvironment;
  nodes.addRule.disabled = !hasEnvironment;
  nodes.addAccount.disabled = !hasEnvironment;
  nodes.enabled.disabled = !hasEnvironment;
  nodes.save.disabled = !hasEnvironment;
  nodes.sectionNavButtons.forEach((button) => {
    button.disabled = !hasEnvironment;
  });

  if (!environment) return;

  isRendering = true;
  renderGroupOptions();
  nodes.name.value = environment.name;
  nodes.group.value = ensureGroupId(environment.groupId, settings.groups);
  nodes.badge.value = environment.badge || environment.name || "";
  nodes.badgeEnabled.checked = environment.badgeEnabled !== false;
  nodes.badgeColor.value = environment.badgeColor;
  nodes.badgeTextColor.value = environment.badgeTextColor;
  nodes.watermarkEnabled.checked = environment.watermarkEnabled === true;
  nodes.watermarkText.value = watermarkLabel(environment);
  nodes.watermarkColor.value = environment.watermarkColor;
  renderColorSwatches(nodes.badgeColorSwatches, ENVIRONMENT_COLOR_PRESETS, environment.badgeColor, (color) => {
    nodes.badgeColor.value = color;
    updateSelectedEnvironment({ badgeColor: color });
  });
  renderColorSwatches(nodes.badgeTextColorSwatches, TEXT_COLOR_PRESETS, environment.badgeTextColor, (color) => {
    nodes.badgeTextColor.value = color;
    updateSelectedEnvironment({ badgeTextColor: color });
  });
  renderColorSwatches(nodes.watermarkColorSwatches, ENVIRONMENT_COLOR_PRESETS, environment.watermarkColor, (color) => {
    nodes.watermarkColor.value = color;
    updateSelectedEnvironment({ watermarkColor: color });
  });
  nodes.enabled.checked = environment.enabled !== false;
  syncEnabledLabel();
  nodes.titlePrefix.checked = environment.titlePrefix;
  syncBadgeStyleOptions(environment.badgeStyle);
  nodes.badgePosition.value = environment.badgePosition;
  nodes.badgeScale.value = environment.badgeScale;
  nodes.badgeSize.value = environment.badgeSize;
  nodes.badgeOpacity.value = environment.badgeOpacity;
  nodes.watermarkOpacity.value = environment.watermarkOpacity;
  nodes.watermarkAngle.value = environment.watermarkAngle;
  nodes.watermarkSize.value = environment.watermarkSize;
  nodes.watermarkGap.value = environment.watermarkGap;
  renderRows();
  renderMarkerPreviews();
  isRendering = false;
}

function render() {
  if (!settings.groups.some((group) => group.id === selectedGroupId)) {
    selectedGroupId = DEFAULT_GROUP_ID;
  }
  if (!selectedEnvironment() && settings.environments.length) {
    selectedId = settings.environments.find((environment) => environment.groupId === selectedGroupId)?.id || settings.environments[0].id;
  }
  renderEnvironmentList();
  renderForm();
  syncRailNav();
  positionToolbox();
}

function updateSelectedEnvironment(patch) {
  const environment = selectedEnvironment();
  if (!environment) return;
  Object.assign(environment, patch);
  if (patch.groupId) selectedGroupId = patch.groupId;
  renderEnvironmentList();
  renderMarkerPreviews();
  markChanged();
}

async function setSelectedEnvironmentEnabled(enabled) {
  const environment = selectedEnvironment();
  if (!environment) return;
  environment.enabled = enabled;
  renderEnvironmentList();
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
  savedSettingsSnapshot = clone(settings);
  hasUnsavedChanges = false;
  syncSaveButtonState();
  syncEnabledLabel();
  setStatus(t("saved"));
}

function addGroup() {
  const value = window.prompt(t("promptGroupName"), "");
  if (value === null) return;
  const name = normalizeGroupName(value);
  if (settings.groups.some((group) => group.name === name)) {
    setStatus(t("groupExists"), true);
    return;
  }
  const group = { id: uid("group"), name };
  settings.groups.push(group);
  selectedGroupId = group.id;
  render();
  markChanged();
}

function renameGroup(groupId) {
  const group = settings.groups.find((item) => item.id === groupId);
  if (!group) return;
  const value = window.prompt(t("promptRenameGroup"), group.name);
  if (value === null) return;
  const name = normalizeGroupName(value);
  if (settings.groups.some((item) => item.id !== groupId && item.name === name)) {
    setStatus(t("groupExists"), true);
    return;
  }
  group.name = name;
  render();
  markChanged();
}

function deleteGroup(groupId) {
  const group = settings.groups.find((item) => item.id === groupId);
  if (!group || group.id === DEFAULT_GROUP_ID) return;
  if (!window.confirm(t("confirmDeleteGroup", [group.name, defaultGroupName()]))) return;
  settings.environments = settings.environments.map((environment) =>
    environment.groupId === groupId ? { ...environment, groupId: DEFAULT_GROUP_ID } : environment
  );
  settings.groups = settings.groups.filter((item) => item.id !== groupId);
  selectedGroupId = DEFAULT_GROUP_ID;
  if (selectedEnvironment()?.groupId === groupId) {
    selectedId = settings.environments.find((environment) => environment.groupId === DEFAULT_GROUP_ID)?.id || null;
  }
  render();
  markChanged();
}

function addEnvironment(groupId = selectedGroupId || DEFAULT_GROUP_ID) {
  if (!confirmDiscardUnsavedChanges()) return;
  const targetGroupId = groupId || DEFAULT_GROUP_ID;
  const color = pickEnvironmentColor();
  const name = t("newEnvironment");
  const environment = {
    id: uid("env"),
    groupId: ensureGroupId(targetGroupId, settings.groups),
    name,
    enabled: true,
    badge: name,
    badgeEnabled: true,
    badgeColor: color,
    badgeTextColor: "#ffffff",
    badgeStyle: "slanted",
    badgePosition: "top-right",
    badgeScale: 1,
    badgeSize: 14,
    badgeOffset: 12,
    badgeOpacity: 1,
    watermarkText: name,
    watermarkEnabled: false,
    watermarkColor: color,
    watermarkOpacity: 0.08,
    watermarkAngle: -24,
    watermarkSize: 42,
    watermarkGap: 80,
    titlePrefix: true,
    markerMode: "badge",
    rules: [{ type: "wildcard", value: "https://example.com/*" }],
    accounts: []
  };
  settings.environments.push(environment);
  selectedGroupId = environment.groupId;
  selectedId = environment.id;
  render();
  markChanged();
}

function duplicateEnvironment(groupId) {
  if (!confirmDiscardUnsavedChanges()) return;
  const source =
    (selectedEnvironment() && selectedEnvironment().groupId === groupId ? selectedEnvironment() : null) ||
    settings.environments.find((environment) => environment.groupId === groupId);
  if (!source) return;
  const copy = clone(source);
  copy.id = uid("env");
  copy.name = t("newEnvironmentCopy", [copy.name]);
  copy.groupId = groupId;
  settings.environments.push(copy);
  selectedGroupId = copy.groupId;
  selectedId = copy.id;
  render();
  markChanged();
}

function deleteEnvironment() {
  const environment = selectedEnvironment();
  if (!environment) return;
  const name = typeof environment.name === "string" && environment.name.trim() ? environment.name.trim() : t("environmentFallback");
  if (!window.confirm(t("confirmDeleteEnvironment", [name]))) return;
  const currentGroupId = environment.groupId;
  settings.environments = settings.environments.filter((item) => item.id !== environment.id);
  selectedGroupId = currentGroupId;
  selectedId = settings.environments.find((item) => item.groupId === currentGroupId)?.id || null;
  render();
  markChanged();
}

async function saveSettings() {
  const emptyAccount = findEmptyAccount();
  if (emptyAccount) {
    selectedGroupId = emptyAccount.environment.groupId;
    selectedId = emptyAccount.environment.id;
    render();
    showAccountsValidationError(t("emptyAccountError"));
    return;
  }
  settings = normalizeSettings(settings);
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
  savedSettingsSnapshot = clone(settings);
  hasUnsavedChanges = false;
  syncSaveButtonState();
  clearAccountsValidationError();
  render();
  setStatus(t("saved"));
}

function exportSettings() {
  const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "envmate-config.json";
  link.click();
  URL.revokeObjectURL(url);
  setStatus(t("exported"));
}

function applySettings(nextSettings, message) {
  clearAccountsValidationError();
  settings = normalizeSettings(nextSettings);
  hasUnsavedChanges = message === t("importedSaveToApply") || message === t("sampleLoadedSaveToApply");
  if (!hasUnsavedChanges) {
    savedSettingsSnapshot = clone(settings);
  }
  selectedGroupId = settings.groups[0]?.id || DEFAULT_GROUP_ID;
  selectedId = settings.environments.find((environment) => environment.groupId === selectedGroupId)?.id || settings.environments[0]?.id || null;
  render();
  syncSaveButtonState();
  setStatus(message);
}

bindNodeEvent(nodes.name, "input", () => {
  const environment = selectedEnvironment();
  if (!environment) return;
  const nextName = nodes.name.value;
  const previousName = environment.name || "";
  const shouldSyncBadge = !environment.badge || environment.badge === previousName;
  const shouldSyncWatermark = !environment.watermarkText || environment.watermarkText === previousName;
  updateSelectedEnvironment({
    name: nextName,
    ...(shouldSyncBadge ? { badge: nextName } : {}),
    ...(shouldSyncWatermark ? { watermarkText: nextName } : {})
  });
});
bindNodeEvent(nodes.group, "change", () => updateSelectedEnvironment({ groupId: nodes.group.value }));
bindNodeEvent(nodes.badge, "input", () => updateSelectedEnvironment({ badge: nodes.badge.value }));
bindNodeEvent(nodes.badgeEnabled, "change", () => updateSelectedEnvironment({ badgeEnabled: nodes.badgeEnabled.checked }));
bindNodeEvent(nodes.watermarkText, "input", () => updateSelectedEnvironment({ watermarkText: nodes.watermarkText.value }));
bindNodeEvent(nodes.badgeColor, "input", () => {
  updateSelectedEnvironment({ badgeColor: nodes.badgeColor.value });
  renderColorSwatches(nodes.badgeColorSwatches, ENVIRONMENT_COLOR_PRESETS, nodes.badgeColor.value, (color) => {
    nodes.badgeColor.value = color;
    updateSelectedEnvironment({ badgeColor: color });
  });
});
bindNodeEvent(nodes.badgeTextColor, "input", () => {
  updateSelectedEnvironment({ badgeTextColor: nodes.badgeTextColor.value });
  renderColorSwatches(nodes.badgeTextColorSwatches, TEXT_COLOR_PRESETS, nodes.badgeTextColor.value, (color) => {
    nodes.badgeTextColor.value = color;
    updateSelectedEnvironment({ badgeTextColor: color });
  });
});
bindNodeEvent(nodes.watermarkColor, "input", () => {
  updateSelectedEnvironment({ watermarkColor: nodes.watermarkColor.value });
  renderColorSwatches(nodes.watermarkColorSwatches, ENVIRONMENT_COLOR_PRESETS, nodes.watermarkColor.value, (color) => {
    nodes.watermarkColor.value = color;
    updateSelectedEnvironment({ watermarkColor: color });
  });
});
bindNodeEvent(nodes.watermarkEnabled, "change", () => updateSelectedEnvironment({ watermarkEnabled: nodes.watermarkEnabled.checked }));
bindNodeEvent(nodes.enabled, "change", async () => {
  syncEnabledLabel();
  await setSelectedEnvironmentEnabled(nodes.enabled.checked);
});
bindNodeEvent(nodes.titlePrefix, "change", () => updateSelectedEnvironment({ titlePrefix: nodes.titlePrefix.checked }));

bindNodeEvent(nodes.badgePosition, "change", () => {
  updateSelectedEnvironment({ badgePosition: nodes.badgePosition.value });
});

nodes.badgeStyleOptions.forEach((option) => {
  bindNodeEvent(option, "change", () => {
    const nextStyle = selectedBadgeStyle();
    updateSelectedEnvironment({ badgeStyle: nextStyle });
  });
});

bindNodeEvent(nodes.badgeSize, "input", () => {
  updateSelectedEnvironment({ badgeSize: Number(nodes.badgeSize.value) });
});

bindNodeEvent(nodes.badgeScale, "input", () => {
  updateSelectedEnvironment({ badgeScale: Number(nodes.badgeScale.value) });
});

bindNodeEvent(nodes.badgeOpacity, "input", () => {
  updateSelectedEnvironment({ badgeOpacity: Number(nodes.badgeOpacity.value) });
});

bindNodeEvent(nodes.watermarkOpacity, "input", () => {
  updateSelectedEnvironment({ watermarkOpacity: Number(nodes.watermarkOpacity.value) });
});

bindNodeEvent(nodes.watermarkAngle, "input", () => {
  updateSelectedEnvironment({ watermarkAngle: Number(nodes.watermarkAngle.value) });
});

bindNodeEvent(nodes.watermarkSize, "input", () => {
  updateSelectedEnvironment({ watermarkSize: Number(nodes.watermarkSize.value) });
});

bindNodeEvent(nodes.watermarkGap, "input", () => {
  updateSelectedEnvironment({ watermarkGap: Number(nodes.watermarkGap.value) });
});

nodes.sectionNavButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.scrollTarget);
    if (!target) return;
    clearScrollSettleTimer();
    activeSectionId = button.dataset.scrollTarget;
    scrollTargetLockId = button.dataset.scrollTarget;
    syncRailNav();
    scrollSectionIntoView(target);
  });
});

window.addEventListener(
  "scroll",
  () => {
    const current = currentSectionFromScroll();
    if (!current) return;

    if (!scrollTargetLockId && current.id !== activeSectionId) {
      activeSectionId = current.id;
      syncRailNav();
    }
    scheduleScrollSettle();
    positionToolbox();
  },
  { passive: true }
);

window.addEventListener("resize", positionToolbox, { passive: true });

window.addEventListener("beforeunload", (event) => {
  if (!hasUnsavedChanges) return;
  event.preventDefault();
  event.returnValue = "";
});

bindNodeEvent(nodes.addRule, "click", () => {
  const environment = selectedEnvironment();
  if (!environment) return;
  environment.rules.push({ type: "wildcard", value: "" });
  render();
  markChanged();
});

bindNodeEvent(nodes.addAccount, "click", () => {
  const environment = selectedEnvironment();
  if (!environment) return;
  clearAccountsValidationError();
  environment.accounts.push({ id: uid("account"), label: "", username: "", password: "", defaultFill: false });
  render();
  markChanged();
});

bindNodeEvent(nodes.addGroup, "click", addGroup);
bindNodeEvent(nodes.deleteEnvironment, "click", deleteEnvironment);
bindNodeEvent(nodes.save, "click", saveSettings);
bindNodeEvent(nodes.exportConfig, "click", exportSettings);

bindNodeEvent(nodes.importConfig, "change", async () => {
  const file = nodes.importConfig.files?.[0];
  if (!file) return;
  try {
    applySettings(JSON.parse(await file.text()), t("importedSaveToApply"));
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    nodes.importConfig.value = "";
  }
});

bindNodeEvent(nodes.loadSample, "click", () => {
  applySettings(clone(SAMPLE_SETTINGS), t("sampleLoadedSaveToApply"));
});

async function loadSettings() {
  const result = await chrome.storage.local.get([STORAGE_KEY]);
  applySettings(result[STORAGE_KEY] || SAMPLE_SETTINGS, t("ready"));
}

loadSettings();
