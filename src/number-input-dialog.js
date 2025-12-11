'use strict';

const dialog = document.getElementById('numberInputDialog');
const label = document.getElementById('numberInputLabel');
const numberInput = document.getElementById('numberInput');
const cancelButton = document.getElementById('numberInputCancel');

const showModal = (msg, max) => new Promise((resolve) => {
  label.innerHTML = msg;
  numberInput.max = max;
  dialog.showModal();

  const onClose = () => {
    dialog.removeEventListener('close', onClose);
    const value = dialog.returnValue === 'ok'
      ? numberInput.value | 0 : 0;
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
