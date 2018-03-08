/**
 * Class representing both corner codels of a color block in a certain direction.
 * Depth, left & right are occasionally made negative in order to deal them to be oriented bottom-right.
 */

'use strict';

const Point = require('./point');

class BothCorners {
  constructor(direction = 0, codel = new Point) {
    this.direction = direction;
    this.leftCodel = new Point;
    this.rightCodel = new Point;
    this._lrOpposite = direction % 3 !== 0;
    this._depthOpposite = direction > 1;
    this._isHorizontal = direction % 2 === 0;
    let [depth, lr] = this._isHorizontal ? [codel.x, codel.y]: [codel.y, codel.x];
    if(this._depthOpposite)depth = -depth;
    if(this._lrOpposite)lr = -lr;
    this.depth = depth;
    this.left = this.right = lr;
  }

  get depth() {
    return this._depth;
  }

  set depth(depth) {
    this._depth = depth;
    if (this._depthOpposite) depth = -depth;
    if(this._isHorizontal)this.leftCodel.x = this.rightCodel.x = depth;
    else this.leftCodel.y = this.rightCodel.y = depth;
  }

  get left() {
    return this._left;
  }

  set left(left) {
    this._left = left;
    if (this.direction % 3 !== 0) left = -left;
    if (this.direction % 2 === 0) this.leftCodel.y = left;
    else this.leftCodel.x = left;
  }

  get right() {
    return this._right;
  }

  set right(right) {
    this._right = right;
    if (this.direction % 3 !== 0) right = -right;
    if(this.direction % 2 === 0)this.rightCodel.y = right;
    else this.rightCodel.x = right;
  }

  addCodel(codel = new Point) {
    let [depth, lr] = this._isHorizontal ? [codel.x, codel.y]: [codel.y, codel.x];
    if(this._depthOpposite)depth = -depth;
    if(this._lrOpposite)lr = -lr;
    if (depth > this.depth) {
      this.depth = depth;
      this.left = this.right = lr;
    } else if (depth === this.depth) {
      if (lr < this.left) this.left = lr;
      else if (lr > this.right) this.right = lr;
    }
  }

  addCorners(corners = new BothCorners){
    this.addCodel(corners.leftCodel);
    this.addCodel(corners.rightCodel);
  }
}

module.exports = BothCorners;