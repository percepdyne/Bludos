// Pure pet-math tests (electron/petlogic.cjs).
import { createRequire } from 'node:module';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const P = require('../electron/petlogic.cjs');

let fail = 0;
const ok = (c, m) => { if (!c) { console.error('  FAIL ' + m); fail++; } };

// colorway deterministic + in range
const h = P.colorwayFromName('Gripper V2');
ok(h >= 0 && h < 360, 'colorway in [0,360)');
ok(P.colorwayFromName('Gripper V2') === h, 'colorway deterministic');
ok(P.colorwayFromName('Other') !== h || true, 'different names may differ'); // not asserting inequality (collisions possible)

// rare roll: pity forces rare; low rand avoids rare
ok(P.rollSpecies(() => 0.99, P.RARE_PITY) === P.RARE_INDEX, 'pity guarantees rare');
ok(P.rollSpecies(() => 0.5, 0) !== P.RARE_INDEX, 'mid rand, no pity → common');
ok(P.rollSpecies(() => 0.001, 0) === P.RARE_INDEX, 'very low rand → rare');
// common rolls land in 0..6
for (let i = 0; i < 20; i++) {
  const s = P.rollSpecies(() => 0.5, 0);
  ok(s >= 0 && s <= 6, 'common species in 0..6');
}

// stage thresholds
ok(P.computeStage(0, 5).stage === 1, '0% → Hatchling');
ok(P.computeStage(20, 30).stage === 2, '20% slow → Juvenile');
ok(P.computeStage(50, 30).stage === 3, '50% slow → Adult');
ok(P.computeStage(80, 30).stage === 4, '80% slow → Elder');
ok(!P.computeStage(80, 30).prime, 'slow 80% not prime');

// prime only when fast AND near-complete
const fast = P.computeStage(100, 5);   // 20 %/day
ok(fast.stage === 5 && fast.prime, 'fast 100% → Prime');
const slow = P.computeStage(100, 60);  // ~1.7 %/day
ok(slow.stage === 4 && !slow.prime, 'slow 100% → Elder, not Prime');

ok(P.STAGE_NAMES[5] === 'Prime' && P.STAGE_NAMES[1] === 'Hatchling', 'stage names');

if (fail) { console.error(`[pets] ${fail} failure(s)`); process.exit(1); }
console.log('[pets] companion math verified');
