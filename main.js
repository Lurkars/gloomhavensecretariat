const { app, BrowserWindow } = require("electron");

let mainWindow;

function createWindow() {

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false
  });

  mainWindow.loadFile('./dist/kenwandererhaven/index.html');

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.loadFile('./dist/kenwandererhaven/index.html');
  })
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
});