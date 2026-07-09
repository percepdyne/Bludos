const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const matter = require('gray-matter');
const { app, shell, net } = require('electron');

const PHASE_FOLDERS = [
  '00 Strategy & Systems Architecture',
  '01 Research & Discovery',
  '02 Ideation & Conceptualization',
  '03 Detailed Engineering & DFx',
  '04 Prototyping & Iteration',
  '05 Verification, Validation & Regulatory',
  '06 Supply Chain & Manufacturing',
  '07 Quality Assurance',
  '08 Design Release & Launch',
  '09 In-Market & Field Operations',
  '10 End-of-Life & Cycle Closure',
  'Living Docs',
];

const TRASH_RETENTION_DAYS = 30;
const HASH_LIMIT_BYTES = 200 * 1024 * 1024;

let ROOT = '';

const p = (...s) => path.join(ROOT, ...s);
const archiveDir = () => p('_archive');
const archiveIndexPath = () => p('.bludos', 'archive.json');
const trashDir = () => p('.bludos', 'trash');
const trashIndexPath = () => p('.bludos', 'trash.json');
const settingsPath = () => p('.bludos', 'settings.json');

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch {
    try { return JSON.parse(fs.readFileSync(file + '.bak', 'utf8')); }
    catch { return fallback; }
  }
}
// Atomic write with a .bak of the previous version — a crash mid-write can no
// longer destroy archive tags / trash records / settings.
function writeJson(file, data) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  try { if (fs.existsSync(file)) fs.copyFileSync(file, file + '.bak'); } catch { /* best effort */ }
  fs.renameSync(tmp, file);
}

// ---------- per-user config (outside the workspace, never synced) ----------

const configPath = () => path.join(app.getPath('userData'), 'bludos-config.json');
function getConfig() { return readJson(configPath(), {}); }
function setConfig(patch) {
  const c = { ...readJson(configPath(), {}), ...patch };
  writeJson(configPath(), c);
  return c;
}

function initWorkspace() {
  const cfg = getConfig();
  ROOT = cfg.workspaceRoot && fs.existsSync(cfg.workspaceRoot)
    ? cfg.workspaceRoot
    : path.join(app.getPath('documents'), 'Bludos Workspace');
  fs.mkdirSync(trashDir(), { recursive: true });
  fs.mkdirSync(archiveDir(), { recursive: true });
  if (!fs.existsSync(archiveIndexPath())) writeJson(archiveIndexPath(), []);
  if (!fs.existsSync(trashIndexPath())) writeJson(trashIndexPath(), []);
  if (!fs.existsSync(settingsPath())) writeJson(settingsPath(), {});
  reconcileArchive();
  cleanupTrash();
}

function openRoot() {
  shell.openPath(ROOT);
  return true;
}

async function chooseWorkspace() {
  const { dialog } = require('electron');
  const res = await dialog.showOpenDialog({
    title: 'Choose Bludos workspace folder (can be a shared or synced drive)',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (res.canceled || !res.filePaths[0]) return { ok: false };
  setConfig({ workspaceRoot: res.filePaths[0] });
  initWorkspace();
  return { ok: true, root: ROOT };
}

// The archive index is a cache, not the truth: on startup, drop entries whose
// files vanished and adopt files that appeared outside the app (synced drives).
function reconcileArchive() {
  const idx = readJson(archiveIndexPath(), []);
  let files;
  try { files = new Set(fs.readdirSync(archiveDir())); } catch { return; }
  let changed = false;
  const kept = idx.filter((a) => {
    if (a.kind === 'link' || !a.file) return true;
    if (!files.has(a.file)) { changed = true; return false; }
    return true;
  });
  const indexed = new Set(kept.map((a) => a.file));
  for (const f of files) {
    if (indexed.has(f)) continue;
    let st;
    try { st = fs.statSync(path.join(archiveDir(), f)); } catch { continue; }
    if (!st.isFile()) continue;
    kept.push({
      id: crypto.randomUUID(), file: f, name: f,
      kind: kindOf(path.extname(f).slice(1).toLowerCase()),
      tags: [], project: '', phase: '', sourceUrl: '',
      added: st.mtime.toISOString(), size: st.size, sha256: '',
    });
    changed = true;
  }
  if (changed) writeJson(archiveIndexPath(), kept);
}

function getSettings() {
  return readJson(settingsPath(), {});
}

function setSettings(patch) {
  const s = { ...readJson(settingsPath(), {}), ...patch };
  writeJson(settingsPath(), s);
  return s;
}

function info() {
  return { root: ROOT, phaseFolders: PHASE_FOLDERS };
}

function safeName(title) {
  const s = String(title).replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();
  return s || 'Untitled';
}

function resolveRel(rel) {
  const abs = path.resolve(ROOT, rel);
  if (abs !== path.resolve(ROOT) && !abs.startsWith(path.resolve(ROOT) + path.sep)) {
    throw new Error('Path escapes workspace: ' + rel);
  }
  return abs;
}

// ---------- tree ----------

function getTree() {
  const projects = [];
  for (const name of fs.readdirSync(ROOT)) {
    if (name.startsWith('.') || name.startsWith('_')) continue;
    const dir = p(name);
    let stat;
    try { stat = fs.statSync(dir); } catch { continue; }
    if (!stat.isDirectory()) continue;

    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { /* skip */ }
    const listPages = (folderAbs, folderName) =>
      fs.readdirSync(folderAbs)
        .filter((x) => x.toLowerCase().endsWith('.md'))
        .map((x) => ({ title: x.replace(/\.md$/i, ''), rel: [name, folderName, x].join('/') }))
        .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));

    const folders = [];
    for (const f of PHASE_FOLDERS) {
      const fp = path.join(dir, f);
      folders.push({ name: f, pages: fs.existsSync(fp) ? listPages(fp, f) : [] });
    }
    // Folders created outside the app stay visible — "it's just files" must hold.
    const custom = entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.') && !e.name.startsWith('_') && !PHASE_FOLDERS.includes(e.name))
      .map((e) => e.name)
      .sort();
    for (const f of custom) folders.push({ name: f, custom: true, pages: listPages(path.join(dir, f), f) });
    // Loose .md files at the project root show up as unfiled.
    const rootPages = entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'))
      .map((e) => ({ title: e.name.replace(/\.md$/i, ''), rel: [name, e.name].join('/') }));
    if (rootPages.length) folders.push({ name: '(unfiled)', virtual: true, pages: rootPages });

    projects.push({ name, folders });
  }
  projects.sort((a, b) => a.name.localeCompare(b.name));
  return { root: ROOT, projects };
}

function createProject(name) {
  const n = safeName(name);
  for (const f of PHASE_FOLDERS) fs.mkdirSync(p(n, f), { recursive: true });
  hatchPet(n);           // a companion hatches with each new project
  bumpActivity('project');
  return getTree();
}

// ---------- pages ----------

function uniqueFile(dir, base, ext) {
  let file = base + ext;
  let i = 2;
  while (fs.existsSync(path.join(dir, file))) file = `${base} ${i++}${ext}`;
  return file;
}

