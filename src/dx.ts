import "./style.css";
import "./dx.css";
import { getById } from "phil-lib/client-misc";
import { GetFrameNumber, selectorQueryAll } from "./utility";
import {
  assertFinite,
  FULL_CIRCLE,
  initializedArray,
  lerp,
  makeBoundedLinear,
  makeLinear,
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

const getFrameNumber = new GetFrameNumber(60);

const T_start = 0;
if (T_start) {
  throw new Error("wtf");
}

/**
 * Limit the range of dx.  Keep it small.  Keep it changing, but always small.
 */
const T_switchToSmallDx = getFrameNumber.fromMSF(4, 12, 18);

const STANDARD_WAVELENGTH = 8 * getFrameNumber.framesPerSecond;

const T_startChangingYellowToRed = getFrameNumber.fromMSF(4, 19, 52);
const T_doneChangingToRed = getFrameNumber.fromMSF(4, 26, 36);

/**
 * Set dx to its smallest possible value here.
 * Then a single trip all the way to the top.
 */
const T_startMovingToBigDx = getFrameNumber.fromMSF(4, 27, 35);
/**
 * Set dx to its largest possible value here.
 * Then start oscillating again around the large values.
 */
const T_finishedMovingToBigDx = getFrameNumber.fromMSF(4, 32, 9);

const T_startMovingFromRedToGreen = getFrameNumber.fromMSF(4, 41, 0);
const T_endAtGreen = getFrameNumber.fromMSF(4, 50, 0);
const T_endOfVideo = getFrameNumber.fromMSF(5, 17, 0);

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
      0:42:30 - 0:45:30 - The blue part (of the picture) is the original -- skipped
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
  startTime: T_switchToSmallDx - STANDARD_WAVELENGTH,
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
        cx: 1.5,
        cy: 3.3,
        rx: 1.5,
        ry: 2.5,
      },
      {
        cx: 1.5,
        cy: 7.45,
        rx: 1.3,
        ry: 0.5,
      },
    ],
  },
  {
    start: "0:26:00",
    notes: "1",
    shapes: [
      {
        cx: 2.25,
        cy: 1.5,
        rx: 0.5,
        ry: 0.5,
      },
    ],
  },
  {
    start: "0:28:26",
    notes: "x",
    shapes: [
      {
        cx: 2.25,
        cy: 2.75,
        rx: 0.5,
        ry: 0.5,
      },
    ],
  },
  {
    start: "0:32:15",
    notes: "x^2",
    shapes: [
      {
        cx: 2.25,
        cy: 4,
        rx: 0.5,
        ry: 0.5,
      },
    ],
  },
  {
    start: "0:34:20",
    notes: "x^3",
    shapes: [
      {
        cx: 2.25,
        cy: 5.25,
        rx: 0.5,
        ry: 0.5,
      },
    ],
  },
  {
    start: "0:36:15",
    end: "0:37:45",
    notes: "x^4",
    shapes: [
      {
        cx: 2.25,
        cy: 7.5,
        rx: 0.5,
        ry: 0.5,
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
        cx: 4.4,
        cy: 3.3,
        rx: 0.6,
        ry: 2.5,
      },
      {
        cx: 4.7,
        cy: 7.4,
        rx: 0.6,
        ry: 0.5,
      },
    ],
  },
  {
    start: "1:04:00",
    end: "1:18:00",
    notes: "X is a real word number.  Highlight the x’s before the +dx’s.",
    shapes: [
      {
        cx: 3.65,
        cy: 3.3,
        rx: 0.5,
        ry: 2.5,
      },
      {
        cx: 3.95,
        cy: 7.4,
        rx: 0.5,
        ry: 0.5,
      },
    ],
  },
  {
    start: "1:18:16",
    end: "1:46:45",
    notes: "Highlight the +dx’s again",
    shapes: [
      {
        cx: 4.4,
        cy: 3.3,
        rx: 0.6,
        ry: 2.5,
      },
      {
        cx: 4.7,
        cy: 7.4,
        rx: 0.6,
        ry: 0.5,
      },
    ],
  },

  {
    start: "1:48:45",
    end: "1:57:00",
    notes: "X ^ 0 is a point",
    shapes: [
      {
        cx: 6.5,
        cy: 1.5,
        rx: 0.5,
        ry: 0.6,
      },
    ],
  },
  {
    start: "1:57:00",
    end: "2:10:56",
    notes: "line",
    shapes: [
      { cy: 2.75, cx: 6.2, ry: 0.6, rx: 0.8 },
      { cy: 2.75, cx: 4.2, ry: 0.6, rx: 0.7 },
    ],
  },
  {
    start: "2:10:56",
    end: "2:28:30",
    notes: "x^2 - one around the colorful text, one around all of the pictures",
    shapes: [
      { cy: 3.9, cx: 12.2, ry: 0.9, rx: 2.5 },
      { cy: 4, cx: 7.5, ry: 0.6, rx: 2.1 },
    ],
  },
  {
    start: "2:28:30",
    end: "2:32:47",
    notes: "x^3",
    shapes: [{ cy: 5.8, cx: 8.3, ry: 1.3, rx: 1.1 }],
  },
  {
    start: "2:40:40",
    end: "2:56:00",
    notes: "highlight the blue f4(x), and white - right before it.",
    shapes: [{ cy: 7.5, cx: 6.1, rx: 0.8, ry: 0.6 }],
  },
  {
    start: "2:56:00",
    end: "3:06:44",
    notes: "highlight the ÷dx",
    shapes: [{ cy: 7.5, cx: 7.5, rx: 0.6, ry: 0.6 }],
  },
  {
    start: "3:25:30",
    end: "3:30:00",
    notes: "highlight the 3 yellow images",
    shapes: [{ cy: 6.3, cx: 13.25, ry: 3, rx: 0.75, rotate: "31deg" }],
  },
  {
    start: "3:30:00",
    end: "3:31:21",
    notes: "add the first 2 reds",
    shapes: [{ cy: 6.3, cx: 13.8, ry: 3, rx: 1.3, rotate: "31deg" }],
  },
  {
    start: "3:31:21",
    end: "3:33:00",
    notes: "add the last red",
    shapes: [{ cy: 6.5, cx: 14.1, ry: 3, rx: 1.75, rotate: "31deg" }],
  },
  {
    start: "3:37:30",
    end: "3:43:46",
    notes: "highlight the 3 green pictures",
    shapes: [{ cy: 6, cx: 11.85, ry: 3.5, rx: 1.2, rotate: "40deg" }],
  },
  {
    start: "3:43:46",
    end: "3:56:30",
    notes: "back to all yellow and red highlighted",
    shapes: [{ cy: 6.5, cx: 14.1, ry: 3, rx: 1.75, rotate: "31deg" }],
  },
];

