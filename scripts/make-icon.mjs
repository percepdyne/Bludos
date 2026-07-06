// Generates build/icon.ico (256x256, PNG-compressed ICO) with zero dependencies.
// Design: dark speckled plate, metal frame, lime diamond, barcode strip.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, '..', 'build', 'icon.ico');
const S = 256;

// ---- paint ----
const px = new Uint8Array(S * S * 4);
const put = (x, y, r, g, b, a = 255) => {
  const i = (y * S + x) * 4;
  px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
};

// seeded LCG for deterministic speckles
let seed = 20260706;
const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    // metal frame
    const edge = Math.min(x, y, S - 1 - x, S - 1 - y);
    if (edge < 6) { put(x, y, 0x8a, 0x93, 0xa3); continue; }
    if (edge < 10) { put(x, y, 0x2a, 0x2f, 0x3a); continue; }
    // barcode strip
    if (y >= 208 && y < 228 && x >= 26 && x < 230) {
      const t = x % 17;
      const bar = t < 2 || (t >= 5 && t < 6) || (t >= 9 && t < 12);
      if (bar) { put(x, y, 0xdd, 0xe3, 0xee); continue; }
      put(x, y, 0x12, 0x15, 0x1c); continue;
    }
    // lime diamond
    const d = Math.abs(x - 128) + Math.abs(y - 112);
    if (d <= 62) { put(x, y, 0xc8, 0xf3, 0x1d); continue; }
    if (d <= 68) { put(x, y, 0x10, 0x13, 0x02); continue; } // dark outline
    // speckled charcoal plate
    const speck = rand() < 0.012;
    if (speck) put(x, y, 0x3c, 0x43, 0x52);
    else put(x, y, 0x12, 0x15, 0x1c);
  }
}

// ---- PNG encode ----
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // RGBA
const raw = Buffer.alloc(S * (S * 4 + 1));
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0; // filter: none
  Buffer.from(px.buffer, y * S * 4, S * 4).copy(raw, y * (S * 4 + 1) + 1);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

// ---- ICO wrap ----
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0);        // reserved
header.writeUInt16LE(1, 2);        // type: icon
header.writeUInt16LE(1, 4);        // count
header[6] = 0;                     // width 256
header[7] = 0;                     // height 256
header[8] = 0;                     // palette colors
header[9] = 0;                     // reserved
header.writeUInt16LE(1, 10);       // planes
header.writeUInt16LE(32, 12);      // bpp
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);      // offset of PNG data

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, Buffer.concat([header, png]));
console.log(`[icon] wrote ${OUT} (${png.length} bytes PNG payload)`);
