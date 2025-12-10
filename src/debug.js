'use strict';

const {
  BrowserWindow,
  dialog,
  ipcMain
} = require('electron');

const getWin = () => BrowserWindow.getAllWindows()[0];

const Long = require('long');

/**
 * 
 * @param {Long} a 
 * @param {Long} b 
 * @returns {Long}
 */
const flooredDiv = (a, b) => {
  const d = a.div(b);
  if (d.mul(b).eq(a) || a.isNegative() === b.isNegative()) return d;
  return d.sub(1);
};
/**
 * 
 * @param {Long} a 
 * @param {Long | number} b 
 * @returns {Long}
 */
const flooredMod = (a, b) => {
  return a.mod(b).add(b).mod(b);
};


const pietCommands = require('./piet-commands');
const Point = require('./point');
const ColorBlock = require('./color-block');

const WHITE = 18,
  BLACK = 19;

let currentCommandStr = '';
const DP_STR = ['→(0)', '↓(1)', '←(2)', '↑(4)'],
  CC_STR = ['L(0)', 'R(1)'];

let fieldWidth = 1,
  fieldHeight = 1;
const isOutOfField = (p = new Point) =>
  p.x < 0 || p.x > fieldWidth - 1 || p.y < 0 || p.y > fieldHeight - 1;

let dp = 0,
  cc = 0,
  waitCount = 0,
  slideCount = 0,
  stepCount = 0;

let srcCodel = new Point,
  destCodel = new Point;
/**
 * @type {Point}
 */
let slides = [];

let input = '',
  inputTemp = '',
  output = '';
let debugging = false,
  pausing = true;

/**
 * @type {Long[]}
 */
const stack = [];
const isStackLessThan = (x) => stack.length < x;

/**
 * @type {Long[]}
 */
let lastStack = [];
/**
 * @type {ColorBlock[][]}
 */

let colorBlocks = [[]];
const cb = (point = new Point) => colorBlocks[point.x][point.y];

const initializeDebug = (colors = [
  [0]
], _input = '') => {
  fieldWidth = colors.length;
  fieldHeight = colors[0].length;
  srcCodel = new Point;
  destCodel = new Point;
  slides.length = 0;
  dp = cc = waitCount = slideCount = stepCount = 0;
  input = inputTemp = _input;
  output = '';
  debugging = true;
  pausing = false;
  stack.length = lastStack.length = 0;

  colorBlocks.length = 0;
  colorBlocks = colors.map(() => []);

  const newBlock = (x, y) => {
    colorBlocks[x][y] = new ColorBlock(new Point(x, y), colors[x][y]);
  };
  const addCodel = (x, y, _x, _y) => {
    colorBlocks[x][y] = colorBlocks[_x][_y];
    colorBlocks[x][y].addCodel(new Point(x, y));
  };

  newBlock(0, 0);
  for (let i = 1; i < colors[0].length; i++) {
    if (colors[0][i] === colors[0][i - 1]) {
      addCodel(0, i, 0, i - 1);
    } else {
      newBlock(0, i);
    }
  }
  for (let i = 1; i < colors.length; i++) {
    if (colors[i][0] === colors[i - 1][0]) {
      addCodel(i, 0, i - 1, 0);
    } else {
      newBlock(i, 0);
    }
    for (let j = 1; j < colors[i].length; j++) {
      if (colors[i][j] === colors[i][j - 1]) {
        addCodel(i, j, i, j - 1);
        if (colors[i][j] === colors[i - 1][j] && colorBlocks[i][j] !== colorBlocks[i - 1][j]) {
          if (colorBlocks[i][j].length > colorBlocks[i - 1][j].length) {
            colorBlocks[i][j].addColorBlock(colorBlocks[i - 1][j]);
            colorBlocks[i - 1][j].codels.forEach(codel => {
              colorBlocks[codel.x][codel.y] = colorBlocks[i][j];
            });
          } else {
            colorBlocks[i - 1][j].addColorBlock(colorBlocks[i][j]);
            colorBlocks[i][j].codels.forEach(codel => {
              colorBlocks[codel.x][codel.y] = colorBlocks[i - 1][j];
            });
          }
        }
      } else {
        if (colors[i][j] === colors[i - 1][j]) {
          addCodel(i, j, i - 1, j);
        } else {
          newBlock(i, j);
        }
      }
    }
  }
};

