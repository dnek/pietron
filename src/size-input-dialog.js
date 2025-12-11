'use strict';

const Point = require('./point');

const dialog = document.getElementById('sizeInputDialog');
const widthInput = document.getElementById('widthInput');
const hightInput = document.getElementById('heightInput');
const cancelButton = document.getElementById('sizeInputCancel');

const showModal = (width = 10, height = 10) => new Promise((resolve) => {
  widthInput.value = width;
  hightInput.value = height;
  dialog.showModal();

  const onClose = () => {
    dialog.removeEventListener('close', onClose);
    const value = dialog.returnValue === 'ok'
      ? new Point(widthInput.value | 0, hightInput.value | 0)
      : null;
    resolve(value);
  };
  dialog.addEventListener('close', onClose);
});

cancelButton.addEventListener('click', () => {
  dialog.close('');
});

module.exports = {
  showModal: showModal
};
