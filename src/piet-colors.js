'use strict';

const flatten = require('./flatten');
const PIET_COLORS_MAT = [
  ['#ffc0c0', '#ff0000', '#c00000'],
  ['#ffffc0', '#ffff00', '#c0c000'],
  ['#c0ffc0', '#00ff00', '#00c000'],
  ['#c0ffff', '#00ffff', '#00c0c0'],
  ['#c0c0ff', '#0000ff', '#0000c0'],
  ['#ffc0ff', '#ff00ff', '#c000c0'],
  ['#ffffff', '#000000']
];
module.exports = Object.freeze({
  MAT: PIET_COLORS_MAT,
  ARY: flatten(PIET_COLORS_MAT)
});