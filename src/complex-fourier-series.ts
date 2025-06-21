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
support.referencePath.d = support.samples.hilbert[1];
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
