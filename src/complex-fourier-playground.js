"use strict";

import { support } from "./complex-fourier-series";

// This is a good place to edit code that will appear in codeSamples in complex-fourier-series.ts.

// Also consider support.samples.hilbert[0] ... support.samples.hilbert[3]
//   and support.samples.peanocurve[0] ... support.samples.peanocurve[2] 
support.referencePath.d = support.samples.hilbert[1];
const length = support.referencePath.length;
console.log({length});
function f(t) {
  // Copy the path as is.
  return support.referencePath.getPoint(t * length);
}

