import { AnimationLoop, getById } from "phil-lib/client-misc";
import "./style.css";
import "./complex-fourier-series.css";
import { ParametricFunction, PathShape, Point, QCommand } from "./path-shape";
import {
  makeTSplitter,
  makeTSplitterA,
  Random,
  selectorQuery,
  selectorQueryAll,
} from "./utility";
import { assertClass, FIGURE_SPACE, lerp, makeLinear } from "phil-lib/misc";
import { fft } from "fft-js";
import { lerpPoints } from "./math-to-path";
import { cursiveLetters, futuraLLetters } from "./hershey-fonts/hershey-fonts";

interface FourierTerm {
  frequency: number;
  amplitude: number;
  phase: number;
}

type Complex = [number, number];

function parametricToFourier(
  func: ParametricFunction,
  numSamples: number = 1024
): FourierTerm[] {
  if (Math.log2(numSamples) % 1 !== 0) {
    throw new Error("numSamples must be a power of 2");
  }
  const samples: Complex[] = [];
  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    const point = func(t);
    samples.push([point.x, point.y]);
  }
  const phasors = fft(samples);
  const terms: FourierTerm[] = [];
  for (let k = 0; k < numSamples; k++) {
    const [real, imag] = phasors[k];
    const amplitude = Math.sqrt(real * real + imag * imag) / numSamples;
    const phase = Math.atan2(imag, real);
    const frequency = k <= numSamples / 2 ? k : k - numSamples; // Map k > N/2 to negative
    terms.push({ frequency, amplitude, phase });
  }
  // Sort by amplitude, descending
  terms.sort((a, b) => b.amplitude - a.amplitude);
  return terms;
}

function termsToParametricFunction(
  terms: FourierTerm[],
  numTerms: number
): ParametricFunction {
  return (t: number): Point => {
    let x = 0,
      y = 0;
    for (let k = 0; k < Math.min(numTerms, terms.length); k++) {
      const { frequency, amplitude, phase } = terms[k];
      const angle = 2 * Math.PI * frequency * t + phase;
      x += amplitude * Math.cos(angle);
      y += amplitude * Math.sin(angle);
    }
    return { x, y };
  };
}

function keepNonZeroTerms(terms: readonly FourierTerm[]): FourierTerm[] {
  let sum = 0;
  terms.forEach((term) => (sum += term.amplitude));
  const cutoff = sum / 1e7;
  const result = terms.filter((term) => term.amplitude > cutoff);
  let newSum = 0;
  result.forEach((term) => (newSum += term.amplitude));
  return result;
}

const sampleCount = 200;

const goButton = getById("go", HTMLButtonElement);
const sourceTextArea = getById("source", HTMLTextAreaElement);
const sampleCodeSelect = getById("sampleCode", HTMLSelectElement);

const codeSamples: ReadonlyArray<{
  readonly name: string;
  code: string;
  default?: true;
}> = [
  { name: "Custom", code: "" },
  {
    name: "Polygons and Stars",
    code: `const numberOfPoints = 5;
/**
 * 0 to make a polygon.
 * 1 to make a star, if numberOfPoints is odd and at least 5.
 * 2 to make a different star, if numberOfPoints is odd and at least 7.
 */ 
const skip = 1;
const rotate = 2 * Math.PI / numberOfPoints * (1 + skip);

/**
 * Create a random number generator.
 * Change the seed to get different values.
 * random() will return a number between 0 and 1.
 */
const random = support.random("My seed 2025");

/**
 * How much effect does the random number generator have.
 * Far left → no randomness at all.
 */
const amplitude = support.input(0);

function jiggle() {
  return (random()-0.5) * amplitude;
}

const corners = [];
for (let i = 0; i < numberOfPoints; i++) {
  const θ = i * rotate;
  corners.push({x: Math.cos(θ) + jiggle(), y: Math.sin(θ) + jiggle()});
}
//console.log(corners);
const tSplitter = support.makeTSplitterA(0, corners.length, 0);
function f(t) {
  const segment = tSplitter(t);
  return support.lerpPoints(corners[segment.index], corners[(segment.index+1)%corners.length], segment.t);
}`,
  },
  {
    name: "Square",
    default: true,
    code: `const corners = [{x: -0.5, y: -0.5}, {x: 0.5, y: -0.5}, {x: 0.5, y: 0.5}, {x: -0.5, y: 0.5} ];
const tSplitter = support.makeTSplitterA(0, corners.length, 0);
function f(t) {
  const segment = tSplitter(t);
  return support.lerpPoints(corners[segment.index], corners[(segment.index+1)%corners.length], segment.t);
}`,
  },
  {
    name: "Square with Easing",
    code: `const corners = [{x: -0.5, y: -0.5}, {x: 0.5, y: -0.5}, {x: 0.5, y: 0.5}, {x: -0.5, y: 0.5} ];
const tSplitter = support.makeTSplitterA(0, corners.length, 0);
function f(t) {
  const segment = tSplitter(t);
  return support.lerpPoints(corners[segment.index], corners[(segment.index+1)%corners.length], support.ease(segment.t));
}`,
  },
  {
    name: "SVG Path",
    code: `// Also consider support.samples.hilbert[0] ... support.samples.hilbert[3]
//   and support.samples.peanocurve[0] ... support.samples.peanocurve[2] 
support.referencePath.d = support.samples.likeShareAndSubscribe;
const length = support.referencePath.length;
console.log({length});
function f(t) {
  // Copy the path as is.
  return support.referencePath.getPoint(t * length);
}`,
  },
  {
    name: "Simple Ellipse",
    code: `// The height can be anything convenient to you.
// This software will automatically zoom and pan to show off your work.
const height = 1;
// Use the first slider to change the width of the ellipse.
const width = height * support.input(0) * 2;
function f(t) {
// Use the second slider to change the starting point on the ellipse.
// This doesn't matter in a static ellipse, but it can be important in some animations and other special cases.
const angle = (t + support.input(1)) * 2 * Math.PI;
const x = width * Math.cos(angle);
const y = height * Math.sin(angle);
return {x, y};}`,
  },
  {
    name: "Circle with Wavy Edge",
    code: `const height = 1;
const width = height;
function f(t) {
const angle = t * 2 * Math.PI;
const adjustmentAngle = angle * 8;
const adjustmentFactor = Math.sin(adjustmentAngle)/10+1;
const x = width * Math.cos(angle) * adjustmentFactor;
const y = height * Math.sin(angle) * adjustmentFactor;
return {x, y};}`,
  },
  {
    name: "Lissajous Curves",
    code: `const a = 1; // Amplitude in x-direction
const b = 1; // Amplitude in y-direction
const freqX = 3; // Frequency in x-direction
const freqY = 2; // Frequency in y-direction
const phase = Math.PI / 2; // Phase difference
function f(t) {
const angle = t * 2 * Math.PI;
const x = a * Math.sin(freqX * angle + phase);
const y = b * Math.sin(freqY * angle);
return {x, y};}`,
  },
  {
    name: "Hypocycloid / Astroid",
    code: `const R = 1; // Radius of the large circle
const r = R / 4; // Radius of the small circle (astroid case)
function f(t) {
const angle = t * 2 * Math.PI;
const x = (R - r) * Math.cos(angle) + r * Math.cos((R - r) / r * angle);
const y = (R - r) * Math.sin(angle) - r * Math.sin((R - r) / r * angle);
return {x, y};}`,
  },
  {
    name: "Bell Curve",
    code: `// Number of standard deviations in each direction:
const right = support.input(0) * 5;
const left = - right;
const width = right - left;
const height = support.input(1) * 4 + 1;
function f(t) {
const x = t * width + left;
// Negate this.
// This program works with normal graphics notation where lower values of y are higher on the display.
// Normal algebra-class graphs show lower values of y lower on the screen.
const y = - height * Math.exp(-x*x);
return {x, y};}`,
  },
  {
    name: "Archimedean Spiral with Oscillation",
    code: `const scale = 1; // Overall scale of the spiral
const turns = 3; // Number of full rotations
const waveFreq = 10; // Frequency of the oscillation
const waveAmp = 0.1; // Amplitude of the oscillation
function f(t) {
const angle = t * 2 * Math.PI * turns;
const radius = scale * t; // Linear growth for Archimedean spiral
const wave = waveAmp * Math.sin(t * 2 * Math.PI * waveFreq);
const x = radius * Math.cos(angle) * (1 + wave);
const y = radius * Math.sin(angle) * (1 + wave);
return {x, y};}`,
  },
  {
    name: "Heart Curve ♡",
    code: `function f(t) {
const angle = t * 2 * Math.PI;
const x = 16 * Math.pow(Math.sin(angle), 3);
const algebraClassY = (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
const y = - algebraClassY;
return {x, y};}`,
  },
  {
    name: "Butterfly Curve",
    code: `const scale = 0.2;
function f(t) {
const angle = t * 24 * Math.PI * support.input(0); // More rotations for complexity
const e = Math.exp(1);
const x = scale * Math.sin(angle) * (e ** Math.cos(angle) - 2 * Math.cos(4 * angle) - Math.pow(Math.sin(angle / 12), 5));
const y = - scale * Math.cos(angle) * (e ** Math.cos(angle) - 2 * Math.cos(4 * angle) - Math.pow(Math.sin(angle / 12), 5));
return {x, y};}`,
  },
  {
    name: "Hollow Star ☆",
    code: `const scale = 1; // Overall scale of the star
const points = 5; // Number of star points
const innerRadius = 0.4; // Radius of the inner points (controls star shape)
const roundness = 0.1; // Amplitude of the oscillation for rounding
function f(t) {
const angle = t * 2 * Math.PI; // Full circle
const starAngle = angle * points; // Angle scaled for 5 points
const radius = scale * (1 - innerRadius * (Math.cos(starAngle) + 1) / 2); // Base star shape
const rounding = roundness * Math.sin(starAngle); // Oscillation for rounding
const x = (radius + rounding) * Math.cos(angle);
const y = (radius + rounding) * Math.sin(angle);
return {x, y};}
// According to Wikipedia, if it's hollow inside, it's a star.
// If you can see the lines crossing each other, it's a pentagram.`,
  },
  {
    name: "Rotating Ellipse",
    code: `const r1 = 0.5; // Short radius of the ellipse
const r2 = 1.0; // Long radius of the ellipse
const phase = support.input(0) * Math.PI; // First slider: Rotation angle in radians (0 to π)
function f(t) {
const angle = t * 2 * Math.PI; // Full circle

// Basic ellipse centered at the origin
const xEllipse = r1 * Math.cos(angle);
const yEllipse = r2 * Math.sin(angle);

// Rotate the ellipse by the phase angle
const x = xEllipse * Math.cos(phase) - yEllipse * Math.sin(phase);
const y = xEllipse * Math.sin(phase) + yEllipse * Math.cos(phase);
return {x, y};}
// I used this formula as a starting place for the rounded pentagram.`,
  },
  {
    name: "Rounded Pentagram ⛤, Heptagram, etc.",
    code: `const r1 = 0.5 * support.input(0); // Short radius of the ellipse. Top slider will adjust it.
const r2 = 1.0; // Long radius of the ellipse
function f(t) {
const phase = Math.PI * t; // The reference ellipse will make one half complete rotation during the tracing process.
const numberOfTrips = support.input(1) * 10;  // Effective range is 0 to 10 
const angle = t * 2 * Math.PI * numberOfTrips; // Basic ellipse centered at the origin
const xEllipse = r1 * Math.cos(angle);
const yEllipse = r2 * Math.sin(angle);// Rotate the ellipse by the phase angle
const x = xEllipse * Math.cos(phase) - yEllipse * Math.sin(phase);
const y = xEllipse * Math.sin(phase) + yEllipse * Math.cos(phase);
return {x, y};}
// The top slider controls the amount of curvature in the output.
// The second slider controls the number of lobes.
// Try values like 0.05, 0.15, 0.25, …, 0.95 for closed shapes.`,
  },
  {
    name: "Squaring the Circle",
    code: `// This will trace out the shape of a dog tag using epicycles.
// Use the first slider to choose how many circles to use in
// this approximation, from 1 to 20.

// I was originally trying to use epicycles to create a square.
// But I ran into some problems,
// so this a square where two of the sides bulge out some.

const numberOfCircles = 1 + 19 * support.input(0);
const circlesToConsider = Math.ceil(numberOfCircles);
const attenuation = numberOfCircles - Math.floor(numberOfCircles);
function f(t) {
let x = 0;
let y = 0;
for (let k = 0; k < circlesToConsider; k++) {
  const n = 2 * k + 1; // Odd frequencies: 1, 3, 5, ...
  const radius = (4 * Math.sqrt(2)) / (Math.PI * Math.PI * n * n);
  const phase = k % 2 === 0 ? -Math.PI / 4 : Math.PI / 4;
  const factor = (k === circlesToConsider - 1 && attenuation > 0) ? attenuation : 1;
  const baseAngle = t * 2 * Math.PI;
  x += factor * radius * Math.cos(n * baseAngle + phase);
  y += factor * radius * Math.sin(n * baseAngle + phase);
}
return {x, y};}`,
  },
  {
    name: "A Better Square",
    code: `// Inspired by https://www.youtube.com/watch?v=t99CmgJAXbg
// Square Orbits Part 1: Moon Orbits

const R = 0.573; // Match our first circle's radius
const moonRadius = (7 / 45) * R;
function f(t) {
const planetAngle = t * 2 * Math.PI; // Frequency 1
const moonAngle = -3 * planetAngle; // Frequency 3, opposite direction
const planetX = R * Math.cos(planetAngle);
const planetY = R * Math.sin(planetAngle);
const moonX = moonRadius * Math.cos(moonAngle);
const moonY = moonRadius * Math.sin(moonAngle);
const x = (planetX + moonX) * 1.2;
const y = (planetY + moonY) * 1.2;
return {x, y};}`,
  },
  {
    name: "Fourier square wave",
    code: `// Use the first slider to choose how many sine waves to use in
// this approximation, from 1 to 20.

const numberOfCircles = 1 + 19 * support.input(0);
const circlesToConsider = Math.ceil(numberOfCircles);
const attenuation = numberOfCircles - Math.floor(numberOfCircles);
function f(t) {
let ySum = 0;
for (let k = 0; k < circlesToConsider; k++) {
  const n = 2 * k + 1; // Odd frequencies: 1, 3, 5, ...
  const amplitude = (4 / Math.PI) / n;
  const factor = (k === circlesToConsider - 1 && attenuation > 0) ? attenuation : 1;
  const baseAngle = 2 * Math.PI * 2.5 * t + Math.PI / 2; // 2.5 cycles, shift for vertical center
  ySum += factor * amplitude * Math.sin(n * baseAngle);
}
const x = (t * 5) - 2.5; // Span x from -2.5 to 2.5
const y = ySum;
return {x, y};}`,
  },
];

