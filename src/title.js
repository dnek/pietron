'use strict';

const {BrowserWindow, ipcMain} = require('electron');

let fileName = 'NoName';
let dirty = false;

const setFileName = _fileName => {
  fileName = _fileName;
  setTitle();
};

const setDirty = _dirty => {
  dirty = _dirty;
  setTitle();
};

const setTitle = () => {
  const win = BrowserWindow.getFocusedWindow();
  win.setTitle(`${fileName} ${dirty?'* ':''}- Pietron`);
};

ipcMain.on('title-set-file-name', (e, _fileName) => {
  setFileName(_fileName);
});

ipcMain.on('title-set-dirty', (e, _dirty) => {
  setDirty(_dirty);
});

module.exports = {
  getDirty: () => dirty,
  setDirty: setDirty
};