import "./style.css";
import "./dx.css";
import { getById } from "phil-lib/client-misc";
import { selectorQueryAll } from "./utility";
import {
  FULL_CIRCLE,
  lerp,
  makeBoundedLinear,
  makeLinear,
} from "phil-lib/misc";

const WIDTH = 16;
const HEIGHT = 9;
WIDTH * HEIGHT;

const mainSvg = getById("main", SVGSVGElement);
mainSvg;

const dxSizeInput = getById("dxSize", HTMLInputElement);

{
  function updateFromInput() {
    const newSize = dxSizeInput.valueAsNumber;
    setDxSize(newSize);
  }
  dxSizeInput.addEventListener("input", updateFromInput);
  updateFromInput();
}

const colorStops = selectorQueryAll(
  "#radialGradient stop",
  SVGStopElement,
  2,
  2
);

const colorInfo = [
  { color: "red", offset: makeLinear(0, 1, 1, 0) },
  { color: "#00c000", offset: makeLinear(1, 0, 2, 1) },
];

const GREEN = 2;
const YELLOW = 1;
const RED = 0;

/**
 *
 * @param newColor 0 for red, 1 for yellow, 2 for green.
 * Any value in between will work.
 */
function setColor(newColor: number) {
  const index = newColor < 1 ? 0 : 1;
  const { color, offset } = colorInfo[index];
  const offsetValue = offset(newColor);
  colorStops.forEach((colorStop) => {
    colorStop.offset.baseVal = offsetValue;
  });
  colorStops[0].setAttribute("stop-color", color);
}

const colorInput = getById("color", HTMLInputElement);

{
  function updateFromInput() {
    const newColor = colorInput.valueAsNumber;
    setColor(newColor);
  }
  colorInput.addEventListener("input", updateFromInput);
  updateFromInput();
}

function setDxSize(newSize: number) {
  document.body.style.setProperty("--dx-size", `${newSize}px`);
  selectorQueryAll(
    '[data-equation="1"] .big-change-stroke',
    SVGLineElement,
    2,
    2
  ).forEach((line) => {
    const from = line.x1.baseVal.value;
    const to = from + newSize;
    line.x2.baseVal.value = to;
  });
  selectorQueryAll("rect[data-animate]", SVGRectElement).forEach(
    (rectElement) => {
      let adjustWidth = false;
      let adjustHeight = false;
      switch (rectElement.dataset["animate"]) {
        case "horizontal": {
          adjustHeight = true;
          break;
        }
        case "vertical": {
          adjustWidth = true;
          break;
        }
        case "square": {
          adjustHeight = true;
          adjustWidth = true;
          break;
        }
      }
      if (!(adjustHeight || adjustWidth)) {
        throw new Error("wtf");
      }
      if (adjustWidth) {
        rectElement.width.baseVal.value = newSize;
      }
      if (adjustHeight) {
        const bottom =
          rectElement.height.baseVal.value + rectElement.y.baseVal.value;
        const top = bottom - newSize;
        rectElement.y.baseVal.value = top;
        rectElement.height.baseVal.value = newSize;
      }
    }
  );
}

// MARK: for Demo Video

let frameOffset = 0;
function getFrameNumber(minute: number, second: number, frameNumber: number) {
  const FPS = 60;
  return (minute * 60 + second) * FPS + frameNumber - frameOffset;
}

function getStartTime() {
  return getFrameNumber(4, 4, 18);
}
frameOffset = getStartTime();

/** This is 8 seconds before the interesting action starts */
const T_start = getStartTime();
if (T_start) {
  throw new Error("wtf");
}

/**
 * Limit the range of dx.  Keep it small.  Keep it changing, but always small.
 */
const T_switchToSmallDx = getFrameNumber(4, 12, 18);

const STANDARD_WAVELENGTH = T_switchToSmallDx - T_start;

const T_startChangingYellowToRed = getFrameNumber(4, 19, 52);
const T_doneChangingToRed = getFrameNumber(4, 26, 36);

/**
 * Set dx to its smallest possible value here.
 * Then a single trip all the way to the top.
 */
const T_startMovingToBigDx = getFrameNumber(4, 27, 35);
/**
 * Set dx to its largest possible value here.
 * Then start oscillating again around the large values.
 */
const T_finishedMovingToBigDx = getFrameNumber(4, 32, 9);

const T_startMovingFromRedToGreen = getFrameNumber(4, 41, 0);
const T_endAtGreen = getFrameNumber(4, 50, 0);
const T_endOfVideo = getFrameNumber(5, 17, 0);

console.table({
  T_start, // ✖️
  T_switchToSmallDx, // ✖️
  T_startChangingYellowToRed,
  T_doneChangingToRed,
  T_startMovingToBigDx, // ✖️
  T_finishedMovingToBigDx, // ✖️
  T_startMovingFromRedToGreen,
  T_endAtGreen,
  T_endOfVideo,
});

/*
  Times for the upcoming animations:
      0:15:30 - 0:24:45 This left column.
      0:26:00 -   1 
      0:28:26 -   x
      0:32:15 -   x^2
      0:34:20 - x^3
      0:36:15 - 0:37:45 - x^4
      0:42:30 - 0:45:30 - The blue part (of the picture) is the original
      0:45:30 - 1:00:00 - The second column says what if we add some small thing to this.  Highlight all +dx ’s in the second column
      1:04:00 - 1:18:00   - X is a real word number.  Highlight the x’s before the +dx’s.
      1:18:16 - 1:46:45  - Highlight the +dx’s again
      1:48:45 - 1:57:00 - X ^ 0 is a point   highlight everything after the 2nd = sign on the row, starting with blue text
      1:57:00 - 2:10:56 - line
      2:10:56 - 2:28:30 - x^2
      2:28:30 - 2:32:47  x^3
      2:40:40 - 2:56:00 - highlight the blue f4(x), and white - right before it.
      2:56:00 - 3:06:44 - highlight the ÷dx
  See https://www.youtube.com/watch?v=uRtn72SrE10 for the source.
  I am still working on the graphics, but the voiceover is complete.
*/

