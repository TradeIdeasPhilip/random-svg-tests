import { AnimationLoop, getById } from "phil-lib/client-misc";
import {
  groupTerms,
  hasFixedContribution,
  makePolygon,
  samples,
  samplesFromPath,
  samplesToFourier,
  termsToParametricFunction,
} from "./fourier-shared";
import "./path-to-fourier.css";
import { panAndZoom } from "./transforms";
import { PathShape } from "./path-shape";
import { FIGURE_SPACE, makeBoundedLinear, makeLinear } from "phil-lib/misc";
import { ease, selectorQuery } from "./utility";

const numberOfFourierSamples = 1024;

const scaleG = getById("scaled", SVGGElement);
const referencePath = getById("reference", SVGPathElement);
const samplesPath = getById("samples", SVGPathElement);

type Options = {
  pathString: string;
  maxGroupsToDisplay: number;
  minGoodCircles?: number;
  topText?: string;
  bottomText?: string;
};

/*
 TODO add the part for html-to-movie.
  Rough sketch:
  // Yes, the main program calls initialize() at the start.
  // The only way to reconfigure is to change the main program and restart.
  // The animations all start running by default.
  // If the recorder sends an initialization request:
  // * We will pause all animations.
  //   We don't want any change between when the recorder asks for a frame
  //   and when it takes the screenshot.
  // * We will return the length of this presentation.
  //   It will be the same as length of the live animation.
*/

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
  const script = groupTerms({
    addTime: 4800,
    pauseTime: 200,
    maxGroupsToDisplay: options.maxGroupsToDisplay,
    terms,
  });
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
      const path = PathShape.parametric(
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
            return `$M${startingPoint.x},${startingPoint.y} L${startingPoint.x},${startingPoint.y}`;
          } else {
            const frugalSegmentCount = Math.ceil(
              // TODO that 150 is crude.  The transition might require
              // more detail than the before or the after.
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
            const path = PathShape.parametric(
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
          const path = PathShape.parametric(
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
  function showFrame(timeInMs: number) {
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
  }
  (window as any).showFrame = showFrame;
}

const scripts = new Map<string, Options>([
  [
    "likeShareAndSubscribe",
    {
      maxGroupsToDisplay: 30,
      pathString: samples.likeShareAndSubscribe,
      minGoodCircles: 10,
    },
  ],
  [
    "hilbert0",
    {
      maxGroupsToDisplay: 20,
      pathString: samples.hilbert[0],
    },
  ],
  [
    "hilbert1",
    {
      maxGroupsToDisplay: 20,
      pathString: samples.hilbert[1],
      minGoodCircles: 13,
    },
  ],
  [
    "hilbert4",
    {
      maxGroupsToDisplay: 20,
      pathString: samples.hilbert[4],
    },
  ],
  [
    "p0",
    {
      maxGroupsToDisplay: 20,
      pathString: samples.peanocurve[0],
    },
  ],
  [
    "p1",
    {
      maxGroupsToDisplay: 20,
      pathString: samples.peanocurve[1],
    },
  ],
  [
    "p2",
    {
      maxGroupsToDisplay: 20,
      pathString: samples.peanocurve[2],
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
      maxGroupsToDisplay: 18,
      pathString: samples.daphneOram1,
      topText: "Daphne Oram #1",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "Daphne_Oram_2",
    {
      maxGroupsToDisplay: 22,
      pathString: samples.daphneOram2,
      topText: "Daphne Oram #2",
      bottomText: "Wikimedia Commons",
    },
  ],
  [
    "water_opossum",
    {
      maxGroupsToDisplay: 22,
      pathString: samples.waterOpossum,
      topText: "Chironectes (Water Opossum)",
      bottomText: "Wikimedia Commons",
      minGoodCircles: 10,
    },
  ],
  [
    "cat",
    {
      maxGroupsToDisplay: 10,
      pathString: samples.cat,
      topText: "Cat",
      bottomText: "Wikimedia Commons",
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
    initialize(scripts.get("star7")!);
    //initialize({maxGroupsToDisplay:10, pathString:makePolygon(7,2, "My seed 2025a").rawPath});
  }
}

// Without this setTimeout() the animation would
// skip a lot of time in the beginning.  A lot of the setup time
// would happen right after the first frame and after our clock
// starts.
setTimeout(() => {
  let timeOffset = NaN;
  (window as any).animationLoop = new AnimationLoop((now) => {
    if (isNaN(timeOffset)) {
      timeOffset = now;
    }
    const time = now - timeOffset;
    (window as any).showFrame(time);
  });
}, 1);

/**
 * TODO Minimum good detail!
 * Each script should include an optional setting regarding the minimum number of segments.
 * STARTED!  See minGoodCircles.
 * You can specify this in circles!
 * You say how many circles you saw on the screen when it was good enough.
 * It already knows how to do the math to convert the number circles into the number of segments.
 *
 * p0, p1, and p2 are all giving me trouble.
 * I'm not sure if it is related.
 * It jumps around a lot more than I'd expect right around the time of the straight diagonal line.
 * This is early in the script, not a lot of circles, maybe more segments would help.
 */

/**
 * TODO Recenter all of the examples.
 */
