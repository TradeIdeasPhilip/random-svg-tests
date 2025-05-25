import { getById } from "phil-lib/client-misc";
import "./style.css";
import "./parametric-path.css";
import { ParametricFunction, PathShape, Point } from "./path-shape";
import { selectorQuery, selectorQueryAll } from "./utility";
import { assertClass, FIGURE_SPACE, pickAny } from "phil-lib/misc";

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
    this.#pathElement = assertClass(
      this.#svgElement.firstElementChild,
      SVGPathElement
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
  setD(d: string) {
    this.#pathElement.setAttribute("d", d);
    this.#panAndZoom();
  }
  static setD(d: string) {
    this.all.forEach((sampleOutput) => sampleOutput.setD(d));
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
  override setD(d: string): void {
    super.setD(d);
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
  override setD(d: string): void {
    super.setD(d);
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
  override setD(d: string): void {
    super.setD(d);
    this.svgElement.style.setProperty("--css-path", PathShape.cssifyPath(d));
  }
}
new TauFollowingPathSample();

new SampleOutput("#textPathSample");

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

    let d: string;
    try {
      d = PathShape.parametric(f1, sampleCountInput.valueAsNumber).rawPath;
    } catch (reason: unknown) {
      if (reason instanceof Error) {
        ErrorBox.displayError(reason);
        return;
      } else {
        throw reason;
      }
    }
    SampleOutput.setD(d);
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
      sourceTextArea.scrollIntoView({ behavior: "smooth" });
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
