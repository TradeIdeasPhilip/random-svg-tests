import "./style.css";
import "./bug-splat.css";
import {
  AnimationLoop,
  querySelector,
  querySelectorAll,
} from "phil-lib/client-misc";
import { LinearFunction, makeLinear } from "phil-lib/misc";

// See result at:  https://www.youtube.com/watch?v=BgSACVlGmbg

const expectedDurationMs = (47 + 38 / 60) * 1000;
console.log(expectedDurationMs / 1000);

function initScreenCapture(script: unknown) {
  return {
    source: "bug-splat.ts",
    devicePixelRatio: devicePixelRatio,
    expectedDurationMs,
    script,
  };
}

const circleElement = querySelector("circle", SVGCircleElement);

function updateScale(t: number) {
  const scale = 2 ** (t * 4);
  const transform = `scale(${scale})`;
  circleElement.style.transform = transform;
}

const turbulenceElement = querySelector("feturbulence", SVGFETurbulenceElement);

const textElements = querySelectorAll("text", SVGTextElement, 2, 2);

function setNumOctaves(numOctaves: number) {
  turbulenceElement.numOctaves.baseVal = numOctaves;
  const text = `numOctaves = ${numOctaves}`;
  textElements.forEach((element) => (element.textContent = text));
}
setNumOctaves(2);

const octaves = [1, 2, 3, 4];

function showFrame(t: number) {
  const index = Math.min((t * octaves.length) | 0, octaves.length - 1);
  const scale = t * octaves.length - index;
  updateScale(scale);
  setNumOctaves(octaves[index]);
}

const GLOBAL = window as any;
GLOBAL.initScreenCapture = initScreenCapture;
GLOBAL.showFrame = showFrame;

let currentlyRunning: AnimationLoop | undefined;

function animate(durationMs = expectedDurationMs) {
  currentlyRunning?.cancel();
  currentlyRunning = undefined;
  let f: LinearFunction | undefined;
  const animationLoop = new AnimationLoop((time) => {
    if (f === undefined) {
      f = makeLinear(time, 0, time + durationMs, 1);
    } else {
      const t = f(time);
      if (t > 1) {
        showFrame(1);
        animationLoop.cancel();
      } else {
        showFrame(t);
      }
    }
  });
  currentlyRunning = animationLoop;
}

GLOBAL.animate = animate;
GLOBAL.setNumOctaves = setNumOctaves;
