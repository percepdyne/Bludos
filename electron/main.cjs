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
