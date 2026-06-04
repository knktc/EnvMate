(function () {
  function t(key, substitutions) {
    const message = chrome.i18n.getMessage(key, substitutions);
    return message || key;
  }

  function localizeDocument(root = document) {
    document.documentElement.lang = chrome.i18n.getUILanguage();

    root.querySelectorAll("[data-i18n]").forEach((node) => {
      node.textContent = t(node.dataset.i18n);
    });

    root.querySelectorAll("[data-i18n-title]").forEach((node) => {
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

  window.envmateI18n = { t, localizeDocument };
  document.addEventListener("DOMContentLoaded", () => localizeDocument());
})();