function panAndZoom(showThis: SVGGraphicsElement, inHere: SVGSVGElement) {
  const bBox = showThis.getBBox();
  const to = inHere.viewBox.baseVal;
  to.x = bBox.x;
  to.y = bBox.y;
  to.width = bBox.width;
  to.height = bBox.height;
  const aspectRatio = bBox.width / bBox.height;
  /**
   * Arbitrary base height in pixels.
   *
   * See https://github.com/TradeIdeasPhilip/random-svg-tests/blob/master/svg-for-programmers.md#1-aspect-ratio-and-sizing-issues
   * to understand why this is required.
   */
  const intrinsicHeight = 300;
  const intrinsicWidth = intrinsicHeight * aspectRatio;
  inHere.style.height = intrinsicHeight + "px";
  inHere.style.width = intrinsicWidth + "px";
  /**
   * We have picked an arbitrary scale based on the current formula.
   * And that formula can change drastically at any time.
   *
   * So, how do we add objects (text, arrows, outlines) that will be visible when displayed at the formula's scale?
   * This is a good value for a stroke-width for a "normal" stroke.
   * If you want to make a thin or thick stroke, try a stroke-width of ½ this or 2× this, respectively.
   */
  const recommendedStrokeWidth = Math.max(to.width, to.height) / 100;
  inHere.style.setProperty(
    "--recommended-stroke-width",
    recommendedStrokeWidth.toString()
  );
  return { recommendedStrokeWidth };
}

/**
 * This is a wrapper around an `SVGPathElement`.
 *
 * You cannot call `getPointAtLength()` or `getTotalLength()` on a `<path>` object without doing some extra work.
 */
class PathWrapper {
  /**
   * The path needs to be attached to an SVG and both need to be visible,
   * Otherwise a call to `this.length` or `this.getPoint()` will return incorrect values.
   */
  readonly #svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  readonly #path = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  constructor() {
    this.#svg.style.width = "0";
    this.#svg.style.height = "0";
    this.#svg.appendChild(this.#path);
    document.body.appendChild(this.#svg);
  }
  get d(): string {
    return this.#path.getAttribute("d") ?? "";
  }
  /**
   * Read or set the value of the `d` attribute of the path.
   *
   * The default value is "".
   *
   * Attempting to set `d` to an invalid value with throw an `Error`.
   * The value of `d` will remain unchanged.
   */
  set d(newValue: string) {
    this.#path.style.d = "";
    this.#path.style.d = PathShape.cssifyPath(newValue);
    /**
     * Error checking is complicated.
     * If you set the d attribute to a bad value it will print an error message on the console, but it will not report anything to the program.
     * The attribute will be set to the bad value.
     * Attempting to call `this.length` or `this.getPoint()` will throw an error.
     * If you set the d style property to a bad value, nothing will be reported, but the property value will not change.
     * On success,the new value will change, but **not** necessarily to an exact copy of the requested value.
     */
    const success = this.#path.style.d != "";
    this.#path.style.d = "";
    if (success) {
      this.#path.setAttribute("d", newValue);
    } else {
      throw new Error("Invalid path");
    }
  }
  /**
   * Returns true if this is in the default state, `d == ""`.
   */
  get empty() {
    return this.d == "";
  }
  /**
   * Returns this to the default state, `d == ""`.
   */
  clear() {
    this.d = "";
  }
  /**
   * Returns the length of the path.  0 for an empty path.
   */
  get length() {
    return this.#path.getTotalLength();
  }
  /**
   * Find a point along the path.
   * @param distance 0 for the start of the path.
   * this.length for the end of the path.
   * Values below 0 return the start of the path.
   * Values above this.length return the end of the path.
   * @returns The point at `distance` from the start of the path.
   */
  getPoint(distance: number) {
    return this.#path.getPointAtLength(distance);
  }
}

