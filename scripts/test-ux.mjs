// Pure tests for completeness + codename utilities.
import { pageCompleteness } from '../src/tools/completeness.js';
import { codename } from '../src/tools/codename.js';
import assert from 'node:assert';

let fail = 0;
const ok = (c, m) => { if (!c) { console.error('  FAIL ' + m); fail++; } };

// checkboxes
let r = pageCompleteness('- [x] a\n- [ ] b\n- [ ] c');
ok(r.total === 3 && r.filled === 1 && r.pct === 33, 'checkbox completeness: ' + JSON.stringify(r));

// empty doc → 100% (nothing to fill)
ok(pageCompleteness('# Title\n\nProse only.').pct === 100, 'no fillable slots → 100%');

// table cells: header + separator skipped, data cells counted
r = pageCompleteness('| A | B |\n| --- | --- |\n| x |  |\n|  |  |');
ok(r.total === 4 && r.filled === 1, 'table data cells: ' + JSON.stringify(r));

// blanks + label lines
r = pageCompleteness('Name: ____\nOwner:\nSigned off by John');
ok(r.total >= 2, 'blanks + empty label counted: ' + JSON.stringify(r));

// full doc → high pct
r = pageCompleteness('- [x] a\n- [x] b\n| A |\n| --- |\n| done |');
ok(r.pct === 100, 'all filled → 100%: ' + JSON.stringify(r));

// codename deterministic + shaped
const c = codename('Gripper V2');
ok(/^[A-Z]+ [A-Z]+$/.test(c), 'codename shape: ' + c);
ok(codename('Gripper V2') === c, 'codename deterministic');

if (fail) { console.error(`[ux] ${fail} failure(s)`); process.exit(1); }
console.log('[ux] completeness + codename verified');
