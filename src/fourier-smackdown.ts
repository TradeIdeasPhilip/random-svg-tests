import {
  AnimationLoop,
  getById,
  querySelector,
  querySelectorAll,
} from "phil-lib/client-misc";
import {
  Complex,
  FourierTerm,
  hasFixedContribution,
  samplesFromPath,
  samplesToFourier,
  termsToParametricFunction,
} from "./fourier-shared";
import "./fourier-smackdown.css";
import { panAndZoom, panAndZoomString, rectToRect, rehome } from "./transforms";
import { PathBuilder, PathCaliper, PathShape } from "./path-shape";
import {
  assertClass,
  assertNonNullable,
  count,
  FULL_CIRCLE,
  initializedArray,
  LinearFunction,
  makeBoundedLinear,
  makeLinear,
  parseFloatX,
  positiveModulo,
  Random,
  ReadOnlyRect,
  zip,
} from "phil-lib/misc";
import { ease, getMod } from "./utility";
import { resizeFont } from "./letters-base";
import { roundCursiveFont } from "./hershey-fonts/hershey-fonts";
import { LetterLayoutInfo, TextLayout } from "./letters-more";

/**
 * Color Scheme:
 * white background several pastel colors
 * https://www.google.com/search?q=color%20palette%20white%20background%20several%20pastel%20colors&udm=2&tbs=rimg:CYC4ZCE2OfVIYW_1YzAeBy7uVsgIAwAIA2AIA4AIA&hl=en&sa=X&ved=0CBsQuIIBahcKEwiApIrqxseOAxUAAAAAHQAAAAAQBw&biw=1440&bih=812&dpr=2
 *
 * According to Grok:
 * Pastel colors in CSS are defined by:High lightness (60%–90% in HSL),
 * Low to moderate saturation (20%–50% in HSL),
 * Any hue, depending on the desired color (pink, blue, green, etc.).
 * Examples:
 * * Pastel Pink: hsl(330, 50%, 85%) or #F5B7D0 (rgb(245, 183, 208))
 * * Pastel Blue: hsl(200, 40%, 80%) or #A3D5F2 (rgb(163, 213, 242))
 * * Pastel Green: hsl(160, 35%, 85%) or #C1EAD9 (rgb(193, 234, 217))
 * * Pastel Yellow: hsl(60, 40%, 85%) or #F5E8B7 (rgb(245, 232, 183))
 *
 * The goal is a calming experience.
 *
 * I had to add an interesting background because pastels on a solid background don't look good.
 */

function hideBackground() {
  document.body.style.backgroundColor = "transparent";
  querySelectorAll("[data-hide-background]", SVGElement).forEach(
    (element) => (element.style.display = "none")
  );
}

function onlyBackground() {
  const backgroundElement = querySelector("[data-hide-background]", SVGElement);
  backgroundElement.parentElement?.append(backgroundElement);
}

{
  // Background full of stars
  const random = Random.fromString("Pastel 41");
  const original = querySelector("[data-favorite]", SVGCircleElement);
  const getR = makeLinear(0, 0.025, 2, 0.15);
  for (let i = 0; i < 150; i++) {
    const copy = assertClass(original.cloneNode(true), SVGCircleElement);
    copy.cx.baseVal.value = random() * 16;
    copy.cy.baseVal.value = random() * 9;
    copy.r.baseVal.value = getR(random() + random());
    original.parentElement!.append(copy);
  }
}

/**
 * `$_GET`, in PHP parlance.
 */
const urlParameters = new URLSearchParams(window.location.search);
let disableAnimationLoop = false;
if (urlParameters.get("hide_background") == "1") {
  hideBackground();
} else if (urlParameters.get("only_background") == "1") {
  onlyBackground();
}

{
  const canvas = querySelector("canvas#cache", HTMLCanvasElement);
  const context = canvas.getContext("2d")!;
  context.filter = "url(#watercolor)";
  const scale = 1;
  context.scale(scale, scale);
  //  context.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
}

const numberOfFourierSamples = 1024;

class MotionBlurSpinner {
  static readonly #parent = querySelector(
    "[data-motion-blur-spinners]",
    HTMLDivElement
  );
  #style: CSSStyleDeclaration;
  constructor(
    options: {
      radius: number;
      centerX: number;
      centerY: number;
      color?: string;
    } = { radius: 1, centerX: 2, centerY: 2 }
  ) {
    const element: HTMLDivElement = document.createElement("div");
    element.classList.add("motion-blur-spinner");
    MotionBlurSpinner.#parent.append(element);
    const style = (this.#style = element.style);
    style.setProperty("--radius", options.radius.toString());
    style.setProperty("--center-x", options.centerX.toString());
    style.setProperty("--center-y", options.centerY.toString());
    if (options.color) {
      style.setProperty("--color", options.color);
    }
    this.hide();
  }
  /**
   * TODO This breaks all of my rules.
   * But it will be a pain to do it right.
   * The rest of this is stateless.
   * You can call showFrame(n) at any time and get the same result.
   */
  #previousMain: number | undefined;
  showRadians(main: number) {
    const blur = this.#previousMain ?? main;
    this.#previousMain = main;
    const style = this.#style;
    style.display = "";
    style.setProperty("--main-angle", `${main}rad`);
    style.setProperty("--blur-angle", `${blur}rad`);
  }
  hide() {
    this.#previousMain = undefined;
    this.#style.display = "none";
  }
}

class FrequencySpinners {
  readonly #spinners: readonly {
    readonly top: SVGGElement;
    readonly oldSpinner: SVGPolygonElement;
    readonly newSpinner: MotionBlurSpinner;
    readonly text: SVGTextElement;
  }[];
  constructor(parent: string | SVGGElement) {
    if (!(parent instanceof SVGGElement)) {
      parent = querySelector(parent, SVGGElement);
    }
    this.#spinners = querySelectorAll(
      "g.frequency",
      SVGGElement,
      0,
      Infinity,
      parent
    ).map((top) => {
      const text = querySelector("text", SVGTextElement, top);
      return {
        top,
        oldSpinner: querySelector(".spinner", SVGPolygonElement, top),
        newSpinner:
          undefined! /*assertNonNullable(MotionBlurSpinner.available.shift())*/,
        text,
      };
    });
  }
  show(terms: readonly FourierTerm[], progressInRadians: number) {
    this.#spinners.forEach((spinner, index, array) => {
      if (index >= terms.length) {
        spinner.top.style.display = "none";
        spinner.newSpinner.hide();
      } else {
        spinner.top.style.display = "";
        const term = terms[index];
        let text = term.frequency.toString();
        if (index == array.length - 1 && array.length < terms.length) {
          // This is the last one that we can display,
          // because we are out of room,
          // but there are more terms to display.
          text += ", …";
        }
        spinner.text.innerHTML = spinner.text.innerHTML = text;
        const angleToDisplay = progressInRadians * term.frequency + term.phase;
        spinner.oldSpinner.style.transform = `rotate(${
          angleToDisplay + FULL_CIRCLE / 4
        }rad)`;
        spinner.newSpinner.showRadians(angleToDisplay);
      }
    });
  }
}

type Options = {
  base: FourierBase;
  destination: Destination;
  referenceColor: string;
  liveColor: string;
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

let showFrame: (timeInMs: number) => void = () => {};

(window as any).showFrame = (timeInMs: number) => {
  showFrame(timeInMs);
};

/**
 * This knows about the SVG elements implementing this effect.
 * And this knows about the screen real estate reserves for this effect.
 * These are closely related as we use the SVG element to transform the effect to make it fit.
 */
class Destination {
  readonly #gElement: SVGGElement;
  readonly #referencePath: SVGPathElement;
  readonly #livePath: readonly SVGPathElement[];
  constructor(
    top: SVGGElement,
    readonly getTransform: (content: ReadOnlyRect) => DOMMatrix
  ) {
    this.#gElement = top;
    this.#referencePath = querySelector(
      "[data-reference]",
      SVGPathElement,
      this.#gElement
    );
    this.#livePath = querySelectorAll(
      "[data-live]",
      SVGPathElement,
      1,
      Infinity,
      this.#gElement
    );
  }
  hide() {
    this.#gElement.style.display = "none";
  }
  show(referenceColor: string, _liveColor: string) {
    this.#gElement.style.display = "";
    this.#referencePath.style.stroke = referenceColor;
    //this.#livePath.style.stroke = liveColor;
  }
  setReferencePath(d: string) {
    this.#referencePath.setAttribute("d", d);
  }
  setLivePath(d: string) {
    this.#livePath.forEach((path) => path.setAttribute("d", d));
  }
  setTransform(transform: DOMMatrix) {
    const scale = transform.a;
    this.#gElement.style.transform = transform.toString();
    this.#gElement.style.setProperty("--path-scale", scale.toString());
  }
  static right = new Destination(
    getById("right", SVGGElement),
    (content: ReadOnlyRect) =>
      panAndZoom(
        content,
        { x: 1, y: 1, width: 14, height: 7 },
        "srcRect fits completely into destRect",
        1
      )
  );
}

/**
 * This is the trippy canvas that I use in the background.
 *
 * This is a canvas because I was pushing the limits and this is the only way to use floating point precision colors.
 * There are a lot of other ugly implementation details hidden in here, you don't want to know.
 */
