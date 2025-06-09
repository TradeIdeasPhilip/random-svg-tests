import { getById } from "phil-lib/client-misc";
import "./some4.css";
import { selectorQuery, selectorQueryAll } from "./utility";
import { ParametricFunction, PathShape } from "./path-shape";
import { lerp } from "phil-lib/misc";

const FUDGE_FACTOR = 0.0001;

abstract class TaylorBase {
  abstract readonly numberOfTerms: number;
  abstract constant(x0: number, termNumber: number): number;
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
  const f = Reciprocal.instance;
  OriginalFunctionElement.instance.draw(f);
  function drawIt(draw: TaylorElements, x0: number) {
    const radius = f.radiusOfConvergence(x0);
    draw.draw(f.f, x0, radius);
  }
  drawIt(TaylorElements.instances[0], -2);
  drawIt(TaylorElements.instances[1], 1);
  drawIt(TaylorElements.instances[2], 2.5);
}
