// Unit test for the CSV → chart + palette utilities (pure, node-runnable).
import { csvChart, chartBlock } from '../src/tools/chart.js';
import assert from 'node:assert';

let fail = 0;
const ok = (c, m) => { if (!c) { console.error('  FAIL ' + m); fail++; } };

// two-column x/y with header
let r = csvChart('time,current\n0,0.5\n1,1.2\n2,0.9\n3,1.4', 'motor.csv');
ok(r.ok, 'parses x/y csv');
ok(r.svg.includes('<polyline'), 'draws a line');
ok(r.svg.includes('<svg'), 'is svg');
ok(r.stats.length === 1 && /mean/.test(r.stats[0][1]), 'stats include mean');

// multi-series
r = csvChart('idx,a,b\n0,1,5\n1,2,4\n2,3,6', 'multi.csv');
ok(r.ok && r.stats.length === 2, 'multi-series → 2 stat rows');
ok((r.svg.match(/<polyline/g) || []).length === 2, 'two polylines');

// single column, no header
r = csvChart('10\n12\n11\n14\n13', 'single.csv');
ok(r.ok, 'single numeric column parses');
ok(!/NaN/.test(r.svg), 'no NaN in svg');

// junk
ok(!csvChart('', 'empty.csv').ok, 'empty rejected');
ok(!csvChart('a,b,c', 'headeronly.csv').ok, 'header-only rejected');

// block
const blk = chartBlock('motor.csv', [['current', 'n=4 · mean 1.0']]);
ok(blk.includes('DATA ▮ csv-chart') && blk.includes('| Series |'), 'chart block well-formed');

if (fail) { console.error(`[chart] ${fail} failure(s)`); process.exit(1); }
console.log('[chart] csv chart + block utilities verified');