class Background {
  static colorSummary(
    imageData: ImageData | HTMLCanvasElement | CanvasRenderingContext2D
  ) {
    if (imageData instanceof HTMLCanvasElement) {
      imageData = imageData.getContext("2d")!;
    }
    if (imageData instanceof CanvasRenderingContext2D) {
      const { height, width } = imageData.canvas;
      imageData = imageData.getImageData(0, 0, width, height);
    }
    class Accumulator {
      #count = 0;
      #sum = 0;
      #min = Infinity;
      #max = -Infinity;
      get min() {
        return this.#min;
      }
      get max() {
        return this.#max;
      }
      get average() {
        return this.#sum / this.#count;
      }
      add(byte: number) {
        this.#count++;
        this.#sum += byte;
        this.#max = Math.max(this.#max, byte);
        this.#min = Math.min(this.#min, byte);
      }
      get() {
        return { min: this.min, max: this.max, average: this.average };
      }
    }
    const channels = initializedArray(4, () => new Accumulator());
    imageData.data.forEach((byte, index) => channels[index % 4].add(byte));
    return {
      red: channels[0].get(),
      green: channels[1].get(),
      blue: channels[2].get(),
      alpha: channels[3].get(),
    };
  }
  readonly #canvas = getById("backgroundCanvas", HTMLCanvasElement);
  readonly #baselineNoise: HTMLCanvasElement;
  constructor(seed: number) {
    this.#baselineNoise = this.#precomputeNoise(seed);
  }
  readonly #context = assertNonNullable(
    this.#canvas.getContext("2d", { colorSpace: "display-p3" })
  );
  #precomputeNoise(seed: number) {
    querySelector("feTurbulence", SVGFETurbulenceElement).seed.baseVal = seed;
    const noiseCanvas = document.createElement("canvas");
    noiseCanvas.width = 3840;
    noiseCanvas.height = 2160;
    const ctx = noiseCanvas.getContext("2d", { colorSpace: "display-p3" })!;

    // Draw gradient
    const gradient = ctx.createLinearGradient(0, 0, 3840, 2160); // 135°
    gradient.addColorStop(0, "hsl(220, 10%, 30%)");
    gradient.addColorStop(1, "hsl(220, 15%, 40%)");
    ctx.fillStyle = gradient;
    //ctx.fillRect(0, 0, 3840, 2160);

    // Draw noise with overlay
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "url(#noiseFilter)";
    ctx.fillStyle = "rgb(255, 165, 0)"; // Burnt orange, opaque
    ctx.fillRect(0, 0, 3840, 2160);
    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";
    return noiseCanvas;
  }
  readonly #brightnessRange = makeLinear(
    -1,
    /* min value */ 0.333,
    1,
    /* max value */ 0.5
  );
  #lastDebugRow = 0;
  addDebugText(text: string) {
    const y = this.#lastDebugRow * 216 + 108;
    this.#lastDebugRow = (this.#lastDebugRow + 1) % 10;
    this.#context.font = "100px sans-serif";
    this.#context.fillStyle = "white";
    this.#context.fillText(text, 20, y);
  }
  draw(timeInMs: number) {
    const context = this.#context;
    // Draw precomputed gradient + noise
    context.drawImage(this.#baselineNoise, 0, 0);
    // Scale with solid color using multiply
    const phases = [0, FULL_CIRCLE / 3, FULL_CIRCLE * (2 / 3)]; // 0°, 120°, 240°
    const period = 8000;
    const t = (((timeInMs + 20000) % period) / period) * FULL_CIRCLE; // Normalize to [0, 2π]
    const [r, g, b] = phases.map((phase) =>
      this.#brightnessRange(Math.sin(t + phase))
    );
    context.globalCompositeOperation = "multiply";
    context.fillStyle = `rgb(${r * 255}, ${g * 255}, ${b * 255})`;
    context.fillRect(0, 0, 3840, 2160);
    context.globalCompositeOperation = "source-over";
  }
  /**
   * Request the current frame as a blob.
   *
   * This is aimed at development, not production.
   * Among other things, this is slow.
   * It also exports is a very slightly different format than the production method,
   * so you might not get the same results.
   * @param timeInMS Advance to this time.  The default is to keep the current time.
   * @returns A promise to a blob.
   */
  extract(timeInMS?: number) {
    if (timeInMS !== undefined) {
      this.draw(timeInMS);
    }
    const { promise, resolve, reject } = Promise.withResolvers<Blob>();
    this.#canvas.toBlob(
      (blob) => {
        if (!blob) {
          // Unexpected but possible.
          reject("wtf");
        } else {
          resolve(blob);
        }
      },
      "image/png",
      1.0
    );
    return promise;
  }
}
Background;

const pathCaliper = new PathCaliper();

class Timer {
  #remainderToT: LinearFunction;
  readonly endTime: number;
  constructor(
    private readonly stepCount: number,
    private readonly period: number,
    startTime = 0,
    endTime = period - startTime
  ) {
    this.#remainderToT = makeBoundedLinear(startTime, 0, endTime, 1);
    this.endTime = period * stepCount;
  }
  get(timeInMs: number) {
    let index = Math.floor(timeInMs / this.period);
    let remainder: number;
    if (index < 0) {
      index = 0;
      remainder = 0;
    } else if (index >= this.stepCount) {
      index = this.stepCount - 1;
      remainder = this.period;
    } else {
      remainder = timeInMs % this.period;
    }
    const t = this.#remainderToT(remainder);
    return { index, t };
  }
}