const advanceDebug = () => {
  lastStack = stack.slice();
  srcCodel.setValues(...destCodel);
  stepCount++;
  const dX = -(dp - 1) % 2,
    dY = -(dp - 2) % 2;
  const onSrcWhite = () => {
    for (; ;) {
      destCodel.x += dX;
      destCodel.y += dY;
      if (isOutOfField(destCodel) || cb(destCodel).color === BLACK) {
        destCodel.x -= dX;
        destCodel.y -= dY;
        waitCount = 0;
        slide();
        return;
      } else if (cb(destCodel).color !== WHITE) { //noop
        waitCount = slideCount = 0;
        currentCommandStr = 'noop';
        return;
      }
    }
  };
  if (cb(srcCodel).color !== WHITE) {
    const corner = cb(srcCodel).cornersAry[dp];
    destCodel.setValues(...(cc === 0 ? corner.leftCodel : corner.rightCodel));
    destCodel.x += dX;
    destCodel.y += dY;
    if (isOutOfField(destCodel) || cb(destCodel).color === BLACK) {
      destCodel.setValues(...srcCodel);
      wait();
      return;
    } else if (cb(destCodel).color !== WHITE) {
      waitCount = 0;
      const destColor = cb(destCodel).color;
      const srcColor = cb(srcCodel).color;
      const command = (destColor % 3 - srcColor % 3 + 3) % 3 + ((destColor / 3 | 0) - (srcColor / 3 | 0) + 6) % 6 * 3;
      currentCommandStr = pietCommands.ARY[command];
      switch (command) {
        case 1: //push
          stack.push(Long.fromInt(cb(srcCodel).length));
          break;
        case 2: //pop
          if (isStackLessThan(1)) break;
          stack.pop();
          break;
        case 3: //add
          {
            if (isStackLessThan(2)) break;
            const pop0 = stack.pop();
            const pop1 = stack.pop();
            stack.push(pop1.add(pop0));
            break;
          }
        case 4: //sub
          {
            if (isStackLessThan(2)) break;
            const pop0 = stack.pop();
            const pop1 = stack.pop();
            stack.push(pop1.sub(pop0));
            break;
          }
        case 5: //multi
          {
            if (isStackLessThan(2)) break;
            const pop0 = stack.pop();
            const pop1 = stack.pop();
            stack.push(pop1.mul(pop0));
            break;
          }
        case 6: //div
          {
            if (isStackLessThan(2) || stack[stack.length - 1].isZero()) break;
            const pop0 = stack.pop();
            const pop1 = stack.pop();
            stack.push(flooredDiv(pop1, pop0));
            break;
          }
        case 7: //mod
          {
            if (isStackLessThan(2) || stack[stack.length - 1].isZero()) break;
            const pop0 = stack.pop();
            const pop1 = stack.pop();
            stack.push(flooredMod(pop1, pop0));
            break;
          }
        case 8: //not
          {
            if (isStackLessThan(1)) break;
            const pop0 = stack.pop();
            stack.push(pop0.isZero() ? Long.ONE : Long.ZERO);
            break;
          }
        case 9: //great
          {
            if (isStackLessThan(2)) break;
            const pop0 = stack.pop();
            const pop1 = stack.pop();
            stack.push(pop1.gt(pop0) ? Long.ONE : Long.ZERO);
            break;
          }
        case 10: //point
          {
            if (isStackLessThan(1)) break;
            const pop0 = stack.pop();
            dp = flooredMod(pop0.add(dp), 4).toInt();
            break;
          }
        case 11: //switch
          {
            if (isStackLessThan(1)) break;
            const pop0 = stack.pop();
            if (pop0.mod(2).isZero()) break;
            cc ^= 1;
            break;
          }
        case 12: //dup
          if (isStackLessThan(1)) break;
          stack.push(stack[stack.length - 1]);
          break;
        case 13:
          { //roll
            const poppedLength = stack.length - 2;
            if (isStackLessThan(2) || stack[poppedLength].lt(0) || stack[poppedLength].gt(poppedLength)) break;
            const pop0 = stack.pop();
            const pop1 = stack.pop();
            // Avoid div0 error on flooredMod
            if (pop1.isZero()) break;
            const rollCount = flooredMod(pop0, pop1).toInt();
            const depth = pop1.toInt();
            stack.push(...stack.splice(-depth, depth - rollCount));
            break;
          }
        case 14:
          { //in(n)
            // Match num at start of string, capture leading whitespace and sign
            const numMatchArray = input.match(/^\s*[+-]?\d+/u);
            if (!numMatchArray) {
              // No num, either empty or char not a digit, thus ignore cmd
              break;
            }
            // If a number was found, remove it from the input string
            input = input.slice(numMatchArray[0].length);
            stack.push(Long.fromString(numMatchArray[0].trim()));
            break;
          }
        case 15:
          { //in(c)
            if (input.length === 0) {
              break;
            }
            stack.push(Long.fromInt(input.codePointAt(0)));
            input = Array.of(...input).slice(1).join('');
            break;
          }
        case 16:
          { //out(n)
            if (isStackLessThan(1)) break;
            output += stack.pop().toString();
            break;
          }
        case 17:
          { //out(c)
            if (isStackLessThan(1)) break;
            if (stack[stack.length - 1].lt(0) || stack[stack.length - 1].gt(0x10FFFF)) break;
            output += String.fromCodePoint(stack.pop().toInt());
            break;
          }
      }
    } else {
      onSrcWhite();
    }
  } else {
    onSrcWhite();
  }
};

