// Dominant-color extraction for archive images (renderer-only: needs canvas).
// Quantizes to 4-bit RGB bins, then picks the most-populated bins that are
// perceptually distinct (ΔE2000 > 18) — fast and good enough for search.
import { rgbToLab, rgbToHex, hexToRgb, deltaE2000 } from './color.js';

export function extractPalette(dataUrl, k = 4) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const s = 26;
        const c = document.createElement('canvas');
        c.width = s; c.height = s;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0, s, s);
        const d = g.getImageData(0, 0, s, s).data;
        const bins = new Map();
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 128) continue;
          const key = ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4);
          const b = bins.get(key) || { n: 0, r: 0, g: 0, b: 0 };
          b.n++; b.r += d[i]; b.g += d[i + 1]; b.b += d[i + 2];
          bins.set(key, b);
        }
        const cand = [...bins.values()]
          .map((b) => ({ n: b.n, rgb: [b.r / b.n, b.g / b.n, b.b / b.n] }))
          .sort((a, b) => b.n - a.n);
        const picked = [];
        for (const cd of cand) {
          const lab = rgbToLab(...cd.rgb);
          if (picked.every((p) => deltaE2000(p.lab, lab) > 18)) picked.push({ lab, hex: rgbToHex(...cd.rgb) });
          if (picked.length >= k) break;
        }
        resolve(picked.map((p) => p.hex));
      } catch { resolve([]); }
    };
    img.onerror = () => resolve([]);
    img.src = dataUrl;
  });
}

export function paletteMatches(palette, hex, tol = 22) {
  const rgb = hexToRgb(hex);
  if (!rgb || !palette || !palette.length) return false;
  const lab = rgbToLab(...rgb);
  return palette.some((h) => {
    const r2 = hexToRgb(h);
    return r2 && deltaE2000(lab, rgbToLab(...r2)) < tol;
  });
}
