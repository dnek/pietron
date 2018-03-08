'use strict';

const Point = require('./point');

const sid = document.getElementById('sizeInputDialog');
const wi = document.getElementById('widthInput');
const hi = document.getElementById('heightInput');
const cancel = document.getElementById('sizeInputCancel');

const showModal = (width = 10, height = 10) => new Promise((resolve) => {
  wi.value = width;
  hi.value = height;
  sid.showModal();
  const onClose = () => {
    removeListeners();
    if(sid.returnValue === 'ok'){
      resolve(new Point(wi.value | 0, hi.value | 0));
    }else{
      resolve(null);
    }
  };
  const onCancel = () => {
    removeListeners();
    resolve(null);
  };
  const removeListeners = () => {
    sid.removeEventListener('close', onClose);
    sid.removeEventListener('cancel', onCancel);
  };
  sid.addEventListener('close', onClose);
  sid.addEventListener('cancel', onCancel);
});

cancel.addEventListener('click',() => {
  sid.close();
});

module.exports = {
  showModal: showModal
};