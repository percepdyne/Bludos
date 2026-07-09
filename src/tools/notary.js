// Notary timestamp: embeds a content hash + local time so a document's state
// at that instant is provable and tamper-evident (copyright / inventorship).
// Verifying later: strip TIMESTAMP lines, rehash, compare to the recorded hash.

export function timestampBlock({ iso, hash, operator }) {
  return '`⏱ TIMESTAMP ▮ ' + iso + ' · SHA-256=' + hash + (operator ? ' · ' + operator : '') + '`';
}

// hash the document as it stands, excluding any existing timestamp lines so the
// certified hash is stable and independently reproducible.
export function canonicalize(markdown) {
  return String(markdown)
    .split(/\r?\n/)
    .filter((l) => !/^`?⏱ TIMESTAMP ▮/.test(l.trim()))
    .join('\n')
    .trim();
}

export function localIso(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const oh = pad(Math.floor(Math.abs(off) / 60));
  const om = pad(Math.abs(off) % 60);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${sign}${oh}:${om}`;
}

// browser SHA-256 (SubtleCrypto). Node test uses its own crypto to cross-check.
export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
