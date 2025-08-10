import { AnimationLoop, getById, selectorQuery } from "phil-lib/client-misc";
import {
  groupTerms,
  hasFixedContribution,
  makePolygon,
  recenter,
  samplesFromPath,
  samplesToFourier,
  termsToParametricFunction,
} from "./fourier-shared";
import { samples } from "./fourier-samples";
import "./path-to-fourier.css";
import { panAndZoom } from "./transforms";
import { ParametricToPath, PathShape } from "./path-shape";
import { FIGURE_SPACE, makeBoundedLinear, makeLinear } from "phil-lib/misc";
import { ease } from "./utility";
import { HandwritingEffect } from "./handwriting-effect";
import { TextLayout } from "./letters-more";

const numberOfFourierSamples = 1024;

const scaleG = getById("scaled", SVGGElement);
const referencePath = getById("reference", SVGPathElement);
const samplesPath = getById("samples", SVGPathElement);

type Options = {
  pathString: string;
  maxGroupsToDisplay: number;
  topText?: string;
  bottomText?: string;
};

// TODO add in y1 and y2, rather than just assuming they are 0 and 1.
function makeEasing(x1: number, x2: number) {
  if (x1 >= x2) {
    throw new Error("wtf");
  }
  const inputMap = makeLinear(x1, 0, x2, 1);
  function customEasing(t: number) {
    if (t <= x1) {
      return 0;
    } else if (t >= x2) {
      return 1;
    }
    const input = inputMap(t);
    const eased = ease(input);
    return eased;
  }
  return customEasing;
}

let scriptEndTime = NaN;

let showFrame = (timeInMs: number): void => {
  timeInMs;
  console.error("not ready yet");
};

(window as any).showFrame = (frameNumber: number) => {
  const timeInMs = (frameNumber / 60) * 1000;
  showFrame(timeInMs);
};

