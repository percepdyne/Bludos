// Converts resources/v3-checklist.md (the V3 master documentation checklist)
// into src/templates.json — the template packs shipped inside Bludos.
//
// Mapping rules (per PRD v4):
//   ## PHASE N  -> a template pack; ### x.y subsection -> one insertable template
//   ## CROSS-CUTTING -> the "Living Docs" pack
//   > **Phase N ... Checkpoint:** -> a gate checklist template in that phase pack
//   [AI/ROBOT/EV]-tagged items -> flagged so insertion can strip them (robotics toggle)
//   ## FILE MANAGEMENT -> skipped: those are app features, not documents

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, '..', 'resources', 'v3-checklist.md');
const OUT = path.join(here, '..', 'src', 'templates.json');
const ROBO = '[AI/ROBOT/EV]';

const text = fs.readFileSync(SRC, 'utf8');
const lines = text.split(/\r?\n/);

const capWord = (w) =>
  w.split('-').map((x) => (x ? x[0].toUpperCase() + x.slice(1) : x)).join('-');
function titleCase(s) {
  const fix = { dfx: 'DFx', 'dfx*': 'DFx' };
  return s.toLowerCase().split(/\s+/)
    .map((w) => fix[w] ?? capWord(w))
    .join(' ');
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const packs = [];
const gates = []; // { pack, title, items }
let curPack = null;
let curTpl = null;

function buildBody(items, withRobo) {
  const out = [];
  let skipIndent = -1;
  for (const it of items) {
    if (!withRobo) {
      if (skipIndent >= 0 && it.indent > skipIndent) continue;
      skipIndent = -1;
      if (it.robo) { skipIndent = it.indent; continue; }
    }
    out.push(it.text);
  }
  return out.join('\n');
}

function pushTpl() {
  if (curTpl && curPack && curTpl.items.some((i) => i.text.includes('- [ ]'))) {
    curPack.templates.push({
      id: slug(curPack.id + '-' + curTpl.title),
      title: curTpl.title,
      roboOnly: curTpl.roboOnly,
      body: buildBody(curTpl.items, true),
      bodyCore: curTpl.roboOnly ? null : buildBody(curTpl.items, false),
    });
  }
  curTpl = null;
}

for (const raw of lines) {
  const line = raw.replace(/\s+$/, '');
  let m;

  if (/^## FILE MANAGEMENT/.test(line)) { pushTpl(); curPack = null; continue; }

  if ((m = line.match(/^## PHASE (\d+) — (.+)$/))) {
    pushTpl();
    curPack = {
      id: 'phase-' + m[1].padStart(2, '0'),
      phase: Number(m[1]),
      title: `Phase ${m[1]} — ${titleCase(m[2])}`,
      templates: [],
    };
    packs.push(curPack);
    continue;
  }

  if (/^## CROSS-CUTTING/.test(line)) {
    pushTpl();
    curPack = { id: 'living-docs', phase: null, title: 'Living Docs — Cross-Cutting', templates: [] };
    packs.push(curPack);
    continue;
  }

  if (!curPack) continue;

  if ((m = line.match(/^### (.+)$/))) {
    pushTpl();
    curTpl = { title: m[1].trim(), roboOnly: false, items: [] };
    continue;
  }

  if ((m = line.match(/^> \*\*(Phase \d+[^:*]*):\*\*\s*(.+)$/))) {
    pushTpl();
    let title = m[1]
      .replace(/Gate Archive Checkpoint/i, 'Gate Checklist')
      .replace(/Final Archive Checkpoint/i, 'Final Archive Checklist');
    if (title === m[1]) title = m[1] + ' Checklist';
    const items = m[2].replace(/\.$/, '').split(/,\s*/)
      .map((s) => s.replace(/^and\s+/i, '').trim())
      .filter(Boolean)
      .map((s) => s[0].toUpperCase() + s.slice(1));
    gates.push({ pack: curPack, title, items });
    continue;
  }

  if (!curTpl) continue;

  if ((m = line.match(/^(\s*)- (.+)$/))) {
    const indent = m[1].length;
    curTpl.items.push({
      indent,
      robo: line.includes(ROBO),
      text: `${' '.repeat(indent)}- [ ] ${m[2]}`,
    });
    continue;
  }

  if ((m = line.match(/^\*\[(.+)\]\*$/))) {
    if (/\b(AI|EV|[Rr]obot)/.test(m[1])) curTpl.roboOnly = true;
    curTpl.items.push({ indent: 0, robo: false, text: `*Scope: ${m[1]}*\n` });
    continue;
  }
}
pushTpl();

for (const g of gates) {
  const body = [
    '*Complete, verified archive required before passing this gate:*',
    '',
    ...g.items.map((i) => `- [ ] ${i}`),
  ].join('\n');
  g.pack.templates.push({
    id: slug(g.pack.id + '-' + g.title),
    title: g.title,
    roboOnly: false,
    body,
    bodyCore: body,
  });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(packs, null, 2));

const total = packs.reduce((n, p) => n + p.templates.length, 0);
const robo = packs.reduce((n, p) => n + p.templates.filter((t) => t.roboOnly).length, 0);
console.log(`[templates] ${packs.length} packs, ${total} templates (${robo} robotics-only), ${gates.length} gate checklists -> ${path.relative(process.cwd(), OUT)}`);
for (const p of packs) console.log(`  ${p.id}: ${p.templates.length} templates`);
