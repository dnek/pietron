'use strict';

const file = require('./file');
const canvasHistory = require('./canvas-history');
const palette = require('./palette');
const pietColors = require('./piet-colors');
const Point = require('./point');
const sid = require('./size-input-dialog');

const canvasView = document.getElementById('canvasView');
const canvasTable = document.getElementById('canvasTable');
const canvasCells = [];
const canvasColors = [];
let [currentX, currentY] = [0, 0], [canvasWidth, canvasHeight] = [0, 0];
let codelSize = 20;
let drawing = false,
  debugging = false;
let srcCodel = new Point,
  destCodel = new Point;

const transpose = a => a[0].map((_, c) => a.map(r => r[c]));

const widthSpan = document.getElementById('widthSpan');
const heightSpan = document.getElementById('heightSpan');
const diagonalSpan = document.getElementById('diagonalSpan');
const codelSizeSpan = document.getElementById('codelSizeSpan');

const createCanvas = (width, height) => {
  palette.createPalette();
  canvasWidth = width;
  canvasHeight = 0;
  setCanvasHeight(height, false);
  canvasHistory.initialize(canvasColors);
  // const isDarwin = () => process.platform === 'darwin';
  const isDarwin = process.platform === 'darwin';
  const isCtrlOrCmd = e => isDarwin ? e.metaKey : e.ctrlKey;
  canvasView.addEventListener('keydown', e => {
    switch (e.key) {
      case 'z':
        if (isCtrlOrCmd(e) && !e.shiftKey) {
          undo();
          e.preventDefault();
        } else if (isDarwin && e.metaKey && e.shiftKey) {
          redo();
          e.preventDefault();
        }
        break;
      case 'Z':
        if (isDarwin && e.metaKey) {
          redo();
          e.preventDefault();
        }
        break;
      case 'y':
        if (isCtrlOrCmd(e) && !e.shiftKey) {
          redo();
          e.preventDefault();
        }
        break;
      default:
        break;
    }
  });
};

const createFromBitmap = bitmap => {
  bitmap = transpose(bitmap);
  const [height, width] = [bitmap.length, bitmap[0].length];
  setCanvasWidth(width, false);
  setCanvasHeight(height, false);
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      setCanvasColor(i, j, bitmap[i][j]);
    }
  }
  canvasHistory.initialize(canvasColors);
};

const setFromHistory = bitmap => {
  const [width, height] = [bitmap[0].length, bitmap.length];
  setCanvasWidth(width, false);
  setCanvasHeight(height, false);
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      if (canvasColors[i][j] !== bitmap[i][j]) {
        setCanvasColor(i, j, bitmap[i][j]);
      }
    }
  }
};

const fullyResetAndSetFromBitmap = bitmap => {
  // In other functions, DOMs are recycled.
  // It is also assumed that the contents of canvasTable, canvasCells and canvasColors are all consistent.
  // Hence, to fully refresh the scene, it is necessary to completely kill all the existing cells.
  for (let i = 0; i < canvasHeight; i++) {
    canvasTable.deleteRow(-1);
    canvasCells.pop();
    canvasColors.pop();
  }
  canvasHeight = 0;
  setFromHistory(bitmap);
};

const setCodelSize = size => {
  if (size < 5) return;
  for (let i = 0; i < canvasHeight; i++) {
    for (let j = 0; j < canvasWidth; j++) {
      const cell = canvasTable.rows[i].cells[j];
      cell.style.minWidth = cell.style.height = `${size}px`;
    }
  }
  codelSizeSpan.innerHTML = `Codel Size: ${size}`;
  codelSize = size;
};

const setCanvasColor = (x, y, color) => {
  if (color === undefined) color = palette.getCurrentColor();
  canvasCells[x][y].style.backgroundColor = pietColors.ARY[color];
  canvasColors[x][y] = color;
};

const addCanvasCell = (tr, colors, x, y) => {
  const td = tr.insertCell(-1);
  td.style.backgroundColor = 'white';
  td.style.minWidth = td.style.height = `${codelSize}px`;
  td.addEventListener('mousedown', e => onMouseDownCanvas(e, x, y));
  td.addEventListener('mousemove', e => onMouseMoveCanvas(e, x, y));
  colors.push(18);
  return td;
};

