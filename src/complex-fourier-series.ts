import { AnimationLoop, getById } from "phil-lib/client-misc";
import "./style.css";
import "./complex-fourier-series.css";
import { ParametricFunction, PathShape, Point, QCommand } from "./path-shape";
import { selectorQuery, selectorQueryAll } from "./utility";
import { assertClass, FIGURE_SPACE } from "phil-lib/misc";
import { fft } from "fft-js";

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

const sampleCount = 120;

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
    name: "Square",
    default: true,
    code: `if (t < 0.25) {
  return {x: t*4 -0.5, y:-0.5};
} else if(t<0.5) {
  return {x:0.5, y: t*4-1.5};
} else if(t<0.75) {
  return {x: 2.5-t*4, y:0.5};
} else {
  return {x:-0.5, y: 3.5-t*4};
}`,
  },
  {
    name: "Square with Easing",
    code: `// This takes -1/2 to -1/2, 0 to 0, and 1/2 to 1/2.
// However it starts moving slowly, speeds up in the middle, and slows down again at the end.
function ease(t) {
  return Math.cos((t-0.5)*Math.PI)/2; 
}

let x =0;
let y=0;
 
if (t < 0.25) {
  x = t*4-0.5;
  y = -0.5;
} else if(t<0.5) {
  x = 0.5;
  y = t*4-1.5;
} else if(t<0.75) {
  x = 2.5-t*4;
  y = 0.5;
} else {
  x= -0.5; 
  y= 3.5-t*4;
}
x = ease(x);
y = ease(y);`,
  },
  {
    name: "Simple Ellipse",
    code: `// The height can be anything convenient to you.
// This software will automatically zoom and pan to show off your work.
const height = 1;
// Use the first slider to change the width of the ellipse.
const width = height * support.input(0) * 2;
// Use the second slider to change the starting point on the ellipse.
// This doesn't matter in a static ellipse, but it can be important in some animations and other special cases.
const angle = (t + support.input(1)) * 2 * Math.PI;
const x = width * Math.cos(angle);
const y = height * Math.sin(angle);`,
  },
  {
    name: "Circle with Wavy Edge",
    code: `// Make sure you use enough segments.
// This includes a lot of inflection points, which means you need a lot of segments.
const height = 1;
const width = height;
const angle = t * 2 * Math.PI;
const adjustmentAngle = angle * 8;
const adjustmentFactor = Math.sin(adjustmentAngle)/10+1;
const x = width * Math.cos(angle) * adjustmentFactor;
const y = height * Math.sin(angle) * adjustmentFactor;`,
  },
  {
    name: "Lissajous Curves",
    code: `const a = 1; // Amplitude in x-direction
const b = 1; // Amplitude in y-direction
const freqX = 3; // Frequency in x-direction
const freqY = 2; // Frequency in y-direction
const phase = Math.PI / 2; // Phase difference
const angle = t * 2 * Math.PI;
const x = a * Math.sin(freqX * angle + phase);
const y = b * Math.sin(freqY * angle);

// This works well with my approximations.
// There are only two inflection points and they are both in regions where the path is almost linear.`,
  },
  {
    name: "Hypocycloid / Astroid",
    code: `const R = 1; // Radius of the large circle
const r = R / 4; // Radius of the small circle (astroid case)
const angle = t * 2 * Math.PI;
const x = (R - r) * Math.cos(angle) + r * Math.cos((R - r) / r * angle);
const y = (R - r) * Math.sin(angle) - r * Math.sin((R - r) / r * angle);

// The sharp corners in this curve push my model to its limits.
// However, it does a decent job as long as you use enough segments.`,
  },
  {
    name: "Bell Curve",
    code: `// Number of standard deviations in each direction:
const right = support.input(0) * 5;
const left = - right;
const width = right - left;
const x = t * width + left;
const height = support.input(1) * 4 + 1;
// Negate this.
// This program works with normal graphics notation where lower values of y are higher on the display.
// Normal algebra-class graphs show lower values of y lower on the screen.
const y = - height * Math.exp(-x*x);`,
  },
  {
    name: "Archimedean Spiral with Oscillation",
    code: `const scale = 1; // Overall scale of the spiral
const turns = 3; // Number of full rotations
const waveFreq = 10; // Frequency of the oscillation
const waveAmp = 0.1; // Amplitude of the oscillation
const angle = t * 2 * Math.PI * turns;
const radius = scale * t; // Linear growth for Archimedean spiral
const wave = waveAmp * Math.sin(t * 2 * Math.PI * waveFreq);
const x = radius * Math.cos(angle) * (1 + wave);
const y = radius * Math.sin(angle) * (1 + wave);`,
  },
  {
    name: "Heart Curve ♡",
    code: `const scale = 1;
const angle = t * 2 * Math.PI;
const x = scale * (16 * Math.pow(Math.sin(angle), 3));
const algebraClassY = scale * (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
const y = - algebraClassY;`,
  },
  {
    name: "Butterfly Curve",
    code: `const scale = 0.2;
const angle = t * 24 * Math.PI * support.input(0); // More rotations for complexity
const e = Math.exp(1);
const x = scale * Math.sin(angle) * (e ** Math.cos(angle) - 2 * Math.cos(4 * angle) - Math.pow(Math.sin(angle / 12), 5));
const y = scale * Math.cos(angle) * (e ** Math.cos(angle) - 2 * Math.cos(4 * angle) - Math.pow(Math.sin(angle / 12), 5));

// This will require a lot of segments to display correctly.`,
  },
  {
    name: "Hollow Star ☆",
    code: `const scale = 1; // Overall scale of the star
const points = 5; // Number of star points
const innerRadius = 0.4; // Radius of the inner points (controls star shape)
const roundness = 0.1; // Amplitude of the oscillation for rounding
const angle = t * 2 * Math.PI; // Full circle
const starAngle = angle * points; // Angle scaled for 5 points
const radius = scale * (1 - innerRadius * (Math.cos(starAngle) + 1) / 2); // Base star shape
const rounding = roundness * Math.sin(starAngle); // Oscillation for rounding
const x = (radius + rounding) * Math.cos(angle);
const y = (radius + rounding) * Math.sin(angle);

// According to Wikipedia, if it's hollow inside, it's a star.
// If you can see the lines crossing each other, it's a pentagram.`,
  },
  {
    name: "Rotating Ellipse",
    code: `const r1 = 0.5; // Short radius of the ellipse
const r2 = 1.0; // Long radius of the ellipse
const phase = support.input(0) * Math.PI; // First slider: Rotation angle in radians (0 to π)
const angle = t * 2 * Math.PI; // Full circle

// Basic ellipse centered at the origin
const xEllipse = r1 * Math.cos(angle);
const yEllipse = r2 * Math.sin(angle);

// Rotate the ellipse by the phase angle
const x = xEllipse * Math.cos(phase) - yEllipse * Math.sin(phase);
const y = xEllipse * Math.sin(phase) + yEllipse * Math.cos(phase);

// I used this formula as a starting place for the rounded pentagram.`,
  },
  {
    name: "Rounded Pentagram ⛤, Heptagram, etc.",
    code: `const r1 = 0.5 * support.input(0); // Short radius of the ellipse. Top slider will adjust it.
const r2 = 1.0; // Long radius of the ellipse
const phase = Math.PI * t; // The reference ellipse will make one half complete rotation during the tracing process.
const numberOfTrips = support.input(1) * 10;  // Effective range is 0 to 10 
const angle = t * 2 * Math.PI * numberOfTrips; // Basic ellipse centered at the origin
const xEllipse = r1 * Math.cos(angle);
const yEllipse = r2 * Math.sin(angle);// Rotate the ellipse by the phase angle
const x = xEllipse * Math.cos(phase) - yEllipse * Math.sin(phase);
const y = xEllipse * Math.sin(phase) + yEllipse * Math.cos(phase);

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
// But I ran into the Gibbs Phenomenon,
// so this a square where two of the sides bulge out some.

const numberOfCircles = 1 + 19 * support.input(0);
const circlesToConsider = Math.ceil(numberOfCircles);
const attenuation = numberOfCircles - Math.floor(numberOfCircles);
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
}`,
  },
  {
    name: "A Better Square",
    code: `// Inspired by https://www.youtube.com/watch?v=t99CmgJAXbg
// Square Orbits Part 1: Moon Orbits

const R = 0.573; // Match our first circle's radius
const moonRadius = (7 / 45) * R;
const planetAngle = t * 2 * Math.PI; // Frequency 1
const moonAngle = -3 * planetAngle; // Frequency 3, opposite direction
const planetX = R * Math.cos(planetAngle);
const planetY = R * Math.sin(planetAngle);
const moonX = moonRadius * Math.cos(moonAngle);
const moonY = moonRadius * Math.sin(moonAngle);
const x = (planetX + moonX) * 1.2;
const y = (planetY + moonY) * 1.2;`,
  },
  {
    name: "Fourier square wave",
    code: `// Use the first slider to choose how many sine waves to use in
// this approximation, from 1 to 20.

const numberOfCircles = 1 + 19 * support.input(0);
const circlesToConsider = Math.ceil(numberOfCircles);
const attenuation = numberOfCircles - Math.floor(numberOfCircles);
let ySum = 0;
for (let k = 0; k < circlesToConsider; k++) {
  const n = 2 * k + 1; // Odd frequencies: 1, 3, 5, ...
  const amplitude = (4 / Math.PI) / n;
  const factor = (k === circlesToConsider - 1 && attenuation > 0) ? attenuation : 1;
  const baseAngle = 2 * Math.PI * 2.5 * t + Math.PI / 2; // 2.5 cycles, shift for vertical center
  ySum += factor * amplitude * Math.sin(n * baseAngle);
}
const x = (t * 5) - 2.5; // Span x from -2.5 to 2.5
const y = ySum;`,
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
  private update(f: ParametricFunction, pathShape: PathShape) {
    this.#pathElement.setAttribute("d", pathShape.rawPath);
    panAndZoom(this.#pathElement, this.#svgElement);
    this.f = f;
    this.#distanceCircle.style.offsetPath = pathShape.cssPath;
  }
  static update(f: ParametricFunction, pathShape: PathShape) {
    this.#instance.update(f, pathShape);
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
  private update(f: ParametricFunction, pathShape: PathShape) {
    this.#cancelAnimations?.();
    const animations: Animation[] = [];
    this.#cancelAnimations = () => {
      animations.forEach((animation) => animation.cancel());
    };
    this.#requestedPath.setAttribute("d", pathShape.rawPath);
    panAndZoom(this.#requestedPath, this.#svgElement);
    const originalTerms = parametricToFourier(f);
    const nonZeroTerms = keepNonZeroTerms(originalTerms);
    //console.log({ originalTerms, nonZeroTerms });
    (window as any).nonZeroTerms = nonZeroTerms;
    (window as any).originalTerms = originalTerms;
    let totalAmplitude = 0;
    nonZeroTerms.forEach((term) => (totalAmplitude += term.amplitude));
    const maxKeyframes = 10;
    let usingAmplitude = 0;
    const pauseTime = 750;
    const addTime = 500;
    const script = nonZeroTerms
      .slice(0, maxKeyframes - 1)
      .flatMap((term, index) => {
        const amplitude = (term.amplitude / totalAmplitude) * 100;
        const adding = {
          offset: NaN,
          startTime: NaN,
          endTime: NaN,
          usingCircles: index,
          usingAmplitude,
          addingCircles: 1,
          addingAmplitude: amplitude,
        };
        usingAmplitude += amplitude;
        const pausing = {
          offset: NaN,
          startTime: NaN,
          endTime: NaN,
          usingCircles: index + 1,
          usingAmplitude,
          addingCircles: 0,
          addingAmplitude: 0,
        };
        if (index == 0) {
          return [pausing];
        } else {
          return [adding, pausing];
        }
      });
    type ScriptEntry = (typeof script)[number];
    {
      const lastRow = script.at(-1)!;
      const missingCircles = nonZeroTerms.length - lastRow.usingCircles;
      if (missingCircles > 0) {
        script.push(
          {
            offset: NaN,
            startTime: NaN,
            endTime: NaN,
            usingCircles: lastRow.usingCircles,
            usingAmplitude: lastRow.usingAmplitude,
            addingCircles: missingCircles,
            addingAmplitude: 100 - lastRow.usingAmplitude,
          },
          {
            offset: NaN,
            startTime: NaN,
            endTime: NaN,
            usingCircles: nonZeroTerms.length,
            usingAmplitude: 100,
            addingCircles: 0,
            addingAmplitude: 0,
          }
        );
      }
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
    console.log("script", script);

    const animationOptions: KeyframeAnimationOptions = {
      duration: script.at(-1)!.endTime * 3,
      iterations: Infinity,
    };

    {
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
      console.log("d", keyframes);
    }

    {
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
        console.log("circles text", keyframes);
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
        console.log("opacity", opacityKeyframes);
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
        script.map(({ offset, usingCircles, addingCircles }) => ({
          offset,
          circles: nonZeroTerms.length - usingCircles - addingCircles,
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
        (scriptEntry) =>
          100 - scriptEntry.usingAmplitude - scriptEntry.addingAmplitude
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
      console.log("amplitude text", {
        keyframesUsing,
        keyframesAdding,
        keyframesAvailable,
      });
    }
  }
  static update(f: ParametricFunction, pathShape: PathShape) {
    this.#instance.update(f, pathShape);
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

/**
 * This is a simple way to interface with the user provided script.
 */
const support = {
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
    const sourceText =
      '"use strict";\n' + sourceTextArea.value + "\nreturn { x, y };";
    let f: Function;
    try {
      f = new Function(
        "t /* A value between 0 and 1, inclusive. */",
        "support",
        sourceText
      );
    } catch (reason: unknown) {
      if (reason instanceof SyntaxError) {
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

    const idealShape = tryMakePath(f1);
    if (!idealShape) {
      return;
    }

    AnimateDistanceVsT.update(f1, idealShape);
    AnimateRequestedVsReconstructed.update(f1, idealShape);
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
// * Access to TSplitter and related tools through a parameter to the function.
// * Better error handlers.
//   Sometimes it just says "WTF"
//   And NaN is reported as "null" in the error messages.
