// weightedRandomSelector.js
//
// simple weighted random selector.
//
// Copyright © 2013, 2014 Dino Chiesa and Apigee Corp
// All rights reserved.
//
// created: Fri, 26 Jul 2013  11:14
// last saved: <2014-May-30 06:56:29>
//
// --------------------------------------------------------

function WeightedRandomSelector(a) {
  // This implements a weighted random selector, over an array. The
  // argument a must be an array of arrays. Each inner array is 2
  // elements, with the item value as the first element and the weight
  // for that value as the second. The items need not be in any
  // particular order.  Example usage:
  //
  // var fish = [
  // //  name      weight
  //   ["Shark",      3],
  //   ["Shrimp",     50],
  //   ["Sardine",    10],
  //   ["Herring",    20],
  //   ["Anchovies",  10],
  //   ["Mackerel",   50],
  //   ["Tuna",       8]
  // ];
  //
  // var wrs = new WeightedRandomSelector(fish);
  // var selected = wrs.select();
  // var fishType = selected[0];
  //

  var i, L;
  this.totalWeight = 0;
  this.a = a;
  this.selectionCounts = [];
  this.weightThreshold = [];
  // initialize
  for (i = 0, L = a.length; i<L; i++) {
    this.totalWeight += a[i][1];
    this.weightThreshold[i] = this.totalWeight;
    this.selectionCounts[i] = 0;
  }
}

WeightedRandomSelector.prototype.select = function() {
  // select a random value
  var R = Math.floor(Math.random() * this.totalWeight),
      i, L;

  // now find the bucket that R value falls into.
  for (i = 0, L = this.a.length; i < L; i++) {
    if (R < this.weightThreshold[i]) {
      this.selectionCounts[i]++;
      return(this.a[i]);
    }
  }
  return this.a[L - 1];
};


module.exports = WeightedRandomSelector;
