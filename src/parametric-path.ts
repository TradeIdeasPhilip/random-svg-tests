import { getById } from "phil-lib/client-misc";
import "./style.css";
import "./parametric-path.css";
import { ParametricFunction, PathShape, Point, transform } from "./path-shape";
import { selectorQuery, selectorQueryAll } from "./utility";
import { assertClass, FIGURE_SPACE, pickAny } from "phil-lib/misc";

const goButton = getById("go", HTMLButtonElement);
const sourceTextArea = getById("source", HTMLTextAreaElement);
const resultElement = getById("result", HTMLElement);

sourceTextArea.addEventListener("input", () => (goButton.disabled = false));

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function computeClipPathTransform(
  srcRect: Rect, // Source bounding box (e.g., from getBBox())
  destRect: Rect, // Destination rectangle (e.g., HTML element dimensions)
  aspect: "fit" | "fill" // "fit" to fit entirely, "fill" to fill and possibly crop
): DOMMatrix {
  // Step 1: Compute the scaling factors to fit or fill the destination
  const srcAspect = srcRect.width / srcRect.height;
  const destAspect = destRect.width / destRect.height;

  let scaleX: number, scaleY: number;
  if (aspect === "fit") {
    // Fit: Scale to fit entirely within destRect, preserving aspect ratio
    if (srcAspect > destAspect) {
      // Source is wider than destination: scale by width, letterbox height
      scaleX = destRect.width / srcRect.width;
      scaleY = scaleX;
    } else {
      // Source is taller than destination: scale by height, letterbox width
      scaleY = destRect.height / srcRect.height;
      scaleX = scaleY;
    }
  } else {
    // Fill: Scale to fill destRect, preserving aspect ratio, may crop
    if (srcAspect > destAspect) {
      // Source is wider than destination: scale by height, crop width
      scaleY = destRect.height / srcRect.height;
      scaleX = scaleY;
    } else {
      // Source is taller than destination: scale by width, crop height
      scaleX = destRect.width / srcRect.width;
      scaleY = scaleX;
    }
  }

  // Step 2: Compute the translation to center the path (xMidYMid)
  // Translate the source rectangle's origin (srcRect.x, srcRect.y) to (0,0),
  // scale it, then translate to the center of the destination rectangle
  const translateX =
    -srcRect.x * scaleX +
    (destRect.width - srcRect.width * scaleX) / 2 +
    destRect.x;
  const translateY =
    -srcRect.y * scaleY +
    (destRect.height - srcRect.height * scaleY) / 2 +
    destRect.y;

  // Step 3: Create the DOMMatrix
  const matrix = new DOMMatrix()
    .translate(translateX, translateY)
    .scale(scaleX, scaleY);

  return matrix;
}

