// Pure companion-pet math (no fs, no Electron) — shared by workspace.cjs and
// scripts/test-pets.mjs. The UI owns names + artwork; the backend only stores
// numbers so the two never drift.
//
// 8 species: index 0..6 are common (hatch in random order), 7 is the rare one.
// Each pet grows through evolution stages 1..4 driven by project completion,
// with a special stage 5 ("Prime") reserved for fast, efficient progress.

const SPECIES_COUNT = 8;
const RARE_INDEX = 7;
const RARE_CHANCE = 0.04;
const RARE_PITY = 20; // guarantee a rare by this many hatches without one

// deterministic hue [0,360) from a project name so same-species pets differ
function colorwayFromName(name) {
  let h = 2166136261;
  for (const ch of String(name)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 360);
}

// rand: () => [0,1). hatchesSinceRare: count since the last rare hatch.
function rollSpecies(rand, hatchesSinceRare = 0) {
  if (hatchesSinceRare >= RARE_PITY || rand() < RARE_CHANCE) return RARE_INDEX;
  return Math.floor(rand() * (SPECIES_COUNT - 1)); // 0..6
}

// completionPct 0..100, daysActive >= 0. Returns { stage 1..5, prime bool }.
function computeStage(completionPct, daysActive) {
  const c = Math.max(0, Math.min(100, completionPct || 0));
  const days = Math.max(0.5, daysActive || 0);
  const rate = c / days; // percent per day
  // efficient = reached most of the work quickly (>= ~8 %/day ≈ 100% in ~12 days)
  const efficient = c >= 90 && rate >= 8;
  let stage = c >= 75 ? 4 : c >= 45 ? 3 : c >= 15 ? 2 : 1;
  if (efficient) stage = 5; // Prime
  return { stage, prime: stage === 5, efficient, rate };
}

const STAGE_NAMES = ['', 'Hatchling', 'Juvenile', 'Adult', 'Elder', 'Prime'];

module.exports = {
  SPECIES_COUNT, RARE_INDEX, RARE_CHANCE, RARE_PITY,
  colorwayFromName, rollSpecies, computeStage, STAGE_NAMES,
};