function createPage(project, phase, title, markdown) {
  const dir = p(safeName(project), phase);
  fs.mkdirSync(dir, { recursive: true });
  const file = uniqueFile(dir, safeName(title), '.md');
  const now = new Date().toISOString();
  // FM.B-style document number: BLU-<phase code>-<base36 sequence>
  const phaseIdx = PHASE_FOLDERS.indexOf(phase);
  const code = phaseIdx >= 0 && phaseIdx < 11 ? 'P' + String(phaseIdx).padStart(2, '0') : 'LD';
  const docId = `BLU-${code}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const body = String(markdown || '')
    .replaceAll('{{DOC}}', docId)
    .replaceAll('{{DATE}}', now.slice(0, 10));
  const fm = { title: file.replace(/\.md$/, ''), doc: docId, status: 'Draft', created: now, updated: now };
  const who = getConfig().userName;
  if (who) fm.author = who;
  fs.writeFileSync(path.join(dir, file), matter.stringify(body, fm));
  bumpActivity('page');
  return [safeName(project), phase, file].join('/');
}

function readPage(rel) {
  const abs = resolveRel(rel);
  const g = matter(fs.readFileSync(abs, 'utf8'));
  return {
    rel,
    title: path.basename(abs, '.md'),
    meta: g.data || {},
    markdown: g.content || '',
  };
}

function writePage(rel, markdown) {
  const abs = resolveRel(rel);
  // Refuse to write to files that no longer exist — a late autosave flush after
  // a rename or trash must not resurrect the page at its old path.
  if (!fs.existsSync(abs)) return false;
  const data = matter(fs.readFileSync(abs, 'utf8')).data || {};
  data.updated = new Date().toISOString();
  const who = getConfig().userName;
  if (who) data.updatedBy = who;
  fs.writeFileSync(abs, matter.stringify(markdown || '', data));
  bumpActivity('write');
  return true;
}

function setStatus(rel, status) {
  const abs = resolveRel(rel);
  const g = matter(fs.readFileSync(abs, 'utf8'));
  // FM.D discipline: every status transition snapshots the outgoing revision
  try {
    const key = g.data.doc || rel.split('/').join('__');
    const d = p('.bludos', 'revisions', safeName(key));
    fs.mkdirSync(d, { recursive: true });
    fs.copyFileSync(abs, path.join(d, Date.now() + '-' + String(g.data.status || 'Draft').replace(/\s/g, '') + '.md'));
  } catch { /* snapshot is best-effort */ }
  g.data.status = status;
  g.data.updated = new Date().toISOString();
  fs.writeFileSync(abs, matter.stringify(g.content, g.data));
  return g.data;
}

function revKey(rel) {
  try { return matter(fs.readFileSync(resolveRel(rel), 'utf8')).data.doc || rel.split('/').join('__'); }
  catch { return rel.split('/').join('__'); }
}

function listRevisions(rel) {
  const d = p('.bludos', 'revisions', safeName(revKey(rel)));
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const m = f.match(/^(\d+)-(.*)\.md$/);
      return { file: f, when: m ? new Date(Number(m[1])).toISOString() : '', status: m ? m[2] : '' };
    })
    .sort((a, b) => b.file.localeCompare(a.file));
}

function readRevision(rel, file) {
  const abs = path.join(p('.bludos', 'revisions', safeName(revKey(rel))), path.basename(file));
  const g = matter(fs.readFileSync(abs, 'utf8'));
  return { markdown: g.content, meta: g.data };
}

function renamePage(rel, newTitle) {
  const abs = resolveRel(rel);
  const dir = path.dirname(abs);
  const base = safeName(newTitle);
  const curBase = path.basename(abs, '.md');
  if (base === curBase) return rel;
  // Case-only rename: Windows filesystems are case-insensitive, so "dfmea" →
  // "DFMEA" would collide with itself and get a " 2" suffix. Route through a
  // temp name instead.
  const caseOnly = base.toLowerCase() === curBase.toLowerCase();
  const file = caseOnly ? base + '.md' : uniqueFile(dir, base, '.md');
  const g = matter(fs.readFileSync(abs, 'utf8'));
  g.data.title = file.replace(/\.md$/, '');
  g.data.updated = new Date().toISOString();
  fs.writeFileSync(abs, matter.stringify(g.content, g.data));
  if (caseOnly) {
    const tmp = path.join(dir, '.rename-' + Date.now() + '.tmp');
    fs.renameSync(abs, tmp);
    fs.renameSync(tmp, path.join(dir, file));
  } else {
    fs.renameSync(abs, path.join(dir, file));
  }
  const parts = rel.split('/');
  parts[parts.length - 1] = file;
  return parts.join('/');
}

// ---------- trash ----------

function trashPage(rel) {
  const abs = resolveRel(rel);
  const id = Date.now() + '-' + crypto.randomBytes(3).toString('hex');
  fs.copyFileSync(abs, path.join(trashDir(), id + '.md'));
  fs.unlinkSync(abs);
  const idx = readJson(trashIndexPath(), []);
  idx.push({ id, kind: 'page', file: id + '.md', rel, title: path.basename(abs, '.md'), when: new Date().toISOString() });
  writeJson(trashIndexPath(), idx);
  return true;
}

function listTrash() {
  return readJson(trashIndexPath(), []).sort((a, b) => b.when.localeCompare(a.when));
}

function restoreTrash(id) {
  const idx = readJson(trashIndexPath(), []);
  const entry = idx.find((x) => x.id === id);
  if (!entry) throw new Error('Trash entry not found');

  if (entry.kind === 'asset') {
    const arch = readJson(archiveIndexPath(), []);
    const a = { ...entry.asset };
    if (entry.file) {
      const ext = path.extname(a.file || entry.file);
      const dest = uniqueFile(archiveDir(), path.basename(a.file || entry.file, ext), ext);
      fs.renameSync(path.join(trashDir(), entry.file), path.join(archiveDir(), dest));
      a.file = dest;
    }
    arch.push(a);
    writeJson(archiveIndexPath(), arch);
    writeJson(trashIndexPath(), idx.filter((x) => x.id !== id));
    return { restored: 'asset' };
  }

  const destAbs = resolveRel(entry.rel);
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  let target = destAbs;
  if (fs.existsSync(target)) {
    const dir = path.dirname(destAbs);
    target = path.join(dir, uniqueFile(dir, path.basename(destAbs, '.md') + ' (restored)', '.md'));
  }
  fs.renameSync(path.join(trashDir(), entry.file || entry.id + '.md'), target);
  writeJson(trashIndexPath(), idx.filter((x) => x.id !== id));
  return { rel: path.relative(ROOT, target).split(path.sep).join('/') };
}

function cleanupTrash() {
  const idx = readJson(trashIndexPath(), []);
  const cutoff = Date.now() - TRASH_RETENTION_DAYS * 24 * 3600 * 1000;
  const keep = [];
  for (const entry of idx) {
    if (new Date(entry.when).getTime() < cutoff) {
      const f = entry.file || entry.id + '.md';
      if (f) { try { fs.unlinkSync(path.join(trashDir(), f)); } catch { /* already gone */ } }
    } else {
      keep.push(entry);
    }
  }
  writeJson(trashIndexPath(), keep);
}

// ---------- archive ----------

const IMG = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'avif'];
const CAD = ['step', 'stp', 'stl', '3mf', 'iges', 'igs', 'obj', 'sldprt', 'sldasm', 'dxf', 'dwg', 'f3d', 'x_t'];
const DOC = ['pdf', 'md', 'txt', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'csv'];

function kindOf(ext) {
  if (IMG.includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (CAD.includes(ext)) return 'cad';
  if (DOC.includes(ext)) return 'doc';
  return 'file';
}

function decorate(a) {
  if (a.kind === 'link') return a;
  return { ...a, url: pathToFileURL(path.join(archiveDir(), a.file)).href };
}

function archiveList() {
  return readJson(archiveIndexPath(), [])
    .map(decorate)
    .sort((a, b) => b.added.localeCompare(a.added));
}

function archiveAddFiles(paths, meta = {}) {
  const idx = readJson(archiveIndexPath(), []);
  for (const src of paths || []) {
    try {
      const base = path.basename(src);
      const ext = path.extname(base);
      const dest = uniqueFile(archiveDir(), path.basename(base, ext), ext);
      fs.copyFileSync(src, path.join(archiveDir(), dest));
      const st = fs.statSync(path.join(archiveDir(), dest));
      let sha256 = '';
      if (st.size < HASH_LIMIT_BYTES) {
        sha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(archiveDir(), dest))).digest('hex');
      }
      idx.push({
        id: crypto.randomUUID(),
        file: dest,
        name: base,
        kind: kindOf(ext.slice(1).toLowerCase()),
        tags: meta.tags || [],
        project: meta.project || '',
        phase: meta.phase || '',
        sourceUrl: '',
        added: new Date().toISOString(),
        size: st.size,
        sha256,
      });
    } catch (err) {
      console.error('[bludos] archive add failed:', src, err.message);
    }
  }
  writeJson(archiveIndexPath(), idx);
  return archiveList();
}

function archiveAddUrl(url, meta = {}) {
  const idx = readJson(archiveIndexPath(), []);
  let name = url;
  try { name = new URL(url).hostname + new URL(url).pathname.replace(/\/$/, ''); } catch { /* keep raw */ }
  idx.push({
    id: crypto.randomUUID(),
    file: '',
    name,
    kind: 'link',
    tags: meta.tags || [],
    project: meta.project || '',
    phase: meta.phase || '',
    sourceUrl: url,
    added: new Date().toISOString(),
    size: 0,
    sha256: '',
  });
  writeJson(archiveIndexPath(), idx);
  return archiveList();
}

function archiveUpdate(id, patch = {}) {
  const idx = readJson(archiveIndexPath(), []);
  const entry = idx.find((x) => x.id === id);
  if (entry) {
    for (const key of ['tags', 'name', 'project', 'phase']) {
      if (patch[key] !== undefined) entry[key] = patch[key];
    }
    writeJson(archiveIndexPath(), idx);
  }
  return archiveList();
}

function archiveRemove(id) {
  const idx = readJson(archiveIndexPath(), []);
  const entry = idx.find((x) => x.id === id);
  if (entry) {
    // Assets get the same 30-day trash safety as pages — no permanent one-click loss.
    const tid = Date.now() + '-' + crypto.randomBytes(3).toString('hex');
    let tfile = '';
    if (entry.file) {
      tfile = tid + path.extname(entry.file);
      try { fs.renameSync(path.join(archiveDir(), entry.file), path.join(trashDir(), tfile)); }
      catch { tfile = ''; }
    }
    const t = readJson(trashIndexPath(), []);
    t.push({ id: tid, kind: 'asset', file: tfile, asset: entry, title: entry.name, when: new Date().toISOString() });
    writeJson(trashIndexPath(), t);
  }
  writeJson(archiveIndexPath(), idx.filter((x) => x.id !== id));
  return archiveList();
}

function archiveReadB64(id) {
  const a = readJson(archiveIndexPath(), []).find((x) => x.id === id);
  if (!a || !a.file) return null;
  const ext = path.extname(a.file).slice(1).toLowerCase();
  const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml' }[ext] || 'application/octet-stream';
  try { return { mime, b64: fs.readFileSync(path.join(archiveDir(), a.file)).toString('base64') }; }
  catch { return null; }
}

function archiveOpen(id) {
  const entry = readJson(archiveIndexPath(), []).find((x) => x.id === id);
  if (!entry) return false;
  if (entry.kind === 'link') shell.openExternal(entry.sourceUrl);
  else shell.openPath(path.join(archiveDir(), entry.file));
  return true;
}

// ---------- search ----------

function search(q) {
  q = String(q || '').trim().toLowerCase();
  if (q.length < 2) return [];
  const results = [];
  const tree = getTree();
  for (const proj of tree.projects) {
    for (const folder of proj.folders) {
      for (const pg of folder.pages) {
        let raw = '';
        try { raw = fs.readFileSync(resolveRel(pg.rel), 'utf8'); } catch { continue; }
        const content = matter(raw).content;
        const lower = content.toLowerCase();
        let score = 0;
        if (pg.title.toLowerCase().includes(q)) score += 10;
        let hits = 0;
        let pos = lower.indexOf(q);
        while (pos !== -1 && hits < 50) { hits++; pos = lower.indexOf(q, pos + q.length); }
        score += hits;
        if (score > 0) {
          const i = lower.indexOf(q);
          const snippet = i === -1 ? '' : content.slice(Math.max(0, i - 60), i + 90).replace(/\s+/g, ' ').trim();
          results.push({ type: 'page', rel: pg.rel, title: pg.title, project: proj.name, folder: folder.name, snippet, score });
        }
      }
    }
  }
  for (const a of readJson(archiveIndexPath(), [])) {
    const hay = (a.name + ' ' + (a.tags || []).join(' ') + ' ' + (a.sourceUrl || '')).toLowerCase();
    if (hay.includes(q)) {
      results.push({ type: 'asset', id: a.id, title: a.name, project: a.project, folder: 'Archive', snippet: (a.tags || []).join(', '), score: 5 });
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 50);
}

// ---------- activity heatmap ----------

const activityPath = () => p('.bludos', 'activity.json');

function bumpActivity(kind) {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const a = readJson(activityPath(), {});
    a[day] = (a[day] || 0) + 1;
    writeJson(activityPath(), a);
    void kind;
  } catch { /* activity is best-effort */ }
}

function activitySummary(days = 133) {
  const a = readJson(activityPath(), {});
  const out = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, count: a[key] || 0 });
  }
  // current streak (consecutive days up to today with activity)
  let streak = 0;
  for (let i = out.length - 1; i >= 0; i--) { if (out[i].count > 0) streak++; else break; }
  const total = out.reduce((s, x) => s + x.count, 0);
  return { days: out, streak, total, max: Math.max(1, ...out.map((x) => x.count)) };
}

// ---------- offline music player ----------

const musicDir = () => { const d = p('.bludos', 'music'); fs.mkdirSync(d, { recursive: true }); return d; };
const musicIndexPath = () => p('.bludos', 'music.json');
const AUDIO_EXT = new Set(['.mp3', '.m4a', '.ogg', '.wav', '.flac', '.aac']);

function musicList() {
  const idx = readJson(musicIndexPath(), []);
  return idx
    .filter((t) => fs.existsSync(path.join(musicDir(), t.file)))
    .map((t) => ({ ...t, url: 'file:///' + encodeURI(path.join(musicDir(), t.file).replace(/\\/g, '/')) }));
}

function musicImport(paths) {
  const idx = readJson(musicIndexPath(), []);
  for (const src of paths || []) {
    if (!AUDIO_EXT.has(path.extname(src).toLowerCase())) continue;
    const file = uniqueFile(musicDir(), path.basename(src, path.extname(src)), path.extname(src));
    try { fs.copyFileSync(src, path.join(musicDir(), file)); } catch { continue; }
    idx.push({ id: crypto.randomUUID(), file, name: path.basename(src, path.extname(src)), added: new Date().toISOString() });
  }
  writeJson(musicIndexPath(), idx);
  return musicList();
}

async function musicPick() {
  const { dialog } = require('electron');
  const res = await dialog.showOpenDialog({
    title: 'Add music', properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio', extensions: ['mp3', 'm4a', 'ogg', 'wav', 'flac', 'aac'] }],
  });
  if (res.canceled) return musicList();
  return musicImport(res.filePaths);
}

function musicRemove(id) {
  const idx = readJson(musicIndexPath(), []);
  const t = idx.find((x) => x.id === id);
  if (t) { try { fs.unlinkSync(path.join(musicDir(), t.file)); } catch { /* gone */ } }
  writeJson(musicIndexPath(), idx.filter((x) => x.id !== id));
  return musicList();
}

// ---------- sketchbook (saves into the archive) ----------

function archiveAddBytes(name, bytesOrB64, meta = {}) {
  const buf = typeof bytesOrB64 === 'string' ? Buffer.from(bytesOrB64, 'base64') : Buffer.from(bytesOrB64);
  const ext = path.extname(name) || '.png';
  const file = uniqueFile(archiveDir(), path.basename(name, ext).replace(/[^\w.-]+/g, '-') || 'sketch', ext);
  fs.writeFileSync(path.join(archiveDir(), file), buf);
  const idx = readJson(archiveIndexPath(), []);
  idx.push({
    id: crypto.randomUUID(), file, name: file, kind: kindOf(ext.slice(1).toLowerCase()),
    tags: meta.tags || [], project: meta.project || '', phase: '', sourceUrl: '',
    added: new Date().toISOString(), size: buf.length,
    sha256: crypto.createHash('sha256').update(buf).digest('hex'),
  });
  writeJson(archiveIndexPath(), idx);
  return { ok: true, file };
}

// ---------- companion pets & achievement deck ----------

const petlogic = require('./petlogic.cjs');
const petsPath = () => p('.bludos', 'pets.json');
const deckPath = () => p('.bludos', 'deck.json');

function hatchPet(project) {
  if (getSettings().hatcheryEnabled === false) return null;
  const pets = readJson(petsPath(), []);
  if (pets.some((x) => x.project === project)) return null;
  // hatches since the last rare, across this workspace
  let since = 0;
  for (let i = pets.length - 1; i >= 0; i--) { if (pets[i].species === petlogic.RARE_INDEX) break; since++; }
  const species = petlogic.rollSpecies(Math.random, since);
  const pet = {
    project, species,
    rare: species === petlogic.RARE_INDEX,
    colorway: petlogic.colorwayFromName(project),
    hatchedAt: new Date().toISOString(),
    status: 'active', primeEver: false,
  };
  pets.push(pet);
  writeJson(petsPath(), pets);
  return pet;
}

// enrich stored pets with live stage from project progress
function decoratePet(pet, gatesByName) {
  const g = gatesByName[pet.project];
  let done = 0, todo = 0, docs = 0;
  if (g) for (const ph of g.phases) { done += ph.done; todo += ph.todo; docs += ph.pages; }
  const completion = done + todo > 0 ? (done / (done + todo)) * 100 : (docs > 0 ? 5 : 0);
  const daysActive = Math.max(0.5, (Date.now() - new Date(pet.hatchedAt).getTime()) / 8.64e7);
  const s = petlogic.computeStage(completion, daysActive);
  return {
    ...pet,
    completion: Math.round(completion),
    docs, done, todo,
    daysActive: Math.round(daysActive),
    stage: s.stage, prime: s.prime, efficient: s.efficient,
    stageName: petlogic.STAGE_NAMES[s.stage],
  };
}

function petsSummary() {
  const gates = gatesSummary();
  const byName = Object.fromEntries(gates.map((g) => [g.name, g]));
  const pets = readJson(petsPath(), []);
  // persist primeEver so a prime badge survives later slow-downs
  let changed = false;
  const out = pets.map((pet) => {
    const d = decoratePet(pet, byName);
    if (d.prime && !pet.primeEver) { pet.primeEver = true; changed = true; }
    return { ...d, primeEver: pet.primeEver || d.prime };
  });
  if (changed) writeJson(petsPath(), pets);
  return out;
}

function keptCount() {
  return readJson(petsPath(), []).filter((x) => x.status === 'kept').length;
}

// Complete a project: keep the companion on display (max 3) or mint a card.
function completeProject(project, keep) {
  const pets = readJson(petsPath(), []);
  const idx = pets.findIndex((x) => x.project === project);
  if (idx < 0) return { ok: false, error: 'no companion for this project' };
  const gates = gatesSummary();
  const byName = Object.fromEntries(gates.map((g) => [g.name, g]));
  const d = decoratePet(pets[idx], byName);

  if (keep) {
    if (keptCount() >= 3) return { ok: false, error: 'display full', keptFull: true };
    pets[idx] = { ...pets[idx], status: 'kept', completedAt: new Date().toISOString(),
      finalStage: d.stage, finalCompletion: d.completion, primeEver: pets[idx].primeEver || d.prime };
    writeJson(petsPath(), pets);
    return { ok: true, kept: true };
  }

  const deck = readJson(deckPath(), []);
  deck.push({
    id: crypto.randomUUID(), project, species: pets[idx].species, rare: pets[idx].rare,
    colorway: pets[idx].colorway, prime: pets[idx].primeEver || d.prime,
    finalStage: d.stage, completion: d.completion, docs: d.docs,
    hatchedAt: pets[idx].hatchedAt, completedAt: new Date().toISOString(),
  });
  writeJson(deckPath(), deck);
  pets.splice(idx, 1);
  writeJson(petsPath(), pets);
  return { ok: true, carded: true };
}

// free a kept-display slot by minting that pet's card
function retireKeptPet(project) {
  return completeProject(project, false);
}

function deckList() {
  return readJson(deckPath(), []).sort((a, b) => String(b.completedAt).localeCompare(String(a.completedAt)));
}

// ---------- page markup overlays (stamps + redaction + doodles) ----------
// Stored per page in a sidecar so the .md stays clean; coords are fractions
// (0..1) of the sheet so they survive any resize. Baked into blueprint/export.

function overlayKey(rel) {
  try { return matter(fs.readFileSync(resolveRel(rel), 'utf8')).data.doc || rel.split('/').join('__'); }
  catch { return rel.split('/').join('__'); }
}
function overlayPath(rel) {
  const d = p('.bludos', 'overlays');
  fs.mkdirSync(d, { recursive: true });
  return path.join(d, safeName(overlayKey(rel)) + '.json');
}
function readOverlay(rel) {
  return readJson(overlayPath(rel), { stamps: [], redactions: [], doodles: [] });
}
function writeOverlay(rel, data) {
  writeJson(overlayPath(rel), {
    stamps: data.stamps || [], redactions: data.redactions || [], doodles: data.doodles || [],
  });
  return true;
}

// render overlay elements as absolutely-positioned HTML for blueprint/export.
// forExport = true bakes redactions fully opaque black.
function overlayHtml(rel, forExport) {
  const o = readOverlay(rel);
  const parts = [];
  for (const r of o.redactions || []) {
    parts.push(`<div style="position:absolute;left:${r.x * 100}%;top:${r.y * 100}%;width:${r.w * 100}%;height:${r.h * 100}%;background:#000;${forExport ? '' : 'opacity:.88;'}"></div>`);
  }
  for (const s of o.stamps || []) {
    const col = s.color || '#b3271e';
    parts.push(`<div style="position:absolute;left:${s.x * 100}%;top:${s.y * 100}%;transform:translate(-50%,-50%) rotate(${s.rot || -8}deg);border:3px solid ${col};color:${col};font-family:'Cascadia Mono',Consolas,monospace;font-weight:700;letter-spacing:.08em;padding:4px 12px;border-radius:4px;opacity:.82;font-size:16px;text-transform:uppercase;">${s.text || s.kind}</div>`);
  }
  if (!parts.length && !(o.doodles || []).length) return '';
  let svg = '';
  if ((o.doodles || []).length) {
    const paths = o.doodles.map((d) => `<path d="${d.path}" fill="none" stroke="${d.color || '#b3271e'}" stroke-width="${d.width || 0.4}" stroke-linecap="round"/>`).join('');
    svg = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;">${paths}</svg>`;
  }
  return `<div style="position:absolute;inset:0;pointer-events:none;">${svg}${parts.join('')}</div>`;
}

