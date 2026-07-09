const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const ws = require('./workspace.cjs');

let mainWin = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    title: 'Bludos — Blue Dossier',
    backgroundColor: '#0d1b3e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.webContents.on('console-message', (e, level, message) => {
    if (level >= 2) console.log('[renderer]', message);
  });
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  mainWin = win;
}

// Poll for due reminders: native notification + in-app push, fired once each.
function startReminderLoop() {
  const tick = () => {
    try {
      const due = ws.dueReminders();
      if (!due.length) return;
      for (const r of due) {
        if (Notification.isSupported()) new Notification({ title: 'Bludos reminder', body: r.text }).show();
      }
      ws.markReminders(due.map((r) => r.id), { fired: true });
      if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send('reminder:fire', due);
    } catch { /* keep the loop alive */ }
  };
  setTimeout(tick, 4000);        // catch overdue soon after launch
  setInterval(tick, 30000);
}

function registerIpc() {
  const handlers = {
    'workspace:info': () => ws.info(),
    'tree:get': () => ws.getTree(),
    'project:create': (e, name) => ws.createProject(name),
    'project:export': (e, name) => ws.exportProject(name),
    'page:read': (e, rel) => ws.readPage(rel),
    'page:write': (e, rel, markdown) => ws.writePage(rel, markdown),
    'page:create': (e, project, phase, title, markdown) => ws.createPage(project, phase, title, markdown),
    'page:rename': (e, rel, newTitle) => ws.renamePage(rel, newTitle),
    'page:trash': (e, rel) => ws.trashPage(rel),
    'trash:list': () => ws.listTrash(),
    'trash:restore': (e, id) => ws.restoreTrash(id),
    'archive:list': () => ws.archiveList(),
    'archive:add-files': (e, paths, meta) => ws.archiveAddFiles(paths, meta),
    'archive:add-url': (e, url, meta) => ws.archiveAddUrl(url, meta),
    'archive:update': (e, id, patch) => ws.archiveUpdate(id, patch),
    'archive:remove': (e, id) => ws.archiveRemove(id),
    'archive:open': (e, id) => ws.archiveOpen(id),
    'search:query': (e, q) => ws.search(q),
    'settings:get': () => ws.getSettings(),
    'settings:set': (e, patch) => ws.setSettings(patch),
    'teams:share': (e, rel) => ws.teamsShare(rel),
    'config:get': () => ws.getConfig(),
    'config:set': (e, patch) => ws.setConfig(patch),
    'workspace:open-folder': () => ws.openRoot(),
    'workspace:choose': async (e) => {
      const r = await ws.chooseWorkspace();
      if (r.ok) setTimeout(() => e.sender.reload(), 100);
      return r;
    },
    'page:set-status': (e, rel, status) => ws.setStatus(rel, status),
    'media:save': (e, rel, name, bytes) => ws.mediaSave(rel, name, bytes),
    'media:import': (e, rel, src) => ws.mediaImport(rel, src),
    'media:pick': (e, rel) => ws.mediaPick(rel),
    'template:save-user': (e, rel) => ws.saveUserTemplate(rel),
    'templates:user': () => ws.listUserTemplates(),
    'page:blueprint-html': (e, rel) => ws.blueprintHtml(rel),
    'page:blueprint-pdf': (e, rel) => ws.blueprintPdf(rel),
    'gates:summary': () => ws.gatesSummary(),
    'page:revisions': (e, rel) => ws.listRevisions(rel),
    'page:revision-read': (e, rel, file) => ws.readRevision(rel, file),
    'log:today': (e, project) => ws.todayLog(project),
    'log:verify': () => ws.verifyLogChain(),
    'archive:contact-sheet': (e, ids) => ws.contactSheet(ids),
    'archive:read-b64': (e, id) => ws.archiveReadB64(id),
    'wiki:resolve': (e, target) => ws.resolveWiki(target),
    'wiki:backlinks': (e, rel) => ws.backlinks(rel),
    'wiki:pages': () => ws.allPagesFlat(),
    'reminders:list': () => ws.listReminders(),
    'reminders:add': (e, r) => ws.addReminder(r),
    'reminders:update': (e, id, patch) => ws.markReminders([id], patch),
    'reminders:remove': (e, id) => ws.removeReminder(id),
    'activity:summary': () => ws.activitySummary(),
    'music:list': () => ws.musicList(),
    'music:pick': () => ws.musicPick(),
    'music:remove': (e, id) => ws.musicRemove(id),
    'sketch:save': (e, name, b64, meta) => ws.archiveAddBytes(name, b64, meta),
    'pets:summary': () => ws.petsSummary(),
    'pets:complete': (e, project, keep) => ws.completeProject(project, keep),
    'pets:retire': (e, project) => ws.retireKeptPet(project),
    'deck:list': () => ws.deckList(),
    'overlay:read': (e, rel) => ws.readOverlay(rel),
    'overlay:write': (e, rel, data) => ws.writeOverlay(rel, data),
  };
  for (const [channel, fn] of Object.entries(handlers)) ipcMain.handle(channel, fn);
}

app.whenReady().then(() => {
  ws.initWorkspace();
  registerIpc();
  createWindow();
  startReminderLoop();
  console.log('[bludos] ready — workspace:', ws.info().root);
});

app.on('window-all-closed', () => app.quit());
