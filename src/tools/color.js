// Color math: sRGB ↔ HSL/CMYK/Lab, ΔE (CIE76 + CIEDE2000), nearest-RAL lookup.
// RAL values are the commonly published sRGB approximations of RAL Classic —
// screen approximations only; always verify against a physical fan deck.

export function hexToRgb(hex) {
  const m = String(hex).trim().replace(/^#/, '');
  const s = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
export const rgbToHex = (r, g, b) =>
  '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();

export function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

export function rgbToCmyk(r, g, b) {
  const k = 1 - Math.max(r, g, b) / 255;
  if (k === 1) return [0, 0, 0, 100];
  const f = (v) => Math.round(((1 - v / 255 - k) / (1 - k)) * 100);
  return [f(r), f(g), f(b), Math.round(k * 100)];
}

export function rgbToLab(r, g, b) {
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  // sRGB D65
  const X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  const Y = R * 0.2126729 + G * 0.7151522 + B * 0.0721750;
  const Z = R * 0.0193339 + G * 0.1191920 + B * 0.9503041;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(X / 0.95047), f(Y / 1.0), f(Z / 1.08883)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export const deltaE76 = (l1, l2) =>
  Math.sqrt((l1[0] - l2[0]) ** 2 + (l1[1] - l2[1]) ** 2 + (l1[2] - l2[2]) ** 2);

// CIEDE2000 (Sharma et al. reference implementation)
export function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180, deg = 180 / Math.PI;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const ap1 = a1 * (1 + G), ap2 = a2 * (1 + G);
  const Cp1 = Math.hypot(ap1, b1), Cp2 = Math.hypot(ap2, b2);
  const hp = (a, b) => { if (a === 0 && b === 0) return 0; let h = Math.atan2(b, a) * deg; return h < 0 ? h + 360 : h; };
  const hp1 = hp(ap1, b1), hp2 = hp(ap2, b2);
  const dL = L2 - L1, dC = Cp2 - Cp1;
  let dh = 0;
  if (Cp1 * Cp2 !== 0) {
    dh = hp2 - hp1;
    if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  }
  const dH = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dh / 2) * rad);
  const Lbp = (L1 + L2) / 2, Cbp = (Cp1 + Cp2) / 2;
  let hbp = hp1 + hp2;
  if (Cp1 * Cp2 !== 0) {
    if (Math.abs(hp1 - hp2) > 180) hbp += hbp < 360 ? 360 : -360;
    hbp /= 2;
  } else hbp = hp1 + hp2;
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad)
    + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.20 * Math.cos((4 * hbp - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp;
  const Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh));
}