// ---------- reminders ----------

const remindersPath = () => p('.bludos', 'reminders.json');

function listReminders() {
  return readJson(remindersPath(), []).sort((a, b) => String(a.dueISO).localeCompare(String(b.dueISO)));
}

function addReminder(r) {
  const list = readJson(remindersPath(), []);
  list.push({
    id: crypto.randomUUID(),
    text: String(r.text || 'Reminder').slice(0, 300),
    dueISO: r.dueISO,
    rel: r.rel || '',
    project: r.project || '',
    created: new Date().toISOString(),
    fired: false,
    done: false,
  });
  writeJson(remindersPath(), list);
  return listReminders();
}

function markReminders(ids, patch) {
  const set = new Set(ids);
  const list = readJson(remindersPath(), []).map((r) => (set.has(r.id) ? { ...r, ...patch } : r));
  writeJson(remindersPath(), list);
  return listReminders();
}

function removeReminder(id) {
  writeJson(remindersPath(), readJson(remindersPath(), []).filter((r) => r.id !== id));
  return listReminders();
}

function dueReminders() {
  const now = Date.now();
  return readJson(remindersPath(), []).filter((r) => !r.done && !r.fired && new Date(r.dueISO).getTime() <= now);
}

// ---------- wiki-links & backlinks ----------
// [[Doc no or Title]] links pages. Resolution prefers exact doc id, then title.

