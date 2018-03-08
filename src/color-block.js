'use strict';

const Point = require('./point');
const BothCorners = require('./both-corners');

class ColorBlock {
  constructor(codel = new Point, color = 0) {
    this.codels = [codel];
    this.length = 1;
    this.cornersAry = [0, 1, 2, 3].map(i => new BothCorners(i, codel));
    this.color = color;
  }

  addCodel(codel = new Point) {
    this.length = this.codels.push(codel);
    for (let i = 0; i < 4; i++) {
      this.cornersAry[i].addCodel(codel);
    }
  }

  addColorBlock(block = new ColorBlock){
    this.length = this.codels.push(...block.codels);
    for (let i = 0; i < 4; i++) {
      this.cornersAry[i].addCorners(block.cornersAry[i]);
    }
  }
}

module.exports = ColorBlock;