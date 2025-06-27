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
 * TODO soon.
 *
 * r is proportional to the amplitude of the circle we are adding.
 * If we are adding multiple circles, maybe the total amplitude.
 * A value of around 1% - 5% of the total distance seems reasonable for the first circle.
 * We will need a smaller r to make the smaller changes more obvious.
 *
 * Do we have to stop in between updates?
 * It might make sense to send multiple updates through at once.
 * As long as there is some space between them, so you can see what's going on.
 * This can help a lot if we have lots of circles to add.
 */

/**
 * What happens when we are stuck at one point?
 * We only have one term, and its frequency is 0.
 * It seems like sometimes that appears as a dot.
 * But other times I get a lot of errors because I can't compute a derivative.
 * Why?
 *
 * Related problem.  Starting with hilbert0.
 * When we at trying to transition from a point at the center to the first circle.
 * Everything fails until nothing is at the center any more.
 * As soon as the easing gets to the point that nothing is exactly at the center, it starts working.
 * I'm tempted to remove any points from the input that have a derivative of 0 because that means we aren't moving and the point isn't important.
 * But that's a little imprecise.
 * I wouldn't start from the center and go out.
 * I'd start from a point near the center and go out.
 * And that point near the center would move around some.
 * Ideally I'd know exactly where the path was interesting.
 * In this case, where the easing went from 0 to more than 0.
 *
 * Seems like there should be some sort of special case when we
 * are trying to display a path created from a Fourier series
 * where some or part of the series is just a point.
 * * In the case of not currently adding any circles, do we even have a problem?
 * * In the case of not currently adding any circles, check for the case of only a single point and return a short but appropriate path string.
 * * When adding something, check for the case that the before was just a point.  Then only produce the points in the valid range.
 *
 * Note that this can't be ported back to complex-fourier-series.
 * That requires all paths to be the same length for the sake of interpolating between paths.
 * But how did that work?  It did work!
 *
 * The width of the eased region around the center of change
 * is way too big.
 * It needs to be scaled to go with the amplitude.
 * When amplitude = 3% —> give me 10th of the easing radius that we have now.
 * Everything else scales linearly.
 */

/**
 * TODO !!!!!
 * Change the Like share and subscribe sample path.
 * Translate it so its center is closer to 0,0.
 * But not too close.
 * Ideally the amplitude of the frequency 0 term will be just slightly less than the amplitude of the frequency 1 term.
 * Currently we try to animate the frequency 0 term before the frequency 1 term.
 * That's causing the bugs and it would not be that visually appealing if I fixed them.
 * The frequency 1 thing should happen first, going from a point to a circle.
 * Next do the frequency 0 thing, sliding the circle over.
 *
 * the p1 example has similar issues.
 */
