import { FULL_CIRCLE, makeLinear } from "phil-lib/misc";
import "./background.css";
import {
  AnimationLoop,
  getById,
  querySelector,
  querySelectorAll,
} from "phil-lib/client-misc";

/**
 * This test shows how you can use noise similar to fourier-smackdown,
 * but without using a canvas.
 *
 * I'm drawing an animated pattern very similar to the one in fourier-smackdown,
 * (I need to make them even closer, for a fair comparison.  TODO)
 * I'm paying more attention to the process to minimize the round-off errors.
 * The idea is that a single matrix multiply to put the noise into range is probably reasonable.
 * It seems promising, but not certain, to bring improvements.
 *
 * I've also added some partial transparency using the `opacity` property.
 * The black line shows what happens when I use opacity on top of this changing background.
 * The middle background rectangle has the background noise and is partially transparent itself.
 * The idea is that the opacity is not subject to the same limitations as svg filters are,
 * and they are generally robust and easy to work with.
 *
 * It's hard to say much from the transparency test so far.
 * It appears that things are changing very smoothly and without incident.
 * I probably wouldn't use this exact combination of effects.
 * The idea is maybe to have multiple rectangles with with their own effects.
 * Each rectangle is filled with some noise like effect, very possibly frozen in time.
 * But then I can merge two or more using opacity, where the exact opacity changes over time.
 * Maybe make a few key-frames, like the most extreme red, green or blue versions of the noise,
 * Then use transparency to interpolate between them.
 * This could make it easy to move from the primary colors theme to selected colors.
 *
 * The orange gradient background looks great,
 * but is far too subtle to mean anything in this context.
 */

const filter = querySelector("filter", SVGFilterElement);
const turbulence = querySelector("feTurbulence", SVGFETurbulenceElement);
const backgroundNoiseRect = getById("background-noise", SVGRectElement);
const backgroundMultiplyRect = getById("background-multiply", SVGRectElement);

let nextInt = 1000;
/**
 * Changing the random seed in a filter doesn't cause an immediate
 * effect.  We have to change the `id` of the filter to bust the
 * cache.  Grok tells me that's a feature, not a bug.
 */
function gensym() {
  return `gensym-${nextInt++}`;
}

function incrementSeed() {
  const previous = turbulence.seed.baseVal;
  const next = previous + 1;
  const newId = gensym();
  turbulence.seed.baseVal = next;
  filter.id = newId;
  backgroundNoiseRect.setAttribute("filter", `url(#${newId})`);
}
(window as any).incrementSeed = incrementSeed;

const opacityAnimations = querySelectorAll(
  "[data-animate-opacity]",
  SVGElement
);

const brightnessRange = makeLinear(
  -1,
  /* min value */ 0.2,
  1,
  /* max value */ 0.5
);

function showFrame(timeInMs: number) {
  {
    const phases = [0, FULL_CIRCLE / 3, FULL_CIRCLE * (2 / 3)];
    const period = 30000;
    /**
     * Normalize to [0, 2π]
     */
    const t = ((timeInMs % period) / period) * FULL_CIRCLE;
    const [r, g, b] = phases.map((phase) =>
      brightnessRange(Math.sin(t + phase))
    );
    const controlColor = `rgb(${r * 255}, ${g * 255}, ${b * 255})`;
    backgroundMultiplyRect.style.fill = controlColor;
  }
  const opacity = (
    Math.sin((timeInMs / 10000) * FULL_CIRCLE) / 2 +
    0.5
  ).toString();
  opacityAnimations.forEach((element) =>
    element.setAttribute("opacity", opacity)
  );
}
(window as any).showFrame = showFrame;

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
    source: "background.ts",
    script,
    seconds: 35,
    devicePixelRatio,
  };
}

(window as any).initScreenCapture = initScreenCapture;
