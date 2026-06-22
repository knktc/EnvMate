(function () {
  const LOCALE_STORAGE_KEY = "envmateUiLocale";
  const localeCache = new Map();
  let localeChoice = safeReadLocaleChoice();
  let localeMessages = null;

  function safeReadLocaleChoice() {
    try {
      return window.localStorage.getItem(LOCALE_STORAGE_KEY) || "auto";
    } catch (_) {
      return "auto";
    }
  }

  function persistLocaleChoice(value) {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, value);
    } catch (_) {
      // ignore storage failures in extension pages
    }
  }

  function normalizeSubstitutions(substitutions) {
    if (Array.isArray(substitutions)) return substitutions;
    if (typeof substitutions === "undefined") return [];
    return [substitutions];
  }

  function formatMessage(template, substitutions) {
    const values = normalizeSubstitutions(substitutions);
    return String(template || "").replace(/\$([A-Z0-9_]+)\$/g, (match, name) => {
      if (/^\d+$/.test(name)) {
        const index = Number(name) - 1;
        return typeof values[index] === "undefined" ? "" : String(values[index]);
      }
      return match;
    });
  }

  function formatLocaleMessage(entry, substitutions) {
    if (!entry || typeof entry.message !== "string") return "";
    let message = entry.message;
    const values = normalizeSubstitutions(substitutions);
    const placeholderNames = Object.entries(entry.placeholders || {});
    placeholderNames.forEach(([name, placeholder], index) => {
      const content = placeholder?.content || `$${index + 1}`;
      const positionMatch = String(content).match(/\$(\d+)/);
      const valueIndex = positionMatch ? Number(positionMatch[1]) - 1 : index;
      const value = typeof values[valueIndex] === "undefined" ? "" : String(values[valueIndex]);
      message = message.replaceAll(`$${name.toUpperCase()}$`, value);
    });
    return formatMessage(message, substitutions);
  }

  async function loadLocaleMessages(locale) {
    if (localeCache.has(locale)) return localeCache.get(locale);
    const response = await fetch(chrome.runtime.getURL(`_locales/${locale}/messages.json`));
    if (!response.ok) throw new Error(`Failed to load locale: ${locale}`);
    const messages = await response.json();
    localeCache.set(locale, messages);
    return messages;
  }

  function t(key, substitutions) {
    if (localeMessages && localeMessages[key]) {
      return formatLocaleMessage(localeMessages[key], substitutions) || key;
    }
    const message = chrome.i18n.getMessage(key, substitutions);
    return message || key;
  }

  function localizeDocument(root = document) {
    document.documentElement.lang = localeChoice === "auto" ? chrome.i18n.getUILanguage() : localeChoice;

    root.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });

    root.querySelectorAll("[data-i18n-title]").forEach((node) => {
      if (node === document.documentElement) return;
      node.title = t(node.dataset.i18nTitle);
    });

    root.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      node.placeholder = t(node.dataset.i18nPlaceholder);
    });

    if (document.title) {
      const titleKey = document.documentElement.dataset.i18nTitle;
      if (titleKey) document.title = t(titleKey);
    }
  }

  async function setLocaleChoice(nextLocale, options = {}) {
    localeChoice = nextLocale || "auto";
    localeMessages = localeChoice === "auto" ? null : await loadLocaleMessages(localeChoice);
    if (options.persist !== false) persistLocaleChoice(localeChoice);
    localizeDocument();
    return localeChoice;
  }

  function getLocaleChoice() {
    return localeChoice;
  }

  const ready = new Promise((resolve) => {
    const initializeLocale = async () => {
      try {
        await setLocaleChoice(localeChoice, { persist: false });
      } catch (_) {
        localeChoice = "auto";
        localeMessages = null;
        localizeDocument();
      } finally {
        resolve();
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeLocale, { once: true });
    } else {
      initializeLocale();
    }
  });

  window.envmateI18n = { t, localizeDocument, setLocaleChoice, getLocaleChoice, ready };
})();