const setCanvasHeight = (height, addHistoryRequired = true) => {
  if (debugging) return;
  if (height < 1) return;
  if (height < canvasHeight) {
    const rows = canvasHeight - height;
    for (let i = 0; i < rows; i++) {
      canvasTable.deleteRow(-1);
      canvasCells.pop();
      canvasColors.pop();
    }
  } else if (height > canvasHeight) {
    for (let i = canvasHeight; i < height; i++) {
      let tr = canvasTable.insertRow(-1);
      let tds = [],
        colors = [];
      for (let j = 0; j < canvasWidth; j++) {
        tds.push(addCanvasCell(tr, colors, i, j));
      }
      canvasCells.push(tds);
      canvasColors.push(colors);
    }
  }
  canvasHeight = height;
  heightSpan.innerHTML = `Height: ${canvasHeight}`;
  setDiagonalSpan();
  if (addHistoryRequired) canvasHistory.addHistory(canvasColors);
};

const extendOneRowUpwards = (addHistoryRequired = true) => {
  const cloned = canvasColors.map(a => [...a]);
  cloned.unshift(cloned[0].map(() => 18));
  fullyResetAndSetFromBitmap(cloned);
  if (addHistoryRequired) canvasHistory.addHistory(cloned);
};

const extendOneColumnToTheLeft = (addHistoryRequired = true) => {
  const cloned = canvasColors.map(row => [18, ...row]);
  fullyResetAndSetFromBitmap(cloned);
  if (addHistoryRequired) canvasHistory.addHistory(cloned);
};

const trimTopRow = (addHistoryRequired = true) => {
  if (canvasHeight === 1) return;
	const cloned = canvasColors.map(a => [...a]);
	cloned.shift();
	fullyResetAndSetFromBitmap(cloned);
	if (addHistoryRequired) canvasHistory.addHistory(cloned);
};

const trimTheLeftmostColumn = (addHistoryRequired = true) => {
  if (canvasWidth === 1) return;
  const cloned = canvasColors.map(row => (row.shift(), row));
  fullyResetAndSetFromBitmap(cloned);
  if (addHistoryRequired) canvasHistory.addHistory(cloned);
};

const setCanvasWidth = (width, addHistoryRequired = true) => {
  if (debugging) return;
  if (width < 1) return;
  if (width < canvasWidth) {
    const cols = canvasWidth - width;
    for (let i = 0; i < canvasHeight; i++) {
      for (let j = 0; j < cols; j++) {
        canvasTable.rows[i].deleteCell(-1);
        canvasCells[i].pop();
        canvasColors[i].pop();
      }
    }
  } else if (width > canvasWidth) {
    for (let i = 0; i < canvasHeight; i++) {
      const tr = canvasTable.rows[i];
      const tds = canvasCells[i];
      const colors = canvasColors[i];
      for (let j = canvasWidth; j < width; j++) {
        tds.push(addCanvasCell(tr, colors, i, j));
      }
    }
  }
  canvasWidth = width;
  widthSpan.innerHTML = `Width: ${canvasWidth}`;
  setDiagonalSpan();
  if (addHistoryRequired) canvasHistory.addHistory(canvasColors);
};

const openChangeCanvasSizeDialog = async () => {
  const size = await sid.showModal(canvasWidth, canvasHeight);
  if (size === null) return;
  setCanvasWidth(size.x, false);
  setCanvasHeight(size.y, false);
  canvasHistory.addHistory(canvasColors);
};

const undo = () => {
  if (debugging) return;
  const colors = canvasHistory.undoHistory();
  if (colors !== null) setFromHistory(colors);
};

const redo = () => {
  if (debugging) return;
  const colors = canvasHistory.redoHistory();
  if (colors !== null) setFromHistory(colors);
};

