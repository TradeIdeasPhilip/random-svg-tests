import {
  AnimationLoop,
  getById,
  querySelector,
  querySelectorAll,
} from "phil-lib/client-misc";
import "./parabola-tangent-line.css";
import {
  assertClass,
  FULL_CIRCLE,
  lerp,
  LinearFunction,
  makeLinear,
  polarToRectangular,
} from "phil-lib/misc";

/**
 * Make the given `<line>` element look like a line that goes on forever in each direction.
 * Make it go past the edges of the screen.
 * @param line Adjust this element.
 * @param x0 x of one point on the line.
 * @param y0 y of one point on the line.
 * @param x1 x of a second point on a line.
 * @param y1 y of a second point on a line.
 */
function lineToBorders(
  line: SVGLineElement,
  x0: number,
  y0: number,
  x1: number,
  y1: number
) {
  // Assume x0,y0 is on the screen for the sake of a simple solution that will work today.
  // x0,y0 will become the center of a line segment that will extend 20 units in each direction.
  // 20 because that's enough to cover the current space with a little to spare.
  const θ = Math.atan2(y1 - y0, x1 - x0);
  const delta = polarToRectangular(20, θ);
  line.x1.baseVal.value = x0 + delta.x;
  line.y1.baseVal.value = y0 + delta.y;
  line.x2.baseVal.value = x0 - delta.x;
  line.y2.baseVal.value = y0 - delta.y;
}

function show(...elements: (SVGElement | HTMLElement)[]) {
  elements.forEach((element) => {
    element.style.display = "";
  });
}

function hide(...elements: (SVGElement | HTMLElement)[]) {
  elements.forEach((element) => {
    element.style.display = "none";
  });
}
/**
 * Use this to simulate precision errors.
 *
 * The values will change continuously with time.
 *
 * The amplitude shows the max distance the function gets from 0.
 * I.e. sin(x) would have an amplitude of 1 with a range between -1 and +1.
 *
 *
 */
type Jiggler = (
  seconds: number,
  amplitude: number
) => { Δx: number; Δy: number };

function makeJigglers(): Jiggler[] {
  const primes = [
    [29, 41],
    [3, 5],
    [37, 7],
    [11, 13],
    [31, 17],
    [19, 23],
    [103, 43],
    [307, 71],
  ];
  const result = primes.map(([rx, ry]) => {
    function jiggler(
      seconds: number,
      amplitude: number
    ): { Δx: number; Δy: number } {
      function jiggler1(r: number) {
        const θ = (seconds * FULL_CIRCLE) / r;
        const result = Math.sin(θ) * amplitude;
        return result;
      }
      return { Δx: jiggler1(rx), Δy: jiggler1(ry) };
    }
    return jiggler;
  });
  return result;
}
const jigglers = makeJigglers();

type Rotator = (seconds: number) => number;

function makeRotator(factor: number): Rotator {
  const amplitude = 10;
  function rotator(seconds: number) {
    const r = Math.sin(seconds * factor) * amplitude;
    return r;
  }
  return rotator;
}

const rotators = [2, Math.E, Math.PI, 2 ** 1.5, 4, 3].map((factor) =>
  makeRotator(factor)
);

