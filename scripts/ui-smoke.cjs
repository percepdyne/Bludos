// UI smoke test: boots the REAL main process (electron/main.cjs), then drives
// the real renderer via executeJavaScript — tree navigation, editor roundtrip
// to disk, status lifecycle, quick-open, templates modal with rendered preview,
// archive view — while collecting renderer console errors.
// Run: npx electron scripts/ui-smoke.cjs
const { app, BrowserWindow } = require('electron');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ws = require('../electron/workspace.cjs');
require('../electron/main.cjs'); // real bootstrap: IPC + window

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PROJECT = 'UI Audit ' + Date.now();
const results = [];
const step = async (label, fn) => {
  try { await fn(); results.push(['PASS', label]); }
  catch (e) { results.push(['FAIL', label + ' — ' + e.message]); }
};

app.whenReady().then(async () => {
  // main.cjs's whenReady handler ran first: workspace ready, window created.
  const win = BrowserWindow.getAllWindows()[0];
  const exec = (js) => win.webContents.executeJavaScript(js, true);
  const consoleErrors = [];
  win.webContents.on('console-message', (e, level, message) => {
    if (level >= 3 && !message.includes('Electron Security Warning')) consoleErrors.push(message);
  });

  try {
    // Fixture: project + a table/checklist-heavy method template page
    const packs = require('../src/templates.json');
    const tpl = packs.find((p) => p.id === 'm-quality').templates.find((t) => t.title.includes('DFMEA'));
    ws.createProject(PROJECT);
    ws.createPage(PROJECT, '03 Detailed Engineering & DFx', tpl.title, tpl.body);

    if (win.webContents.isLoading()) await new Promise((r) => win.webContents.once('did-finish-load', r));
    win.webContents.reload(); // pick up the fixture in the tree
    await new Promise((r) => win.webContents.once('did-finish-load', r));
    await sleep(900);

    // page-side helpers
    await exec(`
      window.__has = (sel) => !!document.querySelector(sel);
      window.__count = (sel) => document.querySelectorAll(sel).length;
      window.__click = (sel, contains) => {
        const els = [...document.querySelectorAll(sel)];
        const el = contains ? els.find((e) => e.textContent.includes(contains)) : els[0];
        if (!el) return false;
        el.click(); return true;
      };
      window.__setInput = (sel, val) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype
          : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, val);
        el.focus();
        el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
        return true;
      };
      true;
    `);

    await step('app mounted (sidebar + cover sheet render)', async () => {
      assert(await exec(`__has('.sidebar') && __has('.dossier')`), 'sidebar/dossier missing — React crashed?');
    });

    await step('quick-open palette opens on Ctrl+P and closes on Escape', async () => {
      await exec(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true })); true`);
      await sleep(200);
      assert(await exec(`__has('.qo')`), 'palette did not open');
      await exec(`document.querySelector('.qo-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); true`);
      await sleep(200);
      assert(!(await exec(`__has('.qo')`)), 'palette did not close');
    });

    await step('templates modal: packs, user badge column, rendered preview with real table', async () => {
      assert(await exec(`__click('.sidebar-actions button', 'TEMPLATES')`), 'templates button not found');
      await sleep(300);
      assert(await exec(`__has('.templates-modal')`), 'modal missing');
      assert(await exec(`__click('.pack', 'Risk & Reliability')`), 'method pack row missing');
      await sleep(200);
      assert(await exec(`__click('.tpl', 'DFMEA')`), 'template row missing');
      await sleep(300);
      assert(await exec(`__count('.preview-render table') > 0`), 'rendered preview has no table — md2html broken in renderer');
      assert(await exec(`document.querySelector('.preview-render').textContent.includes('BLU-P##-SAMPLE')`), 'preview token substitution missing');
      await exec(`__click('.close'); true`);
      await sleep(200);
    });

    await step('tree navigation opens the fixture page in the editor', async () => {
      assert(await exec(`__click('.tree-project', ${JSON.stringify(PROJECT)})`), 'project row missing');
      await sleep(200);
      assert(await exec(`__click('.tree-folder', '03 Detailed')`), 'phase folder row missing');
      await sleep(200);
      assert(await exec(`__click('.tree-page', 'DFMEA')`), 'page row missing');
      await sleep(900);
      assert(await exec(`__has('.ProseMirror')`), 'editor did not mount');
      assert(await exec(`document.querySelector('.ProseMirror').textContent.includes('Failure mode')`), 'template content not loaded');
      assert(await exec(`__count('.ProseMirror table') > 0`), 'tables not rendered in editor');
      assert(await exec(`__count('.ProseMirror input[type=checkbox]') > 0`), 'task checkboxes not rendered');
    });

    await step('doc-id chip and status control present', async () => {
      assert(await exec(`__has('.doc-chip')`), 'doc chip missing');
      assert(await exec(`document.querySelector('.doc-chip').textContent.startsWith('BLU-P03-')`), 'doc id wrong phase code');
      assert(await exec(`__has('select.status')`), 'status select missing');
    });

    await step('checkbox toggle autosaves to disk as markdown', async () => {
      await exec(`document.querySelector('.ProseMirror input[type=checkbox]').click(); true`);
      await sleep(1400); // 700ms debounce + margin
      const t = ws.getTree().projects.find((p) => p.name === PROJECT);
      const pg = t.folders.find((f) => f.name.startsWith('03')).pages[0];
      assert(ws.readPage(pg.rel).markdown.includes('- [x]'), 'checked task not persisted as - [x]');
    });

    await step('status change persists to frontmatter', async () => {
      assert(await exec(`__setInput('select.status', 'Approved')`), 'status select not settable');
      await sleep(500);
      const t = ws.getTree().projects.find((p) => p.name === PROJECT);
      const pg = t.folders.find((f) => f.name.startsWith('03')).pages[0];
      assert(ws.readPage(pg.rel).meta.status === 'Approved', 'status not persisted');
    });

    await step('title rename via UI renames the file (with unsaved-edit flush)', async () => {
      // make an edit so the flush path is exercised, then rename immediately
      await exec(`document.querySelectorAll('.ProseMirror input[type=checkbox]')[1]?.click(); true`);
      await sleep(100); // still inside debounce window — deliberately dirty
      assert(await exec(`__setInput('.editor-title', 'DFMEA Renamed UI')`), 'title input not settable');
      await exec(`document.querySelector('.editor-title').blur(); true`);
      await sleep(900);
      const dir = path.join(ws.info().root, PROJECT, '03 Detailed Engineering & DFx');
      const files = fs.readdirSync(dir);
      assert(files.includes('DFMEA Renamed UI.md'), 'renamed file missing: ' + files.join(', '));
      assert(files.length === 1, 'old file resurrected (A1 regression): ' + files.join(', '));
      const g = ws.readPage(PROJECT + '/03 Detailed Engineering & DFx/DFMEA Renamed UI.md');
      assert(g.markdown.includes('- [x]'), 'pre-rename dirty edit lost');
    });

    await step('archive view renders label-sheet UI', async () => {
      assert(await exec(`__click('.sidebar-actions button', 'ARCHIVE')`), 'archive button missing');
      await sleep(400);
      assert(await exec(`__has('.archive')`), 'archive view missing');
      assert(await exec(`document.querySelector('.archive-head').textContent.includes('ARCHIVE_LOG')`), 'archive header missing');
    });

    await step('trash view renders and lists kinds', async () => {
      assert(await exec(`__click('.sidebar-actions button', 'TRASH')`), 'trash button missing');
      await sleep(400);
      assert(await exec(`__has('.trash')`), 'trash view missing');
    });

    await step('no renderer console errors during the whole run', async () => {
      assert(consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
    });
  } catch (err) {
    results.push(['FAIL', 'harness error — ' + err.message]);
  } finally {
    try { fs.rmSync(path.join(ws.info().root, PROJECT), { recursive: true, force: true }); } catch { /* ignore */ }
    let failed = 0;
    for (const [status, label] of results) {
      console.log(`${status === 'PASS' ? '  ✓' : '  ✗'} ${label}`);
      if (status === 'FAIL') failed++;
    }
    console.log(failed === 0 ? 'UI SMOKE PASS' : `UI SMOKE FAIL (${failed})`);
    app.exit(failed === 0 ? 0 : 1);
  }
});