function allPagesFlat() {
  const out = [];
  for (const proj of getTree().projects) {
    for (const folder of proj.folders) {
      for (const pg of folder.pages) {
        let doc = '';
        try { doc = (matter(fs.readFileSync(resolveRel(pg.rel), 'utf8')).data || {}).doc || ''; } catch { /* skip */ }
        out.push({ rel: pg.rel, title: pg.title, doc, project: proj.name });
      }
    }
  }
  return out;
}

function resolveWiki(target) {
  const t = String(target).trim().toLowerCase();
  const pages = allPagesFlat();
  return (
    pages.find((p) => p.doc && p.doc.toLowerCase() === t) ||
    pages.find((p) => p.title.toLowerCase() === t) ||
    pages.find((p) => p.title.toLowerCase().includes(t)) ||
    null
  );
}

function backlinks(rel) {
  const me = allPagesFlat().find((p) => p.rel === rel);
  if (!me) return [];
  const targets = new Set([me.title.toLowerCase(), (me.doc || '').toLowerCase()].filter(Boolean));
  const out = [];
  for (const p of allPagesFlat()) {
    if (p.rel === rel) continue;
    let raw = '';
    try { raw = fs.readFileSync(resolveRel(p.rel), 'utf8'); } catch { continue; }
    for (const m of raw.matchAll(/\[\[([^\]]+)\]\]/g)) {
      if (targets.has(m[1].trim().toLowerCase())) { out.push({ rel: p.rel, title: p.title, project: p.project }); break; }
    }
  }
  return out;
}

