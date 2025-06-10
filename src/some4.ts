import { getById } from "phil-lib/client-misc";
import "./some4.css";
import { selectorQuery, selectorQueryAll } from "./utility";
import { ParametricFunction, PathShape } from "./path-shape";
import { initializedArray, lerp } from "phil-lib/misc";

const FUDGE_FACTOR = 0.0001;

abstract class TaylorBase {
  abstract readonly numberOfTerms: number;
  abstract constant(x0: number, termNumber: number): number;
  /**
   * This exists only as a clear and simple example of how you could use this.constant().
   * See this.partialSum() for a real but more complicated example.
   * @param x Estimate the function at this value, f(x).
   * @param x0 Compute the Taylor series around this point.
   * @param numberOfTerms Use exactly this many terms of the Taylor series when estimating the value of f(x)
   * @returns f(x), as estimated with the given parameters.
   */
  compute(x: number, x0: number, numberOfTerms: number) {
    let result = 0;
    for (let termNumber = 0; termNumber < numberOfTerms; termNumber++) {
      const constant = this.constant(x0, termNumber);
      result += constant * (x - x0) ** termNumber;
    }
    return result;
  }
  abstract f(x: number): number;
  abstract badPoints: readonly {
    readonly real: number;
    readonly imaginary: number;
  }[];
  validRanges() {
    const badXs = this.badPoints
      .flatMap(({ real, imaginary }) => {
        if (imaginary == 0) {
          return [real];
        } else {
          return [];
        }
      })
      .sort((a, b) => a - b);
    badXs.push(Infinity);
    const result = badXs.map((endX, index, array) => {
      const startX = array[index - 1] ?? -Infinity;
      return { from: startX + FUDGE_FACTOR, to: endX - FUDGE_FACTOR };
    });
    return result;
  }
  radiusOfConvergence(x0: number) {
    return Math.min(
      ...this.badPoints.map((badPoint) =>
        Math.hypot(x0 - badPoint.real, badPoint.imaginary)
      )
    );
  }
  /**
   *
   * @param x0 Create the Taylor series centered around this point.
   * @param numberOfTerms Use exactly this many terms of the Taylor series when estimating the value of f(x).
   * @returns A function that approximates f(x).
   */
  partialSum(x0: number, numberOfTerms: number) {
    const constants = initializedArray(numberOfTerms, (index) =>
      this.constant(x0, index)
    );
    function partialSum(x: number) {
      const factor = x - x0;
      let result = 0;
      constants.forEach(
        (constant, index) => (result += constant * factor ** index)
      );
      return result;
    }
    return partialSum;
  }
}

class Reciprocal extends TaylorBase {
  readonly numberOfTerms = Infinity;
  override constant(x0: number, termNumber: number): number {
    if (x0 === 0) {
      throw new Error("Reciprocal is undefined at x0 = 0");
    }
    return (-1) ** termNumber / x0 ** (termNumber + 1);
  }
  override f(x: number) {
    if (x === 0) {
      throw new Error("Reciprocal is undefined at x = 0");
    }
    return 1 / x;
  }
  static readonly instance = new this();
  readonly badPoints = [{ real: 0, imaginary: 0 }];
}

class Sine extends TaylorBase {
  readonly numberOfTerms = Infinity;
  override constant(x0: number, termNumber: number): number {
    // Compute sin(x0 + n * π/2) / n!
    const angle = x0 + (termNumber * Math.PI) / 2;
    let factorial = 1;
    for (let i = 1; i <= termNumber; i++) {
      factorial *= i;
    }
    return Math.sin(angle) / factorial;
  }
  override f(x: number) {
    return Math.sin(x);
  }
  static readonly instance = new this();
  readonly badPoints = [];
}

/**
 * 1 / (1 + x*x)
 */
class HiddenPoles extends TaylorBase {
  readonly numberOfTerms = 6;
  override constant(x0: number, termNumber: number): number {
    const denom = 1 + x0 * x0;
    switch (termNumber) {
      case 0:
        return 1 / denom;
      case 1:
        return (-2 * x0) / denom ** 2;
      case 2:
        return (3 * x0 * x0 - 1) / denom ** 3;
      case 3:
        return (2 * x0 * (3 - 5 * x0 * x0)) / denom ** 4;
      case 4:
        return (25 * x0 ** 4 - 38 * x0 * x0 + 3) / (2 * denom ** 5);
      case 5:
        return (
          (x0 * (2842 * x0 * x0 - 1450 * x0 ** 4 - 636)) / (5 * denom ** 6)
        );
      default:
        throw new Error(`Term ${termNumber} not implemented.`);
    }
  }
  override f(x: number) {
    return 1 / (1 + x * x);
  }
  static readonly instance = new this();
  readonly badPoints = [
    { real: 0, imaginary: 1 },
    { real: 0, imaginary: -1 },
  ];
}

/**
 * The graphic components for displaying one single Taylor expansion.
 */
