'use strict';

const {
  ipcRenderer
} = require('electron');

const {
  BrowserWindow,
  dialog
} = require('electron').remote;
const getWin = () => BrowserWindow.getAllWindows()[0];
const jimp = require('jimp');
const path = require('path');
const nid = require('./number-input-dialog');

const PIET_COLORS_HEX = [
  0xffc0c0ff, 0xff0000ff, 0xc00000ff,
  0xffffc0ff, 0xffff00ff, 0xc0c000ff,
  0xc0ffc0ff, 0x00ff00ff, 0x00c000ff,
  0xc0ffffff, 0x00ffffff, 0x00c0c0ff,
  0xc0c0ffff, 0x0000ffff, 0x0000c0ff,
  0xffc0ffff, 0xff00ffff, 0xc000c0ff,
  0xffffffff, 0x000000ff
];
const hexToPietColor = hex => PIET_COLORS_HEX.indexOf(hex);

let filePath = '',
  fileName = 'NoName';
let codelSize = 10;

const setFilePath = _filePath => {
  filePath = _filePath;
  fileName = filePath !== '' ? path.basename(filePath) : 'NoName';
  ipcRenderer.send('title-set-file-name', fileName);
};

const newFile = () => {
  setFilePath('');
};

const openFile = async () => {
  const paths = dialog.showOpenDialog(
    getWin(), {
      properties: ['openFile'],
      filters: [{
        name: 'Images',
        extensions: ['png', 'bmp']
      }]
    }
  );
  if (paths) {
    const bitmap = await fileToBitmap(paths[0]);
    setFilePath(paths[0]);
    return bitmap;
  } else {
    throw 'cancel';
  }
};

const fileToBitmap = async path => {
  const img = await jimp.read(path);
  const mime = img.getMIME();
  if (mime !== 'image/png' && mime !== 'image/bmp') throw 'InvalidFileTypeException';
  const inputCodelSize = await nid.showModal('Specify the codel size.');
  if (inputCodelSize > 0) {
    codelSize = inputCodelSize;
  } else throw 'cancel';
  const fieldWidth = img.bitmap.width / codelSize,
    fieldHeight = img.bitmap.height / codelSize;
  if (!Number.isInteger(fieldWidth) || !Number.isInteger(fieldHeight)) throw 'InvalidCodelSizeException';
  const bitmap = [];
  for (let i = 0; i < fieldWidth; i++) {
    const row = [];
    for (let j = 0; j < fieldHeight; j++) {
      // const hex = img.bitmap.data.readUInt32BE(img.getPixelIndex(i * codelSize, j * codelSize));
      const hex = img.getPixelColor(i * codelSize, j * codelSize);
      const color = hexToPietColor(hex);
      row.push(color > -1 ? color : 18);
    }
    bitmap.push(row);

  }
  return bitmap;
};

const saveFile = async (bitmap, isAs = false) => {
  if (isAs || filePath === '') {
    const inputCodelSize = await nid.showModal('Specify the codel size.');
    if (inputCodelSize > 0) {
      codelSize = inputCodelSize;
    } else throw 'cancel';
    const openFilePath = dialog.showSaveDialog(
      getWin(), {
        defaultPath: filePath,
        filters: [{
          name: 'Images',
          extensions: ['png', 'bmp']
        }]
      }
    );
    if (!openFilePath) throw 'cancel';
    setFilePath(openFilePath);
  }
  const [width, height] = [bitmap.length, bitmap[0].length];
  new jimp(width * codelSize, height * codelSize, (err, img) => {
    for (let i = 0; i < width; i++) {
      for (let j = 0; j < height; j++) {
        const [startX, startY] = [i * codelSize, j * codelSize];
        const hex = PIET_COLORS_HEX[bitmap[i][j]];
        img.scan(startX, startY, codelSize, codelSize, (x, y, offset) => {
          img.bitmap.data.writeUInt32BE(hex, offset, true);
        });
      }
    }
    img.write(filePath);
  });
};

module.exports = {
  newFile: newFile,
  openFile: openFile,
  saveFile: saveFile
};