class GUI {
  /**
   * The numbers and tick marks along the x axis.
   * I added this scale specifically because it's the most obvious way to show how zoomed in we are.
   */
  readonly #scale = getById("scale", SVGGElement);
  readonly #functionPath = getById("function", SVGPathElement);
  readonly #estimateLine = querySelector("#singleEstimate", SVGLineElement);
  readonly #estimateLines = querySelectorAll(
    "#estimateLines line",
    SVGLineElement
  );
  readonly #marginOfErrorG = querySelector("#margin-of-error", SVGGElement);
  /**
   * (0, 0)
   */
  readonly #fixedCircle: SVGCircleElement;
  /**
   * (x + dx, f(x + dx))
   */
  readonly #movingCircle: SVGCircleElement;
  private addBorders() {
    // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/paint-order
    const originals = querySelectorAll("svg#main text", SVGTextElement);
    originals.forEach((original) => {
      const clone = assertClass(original.cloneNode(true), SVGTextElement);
      clone.classList.add("text-background");
      original.parentElement!.insertBefore(clone, original);
    });
  }
  /**
   * If you want more than one of these, you'll have to create
   * a copy of all the html elements for each instance of this
   * class.
   *
   * That wouldn't be hard, but it's not required today.
   */
  private constructor() {
    [this.#fixedCircle, this.#movingCircle] = querySelectorAll(
      "circle.measurement-fill",
      SVGCircleElement,
      2,
      2
    );
    /**
     * This is set in the css file.
     */
    const strokeWidth = 0.13333333;
    const period = strokeWidth * 2;
    const partitionSize = period / this.#estimateLines.length;
    const dutyCycle = partitionSize * 1.15;
    const recoveryTime = period - dutyCycle;
    if (recoveryTime < 0) {
      throw new Error("wtf");
    }
    const strokeDasharray = `${dutyCycle} ${recoveryTime}`;
    this.#estimateLines.forEach((estimateLine, index) => {
      estimateLine.style.strokeDasharray = strokeDasharray;
      estimateLine.style.strokeDashoffset = (partitionSize * index).toString();
    });
    this.addBorders();
    this.#blurMe = querySelectorAll(".blur-me", SVGTSpanElement, 2, 2);
    this.#shakeMe = querySelectorAll(".shake-me", SVGTextElement, 2, 2);
    this.update();
  }
  readonly #blurMe: readonly SVGTSpanElement[];
  readonly #shakeMe: readonly SVGTextElement[];
  static readonly instance = new GUI();
  #zoom = 1;
  #dx = 2;
  get dx() {
    return this.#dx;
  }
  #timeInSeconds = 0;
  set timeInSeconds(newValue: number) {
    this.#timeInSeconds = newValue;
    this.update();
  }
  get timeInSeconds() {
    return this.#timeInSeconds;
  }
  private update() {
    const x = 0 + this.#dx;
    const mathY = this.f(x);
    const screenY = -mathY;
    const zoom = this.#zoom;
    const cx = x * zoom;
    const cy = screenY * zoom;
    this.#movingCircle.cx.baseVal.value = cx;
    this.#movingCircle.cy.baseVal.value = cy;
    let r: number;
    let fill: string;
    if (this.blurry) {
      show(this.#marginOfErrorG);
      hide(this.#estimateLine);
      show(...this.#estimateLines);
      this.#estimateLines.forEach((estimateLine, index) => {
        const amplitude = (0.013333333 / 4) * this.zoom;
        const from = jigglers[index * 2](this.timeInSeconds, amplitude);
        const to = jigglers[index * 2 + 1](this.timeInSeconds, amplitude);
        lineToBorders(estimateLine, from.Δx, from.Δy, cx + to.Δx, cy + to.Δy);
      });
      r = GUI.initialBlurRadius * Math.sqrt(zoom);
      fill = "url(#measurementBlur)";
      {
        const periodInSeconds = 2;
        const amplitude =
          1 -
          Math.abs(
            Math.cos((this.timeInSeconds * FULL_CIRCLE) / 2 / periodInSeconds)
          );
        const filter = `blur(${amplitude * 0.04}px)`;
        this.#blurMe.forEach((element) => (element.style.filter = filter));
      }
      this.#shakeMe.forEach((element) => {
        const rotations = rotators.map((rotator) =>
          rotator(this.timeInSeconds)
        );
        rotations.push(0);
        const value = rotations.join(" ");
        element.setAttribute("rotate", value);
      });
    } else {
      hide(this.#marginOfErrorG);
      hide(...this.#estimateLines);
      show(this.#estimateLine);
      lineToBorders(this.#estimateLine, 0, 0, cx, cy);
      r = 0.06666666;
      fill = "var(--measurement-color)";
    }
    [this.#fixedCircle, this.#movingCircle].forEach((circle) => {
      circle.r.baseVal.value = r;
      circle.style.fill = fill;
    });
  }
  #blurry = false;
  get blurry() {
    return this.#blurry;
  }
  set blurry(newValue) {
    this.#blurry = newValue;
    this.update();
  }
  set dx(newValue) {
    this.#dx = newValue;
    this.update();
  }
  private updatePath() {
    const zoom = this.#zoom;
    /**
     * This path perfectly describes y=x*x between x=-3 and x=3.
     *
     * Notice that I negated y.
     * In SVG larger y values are drawn lower on the page.
     * In math class and most charts larger y appear higher on the page.
     */
    const d = `path('M ${-3 * zoom} ${-9 * zoom} Q ${0 * zoom} ${9 * zoom} ${
      3 * zoom
    } ${-9 * zoom}')`;
    this.#functionPath.style.d = d;
  }
  /**
   * 1.0 for the default / initial value.
   * Larger to zoom in.
   *
   */
  get zoom() {
    return this.#zoom;
  }
  set zoom(newValue) {
    this.#zoom = newValue;
    this.update();
    this.updatePath();
    this.#scale.style.transform = `scale(${newValue})`;
  }
  /**
   * This is the function that we are graphing.
   */
  f(x: number) {
    return x * x;
  }
  #automaticTime?: AnimationLoop;
  /**
   * Set this to true to automatically and constantly update this.timeInSeconds.
   * That's ideal for watching in realtime.
   * Set this to false (the default) if you want to manually update this.timeInSeconds.
   * That's ideal for recording a video.
   */
  get automaticTime() {
    return !!this.#automaticTime;
  }
  set automaticTime(newValue: boolean) {
    this.#automaticTime?.cancel();
    this.#automaticTime = undefined;
    if (newValue) {
      this.#automaticTime = new AnimationLoop((time: DOMHighResTimeStamp) => {
        if (this.blurry) {
          this.timeInSeconds = time / 1000;
        }
      });
    }
  }
  static readonly initialBlurRadius = 1 / 8;
}

