// Headless end-to-end test of the workspace backend. Run: npx electron scripts/smoke.cjs
const { app } = require('electron');
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const ws = require('../electron/workspace.cjs');

app.whenReady().then(async () => {
  const name = 'Smoke Test ' + Date.now();
  const runStart = new Date().toISOString();
  let prevCfg = {};
  try {
    ws.initWorkspace();
    prevCfg = ws.getConfig();
    ws.setConfig({ userName: 'Auditor' });

    // --- template integrity (A2): no gate item split inside parentheses ---
    const packs = require('../src/templates.json');
    for (const p of packs) {
      for (const tpl of p.templates) {
        const bad = (tpl.body.match(/- \[ \] [^\n]*/g) || [])
          .filter((l) => l.split('(').length !== l.split(')').length);
        assert(bad.length === 0, `unbalanced parens in "${tpl.title}": ${bad[0] || ''}`);
      }
    }

    // --- pages ---
    const tree = ws.createProject(name);
    assert(tree.projects.some((p) => p.name === name), 'project created');

    const rel = ws.createPage(name, '01 Research & Discovery', 'PRD Smoke', '`DOC ▮ {{DOC}} · {{DATE}}`\n\n# Hello\n\n- [x] done item\n- [ ] item one anodization');
    const page = ws.readPage(rel);
    assert(page.markdown.includes('anodization'), 'page content roundtrip');
    assert(page.meta.status === 'Draft', 'frontmatter status');
    assert(/^BLU-P01-[0-9A-Z]{6}$/.test(page.meta.doc), 'doc id generated: ' + page.meta.doc);
    assert(!page.markdown.includes('{{DOC}}') && !page.markdown.includes('{{DATE}}'), 'template tokens substituted');
    assert(page.meta.author === 'Auditor', 'author stamped from config');

    // --- A1 guard: writing to a missing file must not create it ---
    const ghost = name + '/01 Research & Discovery/ghost.md';
    assert(ws.writePage(ghost, 'boo') === false, 'write to missing file refused');
    assert(!fs.existsSync(path.join(ws.info().root, name, '01 Research & Discovery', 'ghost.md')), 'ghost file not created');

    ws.writePage(rel, page.markdown + '\n\nmore text');
    assert(ws.readPage(rel).markdown.includes('more text'), 'page write');
    assert(ws.readPage(rel).meta.updatedBy === 'Auditor', 'updatedBy stamped');

    // --- B2 status lifecycle ---
    const st = ws.setStatus(rel, 'In Review');
    assert(st.status === 'In Review' && ws.readPage(rel).meta.status === 'In Review', 'status change persisted');

    assert(ws.search('anodization').some((r) => r.rel === rel), 'search finds page');

    const rel2 = ws.renamePage(rel, 'PRD Smoke Renamed');
    assert(rel2.endsWith('PRD Smoke Renamed.md'), 'rename');

    ws.trashPage(rel2);
    const trash1 = ws.listTrash();
    assert(trash1.some((t) => t.rel === rel2 && t.kind === 'page'), 'page trash listed with kind');
    const restored = ws.restoreTrash(trash1.find((t) => t.rel === rel2).id);
    assert(ws.readPage(restored.rel).markdown.includes('anodization'), 'restore roundtrip');

    // --- A4: files & folders created outside the app are visible ---
    fs.mkdirSync(path.join(ws.info().root, name, 'Sketches'), { recursive: true });
    fs.writeFileSync(path.join(ws.info().root, name, 'Sketches', 'External.md'), '# made outside the app');
    fs.writeFileSync(path.join(ws.info().root, name, 'Loose note.md'), 'root-level note');
    const t2 = ws.getTree().projects.find((p) => p.name === name);
    const sketches = t2.folders.find((f) => f.name === 'Sketches');
    assert(sketches && sketches.custom && sketches.pages.length === 1, 'custom folder visible');
    const unfiled = t2.folders.find((f) => f.virtual);
    assert(unfiled && unfiled.pages.some((x) => x.title === 'Loose note'), 'root-level file visible as unfiled');

    // unfiled pages are first-class: editable and case-only renamable
    assert(ws.writePage(name + '/Loose note.md', 'edited root note') === true, 'unfiled page writable');
    const caseRel = ws.renamePage(name + '/Loose note.md', 'LOOSE Note');
    assert(caseRel.endsWith('/LOOSE Note.md') && !caseRel.includes(' 2.md'), 'case-only rename without suffix: ' + caseRel);
    assert(ws.readPage(caseRel).markdown.includes('edited root note'), 'content survives case-only rename');

    // --- B1 media ---
    const med = ws.mediaImport(restored.rel, path.join(__dirname, '..', 'build', 'icon.ico'));
    assert(med.ok && med.src === '../_media/icon.ico', 'media import returns page-relative path: ' + med.src);
    assert(fs.existsSync(path.join(ws.info().root, name, '_media', 'icon.ico')), 'media file stored');
    assert(!ws.getTree().projects.find((p) => p.name === name).folders.some((f) => f.name === '_media'), '_media hidden from tree');

    // --- E3 user templates ---
    const savedTpl = ws.saveUserTemplate(restored.rel);
    assert(savedTpl.ok, 'user template saved');
    const userList = ws.listUserTemplates();
    const mine = userList.find((t) => t.title === 'PRD Smoke Renamed');
    assert(mine && mine.body.includes('{{DOC}}'), 'user template listed with doc token restored');

    // --- archive: url + file, checksums, search ---
    let list = ws.archiveAddUrl('https://example.com/moodboard', { tags: ['inspo'] });
    assert(list.some((a) => a.kind === 'link'), 'url archived');
    list = ws.archiveAddFiles([path.join(__dirname, '..', 'resources', 'v3-checklist.md')], { tags: ['reference'] });
    const fileAsset = list.find((a) => a.name === 'v3-checklist.md');
    assert(fileAsset && fileAsset.sha256.length === 64, 'file archived with sha256');
    assert(ws.search('inspo').some((r) => r.type === 'asset'), 'search finds asset by tag');

    // --- A3: asset delete goes to trash and restores ---
    list = ws.archiveRemove(fileAsset.id);
    assert(!list.some((a) => a.id === fileAsset.id), 'asset removed from archive');
    const assetTrash = ws.listTrash().find((t) => t.kind === 'asset' && t.title === 'v3-checklist.md');
    assert(assetTrash, 'asset landed in trash');
    ws.restoreTrash(assetTrash.id);
    const restoredAsset = ws.archiveList().find((a) => a.name === 'v3-checklist.md');
    assert(restoredAsset, 'asset restored from trash');

    // --- C3 reconcile: files appearing outside the app get indexed ---
    fs.writeFileSync(path.join(ws.info().root, '_archive', 'reconcile-test.txt'), 'external drop');
    ws.reconcileArchive();
    const rec = ws.archiveList().find((a) => a.name === 'reconcile-test.txt');
    assert(rec, 'externally added archive file reconciled into index');

    // --- Teams share against local mock ---
    const prevWebhook = ws.getSettings().teamsWebhookUrl || '';
    const received = [];
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => { received.push(JSON.parse(body)); res.writeHead(200); res.end('1'); });
    });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    ws.setSettings({ teamsWebhookUrl: '' });
    const noUrl = await ws.teamsShare(restored.rel);
    assert(!noUrl.ok && /configured/.test(noUrl.error), 'share without URL rejected cleanly');
    ws.setSettings({ teamsWebhookUrl: `http://127.0.0.1:${server.address().port}/hook` });
    const shareRes = await ws.teamsShare(restored.rel);
    assert(shareRes.ok, 'teams share delivered: ' + (shareRes.error || ''));
    const card = received[0].attachments[0].content;
    assert(card.type === 'AdaptiveCard' && card.body[0].text.includes('PRD Smoke Renamed'), 'adaptive card payload');
    server.close();
    ws.setSettings({ teamsWebhookUrl: prevWebhook });

    // --- E4 export: markdown + HTML + manifest ---
    const exportBase = fs.mkdtempSync(path.join(os.tmpdir(), 'bludos-export-'));
    const exp = await ws.exportProject(name, exportBase);
    assert(exp.ok && exp.files >= 1, 'export ran: ' + JSON.stringify(exp));
    const manifestText = fs.readFileSync(path.join(exp.dest, 'MANIFEST.md'), 'utf8');
    assert(manifestText.includes('SHA-256') && manifestText.includes('PRD Smoke Renamed'), 'manifest lists exported page');
    assert(fs.existsSync(path.join(exp.dest, '01 Research & Discovery', 'PRD Smoke Renamed.md')), 'exported md exists');
    assert(fs.existsSync(path.join(exp.dest, 'HTML', 'index.html')), 'HTML index exists');
    assert(fs.existsSync(path.join(exp.dest, 'HTML', '01 Research & Discovery', 'PRD Smoke Renamed.html')), 'HTML page exists');
    assert(fs.existsSync(path.join(exp.dest, 'HTML', '_media', 'icon.ico')), 'HTML media copied');
    const htmlOut = fs.readFileSync(path.join(exp.dest, 'HTML', '01 Research & Discovery', 'PRD Smoke Renamed.html'), 'utf8');
    assert(htmlOut.includes('<table') || htmlOut.includes('anodization'), 'HTML rendered content');
    fs.rmSync(exportBase, { recursive: true, force: true });

    console.log('SMOKE PASS');
  } catch (err) {
    console.error('SMOKE FAIL:', err.message);
    process.exitCode = 1;
  } finally {
    // cleanup: test project, test assets, user template, trash entries from this run
    try {
      const root = ws.info().root;
      for (const a of ws.archiveList()) {
        if (a.name === 'v3-checklist.md' || a.name === 'reconcile-test.txt' || (a.sourceUrl || '').includes('example.com')) {
          ws.archiveRemove(a.id);
        }
      }
      const trashIdxPath = path.join(root, '.bludos', 'trash.json');
      const tIdx = JSON.parse(fs.readFileSync(trashIdxPath, 'utf8'));
      const keep = [];
      for (const e of tIdx) {
        if (e.when >= runStart) {
          if (e.file) { try { fs.unlinkSync(path.join(root, '.bludos', 'trash', e.file)); } catch { /* gone */ } }
        } else keep.push(e);
      }
      fs.writeFileSync(trashIdxPath, JSON.stringify(keep, null, 2));
      for (const t of ws.listUserTemplates()) {
        if (t.title === 'PRD Smoke Renamed') {
          try { fs.unlinkSync(path.join(root, '.bludos', 'templates', t.id.slice(5))); } catch { /* gone */ }
        }
      }
      fs.rmSync(path.join(root, name), { recursive: true, force: true });
      ws.setConfig({ userName: prevCfg.userName || '' });
    } catch (e) { console.error('cleanup issue:', e.message); }
    app.quit();
  }
});
