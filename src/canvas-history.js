'use strict';

const {
  ipcRenderer
} = require('electron');

const {
  dialog
} = require('electron').remote;

const historyAry = [];
let currentIndex = -1,
  savedIndex = -1;
let dirty = false;

const checkDirty = () => {
  if (dirty !== (currentIndex !== savedIndex)) {
    dirty = !dirty;
    ipcRenderer.send('title-set-dirty', dirty);
  }
};

const setCurrentIndex = i => {
  if (i === currentIndex) return;
  currentIndex = i;
  checkDirty();
};

const initialize = colors => {
  historyAry.length = 0;
  historyAry.push(colors.map(i => i.map(j => j)));
  savedIndex = 0;
  setCurrentIndex(0);
};

const addHistory = colors => {
  setCurrentIndex(currentIndex + 1);
  historyAry.splice(currentIndex);
  historyAry.push(colors.map(i => i.map(j => j)));
};

const undoHistory = () => {
  if (currentIndex < 1) return null;
  setCurrentIndex(currentIndex - 1);
  return historyAry[currentIndex];
};

const redoHistory = () => {
  if (currentIndex === historyAry.length - 1) return null;
  setCurrentIndex(currentIndex + 1);
  return historyAry[currentIndex];
};

const save = () => {
  savedIndex = currentIndex;
  checkDirty();
};

const isCloseConfirmed = () => {
  if (!dirty) return true;
  const response = dialog.showMessageBox({
    type: 'question',
    buttons: ['Yes', 'No'],
    title: 'Confirm',
    message: 'Unsaved data will be lost. Are you sure you want to close current project?'
  });
  return response === 0;
};

module.exports = {
  initialize: initialize,
  addHistory: addHistory,
  undoHistory: undoHistory,
  redoHistory: redoHistory,
  save: save,
  isCloseConfirmed: isCloseConfirmed
};