// Test cases for computeClipPathTransform
function runTests() {
  // Test 1: Your original test case (fit, source square, destination wider)
  {
    const testFrom: Rect = { x: -1, y: -1, width: 2, height: 2 };
    const testTo: Rect = { x: 0, y: 0, height: 244, width: 325 };
    const testMatrix = computeClipPathTransform(testFrom, testTo, "fit");
    console.log("Test 1 (fit, square to wider):", {
      testFrom,
      testTo,
      testMatrix: testMatrix.toJSON(),
    });

    const corners = [
      { x: testFrom.x, y: testFrom.y }, // (-1, -1)
      { x: testFrom.x + testFrom.width, y: testFrom.y }, // (1, -1)
      { x: testFrom.x + testFrom.width, y: testFrom.y + testFrom.height }, // (1, 1)
      { x: testFrom.x, y: testFrom.y + testFrom.height }, // (-1, 1)
    ];

    corners.forEach(({ x: xFrom, y: yFrom }) => {
      const toPoint = transform(xFrom, yFrom, testMatrix);
      console.log({ xFrom, yFrom, toPoint: { x: toPoint.x, y: toPoint.y } });
      // Expectation: All points should be within testTo (x: [0, 325], y: [0, 244])
      if (
        toPoint.x < testTo.x ||
        toPoint.x > testTo.x + testTo.width ||
        toPoint.y < testTo.y ||
        toPoint.y > testTo.y + testTo.height
      ) {
        throw new Error(
          `Test 1 failed: Point (${toPoint.x}, ${toPoint.y}) is outside destination (${testTo.x}, ${testTo.y}, ${testTo.width}, ${testTo.height})`
        );
      }
    });
  }

  // Test 2: Fit, source square, destination taller
  {
    const testFrom: Rect = { x: -1, y: -1, width: 2, height: 2 };
    const testTo: Rect = { x: 0, y: 0, height: 325, width: 244 };
    const testMatrix = computeClipPathTransform(testFrom, testTo, "fit");
    console.log("Test 2 (fit, square to taller):", {
      testFrom,
      testTo,
      testMatrix: testMatrix.toJSON(),
    });

    const corners = [
      { x: testFrom.x, y: testFrom.y },
      { x: testFrom.x + testFrom.width, y: testFrom.y },
      { x: testFrom.x + testFrom.width, y: testFrom.y + testFrom.height },
      { x: testFrom.x, y: testFrom.y + testFrom.height },
    ];

    corners.forEach(({ x: xFrom, y: yFrom }) => {
      const toPoint = transform(xFrom, yFrom, testMatrix);
      console.log({ xFrom, yFrom, toPoint: { x: toPoint.x, y: toPoint.y } });
      if (
        toPoint.x < testTo.x ||
        toPoint.x > testTo.x + testTo.width ||
        toPoint.y < testTo.y ||
        toPoint.y > testTo.y + testTo.height
      ) {
        throw new Error(
          `Test 2 failed: Point (${toPoint.x}, ${toPoint.y}) is outside destination (${testTo.x}, ${testTo.y}, ${testTo.width}, ${testTo.height})`
        );
      }
    });
  }

  // Test 3: Fill, source square, destination wider
  {
    const testFrom: Rect = { x: -1, y: -1, width: 2, height: 2 };
    const testTo: Rect = { x: 0, y: 0, height: 244, width: 325 };
    const testMatrix = computeClipPathTransform(testFrom, testTo, "fill");
    console.log("Test 3 (fill, square to wider):", {
      testFrom,
      testTo,
      testMatrix: testMatrix.toJSON(),
    });

    const corners = [
      { x: testFrom.x, y: testFrom.y },
      { x: testFrom.x + testFrom.width, y: testFrom.y },
      { x: testFrom.x + testFrom.width, y: testFrom.y + testFrom.height },
      { x: testFrom.x, y: testFrom.y + testFrom.height },
    ];

    corners.forEach(({ x: xFrom, y: yFrom }) => {
      const toPoint = transform(xFrom, yFrom, testMatrix);
      console.log({ xFrom, yFrom, toPoint: { x: toPoint.x, y: toPoint.y } });
      // For "fill", points may be outside, but the scaled rectangle should cover the destination
      // Check that the x and y ranges cover the destination
    });
  }

  console.log("All tests passed!");
}

// Run the tests
runTests();

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
  static getOuterHTML() {
    return pickAny(SampleOutput.all)!.#pathElement.outerHTML;
  }
  protected deAnimate() {
    this.#pathElement
      .getAnimations()
      .forEach((animation) => animation.cancel());
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
  }
  override setPathShape(pathShape: PathShape): void {
    super.setPathShape(pathShape);
    this.svgElement.style.setProperty("--css-path", pathShape.cssPath);
  }
}
new TauFollowingPathSample();

new SampleOutput("#textPathSample");