// ---------- blueprint mode (cyanotype render + title block + PDF) ----------

function blueprintHtml(rel) {
  const { mdToHtml } = require('./md2html.cjs');
  const page = readPage(rel);
  const meta = page.meta || {};
  const parts = rel.split('/');
  const tb = (l, v) => `<tr><td>${l}</td><td>${v || '—'}</td></tr>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${page.title}</title><style>
@page { size: A4; margin: 8mm; }
body { background:#0e2a52; color:#eaf2ff; font-family:'Segoe UI',sans-serif; margin:0; }
.bp { position:relative; min-height:275mm; border:2px solid #eaf2ff; outline:1px solid #eaf2ff; outline-offset:-6px; overflow:hidden;
  padding:12mm 12mm 62mm; box-sizing:border-box;
  background-image: linear-gradient(rgba(234,242,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(234,242,255,.08) 1px, transparent 1px);
  background-size: 10mm 10mm; }
h1,h2,h3 { font-family:'Cascadia Mono',Consolas,monospace; text-transform:uppercase; letter-spacing:.08em; color:#fff; }
h2 { border-bottom:1px solid rgba(234,242,255,.5); padding-bottom:4px; }
table { border-collapse:collapse; width:100%; margin:10px 0; font-size:11.5px; }
th,td { border:1px solid rgba(234,242,255,.6); padding:5px 8px; text-align:left; }
th { font-family:Consolas,monospace; text-transform:uppercase; font-size:9.5px; letter-spacing:.08em; }
code { border:1px solid rgba(234,242,255,.5); padding:1px 5px; font-size:11px; font-family:Consolas,monospace; }
blockquote { border-left:3px solid #eaf2ff; margin-left:0; padding-left:12px; }
.task{margin:2px 0}.task.done{opacity:.6;text-decoration:line-through}.box{margin-right:6px}
a { color:#bcd8ff } img { max-width:100% } hr { border:none; border-top:1px dashed rgba(234,242,255,.5); }
.bp-head { display:flex; justify-content:space-between; font-family:Consolas,monospace; font-size:10px;
  letter-spacing:.24em; border-bottom:2px solid #eaf2ff; padding-bottom:6px; margin-bottom:8mm; }
.titleblock { position:absolute; right:10mm; bottom:10mm; width:96mm; border:2px solid #eaf2ff; background:#0e2a52; }
.titleblock table { margin:0; font-size:9.5px; }
.titleblock td { border:1px solid rgba(234,242,255,.6); padding:3px 6px; font-family:Consolas,monospace; }
.titleblock td:first-child { width:32mm; text-transform:uppercase; letter-spacing:.08em; opacity:.75; }
</style></head><body><div class="bp">
<div class="bp-head"><span>BLUDOS ◆ BLUEPRINT</span><span>${meta.doc || ''}</span></div>
${mdToHtml(page.markdown)}
${overlayHtml(rel, true)}
<div class="titleblock"><table>
${tb('Title', page.title)}${tb('Doc №', meta.doc)}${tb('Project', parts[0])}
${tb('Phase', parts.length >= 3 ? parts[1] : '(unfiled)')}${tb('Status / Rev', meta.status || 'Draft')}
${tb('Author', meta.author)}${tb('Updated', String(meta.updated || '').slice(0, 10))}
</table></div></div></body></html>`;
}