(window as any).pathWrapper = new PathWrapper();

class AnimateDistanceVsT {
  static readonly #instance = new this();
  readonly #svgElement = getById("distanceVsT", SVGSVGElement);
  readonly #distanceCircle = selectorQuery(
    "circle[data-distance]",
    SVGCircleElement,
    this.#svgElement
  );
  readonly #pathElement = selectorQuery(
    "path",
    SVGPathElement,
    this.#svgElement
  );
  readonly #tCircle = selectorQuery("circle[data-t]", SVGCircleElement);
  private constructor() {
    new AnimationLoop((time) => {
      this.#distanceCircle.style.display = "none";
      this.#tCircle.style.display = "none";
      if (this.f) {
        const period = 5000;
        time %= period;
        const t = time / period;
        const percent = t * 100;
        this.#distanceCircle.style.offsetDistance = percent + "%";
        this.#distanceCircle.style.display = "";
        const { x, y } = this.f(t);
        this.#tCircle.cx.baseVal.value = x;
        this.#tCircle.cy.baseVal.value = y;
        this.#tCircle.style.display = "";
      }
    });
  }
  private f: ParametricFunction | undefined;
  private update(f: ParametricFunction, referencePath: string) {
    this.#pathElement.setAttribute("d", referencePath);
    panAndZoom(this.#pathElement, this.#svgElement);
    this.f = f;
    this.#distanceCircle.style.offsetPath = PathShape.cssifyPath(referencePath);
  }
  static update(f: ParametricFunction, referencePath: string) {
    this.#instance.update(f, referencePath);
  }
}

