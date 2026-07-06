// Headless end-to-end test of the workspace backend. Run: npx electron scripts/smoke.cjs
const { app } = require('electron');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ws = require('../electron/workspace.cjs');

app.whenReady().then(() => {
  const name = 'Smoke Test ' + Date.now();
  try {
    ws.initWorkspace();

    const tree = ws.createProject(name);
    assert(tree.projects.some((p) => p.name === name), 'project created');

    const rel = ws.createPage(name, '01 Research & Discovery', 'PRD Smoke', '# Hello\n\n- [ ] item one anodization');
    const page = ws.readPage(rel);
    assert(page.markdown.includes('anodization'), 'page content roundtrip');
    assert(page.meta.status === 'Draft', 'frontmatter status');

    ws.writePage(rel, page.markdown + '\n\nmore text');
    assert(ws.readPage(rel).markdown.includes('more text'), 'page write');

    assert(ws.search('anodization').some((r) => r.rel === rel), 'search finds page');

    const rel2 = ws.renamePage(rel, 'PRD Smoke Renamed');
    assert(rel2.endsWith('PRD Smoke Renamed.md'), 'rename');

    ws.trashPage(rel2);
    const trash = ws.listTrash();
    assert(trash.some((t) => t.rel === rel2), 'trash listed');
    const restored = ws.restoreTrash(trash.find((t) => t.rel === rel2).id);
    assert(ws.readPage(restored.rel).markdown.includes('anodization'), 'restore roundtrip');

    let list = ws.archiveAddUrl('https://example.com/moodboard', { tags: ['inspo'] });
    assert(list.some((a) => a.kind === 'link'), 'url archived');
    list = ws.archiveAddFiles([path.join(__dirname, '..', 'resources', 'v3-checklist.md')], { tags: ['reference'] });
    const fileAsset = list.find((a) => a.name === 'v3-checklist.md');
    assert(fileAsset && fileAsset.sha256.length === 64, 'file archived with sha256');
    assert(ws.search('inspo').some((r) => r.type === 'asset'), 'search finds asset by tag');

    // cleanup
    ws.archiveRemove(fileAsset.id);
    for (const a of ws.archiveList()) {
      if (a.kind === 'link' && a.name.includes('example.com')) ws.archiveRemove(a.id);
    }
    fs.rmSync(path.join(ws.info().root, name), { recursive: true, force: true });

    console.log('SMOKE PASS');
  } catch (err) {
    console.error('SMOKE FAIL:', err.message);
    process.exitCode = 1;
    try { fs.rmSync(path.join(ws.info().root, name), { recursive: true, force: true }); } catch { /* ignore */ }
  } finally {
    app.quit();
  }
});