class FourierBase {
  readonly samples: readonly Complex[];
  readonly terms: FourierTerm[];
  constructor(readonly pathString: string) {
    this.samples = samplesFromPath(pathString, numberOfFourierSamples);
    this.terms = samplesToFourier(this.samples);
    this.keyframes = initializedArray(21, (n) => n);
  }
  keyframes: number[];
  bins() {
    const result = new Array<FourierTerm[]>();
    this.keyframes.forEach((termEndIndex, binEndIndex, keyframes) => {
      const binStartIndex = binEndIndex - 1;
      if (binStartIndex >= 0) {
        const termStartIndex = keyframes[binStartIndex];
        const bin = this.terms.slice(termStartIndex, termEndIndex);
        result.push(bin);
      }
    });
    return result;
  }
  get stepCount() {
    return this.keyframes.length - 1;
  }
  makeGetPath1(timer: Timer): (timeInMs: number) => string {
    const getPath2 = this.makeGetPath2();
    function getPath1(timeInMs: number) {
      const { index, t } = timer.get(timeInMs);
      const pathString = getPath2(index, t);
      return pathString;
    }
    return getPath1;
  }
  makeGetPath2(): (index: number, t: number) => string {
    const terms = [...this.terms];
    const toShow = [...this.keyframes];
    const stepCount = this.stepCount;
    /**
     * Special case:  A dot is moving.
     *    Going from 0 terms to 1 term with frequency = zero.
     *    Don't even think about the animation that we do in other places.
     *    This script is completely unique.
     *    Draw a single line for the path.
     *    Both ends start at the first point.
     *    Use makeEasing() to move the points smoothly.
     */
    const getMaxFrequency = (numberOfTerms: number) => {
      const maxFrequency = Math.max(
        ...terms.slice(0, numberOfTerms).map((term) => Math.abs(term.frequency))
      );
      return maxFrequency;
    };
    const recommendedNumberOfSegments = (numberOfTerms: number) => {
      if (numberOfTerms == 0) {
        return 8;
      } else {
        const maxFrequency = getMaxFrequency(numberOfTerms);
        return 8 * Math.min(maxFrequency, 50) + 7;
      }
    };
    const segmentInfo = initializedArray(stepCount, (index) => {
      const startingTermCount = toShow[index];
      const endingTermCount = toShow[index + 1];
      if (
        startingTermCount == 0 &&
        endingTermCount == 1 &&
        terms[0].frequency == 0
      ) {
        // Moving a dot.
        const goal = assertNonNullable(hasFixedContribution(terms[0]));
        /**
         * @param t A value between 0 and 1.
         * @returns The coordinates as a string.
         */
        function location(t: number) {
          return `${goal.x * t},${goal.y * t}`;
        }
        const getLeadingProgress = makeEasing(0, 0.5);
        const getTrailingProgress = makeEasing(0, 1);
        return (t: number) => {
          const trailingProgress = getTrailingProgress(t);
          const from = location(trailingProgress);
          const leadingProgress = getLeadingProgress(t);
          const to = location(leadingProgress);
          const pathString = `M ${from} L ${to}`;
          // console.log({ t, trailingProgress, leadingProgress, pathString });
          return pathString;
        };
      } else if (startingTermCount == endingTermCount) {
        const parametricFunction = termsToParametricFunction(
          terms,
          startingTermCount
        );
        const numberOfDisplaySegments =
          recommendedNumberOfSegments(endingTermCount);
        const path = PathShape.glitchFreeParametric(
          parametricFunction,
          numberOfDisplaySegments
        );
        const result = path.rawPath;
        return (_timeInMs: number): string => {
          return result;
        };
      } else {
        // TODO this should probably be the largest from the group that we are adding.
        const firstInterestingFrequency = Math.abs(
          terms[startingTermCount].frequency
        );
        const r = 0.2 / firstInterestingFrequency;
        /**
         * This creates a function which takes a time in milliseconds,
         * 0 at the beginning of the script.
         * The output is scaled to the range 0 - 1,
         * for use with PathShape.parametric().
         * The output might be outside of that range.
         * I.e. the input and output are both numbers but they are interpreted on different scales.
         */
        const tToCenter = makeBoundedLinear(0, -r, 1, 1 + r);
        const startingFunction = termsToParametricFunction(
          terms,
          startingTermCount
        );
        const addingFunction = termsToParametricFunction(
          terms,
          endingTermCount - startingTermCount,
          startingTermCount
        );
        const numberOfDisplaySegments =
          recommendedNumberOfSegments(endingTermCount);
        if (
          startingTermCount == 0 ||
          (startingTermCount == 1 && hasFixedContribution(terms[0]))
        ) {
          // We are converting from a dot to something else.
          const startingPoint = hasFixedContribution(terms[0]) ?? {
            x: 0,
            y: 0,
          };
          return (timeInMs: number): string => {
            const centerOfChange = tToCenter(timeInMs);
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
                const base = startingFunction(t);
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
            const centerOfChange = tToCenter(timeInMs);
            const getFraction = makeEasing(
              centerOfChange - r,
              centerOfChange + r
            );
            function parametricFunction(t: number) {
              const base = startingFunction(t);
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
    function getPath2(index: number, t: number) {
      const info = segmentInfo[index];
      return info(t);
    }
    return getPath2;
  }
}

class FourierAnimation {
  hide() {
    this.#destination.hide();
  }
  readonly #showPath: (timeInMs: number) => void;
  show(timeInMs: number) {
    this.#destination.show(this.#referenceColor, this.#liveColor);
    this.#destination.setReferencePath(this.#pathString);
    this.#destination.setTransform(this.#transform);
    this.#showPath(timeInMs);
  }
  readonly timer: Timer;
  readonly #pathString: string;
  readonly #destination: Destination;
  readonly #referenceColor: string;
  readonly #liveColor: string;
  readonly #transform: DOMMatrix;
  readonly base: FourierBase;
  static readonly PERIOD = 7000;
  static readonly PAUSE = 1000;
  constructor(options: Options) {
    this.base = options.base;
    this.#pathString = options.base.pathString;
    this.#destination = options.destination;
    this.#referenceColor = options.referenceColor;
    this.#liveColor = options.liveColor;
    pathCaliper.d = this.#pathString;
    this.#transform = this.#destination.getTransform(pathCaliper.getBBox());
    this.timer = new Timer(
      options.base.stepCount,
      FourierAnimation.PERIOD,
      FourierAnimation.PAUSE
    );
    const getPath = options.base.makeGetPath1(this.timer);
    this.#showPath = (timeInMs: number) => {
      const pathString = getPath(timeInMs);
      this.#destination.setLivePath(pathString);
    };
  }
}

type Showable = { show(timeInMs: number): void };

function initialize(...animations: Showable[]) {
  //const background = new Background(options.backgroundSeed);
  //(window as any).customBackground = background;
  showFrame = (timeInMs: number) => {
    // TODO the comments say seconds but the variable name says ms.
    // Tests suggests that "seconds" is accurate.
    //background.draw(timeInMs);
    animations.forEach((fourierAnimation) => fourierAnimation.show(timeInMs));
  };
}

let animationLoop: AnimationLoop;

// Without this setTimeout() the animation would
// skip a lot of time in the beginning.  A lot of the setup time
// would happen right after the first frame and after our clock
// starts.
setTimeout(() => {
  if (disableAnimationLoop) {
    return;
  }
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
  animationLoop?.cancel();
  return {
    source: "fourier-smackdown.ts",
    script,
    seconds:
      49 +
      20 /* Add 20 seconds past the main action for my YouTube end screen */,
    devicePixelRatio,
  };
}

(window as any).initScreenCapture = initScreenCapture;

/**
 * A pair of vertices.
 * The order doesn't matter.
 */
class Edge {
  constructor(readonly vertex1: number, readonly vertex2: number) {}
  has(vertex: number) {
    return vertex == this.vertex1 || vertex == this.vertex2;
  }
  other(vertex: number) {
    if (this.vertex1 == vertex) {
      return this.vertex2;
    }
    if (this.vertex2 == vertex) {
      return this.vertex1;
    }
    return undefined;
  }
}

/**
 * A read only array of vertex numbers.
 *
 * The vertices are numbered 0 through n-1.
 *
 * These are usually stored in a canonical form.
 * This help reduce the number of uninteresting variations we get.
 * Start from vertex 0.
 * It's a loop, it doesn't matter where we start.
 * Then immediately move to vertex 2.
 * (We are assuming that there is an edge between those two, which works with my current examples.)
 * So we don't consider the same loop moving in the opposite direction.
 *
 * When we report a solution, we always return to the same point where we started.
 * I.e. the first and last value in this array will be identical.
 * But when we are rotating the array to make a key string, then we remove that last item from the list.
 * A normal rotate doesn't work when the first item (and only the first item) is duplicated.
 * And the last item was redundant, so it doesn't add any value to our key.
 */
type Path = readonly number[];

/**
 * This searches a graph and returns all Euler circuits.
 */
class Progress {
  /**
   *
   * @param pathSoFar Outbox
   * @param remainingEdges Inbox
   */
  private constructor(
    readonly pathSoFar: Path,
    readonly remainingEdges: Edge[]
  ) {}
  /**
   *
   * @returns Where can we go in exactly one step.
   */
  oneStep() {
    const initialVertex = assertNonNullable(this.pathSoFar.at(-1));
    return this.remainingEdges.flatMap((edge, index) => {
      const nextVertex = edge.other(initialVertex);
      if (
        nextVertex === undefined ||
        (this.pathSoFar.length == 1 && nextVertex != 1)
      ) {
        return [];
      }
      // Add the new vertex and remove the edge we used to get there.
      const next = new Progress(
        [...this.pathSoFar, nextVertex],
        this.remainingEdges.toSpliced(index, 1)
      );
      return next;
    });
  }
  *#depthFirstSearch(): Generator<Path> {
    if (this.remainingEdges.length == 0) {
      // No more work to do.  Yield the result.
      yield this.pathSoFar;
    } else {
      const options = this.oneStep();
      for (const nextStep of options) {
        yield* nextStep.#depthFirstSearch();
      }
    }
  }
  /**
   * Generates all Euler circuits of a graph.
   *
   * This restricts the results to start at vertex 0.
   * That removes any paths that were identical except that they start at a different place in the circuit.
   * And it restricts direction we travel to avoid paths that are identical except for the direction.
   * @param allEdges A description of a graph.
   */
  static *get(allEdges: Edge[]) {
    const start = new this([0], allEdges);
    // TODO filter out the trivial duplicates
    yield* start.#depthFirstSearch();
  }
  /**
   * This adds a filter on top of `Progress.get()`.
   *
   * This removes any paths that would be the same as an existing path aside from a rotation or reversing the direction.
   * This makes sense for things like the star inscribed in a circle, because that example has those symmetries.
   * This might not always make sense.
   * @param allEdges A description of a graph.
   */
  static *getUnique(allEdges: Edge[]) {
    const numberOfVertices =
      Math.max(
        ...allEdges.map((edge) => Math.max(edge.vertex1, edge.vertex2))
      ) + 1;
    const accountedFor = new Set<string>();
    for (const solution of this.get(allEdges)) {
      const rotatable = solution.slice(0, solution.length - 1);
      const key = this.#makeKey(rotatable);
      if (!accountedFor.has(key)) {
        // We found something new!
        yield solution;
        accountedFor.add(key);
        const rotations = this.#rotations(rotatable, numberOfVertices).map(
          (path) => this.#makeKey(path)
        );
        for (const rotation of rotations) {
          accountedFor.add(rotation);
        }
        //console.log("adding", key, rotations);
      } else {
        //console.log("skipping duplicate", key);
      }
    }
  }
  static #makeKey(path: Path) {
    return String.fromCharCode(...path.map((value) => value + 65));
  }
  static #rotations(path: Path, vertexCount: number) {
    const result = new Array<Path>();
    for (let index = 1; index < path.length; index++) {
      const value = path[index];
      const desiredValue = (value + 1) % vertexCount;
      const nextValue = getMod(path, index + 1);
      if (desiredValue == nextValue) {
        result.push(
          initializedArray(path.length, (destinationIndex) => {
            const sourceValue = getMod(path, destinationIndex + index);
            const destinationValue = positiveModulo(
              sourceValue - value,
              vertexCount
            );
            return destinationValue;
          })
        );
      } else {
        const previousValue = getMod(path, index - 1);
        if (previousValue == desiredValue) {
          result.push(
            initializedArray(path.length, (destinationIndex) => {
              const sourceValue = getMod(path, index - destinationIndex);
              const destinationValue = positiveModulo(
                sourceValue - value,
                vertexCount
              );
              return destinationValue;
            })
          );
        }
      }
    }
    return result;
  }
  static getSamples() {
    function inscribed(
      vertexCount: number,
      ...increments: [firstIncrement: number, ...remainingIncrements: number[]]
    ) {
      return initializedArray(vertexCount, (initialVertex) =>
        increments.map(
          (incrementBy) =>
            new Edge(initialVertex, (initialVertex + incrementBy) % vertexCount)
        )
      ).flat();
    }
    return {
      /**
       * A 5 pointed star inside a pentagon.
       */
      pentagram: inscribed(5, 1, 2),
      /**
       * The edges of a dodecahedron.
       * Which are the same as a 6 pointed star inside a hexagon.
       */
      dodecahedron: inscribed(6, 1, 2),
      /**
       * Just a square.
       */
      square: inscribed(4, 1),
      /**
       * A simple n sided polygon where n is currently 10.
       */
      hex: inscribed(10, 1),
    };
  }
}

(window as any).Progress = Progress;

/**
 * CONTENT / TODO
 *
 * Sierpiński triangle!!!
 *
 * Open star vs star.  7 point random vs...
 *   5 point random?
 *   other type of 7 point random?
 *   Try and see what looks best
 * Zoom in on the corners of the stars
 *
 * The inscribed heptagram
 *   show several versions at once.
 *   Each one will end with all the circle segments being one color and the straight segments being another color
 *   We trace the colors from the beginning, based on the t parameter, but they only make sense at the end.
 *   In one version the two colors will initially be all grouped together.
 *   In another version the two colors will initially alternate as much as possible.
 *   And more versions.
 *
 * And at least one version with 7 points and all of the lines in there.
 *   And three colors for the three types of lines.
 *   Again, one version with each of the three colors initially grouped together.
 *   And at least one with the 3 colors in a row repeating 7 times initially.
 *   Probably more than one interesting repeating pattern.
 *   And probably some interesting random patterns.
 *
 * Dodecahedron vs tesseract
 *   Use the picture from https://math.stackexchange.com/a/1092697/1191892
 *     We will have a normal path that we work with to do the FFT and the like.
 *     But the reference image will be hand drawn.
 *     Imagine something very similar to that, but vector graphics.
 *     Keep the thin black lines.
 *     Keep the dotted lines, maybe a little better than they did it.
 *     Draw this **on top** of the Fourier output.
 *     Usually it's on the bottom, but I want to keep these thin lines.
 *     The dashed line, when it covers the fourier output, should still give the idea that those lines are in the back.
 *   There are a lot of nice pictures of tesseracts out there.
 *     Maybe steal one as is!
 *     The all seem to have significant girth to the lines,
 *     and in an important way that I don't want to change.
 *     Draw one of those in the background.
 *     Do the normal FFT on top, but with fairly thin lines that won't completely cover the picture.
 *     Nice candidate, high res png:  https://en.wiktionary.org/wiki/tesseract#/media/File:Schlegel_wireframe_8-cell.png
 *     Lower quality, but slightly easier to see:  https://www.daviddarling.info/encyclopedia/T/tesseract.html#google_vignette
 *
 *
 * Dodecahedron vs star. ✶ ✶ ✶
 *   Inscribed jewish star.
 *   Start from two pictures of the dodecahedron.
 *   One morphs smoothly into the star.
 *   Same exact graph.
 *   The picture is distorted slightly, but as little as possible.
 *
 * Dodecahedron vs dodecahedron ✶ ✶ ✶
 *   I had some simple and repetitive ones.
 *   It would be interesting to start with two of those.
 *   There are so many to choose from.
 *     Run the fourier transform on each of them.
 *     Compare the results to see if there are trends.
 *     Group them maybe by which frequency has the highest amplitude
 *
 * Stars with more sides to see if I can make that first thing spin more times.
 * Lots of combinations., maybe spread randomly on the screen, not all the same size.
 *
 * 3 identical shapes, 7 pointed random stars, but they are squashed to different aspect ratios.
 *
 * hand drawn, multiple stars making a super star.  Or at least a triangle.
 *
 * https://courses.lumenlearning.com/waymakermath4libarts/chapter/euler-circuits/
 * Multiple versions of the envelope.
 *
 * https://webwork.moravian.edu/100.2/sec_EulProbs.html
 * 4.6.2 and 4.6.3
 *
 * https://en.wikipedia.org/wiki/Even_circuit_theorem
 * Both from the image
 *
 * hilbert5?  Can I do it?  I'll need more than 1024 circles.
 *
 * hilbert4 -- Show the other smaller ones as it's filling in detail.
 * Can I do with the the piano curves?
 * Can I find other space filling curves?
 *
 * Hilbert 0 -- Show the original effect.
 * Show similar for one of the space filling curves and like share and subscribe
 *
 * Multiple squares?
 *   The one that slows down in the corners
 *   Can I make it worse than the original h0?
 *
 * Words:
 *   "Your name here"?
 *   supercalifragilisticexpialidocious
 *     Break it in half?  So it can be on two lines
 *   "Avada Kedavra"
 * "Euler circuit"
 * One color per letter?
 *   "Euler circuits are" on top, bigger letters, supercalifragilisticexpialidocious on bottom, smaller letters
 *
 *
 * Mandelbrot !
 *
 * Reverse fourier.
 *   Show one full image (all circles used) and one dot (no circles used)
 *   Then move the terms from the first to the second one by one
 *   So the first will show terms n-1024 and the second one will show terms 0 - (n-1)
 *   The second one is a normal fourier drawing and the scale will remain fixed.
 *   The first one will quickly shrink a lot, so we need to keep zooming in,
 *
 *
 * A series of 4 of 5 similar items, each slightly more distorted than the next,
 * maybe the first one converges very quickly but the later on ones take more time.
 * Maybes stars with more and more randomness, or even forced to be further off.
 *
 * Can I have some image or path that is changing continuously over time,
 * And then do a fourier on top of that?
 * We probably don't want the fourier animating at the same time as the shape is changing.
 * Instead show n snapshots on the screen of the first n interesting images.
 * Probably need to fix the scale based on the largest that the item can be.
 * So if you're looking at just the first circle, it can grow and shrink.
 * Maybe force the frequency 0 term to be first and always included.
 * So you might see a circle in the first sample that moves and grows or shrinks.
 * Hmm.  If we sort the terms by amplitude, the order can change as the subject changes.
 * Maybe take n samples over the lifetime of the animation, and look at the max or average amplitude or such.
 * Similar to previous idea.
 *
 * I'm very curious about the frequencies of the circles as they appear on the screen.
 * I was originally focused on amplitude, and it's still good to sort and group by that.
 * But watching things appear, trying to understand them, I'd love to see the frequency of each circle.
 * Definitely a number.
 * And also a circle that spins with the correct frequency and phase.
 * Update it with the main animation.
 * Pause at the same times and make one full cycle in the full time.
 * Always a full sized circle so it's easy to see the quick motion.
 * Consider a conic gradient (css or canvas, svg doesn't support it.)
 * The 0 point will be a hard edge.  And it's all gradient as you get back.
 */

/**
 * Things to try at the console:
 *
 * samples = Progress.getSamples()
 * [...Progress.getUnique(samples.hex)].length
 * fourier-smackdown.ts:828 adding ABCDEFGHIJ (9) ['ABCDEFGHIJ', 'ABCDEFGHIJ', 'ABCDEFGHIJ', 'ABCDEFGHIJ', 'ABCDEFGHIJ', 'ABCDEFGHIJ', 'ABCDEFGHIJ', 'ABCDEFGHIJ', 'ABCDEFGHIJ']
 * 1
 *
 * [...Progress.get(samples.pentagram)].length/5
 * 26.4
 * [...Progress.getUnique(samples.pentagram)].length
 * lots of debug stuff omitted
 * 28
 *
 * [...Progress.get(samples.dodecahedron)].length/6
 * 62
 * lots of debug stuff omitted
 * 66
 */

function test() {
  const samples = Progress.getSamples();
  const paths = Progress.getUnique(samples.pentagram);
  console.log(paths, (paths as object).constructor.name);
  for (const _path of paths) {
  }
}
test();

{
  class ShapeMaker5 {
    private constructor(_: never) {
      throw new Error("wtf");
    }
    static readonly points: readonly {
      readonly x: number;
      readonly y: number;
    }[] = initializedArray(5, (n) => {
      const angle = (FULL_CIRCLE * n) / 5 + FULL_CIRCLE / 4;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      return { x, y };
    });
    static readonly allPaths: readonly Path[] = [
      ...Progress.getUnique(Progress.getSamples().pentagram),
    ];
  }
  ShapeMaker5;
  class ShapeMaker6 {
    private constructor(_: never) {
      throw new Error("wtf");
    }
    static readonly points: readonly {
      readonly x: number;
      readonly y: number;
    }[] = initializedArray(6, (n) => {
      const angle = (FULL_CIRCLE * n) / 6 + FULL_CIRCLE / 4;
      const x = Math.cos(angle);
      const y = Math.sin(angle);
      return { x, y };
    });
    static readonly allPaths: readonly Path[] = [
      ...Progress.getUnique(Progress.getSamples().dodecahedron),
    ];
    static makePathShape(index: number) {
      const path = this.allPaths[index];
      const pathBuilder = PathBuilder.M(points[0].x, points[0].y);
      path.forEach((vertex, index) => {
        if (index == 0) {
          if (vertex != 0) {
            throw new Error("wtf");
          }
        } else {
          const { x, y } = points[vertex];
          const previousVertex = path[index - 1];
          const stepsForward = positiveModulo(vertex - previousVertex, 6);
          switch (stepsForward) {
            case 1: {
              pathBuilder.arc(0, 0, x, y, "cw");
              break;
            }
            case 2:
            case 4: {
              pathBuilder.L(x, y);
              break;
            }
            case 5: {
              pathBuilder.arc(0, 0, x, y, "ccw");
              break;
            }
            default: {
              throw new Error("wtf");
            }
          }
        }
      });
      return pathBuilder.pathShape;
    }
  }
  const points = ShapeMaker6.points;

  const allPaths = ShapeMaker6.allPaths;

  const colorPairs = [
    { light: "var(--pastel-blue)", dark: "var(--darker-blue)" },
    { light: "var(--pastel-lavender)", dark: "var(--darker-purple)" },
    { light: "var(--pastel-pink)", dark: "var(--darker-pink)" },
    { light: "var(--pastel-mint)", dark: "var(--darker-teal)" },
    { light: "var(--pastel-coral)", dark: "var(--darker-coral)" },
  ];

  const random = Random.fromString("fourier-smackdown.ts");
  const colorsByIndex = initializedArray(allPaths.length, () => {
    const index = (random() * 3) | 0;
    const thisTime = colorPairs[index];
    colorPairs.splice(index, 1);
    colorPairs.push(thisTime);
    return thisTime;
  });
  colorsByIndex;

  // const requestedIndex = parseIntX(
  //   new URLSearchParams(window.location.search).get("index")
  // );
  // const index = requestedIndex ?? (Math.random() * allPaths.length) | 0;

  // colorsByIndex[index];
  // const colors = { light: "var(--pastel-pink)", dark: "var(--darker-pink)" };
  // console.log({ requestedIndex, index, path, ...colors });
  // console.log(allPaths);

  //let colorIndex = 7;

  let todaysIndex = 64;

  // MARK: Locations

  function circle(r: number, cx: number, cy: number): ReadOnlyRect {
    const x = cx - r;
    const y = cy - r;
    const width = 2 * r;
    const height = 2 * r;
    return { x, y, width, height };
  }

  const unit = 9 / 4;
  const clientPortion = 0.65;

  const baseInfo: {
    color: string;
    destRect: ReadOnlyRect;
    index: number;
    search?: string;
  }[] = [
    {
      color: "n/a",
      destRect: circle(2, 11.5, 2.5),
      index: todaysIndex,
    },
    {
      color: "n/a",
      destRect: circle(2, 4.5, 6.6),
      index: todaysIndex,
    },
  ];
  const layoutInfo = {
    radius: unit * clientPortion,
    cx: [
      unit,
      (unit + 16 / 2) / 2,
      16 / 2,
      (16 - unit + 16 / 2) / 2,
      16 - unit,
    ],
    cy: [9 - 2.75 * unit, 2.75 * unit],
  };
  console.log(layoutInfo);

  function showIndex(
    index: number,
    where: SVGTextElement | string = ".chapter"
  ) {
    if (typeof where === "string") {
      where = querySelector(where, SVGTextElement);
    }
    where.innerHTML = `#${index} of ${ShapeMaker6.allPaths.length}`;
  }
  showIndex;

  const fourierInfo = baseInfo.map(({ index }) => {
    const pathString = ShapeMaker6.makePathShape(index).rawPath;
    return new FourierBase(pathString);
  });

  // MARK: Group multiple different ones
  if (false) {
    //fourierInfo[1].terms.forEach((term) => (term.frequency = -term.frequency));
    /**
     * For each frequency, list the amplitudes of that frequency used by all three curves.
     * So we can make make decisions for all three curves at once.
     */
    const amplitudes = new Map<number, number[]>();
    fourierInfo.forEach((base) =>
      base.terms.forEach(({ frequency, amplitude }) => {
        let amplitudesForThisFrequency = amplitudes.get(frequency);
        if (!amplitudesForThisFrequency) {
          amplitudesForThisFrequency = new Array<number>();
          amplitudes.set(frequency, amplitudesForThisFrequency);
        }
        amplitudesForThisFrequency.push(amplitude);
      })
    );
    /**
     * Now sort the records so we can see which frequencies have the most total amplitude.
     * We usually like to display the highest amplitude changes first.
     */
    const amplitudes1 = Array.from(
      amplitudes.entries(),
      ([frequency, amplitudes]) => ({
        frequency,
        amplitude: amplitudes.sort((a, b) => a - b)[2] ?? 0,
      })
    );
    amplitudes1.sort((a, b) => b.amplitude - a.amplitude);
    // This first attempt just kept the 10 highest values
    // before letting each curve go off on it's own.
    // It worked well even when we stopped here.
    //amplitudes1.splice(10, numberOfFourierSamples);
    /**
     * The first phase continues until I can't find any more terms with enough amplitude
     * to care about.  I (arbitrarily) set the cutoff at 1/20 of the highest amplitude.
     */
    const amplitudeCutoff = amplitudes1[0].amplitude * 0.05;
    /**
     * These are the frequencies that we want to start with.
     * First display all of these, in order.
     * Then each curve can return to its own list.
     */
    const amplitudes2 = amplitudes1
      .filter(({ amplitude }) => amplitude > amplitudeCutoff)
      .slice(0, 6);
    console.log(amplitudes2);

    /**
     * Go through each animation.
     * Reorder the terms to match the list that we created above.
     */
    fourierInfo.forEach(({ terms, keyframes }, index) => {
      const bins: FourierTerm[][] = [];
      // Move the common terms to the front.
      amplitudes2.forEach(({ frequency }, _desiredIndex) => {
        const initialIndex = terms.findIndex(
          (term) => term.frequency == frequency
        );
        if (initialIndex == -1) {
          bins.push([{ amplitude: 0, phase: 0, frequency }]);
        } else {
          bins.push(terms.splice(initialIndex, 1));
        }
      });
      // Group the remaining items into bins.
      const desiredBinCount = 11;
      while (bins.length < desiredBinCount - 1) {
        let binSize: number;
        if (bins.length < 6) {
          binSize = 1;
        } else if (bins.length < 10) {
          binSize = 3;
        } else {
          binSize = 10;
        }
        const big = terms.splice(0, binSize);
        if (big.length != binSize) {
          throw new Error("wtf");
        }
        bins.push(big);
      }
      // Make one big group and add it right after the common part.
      let bigGroupIndex: number;
      switch (index) {
        case 0:
        case 4: {
          bigGroupIndex = amplitudes2.length + 1;
          break;
        }
        case 1:
        case 3: {
          bigGroupIndex = amplitudes2.length + 2;
          break;
        }
        case 2: {
          bigGroupIndex = amplitudes2.length + 3;
          break;
        }
        default: {
          throw new Error("wtf");
        }
      }
      bigGroupIndex = bins.length - 1;
      bins.splice(bigGroupIndex, 0, [...terms]);
      if (bins.length != desiredBinCount) {
        throw new Error("wtf");
      }
      // Move two big-ish ones all the way to the end.
      const newLastItems = bins.splice(2, 2);
      bins.push(...newLastItems);
      if (bins.length != desiredBinCount) {
        throw new Error("wtf");
      }
      // Move a smallish one toward the front
      const smallish = bins.splice(6, 1);
      bins.splice(2, 0, ...smallish);
      if (bins.length != desiredBinCount) {
        throw new Error("wtf");
      }
      bins.splice(0, 0, ...initializedArray(index, () => []));
      bins.splice(
        Number.MAX_SAFE_INTEGER,
        0,
        ...initializedArray(4 - index, () => [])
      );
      console.log(bins);
      terms.length = 0;
      keyframes.length = 0;
      keyframes.push(0);
      bins.forEach((bin) => {
        terms.push(...bin);
        keyframes.push(terms.length);
      });
      // if (terms.length != originalNumberOfTerms) {
      //   throw new Error("wtf");
      // }
    });
  }

  // MARK: Forward and back
  if (true) {
    /**
     * Go through each animation.
     * Reorder the terms to match the list that we created above.
     */
    fourierInfo.forEach(({ terms, keyframes }, _index) => {
      const originalNumberOfTerms = terms.length;
      const normalBins: FourierTerm[][] = [];
      // Move the common terms to the front.
      const desiredBinCount = 7; //10;
      while (normalBins.length < desiredBinCount - 1) {
        let binSize: number;
        if (normalBins.length < 6) {
          binSize = 1;
        } else {
          binSize = 3;
        }
        const newBin = terms.splice(0, binSize);
        if (newBin.length != binSize) {
          throw new Error("wtf");
        }
        normalBins.push(newBin);
      }
      // Rearrange all the normal bins.  The first two remain first, and the third one goes to the end.
      // The fourth and fifth go right after the first and second and the sixth goes right before the third.
      // Continue for all normal bins.
      const beginning: FourierTerm[][] = [];
      const end: FourierTerm[][] = [];
      normalBins.forEach((bin, originalIndex) => {
        if (originalIndex % 3 < 2) {
          beginning.push(bin);
        } else {
          end.unshift(bin);
        }
      });
      // Make one bin from the remaining terms and add it right between the beginning and end.
      const bins: FourierTerm[][] = [...beginning, [...terms], ...end];
      if (bins.length != desiredBinCount) {
        throw new Error("wtf");
      }
      /*
      bins.splice(0, 0, ...initializedArray(index, () => []));
      bins.splice(
        Number.MAX_SAFE_INTEGER,
        0,
        ...initializedArray(4 - index, () => [])
      );
      */
      console.log(bins);
      terms.length = 0;
      keyframes.length = 0;
      keyframes.push(0);
      bins.forEach((bin, _index, _array) => {
        terms.push(...bin);
        keyframes.push(terms.length);
      });
      if (terms.length != originalNumberOfTerms) {
        throw new Error("wtf");
      }
    });
  }

  // MARK: reorderForSymmetry()
  function reorderForSymmetry(
    terms: FourierTerm[],
    desiredFrequency: number,
    direction: 1 | -1
  ) {
    terms.sort((a, b) => b.amplitude - a.amplitude);
    const front = new Array<FourierTerm>();
    const back = new Array<FourierTerm>();
    let amplitudeCutoff: undefined | number;
    terms.forEach((term) => {
      if (amplitudeCutoff !== undefined && term.amplitude < amplitudeCutoff) {
        back.push(term);
      } else if ((term.frequency + direction) % desiredFrequency == 0) {
        front.push(term);
        if (amplitudeCutoff === undefined) {
          amplitudeCutoff = term.amplitude * 0.05;
        }
      } else {
        back.push(term);
      }
    });
    terms.length = 0;
    terms.push(...front, ...back);
    console.log(front, back, terms);
    return { frontLength: front.length };
  }
  if (false) {
    reorderForSymmetry(fourierInfo[0].terms, 4, -1); // 4,-1
    reorderForSymmetry(fourierInfo[1].terms, 4, -1); //3,-1. better 4,+1 or 4,-1
    reorderForSymmetry(fourierInfo[2].terms, 5, -1); //2,+1. better 3,+1 or 5,-1
  }

  console.log(fourierInfo);

  // MARK: holdBackThree()
  /**
   * This was a nice way to make 8 related animations from the same base.
   *
   * It reserves 3 terms that it can control.
   * Half of the instances get the first term near the beginning, others will just sit and wait.
   * Next, half of the instances get the second term, but half chosen a different way.
   * Then the third half git the third term.
   * Use binary so each of 8 terms can get a different subset of the original three terms.
   * Near the end we revisit the first of these special terms.
   * Instances that already included this term sit quietly while the other instances add this term.
   * Then the second of the special terms.
   * Then the same for the third.
   *
   * Other terms are grouped and arranged to make things look good.
   * This was based on moveSmallOnesToTheFront().
   * @param fourierBase This will be modified.
   * @param which 0 through 7, inclusive.
   * When I only had 7 instances I chose to skip 0 and use 1 though 7.
   */
  function holdBackThree(fourierBase: FourierBase, which = 0) {
    if (which == 0) {
      console.table(fourierBase.terms.slice(0, 20));
    }
    const bins: FourierTerm[][] = [];
    const terms = fourierBase.terms;
    const numberOfTerms = terms.length;
    const smallTermsBinIndex = 7;
    const desiredBinCount = 14;
    const special = terms.splice(3, 3);
    const finalBins: typeof bins = [];
    special.forEach((term, index) => {
      const present = (which & (2 ** index)) > 0;
      if (present) {
        bins.push([term]);
        finalBins.push([]);
      } else {
        bins.push([]);
        finalBins.push([term]);
      }
    });
    while (bins.length < desiredBinCount - 1 - finalBins.length) {
      let binSize: number;
      if (bins.length < 6) {
        binSize = 1;
      } else if (bins.length < 8) {
        binSize = 2;
      } else {
        binSize = 3;
      }
      const big = terms.splice(0, binSize);
      if (big.length != binSize) {
        throw new Error("wtf");
      }
      bins.push(big);
    }
    // Move a big term, one of the first first terms to the front, right before the separation.
    const bigTerm = bins.splice(5, 1)[0];
    bins.splice(0, 0, bigTerm);
    /*
    for (let i = 1; i < bins.length; i++) {
      const binsRemaining = bins.length - i - 1;
      const itemsRemaining = terms.length;
      const itemsThisTime = Math.round(itemsRemaining / binsRemaining);
      bins[i].push(...terms.splice(0, itemsThisTime));
    }
    */
    bins.splice(smallTermsBinIndex, 0, [...terms]);
    bins.push(...finalBins);
    console.log(bins);
    if (bins.length != desiredBinCount) {
      throw new Error("wtf");
    }
    terms.length = 0;
    if (terms.length != 0) {
      throw new Error("wtf");
    }
    const keyframes = fourierBase.keyframes;
    keyframes.length = 0;
    keyframes.push(0);
    bins.forEach((bin) => {
      terms.push(...bin);
      keyframes.push(terms.length);
    });
    if (terms.length != numberOfTerms) {
      throw new Error("wtf");
    }
  }
  holdBackThree;

  // MARK: moveSmallOnesToTheFront()
  function moveSmallOnesToTheFront(fourierBase: FourierBase, which = 0) {
    if (which == 0) {
      console.table(fourierBase.terms.slice(0, 20));
    }
    const bins: FourierTerm[][] = [];
    const terms = fourierBase.terms;
    const numberOfTerms = terms.length;
    const smallTermsBinIndex = 3 + 2 * which;
    const desiredBinCount = 12;
    while (bins.length < desiredBinCount - 1) {
      let binSize: number;
      if (bins.length < 6) {
        binSize = 1;
      } else if (bins.length < 8) {
        binSize = 2;
      } else {
        binSize = 5;
      }
      const big = terms.splice(0, binSize);
      if (big.length != binSize) {
        throw new Error("wtf");
      }
      bins.push(big);
    }
    // Move a big term, one of the first first terms to the front, right before the separation.
    //const bigTerm = bins.splice(5, 1)[0];
    //bins.splice(0, 0, bigTerm);
    /*
    for (let i = 1; i < bins.length; i++) {
      const binsRemaining = bins.length - i - 1;
      const itemsRemaining = terms.length;
      const itemsThisTime = Math.round(itemsRemaining / binsRemaining);
      bins[i].push(...terms.splice(0, itemsThisTime));
    }
    */
    bins.splice(smallTermsBinIndex, 0, [...terms]);
    console.log(bins);
    if (bins.length != desiredBinCount) {
      throw new Error("wtf");
    }
    terms.length = 0;
    if (terms.length != 0) {
      throw new Error("wtf");
    }
    const keyframes = fourierBase.keyframes;
    keyframes.length = 0;
    keyframes.push(0);
    bins.forEach((bin) => {
      terms.push(...bin);
      keyframes.push(terms.length);
    });
    if (terms.length != numberOfTerms) {
      throw new Error("wtf");
    }
  }
  if (false) {
    fourierInfo.forEach((f, index) => {
      moveSmallOnesToTheFront(f, index);
    });
  }

  const animations = new Array<Showable>();
  const foregroundG = querySelector("g#foreground", SVGGElement);
  const chapterList = getById("chapterList", SVGTextElement);
  const altColorPairs: {
    light: string;
    dark: string;
  }[] = [
    { light: "Magenta", dark: "black" },
    { light: "Magenta", dark: "black" },
    { light: "HotPink", dark: "red" },
    { light: "white", dark: "gray" },
    { light: "var(--blue)", dark: "blue" },
    { light: "orange", dark: "darkOrange" },
    { light: "Fuchsia ", dark: "DarkViolet" },
  ];
  const lastIndex = baseInfo.length - 1;
  for (const [base, fourier, { light, dark }, index] of zip(
    baseInfo,
    fourierInfo,
    altColorPairs,
    count()
  )) {
    if (false) {
      let textContent = base.index.toString();
      if (index == 0) {
        textContent = "#" + textContent;
        chapterList.innerHTML = "";
      }
      if (index == lastIndex) {
        textContent = "and " + textContent + " of 66.";
      } else {
        textContent += ", ";
      }
      const element = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "tspan"
      );
      element.style.fill = light;
      element.textContent = textContent;
      chapterList.append(element);
    }
    const { destRect, search } = base;
    const frequenciesG =
      search === undefined
        ? document.createElementNS("http://www.w3.org/2000/svg", "g")
        : querySelector(
            `g.frequencies[data-frequencies="${search}"]`,
            SVGGElement
          );
    const top =
      search === undefined
        ? foregroundG.appendChild(
            assertClass(
              querySelector("defs g[data-fourier-top]", SVGGElement).cloneNode(
                true
              ),
              SVGGElement
            )
          )
        : querySelector(`[data-fourier-top="${search}"]`, SVGGElement);
    top.style.setProperty("--color", light);
    top.style.setProperty("--blur-color", dark);
    const destination = new Destination(top, (content: ReadOnlyRect) =>
      panAndZoom(content, destRect, "srcRect fits completely into destRect")
    );
    // This might be the easiest way to find an item later.
    // i.e. [data-live-index="2"] as a css selector to find the third item.
    top.dataset.liveIndex = index.toString();
    frequenciesG.style.fill = dark;
    const options = {
      base: fourier,
      destination: destination,
      liveColor: dark,
      referenceColor: light,
    };
    const fourierAnimation = new FourierAnimation(options);
    //fourierAnimation.show(10000)
    animations.push(fourierAnimation);
    console.log(fourierAnimation);
  }

  {
    const canvas = getById("cga", HTMLCanvasElement);
    // Background:
    const context = canvas.getContext("2d")!;
    // Map to 16x9
    // But the edges will be cut off, it's really 12x9
    // But the middle 12.
    // Note that we are explicitly not maintaining the aspect ratio.
    // Old pixels weren't square.
    const srcRect: ReadOnlyRect = { x: 2, y: 0, width: 12, height: 9 };
    const destRect: ReadOnlyRect = {
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
    };
    const baseTransform = rectToRect(srcRect, destRect);
    const baseTransformMatrix = new DOMMatrix(baseTransform.transformString);
    function resetBackground() {
      context.reset();
      context.fillStyle = "cyan";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    const mainSVG = getById("main", SVGSVGElement);
    const mainPaths = querySelectorAll(
      "[data-live-index] path.main",
      SVGPathElement
    );
    const shadowPaths = querySelectorAll(
      "[data-live-index] path.offset-blur",
      SVGPathElement
    );
    /*
    // Shadow:
    context.fillStyle = "white";
    context.filter = "url(#checkerboard-alpha)";
    context.beginPath();
    context.ellipse(8.25, 4.75, 4, 4, 0, 0, FULL_CIRCLE, false);
    context.fill();
    //context.fillRect(0, 0, canvas.width, canvas.height);
    // Foreground:
    context.fillStyle = "magenta";
    context.filter = "url(#anti-anti-alias)";
    context.beginPath();
    context.ellipse(8, 4.5, 4, 4, 0, 0, FULL_CIRCLE, false);
    context.fill();
    */
    const font = resizeFont(roundCursiveFont, 2);
    const textLayout = new TextLayout(font);
    const layoutInfo: LetterLayoutInfo[] = [];
    layoutInfo.push(...textLayout.addText("Party", "left"));
    textLayout.carriageReturn();
    textLayout.lineFeed();
    layoutInfo.push(...textLayout.addText(" like it’s"));
    textLayout.carriageReturn();
    textLayout.lineFeed();
    layoutInfo.push(...textLayout.addText("  1983."));
    const down = 1;
    const left = 2.2;
    let fullPathShape = PathShape.join(
      layoutInfo.map((letter) => ({
        shape: letter.description.shape,
        Δx: letter.x + left,
        Δy: letter.baseline + down,
      }))
    );
    const lineTextParent = getById("line-text", SVGGElement);
    const textElement = fullPathShape.makeElement(false);
    lineTextParent.append(textElement);

    const clipPathAnimation = canvas.animate(
      [
        {
          clipPath: "rect(0% 100% 100% 0%)",
          offset: 0,
        },
        {
          clipPath: "rect(0% 100% 100% 100%)",
          offset: 0.5,
        },
        {
          clipPath: "rect(0% 0% 100% 0%)",
          offset: 0.5,
        },
        {
          clipPath: "rect(0% 100% 100% 0%)",
          offset: 1,
        },
      ],
      { duration: 9897, iterations: Infinity }
    );
    clipPathAnimation.pause();

    function show(timeInMS: number) {
      clipPathAnimation.currentTime = timeInMS;

      function showPath(from: SVGPathElement) {
        const d = assertNonNullable(from.getAttribute("d"));
        const path = new Path2D(d);
        const style = getComputedStyle(from);
        const strokeWidth = style.strokeWidth;
        const lineWidth = assertNonNullable(
          parseFloatX(/^(.*)px$/.exec(strokeWidth)![1])
        );
        context.lineWidth = lineWidth;
        context.lineCap = style.strokeLinecap as any;
        context.lineJoin = style.strokeLinejoin as any;
        // rehome can't be done in advance.  gave me the identity matrix for both when I tried.
        // presumably getCTM() fails, but I didn't check.
        const rehomed = rehome(from, mainSVG);
        const transform = baseTransformMatrix.multiply(rehomed);
        // I expect the final circle to fit in this rectangle perfectly.
        context.setTransform(transform);
        context.stroke(path);
      }
      resetBackground();
      context.strokeStyle = "white";
      context.filter = "url(#anti-anti-alias)";
      showPath(textElement);
      context.strokeStyle = "black";
      context.filter = "url(#checkerboard-alpha)";
      shadowPaths.forEach((shadowPath) => {
        showPath(shadowPath);
      });
      context.strokeStyle = "magenta";
      context.filter = "url(#anti-anti-alias)";
      mainPaths.forEach((mainPath) => {
        showPath(mainPath);
      });
    }
    animations.push({ show });
  }

  /**
   *
   * @param options
   * @returns A list of 5 spinner objects.
   * The first in the list is on the top of the z-order.
   * The colors come from the list of pastels.
   */
  function make5(options: {
    centerX: number;
    centerY: number;
    radius: number;
  }) {
    return colorPairs
      .map(({ dark }) => new MotionBlurSpinner({ ...options, color: dark }))
      .reverse();
  }

  if (false) {
    // MARK: 10 Frequency Spinners.
    const radius = layoutInfo.radius / 4;
    const cx = layoutInfo.cx;
    const cy = layoutInfo.cy;
    const yOffset = radius * 1.5;
    const binsOfSpinners: MotionBlurSpinner[][] = [];
    [-1, +1].forEach((row) => {
      const centerY = cy[0] + row * yOffset;
      [cx[0], cx[2], cx[4]].forEach((centerX) => {
        binsOfSpinners.push(make5({ centerX, centerY, radius }));
      });
    });
    [-1, +1].forEach((row) => {
      const centerY = cy[1] + row * yOffset;
      [cx[1], cx[3]].forEach((centerX) => {
        binsOfSpinners.push(make5({ centerX, centerY, radius }));
      });
    });
    if (binsOfSpinners.length != 10) {
      throw new Error("wtf");
    }
    const fullAnimation = assertClass(animations[0], FourierAnimation);
    const timer = fullAnimation.timer;
    const bins = fullAnimation.base.bins();
    function show(timeInMS: number) {
      const { index, t } = timer.get(timeInMS);
      const cutoff = t >= 1 ? -1 : index;
      const progressInRadians = t * FULL_CIRCLE;
      for (const [bin, spinners, index] of zip(bins, binsOfSpinners, count())) {
        if (index > cutoff) {
          spinners.forEach((spinner) => {
            spinner.hide();
          });
        } else {
          for (const [term, spinner] of zip(bin, spinners)) {
            const angleToDisplay =
              progressInRadians * term.frequency + term.phase;
            spinner.showRadians(angleToDisplay);
          }
        }
      }
    }
    animations.push({ show });
  }

  if (false) {
    // MARK: New Frequency Spinners.
    const fullAnimation = assertClass(animations[0], FourierAnimation);
    const timer = fullAnimation.timer;
    const bins = fullAnimation.base.bins();
    type Info = { term: FourierTerm; startIndex: number };
    const smallGroupInfo = new Array<Info>();
    const largeGroupInfo = new Array<Info>();
    bins.forEach((terms, startIndex) => {
      const target = terms.length < 7 ? smallGroupInfo : largeGroupInfo;
      terms.forEach((term) => {
        target.push({ term, startIndex });
      });
    });
    [smallGroupInfo, largeGroupInfo].forEach((infoList) => {
      infoList.sort(
        (a, b) => Math.abs(a.term.frequency) - Math.abs(b.term.frequency)
      );
    });
    console.log({ smallGroupInfo, largeGroupInfo });
    // Expecting about 21 terms in smallGroupInfo
    // and 1003 terms in largeGroupInfo
    const smallGroupSpinners = [
      { centerX: 2, centerY: 2, radius: 1 },
      { centerX: 5, centerY: 2, radius: 1 },
      { centerX: 8, centerY: 2, radius: 1 },
      { centerX: 11, centerY: 2, radius: 1 },
      { centerX: 14, centerY: 2, radius: 1 },
    ].map((options) => make5(options));
    const largeGroupSpinners: typeof smallGroupSpinners = [];
    {
      const left = 6 - 0.5;
      const right = 16 - 0.25;
      const across = 7;
      const xIncrement = (right - left) / across;
      const top = 4 - 0.5;
      const bottom = 9 - 0.25;
      const down = 3;
      const yIncrement = (bottom - top) / down;
      for (let y = 0; y < down; y++) {
        for (let x = 0; x < across; x++) {
          const centerX = left + (x + 0.5) * xIncrement;
          const centerY = top + (y + 0.5) * yIncrement;
          const radius = 1 / 3;
          const options = { centerX, centerY, radius };
          const spinners = make5(options);
          largeGroupSpinners.push(spinners);
        }
      }
    }
    function spinnersInOrder(
      asGroups: MotionBlurSpinner[][]
    ): MotionBlurSpinner[] {
      const result = new Array<MotionBlurSpinner>();
      while (true) {
        const donarGroup = asGroups.shift();
        if (!donarGroup) {
          break;
        }
        const nextSpinner = donarGroup.shift();
        if (nextSpinner) {
          result.push(nextSpinner);
          asGroups.push(donarGroup);
        }
      }
      return result;
    }
    const runnable = new Array<{
      term: FourierTerm;
      spinner: MotionBlurSpinner;
      startIndex: number;
    }>();
    for (const [{ term, startIndex }, spinner] of zip(
      smallGroupInfo,
      spinnersInOrder(smallGroupSpinners)
    )) {
      runnable.push({ term, spinner, startIndex });
    }
    for (const [{ term, startIndex }, spinner] of zip(
      largeGroupInfo,
      spinnersInOrder(largeGroupSpinners)
    )) {
      runnable.push({ term, spinner, startIndex });
    }

    if (false) {
      //test it
      runnable.forEach(({ term, spinner }) => {
        spinner.showRadians(term.phase);
      });
    }
    function show(timeInMS: number) {
      const { index, t } = timer.get(timeInMS);
      const cutoff = t >= 1 ? -1 : index;
      const progressInRadians = t * FULL_CIRCLE;
      runnable.forEach(({ term, spinner, startIndex }) => {
        if (startIndex > cutoff) {
          spinner.hide();
        } else {
          const angleToDisplay =
            progressInRadians * term.frequency + term.phase;
          spinner.showRadians(angleToDisplay);
        }
      });
    }
    animations.push({ show });
  }

  if (false) {
    // MARK: Frequency Spinners.
    // TODO bins class.
    //   Extract it from moveSmallOnesToTheFront().
    const frequencySpinners = new FrequencySpinners('[data-frequencies="red"]');
    /**
     * This is full because at the beginning we add all three of the optional terms.
     * That means, at the end we add none of the optional terms.
     */
    const fullAnimation = assertClass(animations.at(2), FourierAnimation);
    const timer = fullAnimation.timer;

    const bins = fullAnimation.base.bins();
    console.log(bins);
    function show(timeInMS: number) {
      const { index, t } = timer.get(timeInMS);
      if (t >= 1) {
        frequencySpinners.show([], 0);
      } else {
        frequencySpinners.show(bins[index], t * FULL_CIRCLE);
      }
    }
    animations.push({ show });
  }

  if (false) {
    // MARK: Pan and zoom.
    const mainSVG = getById("main", SVGSVGElement);
    /**
     * We want to display certain elements so they fill the entire screen.
     */
    const destRect: ReadOnlyRect = mainSVG.viewBox.baseVal;
    /**
     * Display everything on the screen.
     * I.e. the identity transform.
     * I created it this way so it will have the same form as the other two transforms.
     * So I can do a simple animation interpolating between the two.
     */
    const middleTransform = panAndZoomString(
      destRect,
      destRect,
      "srcRect fits completely into destRect"
    );
    const r0 = baseInfo[0].destRect;
    const r1 = baseInfo[1].destRect;
    const widthFor2 = r1.x + r1.width + r0.x;
    /**
     * Show the first two animations full screen.
     */
    const initialSrcRect: ReadOnlyRect = { ...r0, x: 0, width: widthFor2 };
    /**
     * Show the first two animations full screen.
     */
    const initialTransform = panAndZoomString(
      initialSrcRect,
      destRect,
      "srcRect fits completely into destRect"
    );
    const r4 = baseInfo[4].destRect;
    /**
     * Show the last two animations full screen.
     */
    const finalSrcRect: ReadOnlyRect = { ...r4, x: 0, width: widthFor2 };
    /**
     * Show the last two animations full screen.
     */
    const finalTransform = panAndZoomString(
      finalSrcRect,
      destRect,
      "srcRect fits completely into destRect"
    );
    const startPhase0 = 0;
    const endPhase0 = 2 * FourierAnimation.PERIOD;
    const startPhase1 = endPhase0 + FourierAnimation.PAUSE;
    const firstAnimation = assertClass(animations[0], FourierAnimation);
    const endPhase2 = firstAnimation.timer.endTime;
    const startPhase2 = endPhase2 - 2 * FourierAnimation.PERIOD;
    const endPhase1 = startPhase2 - FourierAnimation.PAUSE;
    console.log({
      initialTransform,
      middleTransform,
      finalTransform,
      initialSrcRect,
      finalSrcRect,
    });
    const panAndZoomG = getById("panAndZoomMe", SVGGElement);
    const animation = panAndZoomG.animate(
      [
        {
          offset: startPhase0 / endPhase2,
          transform: initialTransform,
          easing: "ease",
        },
        {
          offset: endPhase0 / endPhase2,
          transform: initialTransform,
          easing: "ease-in",
        },
        {
          offset: startPhase1 / endPhase2,
          transform: middleTransform,
          easing: "ease",
        },
        {
          offset: endPhase1 / endPhase2,
          transform: middleTransform,
          easing: "ease-in",
        },
        {
          offset: startPhase2 / endPhase2,
          transform: finalTransform,
          easing: "ease",
        },
        {
          offset: endPhase2 / endPhase2,
          transform: finalTransform,
          easing: "ease",
        },
      ],
      { duration: endPhase2, fill: "both" }
    );
    animation.pause();
    function show(timeInMS: number) {
      animation.currentTime = timeInMS;
    }
    animations.push({ show });
  }

  if (false) {
    // MARK: Lava Lamp Animation
    const randomnessElement = querySelector(
      "#lava-lamp feColorMatrix:first-of-type",
      SVGFEColorMatrixElement
    );
    const colorElements = [
      querySelector('#lava-lamp feFuncR[type="discrete"]', SVGFEFuncRElement),
      querySelector('#lava-lamp feFuncG[type="discrete"]', SVGFEFuncGElement),
      querySelector('#lava-lamp feFuncB[type="discrete"]', SVGFEFuncBElement),
    ];
    /**
     * Palette Idea 2: Cosmic Serenity
     * Cool, spacey tones with pops of vibrant color for a modern, calming, trippy vibe.
     * Background Colors:
     * Midnight Blue: (25, 25, 112) #191970
     * Slate Blue: (70, 130, 180) #4682B4
     * Lavender Mist: (147, 112, 219) #9370DB
     * Seafoam Green: (60, 179, 113) #3CB371
     * Soft Magenta: (199, 21, 133) #C71585
     * Electric Cyan: (0, 206, 209) #00CED1
     * Pale Lilac: (216, 191, 216) #D8BFD8
     *
     * Foreground Colors:Text: Soft White: (240, 248, 255) #F0F8FF (crisp, readable)
     * Lines/Arrows: Rich Black: (18, 18, 18) #121212 (strong contrast
     */
    const backgroundColors2 = [
      [25, 25, 112],
      [70, 130, 180],
      [147, 112, 219],
      [60, 179, 113],
      [199, 21, 133],
      [0, 206, 209],
      [216, 191, 216],
    ];

    /**
     * Palette Idea 3: Sunset Mirage
     * Warm, sunset-inspired hues with a touch of cool for a relaxing, flowing aesthetic.Background Colors:Deep Plum: (75, 0, 130) #4B0082
     * Twilight Blue: (65, 105, 225) #4169E1
     * Burnt Orange: (204, 85, 0) #CC5500
     * Peach Glow: (255, 160, 122) #FFA07A
     * Soft Pink: (255, 182, 193) #FFB6C1
     * Lemon Yellow: (255, 245, 157) #FFF59D
     * Cool Aqua: (175, 238, 238) #AFEEEE
     *
     * Foreground Colors:Text: Creamy White: (255, 245, 238) #FFF5EE (bright, readable)
     * Lines/Arrows: Dark Slate: (47, 79, 79) #2F4F4F (bold, distinct)
     */
    const backgroundColors3 = [
      [65, 105, 225],
      [204, 85, 0],
      [255, 160, 122],
      [255, 182, 193],
      [255, 245, 157],
      [175, 238, 238],
    ];

    /**
     * Palette Idea 3: Dusky Purples (Warm, Mid-Tone Monochromatic)A range of mid-tone purples for a mystical, lava-lamp-like background.Background Colors (in order, from darkest to lightest):Deep Plum: (60, 20, 80) #3C1450
     * Dark Lavender: (80, 40, 100) #502864
     * Twilight Purple: (100, 60, 120) #643C78
     * Muted Lilac: (120, 80, 140) #78508C
     * Soft Mauve: (140, 100, 160) #8C64A0
     * Pale Amethyst: (160, 120, 180) #A078B4
     * Light Violet: (180, 140, 200) #B48CC8
     *
     * Foreground Colors:Text: Warm White: (255, 240, 230) #FFF0E6 (bright, readable)
     * Lines/Arrows: Golden Orange: (255, 165, 0) #FFA500 (vibrant, bold)
     *
     * Why it works: The purple tones create a cohesive, trippy, and calming background that feels like a glowing dusk. The warm white and golden orange foregrounds contrast vividly with all purple shades, ensuring your text and lines stand out.
     */
    const backgroundColors3a = [
      [80, 40, 100],
      [100, 60, 120],
      [120, 80, 140],
      [140, 100, 160],
      [160, 120, 180],
      [180, 140, 200],
    ];

    /**
     * Palette Idea 2: Muted Sage Greens (Soft, Light Monochromatic)Light, earthy green tones for a calming, natural feel, with bold foregrounds.Background Colors (in order, from darkest to lightest):Deep Sage: (50, 80, 60) #32503C
     * Forest Mist: (70, 100, 80) #466450
     * Olive Haze: (90, 120, 100) #5A7864
     * Sage Green: (110, 140, 120) #6E8C78
     * Mint Glow: (130, 160, 140) #82A08C
     * Pale Celadon: (150, 180, 160) #96B4A0
     * Light Seafoam: (170, 200, 180) #AAC8B4
     *
     * Foreground Colors:Text: Soft Ivory: (240, 235, 210) #F0EBD2 (crisp, readable)
     * Lines/Arrows: Deep Crimson: (139, 0, 0) #8B0000 (striking contrast)
     */
    const backgroundColors2a = [
      [70, 100, 80],
      [90, 120, 100],
      [110, 140, 120],
      [130, 160, 140],
      [150, 180, 160],
      [170, 200, 180],
    ];

    const backgroundColors = [
      backgroundColors2,
      backgroundColors3,
      backgroundColors3a,
      backgroundColors2a,
    ].at(-1)!;
    const backgroundBrightness = makeLinear(0, 0.0, 255, 1);
    backgroundColors.forEach((color) =>
      color.forEach(
        (original, index, array) =>
          (array[index] = backgroundBrightness(original))
      )
    );
    const adjustment1 = makeLinear(-1, -0.05, 1, 0.8);
    const adjustment2 = makeLinear(1, 0, -1, -0.4);
    function updateValues(randomnessAngle: number, fixedAngle: number) {
      const channelAngles = [
        randomnessAngle,
        randomnessAngle + FULL_CIRCLE / 3,
        randomnessAngle - FULL_CIRCLE / 3,
      ];
      const whiteRow = channelAngles.map((angle) =>
        adjustment1(Math.sin(angle))
      );
      whiteRow.push(0);
      whiteRow.push(adjustment2(Math.cos(fixedAngle)));
      const whiteRowString = whiteRow.join(" ");
      const alphaRow = "0 0 0 0 1";
      const matrix = [
        whiteRowString,
        whiteRowString,
        whiteRowString,
        alphaRow,
      ].join("\n");
      randomnessElement.setAttribute("values", matrix);
    }
    (window as any).updateValues = updateValues;
    function updateColors(newColors: number[][]) {
      const colorChannels: number[][] = colorElements.map((_) => []);
      newColors.forEach((color) => {
        if (color.length != colorElements.length) {
          throw new Error("wtf");
        }
        color.forEach((channel, channelIndex) => {
          colorChannels[channelIndex].push(channel);
        });
      });
      for (const [element, components] of zip(colorElements, colorChannels)) {
        element.setAttribute("tableValues", components.join(" "));
      }
    }
    updateColors(backgroundColors);
    function show(timeInMS: number) {
      const randomPart = (timeInMS / 240000) * FULL_CIRCLE * 2;
      const constantPart = ((timeInMS / 240000) * FULL_CIRCLE) / 2;
      updateValues(randomPart, constantPart);
    }
    animations.push({ show });
  }

  console.log(animations);
  initialize(...animations);

  // MARK:  thumbnail
  if (urlParameters.get("thumbnail") == "1") {
    //foregroundG.style.display = "none";
    //const thumbnailG = querySelector("g#thumbnail-foreground", SVGGElement);
    //thumbnailG.style.display = "";
    disableAnimationLoop = true;
    const paths = new Array<SVGElement>();
    Array.from(foregroundG.children).forEach((e) => {
      const element = assertClass(e, SVGElement);
      if (element.dataset["live"] === undefined) {
        element.style.display = "none";
      } else {
        console.log("live", element.dataset["live"]);
        paths.push(element);
      }
    });
    animations[0].show(14000);
    animations[1].show(28000);
    animations[2].show(42000);
    (window as any).showFrame = (timeInMs: number) => {
      console.info(`ignoring showFrame(${timeInMs})`);
    };

    //showFrame(7000 * 4.15);
    //animations[1].show(5500);
    querySelectorAll("[data-reference]", SVGPathElement).forEach(
      (path) => (path.style.display = "none")
    );

    querySelectorAll("#new-starfield circle", SVGCircleElement).forEach(
      (starElement) => {
        starElement.style.transform = "scale(3)";
        starElement.style.transformOrigin = `${starElement.cx.baseVal.value}px ${starElement.cy.baseVal.value}px`;
      }
    );

    // const rectangles = querySelectorAll("#starfield rect", SVGRectElement);
    // rectangles[0].parentElement!.style.transform = "scale(3)";
    // rectangles.forEach((rectangle) => {
    //   rectangle.style.transformOrigin = `${50 / 3}% ${9}%`;
    // });
    // rectangles[1].style.transform = "rotate(1.75deg)";
    // rectangles[2].style.transform = "rotate(-2deg)";

    // const font = resizeFont(roundFuturaLFont, 0.5);
    // [
    //   { name: "red", letter: "S" },
    //   { name: "white", letter: "V" },
    //   { name: "blue", letter: "G" },
    // ].forEach(({ name, letter }) => {
    //   const description = font.get(letter)!;
    //   const pathString = description.shape.translate(
    //     description.advance / 2,
    //     0
    //   ).rawPath;
    //   const paths = querySelectorAll(
    //     `[data-fourier-top="${name}"] [data-live]`,
    //     SVGPathElement,
    //     2,
    //     2
    //   );
    //   paths.forEach((path) => {
    //     path.setAttribute("d", pathString);
    //   });
    // });
    /*
    const live = querySelectorAll("[data-live]", SVGPathElement);
    //live.forEach((element) => {
    // element.style.transform = "scale(1.15) rotate(22deg)";
    //});
    console.log(live[3], live[4]);
    [live[3], live[4]].forEach((path) => {
      const width = getComputedStyle(path).strokeWidth;
      path.style.strokeWidth = `calc(3 * ${width})`;
    });
    //live[5].style.strokeWidth = "0";
    //      "calc(var(--base-stroke-width) / var(--path-scale) * 0.33)"; // 1/3 of what it was.
    //console.log(live[5].style.strokeWidth, live[5], live);
    */
    /*
    querySelectorAll("[data-fourier-top]", SVGGElement, 3, 3).forEach(
      (toGrow, index) => {
        const initialTransform = getComputedStyle(toGrow).transform;
        const translate = ["-0.05px, -0.05px", "-0.3px, 0px", "-0.1px, 0px"];
        const scale = [3, 1.5, 1.5][index];
        toGrow.style.transform = `${initialTransform} scale(${scale}) translate(${translate[index]})`;
      }
    );
    */
  }
}

/**
 * CGA \(320\times 200\) Mode Pixel Aspect Ratio
 * The nominal pixel aspect ratio for CGA \(320\times 200\) mode is \(5:6\).
 *  This means that each pixel is slightly taller than it is wide.
 * This aspect ratio is cited in IBM's documentation, specifically in the BASIC \(1.10\) Reference.
 *
 * Aimed at 4k
 * 3840 x 2160
 *
 * Each 80's pixel will be 2160 / 200 modern pixels tall.
 * That's 10.8 pixels.  I'd rather us a integer.
 * 10 pixels tall would leave an extra 160 modern pixels unused, 7.5%
 * But then each 80's pixel would want to be 10 /6 * 5 = 8.3333 modern pixels across.
 * The only way to get all integers would be to make each 80's pixel 6 x 5 in modern pixels.
 * Height:  200*6 = 1200, 56% of what's available.
 * Width: 320*5 = 1600, 42% of what's available, because cga is 4:3.
 *
 * Full size:
 * Each 80's pixel takes 10.8 pixels (high) x 9 pixels (wide).
 * Tell the css to grow it in a pixelated format.
 * Let it figure out the fractions.
 *
 * Color palette:
 * Mode 4, Palette 1, high intensity
 * 0 – background, use black, #000000
 * 11 – light cyan,  #00FFFF
 * 13 – light magenta, #FF00FF
 * 15 – white, #FFFFFF
 *
 * Use cyan for the background.  magenta for the foreground.  And transparent black for the shadow.
 * If there's space, try writing the chapter number and/or adding a spinner in white.
 */
