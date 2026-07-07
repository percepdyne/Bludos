// Spec linter + smoke for every declarative calculator: runs each tool's
// compute() against its own defaults and fails the build on NaN, bad row
// shapes, duplicate ids, or select defaults missing from options.
// Wired into `npm run build`.
import { CALC_SPECS } from '../src/tools/calcs.js';

let fail = 0;
const ids = new Set();

for (const s of CALC_SPECS) {
  const err = (m) => { console.error(`  FAIL [${s.id || '?'}] ${m}`); fail++; };

  if (!s.id || !s.title || !s.pack || !s.desc) err('missing id/title/pack/desc');
  if (ids.has(s.id)) err('duplicate id');
  ids.add(s.id);

  for (const inp of s.inputs) {
    if (!inp.k || !inp.label) err(`input missing k/label: ${JSON.stringify(inp)}`);
    if (inp.type === 'select') {
      if (!Array.isArray(inp.options) || !inp.options.length) err(`select ${inp.k} has no options`);
      else if (!inp.options.some((o) => o.v === inp.def)) err(`select ${inp.k} default "${inp.def}" not in options`);
    }
  }

  const vals = Object.fromEntries(s.inputs.map((i) => [i.k, i.def ?? '']));
  let rows;
  try { rows = s.compute(vals); } catch (e) { err('compute threw: ' + e.message); continue; }
  if (!Array.isArray(rows) || rows.length === 0) { err('compute returned no rows'); continue; }

  for (const r of rows) {
    if (!Array.isArray(r) || typeof r[0] !== 'string' || typeof r[1] !== 'string') {
      err('bad row shape: ' + JSON.stringify(r)); continue;
    }
    if (/NaN|undefined|Infinity/.test(r[1])) err(`bad value in "${r[0]}": ${r[1]}`);
    if (r[2] !== undefined && typeof r[2] !== 'object') err(`bad opts in "${r[0]}"`);
  }
  if (!rows.some((r) => /\d/.test(r[1]))) err('no numeric result with defaults');
}

if (fail) {
  console.error(`[calcs] ${fail} problem(s) across ${CALC_SPECS.length} specs`);
  process.exit(1);
}
console.log(`[calcs] ${CALC_SPECS.length} calculator specs verified (defaults compute clean)`);
