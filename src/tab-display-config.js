(function (global) {
  const DEFAULT_COLOR = "#2563eb";
  const DEFAULT_PRESET_TYPE = "solid-rounded-square";
  const PRESET_TYPES = Object.freeze([DEFAULT_PRESET_TYPE, "solid-circle"]);
  // Uploaded source files are limited by the options UI to 2 MiB. The stored,
  // normalized square PNG is kept below this smaller limit for portable exports.
  const MAX_RAW_UPLOAD_BYTES = 2 * 1024 * 1024;
  const MAX_NORMALIZED_PNG_BYTES = 256 * 1024;
  const SUPPORTED_UPLOAD_MIME = "image/png";
  const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;
  const DATA_URL_PATTERN = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/i;
  const EXTENDED_PICTOGRAPHIC_PATTERN = /\p{Extended_Pictographic}/u;
  const MARK_PATTERN = /\p{Mark}/u;

  function codePointIsRegionalIndicator(codePoint) {
    return codePoint >= 0x1f1e6 && codePoint <= 0x1f1ff;
  }

  function codePointIsEmojiModifier(codePoint) {
    return codePoint >= 0x1f3fb && codePoint <= 0x1f3ff;
  }

  function codePointIsVariationSelector(codePoint) {
    return (codePoint >= 0xfe00 && codePoint <= 0xfe0f) || (codePoint >= 0xe0100 && codePoint <= 0xe01ef);
  }

  function codePointIsTag(codePoint) {
    return codePoint >= 0xe0020 && codePoint <= 0xe007f;
  }

  function lastCodePoint(value) {
    let last = 0;
    for (const character of value) last = character.codePointAt(0);
    return last;
  }

  function fallbackGraphemeSegments(value) {
    const segments = [];
    let current = "";
    let regionalCount = 0;
    for (const character of value) {
      const codePoint = character.codePointAt(0);
      const previousCodePoint = lastCodePoint(current);
      const joinsCurrent = current && (
        codePoint === 0x200d ||
        previousCodePoint === 0x200d ||
        codePointIsVariationSelector(codePoint) ||
        codePointIsEmojiModifier(codePoint) ||
        codePoint === 0x20e3 ||
        codePointIsTag(codePoint) ||
        (regionalCount === 1 && codePointIsRegionalIndicator(codePoint)) ||
        MARK_PATTERN.test(character)
      );
      if (!current || !joinsCurrent) {
        if (current) segments.push(current);
        current = character;
        regionalCount = codePointIsRegionalIndicator(codePoint) ? 1 : 0;
        continue;
      }
      current += character;
      if (codePointIsRegionalIndicator(codePoint)) regionalCount += 1;
    }
    if (current) segments.push(current);
    return segments;
  }

  function graphemeSegments(value) {
    const segmenter = global.Intl?.Segmenter;
    if (typeof segmenter === "function") {
      return Array.from(new segmenter(undefined, { granularity: "grapheme" }).segment(value), ({ segment }) => segment);
    }
    return fallbackGraphemeSegments(value);
  }

  function isEmojiGrapheme(value) {
    const keycap = /^[0-9#*]\ufe0f?\u20e3$/u;
    if (keycap.test(value)) return true;

    let hasPictographic = false;
    let regionalCount = 0;
    let onlyRegionalIndicators = true;
    for (const character of value) {
      const codePoint = character.codePointAt(0);
      if (codePointIsRegionalIndicator(codePoint)) {
        regionalCount += 1;
        continue;
      }
      onlyRegionalIndicators = false;
      if (EXTENDED_PICTOGRAPHIC_PATTERN.test(character)) {
        hasPictographic = true;
        continue;
      }
      if (codePoint === 0x200d || codePointIsVariationSelector(codePoint) || codePointIsEmojiModifier(codePoint) || codePointIsTag(codePoint)) {
        continue;
      }
      return false;
    }
    return (onlyRegionalIndicators && regionalCount === 2) || hasPictographic;
  }

  function isSingleEmoji(value) {
    const next = String(value ?? "").trim();
    if (!next) return false;
    const segments = graphemeSegments(next);
    return segments.length === 1 && segments[0] === next && isEmojiGrapheme(next);
  }

  function hasOwn(value, key) {
    return Boolean(value && Object.prototype.hasOwnProperty.call(value, key));
  }

  function normalizeColor(value, fallback = DEFAULT_COLOR) {
    const next = String(value || "").trim();
    return HEX_COLOR_PATTERN.test(next) ? next.toUpperCase() : fallback;
  }

  function decodeBase64(value) {
    const source = String(value || "");
    if (!source || source.length % 4 === 1) return null;
    try {
      if (typeof global.atob === "function") {
        const binary = global.atob(source);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }
        return bytes;
      }
      if (typeof Buffer !== "undefined") {
        const buffer = Buffer.from(source, "base64");
        if (!buffer.length && source) return null;
        return Uint8Array.from(buffer);
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  function parseUploadDataUrl(value) {
    if (typeof value !== "string") return { valid: false, reason: "not-string" };
    const match = value.match(DATA_URL_PATTERN);
    if (!match || match[1].toLowerCase() !== SUPPORTED_UPLOAD_MIME) {
      return { valid: false, reason: "unsupported-data-url" };
    }
    const bytes = decodeBase64(match[2]);
    if (!bytes) return { valid: false, reason: "invalid-base64" };
    if (bytes.length === 0 || bytes.length > MAX_NORMALIZED_PNG_BYTES) {
      return { valid: false, reason: "size-limit", size: bytes.length };
    }
    return {
      valid: true,
      mime: SUPPORTED_UPLOAD_MIME,
      bytes,
      size: bytes.length,
      value: `data:${SUPPORTED_UPLOAD_MIME};base64,${match[2]}`
    };
  }

  function normalizeEmoji(value) {
    const next = String(value || "").trim();
    return isSingleEmoji(next) ? next : "🧪";
  }

  function isPresetType(value) {
    return PRESET_TYPES.includes(value);
  }

  function preferredFaviconSource(favicon) {
    const source = favicon && typeof favicon === "object" ? favicon.source : "";
    return favicon?.enabled === true && ["emoji", "preset", "upload"].includes(source) ? source : "emoji";
  }

  function selectSingleUploadFile(files) {
    const list = Array.from(files || []);
    if (list.length === 1) return { file: list[0], reason: "" };
    return { file: null, reason: list.length > 1 ? "multiple" : "empty" };
  }

  function isRawUploadSizeAllowed(size) {
    const value = Number(size);
    return Number.isFinite(value) && value >= 0 && value <= MAX_RAW_UPLOAD_BYTES;
  }

  function normalizeFavicon(rawValue) {
    const raw = rawValue && typeof rawValue === "object" ? rawValue : {};
    const source = ["emoji", "preset", "upload"].includes(raw.source) ? raw.source : "preset";
    const safeFallback = () => ({
      enabled: false,
      source: "preset",
      type: DEFAULT_PRESET_TYPE,
      value: DEFAULT_COLOR
    });

    if (source === "emoji") {
      const rawValue = String(raw.value || "").trim();
      const value = normalizeEmoji(rawValue);
      if (!isSingleEmoji(rawValue) || value !== rawValue) return safeFallback();
      return { enabled: raw.enabled === true, source, type: "native", value };
    }

    if (source === "upload") {
      const parsed = parseUploadDataUrl(raw.value);
      if (!parsed.valid) return safeFallback();
      return { enabled: raw.enabled === true, source, type: SUPPORTED_UPLOAD_MIME, value: parsed.value };
    }

    if (raw.source === "preset" && (!isPresetType(raw.type) || !HEX_COLOR_PATTERN.test(String(raw.value || "")))) {
      return safeFallback();
    }

    return {
      enabled: raw.enabled === true,
      source: "preset",
      type: isPresetType(raw.type) ? raw.type : DEFAULT_PRESET_TYPE,
      value: normalizeColor(raw.value)
    };
  }

  function shouldInitializePrefix(title) {
    return Boolean(title && String(title.prefix ?? "") === "");
  }

  function initializePrefix(title, value = "[]") {
    if (!shouldInitializePrefix(title)) return false;
    title.prefix = String(value);
    return true;
  }

  function schedulePrefixCaret(input, expectedValue, isCurrent, schedule) {
    const apply = () => {
      const activeElement = input?.ownerDocument?.activeElement || global.document?.activeElement;
      if (!input || activeElement !== input || String(input.value ?? "") !== String(expectedValue) || (typeof isCurrent === "function" && !isCurrent())) {
        return false;
      }
      if (typeof input.setSelectionRange !== "function") return false;
      try {
        input.setSelectionRange(1, 1);
        return true;
      } catch (_) {
        return false;
      }
    };
    const scheduleCallback = typeof schedule === "function"
      ? schedule
      : typeof global.requestAnimationFrame === "function"
        ? global.requestAnimationFrame.bind(global)
        : typeof global.setTimeout === "function"
          ? (callback) => global.setTimeout(callback, 0)
          : null;
    if (scheduleCallback) {
      scheduleCallback(apply);
      return true;
    }
    return apply();
  }

  function normalizeTabDisplay(environment, legacyLabel = "") {
    const rawEnvironment = environment && typeof environment === "object" ? environment : {};
    const rawTab = rawEnvironment.tabDisplay && typeof rawEnvironment.tabDisplay === "object"
      ? rawEnvironment.tabDisplay
      : null;
    const rawTitle = rawTab?.title && typeof rawTab.title === "object" ? rawTab.title : null;
    const legacyEnabled = rawEnvironment.titlePrefix === true;
    const legacyPrefix = legacyEnabled && legacyLabel ? `[${String(legacyLabel).trim()}] ` : "";
    const hasExplicitPrefix = hasOwn(rawTitle, "prefix");
    const prefix = hasExplicitPrefix
      ? String(rawTitle.prefix ?? "")
      : (legacyEnabled ? legacyPrefix : "");
    const title = {
      override: typeof rawTitle?.override === "string" ? rawTitle.override : ""
    };
    if (hasExplicitPrefix || legacyEnabled) title.prefix = prefix;

    const enabled = typeof rawTab?.enabled === "boolean"
      ? rawTab.enabled
      : legacyEnabled;
    const rawFavicon = rawTab?.favicon && typeof rawTab.favicon === "object" ? rawTab.favicon : {};
    const favicon = normalizeFavicon(rawFavicon);

    return { enabled, favicon, title };
  }

  function validateFavicon(favicon) {
    if (!favicon || typeof favicon !== "object") return { valid: true };
    if (!["emoji", "preset", "upload"].includes(favicon.source)) {
      return { valid: false, reason: "source" };
    }
    if (favicon.source === "emoji") {
      const value = String(favicon.value || "").trim();
      return isSingleEmoji(value)
        ? { valid: true }
        : { valid: false, reason: "emoji" };
    }
    if (favicon.source === "preset") {
      if (!isPresetType(favicon.type)) return { valid: false, reason: "preset-type" };
      return HEX_COLOR_PATTERN.test(String(favicon.value || ""))
        ? { valid: true }
        : { valid: false, reason: "color" };
    }
    if (favicon.type !== SUPPORTED_UPLOAD_MIME) return { valid: false, reason: "mime" };
    const parsed = parseUploadDataUrl(favicon.value);
    return parsed.valid ? { valid: true, size: parsed.size } : parsed;
  }

  function validateSettings(value) {
    const errors = [];
    const environments = Array.isArray(value?.environments) ? value.environments : [];
    environments.forEach((environment, index) => {
      const favicon = environment?.tabDisplay?.favicon;
      if (!favicon || favicon.source !== "upload") return;
      const result = validateFavicon(favicon);
      if (!result.valid) {
        errors.push({
          index,
          id: String(environment?.id || ""),
          name: String(environment?.name || ""),
          reason: result.reason
        });
      }
    });
    return errors;
  }

  const api = {
    DEFAULT_COLOR,
    DEFAULT_PRESET_TYPE,
    PRESET_TYPES,
    MAX_RAW_UPLOAD_BYTES,
    MAX_NORMALIZED_PNG_BYTES,
    // Kept as an alias for callers that used the original constant name.
    MAX_UPLOAD_BYTES: MAX_NORMALIZED_PNG_BYTES,
    SUPPORTED_UPLOAD_MIME,
    normalizeColor,
    normalizeEmoji,
    isSingleEmoji,
    isPresetType,
    preferredFaviconSource,
    selectSingleUploadFile,
    isRawUploadSizeAllowed,
    normalizeFavicon,
    normalizeTabDisplay,
    parseUploadDataUrl,
    validateFavicon,
    validateSettings,
    shouldInitializePrefix,
    initializePrefix,
    schedulePrefixCaret
  };

  global.EnvMateTabDisplayConfig = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
