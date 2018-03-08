'use strict';

const {
  ipcRenderer
} = require('electron');

const canvas = require('./canvas');
const nid = require('./number-input-dialog');

const inputArea = document.getElementById('inputArea');
const outputArea = document.getElementById('outputArea');
const lastStackArea = document.getElementById('lastStackArea');
const nowStackArea = document.getElementById('nowStackArea');
const footer = document.getElementsByTagName('footer')[0];
const leftFooter = document.getElementById('leftFooter');

let debugging = false;
const setDebugging = f => {
  debugging = f;
  canvas.setDebugging(f);
  footer.style.backgroundColor = f ? '#c70' : '#07c';
  leftFooter.hidden = !f;
};

const ipcSendDebug = async debugMode => {
  if (!debugging) {
    setDebugging(true);
    ipcRenderer.send('initialize-debug', canvas.getCodelsForDebug(), inputArea.value, debugMode);
  } else {
    if (debugMode === 'jump-debug') {
      const count = await nid.showModal('Enter the jump count.', 1000000000);
      if (count > 0) {
        ipcRenderer.send(debugMode, inputArea.value, count);
      }
    } else {
      ipcRenderer.send(debugMode, inputArea.value);
    }
  }
};

ipcRenderer.on('menu-clicked', (e, arg) => {
  switch (arg) {
    case 'New':
      canvas.newFile();
      break;
    case 'Open':
      canvas.openFile();
      break;
    case 'Save File':
      canvas.saveFile(false);
      break;
    case 'Save File As':
      canvas.saveFile(true);
      break;
    case 'Undo':
      canvas.undo();
      break;
    case 'Redo':
      canvas.redo();
      break;
    case 'Zoom In':
      canvas.setCodelSize(canvas.getCodelSize() + 1);
      break;
    case 'Zoom Out':
      canvas.setCodelSize(canvas.getCodelSize() - 1);
      break;
    case 'Change Canvas Size':
      canvas.openChangeCanvasSizeDialog();
      break;
    case 'Start Debug':
      ipcSendDebug('start-debug');
      break;
    case 'Jump Debug':
      ipcSendDebug('jump-debug');
      break;
    case 'Step Debug':
      ipcSendDebug('step-debug');
      break;
    case 'Stop Debug':
      if (debugging) ipcRenderer.send('stop-debug');
      break;
    default:
      break;
  }
});

ipcRenderer.on('end-initialize', (e, debugMode) => {
  // ipcRenderer.send(debugMode);
  ipcSendDebug(debugMode);
});

ipcRenderer.on('refresh-window', (e, srcCodel, destCodel, input, output, lastStackStr, stackStr, debugStatus) => {
  canvas.setDebugCodels(srcCodel, destCodel);
  inputArea.value = input;
  outputArea.value = output;
  lastStackArea.value = lastStackStr.join('\n');
  nowStackArea.value = stackStr.join('\n');
  leftFooter.innerHTML = debugStatus;
});

ipcRenderer.on('end-debug', (e, input, output) => {
  setDebugging(false);
  inputArea.value = input;
  outputArea.value = output;
  lastStackArea.value = nowStackArea.value = '';
});

window.onload = () => {
  canvas.createCanvas(10, 10);
  window.addEventListener('keydown', e => {
    // const isDarwin = () => process.platform === 'darwin';
    const isDarwin = process.platform === 'darwin';
    const isCtrlOrCmd = e => isDarwin ? e.metaKey : e.ctrlKey;
    switch (e.key) {
      case 'ArrowLeft':
        if (isCtrlOrCmd(e) && e.altKey) {
          canvas.setCanvasWidth(canvas.getCanvasWidth() - 1);
          e.preventDefault();
        }
        break;
      case 'ArrowRight':
        if (isCtrlOrCmd(e) && e.altKey) {
          canvas.setCanvasWidth(canvas.getCanvasWidth() + 1);
          e.preventDefault();
        }
        break;
      case 'ArrowUp':
        if (isCtrlOrCmd(e) && e.altKey) {
          canvas.setCanvasHeight(canvas.getCanvasHeight() - 1);
          e.preventDefault();
        }
        break;
      case 'ArrowDown':
        if (isCtrlOrCmd(e) && e.altKey) {
          canvas.setCanvasHeight(canvas.getCanvasHeight() + 1);
          e.preventDefault();
        }
        break;
    }
  });
};