const onMouseDownCanvas = (e, x, y) => {
  if (e.button === 0) {
    if (debugging) return;
    drawing = true;
    document.addEventListener('mouseup', onMouseUpCanvas);
    setCanvasColor(x, y);
  } else if (e.button === 2) {
    palette.setCurrentColor(canvasColors[x][y]);
  }
};

const onMouseMoveCanvas = (e, x, y) => {
  if (debugging) return;
  if (drawing && e.button === 0) {
    setCanvasColor(x, y);
  }
};

const onMouseUpCanvas = () => {
  document.removeEventListener('mouseup', onMouseUpCanvas);
  if (drawing) canvasHistory.addHistory(canvasColors);
  drawing = false;
};

const setDiagonalSpan = () => {
  diagonalSpan.innerHTML = `Diagonal^2: ${Math.pow(canvasWidth, 2) + Math.pow(canvasHeight, 2)}`;
};

const setDebugging = _debugging => {
  debugging = _debugging;
  if (debugging) {
    srcCodel = new Point;
    destCodel = new Point;
  } else {
    canvasCells[srcCodel.y][srcCodel.x].style.boxShadow = '';
    canvasCells[destCodel.y][destCodel.x].style.boxShadow = '';
  }
};

const setDebugCodels = (_srcCodel, _destCodel) => {
  canvasCells[srcCodel.y][srcCodel.x].style.boxShadow = '';
  canvasCells[destCodel.y][destCodel.x].style.boxShadow = '';
  if (_srcCodel.x === _destCodel.x && _srcCodel.y === _destCodel.y) {
    canvasCells[_destCodel.y][_destCodel.x].style.boxShadow = '0 0 0 1px blue inset, 0 0 0 2px red inset, 0 0 0 3px white inset';
  } else {
    canvasCells[_srcCodel.y][_srcCodel.x].style.boxShadow = '0 0 0 1px red inset, 0 0 0 2px white inset';
    canvasCells[_destCodel.y][_destCodel.x].style.boxShadow = '0 0 0 1px blue inset, 0 0 0 2px white inset';
  }
  srcCodel = _srcCodel;
  destCodel = _destCodel;
};

const newFile = async () => {
  if (debugging) return;
  if(!canvasHistory.isCloseConfirmed())return;
  const size = await sid.showModal(canvasWidth, canvasHeight);
  if (size === null) return;
  setCanvasWidth(size.x, false);
  setCanvasHeight(size.y, false);
  for (let i = 0; i < canvasHeight; i++) {
    for (let j = 0; j < canvasWidth; j++) {
      setCanvasColor(i, j, 18);
    }
  }
  file.newFile();
  canvasHistory.initialize(canvasColors);
};

const openFile = async () => {
  if (debugging) return;
  if(!canvasHistory.isCloseConfirmed())return;
  try {
    const bitmap = await file.openFile();
    if (bitmap) createFromBitmap(bitmap);
  } catch (error) {
    if (error === 'cancel') return;
    alert(error);
  }
};

const saveFile = async (isAs = false) => {
  try {
    await file.saveFile(transpose(canvasColors), isAs);
    canvasHistory.save();
  } catch (error) {
    if (error === 'cancel') return;
    alert(error);
  }
};

module.exports = {
  createCanvas: createCanvas,
  // createFromBitmap: createFromBitmap,
  getCodelSize: () => codelSize,
  setCodelSize: setCodelSize,
  // getCanvasColor: (x, y) => canvasColors[x][y],
  // setCanvasColor: setCanvasColor,
  getCodelsForDebug: () => transpose(canvasColors),
  getCanvasWidth: () => canvasWidth,
  setCanvasWidth: setCanvasWidth,
  getCanvasHeight: () => canvasHeight,
  setCanvasHeight: setCanvasHeight,
  extendOneRowUpwards: extendOneRowUpwards,
  trimTopRow,
  trimTheLeftmostColumn,
  extendOneColumnToTheLeft,
  openChangeCanvasSizeDialog: openChangeCanvasSizeDialog,
  setDebugging: setDebugging,
  setDebugCodels: setDebugCodels,
  newFile: newFile,
  openFile: openFile,
  saveFile: saveFile,
  undo: undo,
  redo: redo
};