spotlightScript.forEach((scriptItem, index, array) => {
  if (scriptItem.end === undefined) {
    const nextItem = array[index + 1];
    scriptItem.end = nextItem.start;
  }
});

class Spotlight {
  readonly #commands = new Array<{
    startFrame: number;
    endFrame: number;
    shape: QShape;
    mergeBefore: boolean;
    mergeAfter: boolean;
  }>();
  add(startTime: string, endTime: string, shape: QShape) {
    const startFrame = getFrameNumber.fromString(startTime);
    const endFrame = getFrameNumber.fromString(endTime);
    if (startFrame > T_endOfVideo || endFrame > T_endOfVideo) {
      throw new Error("wtf");
    }
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
  static readonly TRANSITION_FRAME_COUNT = getFrameNumber.framesPerSecond / 2;
  getKeyframes(): Keyframe[] {
    type Result = {
      easing: string;
      offset: number;
      d: string;
      transformOrigin: string;
      transform: string;
    };
    const result = new Array<Result>();
    result.push({
      easing: "linear",
      offset: 0,
      ...qShapePathInfo({ cx: 0, cy: 0, rx: 0, ry: 0 }),
    });
    this.#commands.forEach(
      ({ endFrame, mergeAfter, mergeBefore, shape, startFrame }) => {
        if (endFrame - startFrame < Spotlight.TRANSITION_FRAME_COUNT * 2) {
          throw new Error("wtf");
        }
        if (!mergeBefore) {
          const offset = startFrame;
          const easing = "ease-in-out";
          const info = qShapePathInfo({ ...shape, rx: 0, ry: 0 });
          result.push({ offset, easing, ...info });
        }
        {
          const info = qShapePathInfo(shape);
          result.push({
            offset: startFrame + Spotlight.TRANSITION_FRAME_COUNT,
            easing: "linear",
            ...info,
          });
          result.push({
            offset: endFrame - Spotlight.TRANSITION_FRAME_COUNT,
            easing: "ease-in-out",
            ...info,
          });
        }
        if (!mergeAfter) {
          const offset = endFrame;
          const easing = "linear";
          const info = qShapePathInfo({ ...shape, rx: 0, ry: 0 });
          result.push({ offset, easing, ...info });
        }
      }
    );
    result.forEach((item) => {
      item.offset /= T_endOfVideo;
      if (item.offset > 1) {
        throw new Error("wtf");
      }
    });
    return result;
  }
  static #animations: readonly Animation[] | undefined;
  static showFrame(frameNumber: number) {
    this.#animations ??= this.create().map((info) => info.animation);
    this.#animations.forEach((animation) => {
      animation.currentTime = frameNumber;
    });
  }

  static create(
    script: readonly ScriptItem[] = spotlightScript,
    group = highlightsGroup
  ) {
    const resultCount = Math.max(...script.map((item) => item.shapes.length));
    const spotlights = initializedArray(resultCount, () => new this());
    script.forEach((scriptItem) => {
      scriptItem.shapes.forEach((qShape, index) => {
        const spotlight = spotlights[index];
        spotlight.add(scriptItem.start, scriptItem.end!, qShape);
      });
    });
    group.innerHTML = "";
    const result = spotlights.map((spotlight) => {
      const element = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      group.appendChild(element);
      const keyframes = spotlight.getKeyframes();
      const animation = element.animate(keyframes, {
        duration: T_endOfVideo /*(T_endOfVideo / FPS) * 1000*/,
        fill: "both",
      });
      animation.pause();
      return { spotlight, element, keyframes, animation };
    });
    return result;
  }
}

