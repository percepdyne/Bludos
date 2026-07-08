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
const waitFor = async (fn, timeout = 6000, every = 250) => {
  const t0 = Date.now();
  for (;;) {
    if (await fn()) return true;
    if (Date.now() - t0 > timeout) return false;
    await sleep(every);
  }
};
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

  let prevPins = [], prevRecents = [];
  try {
    const s0 = ws.getSettings();
    prevPins = s0.pinnedTools || [];
    prevRecents = s0.recentTools || [];

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
      const t = ws.getTree().projects.find((p) => p.name === PROJECT);
      const pg = t.folders.find((f) => f.name.startsWith('03')).pages[0];
      const saved = await waitFor(() => ws.readPage(pg.rel).markdown.includes('- [x]'));
      assert(saved, 'checked task not persisted as - [x] within 6s');
    });

    await step('status change persists to frontmatter', async () => {
      assert(await exec(`__setInput('select.status', 'Approved')`), 'status select not settable');
      const t = ws.getTree().projects.find((p) => p.name === PROJECT);
      const pg = t.folders.find((f) => f.name.startsWith('03')).pages[0];
      const saved = await waitFor(() => ws.readPage(pg.rel).meta.status === 'Approved');
      assert(saved, 'status not persisted within 6s');
    });

    await step('title rename via UI renames the file (with unsaved-edit flush)', async () => {
      // make an edit so the flush path is exercised, then rename immediately
      await exec(`document.querySelectorAll('.ProseMirror input[type=checkbox]')[1]?.click(); true`);
      await sleep(100); // still inside debounce window — deliberately dirty
      assert(await exec(`__setInput('.editor-title', 'DFMEA Renamed UI')`), 'title input not settable');
      await exec(`document.querySelector('.editor-title').blur(); true`);
      const dir = path.join(ws.info().root, PROJECT, '03 Detailed Engineering & DFx');
      const renamed = await waitFor(() => fs.readdirSync(dir).includes('DFMEA Renamed UI.md'));
      const files = fs.readdirSync(dir);
      assert(renamed, 'renamed file missing: ' + files.join(', '));
      assert(files.length === 1, 'old file resurrected (A1 regression): ' + files.join(', '));
      const g = ws.readPage(PROJECT + '/03 Detailed Engineering & DFx/DFMEA Renamed UI.md');
      assert(g.markdown.includes('- [x]'), 'pre-rename dirty edit lost');
    });

    await step('Blueprint Mode renders cyanotype with title block', async () => {
      assert(await exec(`__click('.editor-meta .tb[title*="Blueprint"]')`), 'blueprint button missing');
      await sleep(700);
      assert(await exec(`__has('.bp-modal iframe')`), 'blueprint iframe missing');
      const srcdoc = await exec(`document.querySelector('.bp-frame').getAttribute('srcdoc') || ''`);
      assert(srcdoc.includes('titleblock') && srcdoc.includes('BLUEPRINT'), 'blueprint html incomplete');
      await exec(`__click('.bp-modal .close'); true`);
      await sleep(200);
    });

    await step('QR sample tag generates a scannable label', async () => {
      assert(await exec(`__click('.editor-meta .tb[title*="QR sample"]')`), 'tag button missing');
      const hasQr = await waitFor(async () =>
        ((await exec(`(document.querySelector('.tag-frame') || { getAttribute() { return ''; } }).getAttribute('srcdoc') || ''`)) || '').includes('data:image')
      );
      assert(hasQr, 'QR data URL missing from label');
      await exec(`__click('.tag-modal .close'); true`);
      await sleep(200);
    });

    await step('toolbox: battery calc inserts CALC block into the open document', async () => {
      assert(await exec(`__click('.sidebar-actions button', 'TOOLBOX')`), 'toolbox button missing');
      await sleep(300);
      assert(await exec(`__has('.toolbox')`), 'toolbox panel missing');
      const nTools = await exec(`__count('.tool-row')`);
      assert(nTools >= 50, `toolbox lists ${nTools} tools, expected >= 50`);
      assert(await exec(`__click('.tool-row', 'Battery Runtime')`), 'battery tool missing');
      await sleep(300);
      const tablesBefore = await exec(`__count('.ProseMirror table')`);
      assert(await exec(`__click('[data-tool=battery] .insert-block')`), 'battery insert button missing');
      await sleep(400);
      const tablesAfter = await exec(`__count('.ProseMirror table')`);
      assert(tablesAfter === tablesBefore + 1, `block not inserted as real table (${tablesBefore} → ${tablesAfter})`);
      const relPage = PROJECT + '/03 Detailed Engineering & DFx/DFMEA Renamed UI.md';
      // autosave is debounced 700ms — poll instead of racing a fixed sleep
      const saved = await waitFor(() => ws.readPage(relPage).markdown.includes('CALC ▮ battery-runtime'));
      assert(saved, 'CALC block not persisted to disk within 6s');
      const g = ws.readPage(relPage);
      assert(g.markdown.includes('| Runtime |'), 'calc results table not persisted');
      assert(g.markdown.includes('| Runtime |'), 'calc results table not persisted');
      assert(g.markdown.includes('Failure mode'), 'insert replaced existing content instead of appending');
      assert(g.markdown.indexOf('Failure mode') < g.markdown.indexOf('CALC ▮'), 'block not appended at end');
      await exec(`__click('.toolbox .close'); true`);
      await sleep(200);
    });

    await step('declarative tool (Ohm\'s Law) computes and inserts to disk', async () => {
      assert(await exec(`__click('.sidebar-actions button', 'TOOLBOX')`), 'toolbox button missing');
      await sleep(300);
      assert(await exec(`__click('.tool-row', "Ohm's Law")`), 'ohms-law tool row missing');
      await sleep(250);
      // defaults: 12 V, 0.5 A, R blank → live results should show 24 Ω and 6 W
      const txt = await exec(`document.querySelector('[data-tool=ohms-law] .tool-out').textContent`);
      assert(txt.includes('24') && txt.includes('6 W'), 'ohms-law live compute wrong: ' + txt.slice(0, 120));
      assert(await exec(`__click('[data-tool=ohms-law] .insert-block')`), 'ohms-law insert button missing');
      const relPage = PROJECT + '/03 Detailed Engineering & DFx/DFMEA Renamed UI.md';
      const saved = await waitFor(() => ws.readPage(relPage).markdown.includes('CALC ▮ ohms-law'));
      assert(saved, 'ohms-law CALC block not persisted within 6s');
      await exec(`__click('.toolbox .close'); true`);
      await sleep(200);
    });

    await step('toolbox search filters, Enter opens first match, pin works', async () => {
      assert(await exec(`__click('.sidebar-actions button', 'TOOLBOX')`), 'toolbox button missing');
      await sleep(300);
      assert(await exec(`__has('.toolbox-search')`), 'search box missing');
      assert(await exec(`__setInput('.toolbox-search', 'ziegler')`), 'search not settable');
      await sleep(250);
      const nRes = await exec(`__count('.tool-row')`);
      assert(nRes === 1, `expected exactly 1 match for "ziegler", got ${nRes}`);
      await exec(`document.querySelector('.toolbox-search').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); true`);
      await sleep(300);
      assert(await exec(`(document.querySelector('[data-tool="pid-zn"]')||{style:{}}).style.display === 'block'`), 'Enter did not open first match');
      assert(await exec(`__has('.toolbox-head button[title*="Reset"]')`), 'reset button missing in tool header');
      await exec(`__click('.tb', 'BACK'); true`);
      await sleep(150);
      await exec(`__setInput('.toolbox-search', ''); true`);
      await sleep(250);
      await exec(`document.querySelector('.tool-row .pin').click(); true`);
      await sleep(300);
      assert(await exec(`document.querySelector('.toolbox-body').textContent.includes('★ PINNED')`), 'pinned section did not appear');
      await exec(`__click('.toolbox .close'); true`);
      await sleep(150);
    });

    await step('all-tools sweep: every tool computes cleanly with defaults', async () => {
      assert(await exec(`__click('.sidebar-actions button', 'TOOLBOX')`), 'toolbox button missing');
      await sleep(300);
      const ids = await exec(`[...new Set([...document.querySelectorAll('.tool-row')].map((e) => e.dataset.tid))].filter(Boolean)`);
      assert(ids.length >= 50, `sweep found only ${ids.length} unique tools`);
      const bad = [];
      for (const id of ids) {
        await exec(`(document.querySelector('.tool-row[data-tid="${id}"]') || { click() {} }).click(); true`);
        await sleep(70);
        const txt = await exec(`(document.querySelector('[data-tool="${id}"] .tool-out') || {}).textContent || ''`);
        if (!/\d/.test(txt) || /NaN|check inputs/i.test(txt)) bad.push(`${id} → "${txt.slice(0, 60)}"`);
        await exec(`__click('.tb', 'BACK'); true`);
        await sleep(40);
      }
      assert(bad.length === 0, `${bad.length} tool(s) misbehaving: ` + bad.join(' | '));
      console.log(`  · swept ${ids.length} tools, all computed clean`);
      await exec(`__click('.toolbox .close'); true`);
      await sleep(150);
    });

    await step('Ctrl+L opens today\'s lab-notebook log', async () => {
      await exec(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l', ctrlKey: true })); true`);
      const today = new Date().toISOString().slice(0, 10);
      const logAbs = path.join(ws.info().root, PROJECT, 'Living Docs', 'LOG ' + today + '.md');
      assert(await waitFor(() => fs.existsSync(logAbs)), 'log file not created');
      await sleep(500);
      assert(await exec(`document.querySelector('.editor-title').value.startsWith('LOG ')`), 'log page not opened in editor');
    });

    await step('Gate Room dashboard renders program state', async () => {
      assert(await exec(`__click('.sidebar-actions button', 'GATE ROOM')`), 'gate room button missing');
      await sleep(600);
      assert(await exec(`__has('.gateroom')`), 'gate room view missing');
      assert(await exec(`document.querySelector('.gateroom').textContent.includes(${JSON.stringify(PROJECT)})`), 'fixture project missing');
      assert(await exec(`__count('.gate-cell') >= 12`), 'phase cells missing');
    });

    await step('settings: accent switch applies instantly via data attribute', async () => {
      assert(await exec(`__click('.sidebar-actions button', 'SETTINGS')`), 'settings button missing');
      await sleep(300);
      assert(await exec(`__has('.settings-modal')`), 'settings modal missing');
      assert(await exec(`__click('.settings-nav-item', 'Appearance')`), 'appearance section missing');
      await sleep(200);
      assert(await exec(`__click('.accent-swatch[data-a=cyan]')`), 'cyan swatch missing');
      await sleep(350);
      assert((await exec(`document.documentElement.dataset.accent`)) === 'cyan', 'accent not applied');
      await exec(`__click('.accent-swatch[data-a=lime]'); true`);
      await sleep(350);
      await exec(`__click('.settings-modal .close'); true`);
      await sleep(200);
    });

    await step('archive view renders label-sheet UI', async () => {
      assert(await exec(`__click('.sidebar-actions button', 'ARCHIVE')`), 'archive button missing');
      await sleep(400);
      assert(await exec(`__has('.archive')`), 'archive view missing');
      assert(await exec(`document.querySelector('.archive-head').textContent.includes('ARCHIVE_LOG')`), 'archive header missing');
    });

    await step('trench view renders (renamed trash)', async () => {
      assert(await exec(`__click('.sidebar-actions button', 'TRENCH')`), 'trench button missing');
      await sleep(400);
      assert(await exec(`__has('.trash')`), 'trench view missing');
      assert(await exec(`document.querySelector('.trash').textContent.includes('TRENCH_LOG')`), 'trench header missing');
    });

    await step('no renderer console errors during the whole run', async () => {
      assert(consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
    });
  } catch (err) {
    results.push(['FAIL', 'harness error — ' + err.message]);
  } finally {
    try { ws.setSettings({ pinnedTools: prevPins, recentTools: prevRecents }); } catch { /* ignore */ }
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
