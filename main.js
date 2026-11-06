const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

let mainWindow;
let updateDownloaded = false;

// Send to the renderer only while a window exists (on macOS the app keeps running after the window is closed)
function send(channel, ...args) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#936658',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('./dist/gloomhavensecretariat/index.html');

  // Clear cache to ensure old Service Worker is removed, but keep localStorage/IndexedDB
  mainWindow.webContents.session.clearCache();
  mainWindow.webContents.session.clearStorageData({
    storages: ['serviceworkers', 'cachestorage']
  });

  // Re-announce an already downloaded update after (re)loads, as the renderer state is lost on reload
  mainWindow.webContents.on('did-finish-load', () => {
    if (updateDownloaded) {
      send('update-downloaded');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

function checkForUpdates() {
  autoUpdater.checkForUpdates().catch(() => {});
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Auto updater events
  autoUpdater.on('checking-for-update', () => {
    send('update-status', 'checking');
  });

  autoUpdater.on('update-available', () => {
    send('update-status', 'available');
  });

  autoUpdater.on('update-not-available', () => {
    send('update-status', 'not-available');
  });

  autoUpdater.on('error', () => {
    send('update-status', 'error');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    send('update-progress', progressObj.percent);
  });

  autoUpdater.on('update-downloaded', () => {
    updateDownloaded = true;
    send('update-downloaded');
  });

  // Check for updates
  checkForUpdates();
  // Check for updates every 30m
  setInterval(checkForUpdates, 30 * 60 * 1000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('quit-and-install', () => {
  if (updateDownloaded) {
    autoUpdater.quitAndInstall(true, true);
  }
});