function showFrame(frameNumber: number) {
  showFrameDx(frameNumber);
  showFrameColor(frameNumber);
  Spotlight.showFrame(frameNumber);
}

const WINDOW = window as any;
WINDOW.showFrame = showFrame;

WINDOW.Spotlight = Spotlight;

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

const highlightsGroup = getById("highlights", SVGGElement);

type QShape = {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly rotate?: string;
};

function qShapePathInfo({ cx, cy, rx, ry, rotate }: QShape) {
  assertFinite(cx, cy, rx, ry);
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
  const transformOrigin = `${cx}px ${cy}px`;
  rotate ??= "0deg";
  const transform = `rotate(${rotate})`;
  return { d, transformOrigin, transform };
}

function showSpotlights(shapes: readonly QShape[]) {
  highlightsGroup.innerHTML = "";
  shapes.forEach((qShape) => {
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    const { d, transformOrigin, transform } = qShapePathInfo(qShape);
    element.style.d = d;
    element.style.transformOrigin = transformOrigin;
    element.style.transform = transform;
    highlightsGroup.appendChild(element);
  });
}

WINDOW.showSpotlights = showSpotlights;

function ssl(index: number) {
  showSpotlights(spotlightScript[index].shapes);
}

WINDOW.ssl = ssl;

{
  // This is part of an idea for showing how numbers can degrade when
  // we abuse the precision of the numbers.
  const numerator = 1234;
  const denominator = 98765;
  const correctValue = numerator / denominator;
  const inputs = function* () {
    for (let digits = 15; digits <= 22; digits += 0.25) {
      yield digits;
    }
    return;
  };
  const badData = Array.from(inputs(), (digits) => {
    const bigNumber = 10 ** digits;
    const adjustedNumerator = bigNumber + numerator - bigNumber;
    const adjustedDenominator = bigNumber + denominator - bigNumber;
    const adjustedValue = adjustedNumerator / adjustedDenominator;
    const error = (adjustedValue - correctValue) / correctValue;
    return {
      digits,
      adjustedNumerator,
      adjustedDenominator,
      adjustedValue,
      error,
    };
  });
  console.table(badData);
}
