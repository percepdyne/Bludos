import React from 'react';

// Companion species — a blend of soft creatures (0–3) and abstract lab
// specimens (4–7). Backend stores only the species index + colorway hue;
// all names + artwork live here. Art is procedural SVG so it themes to the
// project colorway and grows more elaborate each evolution stage (1..5).

export const SPECIES = [
  { name: 'Blip', kind: 'creature' },
  { name: 'Tumbly', kind: 'creature' },
  { name: 'Moth', kind: 'creature' },
  { name: 'Nib', kind: 'creature' },
  { name: 'Prism', kind: 'specimen' },
  { name: 'Lattice', kind: 'specimen' },
  { name: 'Helix', kind: 'specimen' },
  { name: 'Aurum', kind: 'specimen' }, // index 7 — the rare hatch
];

export const speciesName = (i) => (SPECIES[i] ? SPECIES[i].name : 'Unknown');

const hsl = (h, s, l) => `hsl(${h} ${s}% ${l}%)`;

// eyes shared by creature species; more awake as they evolve
function Eyes({ stage, ink }) {
  const open = Math.min(1, stage / 2);
  return (
    <g fill={ink}>
      <circle cx="42" cy="52" r={2 + open} />
      <circle cx="58" cy="52" r={2 + open} />
      {stage >= 3 && <path d="M38 46 q4 -3 8 0 M54 46 q4 -3 8 0" stroke={ink} strokeWidth="1.5" fill="none" />}
    </g>
  );
}

// A pet portrait. size in px; stage 1..5; hue 0..360; prime/rare flags.
export function PetArt({ species = 0, stage = 1, hue = 200, prime, rare, size = 96 }) {
  const base = rare ? 46 : hue;                 // rare hatch skews golden
  const body = hsl(base, rare ? 85 : 62, 55);
  const dark = hsl(base, rare ? 80 : 55, 34);
  const glow = prime ? hsl(base, 95, 62) : 'none';
  const ink = '#12151c';
  const kind = SPECIES[species]?.kind || 'creature';
  const s = Math.max(1, Math.min(5, stage));

  const specimen = (
    <g>
      {/* crystalline specimen: facets multiply with stage */}
      <polygon points="50,18 74,40 62,78 38,78 26,40" fill={body} stroke={dark} strokeWidth="2" />
      {s >= 2 && <polygon points="50,18 62,78 38,78" fill={dark} opacity="0.35" />}
      {s >= 3 && <polygon points="26,40 50,50 38,78" fill={dark} opacity="0.3" />}
      {s >= 3 && <polygon points="74,40 50,50 62,78" fill={dark} opacity="0.3" />}
      {s >= 4 && <circle cx="50" cy="50" r="7" fill={hsl(base, 90, 80)} />}
      {s >= 4 && [0, 60, 120, 180, 240, 300].map((a) => (
        <line key={a} x1="50" y1="50" x2={50 + 26 * Math.cos(a * Math.PI / 180)} y2={50 + 26 * Math.sin(a * Math.PI / 180)}
          stroke={hsl(base, 80, 70)} strokeWidth="1" opacity="0.6" />
      ))}
      {s >= 5 && <polygon points="50,8 58,20 42,20" fill={glow} />}
    </g>
  );

  const creature = (
    <g>
      {/* blob body that sprouts features with stage */}
      <ellipse cx="50" cy="58" rx={s >= 2 ? 26 : 22} ry={s >= 2 ? 24 : 20} fill={body} stroke={dark} strokeWidth="2" />
      {s >= 2 && <ellipse cx="50" cy="60" rx="12" ry="10" fill={hsl(base, 60, 78)} opacity="0.5" />}
      {/* ears/antennae appear at stage 3 */}
      {s >= 3 && <path d="M34 40 q-6 -14 4 -18 M66 40 q6 -14 -4 -18" stroke={dark} strokeWidth="3" fill="none" />}
      {s >= 3 && <><circle cx="37" cy="21" r="3" fill={body} /><circle cx="63" cy="21" r="3" fill={body} /></>}
      {/* little feet at stage 4 */}
      {s >= 4 && <><ellipse cx="40" cy="80" rx="6" ry="4" fill={dark} /><ellipse cx="60" cy="80" rx="6" ry="4" fill={dark} /></>}
      <Eyes stage={s} ink={ink} />
      {s >= 3 && <path d="M45 60 q5 5 10 0" stroke={ink} strokeWidth="1.5" fill="none" />}
      {s >= 5 && <path d="M50 12 l4 8 -8 0 z" fill={glow} />}
    </g>
  );

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={'pet-art' + (prime ? ' prime' : '')}>
      {prime && <circle cx="50" cy="52" r="44" fill="none" stroke={glow} strokeWidth="2" opacity="0.7" />}
      {s === 0 || stage < 1
        ? <ellipse cx="50" cy="56" rx="24" ry="28" fill={body} stroke={dark} strokeWidth="2" /> /* pod */
        : (kind === 'specimen' ? specimen : creature)}
      {rare && <text x="50" y="96" textAnchor="middle" fontSize="8" fill={hsl(46, 90, 55)} fontFamily="monospace">RARE</text>}
    </svg>
  );
}
