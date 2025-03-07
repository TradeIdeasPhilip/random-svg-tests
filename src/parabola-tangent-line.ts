import { AnimationLoop, getById } from "phil-lib/client-misc";
import "./parabola-tangent-line.css";
import { selectorQuery, selectorQueryAll } from "./utility";
import { assertClass, FULL_CIRCLE, polarToRectangular } from "phil-lib/misc";

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

class GUI {
  /**
   * The numbers and tick marks along the x axis.
   * I added this scale specifically because it's the most obvious way to show how zoomed in we are.
   */
  readonly #scale = getById("scale", SVGGElement);
  readonly #functionPath = getById("function", SVGPathElement);
  readonly #estimateLine = selectorQuery("#singleEstimate", SVGLineElement);
  readonly #estimateLines = selectorQueryAll(
    "#estimateLines line",
    SVGLineElement
  );
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
    const originals = selectorQueryAll("svg#main text", SVGTextElement);
    originals.forEach((original) => {
      const clone = assertClass(original.cloneNode(true), SVGTextElement);
      clone.classList.add("scale-background");
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
    [this.#fixedCircle, this.#movingCircle] = selectorQueryAll(
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
    const dutyCycle = period / this.#estimateLines.length;
    const strokeDasharray = `${dutyCycle} ${period - dutyCycle}`;
    this.#estimateLines.forEach((estimateLine, index) => {
      estimateLine.style.strokeDasharray = strokeDasharray;
      estimateLine.style.strokeDashoffset = (dutyCycle * index).toString();
    });
    this.addBorders();
    this.update();
  }
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
      hide(this.#estimateLine);
      show(...this.#estimateLines);
      this.#estimateLines.forEach((estimateLine, index) => {
        const amplitude = 0.013333333 * this.zoom;
        const from = jigglers[index * 2](this.timeInSeconds, amplitude);
        const to = jigglers[index * 2 + 1](this.timeInSeconds, amplitude);
        lineToBorders(estimateLine, from.Δx, from.Δy, cx + to.Δx, cy + to.Δy);
      });
      r = GUI.initialBlurRadius * Math.sqrt(zoom);
      fill = "url(#measurementBlur)";
    } else {
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
  static readonly initialBlurRadius = 0.25;
}

(window as any).GUI = GUI.instance;

/**
 * Next:
 *
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
 * margin of error in the legend will have a triple image of each letter.
 * The letters will move independently.
 * The animation will mostly focus on being readable, but with some extremes to show when it's not.
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
 * End at or around GUI.dx=0.025.  
 * That looks great with fuzzy=true and zoom = 20;
 * dx = 0.05 is much different.  That would even be a good place to pause.
 * 0.025 sometimes allows a complete circle!  Smaller might do a lot of circles.
 * zoom=50 works well with dx=0.025
 * 
 * The un-fuzzy (first) version can stop at zoom=50 and GUI.dx=0.005
 * This barely shows any change in the line, but something is visible.
 * dx=0.001 makes the line completely flat.
 * dx=0.01 would also be a reasonable place to stop or at least slow down.

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