async function blueprintPdf(rel, destOverride) {
  const { BrowserWindow, dialog } = require('electron');
  let dest = destOverride;
  if (!dest) {
    const res = await dialog.showSaveDialog({
      title: 'Save blueprint PDF',
      defaultPath: path.basename(rel, '.md') + ' — blueprint.pdf',
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (res.canceled || !res.filePath) return { ok: false, canceled: true };
    dest = res.filePath;
  }
  const tmp = p('.bludos', 'blueprint-tmp.html');
  fs.writeFileSync(tmp, blueprintHtml(rel));
  const win = new BrowserWindow({ show: false });
  try {
    await win.loadFile(tmp);
    const pdf = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4' });
    fs.writeFileSync(dest, pdf);
  } finally {
    win.destroy();
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
  }
  if (!destOverride) shell.openPath(dest);
  return { ok: true, dest };
}

// ---------- gate room (program dashboard derived from checklists) ----------

function gatesSummary() {
  const tree = getTree();
  return tree.projects.map((proj) => ({
    name: proj.name,
    phases: proj.folders.filter((f) => !f.virtual).map((f) => {
      let done = 0, todo = 0;
      const statuses = {};
      for (const pg of f.pages) {
        try {
          const raw = fs.readFileSync(resolveRel(pg.rel), 'utf8');
          done += (raw.match(/- \[x\]/gi) || []).length;
          todo += (raw.match(/- \[ \]/g) || []).length;
          const st = (matter(raw).data || {}).status || 'Draft';
          statuses[st] = (statuses[st] || 0) + 1;
        } catch { /* unreadable page */ }
      }
      return { name: f.name, custom: !!f.custom, pages: f.pages.length, done, todo, statuses, firstRel: f.pages[0] ? f.pages[0].rel : null };
    }),
  }));
}

// ---------- tamper-evident lab notebook ----------
// Creating today's log seals the previous log: its SHA-256 goes into an
// append-only chain file, and the new log opens citing that hash.

function todayLog(project, dateStr) {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  const title = 'LOG ' + date;
  const folder = 'Living Docs';
  const dir = p(safeName(project), folder);
  if (fs.existsSync(path.join(dir, title + '.md'))) {
    return { rel: [safeName(project), folder, title + '.md'].join('/'), created: false };
  }
  const chainPath = p('.bludos', 'logchain.json');
  const prevLogs = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => /^LOG \d{4}-\d{2}-\d{2}\.md$/.test(f)).sort()
    : [];
  let prevLine = 'GENESIS';
  if (prevLogs.length) {
    const prevFile = prevLogs[prevLogs.length - 1];
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, prevFile))).digest('hex');
    const chain = readJson(chainPath, []);
    chain.push({ project: safeName(project), file: prevFile, sha256: hash, sealed: new Date().toISOString() });
    writeJson(chainPath, chain);
    prevLine = prevFile.replace(/\.md$/, '') + ' · ' + hash.slice(0, 12);
  }
  const body = '`NOTEBOOK ▮ CHAIN PREV: ' + prevLine + '`\n\n## ' + date + '\n\n- ' + new Date().toTimeString().slice(0, 5) + ' — ';
  const rel = createPage(project, folder, title, body);
  return { rel, created: true };
}

function verifyLogChain() {
  return readJson(p('.bludos', 'logchain.json'), []).map((e) => {
    let ok = false, missing = false;
    try {
      ok = crypto.createHash('sha256').update(fs.readFileSync(p(e.project, 'Living Docs', e.file))).digest('hex') === e.sha256;
    } catch { missing = true; }
    return { ...e, ok, missing };
  });
}

// ---------- archive contact sheet ----------

