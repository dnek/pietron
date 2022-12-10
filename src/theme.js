'use strict';

const {
  ipcMain, nativeTheme
} = require('electron');

const toggleDarkMode = () => {
  // If theme is currently dark
  if (nativeTheme.shouldUseDarkColors) {
    nativeTheme.themeSource = 'light';
  } else {
    nativeTheme.themeSource = 'dark';
  }
};

ipcMain.on('match-system', () => {
  nativeTheme.themeSource = 'system';
});

ipcMain.on('toggle-dark-mode', () => {
  toggleDarkMode();
});
