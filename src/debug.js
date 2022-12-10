'use strict';

const {
  BrowserWindow,
  dialog,
  ipcMain
} = require('electron');

const getWin = () => BrowserWindow.getAllWindows()[0];

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

let breakPoints = [
  [false]
]; //bool[,]

let dp = 0,
  cc = 0,
  waitCount = 0,
  slideCount = 0,
  stepCount = 0;

let srcCodel = new Point,
  destCodel = new Point;
let slides = [new Point]; //point[]

let input = '',
  inputTemp = '',
  output = '';
let debugging = false,
  pausing = true;

let stack = [0],
  lastStack = [0]; //int[]
let colorBlocks = [
  [new ColorBlock]
];
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
    for (;;) {
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
      const destColor = cb(destCodel).color,
        srcColor = cb(srcCodel).color,
        last = stack.length - 1;
      const command = (destColor % 3 - srcColor % 3 + 3) % 3 + ((destColor / 3 | 0) - (srcColor / 3 | 0) + 6) % 6 * 3;
      currentCommandStr = pietCommands.ARY[command];
      const lessThan = x => stack.length < x;
      switch (command) {
        case 1: //push
          stack.push(cb(srcCodel).length);
          break;
        case 2: //pop
          if (lessThan(1)) break;
          stack.pop();
          break;
        case 3: //add
          if (lessThan(2)) break;
          stack[last - 1] += stack.pop();
          break;
        case 4: //sub
          if (lessThan(2)) break;
          stack[last - 1] -= stack.pop();
          break;
        case 5: //multi
          if (lessThan(2)) break;
          stack[last - 1] *= stack.pop();
          break;
        case 6: //div
          if (lessThan(2) || stack[last] === 0) break;
          stack[last - 1] = stack[last - 1] / stack.pop() | 0;
          break;
        case 7: //mod
          if (lessThan(2) || stack[last] === 0) break;
          stack[last - 1] %= stack[last];
          if (stack[last] * stack[last - 1] < 0) stack[last - 1] += stack[last]; //the same sign as the divisor
          stack.pop();
          break;
        case 8: //not
          if (lessThan(1)) break;
          stack[last] = stack[last] === 0 ? 1 : 0;
          break;
        case 9: //great
          if (lessThan(2)) break;
          stack[last - 1] = stack[last - 1] > stack.pop() ? 1 : 0;
          break;
        case 10: //point
          if (lessThan(1)) break;
          dp = ((dp + stack.pop()) % 4 + 4) % 4;
          break;
        case 11: //switch
          if (lessThan(1)) break;
          if (stack.pop() % 2 !== 0) cc = 1 - cc;
          break;
        case 12: //dup
          if (lessThan(1)) break;
          stack.push(stack[last]);
          break;
        case 13:
          { //roll
            if (lessThan(2) || stack[last - 1] < 1 || lessThan(stack[last - 1] + 2)) break;
            const c = stack.pop(),
              d = stack.pop(); //count, depth
            stack.push(...stack.splice(last - d - 1, d - (c % d + d) % d));
            break;
          }
        case 14:
          { //in(n)
            // Match num at start of string, capture trailing whitespace
            const num = input.match(/^\d+\s*/u);
            // If a number was found, remove it from the input string
            if (num) {
              input = input.slice(num[0].length);
            } else {
              // No num, either empty or char not a digit, thus ignore cmd
              break;
            }
            stack.push(parseInt(num[0]));
            break;
          }
        case 15:
          { //in(c)
            if (input.length === 0) {
              break;
            }
            stack.push(input.codePointAt(0));
            input = Array.of(...input).slice(1).join('');
            break;
          }
        case 16:
          { //out(n)
            if (lessThan(1)) break;
            output += stack.pop().toString();
            break;
          }
        case 17:
          { //out(c)
            if (lessThan(1)) break;
            output += String.fromCodePoint(stack.pop());
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

const refreshWindow = () => {
  const sanitizedChar = i => {
    try {
      return i > 31 ? String.fromCodePoint(i) : '??';
    } catch (error) {
      return '??';
    }
  };
  const lastStackStr = lastStack.map(i => `${i}(${sanitizedChar(i)})`),
    stackStr = stack.map(i => `${i}(${sanitizedChar(i)})`);
  let debugStatus = `<span>Command: <em>${currentCommandStr}</em></span><span>DP: ${DP_STR[dp]}</span><span>CC: ${CC_STR[cc]}</span><span>Step: ${stepCount}</span>`;
  getWin().webContents.send('refresh-window', srcCodel, destCodel, input, output, lastStackStr, stackStr, debugStatus);
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
