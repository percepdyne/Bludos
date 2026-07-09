const { contextBridge, ipcRenderer, webUtils } = require('electron');

// Main→renderer push channels the UI is allowed to subscribe to.
const EVENT_CHANNELS = new Set(['reminder:fire', 'pet:event']);

contextBridge.exposeInMainWorld('bludos', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  filePath: (file) => webUtils.getPathForFile(file),
  on: (channel, cb) => {
    if (!EVENT_CHANNELS.has(channel)) return () => {};
    const listener = (_e, ...args) => cb(...args);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
});
