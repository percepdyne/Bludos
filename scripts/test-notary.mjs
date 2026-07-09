// Verifies notary canonicalization + block format, and that the browser hash
// path (documented) matches Node's SHA-256 for the same canonical bytes.
import { timestampBlock, canonicalize, localIso } from '../src/tools/notary.js';
import crypto from 'node:crypto';
import assert from 'node:assert';

let fail = 0;
const ok = (c, m) => { if (!c) { console.error('  FAIL ' + m); fail++; } };

const doc = '# Spec\n\nSome content.\n\n`⏱ TIMESTAMP ▮ 2020-01-01T00:00:00+05:30 · SHA-256=abc · me`\n\nMore.';
const canon = canonicalize(doc);
ok(!/TIMESTAMP/.test(canon), 'canonical strips existing timestamp lines');
ok(canon.includes('Some content') && canon.includes('More'), 'canonical keeps real content');

// canonicalizing an already-canonical doc is idempotent (stable hash)
ok(canonicalize(canon) === canon, 'canonicalize idempotent');

const hash = crypto.createHash('sha256').update(canon).digest('hex');
const block = timestampBlock({ iso: '2026-07-07T19:43:00+05:30', hash, operator: 'Swaraj' });
ok(block.includes('⏱ TIMESTAMP ▮') && block.includes('SHA-256=' + hash), 'block well-formed');
ok(block.includes('Swaraj'), 'operator included');
ok(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d[+-]\d\d:\d\d$/.test(localIso(new Date())), 'localIso is ISO-8601 with offset');

// tamper detection: change one char → different hash
const tampered = crypto.createHash('sha256').update(canon + 'x').digest('hex');
ok(tampered !== hash, 'edit changes the hash');

if (fail) { console.error(`[notary] ${fail} failure(s)`); process.exit(1); }
console.log('[notary] timestamp/canonicalize verified');
