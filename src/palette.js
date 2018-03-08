'use strict';

const pietColors = require('./piet-colors');
const pietCommands = require('./piet-commands');
const flatten = require('./flatten');

const paletteAryToMat = e => [e / 3 | 0, e % 3];

const paletteTable = document.getElementById('paletteTable');
let paletteCells = [];
let paletteCellsAry = [];
let commandPs = [],
  inversePs = [];
let currentColor = 0,
  standardColor = 0;

const createPalette = () => {
  for (let i = 0; i < 7; i++) {
    const tr = paletteTable.insertRow(-1);
    let tds = [];
    commandPs.push([]);
    inversePs.push([]);
    for (let j = 0; j < 3; j++) {
      tds.push(tr.insertCell(-1));
      commandPs[i].push(tds[j].appendChild(document.createElement('p')));
      inversePs[i].push(tds[j].appendChild(document.createElement('p')));
    }
    paletteCells.push(tds);
  }
  paletteCellsAry = flatten(paletteCells);
  const commandPsAry = flatten(commandPs),
    inversePsAry = flatten(inversePs);
  for (let i = 0; i < 18; i++) {
    // const td = paletteCellsAry[i];
    // td.style.color = TEXT_COLORS[i % 3];
    // td.innerHTML = COMMANDS_ARY[i];
    commandPsAry[i].classList.add('palette-command');
    inversePsAry[i].classList.add('palette-inverse');
    commandPsAry[i].innerHTML = pietCommands.ARY[i];
    inversePsAry[i].innerHTML = `(${pietCommands.INV_ARY[i]})`;
  }
  paletteCellsAry[19].style.color = 'white';
  for (let i = 0; i < 20; i++) {
    paletteCellsAry[i].style.backgroundColor = pietColors.ARY[i];
    paletteCellsAry[i].addEventListener('click', () => setCurrentColor(i));
    paletteCellsAry[i].addEventListener('contextmenu', () => setStandardColor(i));
  }
  paletteCellsAry[20].style.border = '4px ridge';
  setCurrentColor(0);
};

const setCurrentColor = (color) => {
  // paletteCellsAry[currentColor].style.border = '';
  // paletteCellsAry[color].style.border = '4px double';
  paletteCellsAry[currentColor].style.boxShadow = '';
  paletteCellsAry[color].style.boxShadow = '0 0 0 2px white inset, 0 0 0 4px black inset, 0 0 0 6px white inset';
  paletteCellsAry[20].style.backgroundColor = pietColors.ARY[color];
  currentColor = color;
};

const setStandardColor = (color) => {
  if (color > 17 || color < 0) return;
  const [x, y] = paletteAryToMat(color);
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 3; j++) {
      // paletteCells[(i + x) % 6][(j + y) % 3].innerHTML = COMMANDS_MAT[i][j];
      commandPs[(i + x) % 6][(j + y) % 3].innerHTML = pietCommands.MAT[i][j];
      inversePs[(i + x) % 6][(j + y) % 3].innerHTML = `(${pietCommands.INV_MAT[i][j]})`;
    }
  }
  standardColor = color;
};

module.exports = {
  createPalette: createPalette,
  getCurrentColor: () => currentColor,
  getStandardColor: () => standardColor,
  setCurrentColor: setCurrentColor,
  setStandardColor: setStandardColor
};