// Common RAL Classic shades (sRGB approximations). Curated subset — the tool
// reports "nearest of N common RAL shades", not the full 213-color fan deck.
export const RAL = [
  ['RAL 1000', 'Green beige', '#CDBA88'], ['RAL 1001', 'Beige', '#D0B084'],
  ['RAL 1002', 'Sand yellow', '#D2AA6D'], ['RAL 1003', 'Signal yellow', '#F9A800'],
  ['RAL 1004', 'Golden yellow', '#E49E00'], ['RAL 1006', 'Maize yellow', '#E29000'],
  ['RAL 1007', 'Daffodil yellow', '#E88C00'], ['RAL 1011', 'Brown beige', '#AF804F'],
  ['RAL 1012', 'Lemon yellow', '#DDAF27'], ['RAL 1013', 'Oyster white', '#E3D9C6'],
  ['RAL 1014', 'Ivory', '#DDC49A'], ['RAL 1015', 'Light ivory', '#E6D2B5'],
  ['RAL 1016', 'Sulfur yellow', '#F1DD38'], ['RAL 1017', 'Saffron yellow', '#F6A950'],
  ['RAL 1018', 'Zinc yellow', '#FACA30'], ['RAL 1021', 'Rape yellow', '#F3B200'],
  ['RAL 1023', 'Traffic yellow', '#F7B500'], ['RAL 1028', 'Melon yellow', '#FF9B00'],
  ['RAL 1033', 'Dahlia yellow', '#F99A1C'], ['RAL 1037', 'Sun yellow', '#F09200'],
  ['RAL 2002', 'Vermilion', '#CB2821'], ['RAL 2003', 'Pastel orange', '#FF7514'],
  ['RAL 2004', 'Pure orange', '#F44611'], ['RAL 2008', 'Bright red orange', '#F75E25'],
  ['RAL 2011', 'Deep orange', '#EC7C25'], ['RAL 3000', 'Flame red', '#AF2B1E'],
  ['RAL 3001', 'Signal red', '#A52019'], ['RAL 3002', 'Carmine red', '#A2231D'],
  ['RAL 3003', 'Ruby red', '#9B111E'], ['RAL 3004', 'Purple red', '#75151E'],
  ['RAL 3005', 'Wine red', '#5E2129'], ['RAL 3009', 'Oxide red', '#642424'],
  ['RAL 3013', 'Tomato red', '#A12312'], ['RAL 3015', 'Light pink', '#D8A0A6'],
  ['RAL 3020', 'Traffic red', '#CC0605'], ['RAL 3027', 'Raspberry red', '#C51D34'],
  ['RAL 4005', 'Blue lilac', '#76689A'], ['RAL 4006', 'Traffic purple', '#903373'],
  ['RAL 5000', 'Violet blue', '#354D73'], ['RAL 5002', 'Ultramarine blue', '#20214F'],
  ['RAL 5003', 'Sapphire blue', '#1D1E33'], ['RAL 5005', 'Signal blue', '#1E2460'],
  ['RAL 5009', 'Azure blue', '#2A6478'], ['RAL 5010', 'Gentian blue', '#0E294B'],
  ['RAL 5012', 'Light blue', '#3B83BD'], ['RAL 5013', 'Cobalt blue', '#1E213D'],
  ['RAL 5015', 'Sky blue', '#2271B3'], ['RAL 5017', 'Traffic blue', '#063971'],
  ['RAL 5018', 'Turquoise blue', '#3F888F'], ['RAL 5021', 'Water blue', '#1B5583'],
  ['RAL 5024', 'Pastel blue', '#5D9B9B'], ['RAL 6000', 'Patina green', '#316650'],
  ['RAL 6001', 'Emerald green', '#287233'], ['RAL 6002', 'Leaf green', '#2D572C'],
  ['RAL 6005', 'Moss green', '#2F4538'], ['RAL 6009', 'Fir green', '#31372B'],
  ['RAL 6011', 'Reseda green', '#587246'], ['RAL 6018', 'Yellow green', '#57A639'],
  ['RAL 6019', 'Pastel green', '#BDECB6'], ['RAL 6024', 'Traffic green', '#308446'],
  ['RAL 6029', 'Mint green', '#006F3D'], ['RAL 6032', 'Signal green', '#237F52'],
  ['RAL 7000', 'Squirrel grey', '#78858B'], ['RAL 7001', 'Silver grey', '#8A9597'],
  ['RAL 7004', 'Signal grey', '#9EA0A1'], ['RAL 7005', 'Mouse grey', '#6B716F'],
  ['RAL 7011', 'Iron grey', '#434B4D'], ['RAL 7012', 'Basalt grey', '#4E5754'],
  ['RAL 7015', 'Slate grey', '#434750'], ['RAL 7016', 'Anthracite grey', '#293133'],
  ['RAL 7021', 'Black grey', '#23282B'], ['RAL 7024', 'Graphite grey', '#474A51'],
  ['RAL 7030', 'Stone grey', '#8B8C7A'], ['RAL 7032', 'Pebble grey', '#B8B799'],
  ['RAL 7035', 'Light grey', '#D7D7D7'], ['RAL 7037', 'Dusty grey', '#7D7F7D'],
  ['RAL 7038', 'Agate grey', '#B5B8B1'], ['RAL 7040', 'Window grey', '#9DA1AA'],
  ['RAL 7042', 'Traffic grey A', '#8D948D'], ['RAL 7045', 'Telegrey 1', '#8F9695'],
  ['RAL 7047', 'Telegrey 4', '#D0D0D0'], ['RAL 8001', 'Ochre brown', '#9D622B'],
  ['RAL 8002', 'Signal brown', '#79553D'], ['RAL 8003', 'Clay brown', '#80542F'],
  ['RAL 8011', 'Nut brown', '#5B3A29'], ['RAL 8017', 'Chocolate brown', '#45322E'],
  ['RAL 8019', 'Grey brown', '#403A3A'], ['RAL 9001', 'Cream', '#FDF4E3'],
  ['RAL 9002', 'Grey white', '#E7EBDA'], ['RAL 9003', 'Signal white', '#F4F4F4'],
  ['RAL 9004', 'Signal black', '#282828'], ['RAL 9005', 'Jet black', '#0A0A0A'],
  ['RAL 9006', 'White aluminium', '#A5A5A5'], ['RAL 9007', 'Grey aluminium', '#8F8F8F'],
  ['RAL 9010', 'Pure white', '#FFFFFF'], ['RAL 9011', 'Graphite black', '#1C1C1C'],
  ['RAL 9016', 'Traffic white', '#F6F6F6'], ['RAL 9017', 'Traffic black', '#1E1E1E'],
];

export function nearestRal(hex, n = 3) {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];
  const lab = rgbToLab(...rgb);
  return RAL
    .map(([code, name, h]) => ({ code, name, hex: h, dE: deltaE2000(lab, rgbToLab(...hexToRgb(h))) }))
    .sort((a, b) => a.dE - b.dE)
    .slice(0, n);
}
