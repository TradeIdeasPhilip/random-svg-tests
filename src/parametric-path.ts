import { getById } from "phil-lib/client-misc";
import "./style.css";
import "./parametric-path.css";
import { ParametricFunction, PathShape, Point } from "./path-shape";
import { selectorQuery, selectorQueryAll } from "./utility";
import { assertClass, FIGURE_SPACE, pickAny } from "phil-lib/misc";
import { panAndZoom } from "./transforms";

const goButton = getById("go", HTMLButtonElement);
const sourceTextArea = getById("source", HTMLTextAreaElement);
const resultElement = getById("result", HTMLElement);

sourceTextArea.addEventListener("input", () => (goButton.disabled = false));

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

/**
 * This class shows a way to set a clip-path to a path string, and how to apply
 * an SVG <mask> using mask-image.
 *
 * These two examples share a lot of code.  They both apply to an HTML element,
 * typically an <img>.  And in both cases this class has to transform the path
 * from one coordinate system to another.  And in both cases we have to listen
 * for changes in the <img>'s size.
 *
 * This process requires an SVG for support.  Typically that SVG would be hidden.
 * But for the sake of this demo we are displaying the SVG.  Notice the
 * instructions, found in other comments, on the correct way to hide the SVG.
 *
 * TODO We need two additional examples.  We need an example using a <clipPath>
 * instead of an explicit path string for the clip-path.  And we need a different
 * way to use the mask-image property.  The idea is to create an SVG for the
 * mask, but the whole SVG is the mask, there is no <mask> element.  Normally
 * that SVG would be hidden, but for the sake of this demo we'll display it.
 * We convert that SVG into a data-url and load that into
 *
 * Both of these new examples will have the same advantage over the two existing
 * examples:  The old examples required programming work to deal with resizing
 * the paths to match the <img> elements.  The new examples will leverage more
 * css tools, like "mask-size: contain;", to take care of those details.
 *
 * The new clip-path example, like the existing mask-image example, will require
 * an SVG object for the lifetime of the effect.  The next mask-image example,
 * like the existing clip-path example, will require an SVG for some one time
 * setup, but that will output a string which can be copied into a css property
 * without any further support.
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
    const matrix = panAndZoom(
      bBox,
      {
        x: 0,
        y: 0,
        height: this.#clipImg.clientHeight,
        width: this.#clipImg.clientWidth,
      },
      "fit"
    );

    // We have to manually transform the path from the given size and location to the desired size and location.
    const transformedShape = pathShape.transform(matrix);
    this.#clipImg.style.clipPath = transformedShape.cssPath;
    this.#maskPath.setAttribute("d", transformedShape.rawPath);

    // This next block of code says to set the path width to
    // four times the recommended path width.  I.e. thick.
    // This code is more complicated than in other examples
    // because I have to scale the value.
    const xScale = matrix.a;
    this.#maskPath.style.strokeWidth = (
      this.recommendedWidth *
      xScale *
      4
    ).toString();
  }
}
new ClipAndMaskSupport();

class ClipPathSample extends SampleOutput {
  readonly #innerSvg: SVGSVGElement;
  constructor() {
    super("#clipPathSampleSupport");
    this.#innerSvg = selectorQuery(
      "clipPath svg",
      SVGSVGElement,
      this.svgElement
    );
  }

  override setPathShape(pathShape: PathShape): void {
    super.setPathShape(pathShape);
    const bBox = this.pathElement.getBBox();
    const viewBox = `${bBox.x} ${bBox.y} ${bBox.width} ${bBox.height}`;
    this.#innerSvg.setAttribute("viewBox", viewBox);
  }
}
new ClipPathSample();

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
// * Save the path as an SVG file.
// * Samples
//   Blowing in the wind animation?
// * Sample code:  Maybe a button that says "random sample"!! 🙂
// * Display the path length.
//   And the bBox size.
//   And display the path as a cssPath, as in a css file, possibly in an @keyframes
// * Access to TSplitter and related tools through a parameter to the function.
// * Better error handlers.
//   Sometimes it just says "WTF"
//   And NaN is reported as "null" in the error messages.