class TaylorElements {
  readonly #openStart: SVGCircleElement;
  readonly #openEnd: SVGCircleElement;
  readonly #center: SVGCircleElement;
  readonly #path: SVGPathElement;
  constructor(which: string) {
    [this.#openStart, this.#openEnd] = selectorQueryAll(
      `[data-open-end="${which}"]`,
      SVGCircleElement,
      2,
      2
    );
    this.#center = selectorQuery(`[data-center="${which}"]`, SVGCircleElement);
    this.#path = selectorQuery(
      `[data-reconstruction="${which}"]`,
      SVGPathElement
    );
  }
  hide() {
    this.#openStart.style.display = "none";
    this.#openEnd.style.display = "none";
    this.#center.style.display = "none";
    this.#path.style.d = "";
  }
  draw2(
    f1: (x: number) => number,
    f2: (x: number) => number,
    t: number,
    center: number,
    radius: number
  ) {
    function f(x: number): number {
      const y1 = f1(x);
      const y2 = f2(x);
      const y = y1 * (1 - t) + y2 * t;
      return y;
    }
    this.draw(f, center, radius);
  }
  draw(f: (x: number) => number, center: number, radius: number) {
    radius -= FUDGE_FACTOR;
    if (radius <= 0) {
      throw new Error("wtf");
    }
    const fromLimit = -9;
    const toLimit = 9;
    const fromRequested = center - radius;
    const toRequested = center + radius;
    const from = Math.max(fromLimit, fromRequested);
    const to = Math.min(toLimit, toRequested);
    const p: ParametricFunction = (t: number) => {
      const x = lerp(from, to, t);
      const y = f(x);
      return { x, y };
    };
    const shape = PathShape.parametric(p, 50);
    this.#path.style.d = shape.cssPath;
    this.#center.style.display = "";
    this.#center.cx.baseVal.value = center;
    this.#center.cy.baseVal.value = f(center);
    if (isFinite(radius)) {
      this.#openStart.style.display = "";
      this.#openEnd.style.display = "";
      this.#openStart.cx.baseVal.value = fromRequested;
      this.#openStart.cy.baseVal.value = f(fromRequested);
      this.#openEnd.cx.baseVal.value = toRequested;
      this.#openEnd.cy.baseVal.value = f(toRequested);
    } else {
      this.#openStart.style.display = "none";
      this.#openEnd.style.display = "none";
    }
  }
  /**
   * If you plan to fix x0 and adjust the number of terms, this is a nice starting place.
   * @param functionInfo What to plot.
   * @param x0 The center of the Taylor expansion.
   * @param maxTerms The maximum number of terms that you plan to request.
   * You can request fewer, but not more.
   * @returns A function that will configure this set of elements.
   * It takes a single input, the number of terms to use.
   * If that is not an integer, we linearly interpolate between the two nearest integer values.
   * This will draw the given function using the given x0 and the given number of terms.
   */
  precompute(
    functionInfo: TaylorBase,
    x0: number,
    maxTerms: number
  ): (termsToShow: number) => void {
    const radius = functionInfo.radiusOfConvergence(x0);
    const functions = initializedArray(maxTerms, (numberOfTerms) =>
      functionInfo.partialSum(x0, numberOfTerms)
    );
    const result = (termsToShow: number) => {
      if (Number.isInteger(termsToShow)) {
        this.draw(functions[termsToShow], x0, radius);
      } else {
        const f1 = functions[Math.floor(termsToShow)];
        const f2 = functions[Math.ceil(termsToShow)];
        const t = termsToShow % 1;
        function f(x: number): number {
          const y1 = f1(x);
          const y2 = f2(x);
          const y = y1 * (1 - t) + y2 * t;
          return y;
        }
        this.draw(f, x0, radius);
      }
    };
    return result;
  }
  drawAll(functionInfo: TaylorBase, x0: number, termsToShow: number): void {
    // TODO
    [functionInfo, x0, termsToShow];
  }
  static readonly instances = [new this("1"), new this("2"), new this("3")];
}

class OriginalFunctionElement {
  readonly #path = getById("original-function", SVGPathElement);
  hide() {
    this.#path.style.d = "";
  }
  draw(functionInfo: TaylorBase) {
    const fromLimit = -9;
    const toLimit = 9;
    const commands = functionInfo.validRanges().flatMap((range) => {
      const from = Math.max(fromLimit, range.from);
      const to = Math.min(toLimit, range.to);
      if (from >= to) {
        return [];
      } else {
        const p: ParametricFunction = (t: number) => {
          const x = lerp(from, to, t);
          const y = functionInfo.f(x);
          return { x, y };
        };
        const shape = PathShape.parametric(p, Math.ceil((to - from) * 5));
        return shape.commands;
      }
    });
    const shape = new PathShape(commands);
    this.#path.style.d = shape.cssPath;
  }
  static readonly instance = new this();
}

console.log({ HiddenPoles, Sine, Reciprocal, TaylorElements });

{
  /**
   * Debug stuff.  Change the value of f here to plot a different functions.
   */
  const f = HiddenPoles.instance;
  OriginalFunctionElement.instance.draw(f);
  function drawIt(draw: TaylorElements, x0: number) {
    const radius = f.radiusOfConvergence(x0);
    draw.draw(f.f, x0, radius);
  }
  drawIt(TaylorElements.instances[0], -2);
  drawIt(TaylorElements.instances[1], 1);
  drawIt(TaylorElements.instances[2], 2.5);

  /**
   * This is available as a global variable.
   *
   * `fff(2);` will redraw all three curves using 2 terms of the taylor expansion.
   * If the input is not an integer, then `fff` will linearly interpolate between the closest two integer values.
   */
  const fff = TaylorElements.instances[0].precompute(
    f,
    -2,
    Math.min(30, f.numberOfTerms)
  );
  console.log(fff);
  (window as any).fff = fff;
  fff(HiddenPoles.instance.numberOfTerms - 1);
}
