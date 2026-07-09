// Headless end-to-end test of the workspace backend. Run: npx electron scripts/smoke.cjs
const { app } = require('electron');
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const ws = require('../electron/workspace.cjs');

// blueprintPdf opens+destroys a hidden BrowserWindow; without this listener
// Electron's default "quit when all windows close" would end the suite early.
app.on('window-all-closed', () => { /* keep running */ });

app.whenReady().then(async () => {
  const name = 'Smoke Test ' + Date.now();
  const runStart = new Date().toISOString();
  let prevCfg = {};
  let docId = '';
  let prevActivityToday;
  try {
    ws.initWorkspace();
    prevCfg = ws.getConfig();
    ws.setConfig({ userName: 'Auditor' });
    // snapshot today's activity count so this run doesn't inflate the real heatmap
    { const a = ws.activitySummary(); const t = a.days[a.days.length - 1]; prevActivityToday = t ? t.count : 0; }

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
    docId = page.meta.doc;
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

    // --- Blueprint mode: HTML + headless PDF ---
    const bph = ws.blueprintHtml(restored.rel);
    assert(bph.includes('titleblock') && bph.includes(page.meta.doc), 'blueprint html has title block + doc id');
    const bpDest = path.join(os.tmpdir(), 'bludos-bp-' + Date.now() + '.pdf');
    const bp = await ws.blueprintPdf(restored.rel, bpDest);
    assert(bp.ok && fs.readFileSync(bpDest).slice(0, 4).toString() === '%PDF', 'blueprint pdf rendered');
    fs.unlinkSync(bpDest);

    // --- Markup overlay round-trip + baked into blueprint export ---
    ws.writeOverlay(restored.rel, {
      stamps: [{ id: 's1', kind: 'APPROVED', text: 'APPROVED', color: '#1f8a4c', x: 0.5, y: 0.3, rot: -8 }],
      redactions: [{ id: 'r1', x: 0.1, y: 0.1, w: 0.2, h: 0.05 }],
      doodles: [],
    });
    const ovr = ws.readOverlay(restored.rel);
    assert(ovr.stamps.length === 1 && ovr.redactions.length === 1, 'overlay persisted');
    assert(/APPROVED/.test(ws.overlayHtml(restored.rel, true)), 'stamp baked into export html');
    assert(/background:#000/.test(ws.overlayHtml(restored.rel, true)), 'redaction baked as black');
    assert(/APPROVED/.test(ws.blueprintHtml(restored.rel)), 'overlay present in blueprint');
    ws.writeOverlay(restored.rel, { stamps: [], redactions: [], doodles: [] }); // reset

    // --- Gate Room summary counts checklist state ---
    const gproj = ws.gatesSummary().find((p2) => p2.name === name);
    const ph01 = gproj.phases.find((f) => f.name.startsWith('01'));
    assert(ph01 && ph01.pages >= 1 && ph01.done >= 1 && ph01.todo >= 1, 'gate summary checklist counts wrong: ' + JSON.stringify(ph01));

    // --- Revision vault: snapshots on status change ---
    ws.setStatus(restored.rel, 'Approved'); // second transition (first was In Review)
    const revs = ws.listRevisions(restored.rel);
    assert(revs.length >= 2, 'expected >=2 revisions, got ' + revs.length);
    assert(ws.readRevision(restored.rel, revs[0].file).markdown.includes('anodization'), 'revision content readable');

    // --- Lab notebook: chain seal + tamper detection ---
    const l1 = ws.todayLog(name, '2020-01-01');
    assert(l1.created, 'log day1 created');
    ws.writePage(l1.rel, ws.readPage(l1.rel).markdown + '\n- 10:00 — tested actuator');
    const l2 = ws.todayLog(name, '2020-01-02');
    assert(l2.created && ws.readPage(l2.rel).markdown.includes('CHAIN PREV: LOG 2020-01-01'), 'day2 cites day1 hash');
    let chain = ws.verifyLogChain().filter((c) => c.project === name);
    assert(chain.length === 1 && chain[0].ok, 'day1 sealed and verified');
    fs.appendFileSync(path.join(ws.info().root, name, 'Living Docs', 'LOG 2020-01-01.md'), 'tampered');
    chain = ws.verifyLogChain().filter((c) => c.project === name);
    assert(chain.length === 1 && chain[0].ok === false, 'tampering not detected');

    // --- Reminders CRUD + due detection ---
    ws.addReminder({ text: 'past due item', dueISO: new Date(Date.now() - 1000).toISOString(), project: name });
    ws.addReminder({ text: 'future item', dueISO: new Date(Date.now() + 3.6e6).toISOString(), project: name });
    let rem = ws.listReminders().filter((r) => r.project === name);
    assert(rem.length === 2, 'two reminders stored');
    assert(ws.dueReminders().some((r) => r.text === 'past due item'), 'past reminder is due');
    assert(!ws.dueReminders().some((r) => r.text === 'future item'), 'future reminder not due');
    ws.markReminders(ws.dueReminders().map((r) => r.id), { fired: true });
    assert(ws.dueReminders().length === 0 || !ws.dueReminders().some((r) => r.project === name), 'fired reminders no longer due');
    for (const r of rem) ws.removeReminder(r.id);
    assert(ws.listReminders().filter((r) => r.project === name).length === 0, 'reminders removed');

    // --- Activity bumped by page writes ---
    const act = ws.activitySummary();
    const today = new Date().toISOString().slice(0, 10);
    assert(act.days.some((d) => d.date === today && d.count > 0), 'today has activity from this run');
    assert(act.streak >= 1, 'streak >= 1');

    // --- Companion pet hatched with the project ---
    const myPet = ws.petsSummary().find((p2) => p2.project === name);
    assert(myPet, 'pet hatched for project');
    assert(myPet.species >= 0 && myPet.species <= 7, 'species in range');
    assert(myPet.stage >= 1 && myPet.stage <= 5, 'stage computed: ' + myPet.stage);
    assert(myPet.colorway >= 0 && myPet.colorway < 360, 'colorway hue set');

    // --- Complete project → mint achievement card ---
    const beforeDeck = ws.deckList().length;
    const comp = ws.completeProject(name, false);
    assert(comp.ok && comp.carded, 'project carded: ' + JSON.stringify(comp));
    assert(ws.deckList().length === beforeDeck + 1, 'deck gained a card');
    assert(!ws.petsSummary().some((p2) => p2.project === name), 'pet removed after carding');
    // clean the card we just minted
    { const dp = path.join(ws.info().root, '.bludos', 'deck.json'); const d = JSON.parse(fs.readFileSync(dp, 'utf8')).filter((c) => c.project !== name); fs.writeFileSync(dp, JSON.stringify(d, null, 2)); }

    // --- Sketch bytes land in the archive ---
    const onePx = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const sk = ws.archiveAddBytes('unit-sketch.png', onePx, { project: name, tags: ['sketch'] });
    assert(sk.ok && ws.archiveList().some((a) => a.file === sk.file), 'sketch saved to archive');
    ws.archiveRemove(ws.archiveList().find((a) => a.file === sk.file).id);

    // --- Wiki-links & backlinks ---
    const linker = ws.createPage(name, '00 Strategy & Systems Architecture', 'Linker', 'See [[PRD Smoke Renamed]] and [[' + docId + ']].');
    const target = ws.backlinks(restored.rel);
    assert(target.some((b) => b.rel === linker), 'backlink by title not found');
    assert(ws.resolveWiki('PRD Smoke Renamed') && ws.resolveWiki('PRD Smoke Renamed').rel === restored.rel, 'wiki resolve by title');
    assert(ws.resolveWiki(docId) && ws.resolveWiki(docId).rel === restored.rel, 'wiki resolve by doc id');
    assert(ws.resolveWiki('no such page') === null, 'wiki resolve miss returns null');
    ws.trashPage(linker);

    // --- Archive base64 read (for color extraction) ---
    const b64 = ws.archiveReadB64(restoredAsset.id);
    assert(b64 === null || (b64 && typeof b64.b64 === 'string'), 'archiveReadB64 shape'); // md asset → text, still base64able

    // --- Contact sheet ---
    const csBase = fs.mkdtempSync(path.join(os.tmpdir(), 'bludos-cs-'));
    const cs = await ws.contactSheet([restoredAsset.id], csBase);
    assert(cs.ok && cs.count === 1, 'contact sheet failed: ' + JSON.stringify(cs));
    assert(fs.existsSync(path.join(cs.dest, 'index.html')) && fs.existsSync(path.join(cs.dest, 'img', restoredAsset.file)), 'sheet html/asset missing');
    fs.rmSync(csBase, { recursive: true, force: true });

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
      // purge test entries from the log chain and revision vault
      const chainPath = path.join(root, '.bludos', 'logchain.json');
      if (fs.existsSync(chainPath)) {
        const c = JSON.parse(fs.readFileSync(chainPath, 'utf8')).filter((e) => e.project !== name);
        fs.writeFileSync(chainPath, JSON.stringify(c, null, 2));
      }
      if (docId) { try { fs.rmSync(path.join(root, '.bludos', 'revisions', docId), { recursive: true, force: true }); } catch { /* ignore */ } }
      if (docId) { try { fs.unlinkSync(path.join(root, '.bludos', 'overlays', docId + '.json')); } catch { /* ignore */ } }
      // remove any test companion / card / reminders and restore today's activity
      for (const f of ['pets.json', 'deck.json']) {
        const fp = path.join(root, '.bludos', f);
        if (fs.existsSync(fp)) {
          const arr = JSON.parse(fs.readFileSync(fp, 'utf8')).filter((x) => x.project !== name);
          fs.writeFileSync(fp, JSON.stringify(arr, null, 2));
        }
      }
      const remP = path.join(root, '.bludos', 'reminders.json');
      if (fs.existsSync(remP)) {
        const arr = JSON.parse(fs.readFileSync(remP, 'utf8')).filter((x) => x.project !== name);
        fs.writeFileSync(remP, JSON.stringify(arr, null, 2));
      }
      const actP = path.join(root, '.bludos', 'activity.json');
      if (fs.existsSync(actP) && prevActivityToday !== undefined) {
        const a = JSON.parse(fs.readFileSync(actP, 'utf8'));
        const today = new Date().toISOString().slice(0, 10);
        if (prevActivityToday === 0) delete a[today]; else a[today] = prevActivityToday;
        fs.writeFileSync(actP, JSON.stringify(a, null, 2));
      }
      ws.setConfig({ userName: prevCfg.userName || '' });
    } catch (e) { console.error('cleanup issue:', e.message); }
    app.quit();
  }
});