async function contactSheet(ids, destOverride) {
  const items = readJson(archiveIndexPath(), []).filter((a) => ids.includes(a.id));
  if (!items.length) return { ok: false, error: 'No assets selected' };
  let base = destOverride;
  if (!base) {
    const { dialog } = require('electron');
    const res = await dialog.showOpenDialog({ title: 'Choose destination for the contact sheet', properties: ['openDirectory', 'createDirectory'] });
    if (res.canceled || !res.filePaths[0]) return { ok: false, canceled: true };
    base = res.filePaths[0];
  }
  const dir = path.join(base, 'Bludos Contact Sheet ' + new Date().toISOString().slice(0, 10));
  fs.mkdirSync(path.join(dir, 'img'), { recursive: true });
  const cards = items.map((a) => {
    let src = '';
    if (a.file && fs.existsSync(path.join(archiveDir(), a.file))) {
      fs.copyFileSync(path.join(archiveDir(), a.file), path.join(dir, 'img', a.file));
      src = 'img/' + a.file;
    }
    const thumb = a.kind === 'image' && src
      ? `<img src="${src}">`
      : `<div class="glyph">${(a.kind || 'file').toUpperCase()}</div>`;
    return `<div class="card"><div class="code"><span>${(a.kind || 'file').toUpperCase()}</span><span>${String(a.added || '').slice(0, 10)}</span></div>
${thumb}<div class="bar"></div><div class="nm">${a.name}</div><div class="tags">${(a.tags || []).join(' · ') || '—'}</div>
${a.sourceUrl ? `<div class="tags">${a.sourceUrl}</div>` : ''}</div>`;
  }).join('\n');
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Bludos contact sheet</title><style>
@page { size: A4 landscape; margin: 8mm; } body { background:#12151c; font-family:'Segoe UI',sans-serif; margin:0; padding:18px; }
h1 { color:#dde3ee; font-family:Consolas,monospace; font-size:13px; letter-spacing:.2em; }
.grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px,1fr)); gap:12px; }
.card { background:#f1f0ea; color:#191b16; border:1px solid #8a93a3; padding:7px; page-break-inside:avoid; }
.code { display:flex; justify-content:space-between; font-family:Consolas,monospace; font-size:8.5px; letter-spacing:.1em; color:#77796e; border-bottom:1px solid #d8d6cc; padding-bottom:4px; margin-bottom:6px; }
img { width:100%; height:120px; object-fit:cover; border:1px solid #d8d6cc; }
.glyph { height:120px; display:flex; align-items:center; justify-content:center; font-family:Consolas,monospace; font-weight:700; letter-spacing:.2em; background:#e9e8e0; border:1px solid #d8d6cc; }
.bar { height:10px; margin:6px 0 4px; background:repeating-linear-gradient(90deg,#191b16 0 1px,transparent 1px 4px,#191b16 4px 6px,transparent 6px 9px); opacity:.75; }
.nm { font-size:11px; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.tags { font-family:Consolas,monospace; font-size:8.5px; color:#77796e; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
</style></head><body><h1>BLU_DOS ▮ CONTACT SHEET · ${items.length} ASSETS · ${new Date().toISOString().slice(0, 10)}</h1>
<div class="grid">${cards}</div></body></html>`;
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  if (!destOverride) shell.openPath(path.join(dir, 'index.html'));
  return { ok: true, dest: dir, count: items.length };
}

// ---------- page media (images pasted/dropped into documents) ----------

function mediaDir(projectName) {
  const d = p(safeName(projectName), '_media');
  fs.mkdirSync(d, { recursive: true });
  return d;
}

function relFromPage(rel, mediaAbs) {
  const pageDir = path.dirname(resolveRel(rel));
  return path.relative(pageDir, mediaAbs).split(path.sep).join('/');
}

function mediaSave(rel, suggestedName, bytes) {
  const dir = mediaDir(rel.split('/')[0]);
  const ext = path.extname(suggestedName || '') || '.png';
  const base = (path.basename(suggestedName || 'pasted', ext).replace(/[^\w.-]+/g, '-') || 'img');
  const file = uniqueFile(dir, base + '-' + Date.now().toString(36), ext);
  fs.writeFileSync(path.join(dir, file), Buffer.from(bytes));
  return { ok: true, src: relFromPage(rel, path.join(dir, file)) };
}

function mediaImport(rel, srcPath) {
  const dir = mediaDir(rel.split('/')[0]);
  const ext = path.extname(srcPath);
  const file = uniqueFile(dir, path.basename(srcPath, ext), ext);
  fs.copyFileSync(srcPath, path.join(dir, file));
  return { ok: true, src: relFromPage(rel, path.join(dir, file)) };
}

async function mediaPick(rel) {
  const { dialog } = require('electron');
  const res = await dialog.showOpenDialog({
    title: 'Insert image',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'] }],
    properties: ['openFile'],
  });
  if (res.canceled || !res.filePaths[0]) return { ok: false };
  return mediaImport(rel, res.filePaths[0]);
}

// ---------- user templates ("Save page as template") ----------

function userTplDir() {
  const d = p('.bludos', 'templates');
  fs.mkdirSync(d, { recursive: true });
  return d;
}

function saveUserTemplate(rel) {
  const page = readPage(rel);
  let body = page.markdown;
  if (page.meta.doc) body = body.split(page.meta.doc).join('{{DOC}}');
  const created = String(page.meta.created || '').slice(0, 10);
  if (created) body = body.split(created).join('{{DATE}}');
  const file = uniqueFile(userTplDir(), safeName(page.title), '.md');
  fs.writeFileSync(path.join(userTplDir(), file), matter.stringify(body, { title: page.title, saved: new Date().toISOString() }));
  return { ok: true, title: page.title };
}

function listUserTemplates() {
  const d = userTplDir();
  return fs.readdirSync(d)
    .filter((f) => f.toLowerCase().endsWith('.md'))
    .map((f) => {
      const g = matter(fs.readFileSync(path.join(d, f), 'utf8'));
      const title = g.data.title || f.replace(/\.md$/i, '');
      return { id: 'user-' + f, title, roboOnly: false, body: g.content, bodyCore: g.content };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

// ---------- project export (FM.G-style package with integrity manifest) ----------

async function exportProject(projectName, destOverride) {
  let baseDest = destOverride;
  if (!baseDest) {
    const { dialog } = require('electron');
    const res = await dialog.showOpenDialog({
      title: 'Choose export destination folder',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (res.canceled || !res.filePaths[0]) return { ok: false, canceled: true };
    baseDest = res.filePaths[0];
  }
  const proj = safeName(projectName);
  const srcDir = p(proj);
  if (!fs.existsSync(srcDir)) return { ok: false, error: 'Project not found: ' + proj };

  const destDir = path.join(baseDest, `${proj} - Bludos Export ${new Date().toISOString().slice(0, 10)}`);
  fs.mkdirSync(destDir, { recursive: true });

  const manifest = [];
  const addFile = (srcAbs, relOut) => {
    const buf = fs.readFileSync(srcAbs);
    const outAbs = path.join(destDir, relOut);
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    fs.writeFileSync(outAbs, buf);
    manifest.push({ rel: relOut, size: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') });
  };

  const addBuf = (buf, relOut) => {
    const outAbs = path.join(destDir, relOut);
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    fs.writeFileSync(outAbs, buf);
    manifest.push({ rel: relOut, size: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex') });
  };

  const { mdToHtml } = require('./md2html.cjs');
  const htmlShell = (title, bodyHtml, backLink) => `<!doctype html><html><head><meta charset="utf-8"><title>${title} — Bludos</title>
<style>
body{background:#12151c;margin:0;padding:36px 16px;font-family:'Segoe UI',system-ui,sans-serif}
.sheet{max-width:860px;margin:0 auto;background:#f1f0ea;color:#191b16;border:1px solid #8a93a3;padding:40px 48px;line-height:1.6}
h1,h2,h3{font-family:'Cascadia Mono',Consolas,monospace}h2{border-bottom:1px solid #d8d6cc;padding-bottom:4px}
table{border-collapse:collapse;width:100%;margin:12px 0;font-size:13px}
th,td{border:1px solid #d8d6cc;padding:6px 10px;text-align:left}
th{background:rgba(25,27,22,.05);font-family:Consolas,monospace;font-size:11px;text-transform:uppercase;letter-spacing:.06em}
code{background:rgba(25,27,22,.07);border:1px solid #d8d6cc;padding:1px 5px;border-radius:3px;font-size:12px}
blockquote{border-left:3px solid #9dc20e;margin-left:0;padding-left:14px;color:#4a4d42}
.task{margin:3px 0}.task.done{color:#77796e;text-decoration:line-through}.box{margin-right:6px}
hr{border:none;border-top:1px dashed #d8d6cc}img{max-width:100%}
.top{font-family:Consolas,monospace;font-size:10px;letter-spacing:.14em;color:#77796e;border-bottom:2px solid #191b16;padding-bottom:8px;margin-bottom:20px;display:flex;justify-content:space-between}
a{color:#2b6cb0}
</style></head><body><div class="sheet"><div class="top"><span>${backLink ? '<a href="' + backLink + '">◂ INDEX</a> · ' : ''}BLU_DOS EXPORT</span><span>${new Date().toISOString().slice(0, 10)}</span></div>
${bodyHtml}</div></body></html>`;

  const htmlIndexRows = [];
  for (const folder of PHASE_FOLDERS) {
    const fp = path.join(srcDir, folder);
    if (!fs.existsSync(fp)) continue;
    for (const f of fs.readdirSync(fp).filter((x) => x.toLowerCase().endsWith('.md'))) {
      addFile(path.join(fp, f), path.join(folder, f));
      const g = matter(fs.readFileSync(path.join(fp, f), 'utf8'));
      const htmlName = f.replace(/\.md$/i, '.html');
      addBuf(
        Buffer.from(htmlShell(g.data.title || f, mdToHtml(g.content), '../index.html')),
        path.join('HTML', folder, htmlName)
      );
      htmlIndexRows.push({ folder, title: g.data.title || f.replace(/\.md$/i, ''), href: `${folder}/${htmlName}`, doc: g.data.doc || '', status: g.data.status || '' });
    }
  }
  // media referenced by pages (../_media/... works identically from HTML/<folder>/)
  const mDir = path.join(srcDir, '_media');
  if (fs.existsSync(mDir)) {
    for (const f of fs.readdirSync(mDir)) {
      const abs = path.join(mDir, f);
      if (!fs.statSync(abs).isFile()) continue;
      addFile(abs, path.join('_media', f));
      addFile(abs, path.join('HTML', '_media', f));
    }
  }
  for (const a of readJson(archiveIndexPath(), [])) {
    if (a.file && a.project === proj && fs.existsSync(path.join(archiveDir(), a.file))) {
      addFile(path.join(archiveDir(), a.file), path.join('_assets', a.file));
    }
  }
  // human-readable index for non-designers (execs, PMs) opening the package
  let indexBody = `<h1>${proj}</h1><p><em>Bludos export — readable copy. The canonical Markdown files sit alongside this HTML folder.</em></p>`;
  let lastFolder = '';
  for (const r of htmlIndexRows) {
    if (r.folder !== lastFolder) { indexBody += `<h2>${r.folder}</h2>`; lastFolder = r.folder; }
    indexBody += `<div class="task"><span class="box">▸</span><a href="${r.href}">${r.title}</a> ${r.doc ? '<code>' + r.doc + '</code>' : ''} ${r.status ? '<code>' + r.status + '</code>' : ''}</div>`;
  }
  addBuf(Buffer.from(htmlShell(proj, indexBody, '')), path.join('HTML', 'index.html'));

  const lines = [
    `# EXPORT MANIFEST ▮ ${proj}`,
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| Exported | ${new Date().toISOString()} |`,
    `| Source workspace | ${ROOT} |`,
    `| Files | ${manifest.length} |`,
    '| Generator | Bludos — blue dossier |',
    '',
    '## File Integrity (SHA-256)',
    '',
    '| File | Bytes | SHA-256 |',
    '| --- | --- | --- |',
    ...manifest.map((m) => `| ${m.rel.split(path.sep).join('/')} | ${m.size} | \`${m.sha256}\` |`),
    '',
    '*Verify: recompute SHA-256 of each file and compare. Any mismatch means the archive was altered after export.*',
  ];
  fs.writeFileSync(path.join(destDir, 'MANIFEST.md'), lines.join('\n'));

  if (!destOverride) shell.openPath(destDir);
  return { ok: true, dest: destDir, files: manifest.length };
}

// ---------- Microsoft Teams share (incoming webhook / Workflows webhook) ----------

async function teamsShare(rel) {
  const url = String(getSettings().teamsWebhookUrl || '').trim();
  if (!url) return { ok: false, error: 'No Teams webhook URL configured.' };

  const page = readPage(rel);
  const parts = rel.split('/');
  const project = parts[0];
  const phase = parts.length >= 3 ? parts[1] : '(unfiled)';
  const done = (page.markdown.match(/- \[x\]/gi) || []).length;
  const todo = (page.markdown.match(/- \[ \]/g) || []).length;
  const snippet = page.markdown
    .replace(/[#>*`\[\]|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 280);

  const facts = [{ title: 'Status', value: String(page.meta.status || 'Draft') }];
  if (done + todo > 0) facts.push({ title: 'Checklist', value: `${done} / ${done + todo} done` });
  facts.push({ title: 'Updated', value: new Date(page.meta.updated || Date.now()).toLocaleString() });

  const payload = {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      contentUrl: null,
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.4',
        body: [
          { type: 'TextBlock', size: 'Large', weight: 'Bolder', text: '◆ ' + page.title, wrap: true },
          { type: 'TextBlock', isSubtle: true, spacing: 'None', text: `Bludos · ${project} ▸ ${phase}`, wrap: true },
          { type: 'FactSet', facts },
          ...(snippet
            ? [{ type: 'TextBlock', text: snippet + (page.markdown.length > 280 ? '…' : ''), wrap: true, spacing: 'Medium' }]
            : []),
        ],
      },
    }],
  };

  try {
    const res = await net.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `Teams responded with HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = {
  initWorkspace, info, getTree, createProject,
  createPage, readPage, writePage, renamePage, setStatus,
  trashPage, listTrash, restoreTrash,
  archiveList, archiveAddFiles, archiveAddUrl, archiveUpdate, archiveRemove, archiveOpen,
  search, getSettings, setSettings, teamsShare, exportProject,
  getConfig, setConfig, chooseWorkspace, reconcileArchive, openRoot,
  mediaSave, mediaImport, mediaPick,
  saveUserTemplate, listUserTemplates,
  archiveReadB64, resolveWiki, backlinks, allPagesFlat,
  listReminders, addReminder, markReminders, removeReminder, dueReminders,
  readOverlay, writeOverlay, overlayHtml,
  activitySummary, musicList, musicImport, musicPick, musicRemove,
  archiveAddBytes, petsSummary, completeProject, retireKeptPet, deckList,
  blueprintHtml, blueprintPdf, gatesSummary,
  listRevisions, readRevision, todayLog, verifyLogChain, contactSheet,
};
