import { AnimationLoop, getById } from "phil-lib/client-misc";
import {
  groupTerms,
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

const scaleG = getById("scaled", SVGGElement);
const referencePath = getById("reference", SVGPathElement);
const samplesPath = getById("samples", SVGPathElement);

type Options = {
  pathString: string;
  numberOfFourierSamples: number;
  maxGroupsToDisplay: number;
};

/*
type Result = {
  totalTimeMS: number;
  //Or make this a global
  // We will need this info when we restart
  // Or do we restart?  We have a refresh button!
  // Normally the user interface starts something immediately.
  // With the recording, does that matter?
  // We just remove the idea of the recorder configuring anything.
  // Everything's been preconfigured to run the same way whether it's live or recorded.
  //
  // Yes, the main program calls initialize() at the start.
  // The only way to reconfigure is to change the main program and restart.
  // The animations all start running by default.
  // If the recorder sends an initialization request:
  // * We will pause all animations.
  //   We don't want any change between when the recorder asks for a frame
  //   and when it takes the screenshot.
  // * We will return the length of this presentation.
  //   It will be the same as length of the live animation.
  //
  // So, yes, we do need to save this info in a global.
  //
  // I keep returning to the same thought:
  // The requested script should be in the query string.
  // So we know exactly what to display from the start.
  // Regardless of live or video.
  // Initially I can jump between scripts by changing the main program.
  // But it might be nice to record a lot of small scripts all in one session.
  // And walk away and not have to keep changing things.

  animations: Animation[];
};
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
  const samples = samplesFromPath(
    options.pathString,
    options.numberOfFourierSamples
  );
  // Show where were the samples taken.
  let samplesPathD = "";
  samples.forEach(([x, y]) => {
    samplesPathD += `M${x},${y}l0,0`;
  });
  samplesPath.setAttribute("d", samplesPathD);
  // Create terms
  const terms = samplesToFourier(samples);
  const script = groupTerms({
    /* TODO return these to something sane. */ addTime: 4900,
    pauseTime: 1100,
    maxGroupsToDisplay: options.maxGroupsToDisplay,
    terms,
  });
  const recommendedNumberOfSegments = (numberOfTerms: number) => {
    const maxFrequency = Math.max(
      ...terms.slice(0, numberOfTerms).map((term) => term.frequency)
    );
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
    } else {
      const r = 0.05; // TODO r needs to be smaller in most cases.
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
      const numberOfDisplaySegments = recommendedNumberOfSegments(
        scriptEntry.usingCircles + scriptEntry.addingCircles
      );
      return (timeInMs: number): string => {
        const centerOfChange = timeToCenter(timeInMs);
        const getFraction = makeEasing(centerOfChange - r, centerOfChange + r);
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
    const pathString = PathShape.cssifyPath(timeToPath[index](timeInMs));
    scaleG.style.setProperty("--d", pathString);
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
  }
  (window as any).showFrame = showFrame;
}

const scripts = new Map<string, Options>([
  [
    "likeShareAndSubscribe",
    {
      maxGroupsToDisplay: 30,
      numberOfFourierSamples: 1024,
      pathString: samples.likeShareAndSubscribe,
    },
  ],
  [
    "hilbert0",
    {
      maxGroupsToDisplay: 20,
      numberOfFourierSamples: 1024,
      pathString: samples.hilbert[0],
    },
  ],
  [
    "hilbert1",
    {
      maxGroupsToDisplay: 20,
      numberOfFourierSamples: 1024,
      pathString: samples.hilbert[1],
    },
  ],
  [
    "hilbert4",
    {
      maxGroupsToDisplay: 20,
      numberOfFourierSamples: 1024,
      pathString: samples.hilbert[4],
    },
  ],
  [
    "p0",
    {
      maxGroupsToDisplay: 20,
      numberOfFourierSamples: 1024,
      pathString: samples.peanocurve[0],
    },
  ],
  [
    "p1",
    {
      maxGroupsToDisplay: 20,
      numberOfFourierSamples: 1024,
      pathString: samples.peanocurve[1],
    },
  ],
  [
    "p2",
    {
      maxGroupsToDisplay: 20,
      numberOfFourierSamples: 1024,
      pathString: samples.peanocurve[2],
    },
  ],
]);

