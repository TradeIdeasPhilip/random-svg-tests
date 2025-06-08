"use strict";

import { support } from "./complex-fourier-series";

// This is a good place to edit code that will appear in codeSamples in complex-fourier-series.ts.

{
  const corners = [
    { x: -0.5, y: -0.5 },
    { x: 0.5, y: -0.5 },
    { x: 0.5, y: 0.5 },
    { x: -0.5, y: 0.5 },
  ];
  const tSplitter = support.makeTSplitterA(0, corners.length, 0);
  function f(t) {
    const segment = tSplitter(t);
    return support.lerpPoints(
      corners[segment.index],
      corners[(segment.index + 1) % corners.length],
      support.ease(segment.t)
    );
  }
}