function makeSineWave({
  startTime,
  startPhase,
  endTime,
  endPhase,
  maxValue,
  minValue,
  waveLength,
}: {
  startTime: number;
  startPhase: number;
  endTime: number;
  endPhase: number;
  maxValue: number;
  minValue: number;
  waveLength?: number;
}) {
  if (waveLength !== undefined) {
    throw new Error("coming soon");
  }
  const phase = makeLinear(startTime, startPhase, endTime, endPhase);
  const amplitude = makeLinear(1, maxValue, -1, minValue);
  const result = (input: number) => {
    return amplitude(Math.sin(phase(input)));
  };
  return result;
}

const TOP = FULL_CIRCLE / 4;
const MIN_DX = 0.05;
const MAX_DX = 0.25;

const initialSineWave = makeSineWave({
  startTime: T_start,
  startPhase: TOP - FULL_CIRCLE / 2,
  endTime: T_switchToSmallDx,
  endPhase: TOP + FULL_CIRCLE / 2,
  maxValue: MAX_DX,
  minValue: MIN_DX,
});
const smallSineWave = makeSineWave({
  startTime: T_switchToSmallDx,
  startPhase: TOP - FULL_CIRCLE / 2,
  endTime: T_startMovingToBigDx,
  endPhase: (FULL_CIRCLE * 7) / 2 + TOP,
  maxValue: lerp(MIN_DX, MAX_DX, 0.2),
  minValue: MIN_DX,
});
const smallToBig = makeSineWave({
  startTime: T_startMovingToBigDx,
  startPhase: FULL_CIRCLE / 2 + TOP,
  endTime: T_finishedMovingToBigDx,
  endPhase: TOP,
  maxValue: MAX_DX,
  minValue: MIN_DX,
});
const bigSineWave = makeSineWave({
  startTime: T_finishedMovingToBigDx,
  startPhase: TOP,
  endTime: T_finishedMovingToBigDx + STANDARD_WAVELENGTH / 2,
  endPhase: TOP + FULL_CIRCLE,
  minValue: lerp(MIN_DX, MAX_DX, 0.8),
  maxValue: MAX_DX,
});
/**
 *
 * @param frameNumber
 */

function showFrameDx(frameNumber: number) {
  if (frameNumber < T_switchToSmallDx) {
    // Initial repeatable single wave.
    // All values of dx.
    // End at the smallest value.
    setDxSize(initialSineWave(frameNumber));
  } else if (frameNumber < T_startMovingToBigDx) {
    // Repeat a wave with small values for dx.
    setDxSize(smallSineWave(frameNumber));
  } else if (frameNumber < T_finishedMovingToBigDx) {
    // One half wavelength, start at the bottom and end at the top.
    setDxSize(smallToBig(frameNumber));
  } else {
    // Repeat a wave with big values for dx.
    setDxSize(bigSineWave(frameNumber));
  }
}

const frameColor1 = makeBoundedLinear(
  T_startChangingYellowToRed,
  YELLOW,
  T_doneChangingToRed,
  RED
);
const frameColor2 = makeBoundedLinear(
  T_startMovingFromRedToGreen,
  RED,
  T_endAtGreen,
  GREEN
);
const frameColorBreak = (T_doneChangingToRed + T_startMovingFromRedToGreen) / 2;
function showFrameColor(frameNumber: number) {
  if (frameNumber < frameColorBreak) {
    setColor(frameColor1(frameNumber));
  } else {
    setColor(frameColor2(frameNumber));
  }
}

function showFrame(frameNumber: number) {
  showFrameDx(frameNumber);
  showFrameColor(frameNumber);
}

const WINDOW = window as any;
WINDOW.showFrame = showFrame;

{
  const frameNumberInput = getById("frameNumber", HTMLInputElement);
  frameNumberInput.min = frameNumberInput.value = T_start.toString();
  frameNumberInput.max = T_endOfVideo.toString();
  function updateFrameNumber() {
    const frameNumber = frameNumberInput.valueAsNumber;
    showFrame(frameNumber);
  }
  frameNumberInput.addEventListener("input", updateFrameNumber);
}

function initScreenCapture(script: unknown) {
  document
    .querySelectorAll("[data-hideBeforeScreenshot]")
    .forEach((element) => {
      if (!(element instanceof SVGElement || element instanceof HTMLElement)) {
        throw new Error("wtf");
      }
      element.style.display = "none";
    });
  return {
    source: "dx.ts",
    devicePixelRatio: devicePixelRatio,
    script,
    firstFrame: T_start,
    lastFrame: T_endOfVideo,
  };
}

WINDOW.initScreenCapture = initScreenCapture;

/**

8 second loop, all yellow, size is a sine wave covering the entire range, beginning and ending at the lowest value.
(Ouch.  That’s not how we normally do it.  Duplicatinging the first and last Fram.  Probably not important 1 frame out of 8 sec * 60 fps.  Annoying)
 * 
 */
