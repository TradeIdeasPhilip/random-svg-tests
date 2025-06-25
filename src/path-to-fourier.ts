import { getById } from "phil-lib/client-misc";
import {
  groupTerms,
  samples,
  samplesFromPath,
  samplesToFourier,
} from "./fourier-shared";
import "./path-to-fourier.css";
import { panAndZoom } from "./transforms";

const mainSvg = getById("main", SVGSVGElement);
mainSvg;
const scaleG = getById("scaled", SVGGElement);
const referencePath = getById("reference", SVGPathElement);
const samplesPath = getById("samples", SVGPathElement);

type Options = {
  pathString: string;
  numberOfDisplaySegments: number;
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
    addTime: 2000,
    pauseTime: 100,
    maxGroupsToDisplay: 10,
    terms,
  });
  console.log(script);
}

const scripts = new Map<string, Options>([
  [
    "likeShareAndSubscribe",
    {
      maxGroupsToDisplay: 20,
      numberOfDisplaySegments: 2000,
      numberOfFourierSamples: 1024,
      pathString: samples.likeShareAndSubscribe,
    },
  ],
  [
    "hilbert0",
    {
      maxGroupsToDisplay: 10,
      numberOfDisplaySegments: 100,
      numberOfFourierSamples: 1024,
      pathString: samples.hilbert[0],
    },
  ],
]);

initialize(scripts.get("hilbert0")!);

/**
 * TODO soon.
 *
 * When we freeze the Fourier series at N circles, that remains the same.
 * We will spend a lot less time frozen, but otherwise the same.
 * The update needs to be much more dynamic.
 * We are *not* interpolating between the two states with integer numbers of circles.
 * Instead, the change will move across the length of the path over time.
 * The font end of the path quickly breaks from the back end, which remains in place.
 * The front end moves to its new place.
 * This change moves through the path like a wave.
 * The end of the path will eventually meet back up with the front of the path.
 * * using(t) = the position computed from all of the circles that we are completely using.
 * * adding(t) = the change to the position computed from the circles that we
 * * display(t) = using(t) + fraction * adding(t)
 * * t = where we are along the path, the parameter.
 * * fraction = a value that changes gradually over time as we animate the addition of the new circles.
 * In complex-fourier-series.html fraction is a simple function of time.
 * It was the same for all values of t.
 * Now there is a center of the change, which is value of t, which changes over time.
 * The center starts just before t=0.
 * Over time the center will move to just past t=1.
 * fraction(t) = 0 when t ≪ the center point.
 * fraction(t) = 1 then t ≫ the center point.
 * fraction(center point) = 0.5.
 * There is a small region around the center point, ±r, where fraction(t) is in flux.
 * Use my standard cos easing function to make fraction(t) smoothly transition from 0 to 1.
 * At the starting time the center of change should be at 0-r.
 * And the ending time the center of change should be at 1+r.
 * I.e. start making changes at the very start of the time period, but ease into it.
 * And end the same way.
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
