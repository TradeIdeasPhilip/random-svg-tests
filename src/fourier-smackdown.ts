import {
  AnimationLoop,
  getById,
  selectorQuery,
  selectorQueryAll,
} from "phil-lib/client-misc";
import {
  groupTerms,
  hasFixedContribution,
  samplesFromPath,
  samplesToFourier,
  termsToParametricFunction,
} from "./fourier-shared";
import "./fourier-smackdown.css";
import { panAndZoom } from "./transforms";
import {
  ParametricToPath,
  PathBuilder,
  PathCaliper,
  PathShape,
} from "./path-shape";
import {
  assertNonNullable,
  FULL_CIRCLE,
  initializedArray,
  makeBoundedLinear,
  makeLinear,
  parseIntX,
  positiveModulo,
  Random,
  ReadOnlyRect,
} from "phil-lib/misc";
import { ease, getMod } from "./utility";

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

const numberOfFourierSamples = 1024;

const scaleG = getById("scaled", SVGGElement);
const referencePath = selectorQuery("[data-reference]", SVGPathElement);
const livePath = selectorQuery("[data-live]", SVGPathElement);

const frequencyBlocks = selectorQueryAll("g.frequency", SVGGElement).map(
  (top) => ({
    top,
    spinner: selectorQuery(".spinner", SVGPolygonElement, top),
    text: selectorQuery("text", SVGTextElement, top),
  })
);