function initialize(options: Options) {
  // Reference path.
  referencePath.setAttribute("d", options.pathString);
  const transform = panAndZoom(
    referencePath.getBBox(),
    //mainSvg.viewBox.baseVal,
    { x: 1, y: 1, width: 14, height: 7 },
    "srcRect fits completely into destRect",
    1
  );
  const scale = transform.a;
  scaleG.style.transform = transform.toString();
  scaleG.style.setProperty("--path-scale", scale.toString());
  // Take the samples.
  const samples = samplesFromPath(options.pathString, numberOfFourierSamples);
  // Show where were the samples taken.
  let samplesPathD = "";
  samples.forEach(([x, y]) => {
    samplesPathD += `M${x},${y}l0,0`;
  });
  samplesPath.setAttribute("d", samplesPathD);
  // Create terms
  const terms = samplesToFourier(samples);
  (window as any).debugPath = (termCount: number) => {
    const parametricFunction = termsToParametricFunction(terms, termCount);
    const parametricToPath = new ParametricToPath(parametricFunction);
    parametricToPath.go(5000);
    parametricToPath.dump();
    console.log(parametricToPath);
    referencePath.setAttribute("d", parametricToPath.pathShape.rawPath);
  };
  console.log("Try debugPath(2);");
  const script = groupTerms({
    addTime: 4800,
    pauseTime: 200,
    maxGroupsToDisplay: options.maxGroupsToDisplay,
    terms,
    skipCountAtEnd: 0,
  });
  scriptEndTime = script.at(-1)!.endTime;
  const getMaxFrequency = (numberOfTerms: number) => {
    const maxFrequency = Math.max(
      ...terms.slice(0, numberOfTerms).map((term) => Math.abs(term.frequency))
    );
    return maxFrequency;
  };
  const recommendedNumberOfSegments = (numberOfTerms: number) => {
    const maxFrequency = getMaxFrequency(numberOfTerms);
    return 8 * maxFrequency + 7;
  };
  const timeToPath: ((time: number) => string)[] = script.map((scriptEntry) => {
    if (scriptEntry.addingCircles == 0) {
      const parametricFunction = termsToParametricFunction(
        terms,
        scriptEntry.usingCircles
      );
      const numberOfDisplaySegments = recommendedNumberOfSegments(
        scriptEntry.usingCircles
      );
      const path = PathShape.glitchFreeParametric(
        parametricFunction,
        numberOfDisplaySegments
      );
      return () => path.rawPath;
    } else if (
      scriptEntry.usingCircles == 0 &&
      scriptEntry.addingCircles == 1 &&
      terms[0].frequency == 0
    ) {
      /**
       * Special case:  A dot is moving.
       *    Going from 0 terms to 1 term with frequency = zero.
       *    Don't even think about the animation that we do in other places.
       *    This script is completely unique.
       *    Draw a single line for the path.
       *    Both ends start at the first point.
       *    Use makeEasing() to move the points smoothly.
       */
      const { startTime, endTime } = scriptEntry;
      const duration = endTime - startTime;
      const getLeadingProgress = makeEasing(
        startTime,
        startTime + duration / 2
      );
      const getTrailingProgress = makeEasing(startTime, endTime);
      const goal = hasFixedContribution(terms[0])!;
      /**
       * @param t A value between 0 and 1.
       * @returns The coordinates as a string.
       */
      function location(t: number) {
        return `${goal.x * t},${goal.y * t}`;
      }
      return (t: number) => {
        const trailingProgress = getTrailingProgress(t);
        const from = location(trailingProgress);
        const leadingProgress = getLeadingProgress(t);
        const to = location(leadingProgress);
        const pathString = `M ${from} L ${to}`;
        // console.log({ t, trailingProgress, leadingProgress, pathString });
        return pathString;
      };
    } else {
      const maxFrequency = getMaxFrequency(
        scriptEntry.usingCircles + scriptEntry.addingCircles
      );
      const r = 0.2 / maxFrequency;
      /**
       * This creates a function which takes a time in milliseconds,
       * 0 at the beginning of the script.
       * The output is scaled to the range 0 - 1,
       * for use with PathShape.parametric().
       * The output might be outside of that range.
       * I.e. the input and output are both numbers but they are interpreted on different scales.
       */
      const timeToCenter = makeBoundedLinear(
        scriptEntry.startTime,
        -r,
        scriptEntry.endTime,
        1 + r
      );
      const usingFunction = termsToParametricFunction(
        terms,
        scriptEntry.usingCircles
      );
      const addingFunction = termsToParametricFunction(
        terms,
        scriptEntry.addingCircles,
        scriptEntry.usingCircles
      );
      let numberOfDisplaySegments = recommendedNumberOfSegments(
        scriptEntry.usingCircles + scriptEntry.addingCircles
      );
      if (
        scriptEntry.usingCircles == 0 ||
        (scriptEntry.usingCircles == 1 && hasFixedContribution(terms[0]))
      ) {
        // We are converting from a dot to something else.
        const startingPoint = hasFixedContribution(terms[0]) ?? { x: 0, y: 0 };
        return (timeInMs: number): string => {
          const centerOfChange = timeToCenter(timeInMs);
          const startOfChange = centerOfChange - r;
          const endOfChange = centerOfChange + r;
          const getFraction = makeEasing(startOfChange, endOfChange);
          /**
           * 0 to `safePartEnds`, inclusive are safe inputs to `parametricFunction()`.
           */
          const safePartEnds = Math.min(1, endOfChange);
          if (safePartEnds <= 0) {
            // There is no safe part!
            return `M${startingPoint.x},${startingPoint.y} L${startingPoint.x},${startingPoint.y}`;
          } else {
            const frugalSegmentCount = Math.ceil(
              // TODO that 150 is crude.  The transition might require
              // more detail than the before or the after.
              // Or it might require less, not that we are glitch-free.
              Math.max(numberOfDisplaySegments, 150) * safePartEnds
            );
            function parametricFunction(t: number) {
              t = t * safePartEnds;
              const base = usingFunction(t);
              const fraction = 1 - getFraction(t);
              if (fraction == 0) {
                return base;
              } else {
                const adding = addingFunction(t);
                return {
                  x: base.x + fraction * adding.x,
                  y: base.y + fraction * adding.y,
                };
              }
            }
            const path = PathShape.glitchFreeParametric(
              parametricFunction,
              frugalSegmentCount
            );
            return path.rawPath;
          }
        };
      } else {
        // Common case:  Converting from one normal shape into another.
        return (timeInMs: number): string => {
          const centerOfChange = timeToCenter(timeInMs);
          const getFraction = makeEasing(
            centerOfChange - r,
            centerOfChange + r
          );
          function parametricFunction(t: number) {
            const base = usingFunction(t);
            const fraction = 1 - getFraction(t);
            if (fraction == 0) {
              return base;
            } else {
              const adding = addingFunction(t);
              return {
                x: base.x + fraction * adding.x,
                y: base.y + fraction * adding.y,
              };
            }
          }
          const path = PathShape.glitchFreeParametric(
            parametricFunction,
            numberOfDisplaySegments
          );
          return path.rawPath;
        };
      }
    }
  });
  const amplitudeHelper = new Intl.NumberFormat("en-US", {
    minimumSignificantDigits: 5,
    maximumSignificantDigits: 5,
    useGrouping: false,
  }).format;
  const formatAmplitude = (value: number): string => {
    if (value < 0) {
      // I saw this once.
      // Something should have been zero but through round-off error became negative.
      // It caused problems downstream.
      value = 0;
    }
    let result = amplitudeHelper(value);
    const [, beforeDecimalPoint, afterDecimalPoint] =
      /^([0-9]+)\.([0-9]+)$/.exec(result)!;
    switch (beforeDecimalPoint.length) {
      case 3: {
        // Already perfect.  E.g. 100.00
        break;
      }
      case 2: {
        // E.g. 10.000
        result = FIGURE_SPACE + result;
        break;
      }
      case 1: {
        // E.g. 1.0000
        result = FIGURE_SPACE + FIGURE_SPACE + result;
        break;
      }
      default: {
        console.warn({ beforeDecimalPoint, afterDecimalPoint, result });
        throw new Error("wtf");
      }
    }
    return result + "%";
  };
  /**
   * Cached.
   *
   * So I don't have to think about the performance of formatAmplitude()
   */
  const formatted = script.map((scriptEntry) => ({
    usingAmplitude: formatAmplitude(scriptEntry.usingAmplitude),
    addingAmplitude: formatAmplitude(scriptEntry.addingAmplitude),
    availableAmplitude: formatAmplitude(scriptEntry.availableAmplitude),
  }));
  const usingCirclesElement = selectorQuery(
    "[data-using] [data-circles]",
    HTMLTableCellElement
  );
  const usingAmplitudeElement = selectorQuery(
    "[data-using] [data-amplitude]",
    HTMLTableCellElement
  );
  const addingCirclesElement = selectorQuery(
    "[data-adding] [data-circles]",
    HTMLTableCellElement
  );
  const addingAmplitudeElement = selectorQuery(
    "[data-adding] [data-amplitude]",
    HTMLTableCellElement
  );
  const availableCirclesElement = selectorQuery(
    "[data-available] [data-circles]",
    HTMLTableCellElement
  );
  const availableAmplitudeElement = selectorQuery(
    "[data-available] [data-amplitude]",
    HTMLTableCellElement
  );
  function initializeHandwriting(parent: SVGGElement, text: string) {
    const handwriting = new HandwritingEffect(parent);
    const textLayout = new TextLayout(0.5);
    textLayout.leftMargin = 0;
    textLayout.rightMargin = 16;
    textLayout.CRLF();
    const layoutInfo = textLayout.addText(text);
    layoutInfo.forEach((letter) => {
      handwriting.add({
        baseline: letter.baseline,
        x: letter.x,
        shape: letter.description.shape,
      });
    });
    const strokeWidth = textLayout.font.get("0")!.fontMetrics.strokeWidth;
    parent.style.strokeWidth = strokeWidth.toString();
    handwriting.setProgress(0);
    return handwriting;
  }
  const topHandwriting = initializeHandwriting(
    getById("topText", SVGGElement),
    options.topText ?? ""
  );
  const bottomHandwriting = initializeHandwriting(
    getById("bottomText", SVGGElement),
    options.bottomText ?? ""
  );
  showFrame = (timeInMs: number) => {
    topHandwriting.setProgressLength(((timeInMs - 750) / 1000) * 3);
    bottomHandwriting.setProgressLength(((timeInMs - 5000) / 1000) * 3);
    // Which section of the script applies at this time?
    function getIndex() {
      // Should this be a binary search?
      /**
       * The first script item that hasn't ended yet.
       */
      const index = script.findIndex(({ endTime }) => timeInMs < endTime);
      if (index == -1) {
        // Past the end.  Use the last script item.
        return script.length - 1;
      } else {
        return index;
      }
    }
    const index = getIndex();

    // Update the table
    const formatCircleCount = (value: number) =>
      `${value.toString().padStart(4, FIGURE_SPACE)}`;
    const scriptEntry = script[index];
    usingCirclesElement.innerText = formatCircleCount(scriptEntry.usingCircles);
    addingCirclesElement.innerText = formatCircleCount(
      scriptEntry.addingCircles
    );
    availableCirclesElement.innerText = formatCircleCount(
      scriptEntry.availableCircles
    );
    [
      {
        value: scriptEntry.usingCircles,
        element1: usingCirclesElement,
        element2: usingAmplitudeElement,
      },
      {
        value: scriptEntry.addingCircles,
        element1: addingCirclesElement,
        element2: addingAmplitudeElement,
      },
      {
        value: scriptEntry.availableCircles,
        element1: availableCirclesElement,
        element2: availableAmplitudeElement,
      },
    ].forEach(({ value, element1, element2 }) => {
      const opacity = value == 0 ? "0.5" : "";
      element1.style.opacity = opacity;
      element2.style.opacity = opacity;
    });
    const f = formatted[index];
    usingAmplitudeElement.innerText = f.usingAmplitude;
    addingAmplitudeElement.innerText = f.addingAmplitude;
    availableAmplitudeElement.innerText = f.availableAmplitude;

    // Draw the path
    const pathString = PathShape.cssifyPath(timeToPath[index](timeInMs));
    scaleG.style.setProperty("--d", pathString);
  };
}

