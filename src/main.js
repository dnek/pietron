'use strict';

const {
  app,
  BrowserWindow,
  dialog,
  Menu
} = require('electron');
const remoteMain = require('@electron/remote/main');

let win;

// const isDarwin = () => process.platform === 'darwin';
const isDarwin = process.platform === 'darwin';

remoteMain.initialize();

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true // to support `remote` in file.js and canvas-history.js
    },
    icon: __dirname + '/images/Pietron.png'
  });

  remoteMain.enable(win.webContents);

  win.loadURL(`file://${__dirname}/index.html`);
  // win.webContents.openDevTools();
  win.on('closed', () => {
    win = null;
  });

  const menu = require('./menu');
  Menu.setApplicationMenu(menu);
  require('./debug');
  const title = require('./title');

  win.on('close', (e) => {
    if (title.getDirty()) {
      const response = dialog.showMessageBoxSync({
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: 'Unsaved data will be lost. Are you sure you want to close current project?'
      });

      if (response === 0) {
        title.setDirty(false);
      } else {
        // cancel closing window
        e.preventDefault();
      }
    }
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (!isDarwin) {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});