class ClipAndMaskSupport extends SampleOutput {
  static doItSoon() {
    console.warn("placeholder");
  }
  readonly #mask: SVGMaskElement;
  readonly #maskPath: SVGPathElement;
  constructor() {
    super("#clipAndMaskSupport");
    this.#mask = selectorQuery("mask", SVGMaskElement, this.svgElement);
    this.#maskPath = selectorQuery(
      "mask > path",
      SVGPathElement,
      this.svgElement
    );
    // We will need to redraw any time the size of the image changes.
    // TODO Do we have to do this for the maskImg?  Probably not.
    const resizeObserver = new ResizeObserver(() =>
      ClipAndMaskSupport.doItSoon()
    );
    [this.#clipImg, this.#maskImg].forEach((imageElement) => {
      imageElement.decode().then(() => ClipAndMaskSupport.doItSoon());
      resizeObserver.observe(imageElement);
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
  override setPathShape(pathShape: PathShape): void {
    super.setPathShape(pathShape);

    const bBox = this.measurablePath.getBBox();
    const matrix = computeClipPathTransform(
      bBox,
      {
        x: 0,
        y: 0,
        height: this.#clipImg.clientHeight,
        width: this.#clipImg.clientWidth,
      },
      "fit"
    );

    // The CSS clipPath property doesn't give us a lot of options.
    // We have to manually transform the path from the given size and location to the desired size and location.
    const transformedShape = pathShape.transform(matrix);
    this.#clipImg.style.clipPath = transformedShape.cssPath;

    // Regarding the mask, we have a lot of options, but they don't all make sense.
    // * If I set the <mask>'s properties to maskContentUnits="userSpaceOnUse"
    //   and maskUnits="objectBoundingBox", then it translates the coordinates in the
    //   path using the exact same rules as the the clipPath example.
    //   * So we can use the exact same transformed path, stored in the
    //     transformedShape variable.
    //   * 0,0 in the path corresponds to the top left of the image.
    //   * The numbers use the same scale as image.clientWidth and image.clientHeight
    //   * It appears that the <mask>'s x, y, width and height are ignored in
    //     this setup, but I need to verify that.
    // * If I change maskUnits to "userSpaceOnUse" I get a completely transparent image.
    //   * There was nothing I could find to make the image opaque (aside from changing
    //     maskUnits="objectBoundingBox").
    //   * My suspicion is that the browser doesn't like that combination of
    //     maskContentUnits, maskUnits, and applying the mask to an HTMLElement
    //     (rather than an SVGElement).  It had no good way to report an invalid set
    //     of inputs, so it made everything transparent as a fail-safe.
    //   * My original plan was to use this configuration.
    //   * As I understood the documentation, this configuration would automatically
    //     take care of the transformation between the path's coordinate system and
    //     the target coordinate system.
    //   * That includes automatically recomputing things each time the <img>
    //     changes size!
    //   * This is still my preferred approach.  I'm still poking around, hoping to
    //     fix this approach.

    //this.#maskPath.setAttribute("d", pathShape.rawPath);
    this.#maskPath.setAttribute("d", transformedShape.rawPath);

    // This next block of code says to set the path width to
    // four times the recommended path width.  I.e. thick.
    // This code is more complicated than in other examples
    // because I have to transform the value.
    //
    // TODO Remove a lot of debug code.  I added it because I
    // wasn't sure what I was doing.  Now it's distracting.
    const transformedRecommendedWidth = transform(
      0,
      this.recommendedWidth,
      matrix
    ).y;
    const xScale = matrix.a;
    console.log({
      transformedRecommendedWidth,
      recommendedWidth: this.recommendedWidth,
      xScale,
      matrix,
    });
    this.#maskPath.style.strokeWidth = (
      this.recommendedWidth *
      xScale *
      4
    ).toString();

    this.#mask.setAttribute("x", bBox.x.toString());
    this.#mask.setAttribute("y", bBox.y.toString());
    this.#mask.setAttribute("width", bBox.width.toString());
    this.#mask.setAttribute("height", bBox.height.toString());
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
  const sampleCountInput = getById("segmentCountInput", HTMLInputElement);
  const inputsGroupDiv = getById("inputsGroup", HTMLDivElement);
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

    let pathShape: PathShape;
    try {
      pathShape = PathShape.parametric(f1, sampleCountInput.valueAsNumber);
    } catch (reason: unknown) {
      if (reason instanceof Error) {
        ErrorBox.displayError(reason);
        return;
      } else {
        throw reason;
      }
    }
    SampleOutput.setPathShape(pathShape);
    resultElement.innerText = SampleOutput.getOuterHTML();
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

  const sampleCountSpan = getById("segmentCountSpan", HTMLSpanElement);
  const updateSampleCountSpan = () => {
    sampleCountSpan.innerText = sampleCountInput.value.padStart(
      3,
      FIGURE_SPACE
    );
  };
  updateSampleCountSpan();
  sampleCountInput.addEventListener("input", () => {
    updateSampleCountSpan();
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

  selectorQueryAll("button.show-this", HTMLButtonElement).forEach((button) => {
    const source = assertClass(
      button.parentElement?.nextElementSibling,
      HTMLPreElement
    );
    button.addEventListener("click", () => {
      const formula = source.innerText;
      sourceTextArea.value = formula;
      doItSoon();
      inputsGroupDiv.scrollIntoView({ behavior: "smooth" });
    });
  });

  doItSoon();
}

// TODO
// * Display the path.
//   Try to set the svg's size to match the bBox
//   Special cases:  Vertical line, horizontal line, single point, empty, really big or small values?
//   Try making the viewBox of the svg match the bBox of the path, then adding padding with css.
// * Save the path as an SVG file.
// * Samples
//   Animated dots crawling along the path.
//   The line starts as nothing, grows from one end, when it hits the other end it starts shrinking.
//   Blowing in the wind animation?
//   A tau "creature" following the path, with and without rotations.
// * Sample code.
//   Maybe a button that says "random sample"!! 🙂
// * Display the path length.
//   And the bBox size.
// * Access to TSplitter and related tools through a parameter to the function.
// * Help!
// * Add error handler for the function.
//   There is an error handler for syntax errors.
//   But runtime errors are raised elsewhere.
