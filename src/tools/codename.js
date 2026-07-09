// Deterministic military-op codename from a project name. Pure + stable so a
// project always shows the same codename (adjective + noun, hash-indexed).

const ADJ = ['IRON', 'AZURE', 'CRIMSON', 'SILENT', 'NORTHERN', 'OBSIDIAN', 'RAPID',
  'AMBER', 'COBALT', 'GRANITE', 'ARCTIC', 'SOLAR', 'ONYX', 'VIOLET', 'STEEL', 'EMBER'];
const NOUN = ['WOOD', 'FALCON', 'ANVIL', 'HORIZON', 'LANTERN', 'VECTOR', 'CIPHER',
  'HARBOR', 'MERIDIAN', 'SENTINEL', 'FORGE', 'COMPASS', 'BASTION', 'HALCYON', 'TEMPEST', 'MONOLITH'];

function hash(str) {
  let h = 2166136261;
  for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function codename(name) {
  const h = hash('cn:' + name);
  return `${ADJ[h % ADJ.length]} ${NOUN[(h >> 8) % NOUN.length]}`;
}