const gui = GUI.instance;

const GLOBAL = window as any;

GLOBAL.GUI = GUI.instance;

// MARK: Script
function makeInterpolator(
  samples: { readonly x: number; readonly y: number }[]
): LinearFunction {
  if (samples.length == 0) {
    return () => {
      throw new Error("empty");
    };
  }
  const firstX = samples[0].x;
  const pieces: { f: LinearFunction; x2: number }[] = [];
  samples.forEach((sample, index) => {
    const nextSample = samples[index + 1];
    if (nextSample === undefined) {
      // last
    } else {
      // not last.
      if (sample.x > nextSample.x) {
        throw new Error("x’s are out of order.");
      }
      if (sample.x < nextSample.x) {
        const x1 = sample.x;
        const y1 = sample.y;
        const x2 = nextSample.x;
        const y2 = nextSample.y;
        // makeLinear() does not currently work if x1 == -Infinity or x2 == Infinity.
        // Those cases allow us to return a y for every x.
        const f = y1 == y2 ? () => y1 : makeLinear(x1, y1, x2, y2);
        pieces.push({ f, x2 });
      }
    }
  });
  const result = (x: number) => {
    if (x < firstX) {
      throw new Error("x is too small");
    }
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      if (x <= piece.x2) {
        return piece.f(x);
      }
    }
    throw new Error("x is too big");
  };
  return result;
}

const T_OFFSET = 22.5;
const T_start = 22.5 - T_OFFSET;
const T_fuzzyStart = 33.5 - T_OFFSET;
const T_unlessYouGetTooClose = 54.5 - T_OFFSET;
const T_end = 60 + 22 - T_OFFSET;

const getDx = makeInterpolator([
  { x: T_start, y: 2 },
  { x: lerp(T_start, T_fuzzyStart, 0.15), y: Math.sqrt(3) },
  { x: lerp(T_start, T_fuzzyStart, 0.3), y: Math.sqrt(2) },
  { x: lerp(T_start, T_fuzzyStart, 0.45), y: 1 },
  { x: lerp(T_start, T_fuzzyStart, 0.95), y: 0.005 },
  { x: T_fuzzyStart, y: 0.005 },
  { x: T_fuzzyStart, y: 2 },
  { x: lerp(T_fuzzyStart, T_unlessYouGetTooClose, 0.15), y: Math.sqrt(3) },
  { x: lerp(T_fuzzyStart, T_unlessYouGetTooClose, 0.3), y: Math.sqrt(2) },
  { x: lerp(T_fuzzyStart, T_unlessYouGetTooClose, 0.45), y: 1 },
  { x: lerp(T_fuzzyStart, T_unlessYouGetTooClose, 0.95), y: 0.1 },
  { x: T_unlessYouGetTooClose, y: 0.1 },
  { x: lerp(T_unlessYouGetTooClose, T_end, 0.25), y: 0.1 },
  { x: lerp(T_unlessYouGetTooClose, T_end, 0.5), y: 0.05 },
  { x: lerp(T_unlessYouGetTooClose, T_end, 0.75), y: 0.005 },
  { x: T_end, y: 0.005 },
]);
const getZoom = makeInterpolator([
  { x: T_start, y: 1 },
  { x: lerp(T_start, T_fuzzyStart, 0.55), y: 1 },
  { x: lerp(T_start, T_fuzzyStart, 0.85), y: 6 },
  { x: T_fuzzyStart, y: 6 },
  { x: T_fuzzyStart, y: 1 },
  { x: lerp(T_fuzzyStart, T_unlessYouGetTooClose, 0.55), y: 1 },
  { x: lerp(T_fuzzyStart, T_unlessYouGetTooClose, 0.85), y: 6 },
  { x: T_unlessYouGetTooClose, y: 6 },
  { x: lerp(T_unlessYouGetTooClose, T_end, 0.3), y: 32 },
  { x: T_end, y: 32 },
]);

