import { FULL_CIRCLE } from "phil-lib/misc";
import "./background.css";
import {
  AnimationLoop,
  getById,
  selectorQuery,
  selectorQueryAll,
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

const filter = selectorQuery("filter", SVGFilterElement);
const turbulence = selectorQuery("feTurbulence", SVGFETurbulenceElement);
const backgroundRect = getById("background", SVGRectElement);
const colorMatrix = selectorQuery("feColorMatrix", SVGFEColorMatrixElement);

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
  backgroundRect.setAttribute("filter", `url(#${newId})`);
}
(window as any).incrementSeed = incrementSeed;

let counter = 212342;
const duration = 15000; // 15s
const keyframes = [
  [1.1, 0], // 0%: red out = 1.1 * red in
  [0.55, 0.2], // 25%: red out = 0.55 * red in + 0.2 * alpha in
  [0, 0], // 50%: red out = 0
  [0.55, 0.2], // 75%: red out = 0.55 * red in + 0.2 * alpha in
  [1.1, 0], // 100%: red out = 1.1 * red in
];

// This was the first thing that worked!
// This got me animated SVGs without a canvas.
/*
function interpolate(t: number): string {
  const keyTime = (t % duration) / duration; // 0 to 1
  const index = Math.floor(keyTime * 4); // 0 to 3
  const nextIndex = (index + 1) % 4;
  const frac = (keyTime * 4) % 1; // 0 to 1 within keyframe
  const [fromRed1, fromAlpha1] = keyframes[index];
  const [fromRed2, fromAlpha2] = keyframes[nextIndex];
  const fromRed = fromRed1 + (fromRed2 - fromRed1) * frac;
  const fromAlpha = fromAlpha1 + (fromAlpha2 - fromAlpha1) * frac;
  return `${fromRed} 0 0 ${fromAlpha} 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0 1`;
}
  */
function interpolate(t: number): string {
  t = (t / 60000) * FULL_CIRCLE;
  let result = "";
  for (let channel = 0; channel < 3; channel++) {
    const phase = (channel * FULL_CIRCLE) / 3;
    /**
     * This is a simple sine wave like I use in a lot of places.
     * Range 0.3 to 1.1
     */
    const fromBase = Math.sin(t + phase) * 0.4 + 0.7;
    /**
     * This is a way to get a little more noise in there.
     * I'm adding in some of the alpha channel noise, that would otherwise have been abandoned.
     * 
     * I'm not sure if this helps or not.
     * I need a side by side comparison.
     */
    const fromAlpha =  Math.sin(7 * t + phase) * 0.02 + 0.02;
    for (let i = 0; i < channel; i++) {
      result += "0 ";
    }
    result += `${fromBase} `;
    for (let i = channel + 1; i < 3; i++) {
      result += "0 ";
    }
    result += `${fromAlpha} 0  `;
  }
  // And peg the alpha channel to 1.
  result += "0 0 0 0 1";
  return result;
}
(window as any).interpolate = interpolate;

/*
function update() {
  const newId = `gensym-${counter++}`;
  //filter.id = newId;
  colorMatrix.setAttribute("values", interpolate(performance.now()));
  //rect.setAttribute("filter", `url(#${newId})`);
  requestAnimationFrame(update);
}

requestAnimationFrame(update);
*/

const opacityAnimations = selectorQueryAll(
  "[data-animate-opacity]",
  SVGElement
);

function showFrame(timeInMs: number) {
  colorMatrix.setAttribute("values", interpolate(timeInMs));
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
    seconds: 75,
    devicePixelRatio,
  };
}

(window as any).initScreenCapture = initScreenCapture;
