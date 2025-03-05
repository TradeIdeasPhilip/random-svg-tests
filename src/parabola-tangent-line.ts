import { getById } from "phil-lib/client-misc";
import "./parabola-tangent-line.css";
import { selectorQuery, selectorQueryAll } from "./utility";
import { assertClass, count, polarToRectangular } from "phil-lib/misc";

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

class GUI {
  readonly #scale = getById("scale", SVGGElement);
  readonly #functionPath = getById("function", SVGPathElement);
  readonly #estimateLine = selectorQuery("#singleEstimate", SVGLineElement);
  readonly #estimateLines = selectorQueryAll(
    "#estimateLines line",
    SVGLineElement
  );
  readonly #fixedCircle: SVGCircleElement;
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
  private constructor() {
    [this.#fixedCircle, this.#movingCircle] = selectorQueryAll(
      "circle.measurement-fill",
      SVGCircleElement,
      2,
      2
    );
    const period = 0.13333333 * 2;
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
      /**
       * TODO this should be based on the frame number or time.
       * It should change smoothly over time.
       * @returns A small random value to add to the x or y.
       */
      function bump() {
        const c = 0.13333333 / 5;
        return (Math.random() * c - c / 2) * zoom;
      }
      hide(this.#estimateLine);
      show(...this.#estimateLines);
      this.#estimateLines.forEach((estimateLine) => {
        lineToBorders(estimateLine, bump(), bump(), cx + bump(), cy + bump());
      });
      r = GUI.initialBlurRadius * zoom;
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
  get zoom() {
    return this.#zoom;
  }
  set zoom(newValue) {
    this.#zoom = newValue;
    this.update();
    this.updatePath();
    this.#scale.style.transform = `scale(${newValue})`;
  }
  f(x: number) {
    return x * x;
  }
  static readonly maxBlurRadius = 2.5;
  static readonly initialBlurRadius = 0.25;
}

(window as any).GUI = GUI.instance;

/**
 * Next:
 *
 * 0:25:16 - 1:43:30 for the whole list:
 * 1) Start from the intro demo
 * 2) initially two fairly small circles for the inputs.
 * 3) The circles are exactly the same size as the line, and drawn on top.
 * 4) At some point the circles get bigger and get fuzzy edges.
 * 5) The line is replaced my multiple lines spread out to show multiple possible lines that go through both circles.
 * 6) Use repeatable randomness to pick points from anywhere in the possible range.
 * 7) The line can be blurry or partially transparent.
 * 8) The closer the line was to the center of each point, the sharper the line will be.
 * 9) The line's blurriness will be based on the worst of the two points.
 * 10) The line will always be at least somewhat visible, even if the line crossed though the most transparent edge of the point.
 * 11) Get rid of the % precision issues thing.  (I don't want to try to sync that with the rest of this demo.)
 * 12) Eventually move the points close together and slowly move from almost touching to largely overlapping.
 *
 * Use a parabola for the function, y=x*x.
 * the point we care about is y′(0) = 0.
 * Draw a J shape, with a little bit to the left of x=0 just for context.
 * One point will be fixed at x=0.
 * dx will always be positive, so the second point will always be on the left,
 * like in my previous semi circle demo, but focused on the bottom of the path.
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
 */

// I used this to create #measurementBlur
/**
 * A bell curve scaled so that the max value is 1.
 * @param x Number of standard deviations from the norm.
 * @returns A value between 1 and 0
 */
function bellIsh(x: number) {
  return Math.exp(-x * x);
}
const bellCurveData = Array.from(count(0, 2.41, 0.4), (i) => bellIsh(i));
console.log(bellCurveData);