const wait = () => {
  if (waitCount === 7) {
    endDebug();
    return;
  }
  if (waitCount % 2 === 0) {
    cc = (cc + 1) % 2;
  } else {
    dp = (dp + 1) % 4;
  }
  waitCount++;
  currentCommandStr = `wait(${waitCount})`;
};

const slide = () => {
  if (slideCount === 0) {
    slides.length = 0;
    slides.push(new Point(...destCodel));
  } else if (!slides[slides.length - 1].equals(destCodel)) {
    slides.push(new Point(...destCodel));
    for (let i = 0, n = slides.length - 2; i < n; i++) {
      if (slides[i].equals(destCodel)) {
        endDebug();
        return;
      }
    }
  }
  if (slideCount % 2 === 0) cc = (cc + 1) % 2;
  else dp = (dp + 1) % 4;
  slideCount++;
  currentCommandStr = `slide(${slideCount})`;
};

const startDebug = () => {
  pausing = false;
  let loopCount = 0;
  while (!pausing) {
    advanceDebug();
    loopCount++;
    if (loopCount > 1000000) {
      const isStopRequired = dialog.showMessageBoxSync(getWin(), {
        type: 'warning',
        buttons: ['Yes', 'No'],
        title: 'Pietron',
        message: 'Too many command execution',
        detail: 'The commands have been executed over 1,000,000 times.\nDo you want to stop debugging?'
      });
      if (isStopRequired === 0) {
        endDebug();
      } else {
        loopCount = 0;
      }
    }
  }
  if (debugging) {
    refreshWindow();
  }
};

const jumpDebug = (count = 0) => {
  pausing = false;
  for (let i = 0; i < count && !pausing; i++) {
    advanceDebug();
  }
  if (debugging) {
    refreshWindow();
  }
};

const stepDebug = () => {
  pausing = false;
  advanceDebug();
  if (debugging) {
    refreshWindow();
  }
};

/**
 * 
 * @param {Long} value
 * @returns {string}
 */
const getStackValuePreviewStr = (value) => {
  if (value.lt(0) || value.gt(0x10FFFF)) return `${value}`;
  if (value.lt(32)) return `${value}(^${String.fromCharCode(value.toInt() + 64)})`;
  return `${value}(${String.fromCodePoint(value.toInt())})`;
};

const refreshWindow = () => {
  const lastStackStrs = lastStack.map(getStackValuePreviewStr);
  const stackStrs = stack.map(getStackValuePreviewStr);
  let debugStatus = `<span>Command: <em>${currentCommandStr}</em></span><span>DP: ${DP_STR[dp]}</span><span>CC: ${CC_STR[cc]}</span><span>Step: ${stepCount}</span>`;
  getWin().webContents.send('refresh-window', srcCodel, destCodel, input, output, lastStackStrs, stackStrs, debugStatus);
};

const endDebug = () => {
  pausing = true;
  debugging = false;
  dialog.showMessageBoxSync(getWin(), {
    type: 'none',
    title: 'Pietron',
    message: 'Debug finished'
  });
  getWin().webContents.send('end-debug', inputTemp, output);
};

ipcMain.on('initialize-debug', (e, _codels, _input, debugMode) => {
  initializeDebug(_codels, _input);
  getWin().webContents.send('end-initialize', debugMode);
});

ipcMain.on('start-debug', () => {
  startDebug();
});

ipcMain.on('jump-debug', (e, count) => {
  jumpDebug(count);
});

ipcMain.on('step-debug', () => {
  stepDebug();
});

ipcMain.on('stop-debug', () => {
  endDebug();
});