const scripts = new Map<string, Options>([
  [
    "likeShareAndSubscribe",
    {
      maxGroupsToDisplay: 30,
      pathString: samples.likeShareAndSubscribe,
      topText: "Cursive Writing",
      bottomText: "Hershey Fonts",
    },
  ],
  [
    "hilbert0",
    {
      maxGroupsToDisplay: 9,
      pathString: samples.hilbert[0],
      topText: "Hilbert, First Order",
      bottomText: "Wikipedia",
    },
  ],
  [
    "hilbert1",
    {
      maxGroupsToDisplay: 20,
      pathString: recenter(samples.hilbert[1]).rawPath,
      topText: "Hilbert, Second Order",
      bottomText: "Wikipedia",
    },
  ],
  [
    "hilbert4",
    {
      maxGroupsToDisplay: 30,
      pathString: recenter(samples.hilbert[4]).rawPath,
      topText: "Hilbert, Fifth Order",
      bottomText: "Wikipedia",
    },
  ],
  [
    "p0",
    {
      maxGroupsToDisplay: 7,
      pathString: recenter(samples.peanocurve[0]).rawPath,
      topText: "Peano Curve #0",
      bottomText: "Wikipedia",
    },
  ],
  [
    "p1",
    {
      maxGroupsToDisplay: 10,
      pathString: recenter(samples.peanocurve[1]).rawPath,
      topText: "Peano Curve #1",
      bottomText: "Wikipedia",
    },
  ],
  [
    "p2",
    {
      maxGroupsToDisplay: 20,
      pathString: recenter(samples.peanocurve[2]).rawPath,
      topText: "Peano Curve #2",
      bottomText: "Wikipedia",
    },
  ],
  [
    "square",
    {
      maxGroupsToDisplay: 7,
      pathString: "M-0.5,-0.667 h 1 v 1 h -1 z",
    },
  ],
  [
    "ellipse",
    {
      maxGroupsToDisplay: 7,
      pathString: "M1,0 A1,1.25 0 1 1 -1,0 A1,1.25 0 1 1 1,0 z",
    },
  ],
  [
    "star7",
    {
      maxGroupsToDisplay: 8,
      pathString: makePolygon(7, 2, "My seed 2025a").rawPath,
      topText: "Random 7 Pointed Star",
      bottomText: 'makePolygon(7,2, "My seed 2025a")',
    },
  ],
  [
    "Daphne_Oram_1",
    {
      maxGroupsToDisplay: 17,
      pathString: recenter(samples.daphneOram1).rawPath,
      topText: "Daphne Oram #1",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "Daphne_Oram_2",
    {
      maxGroupsToDisplay: 22,
      pathString: recenter(samples.daphneOram2, 0.025, 0.71).rawPath,
      topText: "Daphne Oram #2",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "water_opossum",
    {
      maxGroupsToDisplay: 9,
      pathString: samples.waterOpossum,
      topText: "Water Opossum",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "cat",
    {
      maxGroupsToDisplay: 9,
      pathString: recenter(samples.cat).rawPath,
      topText: "Cat",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "airplane",
    {
      maxGroupsToDisplay: 15,
      pathString: recenter(samples.airplane, 0.3, 0.7).rawPath,
      topText: "Airplane",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "head_facing_right",
    {
      maxGroupsToDisplay: 12,
      pathString: recenter(samples.headFacingRight).rawPath,
      topText: "Head Facing Right",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "Lavater",
    {
      maxGroupsToDisplay: 8,
      pathString: recenter(samples.lavater).rawPath,
      topText: "Johann Kaspar Lavaters",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "man_walking",
    {
      maxGroupsToDisplay: 16,
      pathString: recenter(samples.manWalking).rawPath,
      bottomText: "Wikimedia Commons",
      topText: "Man Walking",
    },
  ],
  [
    "bear",
    {
      maxGroupsToDisplay: 16,
      pathString: recenter(samples.bear).rawPath,
      topText: "Bear",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "head_facing_left",
    {
      maxGroupsToDisplay: 13,
      pathString: recenter(samples.headFacingLeft).rawPath,
      topText: "Head Facing Left",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "kiwi",
    {
      maxGroupsToDisplay: 17,
      pathString: recenter(samples.kiwi, 1, 0.85).rawPath,
      topText: "Kiwi",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "hand",
    {
      maxGroupsToDisplay: 15,
      pathString: recenter(samples.hand, 0.8, 0.2).rawPath,
      topText: "Hand",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "carpe",
    {
      maxGroupsToDisplay: 16,
      pathString: recenter(samples.carpe).rawPath,
      topText: "Carpe",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "pigeon",
    {
      // I can't get this one to work.  😠
      maxGroupsToDisplay: 19,
      pathString: samples.pigeon,
      topText: "Pigeon",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "smallAirplane",
    {
      maxGroupsToDisplay: 16,
      pathString: recenter(samples.smallAirplane, 0.8, 0.7).rawPath,
      topText: "Robin DR400",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "hawk",
    {
      maxGroupsToDisplay: 8,
      pathString: recenter(samples.hawk).rawPath,
      topText: "Hawk",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "songBird",
    {
      maxGroupsToDisplay: 7,
      pathString: recenter(samples.songBird).rawPath,
      topText: "Song Bird",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "etchASketch",
    {
      maxGroupsToDisplay: 21,
      pathString: recenter(samples.etchASketch, 0.9, 0).rawPath,
      topText: "Skyline",
      bottomText: "MacGameStore",
    },
  ],
]);

{
  const requested = new URLSearchParams(window.location.search).get(
    "script_name"
  );
  if (requested) {
    const script = scripts.get(requested);
    if (!script) {
      console.log(`invalid script name: ${requested}`, scripts);
      throw new Error("wtf");
    }
    initialize(script);
  } else {
    initialize(scripts.get("hand")!);
    //initialize({maxGroupsToDisplay:10, pathString:makePolygon(7,2, "My seed 2025a").rawPath});
  }
}

let animationLoop: AnimationLoop;

// Without this setTimeout() the animation would
// skip a lot of time in the beginning.  A lot of the setup time
// would happen right after the first frame and after our clock
// starts.
setTimeout(() => {
  let timeOffset = NaN;
  animationLoop = new AnimationLoop((now) => {
    if (isNaN(timeOffset)) {
      timeOffset = now;
    }
    const time = now - timeOffset;
    showFrame(time);
  });
  (window as any).animationLoop = animationLoop;
}, 1);

function initScreenCapture(script: unknown) {
  document
    .querySelectorAll("[data-hideBeforeScreenshot]")
    .forEach((element) => {
      if (!(element instanceof SVGElement || element instanceof HTMLElement)) {
        throw new Error("wtf");
      }
      element.style.display = "none";
    });
  animationLoop.cancel();
  return {
    source: "path-to-fourier.ts",
    script,
    firstFrame: 0,
    lastFrame: Math.floor((scriptEndTime / 1000) * 60),
  };
}

(window as any).initScreenCapture = initScreenCapture;
