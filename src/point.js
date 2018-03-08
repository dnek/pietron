'use strict';

class Point {
  constructor(x = 0, y = 0) {
    this.setValues(x, y);
  }

  setValues(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  equals(point = new Point){
    return this.x === point.x && this.y === point.y;
  }

  *[Symbol.iterator]() {
    yield* [this.x, this.y];
  }
}

module.exports = Point;