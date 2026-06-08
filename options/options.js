const STORAGE_KEY = "envmateSettings";
const DEFAULT_GROUP_ID = "default";
const SAMPLE_GROUP_ID = "sample";
const ENVIRONMENT_COLOR_PRESETS = ["#2563eb", "#059669", "#dc2626", "#7c3aed", "#ea580c", "#0f766e", "#db2777", "#4f46e5"];
const TEXT_COLOR_PRESETS = ["#ffffff", "#f8fafc", "#e2e8f0", "#111827", "#0f172a", "#334155"];
const EXPORTED_PASSWORD_SCHEME = "emsec";
const EXPORTED_PASSWORD_VERSION = "v1";
const EXPORTED_PASSWORD_KEY_V1 = "EnvMate export password v1";
const LUCIDE_ICON_ATTRS = {
  fill: "none",
  stroke: "currentColor",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
  "stroke-width": "2"
};
const LUCIDE_ICON_NODES = {
  plus: [
    ["path", { d: "M12 5v14" }],
    ["path", { d: "M5 12h14" }]
  ],
  flaskConical: [
    ["path", { d: "M10 2v7.31" }],
    ["path", { d: "M14 9.3V2" }],
    ["path", { d: "M8.5 2h7" }],
    ["path", { d: "M14 9.3a6.5 6.5 0 1 1-4 0" }],
    ["path", { d: "M5.58 16h12.85" }]
  ],
  download: [
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
    ["path", { d: "m7 10 5 5 5-5" }],
    ["path", { d: "M12 15V3" }]
  ],
  upload: [
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
    ["path", { d: "M17 8l-5-5-5 5" }],
    ["path", { d: "M12 3v12" }]
  ],
  save: [
    ["path", { d: "M15.2 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.8Z" }],
    ["path", { d: "M17 21v-8H7v8" }],
    ["path", { d: "M7 3v5h8" }]
  ],
  badgeHelp: [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["path", { d: "M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" }],
    ["path", { d: "M12 17h.01" }]
  ],
  edit: [
    ["path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }],
    ["path", { d: "M18.5 2.5a2.12 2.12 0 1 1 3 3L12 15l-4 1 1-4Z" }]
  ],
  trash: [
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M8 6V4h8v2" }],
    ["path", { d: "M19 6l-1 14H6L5 6" }],
    ["path", { d: "M10 11v6" }],
    ["path", { d: "M14 11v6" }]
  ],
  copy: [
    ["rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }],
    ["path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" }]
  ],
  x: [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }]
  ],
  power: [
    ["path", { d: "M12 2v10" }],
    ["path", { d: "M18.4 6.6a9 9 0 1 1-12.8 0" }]
  ]
};

function createSampleSettings() {
  return {
    groups: [{ id: DEFAULT_GROUP_ID, name: t("defaultGroup") }],
    environments: []
  };
}

const nodes = {
  list: document.querySelector("#environment-list"),
  status: document.querySelector("#status"),
  addGroup: document.querySelector("#add-group"),
  deleteEnvironment: document.querySelector("#delete-environment"),
  save: document.querySelector("#save-config"),
  exportConfig: document.querySelector("#export-config"),
  importConfigTrigger: document.querySelector("#import-config-trigger"),
  aboutTrigger: document.querySelector("#about-trigger"),
  importConfig: document.querySelector("#import-config"),
  localeSwitcher: document.querySelector("#locale-switcher"),
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
  toolbox: document.querySelector("#workspace-toolbox"),
  modalBackdrop: document.querySelector("#selection-modal-backdrop"),
  exportModal: document.querySelector("#export-modal"),
  exportModalClose: document.querySelector("#export-modal-close"),
  exportModalCancel: document.querySelector("#export-modal-cancel"),
  exportModalConfirm: document.querySelector("#export-modal-confirm"),
  exportSelectionList: document.querySelector("#export-selection-list"),
  importModal: document.querySelector("#import-modal"),
  importModalClose: document.querySelector("#import-modal-close"),
  importModalCancel: document.querySelector("#import-modal-cancel"),
  importModalConfirm: document.querySelector("#import-modal-confirm"),
  importSelectionList: document.querySelector("#import-selection-list"),
  importDropzone: document.querySelector("#import-dropzone"),
  importDropzoneDetail: document.querySelector("#import-dropzone-detail"),
  aboutModal: document.querySelector("#about-modal"),
  aboutModalClose: document.querySelector("#about-modal-close"),
  aboutModalConfirm: document.querySelector("#about-modal-confirm"),
  aboutWechatSection: document.querySelector("#about-wechat-section")
};

const t = window.envmateI18n.t;

