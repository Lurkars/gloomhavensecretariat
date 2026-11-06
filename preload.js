const { contextBridge, ipcRenderer } = require('electron');

// Minimal API for the Angular app, available as window.electron
contextBridge.exposeInMainWorld('electron', {
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', () => callback());
  },
  quitAndInstall: () => {
    ipcRenderer.send('quit-and-install');
  }
});