class AnimateRequestedVsReconstructed {
  static readonly #instance = new this();
  readonly #svgElement = getById("requestedVsReconstructed", SVGSVGElement);
  readonly #requestedPath: SVGPathElement;
  readonly #reconstructedPath: SVGPathElement;
  readonly #usingCircles = selectorQuery(
    "[data-using] [data-circles]",
    HTMLTableCellElement
  );
  readonly #usingAmplitude = selectorQuery(
    "[data-using] [data-amplitude]",
    HTMLTableCellElement
  );
  readonly #addingCircles = selectorQuery(
    "[data-adding] [data-circles]",
    HTMLTableCellElement
  );
  readonly #addingAmplitude = selectorQuery(
    "[data-adding] [data-amplitude]",
    HTMLTableCellElement
  );
  readonly #availableCircles = selectorQuery(
    "[data-available] [data-circles]",
    HTMLTableCellElement
  );
  readonly #availableAmplitude = selectorQuery(
    "[data-available] [data-amplitude]",
    HTMLTableCellElement
  );
  private constructor() {
    [this.#requestedPath, this.#reconstructedPath] = selectorQueryAll(
      "path",
      SVGPathElement,
      2,
      2,
      this.#svgElement
    );
  }
  #cancelAnimations: (() => void) | undefined;
  private update(f: ParametricFunction, referencePath: string) {
    this.#cancelAnimations?.();
    const animations: Animation[] = [];
    this.#cancelAnimations = () => {
      animations.forEach((animation) => animation.cancel());
    };
    this.#requestedPath.setAttribute("d", referencePath);
    panAndZoom(this.#requestedPath, this.#svgElement);
    const originalTerms = parametricToFourier(f);
    const nonZeroTerms = keepNonZeroTerms(originalTerms);
    (window as any).nonZeroTerms = nonZeroTerms;
    (window as any).originalTerms = originalTerms;
    let totalAmplitude = 0;
    nonZeroTerms.forEach((term) => (totalAmplitude += term.amplitude));
    /**
     * This describes `nonZeroTerms` and is focused on what we
     * display in the table.
     *
     * `here` is the amount of amplitude expressed as a percent.
     *
     * `before` and `after` are the sum of all of the amplitudes
     * before and after this row.  I precompute these mostly so I
     * can control the round off error.
     */
    const amplitudes = nonZeroTerms.map((term) => {
      const here = (term.amplitude / totalAmplitude) * 100;
      return { here, before: NaN, after: NaN };
    });
    {
      let beforeSoFar = 0;
      let afterSoFar = 0;
      amplitudes.forEach((beforeRow, beforeIndex, array) => {
        beforeRow.before = beforeSoFar;
        beforeSoFar += beforeRow.here;
        const afterIndex = array.length - beforeIndex - 1;
        const afterRow = array[afterIndex];
        afterRow.after = afterSoFar;
        afterSoFar += afterRow.here;
      });
      //console.log(beforeSoFar, afterSoFar, amplitudes);
    }
    const maxKeyframes = 10;
    let usingCircles = 0;
    const pauseTime = 750;
    const addTime = 500;
    type ScriptEntry = {
      offset: number;
      startTime: number;
      endTime: number;
      usingCircles: number;
      usingAmplitude: number;
      addingCircles: number;
      addingAmplitude: number;
      availableAmplitude: number;
      availableCircles: number;
    };
    const script = new Array<ScriptEntry>();
    for (
      let remainingKeyframes = maxKeyframes - 1;
      remainingKeyframes >= 0 && usingCircles < amplitudes.length;
      remainingKeyframes--
    ) {
      let addingAmplitude = 0;
      let addingCircles = 0;
      let termIndex = usingCircles;
      const usingAmplitude = amplitudes[termIndex].before;
      while (true) {
        addingAmplitude += amplitudes[termIndex].here;
        addingCircles++;
        termIndex++;
        if (termIndex >= amplitudes.length) {
          break;
        }
        if (remainingKeyframes > 0) {
          const remainingAmplitude = amplitudes[termIndex].after;
          const averageRemainingBinSize =
            remainingAmplitude / remainingKeyframes;
          if (addingAmplitude > averageRemainingBinSize) {
            break;
          }
        }
      }
      const availableAmplitude = amplitudes[termIndex - 1].after;
      const availableCircles = amplitudes.length - termIndex;
      script.push({
        offset: NaN,
        startTime: NaN,
        endTime: NaN,
        usingCircles,
        usingAmplitude,
        addingCircles, // 👈 Adding
        addingAmplitude,
        availableAmplitude,
        availableCircles,
      });
      usingCircles += addingCircles;
      script.push({
        offset: NaN,
        startTime: NaN,
        endTime: NaN,
        usingCircles,
        usingAmplitude: usingAmplitude + addingAmplitude,
        addingCircles: 0, // 👈 Pausing
        addingAmplitude: 0,
        availableAmplitude,
        availableCircles,
      });
    }
    let smallEffectOffset = NaN;
    {
      // Fill in startTime and endTime for each row of the script.
      let startTime = 0;
      script.forEach((keyframe) => {
        const duration = keyframe.addingCircles ? addTime : pauseTime;
        const endTime = startTime + duration;
        keyframe.startTime = startTime;
        keyframe.endTime = endTime;
        startTime = endTime;
      });
      script.forEach((keyframe) => {
        keyframe.offset = keyframe.startTime / startTime;
      });
      smallEffectOffset = 50 / startTime;
      const last = script.at(-1)!;
      const final = { ...last, startTime, offset: 1 };
      script.push(final);
    }
    //console.log("script", script);

    const animationOptions: KeyframeAnimationOptions = {
      duration: script.at(-1)!.endTime * 3,
      iterations: Infinity,
    };

    {
      // this.#reconstructedPath.animate()
      /**
       * Simple caching.  I won't compute the same d twice in a row.
       * I know the requests always come in order, so there's no reason to save anything but the last thing we used.
       */
      let lastNumberOfTerms = -Infinity;
      let d = "";
      const keyframes = script.map(({ offset, usingCircles }): Keyframe => {
        if (usingCircles != lastNumberOfTerms) {
          const reconstructedF = termsToParametricFunction(
            nonZeroTerms,
            usingCircles
          );
          const reconstructedPath = PathShape.parametric(
            reconstructedF,
            sampleCount
          );
          /**
           * Assume that a pathShape is almost closed, but it might not be perfectly closed because of the way it was created.
           * This function is aimed at fixing round-off errors.
           * @param pathShape The shape to adjust.
           * @returns A similar shape that is closed.
           */
          function forceClosed(pathShape: PathShape): PathShape {
            if (pathShape.commands.length < 2) {
              throw new Error("wtf");
            }
            const [first, ...commands] = pathShape.commands;
            const last = commands.pop();
            if (!(first instanceof QCommand && last instanceof QCommand)) {
              throw new Error("wtf");
            }
            if (first.x0 == last.x && first.y0 == last.y) {
              return pathShape;
            }
            const x = (first.x0 + last.x) / 2;
            const y = (first.y0 + last.y) / 2;
            const newFirst = QCommand.controlPoints(
              x,
              y,
              first.x1,
              first.y1,
              first.x,
              first.y
            );
            const newLast = QCommand.controlPoints(
              last.x0,
              last.y0,
              last.x1,
              last.y1,
              x,
              y
            );
            return new PathShape([newFirst, ...commands, newLast]);
          }
          d = forceClosed(reconstructedPath).cssPath;
          lastNumberOfTerms = usingCircles;
        }
        return { offset, d, easing: "ease-in-out" };
      });
      animations.push(
        this.#reconstructedPath.animate(keyframes, animationOptions)
      );
      //console.log("d", keyframes);
    }

    {
      // Update the text in the table.
      type Values = { offset: number; circles: number }[];
      const animateRow = (
        circlesCell: HTMLTableCellElement,
        amplitudeCell: HTMLTableCellElement,
        values: Values
      ) => {
        /**
         * Format the numbers in the number of circles column.
         * We know the largest value is capped at 2048, so give every number enough space for 4 digits.
         * @param value The number of circles
         * @returns A string with padding and quotes.
         */
        const format = (value: number) =>
          `'${value.toString().padStart(4, FIGURE_SPACE)}'`;
        let previousContent: string | undefined;
        const keyframes = new Array<Keyframe>();
        values.forEach(({ offset, circles }): void => {
          if (previousContent !== undefined) {
            keyframes.push({ offset, content: previousContent });
          }
          const content = (previousContent = format(circles));
          keyframes.push({ offset, content });
        });
        //console.log("circles text", keyframes);
        animations.push(
          circlesCell.animate(keyframes, {
            pseudoElement: "::after",
            ...animationOptions,
          })
        );
        const opacityKeyframes = values.flatMap(
          ({ offset, circles }, index, array): Keyframe[] => {
            function getOpacity(circleCount = circles) {
              if (circleCount == 0) {
                return 0.25;
              } else {
                return 1;
              }
            }
            if (offset == 0 || offset == 1) {
              return [{ offset, opacity: getOpacity() }];
            }
            const previousCircles = array[index - 1].circles;
            if (previousCircles == circles) {
              return [];
            }
            return [
              {
                offset: offset - smallEffectOffset,
                opacity: getOpacity(previousCircles),
              },
              {
                offset,
                opacity: 0,
              },
              {
                offset: offset + smallEffectOffset,
                opacity: getOpacity(),
              },
            ];
          }
        );
        [circlesCell, amplitudeCell].forEach((cell) =>
          animations.push(cell.animate(opacityKeyframes, animationOptions))
        );
        //console.log("opacity", opacityKeyframes);
      };
      animateRow(
        this.#usingCircles,
        this.#usingAmplitude,
        script.map(({ offset, usingCircles }) => ({
          offset,
          circles: usingCircles,
        }))
      );
      animateRow(
        this.#addingCircles,
        this.#addingAmplitude,
        script.map(({ offset, addingCircles }) => ({
          offset,
          circles: addingCircles,
        }))
      );
      animateRow(
        this.#availableCircles,
        this.#availableAmplitude,
        script.map(({ offset, availableCircles }) => ({
          offset,
          circles: availableCircles,
        }))
      );
    }

    {
      /**
       * All of the amplitude numbers are displayed the same way.
       */
      const formatter = new Intl.NumberFormat("en-US", {
        minimumSignificantDigits: 5,
        maximumSignificantDigits: 5,
        useGrouping: false,
      }).format;
      const format = (value: number) => {
        if (value < 0) {
          value = 0;
        }
        return formatter(value);
      };
      type Result = { offset: number; content: string };
      function buildKeyframes(
        extractor: (scriptEntry: ScriptEntry) => number
      ): Result[] {
        let previousContent: string | undefined;
        const result = new Array<Result>();
        script.forEach((scriptEntry) => {
          const { offset } = scriptEntry;
          const amplitude = extractor(scriptEntry);
          if (previousContent !== undefined) {
            result.push({ offset, content: previousContent });
          }
          const content = (previousContent = format(amplitude));
          result.push({ offset, content });
        });
        return result;
      }
      const keyframesUsing = buildKeyframes(
        (scriptEntry) => scriptEntry.usingAmplitude
      );
      const keyframesAdding = buildKeyframes(
        (scriptEntry) => scriptEntry.addingAmplitude
      );
      const keyframesAvailable = buildKeyframes(
        (scriptEntry) => scriptEntry.availableAmplitude
      );
      const allKeyframes = [
        ...keyframesUsing,
        ...keyframesAdding,
        ...keyframesAvailable,
      ];
      let maxLength = 0;
      allKeyframes.forEach((keyframe) => {
        const [, beforeDecimalPoint, afterDecimalPoint] =
          /^([0-9]+)\.([0-9]+)$/.exec(keyframe.content)!;
        switch (beforeDecimalPoint.length) {
          case 3: {
            // Already perfect.  E.g. 100.00
            break;
          }
          case 2: {
            // E.g. 10.000
            keyframe.content = FIGURE_SPACE + keyframe.content;
            break;
          }
          case 1: {
            // E.g. 1.0000
            keyframe.content = FIGURE_SPACE + FIGURE_SPACE + keyframe.content;
            break;
          }
          default: {
            console.warn({ beforeDecimalPoint, afterDecimalPoint, keyframe });
            throw new Error("wtf");
          }
        }
        maxLength = Math.max(maxLength, keyframe.content.length);
      });
      allKeyframes.forEach((keyframe) => {
        keyframe.content = `'${(keyframe.content + "%").padEnd(
          maxLength + 1,
          FIGURE_SPACE
        )}'`;
      });
      animations.push(
        this.#usingAmplitude.animate(keyframesUsing, {
          pseudoElement: "::after",
          ...animationOptions,
        })
      );
      animations.push(
        this.#addingAmplitude.animate(keyframesAdding, {
          pseudoElement: "::after",
          ...animationOptions,
        })
      );
      animations.push(
        this.#availableAmplitude.animate(keyframesAvailable, {
          pseudoElement: "::after",
          ...animationOptions,
        })
      );
      /* console.log("amplitude text", {
        keyframesUsing,
        keyframesAdding,
        keyframesAvailable,
      }); */
    }
  }
  static update(f: ParametricFunction, referencePath: string) {
    this.#instance.update(f, referencePath);
  }
}

sourceTextArea.addEventListener("input", () => {
  goButton.disabled = false;
  codeSamples[0].code = sourceTextArea.value;
  sampleCodeSelect.selectedIndex = 0;
});

sampleCodeSelect.innerText = "";
codeSamples.forEach((sample, index) => {
  const option = document.createElement("option");
  option.innerText = sample.name;
  sampleCodeSelect.appendChild(option);
  if (sample.default) {
    sampleCodeSelect.selectedIndex = index;
    sourceTextArea.value = sample.code;
  }
});

/**
 * Use this to control the red box used to display error messages to the user.
 */
class ErrorBox {
  static readonly #div = getById("error", HTMLDivElement);
  static display(toDisplay: string) {
    this.#div.innerText = toDisplay;
  }
  static displayError(error: Error) {
    if (error instanceof NotEnoughInputs) {
      this.#div.innerHTML = `Unable to access <code>support.input(${
        error.requestedIndex
      })</code>.  Only ${
        inputValues.length
      } input sliders currently exist.  <button onclick="addMoreInputs(this,${
        error.requestedIndex + 1
      })">Add More</button>`;
    } else {
      this.display(error.message);
    }
  }
  static clear() {
    this.display("");
  }
}

function tryMakePath(f: ParametricFunction): PathShape | undefined {
  try {
    return PathShape.parametric(f, sampleCount);
  } catch (reason: unknown) {
    if (reason instanceof Error) {
      ErrorBox.displayError(reason);
      return undefined;
    } else {
      throw reason;
    }
  }
}

/**
 * One per input slider on the GUI.
 * This contains a cached value for each slider.
 */
const inputValues: number[] = [];

/**
 * This is an error that we can fix.
 */
class NotEnoughInputs extends Error {
  /**
   *
   * @param requestedIndex This is the request that caused the error.
   */
  constructor(public readonly requestedIndex: number) {
    super(
      `Unable to access support.input(${requestedIndex}).  Only ${inputValues.length} input sliders currently exist.`
    );
  }
}