let settings = createSampleSettings();
let savedSettingsSnapshot = clone(settings);
let selectedId = null;
let selectedGroupId = DEFAULT_GROUP_ID;
let isRendering = false;
let activeSectionId = "section-basic";
let hasUnsavedChanges = false;
let scrollTargetLockId = "";
let scrollSettleTimer = 0;
let draggingAccountId = "";
let draggingEnvironmentId = "";
let exportSelectionState = null;
let importPreviewSettings = null;
let importSelectionState = null;
let activeModalName = "";

function syncLocaleSwitcher() {
  if (!nodes.localeSwitcher || !window.envmateI18n?.getLocaleChoice) return;
  const localeChoice = window.envmateI18n.getLocaleChoice();
  if (localeChoice === "auto") {
    const browserLocale = chrome.i18n.getUILanguage();
    nodes.localeSwitcher.value = String(browserLocale || "").toLowerCase().startsWith("zh") ? "zh_CN" : "en";
    return;
  }
  nodes.localeSwitcher.value = localeChoice;
}

function isChineseUi() {
  return String(document.documentElement.lang || "").toLowerCase().startsWith("zh");
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function pickEnvironmentColor() {
  return ENVIRONMENT_COLOR_PRESETS[Math.floor(Math.random() * ENVIRONMENT_COLOR_PRESETS.length)];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return window.btoa(binary);
}

function base64ToBytes(value) {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function encodeExportedPasswordV1(value) {
  if (!value) return "";
  const source = new TextEncoder().encode(String(value));
  const key = new TextEncoder().encode(EXPORTED_PASSWORD_KEY_V1);
  const mixed = new Uint8Array(source.length);
  for (let index = 0; index < source.length; index += 1) {
    mixed[index] = source[index] ^ key[index % key.length] ^ ((index * 29 + 17) & 0xff);
  }
  return bytesToBase64(mixed);
}

function decodeExportedPasswordV1(payload) {
  const mixed = base64ToBytes(payload);
  const key = new TextEncoder().encode(EXPORTED_PASSWORD_KEY_V1);
  const source = new Uint8Array(mixed.length);
  for (let index = 0; index < mixed.length; index += 1) {
    source[index] = mixed[index] ^ key[index % key.length] ^ ((index * 29 + 17) & 0xff);
  }
  return new TextDecoder().decode(source);
}

function obfuscateExportedPassword(value) {
  if (!value) return "";
  const payload = encodeExportedPasswordV1(value);
  return `${EXPORTED_PASSWORD_SCHEME}:${EXPORTED_PASSWORD_VERSION}:${payload}`;
}

function revealImportedPassword(value) {
  if (!value) return "";
  if (typeof value !== "string") throw new Error(t("invalidImportedPassword"));
  const [scheme, version, ...payloadParts] = value.split(":");
  const payload = payloadParts.join(":");
  if (!scheme || !version || !payload || scheme !== EXPORTED_PASSWORD_SCHEME) {
    throw new Error(t("invalidImportedPassword"));
  }
  try {
    if (version === "v1") return decodeExportedPasswordV1(payload);
    throw new Error(t("invalidImportedPassword"));
  } catch (_) {
    throw new Error(t("invalidImportedPassword"));
  }
}

function buildExportSettings(sourceSettings = settings) {
  const next = clone(sourceSettings);
  next.environments = (next.environments || []).map((environment) => ({
    ...environment,
    accounts: Array.isArray(environment.accounts)
      ? environment.accounts.map((account) => ({
          ...account,
          password: obfuscateExportedPassword(account.password || "")
        }))
      : []
  }));
  return next;
}

function decodeImportedSettings(value) {
  const next = clone(value);
  next.environments = (next.environments || []).map((environment) => ({
    ...environment,
    accounts: Array.isArray(environment.accounts)
      ? environment.accounts.map((account) => ({
          ...account,
          password: revealImportedPassword(account.password || "")
        }))
      : []
  }));
  return next;
}

function groupedEnvironments(sourceSettings) {
  return (sourceSettings.groups || [])
    .map((group) => ({
      id: group.id,
      name: group.name,
      environments: (sourceSettings.environments || []).filter((environment) => environment.groupId === group.id)
    }))
    .filter((group) => group.environments.length > 0);
}

function createSelectionState(groups) {
  const state = { groups: {}, environments: {}, expanded: {} };
  groups.forEach((group) => {
    state.expanded[group.id] = false;
    if (!group.environments.length) {
      state.groups[group.id] = true;
      return;
    }
    group.environments.forEach((environment) => {
      state.environments[environment.id] = true;
    });
  });
  return state;
}

function selectedEnvironmentCount(group, selectionState) {
  return group.environments.filter((environment) => selectionState.environments[environment.id] !== false).length;
}

function groupSelectionStatus(group, selectionState) {
  if (!group.environments.length) {
    return {
      checked: selectionState.groups[group.id] !== false,
      indeterminate: false
    };
  }
  const selectedCount = selectedEnvironmentCount(group, selectionState);
  return {
    checked: selectedCount === group.environments.length,
    indeterminate: selectedCount > 0 && selectedCount < group.environments.length
  };
}

function selectedTreeHasValue(groups, selectionState) {
  return groups.some((group) => {
    if (!group.environments.length) return selectionState.groups[group.id] !== false;
    return selectedEnvironmentCount(group, selectionState) > 0;
  });
}

function selectedEnvironmentTotal(groups, selectionState) {
  return groups.reduce((total, group) => {
    if (!group.environments.length) return total;
    return total + selectedEnvironmentCount(group, selectionState);
  }, 0);
}

function renderSelectionTree(container, groups, selectionState, options = {}) {
  container.innerHTML = "";
  container.classList.toggle("selection-tree--empty", !groups.length);

  if (!groups.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = options.emptyText || t("selectionEmpty");
    container.append(empty);
    return;
  }

  groups.forEach((group) => {
    const groupCard = document.createElement("section");
    groupCard.className = "selection-item";

    const row = document.createElement("div");
    row.className = "selection-node selection-node--group";

    const disclosure = document.createElement("button");
    disclosure.type = "button";
    disclosure.className = "selection-disclosure";
    disclosure.disabled = !group.environments.length;
    disclosure.hidden = !group.environments.length;
    disclosure.title = selectionState.expanded[group.id] ? t("hideEnvironments") : t("showEnvironments");
    disclosure.classList.toggle("is-expanded", selectionState.expanded[group.id]);
    disclosure.addEventListener("click", () => {
      selectionState.expanded[group.id] = !selectionState.expanded[group.id];
      renderSelectionTree(container, groups, selectionState, options);
    });

    const checkLabel = document.createElement("label");
    checkLabel.className = "selection-check";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    const selection = groupSelectionStatus(group, selectionState);
    checkbox.checked = selection.checked;
    checkbox.indeterminate = selection.indeterminate;

    checkbox.addEventListener("change", () => {
      if (!group.environments.length) {
        selectionState.groups[group.id] = checkbox.checked;
      } else {
        group.environments.forEach((environment) => {
          selectionState.environments[environment.id] = checkbox.checked;
        });
      }
      renderSelectionTree(container, groups, selectionState, options);
      options.onChange?.();
    });

    const summary = document.createElement("span");
    summary.className = "selection-group__summary";
    const icon = document.createElement("span");
    icon.className = "selection-icon selection-icon--group";
    icon.setAttribute("aria-hidden", "true");
    const title = document.createElement("span");
    title.className = "selection-group__title";
    title.textContent = group.name;
    const meta = document.createElement("span");
    meta.className = "selection-group__meta";
    meta.textContent = group.environments.length
      ? t("groupEnvironmentCount", [String(group.environments.length)])
      : t("emptyGroup");
    summary.append(title, meta);
    checkLabel.append(checkbox, icon, summary);

    row.append(disclosure, checkLabel);
    groupCard.append(row);

    if (group.environments.length && selectionState.expanded[group.id]) {
      const children = document.createElement("div");
      children.className = "selection-children";

      group.environments.forEach((environment) => {
        const childRow = document.createElement("div");
        childRow.className = "selection-node selection-node--child";

        const branch = document.createElement("span");
        branch.className = "selection-branch";
        branch.setAttribute("aria-hidden", "true");

        const child = document.createElement("label");
        child.className = "selection-check";
        const childCheckbox = document.createElement("input");
        childCheckbox.type = "checkbox";
        childCheckbox.checked = selectionState.environments[environment.id] !== false;
        childCheckbox.addEventListener("change", () => {
          selectionState.environments[environment.id] = childCheckbox.checked;
          renderSelectionTree(container, groups, selectionState, options);
          options.onChange?.();
        });

        const childSummary = document.createElement("span");
        childSummary.className = "selection-environment__summary";
        const childIcon = document.createElement("span");
        childIcon.className = "selection-icon selection-icon--environment";
        childIcon.setAttribute("aria-hidden", "true");
        const childTitle = document.createElement("span");
        childTitle.className = "selection-environment__title";
        childTitle.textContent = environment.name || t("environmentFallback");
        const childMeta = document.createElement("span");
        childMeta.className = "selection-environment__meta";
        childMeta.textContent = environment.rules?.[0]?.value || t("noUrlRules");
        childSummary.append(childTitle, childMeta);
        child.append(childCheckbox, childIcon, childSummary);

        childRow.append(branch, child);
        children.append(childRow);
      });

      groupCard.append(children);
    }

    container.append(groupCard);
  });
}

function buildSelectedSettings(sourceSettings, selectionState) {
  const groups = groupedEnvironments(sourceSettings);
  const nextGroups = [];
  const nextEnvironments = [];

  groups.forEach((group) => {
    const selectedEnvironments = group.environments.filter((environment) => selectionState.environments[environment.id] !== false);
    const includeGroup = group.environments.length
      ? selectedEnvironments.length > 0
      : selectionState.groups[group.id] !== false;
    if (!includeGroup) return;
    nextGroups.push({ id: group.id, name: group.name });
    nextEnvironments.push(...selectedEnvironments.map((environment) => clone(environment)));
  });

  return {
    groups: nextGroups,
    environments: nextEnvironments
  };
}

function uniqueGroupNameForImport(baseName, groups) {
  if (!groups.some((group) => group.name === baseName)) return baseName;
  let suffix = 2;
  while (groups.some((group) => group.name === `${baseName} ${suffix}`)) {
    suffix += 1;
  }
  return `${baseName} ${suffix}`;
}

function mergeImportedSettings(currentSettings, importedSubset) {
  const next = clone(currentSettings);
  const groupIdMap = new Map();
  const existingEnvironmentIds = new Set((next.environments || []).map((environment) => environment.id).filter(Boolean));

  (importedSubset.groups || []).forEach((group) => {
    if (group.id === DEFAULT_GROUP_ID) {
      groupIdMap.set(group.id, DEFAULT_GROUP_ID);
      return;
    }
    const sameId = next.groups.find((item) => item.id === group.id);
    if (sameId) {
      groupIdMap.set(group.id, sameId.id);
      return;
    }
    const sameName = next.groups.find((item) => item.name === group.name);
    if (sameName) {
      groupIdMap.set(group.id, sameName.id);
      return;
    }
    const nextGroup = {
      id: group.id || uid("group"),
      name: uniqueGroupNameForImport(group.name || t("defaultGroup"), next.groups)
    };
    next.groups.push(nextGroup);
    groupIdMap.set(group.id, nextGroup.id);
  });

  (importedSubset.environments || []).forEach((environment) => {
    if (environment.id && existingEnvironmentIds.has(environment.id)) return;
    const nextEnvironment = clone(environment);
    nextEnvironment.id = environment.id || uid("env");
    nextEnvironment.groupId = groupIdMap.get(environment.groupId) || DEFAULT_GROUP_ID;
    next.environments.push(nextEnvironment);
    if (nextEnvironment.id) existingEnvironmentIds.add(nextEnvironment.id);
  });

  return next;
}

function setStatus(message, isError = false) {
  if (!nodes.status) return;
  nodes.status.textContent = message;
  nodes.status.style.color = isError ? "#dc2626" : "#64748b";
}

async function handleLocaleChange(nextLocale) {
  if (!window.envmateI18n?.setLocaleChoice) return;
  await window.envmateI18n.setLocaleChoice(nextLocale);
  syncLocaleSwitcher();
  render();
  if (activeModalName === "export" && exportSelectionState) {
    syncExportModalState();
  }
  if (activeModalName === "import") {
    if (importPreviewSettings && importSelectionState) {
      syncImportModalState();
    } else {
      resetImportPreview();
    }
  }
  syncAboutModalState();
  setStatus(hasUnsavedChanges ? t("unsavedChanges") : t("ready"));
}

function syncSaveButtonState() {
  if (!nodes.save) return;
  nodes.save.classList.toggle("is-dirty", hasUnsavedChanges);
  applyButtonIcon(nodes.save, "save", hasUnsavedChanges ? t("savePending") : t("save"));
}

function restoreSavedSettingsSnapshot() {
  settings = clone(savedSettingsSnapshot);
  hasUnsavedChanges = false;
  syncSaveButtonState();
}

async function persistSettingsSnapshot() {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
  savedSettingsSnapshot = clone(settings);
  hasUnsavedChanges = false;
  syncSaveButtonState();
}

function setModalOpen(name, open) {
  const modalMap = {
    export: nodes.exportModal,
    import: nodes.importModal,
    about: nodes.aboutModal
  };
  const modal = modalMap[name];
  if (!modal || !nodes.modalBackdrop) return;
  modal.hidden = !open;
  nodes.modalBackdrop.hidden = !open;
  document.documentElement.classList.toggle("modal-open", open);
  document.body.classList.toggle("modal-open", open);
  activeModalName = open ? name : "";
}

function syncAboutModalState() {
  if (!nodes.aboutWechatSection) return;
  nodes.aboutWechatSection.hidden = !isChineseUi();
}

function openAboutModal() {
  syncAboutModalState();
  setModalOpen("about", true);
}

function closeAboutModal() {
  setModalOpen("about", false);
}

function syncExportModalState() {
  const groups = groupedEnvironments(settings);
  renderSelectionTree(nodes.exportSelectionList, groups, exportSelectionState, {
    onChange: syncExportModalState
  });
  const selectedCount = selectedEnvironmentTotal(groups, exportSelectionState);
  nodes.exportModalConfirm.disabled = selectedCount === 0;
  nodes.exportModalConfirm.textContent = t("exportSelectedCount", [String(selectedCount)]);
}

function openExportModal() {
  exportSelectionState = createSelectionState(groupedEnvironments(settings));
  syncExportModalState();
  setModalOpen("export", true);
}

function closeExportModal() {
  setModalOpen("export", false);
}

function resetImportPreview() {
  importPreviewSettings = null;
  importSelectionState = null;
  nodes.importSelectionList.classList.add("selection-tree--empty");
  nodes.importSelectionList.innerHTML = `<div class="empty">${t("importNoFile")}</div>`;
  nodes.importDropzoneDetail.textContent = t("importDropzoneHint");
  nodes.importModalConfirm.disabled = true;
  nodes.importModalConfirm.textContent = t("importSelectedCount", ["0"]);
}

function syncImportModalState() {
  if (!importPreviewSettings || !importSelectionState) {
    resetImportPreview();
    return;
  }
  const groups = groupedEnvironments(importPreviewSettings);
  renderSelectionTree(nodes.importSelectionList, groups, importSelectionState, {
    onChange: syncImportModalState
  });
  nodes.importSelectionList.classList.remove("selection-tree--empty");
  const selectedCount = selectedEnvironmentTotal(groups, importSelectionState);
  nodes.importModalConfirm.disabled = selectedCount === 0;
  nodes.importModalConfirm.textContent = t("importSelectedCount", [String(selectedCount)]);
}

function openImportModal() {
  nodes.importConfig.value = "";
  resetImportPreview();
  setModalOpen("import", true);
}

function closeImportModal() {
  setModalOpen("import", false);
}

async function readImportFile(file) {
  if (!file) return;
  try {
    const parsed = decodeImportedSettings(JSON.parse(await file.text()));
    importPreviewSettings = normalizeSettings(parsed);
    importSelectionState = createSelectionState(groupedEnvironments(importPreviewSettings));
    nodes.importDropzoneDetail.textContent = file.name;
    syncImportModalState();
  } catch (error) {
    resetImportPreview();
    setStatus(error.message, true);
  }
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
  applyInlineStatusIcon(nodes.enabledLabel, "power", nodes.enabled.checked ? t("environmentEnabledOn") : t("environmentEnabledOff"));
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

function clearEnvironmentDropIndicators() {
  if (!nodes.list) return;
  nodes.list.querySelectorAll(".environment-group").forEach((group) => {
    group.classList.remove("is-drop-target");
  });
  nodes.list.querySelectorAll(".environment-item").forEach((item) => {
    item.classList.remove("is-drag-source");
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

function moveEnvironmentToGroup(environmentId, groupId) {
  const environment = settings.environments.find((item) => item.id === environmentId);
  if (!environment || environment.groupId === groupId) return false;
  environment.groupId = ensureGroupId(groupId, settings.groups);
  return true;
}

function findEnvironmentByPrefixRule(prefixValue) {
  if (!prefixValue) return null;
  return settings.environments.find((environment) =>
    (environment.rules || []).some((rule) => rule.type === "prefix" && rule.value === prefixValue)
  ) || null;
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

function buildLocalizedSampleGroup() {
  const groupId = SAMPLE_GROUP_ID;
  const groupName = t("sampleGroupName");
  const prodName = t("sampleEnvironmentProd");
  const devName = t("sampleEnvironmentDev");

  return {
    group: { id: groupId, name: groupName },
    environments: [
      {
        id: uid("env"),
        groupId,
        name: prodName,
        enabled: true,
        badge: "PROD",
        badgeEnabled: true,
        badgeColor: "#dc2626",
        badgeTextColor: "#ffffff",
        badgeStyle: "slanted",
        badgePosition: "top-right",
        badgeScale: 1,
        badgeSize: 14,
        badgeOffset: 12,
        badgeOpacity: 1,
        watermarkText: prodName,
        watermarkEnabled: true,
        watermarkColor: "#dc2626",
        watermarkOpacity: 0.08,
        watermarkAngle: -24,
        watermarkSize: 42,
        watermarkGap: 80,
        titlePrefix: true,
        markerMode: "badge-watermark",
        rules: [{ type: "wildcard", value: "https://prod.example.com/*" }],
        accounts: []
      },
      {
        id: uid("env"),
        groupId,
        name: devName,
        enabled: true,
        badge: "DEV",
        badgeEnabled: true,
        badgeColor: "#2563eb",
        badgeTextColor: "#ffffff",
        badgeStyle: "slanted",
        badgePosition: "top-right",
        badgeScale: 1,
        badgeSize: 14,
        badgeOffset: 12,
        badgeOpacity: 1,
        watermarkText: devName,
        watermarkEnabled: false,
        watermarkColor: "#2563eb",
        watermarkOpacity: 0.08,
        watermarkAngle: -24,
        watermarkSize: 42,
        watermarkGap: 80,
        titlePrefix: true,
        markerMode: "badge",
        rules: [{ type: "wildcard", value: "https://dev.example.com/*" }],
        accounts: []
      }
    ]
  };
}

function findSampleGroup() {
  const group = settings.groups.find((item) => item.id === SAMPLE_GROUP_ID);
  if (!group) return null;
  const environments = settings.environments.filter((environment) => environment.groupId === SAMPLE_GROUP_ID);
  return { group, environments };
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

function createLucideIcon(name, className = "group-icon") {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(namespace, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add(className);

  (LUCIDE_ICON_NODES[name] || []).forEach(([tagName, attrs]) => {
    const node = document.createElementNS(namespace, tagName);
    Object.entries(LUCIDE_ICON_ATTRS).forEach(([key, value]) => node.setAttribute(key, value));
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    svg.append(node);
  });

  return svg;
}

function createGroupIconButton(iconName, className, title, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.title = title;
  button.append(createLucideIcon(iconName));
  button.addEventListener("click", onClick);
  return button;
}

function applyButtonIcon(button, iconName, label) {
  if (!button) return;
  button.textContent = "";
  button.classList.add("button-with-icon");
  button.append(createLucideIcon(iconName, "button-icon"));

  const text = document.createElement("span");
  text.className = "button-label";
  text.textContent = label;
  button.append(text);
}

function applyIconOnlyButton(button, iconName) {
  if (!button) return;
  button.textContent = "";
  button.append(createLucideIcon(iconName));
}

function applyInlineStatusIcon(container, iconName, label) {
  if (!container) return;
  container.textContent = "";
  container.classList.add("inline-status");
  container.append(createLucideIcon(iconName, "inline-status__icon"));
  const text = document.createElement("span");
  text.className = "inline-status__label";
  text.textContent = label;
  container.append(text);
}

function decorateStaticButtons() {
  applyButtonIcon(nodes.loadSample, "flaskConical", t("loadSample"));
  applyButtonIcon(nodes.exportConfig, "download", t("export"));
  applyButtonIcon(nodes.importConfigTrigger, "upload", t("import"));
  applyButtonIcon(nodes.aboutTrigger, "badgeHelp", t("about"));
  applyButtonIcon(nodes.addGroup, "plus", t("addGroup"));
  applyButtonIcon(nodes.addRule, "plus", t("addRule"));
  applyButtonIcon(nodes.addAccount, "plus", t("addAccount"));
  applyButtonIcon(nodes.save, "save", t("save"));
  applyButtonIcon(nodes.deleteEnvironment, "trash", t("deleteEnvironment"));
  applyIconOnlyButton(nodes.exportModalClose, "x");
  applyIconOnlyButton(nodes.importModalClose, "x");
  applyIconOnlyButton(nodes.aboutModalClose, "x");
}

function markChanged() {
  if (!isRendering) {
    hasUnsavedChanges = true;
    syncSaveButtonState();
    setStatus(t("unsavedChanges"));
  }
}

function buildQuickEnvironment(title, prefixValue) {
  const color = pickEnvironmentColor();
  const name = String(title || "").trim() || t("newEnvironment");
  return {
    id: uid("env"),
    groupId: DEFAULT_GROUP_ID,
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
    rules: [{ type: "prefix", value: prefixValue }],
    accounts: []
  };
}

function selectEnvironmentFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const environmentId = String(params.get("environmentId") || "").trim();
  if (!environmentId) return false;
  const environment = settings.environments.find((item) => item.id === environmentId);
  if (!environment) return false;
  selectedGroupId = environment.groupId || DEFAULT_GROUP_ID;
  selectedId = environment.id;
  return true;
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
    wrap.dataset.groupId = group.id;

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

    const rename = createGroupIconButton("edit", "group-icon-button group-icon-button--edit", t("renameGroup"), (event) => {
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
    addEnvironmentButton.className = "group-action button-with-icon";
    addEnvironmentButton.append(createLucideIcon("plus", "button-icon"));
    const addEnvironmentLabel = document.createElement("span");
    addEnvironmentLabel.className = "button-label";
    addEnvironmentLabel.textContent = t("addEnvironment");
    addEnvironmentButton.append(addEnvironmentLabel);
    addEnvironmentButton.addEventListener("click", (event) => {
      event.stopPropagation();
      addEnvironment(group.id);
    });
    actions.append(addEnvironmentButton);

    const duplicate = document.createElement("button");
    duplicate.type = "button";
    duplicate.className = "group-action button-with-icon";
    duplicate.append(createLucideIcon("copy", "button-icon"));
    const duplicateLabel = document.createElement("span");
    duplicateLabel.className = "button-label";
    duplicateLabel.textContent = t("duplicate");
    duplicate.append(duplicateLabel);
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

    const acceptEnvironmentDrop = async (event) => {
      if (!draggingEnvironmentId) return;
      event.preventDefault();
      event.stopPropagation();
      const movedEnvironmentId = draggingEnvironmentId;
      const didMove = moveEnvironmentToGroup(movedEnvironmentId, group.id);
      draggingEnvironmentId = "";
      clearEnvironmentDropIndicators();
      if (!didMove) return;
      selectedGroupId = group.id;
      selectedId = movedEnvironmentId;
      await persistSettingsSnapshot();
      render();
      setStatus(t("saved"));
    };

    wrap.addEventListener("dragover", (event) => {
      if (!draggingEnvironmentId) return;
      const draggedEnvironment = settings.environments.find((environment) => environment.id === draggingEnvironmentId);
      if (!draggedEnvironment || draggedEnvironment.groupId === group.id) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      clearEnvironmentDropIndicators();
      wrap.classList.add("is-drop-target");
    });

    wrap.addEventListener("dragleave", (event) => {
      if (!draggingEnvironmentId) return;
      if (wrap.contains(event.relatedTarget)) return;
      wrap.classList.remove("is-drop-target");
    });

    wrap.addEventListener("drop", acceptEnvironmentDrop);
    stack.addEventListener("drop", acceptEnvironmentDrop);

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
        button.draggable = true;
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
        button.addEventListener("dragstart", (event) => {
          draggingEnvironmentId = environment.id;
          clearEnvironmentDropIndicators();
          button.classList.add("is-drag-source");
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", environment.id);
          }
        });
        button.addEventListener("dragend", () => {
          draggingEnvironmentId = "";
          clearEnvironmentDropIndicators();
        });
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
  remove.title = t("removeRule");
  remove.append(createLucideIcon("x", "remove-button__icon"));

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
  remove.title = t("removeAccount");
  remove.append(createLucideIcon("x", "remove-button__icon"));

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

function buildPreviewCanvas(environment, label, previewType) {
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
  if (previewType === "badge") {
    meta.textContent = environment.badgeEnabled !== false ? t("badgeConfig") : "";
  } else if (previewType === "watermark") {
    meta.textContent = environment.watermarkEnabled === true ? t("watermarkConfig") : "";
  } else {
    meta.textContent = "";
  }
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
  const badgeCanvas = buildPreviewCanvas(environment, label, "badge");
  if (environment.badgeEnabled !== false) {
    renderPreviewBadge(badgeCanvas, label, environment);
  }
  nodes.badgePreviewSurface.append(badgeCanvas);

  const watermarkCanvas = buildPreviewCanvas(environment, label, "watermark");
  if (environment.watermarkEnabled === true) {
    renderPreviewWatermark(watermarkCanvas, watermarkText, environment);
  }
  nodes.watermarkPreviewSurface.append(watermarkCanvas);
}

function renderForm() {
  const environment = selectedEnvironment();
  const hasEnvironment = Boolean(environment);
  nodes.form.hidden = !hasEnvironment;
  if (nodes.toolbox) {
    nodes.toolbox.hidden = !hasEnvironment;
  }
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
  decorateStaticButtons();
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
  await persistSettingsSnapshot();
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

async function deleteGroup(groupId) {
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
  await persistSettingsSnapshot();
  render();
  setStatus(t("saved"));
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

async function deleteEnvironment() {
  const environment = selectedEnvironment();
  if (!environment) return;
  const name = typeof environment.name === "string" && environment.name.trim() ? environment.name.trim() : t("environmentFallback");
  if (!window.confirm(t("confirmDeleteEnvironment", [name]))) return;
  const currentGroupId = environment.groupId;
  settings.environments = settings.environments.filter((item) => item.id !== environment.id);
  selectedGroupId = currentGroupId;
  selectedId = settings.environments.find((item) => item.groupId === currentGroupId)?.id || null;
  await persistSettingsSnapshot();
  render();
  setStatus(t("saved"));
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
  await persistSettingsSnapshot();
  clearAccountsValidationError();
  render();
  setStatus(t("saved"));
}

function exportSettings() {
  const exportSettingsSubset = buildSelectedSettings(settings, exportSelectionState);
  const blob = new Blob([JSON.stringify(buildExportSettings(exportSettingsSubset), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "envmate-config.json";
  link.click();
  URL.revokeObjectURL(url);
  closeExportModal();
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

async function handleQuickAddFromQuery() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("quickAdd") !== "1") return;

  const title = String(params.get("title") || "").trim();
  const prefixValue = String(params.get("prefix") || "").trim();
  if (!prefixValue) {
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  const existingEnvironment = findEnvironmentByPrefixRule(prefixValue);
  if (existingEnvironment) {
    selectedGroupId = existingEnvironment.groupId || DEFAULT_GROUP_ID;
    selectedId = existingEnvironment.id;
    render();
    setStatus(t("quickAddEnvironmentExists"));
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  const environment = buildQuickEnvironment(title, prefixValue);
  settings.environments.push(environment);
  selectedGroupId = DEFAULT_GROUP_ID;
  selectedId = environment.id;
  await persistSettingsSnapshot();
  render();
  setStatus(t("quickAddEnvironmentCreated"));
  window.history.replaceState({}, document.title, window.location.pathname);
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
window.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (activeModalName === "export") closeExportModal();
  if (activeModalName === "import") closeImportModal();
  if (activeModalName === "about") closeAboutModal();
});

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
bindNodeEvent(nodes.localeSwitcher, "change", async () => {
  await handleLocaleChange(nodes.localeSwitcher.value);
});
bindNodeEvent(nodes.exportConfig, "click", openExportModal);
bindNodeEvent(nodes.aboutTrigger, "click", openAboutModal);
bindNodeEvent(nodes.exportModalClose, "click", closeExportModal);
bindNodeEvent(nodes.exportModalCancel, "click", closeExportModal);
bindNodeEvent(nodes.exportModalConfirm, "click", exportSettings);

bindNodeEvent(nodes.importConfigTrigger, "click", openImportModal);
bindNodeEvent(nodes.importModalClose, "click", closeImportModal);
bindNodeEvent(nodes.importModalCancel, "click", closeImportModal);
bindNodeEvent(nodes.importDropzone, "click", () => nodes.importConfig.click());
bindNodeEvent(nodes.importConfig, "change", async () => {
  const file = nodes.importConfig.files?.[0];
  if (!file) return;
  await readImportFile(file);
  nodes.importConfig.value = "";
});
bindNodeEvent(nodes.importDropzone, "dragover", (event) => {
  event.preventDefault();
  nodes.importDropzone.classList.add("is-dragover");
});
bindNodeEvent(nodes.importDropzone, "dragleave", () => {
  nodes.importDropzone.classList.remove("is-dragover");
});
bindNodeEvent(nodes.importDropzone, "drop", async (event) => {
  event.preventDefault();
  nodes.importDropzone.classList.remove("is-dragover");
  const file = event.dataTransfer?.files?.[0];
  await readImportFile(file);
});
bindNodeEvent(nodes.importModalConfirm, "click", async () => {
  if (!importPreviewSettings || !importSelectionState) return;
  const selectedImportSettings = buildSelectedSettings(importPreviewSettings, importSelectionState);
  const merged = mergeImportedSettings(settings, selectedImportSettings);
  clearAccountsValidationError();
  settings = normalizeSettings(merged);
  selectedGroupId = settings.groups[0]?.id || DEFAULT_GROUP_ID;
  selectedId = settings.environments.find((environment) => environment.groupId === selectedGroupId)?.id || settings.environments[0]?.id || null;
  await persistSettingsSnapshot();
  render();
  setStatus(t("importedApplied"));
  closeImportModal();
});
bindNodeEvent(nodes.aboutModalClose, "click", closeAboutModal);
bindNodeEvent(nodes.aboutModalConfirm, "click", closeAboutModal);
bindNodeEvent(nodes.modalBackdrop, "click", () => {
  if (activeModalName === "export") closeExportModal();
  if (activeModalName === "import") closeImportModal();
  if (activeModalName === "about") closeAboutModal();
});

bindNodeEvent(nodes.loadSample, "click", async () => {
  let sampleGroup = findSampleGroup();
  if (!sampleGroup) {
    const createdSampleGroup = buildLocalizedSampleGroup();
    settings.groups.push(createdSampleGroup.group);
    settings.environments.push(...createdSampleGroup.environments);
    await chrome.storage.local.set({ [STORAGE_KEY]: settings });
    savedSettingsSnapshot = clone(settings);
    sampleGroup = createdSampleGroup;
    setStatus(t("sampleLoaded"));
  } else {
    setStatus(t("sampleAlreadyLoaded"));
  }

  selectedGroupId = sampleGroup.group.id;
  selectedId = sampleGroup.environments[0]?.id || null;
  clearAccountsValidationError();
  hasUnsavedChanges = false;
  syncSaveButtonState();
  render();
});

async function loadSettings() {
  if (window.envmateI18n?.setLocaleChoice && window.envmateI18n?.getLocaleChoice) {
    await window.envmateI18n.setLocaleChoice(window.envmateI18n.getLocaleChoice(), { persist: false });
  }
  syncLocaleSwitcher();
  syncAboutModalState();
  const result = await chrome.storage.local.get([STORAGE_KEY]);
  applySettings(result[STORAGE_KEY] || createSampleSettings(), t("ready"));
  selectEnvironmentFromQuery();
  render();
  await handleQuickAddFromQuery();
}

loadSettings();
