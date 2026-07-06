const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pathToFileURL } = require('url');
const matter = require('gray-matter');
const { app, shell } = require('electron');

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

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function initWorkspace() {
  ROOT = path.join(app.getPath('documents'), 'Bludos Workspace');
  fs.mkdirSync(trashDir(), { recursive: true });
  fs.mkdirSync(archiveDir(), { recursive: true });
  if (!fs.existsSync(archiveIndexPath())) writeJson(archiveIndexPath(), []);
  if (!fs.existsSync(trashIndexPath())) writeJson(trashIndexPath(), []);
  cleanupTrash();
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
    const folders = [];
    for (const f of PHASE_FOLDERS) {
      const fp = path.join(dir, f);
      let pages = [];
      if (fs.existsSync(fp)) {
        pages = fs.readdirSync(fp)
          .filter((x) => x.toLowerCase().endsWith('.md'))
          .map((x) => ({ title: x.replace(/\.md$/i, ''), rel: [name, f, x].join('/') }))
          .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
      }
      folders.push({ name: f, pages });
    }
    projects.push({ name, folders });
  }
  projects.sort((a, b) => a.name.localeCompare(b.name));
  return { root: ROOT, projects };
}

function createProject(name) {
  const n = safeName(name);
  for (const f of PHASE_FOLDERS) fs.mkdirSync(p(n, f), { recursive: true });
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
  const fm = { title: file.replace(/\.md$/, ''), status: 'Draft', created: now, updated: now };
  fs.writeFileSync(path.join(dir, file), matter.stringify(markdown || '', fm));
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
  let data = {};
  try { data = matter(fs.readFileSync(abs, 'utf8')).data || {}; } catch { /* new file */ }
  data.updated = new Date().toISOString();
  fs.writeFileSync(abs, matter.stringify(markdown || '', data));
  return true;
}

function renamePage(rel, newTitle) {
  const abs = resolveRel(rel);
  const dir = path.dirname(abs);
  const base = safeName(newTitle);
  if (base === path.basename(abs, '.md')) return rel;
  const file = uniqueFile(dir, base, '.md');
  const g = matter(fs.readFileSync(abs, 'utf8'));
  g.data.title = file.replace(/\.md$/, '');
  g.data.updated = new Date().toISOString();
  fs.writeFileSync(abs, matter.stringify(g.content, g.data));
  fs.renameSync(abs, path.join(dir, file));
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
  idx.push({ id, rel, title: path.basename(abs, '.md'), when: new Date().toISOString() });
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
  const destAbs = resolveRel(entry.rel);
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  let target = destAbs;
  if (fs.existsSync(target)) {
    const dir = path.dirname(destAbs);
    target = path.join(dir, uniqueFile(dir, path.basename(destAbs, '.md') + ' (restored)', '.md'));
  }
  fs.renameSync(path.join(trashDir(), id + '.md'), target);
  writeJson(trashIndexPath(), idx.filter((x) => x.id !== id));
  return { rel: path.relative(ROOT, target).split(path.sep).join('/') };
}

function cleanupTrash() {
  const idx = readJson(trashIndexPath(), []);
  const cutoff = Date.now() - TRASH_RETENTION_DAYS * 24 * 3600 * 1000;
  const keep = [];
  for (const entry of idx) {
    if (new Date(entry.when).getTime() < cutoff) {
      try { fs.unlinkSync(path.join(trashDir(), entry.id + '.md')); } catch { /* already gone */ }
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
  if (entry && entry.file) {
    try { fs.unlinkSync(path.join(archiveDir(), entry.file)); } catch { /* already gone */ }
  }
  writeJson(archiveIndexPath(), idx.filter((x) => x.id !== id));
  return archiveList();
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

module.exports = {
  initWorkspace, info, getTree, createProject,
  createPage, readPage, writePage, renamePage,
  trashPage, listTrash, restoreTrash,
  archiveList, archiveAddFiles, archiveAddUrl, archiveUpdate, archiveRemove, archiveOpen,
  search,
};
