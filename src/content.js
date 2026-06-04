(function () {
  const STORAGE_KEY = "envmateSettings";
  let activeEnvironment = null;
  let activeSettings = null;
  let originalTitle = document.title;
  let titleApplied = false;
  let lastUrl = window.location.href;
  let autoFillKey = "";
  let autoFillTimer = null;
  let autoFillObserver = null;

  function t(key, substitutions) {
    const message = chrome.i18n.getMessage(key, substitutions);
    return message || key;
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

  function findEnvironment(settings, url) {
    return (settings.environments || []).find((environment) => {
      if (environment.enabled === false) return false;
      return (environment.rules || []).some((rule) => matchesRule(url, rule));
    });
  }

  function removeMarkers() {
    document.querySelectorAll("[data-envmate-root]").forEach((node) => node.remove());
    if (titleApplied) {
      document.title = originalTitle;
      titleApplied = false;
    }
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

  function accountDisplayLabel(account) {
    const username = String(account?.username || "").trim();
    const label = String(account?.label || "").trim();
    if (username && label) return `${username} (${label})`;
    return username || label || t("accountFallback");
  }

  function applyTitle(environment) {
    if (!environment.titlePrefix) return;
    const badge = markerLabel(environment);
    if (!titleApplied) originalTitle = document.title;
    document.title = `[${badge}] ${originalTitle}`;
    titleApplied = true;
  }

  function shouldShowWatermark(environment) {
    if (typeof environment.watermarkEnabled === "boolean") return environment.watermarkEnabled;
    return environment.markerMode === "watermark" || environment.markerMode === "badge-watermark";
  }

  function shouldShowBadge(environment) {
    if (typeof environment.badgeEnabled === "boolean") return environment.badgeEnabled;
    return environment.markerMode !== "watermark";
  }

  function clearAutoFill() {
    if (autoFillTimer) {
      window.clearInterval(autoFillTimer);
      autoFillTimer = null;
    }
    if (autoFillObserver) {
      autoFillObserver.disconnect();
      autoFillObserver = null;
    }
  }

  function enableBadgePeekThrough(badge) {
    let restoreListener = null;
    let restoreTimer = null;
    let peekPending = false;
    let peekActive = false;

    function isInsideBadge(clientX, clientY) {
      const rect = badge.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    }

    function cleanup() {
      peekPending = false;
      peekActive = false;
      if (restoreTimer) {
        window.clearTimeout(restoreTimer);
        restoreTimer = null;
      }
      if (restoreListener) {
        window.removeEventListener("mousemove", restoreListener, true);
        restoreListener = null;
      }
      badge.classList.remove("envmate-badge--peek");
      badge.style.pointerEvents = "";
    }

    badge.addEventListener("mouseenter", () => {
      if (peekPending || peekActive) return;
      cleanup();
      badge.classList.add("envmate-badge--peek");
      peekPending = true;
      restoreTimer = window.setTimeout(() => {
        peekPending = false;
        peekActive = true;
        badge.style.pointerEvents = "none";
        restoreListener = (event) => {
          const { clientX, clientY } = event;
          if (!isInsideBadge(clientX, clientY)) cleanup();
        };
        window.addEventListener("mousemove", restoreListener, true);
      }, 120);
    });

    badge.addEventListener("mouseleave", () => {
      if (peekActive) return;
      cleanup();
    });
  }

  function createBadge(environment, settings) {
    const badge = document.createElement("div");
    badge.className = "envmate-badge";
    badge.dataset.envmateRoot = "badge";
    badge.dataset.position = environment.badgePosition || "top-right";
    badge.dataset.style = environment.badgeStyle || "slanted";
    badge.style.setProperty("--envmate-color", environment.badgeColor || environment.color || "#2563eb");
    badge.style.setProperty("--envmate-text-color", environment.badgeTextColor || environment.textColor || "#ffffff");
    badge.style.setProperty("--envmate-badge-offset", "12px");
    badge.style.setProperty("--envmate-badge-opacity", environment.badgeOpacity ?? 1);
    badge.style.setProperty("--envmate-badge-scale", environment.badgeScale ?? 1);
    badge.style.setProperty("--envmate-badge-size", `${environment.badgeSize ?? 14}px`);
    badge.title = t("markerTitle");

    const name = document.createElement("span");
    name.className = "envmate-badge__name";
    name.textContent = markerLabel(environment);
    badge.append(name);

    enableBadgePeekThrough(badge);
    document.documentElement.append(badge);
  }

  function createWatermark(environment) {
    const label = watermarkLabel(environment);
    const wrap = document.createElement("div");
    wrap.className = "envmate-watermark";
    wrap.dataset.envmateRoot = "watermark";
    wrap.style.setProperty("--envmate-watermark-color", environment.watermarkColor || environment.color || "#2563eb");
    wrap.style.setProperty("--envmate-watermark-opacity", environment.watermarkOpacity ?? 0.08);
    wrap.style.setProperty("--envmate-watermark-angle", `${environment.watermarkAngle ?? -24}deg`);
    wrap.style.setProperty("--envmate-watermark-size", `${environment.watermarkSize ?? 42}px`);
    wrap.style.setProperty("--envmate-watermark-gap", `${environment.watermarkGap ?? 80}px`);

    const grid = document.createElement("div");
    grid.className = "envmate-watermark__grid";
    for (let index = 0; index < 36; index += 1) {
      const item = document.createElement("div");
      item.className = "envmate-watermark__item";
      item.textContent = label;
      grid.append(item);
    }

    wrap.append(grid);
    document.documentElement.append(wrap);
  }

  function applyMarkers(settings) {
    activeSettings = settings;
    removeMarkers();
    clearAutoFill();

    const environment = findEnvironment(settings, window.location.href);
    activeEnvironment = environment || null;
    if (!environment) {
      autoFillKey = "";
      return;
    }

    applyTitle(environment);
    if (shouldShowWatermark(environment)) createWatermark(environment);
    if (shouldShowBadge(environment)) createBadge(environment, settings);
    scheduleDefaultFill(environment);
  }

  function refreshForCurrentUrl() {
    if (!activeSettings) return;
    if (lastUrl === window.location.href) return;
    lastUrl = window.location.href;
    applyMarkers(activeSettings);
  }

  function wrapHistoryMethod(methodName) {
    const original = window.history[methodName];
    window.history[methodName] = function (...args) {
      const result = original.apply(this, args);
      setTimeout(refreshForCurrentUrl, 0);
      return result;
    };
  }

  function findInput(candidates) {
    for (const selector of candidates) {
      const input = document.querySelector(selector);
      if (input && !input.disabled && !input.readOnly) return input;
    }
    return null;
  }

  function visibleInputs() {
    return Array.from(document.querySelectorAll("input, textarea")).filter((input) => {
      if (input.disabled || input.readOnly) return false;
      const rect = input.getBoundingClientRect();
      const style = window.getComputedStyle(input);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    });
  }

  function inferInputs() {
    const inputs = visibleInputs();
    const passwordInputs = inputs.filter((input) => input.matches('input[type="password"]'));
    const usernameInputs = inputs.filter((input) => {
      const type = (input.getAttribute("type") || "text").toLowerCase();
      return !["password", "hidden", "checkbox", "radio", "submit", "button", "reset", "file", "image"].includes(type);
    });

    return {
      usernameInput: usernameInputs[0] || null,
      passwordInput: passwordInputs[0] || null,
      usernameCandidates: usernameInputs.length,
      passwordCandidates: passwordInputs.length
    };
  }

  function setInputValue(input, value) {
    const prototype = input instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) {
      setter.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function showToast(account) {
    document.querySelectorAll('[data-envmate-root="toast"]').forEach((node) => node.remove());
    const toast = document.createElement("div");
    toast.className = "envmate-toast";
    toast.dataset.envmateRoot = "toast";
    toast.style.setProperty("--envmate-color", activeEnvironment?.badgeColor || activeEnvironment?.color || "#2563eb");

    const title = document.createElement("div");
    title.className = "envmate-toast__title";
    title.textContent = t("defaultFill");

    const detail = document.createElement("div");
    detail.className = "envmate-toast__detail";
    detail.textContent = accountDisplayLabel(account);

    toast.append(title, detail);
    document.documentElement.append(toast);
    window.setTimeout(() => toast.remove(), 2200);
  }

  function fillAccount(account) {
    const inferred = inferInputs();
    const usernameInput = findInput([
      'input[name="username"]',
      'input[name="user"]',
      'input[name="account"]',
      'input[name="login"]',
      'input[name="loginName"]',
      'input[name="login_name"]',
      'input[name="email"]',
      'input[id*="username" i]',
      'input[id*="user" i]',
      'input[id*="account" i]',
      'input[id*="login" i]',
      'input[id*="email" i]',
      'input[class*="username" i]',
      'input[class*="account" i]',
      'input[class*="login" i]',
      'input[type="email"]',
      'input[autocomplete="username"]',
      'input[placeholder*="用户名"]',
      'input[placeholder*="账号"]',
      'input[placeholder*="账户"]',
      'input[placeholder*="登录名"]',
      'input[placeholder*="手机号"]',
      'input[placeholder*="手机"]',
      'input[placeholder*="工号"]',
      'input[placeholder*="邮箱"]',
      'input[placeholder*="User" i]',
      'input[placeholder*="Account" i]',
      'input[placeholder*="Login" i]',
      'input[type="text"]',
      'input[type="tel"]',
      "input:not([type])",
      "textarea"
    ]) || inferred.usernameInput;
    const passwordInput = findInput([
      'input[type="password"]',
      'input[name="password"]',
      'input[name="passwd"]',
      'input[name="pwd"]',
      'input[id*="password" i]',
      'input[id*="passwd" i]',
      'input[id*="pwd" i]',
      'input[autocomplete="current-password"]',
      'input[placeholder*="密码"]',
      'input[placeholder*="Password" i]'
    ]) || inferred.passwordInput;

    if (usernameInput && account.username) setInputValue(usernameInput, account.username);
    if (passwordInput && account.password) setInputValue(passwordInput, account.password);

    return {
      usernameFilled: Boolean(usernameInput && account.username),
      passwordFilled: Boolean(passwordInput && account.password),
      usernameCandidates: inferred.usernameCandidates,
      passwordCandidates: inferred.passwordCandidates
    };
  }

  function scheduleDefaultFill(environment) {
    const account = (environment.accounts || []).find((item) => item.defaultFill);
    if (!account) return;

    const nextKey = `${environment.id || environment.name}:${account.id || account.username}:${window.location.href}`;
    if (autoFillKey === nextKey) return;
    autoFillKey = nextKey;

    let attempts = 0;
    const tryFill = () => {
      attempts += 1;
      const result = fillAccount(account);
      if (result.usernameFilled || result.passwordFilled) {
        showToast(account);
        clearAutoFill();
        return true;
      }
      if (attempts >= 24) {
        clearAutoFill();
        return true;
      }
      return false;
    };

    if (tryFill()) return;

    autoFillTimer = window.setInterval(tryFill, 300);
    if (document.body) {
      autoFillObserver = new MutationObserver(() => {
        tryFill();
      });
      autoFillObserver.observe(document.body, { childList: true, subtree: true });
    }
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "ENVMATE_GET_PAGE_ENV") {
      sendResponse({ environment: activeEnvironment, url: window.location.href });
      return true;
    }
    if (message?.type === "ENVMATE_FILL_ACCOUNT") {
      sendResponse(fillAccount(message.account || {}));
      return true;
    }
    return false;
  });

  chrome.storage.local.get([STORAGE_KEY]).then((result) => {
    if (result[STORAGE_KEY]) applyMarkers(result[STORAGE_KEY]);
  });

  wrapHistoryMethod("pushState");
  wrapHistoryMethod("replaceState");
  window.addEventListener("popstate", () => setTimeout(refreshForCurrentUrl, 0));

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[STORAGE_KEY]) {
      applyMarkers(changes[STORAGE_KEY].newValue);
    }
  });
})();