const samples = {
  /**
   * Source:
   * https://upload.wikimedia.org/wikipedia/commons/a/a5/Hilbert_curve.svg
   * ``` JavaScript
   * [...document.querySelectorAll("path")].filter(path => getComputedStyle(path).strokeWidth=="3px").map(path=> path.getAttribute("d"))
   * ```
   */
  hilbert: [
    "m 128,384 0,-256 256,0 0,256",
    "m 672,448 128,0 0,-128 -128,0 0,-128 0,-128 128,0 0,128 128,0 0,-128 128,0 0,128 0,128 -128,0 0,128 128,0",
    "m 1248,480 0,-64 64,0 0,64 64,0 64,0 0,-64 -64,0 0,-64 64,0 0,-64 -64,0 -64,0 0,64 -64,0 0,-64 0,-64 64,0 0,-64 -64,0 0,-64 0,-64 64,0 0,64 64,0 0,-64 64,0 0,64 0,64 -64,0 0,64 64,0 64,0 64,0 0,-64 -64,0 0,-64 0,-64 64,0 0,64 64,0 0,-64 64,0 0,64 0,64 -64,0 0,64 64,0 0,64 0,64 -64,0 0,-64 -64,0 -64,0 0,64 64,0 0,64 -64,0 0,64 64,0 64,0 0,-64 64,0 0,64",
    "m 528.5,1234 -32,0 0,-32 32,0 0,-64 -32,0 0,32 -32,0 0,-32 -32,0 0,64 32,0 0,32 -64,0 0,-32 -32,0 0,32 -64,0 0,-32 32,0 0,-32 -32,0 0,-32 64,0 0,32 32,0 0,-96 -32,0 0,32 -64,0 0,-32 32,0 0,-32 -32,0 0,-32 64,0 0,32 32,0 0,-32 64,0 0,32 -32,0 0,64 32,0 0,-32 32,0 0,32 32,0 0,-64 -32,0 0,-32 32,0 0,-64 -32,0 0,32 -64,0 0,-32 32,0 0,-32 -32,0 0,-32 64,0 0,32 32,0 0,-64 -32,0 0,-32 32,0 0,-64 -32,0 0,32 -32,0 0,-32 -32,0 0,64 32,0 0,32 -96,0 0,-32 32,0 0,-64 -32,0 0,32 -32,0 0,-32 -32,0 0,64 32,0 0,32 -32,0 0,64 32,0 0,-32 64,0 0,32 -32,0 0,32 32,0 0,32 -64,0 0,-32 -32,0 0,32 -32,0 0,-32 -32,0 0,32 -64,0 0,-32 32,0 0,-32 -32,0 0,-32 64,0 0,32 32,0 0,-64 -32,0 0,-32 32,0 0,-64 -32,0 0,32 -32,0 0,-32 -32,0 0,64 32,0 0,32 -96,0 0,-32 32,0 0,-64 -32,0 0,32 -32,0 0,-32 -32,0 0,64 32,0 0,32 -32,0 0,64 32,0 0,-32 64,0 0,32 -32,0 0,32 32,0 0,32 -64,0 0,-32 -32,0 0,64 32,0 0,32 -32,0 0,64 32,0 0,-32 32,0 0,32 32,0 0,-64 -32,0 0,-32 64,0 0,32 32,0 0,-32 64,0 0,32 -32,0 0,32 32,0 0,32 -64,0 0,-32 -32,0 0,96 32,0 0,-32 64,0 0,32 -32,0 0,32 32,0 0,32 -64,0 0,-32 -32,0 0,32 -64,0 0,-32 32,0 0,-64 -32,0 0,32 -32,0 0,-32 -32,0 0,64 32,0 0,32 -32,0",
    "m 648.5,1242 0,-16 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-32 16,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 48,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 16,0 0,32 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,16 32,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 32,0 0,-16 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-48 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-16 -32,0 0,16 16,0 0,32 -16,0 0,-16 -16,0 0,16 -16,0 0,-32 16,0 0,-16 -16,0 0,-16 16,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 32,0 0,-16 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-48 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-16 -32,0 0,16 16,0 0,32 -16,0 0,-16 -16,0 0,16 -16,0 0,-32 16,0 0,-16 -32,0 0,16 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,32 -16,0 0,16 16,0 0,32 -16,0 0,-16 -16,0 0,16 -16,0 0,-32 16,0 0,-16 -48,0 0,16 16,0 0,32 -16,0 0,-16 -16,0 0,16 -16,0 0,-32 16,0 0,-16 -16,0 0,-32 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-32 16,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 32,0 0,-16 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-48 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-16 -32,0 0,16 16,0 0,32 -16,0 0,-16 -16,0 0,16 -16,0 0,-32 16,0 0,-16 -16,0 0,-32 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-32 16,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 48,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 16,0 0,32 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,16 16,0 0,-16 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-32 16,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 48,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 16,0 0,32 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,32 -16,0 0,16 16,0 0,32 -16,0 0,-16 -16,0 0,16 -16,0 0,-32 16,0 0,-16 -32,0 0,16 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,48 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,16 32,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 48,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 32,0 0,-16 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-48 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-16 -32,0 0,16 16,0 0,32 -16,0 0,-16 -16,0 0,16 -16,0 0,-32 16,0 0,-16 -16,0 0,-32 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-32 16,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 48,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 16,0 0,32 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,16 16,0 0,-16 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-32 16,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 48,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 16,0 0,32 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,32 -16,0 0,16 16,0 0,32 -16,0 0,-16 -16,0 0,16 -16,0 0,-32 16,0 0,-16 -32,0 0,16 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,48 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,16 32,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 16,0 0,32 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,32 -16,0 0,16 16,0 0,32 -16,0 0,-16 -16,0 0,16 -16,0 0,-32 16,0 0,-16 -48,0 0,16 16,0 0,32 -16,0 0,-16 -16,0 0,16 -16,0 0,-32 16,0 0,-16 -16,0 0,-32 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-16 -32,0 0,16 16,0 0,32 -16,0 0,-16 -16,0 0,16 -16,0 0,-32 16,0 0,-16 -32,0 0,16 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,48 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,16 32,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 16,0 0,16 -16,0 0,16 16,0 0,32 -16,0 0,-16 -16,0 0,16 -16,0 0,-32 16,0 0,-16 -32,0 0,16 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,48 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,16 32,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 32,0 0,-16 16,0 0,16 32,0 0,-16 -16,0 0,-16 16,0 0,-16 -32,0 0,16 -16,0 0,-32 16,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 48,0 0,-16 -16,0 0,-32 16,0 0,16 16,0 0,-16 16,0 0,32 -16,0 0,16 16,0 0,32 -16,0 0,-16 -32,0 0,16 16,0 0,16 -16,0 0,16 32,0 0,-16 16,0 0,16",
    "m 1756.5,1246 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -8,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-8 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 24,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-8 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 24,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 24,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 8,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 24,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-8 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 24,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -8,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -8,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 24,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,8 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -8,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-8 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 24,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -8,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -8,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 24,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,8 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 24,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 8,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 24,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 24,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,8 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 24,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,8 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-24 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -8,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-8 -8,0 0,-8 16,0 0,8 8,0 0,-16 -8,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -24,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,16 8,0 0,8 -8,0 0,16 8,0 0,-8 8,0 0,8 8,0 0,-16 -8,0 0,-8 16,0 0,8 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,24 8,0 0,-8 16,0 0,8 -8,0 0,8 8,0 0,8 -16,0 0,-8 -8,0 0,8 -16,0 0,-8 8,0 0,-16 -8,0 0,8 -8,0 0,-8 -8,0 0,16 8,0 0,8 -8,0",
  ],
  /**
   * Source:
   * https://upload.wikimedia.org/wikipedia/commons/6/64/Peanocurve.svg
   * ``` JavaScript
   * [...document.querySelectorAll("path")].map(path=> path.getAttribute("d"))
   * ```
   */
  peanocurve: [
    "m24 275v-264h132v264h132v-264",
    "m337 275v-66h33v66h33v-165h-33v66h-33v-165h33v66h33v-66h33v66h33v-66h33v165h-33v-66h-33v165h33v-66h33v66h33v-66h33v66h33v-165h-33v66h-33v-165h33v66h33v-33-33",
    "m647 275v-20.2h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-20.2h10.1v20.2h10.1v-20.2h10.1v50.5h-10.1v-20.2h-10.1v50.5h10.1v-20.2h10.1v20.2h10.1v-20.2h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-20.2h-10.1v20.2h-10.1v-20.2h-10.1v50.5h10.1v-20.2h10.1v50.5h-10.1v-20.2h-10.1v20.2h-10.1v-20.2h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-20.2h10.1v20.2h10.1v-20.2h10.1v50.5h-10.1v-20.2h-10.1v50.5h10.1v-20.2h10.1v20.2h10.1v-20.2h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-20.2h10.1v20.2h10.1v-20.2h10.1v50.5h-10.1v-20.2h-10.1v50.5h10.1v-20.2h10.1v20.2h10.1v-20.2h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-20.2h10.1v20.2h10.1v-20.2h10.1v50.5h-10.1v-20.2h-10.1v50.5h10.1v-20.2h10.1v50.5h-10.1v-20.2h-10.1v50.5h10.1v-20.2h10.1v50.5h-10.1v-20.2h-10.1v20.2h-10.1v-20.2h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-20.2h-10.1v20.2h-10.1v-20.2h-10.1v50.5h10.1v-20.2h10.1v50.5h-10.1v-20.2h-10.1v50.5h10.1v-20.2h10.1v50.5h-10.1v-20.2h-10.1v50.5h10.1v-20.2h10.1v20.2h10.1v-20.2h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-20.2h10.1v20.2h10.1v-20.2h10.1v50.5h-10.1v-20.2h-10.1v50.5h10.1v-20.2h10.1v20.2h10.1v-20.2h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-20.2h10.1v20.2h10.1v-20.2h10.1v50.5h-10.1v-20.2h-10.1v50.5h10.1v-20.2h10.1v20.2h10.1v-20.2h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-20.2h-10.1v20.2h-10.1v-20.2h-10.1v50.5h10.1v-20.2h10.1v50.5h-10.1v-20.2h-10.1v20.2h-10.1v-20.2h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-20.2h10.1v20.2h10.1v-20.2h10.1v50.5h-10.1v-20.2h-10.1v50.5h10.1v-20.2h10.1v20.2h10.1v-20.2h10.1v20.2h10.1v-50.5h-10.1v20.2h-10.1v-50.5h10.1v20.2h10.1v-20.2",
  ],
  /**
   * Source:  ../hershey-fonts-viewer.html
   */
  likeShareAndSubscribe:
    "M 39,9 Q 40,9.1231056 41,9 Q 43.410165,8.7032951 45,8 Q 46.217197,7.4615485 48,6 Q 49.365084,4.8808987 50,4 Q 50.784959,2.9109272 51,2 Q 51.354102,0.5 51,-1 Q 50.618034,-2.618034 50,-3 Q 49.197453,-3.4960013 48,-3 Q 47.60191,-2.8351058 47,-2 Q 46.401133,-1.1691162 46,0 Q 46,0.000000000000010354513 45,5 Q 44.5,7.5 44,10 Q 43.566518,11.632305 43,13 Q 42.403407,14.440302 42,15 Q 41.162278,16.162278 40,17 Q 38.910927,17.784959 38,18 Q 36.726049,18.300739 36,18 Q 35.292893,17.707107 35,17 Q 34.585786,16 35,15 Q 35.292893,14.292893 36,14 Q 36.726049,13.699261 38,14 Q 38.774116,14.182744 40,15 L 43,17 Q 44.017403,17.678269 46,18 Q 47,18.162278 48,18 Q 49.874032,17.695886 51,17 Q 52.236068,16.236068 53,15 M 54,13 L 56,9 L 54,15 Q 53.630602,16.108194 54,17 Q 54.292893,17.707107 55,18 Q 55.363024,18.15037 56,18 Q 56.910927,17.784959 58,17 Q 58.440449,16.682542 59,16 Q 60.148529,14.59902 61,13 Q 62.035694,11.523796 63,10 Q 64.925759,6.9569162 66,5 Q 66.699047,3.7265649 67,3 Q 67.84371,0.96310484 68,0 Q 68.233196,-1.437016 68,-2 Q 67.627999,-2.8980898 67,-3 Q 66.13962,-3.1396204 65,-2 Q 64.58711,-1.5871103 64,0 Q 63.616109,1.0377567 63,4 Q 62.373436,7.0125113 62,10 L 61,18 Q 61.393398,16.464466 62,15 Q 62.400589,14.032893 63,13 Q 64.468871,10.468871 65,10 Q 65.816225,9.2794515 67,9 Q 68.273951,8.6992609 69,9 Q 69.707107,9.2928932 70,10 Q 70.496001,11.197453 70,12 Q 69.618034,12.618034 68,13 Q 66.5,13.354102 65,13 Q 66.707107,13.12132 67,14 L 68,17 Q 68.226541,17.679623 69,18 Q 69.363024,18.15037 70,18 Q 70.910927,17.784959 72,17 Q 72.440449,16.682542 73,16 Q 74.148529,14.59902 75,13 M 76,16 Q 77.081139,15.662278 78,15 Q 78.581139,14.581139 79,14 Q 79.784959,12.910927 80,12 Q 80.300739,10.726049 80,10 Q 79.707107,9.2928932 79,9 Q 78.636976,8.8496304 78,9 Q 76.690983,9.309017 76,10 Q 75.309017,10.690983 75,12 Q 74.645898,13.5 75,15 Q 75.309017,16.309017 76,17 Q 76.690983,17.690983 78,18 Q 79,18.236068 80,18 Q 80.910927,17.784959 82,17 Q 82.440449,16.682542 83,16 Q 84.148529,14.59902 85,13M 92.5,43 Q 91.648529,44.59902 90.5,46 Q 89.940449,46.682542 89.5,47 Q 88.410927,47.784959 87.5,48 Q 86.5,48.236068 85.5,48 Q 84.190983,47.690983 83.5,47 Q 82.809017,46.309017 82.5,45 Q 82.145898,43.5 82.5,42 Q 82.809017,40.690983 83.5,40 Q 84.190983,39.309017 85.5,39 Q 86.136976,38.84963 86.5,39 Q 87.207107,39.292893 87.5,40 Q 87.800739,40.726049 87.5,42 Q 87.284959,42.910927 86.5,44 Q 86.081139,44.581139 85.5,45 Q 84.581139,45.662278 83.5,46 M 82.5,43 Q 81.648529,44.59902 80.5,46 Q 79.940449,46.682542 79.5,47 Q 78.410927,47.784959 77.5,48 Q 76.863024,48.15037 76.5,48 Q 75.792893,47.707107 75.5,47 Q 75.315301,46.554097 75.5,46 L 76.5,43 Q 76.869398,41.891806 76.5,41 Q 76.085786,40 75.5,40 L 72.5,40 Q 70.5,40 72.5,38 Q 72.062258,39.031129 71.5,40 Q 70.593387,41.562258 69.5,43 Q 68.648529,44.59902 67.5,46 Q 66.940449,46.682542 66.5,47 Q 65.410927,47.784959 64.5,48 Q 63.863024,48.15037 63.5,48 Q 62.792893,47.707107 62.5,47 Q 62.095372,46.023141 62.5,44 L 63.5,39 L 61.5,45 Q 61,46.5 60.5,47 Q 59.809017,47.690983 58.5,48 Q 57.5,48.236068 56.5,48 Q 55.190983,47.690983 54.5,47 Q 53.809017,46.309017 53.5,45 Q 53.263932,44 53.5,43 Q 53.715041,42.089073 54.5,41 Q 54.918861,40.418861 55.5,40 Q 56.589073,39.215041 57.5,39 Q 58.5,38.763932 59.5,39 Q 60.809017,39.309017 61.5,40 Q 62.333333,40.833333 62.5,42 M 53.5,43 Q 52.648529,44.59902 51.5,46 Q 50.940449,46.682542 50.5,47 Q 49.410927,47.784959 48.5,48 Q 47.863024,48.15037 47.5,48 Q 46.792893,47.707107 46.5,47 Q 46.130602,46.108194 46.5,45 L 47.5,42 Q 47.869398,40.891806 47.5,40 Q 47.207107,39.292893 46.5,39 Q 45.773951,38.699261 44.5,39 Q 43.316225,39.279451 42.5,40 Q 41.968871,40.468871 40.5,43 Q 39.900589,44.032893 39.5,45 Q 38.893398,46.464466 38.5,48 L 39.5,40 Q 39.873436,37.012511 40.5,34 Q 41.116109,31.037757 41.5,30 Q 42.08711,28.41289 42.5,28 Q 43.63962,26.86038 44.5,27 Q 45.127999,27.10191 45.5,28 Q 45.733196,28.562984 45.5,30 Q 45.34371,30.963105 44.5,33 Q 44.199047,33.726565 43.5,35 Q 42.425759,36.956916 40.5,40 Q 39.535694,41.523796 38.5,43 Q 37.648529,44.59902 36.5,46 Q 35.940449,46.682542 35.5,47 Q 34.410927,47.784959 33.5,48 Q 31.5,48.472136 29.5,48 Q 28.381966,47.736068 27.5,47 M 31.5,48 Q 32.809017,48.118034 33.5,47 Q 33.841641,46.447214 33.5,45 Q 33.317256,44.225884 32.5,43 L 30.5,40 Q 30.083574,39.375361 30.5,38 Q 30.062258,39.031129 29.5,40 Q 28.593387,41.562258 27.5,43M 44,72 Q 43.833333,70.833333 43,70 Q 42.309017,69.309017 41,69 Q 40,68.763932 39,69 Q 38.089073,69.215041 37,70 Q 36.418861,70.418861 36,71 Q 35.215041,72.089073 35,73 Q 34.763932,74 35,75 Q 35.309017,76.309017 36,77 Q 36.690983,77.690983 38,78 Q 39,78.236068 40,78 Q 41.309017,77.690983 42,77 Q 42.5,76.5 43,75 L 45,69 L 44,74 Q 43.595372,76.023141 44,77 Q 44.292893,77.707107 45,78 Q 45.363024,78.15037 46,78 Q 46.910927,77.784959 48,77 Q 48.440449,76.682542 49,76 Q 50.148529,74.59902 51,73 Q 51.601653,71.234436 53,70 Q 54.267444,68.881123 55,69 Q 55.627999,69.10191 56,70 Q 56.094901,70.229111 56,71 Q 55.879306,71.980414 55,75 Q 54.557607,76.519202 54,78 M 55,75 Q 55.437742,73.968871 56,73 Q 57.468871,70.468871 58,70 Q 58.816225,69.279451 60,69 Q 61.273951,68.699261 62,69 Q 62.707107,69.292893 63,70 Q 63.369398,70.891806 63,72 L 62,75 Q 61.630602,76.108194 62,77 Q 62.292893,77.707107 63,78 Q 63.363024,78.15037 64,78 Q 64.910927,77.784959 66,77 Q 66.440449,76.682542 67,76 Q 68.148529,74.59902 69,73 M 78,72 Q 77.833333,70.833333 77,70 Q 76.309017,69.309017 75,69 Q 74,68.763932 73,69 Q 72.089073,69.215041 71,70 Q 70.418861,70.418861 70,71 Q 69.215041,72.089073 69,73 Q 68.763932,74 69,75 Q 69.309017,76.309017 70,77 Q 70.690983,77.690983 72,78 Q 73,78.236068 74,78 Q 75.309017,77.690983 76,77 Q 76.5,76.5 77,75 L 83,57 M 79,69 L 78,74 Q 77.595372,76.023141 78,77 Q 78.292893,77.707107 79,78 Q 79.363024,78.15037 80,78 Q 80.910927,77.784959 82,77 Q 82.440449,76.682542 83,76 Q 84.148529,74.59902 85,73M 113,103 Q 112.14853,104.59902 111,106 Q 110.44045,106.68254 110,107 Q 108.91093,107.78496 108,108 Q 107,108.23607 106,108 Q 104.69098,107.69098 104,107 Q 103.30902,106.30902 103,105 Q 102.6459,103.5 103,102 Q 103.30902,100.69098 104,100 Q 104.69098,99.309017 106,99 Q 106.63698,98.84963 107,99 Q 107.70711,99.292893 108,100 Q 108.30074,100.72605 108,102 Q 107.78496,102.91093 107,104 Q 106.58114,104.58114 106,105 Q 105.08114,105.66228 104,106 M 103,103 Q 102.11803,103.73607 101,104 Q 99.726049,104.30074 99,104 Q 98.433281,103.76526 98,103 Q 96.946032,101.13849 97,99 Q 97.243416,100.5 97,102 Q 96.695886,103.87403 96,105 Q 95.37758,106.0071 94,107 Q 92.910927,107.78496 92,108 Q 91.363024,108.15037 91,108 Q 90.292893,107.70711 90,107 Q 89.636039,106.12132 90,101 Q 90.211354,98.026019 91,94 Q 91.539922,91.243708 92,90 Q 92.58711,88.41289 93,88 Q 94.13962,86.86038 95,87 Q 95.627999,87.10191 96,88 Q 96.233196,88.562984 96,90 Q 95.84371,90.963105 95,93 Q 94.699047,93.726565 94,95 Q 92.925759,96.956916 91,100 Q 90.035694,101.5238 89,103 Q 88.148529,104.59902 87,106 Q 86.440449,106.68254 86,107 Q 84.910927,107.78496 84,108 Q 83.363024,108.15037 83,108 Q 82.292893,107.70711 82,107 Q 81.630602,106.10819 82,105 L 84,99 L 82,103 Q 81.148529,104.59902 80,106 Q 79.440449,106.68254 79,107 Q 77.910927,107.78496 77,108 Q 76.363024,108.15037 76,108 Q 75.292893,107.70711 75,107 Q 74.815301,106.5541 75,106 L 76,103 Q 76.369398,101.89181 76,101 Q 75.585786,100 75,100 L 72,100 Q 70,100 72,98 Q 71.562258,99.031129 71,100 Q 70.093387,101.56226 69,103 Q 68.3,104.7 67,106 Q 65.434259,107.56574 64,108 Q 62.685697,108.39794 61,108 Q 59.690983,107.69098 59,107 Q 58.309017,106.30902 58,105 Q 57.763932,104 58,103 Q 58.215041,102.08907 59,101 Q 59.418861,100.41886 60,100 Q 61.089073,99.215041 62,99 Q 63.273951,98.699261 64,99 Q 64.707107,99.292893 65,100 Q 65.207107,100.5 65,101 M 58,103 Q 57.148529,104.59902 56,106 Q 55.440449,106.68254 55,107 Q 53.910927,107.78496 53,108 Q 51,108.47214 49,108 Q 47.881966,107.73607 47,107 M 51,108 Q 52.309017,108.11803 53,107 Q 53.341641,106.44721 53,105 Q 52.817256,104.22588 52,103 L 50,100 Q 49.583574,99.375361 50,98 Q 49.562258,99.031129 49,100 Q 48.093387,101.56226 47,103 Q 46.118034,103.73607 45,104 Q 43.726049,104.30074 43,104 Q 42.433281,103.76526 42,103 Q 40.946032,101.13849 41,99 Q 41.243416,100.5 41,102 Q 40.695886,103.87403 40,105 Q 39.37758,106.0071 38,107 Q 36.910927,107.78496 36,108 Q 35.363024,108.15037 35,108 Q 34.292893,107.70711 34,107 Q 33.636039,106.12132 34,101 Q 34.211354,98.026019 35,94 Q 35.539922,91.243708 36,90 Q 36.58711,88.41289 37,88 Q 38.13962,86.86038 39,87 Q 39.627999,87.10191 40,88 Q 40.233196,88.562984 40,90 Q 39.84371,90.963105 39,93 Q 38.699047,93.726565 38,95 Q 36.925759,96.956916 35,100 Q 34.035694,101.5238 33,103 Q 32.148529,104.59902 31,106 Q 30.440449,106.68254 30,107 Q 28.910927,107.78496 28,108 Q 27.363024,108.15037 27,108 Q 26.292893,107.70711 26,107 Q 25.630602,106.10819 26,105 L 28,99 M 27,102 Q 26.148529,103.59902 25,105 Q 23.880899,106.36508 23,107 Q 21.910927,107.78496 21,108 Q 19.726049,108.30074 19,108 Q 18.292893,107.70711 18,107 Q 17.630602,106.10819 18,105 L 20,99 L 18,103 Q 17.148529,104.59902 16,106 Q 15.440449,106.68254 15,107 Q 13.910927,107.78496 13,108 Q 11,108.47214 9,108 Q 7.881966,107.73607 7,107 M 11,108 Q 12.309017,108.11803 13,107 Q 13.341641,106.44721 13,105 Q 12.817256,104.22588 12,103 L 10,100 Q 9.5835741,99.375361 10,98 Q 9.5622577,99.031129 9,100 Q 8.0933866,101.56226 7,103",
};