initialize(scripts.get("likeShareAndSubscribe")!);

let timeOffset = NaN;
new AnimationLoop((now) => {
  if (isNaN(timeOffset)) {
    timeOffset = now;
  }
  const time = now - timeOffset;
  (window as any).showFrame(time);
});

/**
 * TODO
 *
 * Sometimes the transition between one and the next seems rough.
 * Like I don't have enough path segments.
 * It usually happens within the first few add phases.
 * I.e. when the number of path segments is low.
 * I need to dump the script to the console so I can see the frequencies
 * associated with the bad demos.
 * I can probably just set a minimum number of path segments.
 * But that minimum might depend on how small r is.
 */

/**
 * TODO
 *
 * r is proportional to the amplitude of the circle we are adding.
 * If we are adding multiple circles, maybe the total amplitude.
 * A value of around 1% - 5% of the total distance seems reasonable for the first circle.
 * We will need a smaller r to make the smaller changes more obvious.
 *
 * The width of the eased region around the center of change
 * is way too big.
 * It needs to be scaled to go with the amplitude.
 * When amplitude = 3% —> give me 10th of the easing radius that we have now.
 * Everything else scales linearly.
 */

/**
 * What happens when we are stuck at one point?
 *
 * We haven't added any terms, yet.
 * Or we only have one term, and its frequency is 0.
 * If we try to draw exactly that, there is already code to detect that special case.
 * Before I added that special case to the code, I got errors because I could not compute the derivative.
 * Now it creates a path that displays as a single dot.
 *
 * But as soon as I try to modify that path I get lots of errors.
 * Part of the path is not moving, so we can't compute the derivative.
 * My library throws an exception and never tries to draw the good parts.
 *
 * Proposal:  Consider exactly 2 special cases:
 *
 * 1) A dot is moving.
 *    Going from 0 terms to 1 term with frequency = zero.
 *    Don't even think about the animation that we do in other places.
 *    This script is completely unique.
 *    Draw a single line for the path.
 *    Both ends start at the first point.
 *    Use makeEasing() to move the first point from the start to the end.
 *    Then use makeEasing() to move the second point from the start to the end.
 *    First one goes from 0 to 2/3, second one goes from 1/3 to 1.
 *    I.e. some overlap.
 *
 * 2) A dot is turning into a real shape.
 *    Either we are adding a second term and the first term had frequency 0.
 *    Or we are adding the first term and it does not have a frequency of 0.
 *    Start from our existing algorithm.
 *    But skip the part that doesn't work.
 *    We should be able to go from the beginning of the path to the center of the change + r like normal.
 *    Just watch out for the case where that has a length of 0.
 *    t = t / (fraction that we can use) then call the original function.
 *    numberOfSegments = Math.ceil(numberOfSegments * (fraction that we can use))
 *    If (numberOfSegments = 0) then just draw a point.
 */

/**
 * TODO
 * Do any of the samples have a frequency 1 term first, then a frequency 0 term?
 *
 * If they are in the opposite order, that means that we start with a dot that
 * moves to another point then grows into a circle.  My new color scheme highlights
 * a single dot and makes it very easy to see.  Currently the motion is broken, but
 * it looks good in complex-fourier-series where I just slid the dot.  I'm planning
 * to do something slightly more complicated.  It's all good.
 *
 * But the 1 followed by the 0 might be very interesting and I should make sure
 * at least one of the examples does it.  First the point will become a large circle,
 * then the large circle will slide over, but one piece at a time.  The frequency
 * 0 term doesn't even have to be second.  At long as it is not first but the
 * amplitude is high enough that this step is visible and it is not merged with any
 * other terms.
 */
