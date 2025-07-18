import {
  AnimationLoop,
  download,
  getById,
  selectorQuery,
} from "phil-lib/client-misc";
import "./style.css";
import "./parametric-path.css";
import {
  ParametricFunction,
  ParametricToPath,
  PathShape,
  Point,
} from "./path-shape";
import { assertClass, FIGURE_SPACE, pickAny } from "phil-lib/misc";
import { panAndZoom } from "./transforms";

const goButton = getById("go", HTMLButtonElement);
const sourceTextArea = getById("source", HTMLTextAreaElement);
const resultElement = getById("result", HTMLElement);
const pathInfoElement = getById("pathInfo", HTMLDivElement);
const sampleCodeSelect = getById("sampleCode", HTMLSelectElement);

const codeSamples: ReadonlyArray<{
  readonly name: string;
  code: string;
  default?: true;
}> = [
  { name: "Custom", code: "" },
  {
    name: "Simple Ellipse",
    code: `// The height can be anything convenient to you.
// This software will automatically zoom and pan to show off your work.
const height = 1;
// Use the first slider to change the width of the ellipse.
const width = height * support.input(0) * 2;
const angle = t * 2 * Math.PI;
const x = width * Math.cos(angle);
const y = height * Math.sin(angle);`,
  },
  {
    name: "Square",
    code: `// Square from Polar Form
const θ = t * Math.PI * 2;
const r = 1/(Math.abs(Math.cos(θ) - Math.sin(θ)) + Math.abs(Math.cos(θ) + Math.sin(θ)));
const x = r * Math.cos(θ);
const y = r * Math.sin(θ);`,
  },
  {
    name: "Cusps",
    code: `// This pushes the limits of my graphing software.
// This software is aimed at smooth curves.

// Once around the circle.
const θ = t * Math.PI * 2;

// The first input is the number of cusps, 1-10
const cuspCount = Math.round(support.input(0)*9.999+0.5);

// Far left looks like a cloud, cusps pointing inward.
// Far right looks like a star, cusps pointing outward.
// Dead center is smooth, no cusps.
const amplitude = 2 * (support.input(1) - 0.5);

const r = 2 - amplitude * Math.abs(Math.sin(t * Math.PI * cuspCount));
const x = r * Math.cos(θ);
const y = r * Math.sin(θ);`,
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
    default: true,
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
    name: "Spirograph Curve (⟟)",
    code: `// Spirograph Curve (⟟) - A general Spirograph pattern with adjustable parameters
// Sliders: rolling circle radius (⟟), pen distance (⟠), number of turns (⟡)
const R = 1.0; // Fixed circle radius
const r = support.input(0) * 2 - 1; // Rolling circle radius: -1 to 1 (⟟). Negative for inside, positive for outside
const d = support.input(1) * 2; // Pen distance from rolling circle center: 0 to 2 (⟠)
const numTurns = support.input(2) * 10; // Number of turns: 0 to 10 (⟡)
const angle = t * 2 * Math.PI * numTurns;

// Determine if rolling inside (hypotrochoid) or outside (epitrochoid)
const k = r < 0 ? (R - r) / r : (R + r) / r; // Frequency ratio
const baseRadius = r < 0 ? (R - r) : (R + r); // Base radius for the rolling circle's center

// Parametric equations
const x = baseRadius * Math.cos(angle) + (r < 0 ? d : -d) * Math.cos(k * angle);
const y = baseRadius * Math.sin(angle) - (r < 0 ? d : -d) * Math.sin(k * angle);`,
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
    name: "Cardioid with Nodal Loops (क⋏)",
    code: `// Cardioid with Nodal Loops (क⋏) - A heart-shaped curve with adjustable loops
// Slider adjusts the number of nodal loops (⋰)
const r = 0.5; // Radius of the base circles for the cardioid
const nodalFreq = Math.round(support.input(0) * 10); // Frequency of nodal loops (⋰). First slider: 0 to 10
const nodalAmp = 0.1; // Amplitude of the nodal loops
const angle = t * 2 * Math.PI; // Full circle

// Base cardioid: point on a circle rolling around another circle
const xCardioid = r * (2 * Math.cos(angle) - Math.cos(2 * angle));
const yCardioid = r * (2 * Math.sin(angle) - Math.sin(2 * angle));

// Add nodal loops along the curve
const nodalOffset = nodalAmp * Math.sin(nodalFreq * angle);
const x = xCardioid + nodalOffset * Math.cos(angle);
const y = yCardioid + nodalOffset * Math.sin(angle);`,
  },
  {
    name: "Lissajous Śpiral (श)",
    code: `// Lissajous Śpiral (श) - A spiraling Lissajous curve with adjustable frequency
// Slider adjusts the frequency ratio (⟐)
const scale = 1.0; // Base scale of the curve
const freqRatio = 1 + support.input(0) * 4; // Frequency ratio x:y (⟐). First slider: 1 to 5
const spiralFactor = t; // Linearly increasing amplitude for spiral effect
const angle = t * 2 * Math.PI; // Full circle

// Lissajous curve with spiraling amplitude
const x = scale * spiralFactor * Math.cos(angle);
const y = scale * spiralFactor * Math.sin(freqRatio * angle);`,
  },
  {
    name: "Squaring the Circle",
    code: `// This will trace out the shape of a dog tag using epicycles.
// Use the first slider to choose how many circles to use in
// this approximation, from 1 to 20.

// I was originally trying to use epicycles to create a square.
// But I ran into some issues.
// See "A Better Square" for my second attempt, which worked much better.

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
    code: `// Draw a series of approximations of a square.
// Each is created from looking at the first n items in the complex Fourier series for a square.
// The demo interpolates when n is not an integer.
//
// I computed this list using the “Square with Easing” example at
// https://tradeideasphilip.github.io/random-svg-tests/complex-fourier-series.html
const circles = [
    {
        "frequency": 1,
        "amplitude": 0.6002108774487057,
        "phase": -2.356194490192345
    },
    {
        "frequency": -3,
        "amplitude": 0.12004217545570839,
        "phase": -2.356194490192345
    },
    {
        "frequency": 5,
        "amplitude": 0.017148882159337513,
        "phase": 0.7853981633974483
    },
    {
        "frequency": -7,
        "amplitude": 0.0057162939963831035,
        "phase": -2.356194490192344
    },
    {
        "frequency": 9,
        "amplitude": 0.0025983153910070288,
        "phase": 0.7853981633974468
    },
    {
        "frequency": -11,
        "amplitude": 0.0013990928373741655,
        "phase": -2.356194490192343
    },
    {
        "frequency": 13,
        "amplitude": 0.0008394556343162563,
        "phase": 0.7853981633974426
    },
    {
        "frequency": -15,
        "amplitude": 0.000543177105018045,
        "phase": -2.3561944901923386
    },
    {
        "frequency": 17,
        "amplitude": 0.00037164742117819677,
        "phase": 0.7853981633974505
    },
    {
        "frequency": -19,
        "amplitude": 0.0002654623706666915,
        "phase": -2.3561944901923475
    }
];

const numberOfCircles = 1 + (circles.length-1) * support.input(0);
const circlesToConsider = Math.ceil(numberOfCircles);
const attenuation = numberOfCircles - Math.floor(numberOfCircles);
let x = 0;
let y = 0;
for (let k = 0; k < circlesToConsider; k++) {
const { frequency, amplitude, phase } = circles[k];
      const angle = 2 * Math.PI * frequency * t + phase;
  const factor = (k === circlesToConsider - 1 && attenuation > 0) ? attenuation : 1;
      x += factor * amplitude * Math.cos(angle);
      y += factor * amplitude * Math.sin(angle);
}`,
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

/**
 * One of these for each of the individual samples.
 */
class SampleOutput {
  readonly #svgElement: SVGSVGElement;
  protected get svgElement() {
    return this.#svgElement;
  }
  readonly #pathElement: SVGPathElement;
  protected get pathElement() {
    return this.#pathElement;
  }
  constructor(svgSelector: string) {
    this.#svgElement = selectorQuery(svgSelector, SVGSVGElement);
    this.#pathElement = selectorQuery(
      "path:not([data-skip-auto-fill])",
      SVGPathElement,
      this.#svgElement
    );
    SampleOutput.all.add(this);
  }
  static readonly all = new Set<SampleOutput>();
  #recommendedWidth = NaN;
  protected get recommendedWidth() {
    return this.#recommendedWidth;
  }
  #panAndZoom() {
    const bBox = this.#pathElement.getBBox();
    const to = this.#svgElement.viewBox.baseVal;
    to.x = bBox.x;
    to.y = bBox.y;
    to.width = bBox.width;
    to.height = bBox.height;
    // Check for just one of the numbers being 0.
    // SVG doesn't like that and will refuse to draw anything.
    if (to.width == 0) {
      if (to.height != 0) {
        to.width = to.height / 10;
        to.x -= to.width / 2;
      }
    } else if (to.height == 0) {
      to.height = to.width / 10;
      to.y -= to.height / 2;
    }
    const aspectRatio = bBox.width / bBox.height;
    /**
     * Arbitrary base height in pixels.
     *
     * This was a failed attempt at fixing an issue in Safari.
     * By default Chrome tries to respect the aspect ratio of the content.
     * If you specify the width or height using CSS, but let the other one float,
     * Chrome would always fill in the other one to maintain the aspect ratio.
     * Exactly like it does with <img> tags.
     *
     * However, that's broken in Safari.
     * I get all sorts of odd sizes and shapes.
     * Grok suggested that I specify a height and width, as another way to tell Safari what the aspect ratio should be.
     * This didn't really work.
     */
    const intrinsicHeight = 300;
    const intrinsicWidth = intrinsicHeight * aspectRatio;
    this.#svgElement.style.height = intrinsicHeight + "px";
    this.#svgElement.style.width = intrinsicWidth + "px";
    this.#recommendedWidth = Math.max(to.width, to.height) / 100;
    this.#svgElement.style.setProperty(
      "--recommended-width",
      this.#recommendedWidth.toString()
    );
  }
  setPathShape(pathShape: PathShape) {
    this.#pathElement.setAttribute("d", pathShape.rawPath);
    this.#panAndZoom();
  }
  static setPathShape(pathShape: PathShape) {
    this.all.forEach((sampleOutput) => sampleOutput.setPathShape(pathShape));
  }
  static pathElement() {
    return pickAny(SampleOutput.all)!.#pathElement;
  }
  protected deAnimate(element: Animatable = this.#pathElement) {
    element.getAnimations().forEach((animation) => animation.cancel());
  }
}

new SampleOutput("#filledSample");
new SampleOutput("#outlineSample");

class ChasingPathsSample extends SampleOutput {
  constructor() {
    super("#chasingPathsSample");
  }
  override setPathShape(pathShape: PathShape): void {
    super.setPathShape(pathShape);
    const pathElement = this.pathElement;
    const duration = 1500;
    const iterationStart = (Date.now() / duration) % 1;
    this.deAnimate();
    const length = pathElement.getTotalLength();
    pathElement.style.strokeDasharray = `0 ${length} ${length} 0`;
    pathElement.animate(
      [{ strokeDashoffset: 0 }, { strokeDashoffset: -2 * length }],
      {
        iterations: Infinity,
        duration,
        iterationStart,
      }
    );
  }
}
new ChasingPathsSample();

class DancingAntsSample extends SampleOutput {
  constructor() {
    super("#dancingAntsSample");
  }
  override setPathShape(pathShape: PathShape): void {
    super.setPathShape(pathShape);
    const pathElement = this.pathElement;
    const duration = 250;
    this.deAnimate();
    const length = pathElement.getTotalLength();
    const iterationStart = (Date.now() / duration) % 1;
    const idealWavelength = 4 * this.recommendedWidth;
    const wavelength =
      idealWavelength * 10 < length
        ? length / Math.round(length / idealWavelength)
        : idealWavelength;
    pathElement.style.strokeDasharray = `0 ${wavelength}`;
    pathElement.animate(
      [{ strokeDashoffset: 0 }, { strokeDashoffset: -wavelength }],
      {
        iterations: Infinity,
        duration,
        iterationStart,
      }
    );
  }
}
new DancingAntsSample();

class TauFollowingPathSample extends SampleOutput {
  constructor() {
    super("#tauFollowingPathSample");

    // This is an ugly hack.  There seems to be a bug in Safari.  This hack is not required in Chrome, but doesn't hurt.
    // In Safari the positions of the three <text> elements do not update despite very simple rules in parametric-path.css.
    // (See the "move" animation.)
    // I noticed that the <text> elements would jump to their correct positions any time I changed a relevant style property,
    // but it was a one time jump.  It did not continue updating.  So I added some code to agitate the <text> elements
    // once per animation frame.  It's shady, but it works, and I've done worse.
    let even = true;
    new AnimationLoop(() => {
      /**
       * This value has exactly one job:  Change so the browser will refresh.
       * The irony is that the change in the `nonce` has no real effect and should be ignored.
       * While the change to offset-distance (in parametric-path.css) has a real effect and should not have been ignored.
       * All together we get the correct result of updating the moving text every frame.
       */
      const nonce = even ? "0 0" : "center";
      this.svgElement.style.offsetAnchor = nonce;
      even = !even;
    });
  }
  override setPathShape(pathShape: PathShape): void {
    super.setPathShape(pathShape);
    this.svgElement.style.setProperty("--css-path", pathShape.cssPath);
  }
}
new TauFollowingPathSample();

new SampleOutput("#textPathSample");

/**
 * This class shows a way to set a clip-path to a path string, and two ways to
 * to apply an SVG <mask> using mask-image.
 *
 * This process requires an SVG for support.  Typically that SVG would be hidden.
 * But for the sake of this demo we are displaying the SVG.  Notice the
 * instructions, found in other comments, on the correct way to hide the SVG.
 */
class ClipAndMaskSupport extends SampleOutput {
  static doItSoon() {
    console.warn("placeholder");
  }
  readonly #maskPath: SVGPathElement;
  constructor() {
    super("#clipAndMaskSupport");
    this.#maskPath = selectorQuery(
      "mask > path",
      SVGPathElement,
      this.svgElement
    );
    // We will need to redraw any time the size of the image changes.
    // TODO Do we have to do this for the maskImg?  Probably not.  TODO consider deleting that part of the code.
    const resizeObserver = new ResizeObserver(() =>
      ClipAndMaskSupport.doItSoon()
    );
    [this.#clipImg, this.#maskImg].forEach((imageElement) => {
      imageElement.decode().then(() => ClipAndMaskSupport.doItSoon());
      resizeObserver.observe(imageElement);
    });
    this.#downloadButton.addEventListener("click", (): void => {
      if (this.#fileContents === undefined) {
        // This should never happen.
        // #1 We should always load a value from the normal flow of the program before the user is able to do anything.
        // #2 The button should be disabled until we have a valid value, in case #1 fails.
        throw new Error("wtf");
      }
      // TODO This would work better if we saved the properties as styles not attributes.
      // Inkscape left my properties in place and used styles to overwrite them.
      // The mac preview didn't work.  It used the attribute values, not the style values.
      download("ParametricPath.svg", this.#fileContents);
    });
  }
  get measurablePath() {
    // bBox() requires the path and the svg to be attached to the document,
    // and it does not allow me to set display=none.
    // It is okay to set the svg's opacity, its max-width and its max-height to 0.
    // In this example I am displaying the path element to help me debug some things.
    return this.pathElement;
  }
  readonly #clipImg = getById("clipPathSample", HTMLImageElement);
  readonly #maskImg = getById("maskSample", HTMLImageElement);
  readonly #maskImg2 = getById("maskSample2", HTMLImageElement);
  #fileContents: string | undefined;
  #downloadButton = getById("download", HTMLButtonElement);
  override setPathShape(pathShape: PathShape): void {
    super.setPathShape(pathShape);

    // Send a data-url to img#maskSample.  This is a onet time setting; there is no more work to do.
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${this.svgElement.getAttribute(
      "viewBox"
    )}" preserveAspectRatio="xMidYMid meet"><path d="${
      pathShape.rawPath
    }" stroke="red" fill-opacity="0.5" fill="black" stroke-width="${
      this.recommendedWidth * 4
    }"/></svg>`;
    const dataUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
    const maskImage = `url('${dataUrl}')`;
    this.#maskImg2.style.maskImage = maskImage;

    this.#fileContents = svgString;
    this.#downloadButton.disabled = false;

    // The clip example and the other mask example require more effort.
    // This code has to update any time the destination image resizes.
    // This code has to do the transform with more JavaScript and less css.

    const bBox = this.measurablePath.getBBox();
    const matrix = panAndZoom(
      bBox,
      {
        x: 0,
        y: 0,
        height: this.#clipImg.clientHeight,
        width: this.#clipImg.clientWidth,
      },
      "srcRect fits completely into destRect"
    );

    // We have to manually transform the path from the given size and location to the desired size and location.
    const transformedShape = pathShape.transform(matrix);
    this.#clipImg.style.clipPath = transformedShape.cssPath;
    this.#maskPath.setAttribute("d", transformedShape.rawPath);

    // This next block of code says to set the path width to
    // 8 times the recommended path width.  I.e. thick.
    // And animate squares running around the stroke.
    // This is similar to the dancing ants demo, but with very
    // big squares instead of big circles.
    const xScale = matrix.a;
    const strokeWidth = this.recommendedWidth * xScale * 8;
    this.#maskPath.style.strokeWidth = strokeWidth.toString();

    const duration = 507;
    this.deAnimate(this.#maskPath);
    const length = this.#maskPath.getTotalLength();
    const iterationStart = (Date.now() / duration) % 1;
    const idealWavelength = 16 * this.recommendedWidth * xScale;
    const wavelength =
      idealWavelength * 10 < length
        ? length / Math.round(length / idealWavelength)
        : idealWavelength;
    this.#maskPath.style.strokeDasharray = `${strokeWidth} ${
      wavelength - strokeWidth
    }`;
    this.#maskPath.animate(
      [{ strokeDashoffset: 0 }, { strokeDashoffset: -wavelength }],
      {
        iterations: Infinity,
        duration,
        iterationStart,
      }
    );
  }
}
new ClipAndMaskSupport();

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
      <input type="range" min="0" max="1" value="${initialValue}" step="any" oninput="copyNewInput(this, ${index})" />
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
  const segmentCountInput = getById("segmentCountInput", HTMLInputElement);
  /**
   * The far left means that `t` sweeps from 0 to 1. This is the
   * default. Set this ¼ of the way from the left to make `t` start
   * at 0.25, sweep toward 1, wrap around at 0, then move back to 0.25 to
   * finish. The right end of the scale means to start from 1, which is
   * effectively the same as starting from 0.
   */
  const startAtInput = getById("startAtInput", HTMLInputElement);
  function showPathShape(pathShape: PathShape) {
    SampleOutput.setPathShape(pathShape);
    const pathElement = SampleOutput.pathElement();
    const boundingBox = pathElement.getBBox();
    console.log(boundingBox);
    pathInfoElement.innerText = `Path length = ${pathElement.getTotalLength()}.  Bounding box = {top: ${
      boundingBox.y
    }, left: ${boundingBox.x}, height: ${boundingBox.height}, width: ${
      boundingBox.width
    }}`;
    resultElement.innerText = pathElement.outerHTML;
  }
  (window as any).showPathShape = showPathShape;
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
    const startAt = startAtInput.valueAsNumber;
    const f1: ParametricFunction = (t: number) => {
      t = (t + startAt) % 1;
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

    let pathShape: PathShape;
    try {
      pathShape = PathShape.parametric(f1, segmentCountInput.valueAsNumber);
      (window as any).parametricToPath = new ParametricToPath(f1);
    } catch (reason: unknown) {
      if (reason instanceof Error) {
        ErrorBox.displayError(reason);
        return;
      } else {
        throw reason;
      }
    }
    showPathShape(pathShape);
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
  ClipAndMaskSupport.doItSoon = doItSoon; // This is ugly.  Need to reorganize.
  goButton.addEventListener("click", doItSoon);

  const segmentCountSpan = getById("segmentCountSpan", HTMLSpanElement);
  const updateSegmentCountSpan = () => {
    segmentCountSpan.innerText = segmentCountInput.value.padStart(
      3,
      FIGURE_SPACE
    );
  };
  updateSegmentCountSpan();
  segmentCountInput.addEventListener("input", () => {
    updateSegmentCountSpan();
    doItSoon();
  });

  const startAtSpan = getById("startAtSpan", HTMLSpanElement);
  const updateStartAtSpan = () => {
    startAtSpan.innerText = startAtInput.valueAsNumber.toFixed(5);
  };
  updateStartAtSpan();
  startAtInput.addEventListener("input", () => {
    updateStartAtSpan();
    doItSoon();
  });

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
    /**
     * A list of all code samples.
     * Read the entire body of each sample.
     * Load the one of your choice with one click.
     *
     * This functionality is also available in the <select> element.
     * But making it all visible helps the AI.
     */
    const codeSamplesHolder = getById("codeSamplesHolder", HTMLDivElement);
    /**
     * The highest element on the page that the user might want to see as he works with a new formula.
     * Will will scroll to this line because it's a pain to manually scroll back and forth.
     */
    const segmentCountHolder = getById("segmentCountHolder", HTMLDivElement);
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
          segmentCountHolder.scrollIntoView({ behavior: "smooth" });
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

{
  const checkBox = getById("smaller-samples", HTMLInputElement);
  checkBox.addEventListener("click", () => {
    if (checkBox.checked) {
      document.documentElement.dataset.smallerSamples = "requested";
    } else {
      delete document.documentElement.dataset.smallerSamples;
    }
  });
}

// TODO
// * Samples
//   Blowing in the wind animation?
// * Sample code:  Maybe a button that says "random sample"!! 🙂
// * Display the path as a cssPath, as in a css file, possibly in an @keyframes
// * Better error handlers.
//   Sometimes it just says "WTF"
//   And NaN is reported as "null" in the error messages.

/**
 * Things to try on the console:
 * showPathShape(parametricToPath.pathShape)
 * parametricToPath.addOne()
 * console.table(parametricToPath.commands)
 * parametricToPath.addOne();showPathShape(parametricToPath.pathShape);console.table(parametricToPath.commands)
 *
 *
 * parametricToPath.commands.map(command=>command.curveLength/command.lineLength)
 * Math.max(...parametricToPath.commands.map(command=>command.curveLength/command.lineLength))
 * parametricToPath.summarize().metric
 * ParametricToPath.chordRatio(8)
 */

/**
 * These are examples of the errors I saw from my new error function.
 * abs(curve length - polyline length)
 * The default/automatic cutoff will still give us 8 segments; it was selected to do so.
 * Notice how quickly and continuously and exponentially the error / segment drops.
 * Multiply that by the total number of segments for the total error, but it's still exponential improvement.
 *
 * Circle with radius 1, parameter 2π.
 * 2 segments, metric =  1.0614672205021392
 * 4 segments, metric =  0.06250394727032704
 * 8 segments, metric =  0.0025846433585409168
 * 16 segments, metric = 0.00019730529368222616
 * 32 segments, metric = 0.000020999629849971502
 * 64 segments, metric = 0.000002556277850979116
 *
 *
 * Is the automatic bBox calculation going to cause problems?
 * - If I get a glitch, the bBox will grow a lot.
 * - It might grow roughly in proportion with the spurious curveLength.
 * - Assume the metric is accurate, something close to curveLength.
 * - That should still cause a high enough metric to cause us to grab it.
 * - But it won't stand out like it used it.
 * I HAVEN'T SEEN ANY PROBLEMS, SO FAR.
 *
 * parametricToPath.addOne();showPathShape(parametricToPath.pathShape);[parametricToPath.commands.length, parametricToPath.commands.at(-1).metric]
 */

/**
 * TODO Add a radio button to switch between the traditional and new parametric path.
 * Where the former asks you how many segments to use, this will tell you how many it did use.
 */

/**
 * MOVE THE DEVELOPMENT EFFORT to complex-fourier-series.ts
 * When it starts the animation it should save a few things to global variables.
 * I want the list of terms, and an easy way to turn them into parametric functions.
 * And I need a way to display the result.  Maybe take over the path in the first demo.
 * Mostly run from the console so I can examine the detailed dump().
 *
 * Notice the test code for ParametricToPath in path-to-fourier.ts.
 * Add something similar to complex-fourier-series.ts.
 */