function showFrame(timeInSeconds: number) {
  gui.timeInSeconds = timeInSeconds - T_fuzzyStart;
  gui.blurry = timeInSeconds >= T_fuzzyStart;
  gui.dx = getDx(timeInSeconds);
  gui.zoom = getZoom(timeInSeconds);
}

let realtimeAnimation: AnimationLoop | undefined;

function stopRealtimeAnimation() {
  realtimeAnimation?.cancel();
}

function startRealtimeAnimation() {
  gui.automaticTime = false;
  stopRealtimeAnimation();
  let startTime: DOMHighResTimeStamp | undefined;
  const animation = new AnimationLoop((time: DOMHighResTimeStamp) => {
    startTime ??= time;
    const timePassed = time - startTime;
    const timeInSeconds = timePassed / 1000;
    if (timeInSeconds > T_end) {
      animation.cancel();
    } else {
      showFrame(timeInSeconds);
    }
  });
  realtimeAnimation = animation;
}

getById("start", HTMLButtonElement).addEventListener(
  "click",
  startRealtimeAnimation
);
getById("stop", HTMLButtonElement).addEventListener(
  "click",
  stopRealtimeAnimation
);

GLOBAL.startRealtimeAnimation = startRealtimeAnimation;

function initScreenCapture(script: unknown) {
  document
    .querySelectorAll("[data-hideBeforeScreenshot]")
    .forEach((element) => {
      if (!(element instanceof SVGElement || element instanceof HTMLElement)) {
        throw new Error("wtf");
      }
      element.style.display = "none";
    });
  gui.automaticTime = false;
  return {
    source: "parabola-tangent-line.ts",
    script,
    seconds: T_end - T_start,
  };
}

GLOBAL.initScreenCapture = initScreenCapture;
GLOBAL.showFrame = showFrame;

/**
 * Next:
 * 0:22:30
 * Start far away from the inner point and quickly move toward it to show
 * the estimate getting better.
 * Approach 0 at an exponentially decreasing rate.
 * No blurriness or zooming yet.
 * 0:33:30 - But in the real world
 * Reset the drawing,
 * start animating the lines to show the margin of error.
 * Draw 3 or so lines, each based on the two points.
 * The error at each point for each line will be some continuous noise function.
 * The speed and character of the noise is constant, even when the points slow down or stop.
 * Initially things are similar to the first run, with the 3 lines almost perfectly overlapping.
 * As the points get closer the errors become more obvious.
 * Eventually we start zooming in.
 * The shape of the parabola is changing as we zoom in.
 * The position of the center of both points stop moving.  (The y of the x+dx point will change to match the path)
 * The size of the cloud around each point is growing as we zoom in.
 * The stroke-width of the lines and the parabola stay the same as we zoom in.
 * Shortly after the clouds start to overlap, stop moving the closer,
 * or at least slow down tremendously so it's obvious how wildly the lines are swinging around.
 *
 * 0:33:30 - But in the real world
 * 1:11:00 - 1:20:15 If you try to push the limit, it is fuzzy.
 * 1:25:00 - 1:43:30 If you really want to push the limits you need a better approach. ... more smarter math.
 * 1:43:30 - My solution was so simple.
 * 2:04:00 - 2:23:29 Let's take a closer look. ...  ... a second sample twice as far away.
 * 2:25:09-ish and I wanted to know the value at 0
 * 2:37:36 -  so all I did was extrapolate
 * 2:47:00 - so, why does this work so well?  ... was linear now quadratic
 * 3:09:11 - imagine a taylor expansion
 *
 * 1:43:30 - 2:47:00 So my new solution.  D(f, x0, dx)  Use a lot of real code.
 *
 * I need to match the new video content to the voiceover found here:
 * https://www.youtube.com/watch?v=qzbga-c3mk0
 * "better derivative, longer voiceover"
 *
 */