/* 
console.table([
  ...samples.hilbert.map((d, index) => {
    const name = `hilbert ${index}`;
    const stringLength = d.length;
    const pathShape = PathShape.fromString(d);
    const segmentCount = pathShape.commands.length;
    return { name, stringLength, segmentCount };
  }),
  ...samples.peanocurve.map((d, index) => {
    const name = `peanocurve ${index}`;
    const stringLength = d.length;
    const pathShape = PathShape.fromString(d);
    const segmentCount = pathShape.commands.length;
    return { name, stringLength, segmentCount };
  }),
]);
 */

//   {
//       const svgElement = getById("distanceVsT", SVGSVGElement);
//     const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
//  const pointsString=  homerPoints.map(({x, y})=> `${x},${y}`).join(" ");
//     polygon.setAttribute("points", pointsString);
//     polygon.style.fill="red";
//     svgElement.appendChild(polygon);
//     console.log(polygon);
//   }

/**
 * This is a simple way to interface with the user provided script.
 */
export const support = {
  /**
   *
   * @param index 0 for the first, 1 for the second, etc.
   * @returns The current value for this input.  It will be in the range of 0-1, inclusive.
   */
  input(index: number) {
    if (!Number.isSafeInteger(index) || index < 0) {
      throw new RangeError(`invalid ${index}`);
    }
    if (index >= inputValues.length) {
      throw new NotEnoughInputs(index);
    }
    return inputValues[index];
  },
  /**
   * Turns a linear timing function into a timing function that eases in and out.
   * The derivative of this function is 0 around t=0 and t=1.
   * This function is shaped like half of a sine wave.
   * @param t A value between 0 and 1, inclusive.
   * @returns A value between 0 and 1, inclusive.
   */
  ease(t: number) {
    return (1 - Math.cos(Math.PI * t)) / 2;
  },
  /**
   * This is way to split a parametric function into smaller parts.
   * Typically you'd call this once in the setup part of the script, before defining f().
   * This will return a function that you will call inside of f().
   * @param weights A list of numbers saying how long to stay in each bin.
   * These are automatically scaled so the entire animation will take a time of 1.
   * If bin 1 has a weight of 1 and bin 2 as a weights of time, the animation will spend twice as much time in bin 2 as in bin 1.
   * @returns A splitter function.
   * This function will take in a number between 0 and 1 (inclusive) for the time relative to the entire animation.
   * It will return an object with two properties.
   * `index` says which bin you are in.
   * `t` says the time (0 to 1 inclusive) within the current bin.
   * @see assertValidT() For information about times.
   * @see makeTSplitterA() For a variant of this function.
   */
  makeTSplitter: makeTSplitter,
  /**
   * This is way to split a parametric function into smaller parts.
   * Typically you'd call this once in the setup part of the script, before defining f().
   * This will return a function that you will call inside of f().
   * @param preWeight The amount of time to wait before starting normal operations.
   * Each bin has a weight of one.
   * * 0 means to start on the first bin immediately.
   * * 2.5 means to wait 2½✖️ as long before the first bin as we spend on any one bin.
   *   During that time the display will be frozen at the start of the first bin.
   * * -1.25 means to completely skip the first bin and start ¼ of the way into the second bin.
   * @param binCount How many bins to split the time into.
   * Each is given an equal amount of time.
   * @param postWeight The amount of time between the end of the last bin and end of the entire animation.
   * Each bin has a weight of one.
   * * 0 means to end the last bin at exactly the end of the entire animation.
   * * 2.5 means to wait 2½✖️ as long after the last bin as we spend on any one bin.
   *   During that time the display will be frozen at the end of the last bin.
   * * -1.25 means to completely skip the last bin and end ¾ of the way into the second to last bin.
   * @returns A splitter function.
   * This function will take in a number between 0 and 1 (inclusive) for the time relative to the entire animation.
   * It will return an object with two properties.
   * `index` says which bin you are in.
   * `t` says the time (0 to 1 inclusive) within the current bin.
   * @see assertValidT() For information about times.
   * @see makeTSplitter() For a more flexible version of this function.
   */
  makeTSplitterA: makeTSplitterA,
  /**
   *
   * @param at0 `lerpPoints(at0, at1, 0)` → at0
   * @param at1 `lerpPoints(at0, at1, 1)` → at1
   * @param where t
   */
  lerpPoints: lerpPoints,
  /**
   * ```
   * const randomValue = lerp(lowestLegalValue, HighestLegalValue, Math.random())
   * ```
   * @param at0 `lerp(at0, at1, 0)` → at0
   * @param at1 `lerp(at0, at1, 1)` → at1
   * @param t
   * @returns
   */
  lerp: lerp,
  /**
   * Linear interpolation and extrapolation.
   *
   * Given two points, this function will find the line that lines on those two points.
   * And it will return a function that will find all points on that line.
   * @param x1 One valid input.
   * @param y1 The expected output at x1.
   * @param x2 Another valid input.  Must differ from x2.
   * @param y2 The expected output at x2.
   * @returns A function of a line.  Give an x as input and it will return the expected y.
   * ![Inputs and outputs of makeLinear()](https://raw.githubusercontent.com/TradeIdeasPhilip/lib/master/makeLinear.png)
   */
  makeLinear: makeLinear,
  random: (seed: string) => {
    if (typeof seed !== "string") {
      throw new RangeError("Invalid seed.  Expecting a string.");
    } else {
      return Random.fromString(seed);
    }
  },
  referencePath: new PathWrapper(),
  samples,
  cursiveLetters,
  futuraLLetters,
};

