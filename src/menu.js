'use strict';

const {app, BrowserWindow, Menu} = require('electron');

// const isDarwin = () => process.platform === 'darwin';
const isDarwin = process.platform === 'darwin';

const menuClicked = label => {
  const win = BrowserWindow.getAllWindows()[0];
  win.webContents.send('menu-clicked', label);
};

let template = [
  {
    label: 'File',
    submenu: [{
      label: 'New',
      accelerator: 'CmdOrCtrl+N',
      click: () => menuClicked('New')
    }, {
      label: 'Open',
      accelerator: 'CmdOrCtrl+O',
      click: () => menuClicked('Open')
    }, {
      type: 'separator'
    }, {
      label: 'Save File',
      accelerator: 'CmdOrCtrl+S',
      click: () => menuClicked('Save File')
    }, {
      label: 'Save File As ...',
      accelerator: 'Shift+CmdOrCtrl+S',
      click: () => menuClicked('Save File As')
    }]
  },
  {
    label: 'Edit',
    submenu: [{
      label: 'Undo',
      accelerator: 'CmdOrCtrl+Z',
      // role: 'undo',
      click: () => menuClicked('Undo')
    }, {
      label: 'Redo',
      accelerator:
        isDarwin ? 'Shift+CmdOrCtrl+Z' : 'CmdOrCtrl+Y',
      // role: 'redo',
      click: () => menuClicked('Redo')
    }, {
      type: 'separator'
    }, {
      label: 'Cut',
      accelerator: 'CmdOrCtrl+X',
      role: 'cut'
    }, {
      label: 'Copy',
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    }, {
      label: 'Paste',
      accelerator: 'CmdOrCtrl+V',
      role: 'paste'
    }, {
      label: 'Select All',
      accelerator: 'CmdOrCtrl+A',
      role: 'selectall'
    }]
  },
  {
    label: 'View',
    submenu: [{
      label: 'Zoom In',
      accelerator: 'CmdOrCtrl+;',
      click: () => menuClicked('Zoom In')
    }, {
      label: 'Zoom Out',
      accelerator: 'CmdOrCtrl+-',
      click: () => menuClicked('Zoom Out')
    }]
  },
  {
    label: 'Canvas',
    submenu: [{
      label: 'Change Canvas Size',
      accelerator: 'CmdOrCtrl+R',
      click: () => menuClicked('Change Canvas Size')
    }]
  },
  {
    label: 'Debug',
    submenu: [{
      label: 'Start Debug',
      accelerator: 'F5',
      click: () => menuClicked('Start Debug')
    }, {
      label: 'Jump Debug',
      accelerator: 'F6',
      click: () => menuClicked('Jump Debug')
    }, {
      label: 'Step Debug',
      accelerator: 'F7',
      click: () => menuClicked('Step Debug')
    }, {
      label: 'Stop Debug',
      accelerator: 'ESC',
      click: () => menuClicked('Stop Debug')
    }]
  },
  {
    label: 'Theme',
    submenu: [{
      label: 'Match System',
      type: 'radio',
      click: () => menuClicked('Match System')
    }, {
      label: 'Toggle Dark Mode',
      type: 'radio',
      click: () => menuClicked('Toggle Dark Mode')
    }]
  }
];

if (isDarwin) {
  template.unshift({
    label: app.name,
    submenu: [
      {role: 'about'},
      {type: 'separator'},
      {role: 'services', submenu: []},
      {type: 'separator'},
      {role: 'hide'},
      {role: 'hideothers'},
      {role: 'unhide'},
      {type: 'separator'},
      {role: 'quit'}
    ]
  });

  // Edit menu
  template[2].submenu.push(
    {type: 'separator'},
    {
      label: 'Speech',
      submenu: [
        {role: 'startspeaking'},
        {role: 'stopspeaking'}
      ]
    }
  );

  // Window menu
  template.push({
    label: 'Window',
    submenu: [
      {role: 'close'},
      {role: 'minimize'},
      {role: 'zoom'},
      {type: 'separator'},
      {role: 'front'}
    ]
  });
}

module.exports = Menu.buildFromTemplate(template);