type Options = {
  backgroundSeed: number;
  pathString: string;
  maxGroupsToDisplay: number;
  skipCountAtEnd?: number;
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
  //const timeInMs = (frameNumber / 60) * 1000;
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
  readonly #livePath: SVGPathElement;
  constructor(
    queryString: string,
    readonly getTransform: (content: ReadOnlyRect) => DOMMatrix
  ) {
    this.#gElement = selectorQuery(queryString, SVGGElement);
    this.#referencePath = selectorQuery(
      "[data-reference]",
      SVGPathElement,
      this.#gElement
    );
    this.#livePath = selectorQuery(
      "[data-live]",
      SVGPathElement,
      this.#gElement
    );
  }
  hide() {
    this.#gElement.style.display = "none";
  }
  show(referenceColor: string, liveColor: string) {
    this.#gElement.style.display = "";
    this.#referencePath.style.stroke = referenceColor;
    this.#livePath.style.stroke = liveColor;
  }
  setReferencePath(d: string) {
    this.#referencePath.setAttribute("d", d);
  }
  setLivePath(d: string) {
    this.#livePath.setAttribute("d", d);
  }
  setTransform(transform: DOMMatrix) {
    const scale = transform.a;
    this.#gElement.style.transform = transform.toString();
    this.#gElement.style.setProperty("--path-scale", scale.toString());
  }
  static right = new Destination("#scaled", (content: ReadOnlyRect) =>
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
    selectorQuery("feTurbulence", SVGFETurbulenceElement).seed.baseVal = seed;
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
    /* max value */ 0.555
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
    const period = 60000;
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

const pathCaliper = new PathCaliper();

class FourierAnimation {
  hide() {
    this.#destination.hide();
  }
  show(_t: number) {
    this.#destination.show(this.#referenceColor, this.#liveColor);
    this.#destination.setReferencePath(this.#pathString);
    this.#destination.setTransform(this.#transform);
  }
  readonly endTime: number;
  readonly #pathString: string;
  readonly #destination: Destination;
  readonly #referenceColor: string;
  readonly #liveColor: string;
  readonly #transform: DOMMatrix;
  //  readonly #timeToPath!: readonly ((time: number) => string)[];
  constructor(options: Options) {
    this.#pathString = options.pathString;
    this.#destination = options.destination;
    this.#referenceColor = options.referenceColor;
    this.#liveColor = options.liveColor;
    pathCaliper.d = this.#pathString;
    this.#transform = this.#destination.getTransform(pathCaliper.getBBox());
    // Take the samples.
    const samples = samplesFromPath(options.pathString, numberOfFourierSamples);
    // Create terms
    const terms = samplesToFourier(samples);
    const script = groupTerms({
      addTime: 5250,
      pauseTime: 750,
      maxGroupsToDisplay: options.maxGroupsToDisplay,
      skipCountAtEnd: options.skipCountAtEnd ?? 0,
      terms,
    });
    this.endTime = script.at(-1)!.endTime;
  }
}
FourierAnimation; // TODO actually use this!

//TODO I'm in the process of moving this stuff into the FourierAnimation class.
// I want to make multiple instances of the animation.
// Multiple on the screen at the same time, each configured slightly differently.
// Currently this function is still in use, not FourierAnimation.
function initialize(options: Options) {
  // Reference path.
  referencePath.setAttribute("d", options.pathString);
  const transform = panAndZoom(
    // TODO this needs to depend on the Destination.
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
  const script = groupTerms({
    addTime: 6250,
    pauseTime: 750,
    maxGroupsToDisplay: options.maxGroupsToDisplay,
    skipCountAtEnd: options.skipCountAtEnd ?? 0,
    terms,
  });
  //scriptEndTime = script.at(-1)!.endTime;
  // Moved!
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

  const background = new Background(options.backgroundSeed);
  (window as any).customBackground = background;

  /**
   *
   * @param time In seconds
   * @param noiseCanvas
   */
  showFrame = (timeInMs: number) => {
    // TODO the comments say seconds but the variable name says ms.
    // Tests suggests that "seconds" is accurate.
    background.draw(timeInMs);
    // background.addDebugText(
    //   `frame #${Math.round((timeInMs / 1000) * 60)} @${(
    //     timeInMs / 1000
    //   ).toFixed(3)} seconds`
    // );
    // Which section of the script applies at this time?
    //const scriptEndTime = script.at(-1)!.endTime;
    //timeInMs %= scriptEndTime;
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

    // Draw the path
    const pathString = timeToPath[index](timeInMs);
    livePath.setAttribute("d", pathString);

    // Update the frequency spinners
    const { usingCircles, addingCircles, startTime, endTime } = script[index];
    const t =
      addingCircles > 0
        ? ((timeInMs - startTime) / (endTime - startTime)) * FULL_CIRCLE
        : 0;
    frequencyBlocks.forEach((frequencyBlock, index) => {
      if (index >= usingCircles + addingCircles) {
        frequencyBlock.top.style.display = "none";
      } else {
        frequencyBlock.top.style.display = "";
        const term = terms[index];
        frequencyBlock.text.innerHTML = term.frequency.toString();
        frequencyBlock.spinner.style.transform = `rotate(${
          t * term.frequency + term.phase + FULL_CIRCLE / 4
        }rad)`;
      }
    });
  };
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
    source: "fourier-smackdown.ts",
    script,
    seconds: 120, // Current runt time 84 seconds.  Leave some extra that I can cut in editing depending how long I talk.
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
 * Dodecahedron vs star.
 *   Inscribed jewish star.
 *   Start from two pictures of the dodecahedron.
 *   One morphs smoothly into the star.
 *   Same exact graph.
 *   The picture is distorted slightly, but as little as possible.
 *
 * Dodecahedron vs dodecahedron
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
  const points5 = initializedArray(5, (n) => {
    const angle = (FULL_CIRCLE * n) / 5 + FULL_CIRCLE / 4;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    return { x, y };
  });
  points5; // TODO save the the 5 and 7 pointed starts in some sensible way.
  // Notice additional code below that hade to change with this.
  // switch (stepsForward) {
  const points = initializedArray(6, (n) => {
    const angle = (FULL_CIRCLE * n) / 6 + FULL_CIRCLE / 4;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    return { x, y };
  });

  const allPaths = [...Progress.getUnique(Progress.getSamples().dodecahedron)];

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

  const requestedIndex = parseIntX(
    new URLSearchParams(window.location.search).get("index")
  );
  const index = requestedIndex ?? (Math.random() * allPaths.length) | 0;

  {
    const chapterText = getById("chapter", SVGTextElement);
    chapterText.innerHTML = `#${index} of ${allPaths.length}`;
  }

  const path = allPaths[index];
  const colors = colorsByIndex[index];
  console.log({ requestedIndex, index, path, ...colors });
  console.log(allPaths);
  livePath.style.stroke = colors.light;
  referencePath.style.stroke = colors.dark;

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

  const pathString = pathBuilder.pathShape.rawPath;
  console.log(pathString);
  initialize({
    maxGroupsToDisplay: 15,
    skipCountAtEnd: 1,
    pathString: pathString,
    destination: Destination.right,
    liveColor: colors.light,
    referenceColor: colors.dark,
    backgroundSeed: index,
  });
}