/**
 * All of the input sliders go into this div element.
 */
const inputsDiv = getById("inputs", HTMLDivElement);

function addAnotherInput() {
  goButton.disabled = false;
  const index = inputValues.length;
  const initialValue = 0.5;
  const tag = `<div class="has-slider">
      <input type="range" min="0" max="1" value="${initialValue}" step="0.00001" oninput="copyNewInput(this, ${index})" />
      <code>support.input(${index})</code> =
      <span>${initialValue.toString().padEnd(7, "0")}</span>
    </div>`;
  inputsDiv.insertAdjacentHTML("beforeend", tag);
  inputValues.push(initialValue);
}

(window as any).addMoreInputs = (
  element: HTMLButtonElement,
  requiredCount: number
) => {
  element.disabled = true;
  while (inputValues.length < requiredCount) {
    addAnotherInput();
  }
};

selectorQuery("#inputsGroup button", HTMLButtonElement).addEventListener(
  "click",
  () => {
    addAnotherInput();
  }
);

addAnotherInput();
addAnotherInput();

{
  const doItNow = () => {
    ErrorBox.clear();
    const sourceText = '"use strict";\n' + sourceTextArea.value + "\nreturn f;";
    let oneTimeSetup: Function;
    try {
      oneTimeSetup = new Function("support", sourceText);
    } catch (reason: unknown) {
      if (reason instanceof SyntaxError) {
        ErrorBox.displayError(reason);
        return;
      } else {
        throw reason;
      }
    }
    let f: Function;
    support.referencePath.clear();
    try {
      f = oneTimeSetup(support);
    } catch (reason: unknown) {
      if (reason instanceof Error) {
        ErrorBox.displayError(reason);
        return;
      } else {
        throw reason;
      }
    }
    const f1: ParametricFunction = (t: number) => {
      const result: Point = f(t, support);
      if (!(Number.isFinite(result.x) && Number.isFinite(result.y))) {
        throw new Error(
          `Invalid result.  Expected {x,y} where x and y are both finite numbers.  Found: ${JSON.stringify(
            result
          )} when t=${t}.`
        );
      }
      return result;
    };

    if (support.referencePath.empty) {
      const idealShape = tryMakePath(f1);
      if (!idealShape) {
        return;
      }
      support.referencePath.d = idealShape.rawPath;
    }

    AnimateDistanceVsT.update(f1, support.referencePath.d);
    AnimateRequestedVsReconstructed.update(f1, support.referencePath.d);
  };
  let scheduled = false;
  const doItSoon = () => {
    goButton.disabled = true;
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        doItNow();
      });
    }
  };
  goButton.addEventListener("click", doItSoon);

  (window as any).copyNewInput = (element: HTMLInputElement, index: number) => {
    inputValues[index] = element.valueAsNumber;
    const span = assertClass(
      element.parentElement?.lastElementChild,
      HTMLSpanElement
    );
    span.innerText = element.valueAsNumber.toFixed(5);
    doItSoon();
  };

  {
    const doUpdate = () => {
      const sample = codeSamples[sampleCodeSelect.selectedIndex];
      sourceTextArea.value = sample.code;
      doItSoon();
    };
    sampleCodeSelect.addEventListener("change", doUpdate);
    getById("nextSample", HTMLButtonElement).addEventListener("click", () => {
      sampleCodeSelect.selectedIndex =
        (sampleCodeSelect.selectedIndex + 1) % codeSamples.length;
      doUpdate();
    });
  }

  {
    // This functionality is also available in the <select> element.
    // But making it all visible helps the AI.
    const codeSamplesHolder = getById("codeSamplesHolder", HTMLDivElement);
    const inputsGroup = getById("inputsGroup", HTMLDivElement);
    const template = `<div>
            <div data-description>
              <button class="show-this">Show This</button><span></span>
            </div>
            <pre data-code-snippet></pre></div>`;
    codeSamples.forEach((sample, index) => {
      if (index > 0) {
        codeSamplesHolder.insertAdjacentHTML("beforeend", template);
        const entireDiv = codeSamplesHolder.lastElementChild!;
        const nameSpan = selectorQuery("span", HTMLSpanElement, entireDiv);
        nameSpan.innerText = sample.name;
        const codePre = selectorQuery("pre", HTMLPreElement, entireDiv);
        codePre.innerText = sample.code;
        const button = selectorQuery("button", HTMLButtonElement, entireDiv);
        button.addEventListener("click", () => {
          sourceTextArea.value = sample.code;
          doItSoon();
          inputsGroup.scrollIntoView({ behavior: "smooth" });
        });
      }
    });
  }

  doItSoon();
}

{
  // By default the page includes a lot of instructions and information.
  // This checkbox makes it easier to see the inputs and the outputs
  // on the screen all at once.
  const checkBox = getById("hide-text", HTMLInputElement);
  checkBox.addEventListener("click", () => {
    if (checkBox.checked) {
      document.documentElement.dataset.hide = "requested";
    } else {
      delete document.documentElement.dataset.hide;
    }
  });
}

// TODO
// * Better error handlers.
//   Sometimes it just says "WTF"
//   And NaN is reported as "null" in the error messages.