// I used this to create #measurementBlur:
// /**
//  * A bell curve scaled so that the max value is 1.
//  * @param x Number of standard deviations from the norm.
//  * @returns A value between 1 and 0
//  */
// function bellIsh(x: number) {
//   return Math.exp(-x * x);
// }
// const bellCurveData = Array.from(count(0, 2.41, 0.4), (i) => bellIsh(i));
// console.log(bellCurveData);

// MARK: Tools

function mouseEventToUserSpace(
  event: MouseEvent,
  element?: SVGGraphicsElement
) {
  const mousePoint = new DOMPointReadOnly(event.clientX, event.clientY);
  element ??= event.target as SVGGraphicsElement;
  const matrix = element.getScreenCTM()!.inverse();
  const userSpacePoint = mousePoint.matrixTransform(matrix);
  return { x: userSpacePoint.x, y: userSpacePoint.y };
}

function addTools(svgElement: SVGSVGElement) {
  let lastDown = { x: 0, y: 0 };
  svgElement.addEventListener("pointerdown", (event) => {
    lastDown = mouseEventToUserSpace(event);
    const target = event.target as SVGGraphicsElement;
    target.setPointerCapture(event.pointerId);
    console.log(lastDown, target);
  });
  svgElement.addEventListener("lostpointercapture", (event) => {
    const endPoint = mouseEventToUserSpace(event);
    const dx = endPoint.x - lastDown.x;
    const dy = endPoint.y - lastDown.y;
    if (dx != 0 || dy != 0) {
      console.log({ ...endPoint, dx, dy });
    }
  });
}

querySelectorAll("svg", SVGSVGElement).forEach((svgElement) =>
  addTools(svgElement)
);

/*

Input:
f(x)= c₀ + c₁•x + c₂•x² + c₃•x³ + ... 

Desired output:
f′(x) = c₁ + 2•c₂•x + 3•c₃•x² + ...


f(x+dx) = c₀ + c₁•(x+dx) + c₂•(x+dx)² + c₃•(x+dx)³ + ... 
= c₀ + c₁•x + c₁•dx + c₂•x² + 2•c₂•x•dx + c₂•dx² + c₃•x³ + 3•c₃•x²•dx + 3•c₃•x•dx² + c₃•dx³ + ...


Simple algorithm's output:
( f(x+dx) - f(x) ) ÷ dx =
(c₀ + c₁•x + c₁•dx + c₂•x² + 2•c₂•x•dx + c₂•dx² + c₃•x³ + 3•c₃•x²•dx + 3•c₃•x•dx² + c₃•dx³ - (c₀ + c₁•x + c₂•x² + c₃•x³) + ...) ÷ dx =
c₁ + 2•c₂•x + c₂•dx  + 3•c₃•x² + 3•c₃•x•dx + c₃•dx²  + ... 

Simple algorithm's error:
error = 
(output) - (Desired output) =
c₁ + 2•c₂•x + c₂•dx  + 3•c₃•x² + 3•c₃•x•dx + c₃•dx² - (c₁ + 2•c₂•x + 3•c₃•x²) + ... =
c₂•dx  + 3•c₃•x•dx + c₃•dx² + ...


New and improved algorithm:

simple algorithm applied to 2dx: c₁ + 2•c₂•x + 2•c₂•dx  + 3•c₃•x² + 6•c₃•x•dx + 4•c₃•dx²  + ... 

Extrapolate to get new and improved output: 2•(near estimate) - (far estimate)
2•(c₁ + 2•c₂•x + c₂•dx  + 3•c₃•x² + 3•c₃•x•dx + c₃•dx²) - (c₁ + 2•c₂•x + 2•c₂•dx  + 3•c₃•x² + 6•c₃•x•dx + 4•c₃•dx²) + ... 
c₁ + 2•c₂•x+ 3•c₃•x² - 2•c₃•dx² + ...





*/
