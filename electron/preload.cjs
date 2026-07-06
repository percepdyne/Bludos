const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('bludos', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  filePath: (file) => webUtils.getPathForFile(file),
});
