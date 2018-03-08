'use strict';

const flatten = require('./flatten');
const COMMANDS_MAT = [
  ['*', 'push', 'pop'],
  ['add', 'sub', 'multi'],
  ['div', 'mod', 'not'],
  ['great', 'point', 'switch'],
  ['dup', 'roll', 'in(n)'],
  ['in(c)', 'out(n)', 'out(c)']
],
INVERSES_MAT = [
  ['*', 'pop', 'push'],
  ['in(c)', 'out(c)', 'out(n)'],
  ['dup', 'in(n)', 'roll'],
  ['great', 'switch', 'point'],
  ['div', 'not', 'mod'],
  ['add', 'multi', 'sub'],
];

module.exports = Object.freeze({
  MAT: COMMANDS_MAT,
  ARY: flatten(COMMANDS_MAT),
  INV_MAT: INVERSES_MAT,
  INV_ARY: flatten(INVERSES_MAT)
});