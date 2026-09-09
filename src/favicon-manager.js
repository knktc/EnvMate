(function (global) {
  const MAX_BYTES = 2 * 1024 * 1024;
  function normalize(environment = {}) {
    const color = environment.faviconColor || environment.badgeColor || environment.color;
    return {
      faviconMode: ["tint", "custom"].includes(environment.faviconMode) ? environment.faviconMode : "original",
      faviconRegion: ["foreground", "background"].includes(environment.faviconRegion) ? environment.faviconRegion : "auto",
      faviconColor: /^#[\da-f]{6}$/i.test(color || "") ? color : "#2563eb",
      faviconIntensity: Number.isFinite(Number(environment.faviconIntensity)) && environment.faviconIntensity != null
        ? Math.max(0, Math.min(1, Number(environment.faviconIntensity))) : 0.75,
      faviconDataUrl: /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(environment.faviconDataUrl || "") && environment.faviconDataUrl.length <= 65536
        ? environment.faviconDataUrl : ""
    };
  }
  const luminance = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

  function regionMask(data, width, height, region) {
    const count = width * height;
    const mask = new Float32Array(count);
    let left = width, right = -1, top = height, bottom = -1, opaque = 0;
    for (let p = 0; p < count; p++) {
      if (data[p * 4 + 3] < 128) continue;
      opaque++;
      left = Math.min(left, p % width); right = Math.max(right, p % width);
      top = Math.min(top, Math.floor(p / width)); bottom = Math.max(bottom, Math.floor(p / width));
    }
    if (!opaque) return mask;

    // Sample the visible bounds, not transparent padding around the icon.
    const edge = [];
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
      const p = y * width + x;
      if ((x === left || x === right || y === top || y === bottom) && data[p * 4 + 3] >= 128) edge.push(p);
    }
    const buckets = new Map();
    for (const p of edge) {
      const i = p * 4;
      const key = [0, 1, 2].map((c) => Math.floor(data[i + c] / 32)).join(",");
      const bucket = buckets.get(key) || { pixels: [], rgb: [0, 0, 0] };
      bucket.pixels.push(p);
      for (let c = 0; c < 3; c++) bucket.rgb[c] += data[i + c];
      buckets.set(key, bucket);
    }
    const dominant = [...buckets.values()].sort((a, b) => b.pixels.length - a.pixels.length)[0];
    const background = dominant.rgb.map((v) => v / dominant.pixels.length);
    const similarity = (p) => {
      const distance = Math.hypot(...background.map((v, c) => data[p * 4 + c] - v));
      return Math.max(0, Math.min(1, (100 - distance) / 76));
    };
    // Flood from the boundary to avoid treating a central logo as the background.
    const visited = new Uint8Array(count), queue = edge.filter((p) => similarity(p) > 0);
    for (const p of queue) visited[p] = 1;
    let area = 0;
    for (let q = 0; q < queue.length; q++) {
      const p = queue[q];
      area += similarity(p);
      const x = p % width, y = Math.floor(p / width);
      const neighbours = [];
      if (x > 0) neighbours.push(p - 1);
      if (x + 1 < width) neighbours.push(p + 1);
      if (y > 0) neighbours.push(p - width);
      if (y + 1 < height) neighbours.push(p + width);
      for (const next of neighbours) {
        if (!visited[next] && data[next * 4 + 3] >= 128 && similarity(next) > 0) {
          visited[next] = 1; queue.push(next);
        }
      }
    }
    const coverage = opaque / ((right - left + 1) * (bottom - top + 1));
    const hasBackground = dominant.pixels.length / edge.length >= 0.55 && coverage >= 0.8 && opaque / count >= 0.6 && area / opaque >= 0.25;
    const lightBackground = luminance(...background) > 0.78 && Math.max(...background) - Math.min(...background) < 40;
    const chosen = region === "auto" ? (hasBackground && !lightBackground ? "background" : "foreground") : region;
    for (let p = 0; p < count; p++) {
      // Matching enclosed white areas (letter holes) also belong to a light background.
      const weight = hasBackground && (visited[p] || lightBackground) ? similarity(p) : 0;
      mask[p] = chosen === "background" ? weight : 1 - weight;
    }
    return mask;
  }

  function tintPixels(data, color, intensity, { width = data.length / 4, height = 1, region = "auto" } = {}) {
    if (intensity === 0) return data;
    const rgb = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16));
    const mask = regionMask(data, width, height, region);
    let total = 0;
    const tones = new Float64Array(256);
    for (let p = 0; p < mask.length; p++) {
      const i = p * 4, weight = mask[p] * data[i + 3] / 255;
      tones[Math.round(luminance(data[i], data[i + 1], data[i + 2]) * 255)] += weight;
      total += weight;
    }
    if (!total) return data;
    // Anchor the selected region's median tone to the chosen color. This avoids
    // washing out a pale logo or leaving a black silhouette unchanged.
    let cumulative = 0, reference = 0;
    for (let tone = 0; tone < tones.length; tone++) {
      cumulative += tones[tone];
      if (cumulative >= total / 2) { reference = tone / 255; break; }
    }
    for (let i = 0; i < data.length; i += 4) {
      if (!data[i + 3] || !mask[i / 4]) continue;
      const light = luminance(data[i], data[i + 1], data[i + 2]);
      const amount = intensity * mask[i / 4];
      for (let c = 0; c < 3; c++) {
        const tinted = light >= reference
          ? rgb[c] + (255 - rgb[c]) * (light - reference) / Math.max(1 - reference, 0.001)
          : rgb[c] * Math.max(0.3, light / Math.max(reference, 0.001));
        data[i + c] = Math.round(data[i + c] * (1 - amount) + tinted * amount);
      }
    }
    return data;
  }
  async function renderImage(source, config, documentRef = global.document) {
    const image = new global.Image();
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Image timeout")), 10000);
      image.onload = () => { clearTimeout(timer); resolve(); };
      image.onerror = () => { clearTimeout(timer); reject(new Error("Invalid image")); };
      image.src = source;
    });
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 16777216) throw new Error("Invalid dimensions");
    const canvas = documentRef.createElement("canvas");
    canvas.width = canvas.height = 64;
    const context = canvas.getContext("2d");
    const scale = Math.min(64 / image.naturalWidth, 64 / image.naturalHeight);
    const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
    context.drawImage(image, (64 - width) / 2, (64 - height) / 2, width, height);
    if (config?.faviconMode === "tint") {
      const pixels = context.getImageData(0, 0, 64, 64);
      tintPixels(pixels.data, config.faviconColor, config.faviconIntensity, {
        width: 64, height: 64, region: config.faviconRegion || "auto"
      });
      context.putImageData(pixels, 0, 0);
    }
    return canvas.toDataURL("image/png");
  }
  async function upload(file) {
    if (!file || file.size > MAX_BYTES || !/\.(ico|png|jpe?g|webp)$/i.test(file.name)) throw new Error("Invalid file");
    const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const matches = (bytes, offset = 0) => bytes.every((value, index) => header[offset + index] === value);
    if (!(matches([137, 80, 78, 71, 13, 10, 26, 10]) || matches([255, 216, 255]) ||
      matches([0, 0, 1, 0]) || (matches([82, 73, 70, 70]) && matches([87, 69, 66, 80], 8)))) throw new Error("Unsupported image");
    const url = URL.createObjectURL(file);
    try { return await renderImage(url); } finally { URL.revokeObjectURL(url); }
  }
  function createFaviconManager({ document: doc = global.document, MutationObserver: Observer = global.MutationObserver,
    render = renderImage, load = async (url) => {
      const result = await chrome.runtime.sendMessage({ type: "ENVMATE_LOAD_FAVICON", url });
      if (!result?.dataUrl) throw new Error("Cannot load favicon");
      return result.dataUrl;
    } } = {}) {
    let config = normalize(), generation = 0, observer, timer, started = false, injected = null;
    const originals = new Map();
    const attrs = ["href", "type", "sizes"];
    const snapshot = (node) => Object.fromEntries(attrs.map((key) => [key, node.getAttribute(key)]));
    function icons() { return Array.from(doc.querySelectorAll('link[rel~="icon"]')).filter((node) => node !== injected); }
    function restore() {
      for (const [node, entry] of originals) {
        for (const key of attrs) {
          if (entry.applied && node.getAttribute(key) === entry.applied[key]) {
            if (entry.base[key] === null) node.removeAttribute(key); else node.setAttribute(key, entry.base[key]);
          }
        }
      }
      originals.clear();
      injected?.remove(); injected = null;
    }
    function observe() {
      if (started) observer.observe(doc.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["href", "rel", "type", "sizes", "media"] });
    }
    async function reconcile() {
      const token = ++generation;
      const nodes = icons();
      for (const [node, entry] of originals) {
        const current = snapshot(node);
        for (const key of attrs) if (!entry.applied || current[key] !== entry.applied[key]) entry.base[key] = current[key];
      }
      observer.disconnect();
      restore();
      observe();
      if (config.faviconMode === "original") return;
      const state = { ...config };
      const candidates = nodes.length ? nodes : [null];
      const results = await Promise.all(candidates.map(async (node) => {
        try {
          const source = state.faviconMode === "custom" ? state.faviconDataUrl
            : await load(node?.href || new URL("/favicon.ico", doc.baseURI).href);
          if (!source) return null;
          return await render(source, state, doc);
        } catch (_) { return null; }
      }));
      if (token !== generation || !started) return;
      observer.disconnect();
      candidates.forEach((node, index) => {
        if (!results[index]) return;
        if (!node) {
          node = doc.createElement("link"); node.rel = "icon"; injected = node;
          doc.head?.append(node);
        } else if (!node.isConnected) return;
        const base = snapshot(node);
        node.setAttribute("href", results[index]); node.setAttribute("type", "image/png"); node.setAttribute("sizes", "64x64");
        if (node !== injected) originals.set(node, { base, applied: snapshot(node) });
      });
      observe();
    }
    function schedule() {
      ++generation;
      clearTimeout(timer);
      timer = setTimeout(() => { reconcile().catch(() => {}); }, 0);
    }
    return {
      start() {
        if (started) return;
        started = true;
        observer = new Observer((records) => {
          if (records.some((record) => record.type === "attributes" ? ["LINK", "BASE"].includes(record.target.nodeName)
            : [...record.addedNodes, ...record.removedNodes].some((node) => ["LINK", "HEAD", "BASE"].includes(node.nodeName) || node.querySelector?.("link, base")))) schedule();
        });
        observe();
      },
      setState(environment) { config = normalize(environment); if (started) schedule(); },
      stop() { started = false; ++generation; clearTimeout(timer); observer?.disconnect(); restore(); }
    };
  }
  const api = { normalize, tintPixels, renderImage, upload, createFaviconManager };
  if (typeof module !== "undefined") module.exports = api;
  global.EnvMateFavicon = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
