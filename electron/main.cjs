const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const ws = require('./workspace.cjs');

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
  };
  for (const [channel, fn] of Object.entries(handlers)) ipcMain.handle(channel, fn);
}

app.whenReady().then(() => {
  ws.initWorkspace();
  registerIpc();
  createWindow();
  console.log('[bludos] ready — workspace:', ws.info().root);
});

app.on('window-all-closed', () => app.quit());
