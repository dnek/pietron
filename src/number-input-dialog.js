'use strict';

const nid = document.getElementById('numberInputDialog');
const label = document.getElementById('numberInputLabel');
const ni = document.getElementById('numberInput');
const cancel = document.getElementById('numberInputCancel');

const showModal = (msg, max = 1000) => new Promise((resolve) => {
  label.innerHTML = msg;
  ni.max = max;
  nid.showModal();
  const onClose = () => {
    removeListeners();
    if(nid.returnValue === 'ok'){
      resolve(ni.value | 0);
    }else{
      resolve(0);
    }
  };
  const onCancel = () => {
    removeListeners();
    resolve(0);
  };
  const removeListeners = () => {
    nid.removeEventListener('close', onClose);
    nid.removeEventListener('cancel', onCancel);
  };
  nid.addEventListener('close', onClose);
  nid.addEventListener('cancel', onCancel);
});

cancel.addEventListener('click',() => {
  nid.close();
});

module.exports = {
  showModal: showModal
};