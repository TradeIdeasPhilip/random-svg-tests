import "./style.css";
import "./dx.css";
import { getById } from "phil-lib/client-misc";
import { selectorQueryAll } from "./utility";
import {
  FULL_CIRCLE,
  lerp,
  makeBoundedLinear,
  makeLinear,
  parseFloatX,
  parseIntX,
} from "phil-lib/misc";
import { PathBuilder } from "./path-shape";

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
const FPS = 60;
function getFrameNumber(minute: number, second: number, frameNumber: number) {
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
 *
 * @deprecated This doesn't work any more and probably won't be replaced.
 */
function dumpSpotlight() {
  const items: object[] = [];
  document.querySelectorAll("ellipse").forEach((element) => {
    const style = getComputedStyle(element);
    const cx = style.cx;
    const cy = style.cy;
    const rx = style.rx;
    const ry = style.ry;
    const e = { cx, cy, rx, ry };
    items.push(e);
  });
  return items;
}

/**
 *
 * @deprecated This doesn't work any more and probably won't be replaced.
 */
function setSpotlight(
  { cx, cy, rx, ry }: { cx: string; cy: string; rx: string; ry: string },
  instance = 0
) {
  const style = document.querySelectorAll("ellipse")[instance].style;
  style.cx = cx;
  style.cy = cy;
  style.rx = rx;
  style.ry = ry;
  style.transformOrigin = `${cx} ${cy}`;
}

WINDOW.dumpSpotlight = dumpSpotlight;
WINDOW.setSpotlight = setSpotlight;

type Pixels = number | string;

const highlightsGroup = getById("highlights", SVGGElement);

type QShape = {
  readonly cx: Pixels;
  readonly cy: Pixels;
  readonly rx: Pixels;
  readonly ry: Pixels;
  readonly rotate?: string;
};

function showSpotlights(shapes: readonly QShape[]) {
  function asNumber(pixels: Pixels) {
    if (typeof pixels == "number") {
      return pixels;
    } else {
      const striped = /^(.*?)(px)?$/.exec(pixels)?.[1];
      const parsed = parseFloatX(striped);
      if (parsed === undefined) {
        throw new Error("wtf");
      }
      return parsed;
    }
  }
  highlightsGroup.innerHTML = "";
  shapes.forEach((shape) => {
    const cx = asNumber(shape.cx);
    const cy = asNumber(shape.cy);
    const rx = asNumber(shape.rx);
    const ry = asNumber(shape.ry);
    const x0 = cx - rx;
    const x1 = cx + rx;
    const y0 = cy - ry;
    const y1 = cy + ry;
    const pathBuilder = PathBuilder.M(x0, cy)
      .Q_VH(cx, y0)
      .Q_HV(x1, cy)
      .Q_VH(cx, y1)
      .Q_HV(x0, cy);
    const d = pathBuilder.pathShape.cssPath;
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    element.style.d = d;
    if (shape.rotate !== undefined) {
      element.style.transformOrigin = `${cx}px ${cy}px`;
      element.style.transform = `rotate(${shape.rotate})`;
    }
    highlightsGroup.appendChild(element);
  });
}

type ScriptItem = {
  start: string;
  end?: string;
  notes: string;
  shapes: QShape[];
};

const spotlightScript: ScriptItem[] = [
  {
    start: "0:15:30",
    end: "0:24:45",
    notes: "This left column.",
    shapes: [
      {
        cx: "1.5px",
        cy: "3.3px",
        rx: "1.5px",
        ry: "2.5px",
      },
      {
        cx: "1.5px",
        cy: "7.45px",
        rx: "1.3px",
        ry: "0.5px",
      },
    ],
  },
  {
    start: "0:26:00",
    notes: "1",
    shapes: [
      {
        cx: "2.25px",
        cy: "1.5px",
        rx: "0.5px",
        ry: "0.5px",
      },
    ],
  },
  {
    start: "0:28:26",
    notes: "x",
    shapes: [
      {
        cx: "2.25px",
        cy: "2.75px",
        rx: "0.5px",
        ry: "0.5px",
      },
    ],
  },
  {
    start: "0:32:15",
    notes: "x^2",
    shapes: [
      {
        cx: "2.25px",
        cy: "4px",
        rx: "0.5px",
        ry: "0.5px",
      },
    ],
  },
  {
    start: "0:34:20",
    notes: "x^3",
    shapes: [
      {
        cx: "2.25px",
        cy: "5.25px",
        rx: "0.5px",
        ry: "0.5px",
      },
    ],
  },
  {
    start: "0:36:15",
    end: "0:37:45",
    notes: "x^4",
    shapes: [
      {
        cx: "2.25px",
        cy: "7.5px",
        rx: "0.5px",
        ry: "0.5px",
      },
    ],
  },
  {
    start: "0:45:30",
    end: "1:00:00",
    notes:
      "The second column says what if we add some small thing to this.  Highlight all +dx ’s in the second column",
    shapes: [
      {
        cx: "4.4px",
        cy: "3.3px",
        rx: "0.6px",
        ry: "2.5px",
      },
      {
        cx: "4.7px",
        cy: "7.4px",
        rx: "0.6px",
        ry: "0.5px",
      },
    ],
  },
  {
    start: "1:04:00",
    end: "1:18:00",
    notes: "X is a real word number.  Highlight the x’s before the +dx’s.",
    shapes: [
      {
        cx: "3.65px",
        cy: "3.3px",
        rx: "0.5px",
        ry: "2.5px",
      },
      {
        cx: "3.95px",
        cy: "7.4px",
        rx: "0.5px",
        ry: "0.5px",
      },
    ],
  },
  {
    start: "1:18:16",
    end: "1:46:45",
    notes: "Highlight the +dx’s again",
    shapes: [
      {
        cx: "4.4px",
        cy: "3.3px",
        rx: "0.6px",
        ry: "2.5px",
      },
      {
        cx: "4.7px",
        cy: "7.4px",
        rx: "0.6px",
        ry: "0.5px",
      },
    ],
  },
  {
    start: "3:25:30",
    end: "3:30:00",
    notes: "highlight the 3 yellow images",
    shapes: [
      { cy: "6.3px", cx: "13.25px", ry: "3px", rx: "0.75px", rotate: "31deg" },
    ],
  },
  {
    start: "3:30:00",
    end: "3:31:21",
    notes: "add the first 2 reds",
    shapes: [
      { cy: "6.3px", cx: "13.8px", ry: "3px", rx: "1.3px", rotate: "31deg" },
    ],
  },
  {
    start: "3:31:21",
    end: "3:33:00",
    notes: "add the last red",
    shapes: [
      { cy: "6.5px", cx: "14.1px", ry: "3px", rx: "1.75px", rotate: "31deg" },
    ],
  },

  //
  {
    start: "3:37:30",
    end: "3:43:46",
    notes: "highlight the 3 green pictures",
    shapes: [
      { cy: "6px", cx: "11.85px", ry: "3.5px", rx: "1.2px", rotate: "40deg" },
    ],
  },
];

spotlightScript.forEach((scriptItem, index, array) => {
  if (scriptItem.end === undefined) {
    const nextItem = array[index + 1];
    scriptItem.end = nextItem.start;
  }
});

class Spotlight {
  static frameTimeToFrameNumber(time: string) {
    const pieces = /^([0-9]+):([0-9]+):([0-9]+)$/.exec(time);
    if (!pieces) {
      throw new Error("wtf");
    }
    const minutes = parseIntX(pieces[0]);
    const seconds = parseIntX(pieces[1]);
    const frames = parseIntX(pieces[2]);
    if (
      minutes === undefined ||
      seconds === undefined ||
      frames === undefined
    ) {
      throw new Error("wtf");
    }
    const result = (minutes * 60 + seconds) * FPS + frames;
    return result;
  }
  readonly #commands = new Array<{
    startFrame: number;
    endFrame: number;
    shape: QShape;
    mergeBefore: boolean;
    mergeAfter: boolean;
  }>();
  add(startTime: string, endTime: string, shape: QShape) {
    const startFrame = Spotlight.frameTimeToFrameNumber(startTime);
    const endFrame = Spotlight.frameTimeToFrameNumber(endTime);
    const previousCommand = this.#commands.at(-1);
    let mergeBefore = false;
    if (previousCommand) {
      if (startFrame < previousCommand.startFrame) {
        throw new Error("wtf");
      }
      mergeBefore = startFrame == previousCommand.endFrame;
      previousCommand.mergeAfter = mergeBefore;
    }
    this.#commands.push({
      startFrame,
      endFrame,
      shape,
      mergeBefore,
      mergeAfter: false,
    });
  }
  getKeyframes(): Keyframe[] {
    type Result = {
      easing: string;
      offset: number;
      d: string;
      transformOrigin: string;
      transform: string;
    };
    const result = new Array<Result>();
    this.#commands.forEach((command) => {});
    return result;
  }
}
//  -   -
// ...
// 1:48:45 - 1:57:00 - X ^ 0 is a point   highlight everything after the 2nd = sign on the row, starting with blue text

/*
1:48:45 - 1:57:00 - X ^ 0 is a point   highlight just the point.
1:57:00 - 2:10:56 - line    highlight the input and the output, which are both x + dx.
2:10:56 - 2:28:30 - x^2   one around the colorful text, one around all of the pictures.
2:28:30 - 2:32:47  x^3     highlight just the combined cube.
2:40:40 - 2:56:00 - highlight the blue f4(x), and white - right before it.
2:56:00 - 3:06:44 - highlight the ÷dx
3:25:30 - 3:30:00    - highlight the 3 yellow images
3:30:00 - 3:31:21 - add the first 2 reds
3:31:21 -  3:33:00 - add the last red
3:37:30 - 3:43:46 - highlight the 3 green pictures.
3:43:46 - 3:56:30 - back to all yellow and red highlighted 
 */

WINDOW.showSpotlights = showSpotlights;

function ssl(index: number) {
  showSpotlights(spotlightScript[index].shapes);
}

WINDOW.ssl = ssl;
