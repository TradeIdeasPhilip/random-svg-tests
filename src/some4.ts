import {
  AnimationLoop,
  getById,
  querySelector,
  querySelectorAll,
} from "phil-lib/client-misc";
import "./some4.css";
import { ParametricFunction, PathShape } from "./path-shape";
import { initializedArray, lerp, makeLinear, parseIntX } from "phil-lib/misc";

// I used this file to create https://youtu.be/ubVFzZNEphs
// I used https://github.com/TradeIdeasPhilip/html-to-movie to turn this web page into a video.
// Grok did most of my calculations for me:  https://x.com/i/grok/share/dEpxXnbg4GJNp99Da9hi4xTsM
// That video is my submission to the #SoME4 contest:  https://some.3b1b.co/

const FUDGE_FACTOR = 0.0001;

abstract class functionInfo {
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
  /**
   * The function itself.
   * @param x
   */
  abstract f(x: number): number;
  /**
   * More precisely, poles.
   */
  abstract badPoints: readonly {
    readonly real: number;
    readonly imaginary: number;
  }[];
  /**
   *
   * @param x A value that we might want to call the function at.
   * @returns `true` if this function is undefined at that value of x.
   */
  invalid(x: number) {
    return this.badPoints.some(
      ({ real, imaginary }) => x == real && imaginary == 0
    );
  }
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

class Reciprocal extends functionInfo {
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

class Sine extends functionInfo {
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
class HiddenPoles extends functionInfo {
  readonly numberOfTerms = 12;
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
      case 6:
        return (
          (-7700 * x0 ** 6 + 20316 * x0 ** 4 - 9120 * x0 * x0 + 216) /
          (12 * denom ** 7)
        );
      case 7:
        return (
          (x0 * (29718 * x0 ** 4 - 46410 * x0 * x0 + 10869)) / (3 * denom ** 8)
        );
      case 8:
        return (
          (159600 * x0 ** 8 -
            498960 * x0 ** 6 +
            424116 * x0 ** 4 -
            90456 * x0 * x0 +
            2268) /
          (48 * denom ** 9)
        );
      case 9:
        return (
          (x0 *
            (-672452 * x0 ** 6 +
              1660530 * x0 ** 4 -
              987318 * x0 * x0 +
              117693)) /
          (30 * denom ** 10)
        );
      case 10:
        return (
          (8044400 * x0 ** 10 -
            30524376 * x0 ** 8 +
            35128260 * x0 ** 6 -
            13524948 * x0 ** 4 +
            1475730 * x0 * x0 -
            18360) /
          (720 * denom ** 11)
        );
      case 11:
        return (
          (x0 *
            (29887350 * x0 ** 8 -
              96204090 * x0 ** 6 +
              87415950 * x0 ** 4 -
              22994430 * x0 * x0 +
              1596795)) /
          (180 * denom ** 12)
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

const variableBase = document.documentElement.style;

/**
 * The graphic components for displaying one single Taylor expansion.
 */
class TaylorElements {
  readonly #center: SVGCircleElement;
  readonly #bottomCenter: SVGCircleElement;
  readonly #path: SVGPathElement;
  constructor(readonly which: string) {
    this.#center = querySelector(`[data-center="${which}"]`, SVGCircleElement);
    this.#bottomCenter = querySelector(
      `[data-circle-info="${which}"] [data-bottom-center]`,
      SVGCircleElement
    );
    this.#path = querySelector(
      `[data-reconstruction="${which}"]`,
      SVGPathElement
    );
  }
  hide() {
    variableBase.setProperty(`--example${this.which}-open-end-display`, "none");
    this.#center.style.display = "none";
    this.#bottomCenter.style.display = "none";
    this.#path.style.d = "";
  }
  draw2(
    f1: (x: number) => number,
    f2: (x: number) => number,
    t: number,
    center: number,
    radius: number,
    idealF: (x: number) => number
  ) {
    function f(x: number): number {
      const y1 = f1(x);
      const y2 = f2(x);
      const y = y1 * (1 - t) + y2 * t;
      return y;
    }
    this.draw(f, center, radius, idealF);
  }
  draw(
    f: (x: number) => number,
    center: number,
    radius: number,
    idealF: (x: number) => number
  ) {
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
    this.#bottomCenter.style.display = "";
    variableBase.setProperty(`--example${this.which}-center-x`, center + "px");
    variableBase.setProperty(
      `--example${this.which}-center-y`,
      f(center) + "px"
    );
    if (isFinite(radius)) {
      variableBase.setProperty(
        `--example${this.which}-from-x`,
        fromRequested + "px"
      );
      variableBase.setProperty(
        `--example${this.which}-from-y`,
        f(fromRequested) + "px"
      );
      variableBase.setProperty(
        `--example${this.which}-from-y-ideal`,
        idealF(fromRequested) + "px"
      );
      variableBase.setProperty(
        `--example${this.which}-to-x`,
        toRequested + "px"
      );
      variableBase.setProperty(
        `--example${this.which}-to-y`,
        f(toRequested) + "px"
      );
      variableBase.setProperty(
        `--example${this.which}-to-y-ideal`,
        idealF(toRequested) + "px"
      );
      variableBase.setProperty(`--example${this.which}-open-end-display`, "");
    } else {
      variableBase.setProperty(
        `--example${this.which}-open-end-display`,
        "none"
      );
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
    functionInfo: functionInfo,
    x0: number,
    maxTerms: number
  ): (termsToShow: number) => void {
    const radius = functionInfo.radiusOfConvergence(x0);
    const functions = initializedArray(maxTerms, (numberOfTerms) =>
      functionInfo.partialSum(x0, numberOfTerms)
    );
    const result = (termsToShow: number) => {
      if (termsToShow > functions.length - 1) {
        throw new Error(
          `Requested: ${termsToShow}, Available [0 - ${functions.length - 1}]`
        );
      }
      if (Number.isInteger(termsToShow)) {
        this.draw(functions[termsToShow], x0, radius, functionInfo.f);
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
        this.draw(f, x0, radius, functionInfo.f);
      }
    };
    return result;
  }
  drawAll(functionInfo: functionInfo, x0: number, termsToShow: number): void {
    if (functionInfo.invalid(x0)) {
      this.hide();
    } else {
      const radius = functionInfo.radiusOfConvergence(x0);
      if (Number.isInteger(termsToShow)) {
        this.draw(
          functionInfo.partialSum(x0, termsToShow),
          x0,
          radius,
          functionInfo.f
        );
      } else {
        const f1 = functionInfo.partialSum(x0, Math.floor(termsToShow));
        const f2 = functionInfo.partialSum(x0, Math.ceil(termsToShow));
        const t = termsToShow % 1;
        this.draw2(f1, f2, t, x0, radius, functionInfo.f);
      }
    }
  }
  static readonly instances = [new this("1"), new this("2"), new this("3")];
}

class OriginalFunctionElement {
  readonly #path = getById("original-function", SVGPathElement);
  readonly #badPointsG = getById("bad-points", SVGGElement);
  readonly #circlesAllG = getById("circles-all", SVGGElement);
  hide() {
    this.#path.style.d = "";
    this.#circlesAllG.style.display = "none";
  }
  draw(functionInfo: functionInfo, showBadPoints: boolean) {
    if (showBadPoints) {
      this.#circlesAllG.style.display = "";
      this.#badPointsG.innerHTML = "";
      functionInfo.badPoints.forEach((point) => {
        const element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "text"
        );
        element.innerHTML = "⚠️";
        element.setAttribute("x", point.real.toString());
        element.setAttribute("y", point.imaginary.toString());
        this.#badPointsG.appendChild(element);
      });
    } else {
      this.#circlesAllG.style.display = "none";
    }
    // main
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

type Script = {
  show(time: DOMHighResTimeStamp): void;
  initScreenCapture(): {
    firstFrame: number;
    lastFrame: number;
  };
};

class ScriptDispatcher {
  readonly #scripts = new Map<string, Script>();
  addScript(name: string, script: Script) {
    if (!this.#currentScript) {
      this.#currentScript = script;
    }
    if (this.#scripts.has(name)) {
      // Duplicate name.  Probably clone disease.
      throw new Error("wtf");
    }
    this.#scripts.set(name, script);
  }
  #state:
    | { paused: true; timePassed: number }
    | { paused: false; timeOffset: number } = { paused: true, timePassed: 0 };
  get timePassed() {
    if (this.#state.paused) {
      return this.#state.timePassed;
    } else {
      return performance.now() - this.#state.timeOffset;
    }
  }
  get paused() {
    return this.#state.paused;
  }
  pause() {
    if (!this.#state.paused) {
      this.#state = { paused: true, timePassed: this.timePassed };
    }
  }
  play() {
    if (this.#state.paused) {
      this.#state = {
        paused: false,
        timeOffset: performance.now() - this.timePassed,
      };
    }
  }
  set paused(newValue: boolean) {
    if (newValue) {
      this.pause();
    } else {
      this.play();
    }
  }
  restart(script?: unknown) {
    if (typeof script === "string") {
      const newScript = this.#scripts.get(script);
      if (newScript === undefined) {
        throw new Error(`Unknown script: ${script}`);
      }
      this.#currentScript = newScript;
    } else if (typeof script === "number") {
      const scripts = [...this.#scripts.values()];
      const newScript = scripts[script % scripts.length];
      if (newScript === undefined) {
        throw new Error(`Unknown script: ${script}`);
      }
      this.#currentScript = newScript;
    } else if (script === undefined) {
      // explicitly allowed.  keep the existing script.
    } else {
      throw new Error("unknown script type");
    }
    const wasPaused = this.paused;
    this.#state = { timePassed: 0, paused: true };
    this.paused = wasPaused;
  }
  #onAnimationFrame(time: DOMHighResTimeStamp) {
    if (!this.#state.paused) {
      this.show(time - this.#state.timeOffset);
    }
  }

  #currentScript: Script | undefined;
  /**
   * This points to whichever script is currently active.
   */
  show(time: DOMHighResTimeStamp): void {
    variableBase.setProperty("--ms-since-start", time.toString());
    this.#currentScript!.show(time);
  }
  constructor() {
    new AnimationLoop(this.#onAnimationFrame.bind(this));
    (window as any).initScreenCapture = this.initScreenCapture.bind(this);
    (window as any).showFrame = (frame: number) => {
      // Convert from frame number to milliseconds.
      this.show((frame / 60) * 1000);
    };
  }
  static readonly instance = new this();
  initScreenCapture(script: unknown) {
    document
      .querySelectorAll("[data-hideBeforeScreenshot]")
      .forEach((element) => {
        if (
          !(element instanceof SVGElement || element instanceof HTMLElement)
        ) {
          throw new Error("wtf");
        }
        element.style.display = "none";
      });
    if (typeof script == "string") {
      const newScript = this.#scripts.get(script);
      if (newScript) {
        this.#currentScript = newScript;
        const result = newScript.initScreenCapture();
        return { source: "some4.ts", script, devicePixelRatio, ...result };
      }
    }
    throw new Error(`Unknown script: ${JSON.stringify(script)}`);
  }
}

{
  const scriptName = "part 1";

  const MAX_NUMBER_OF_TERMS = 38;
  const HOLD_TIME = 1000;
  const TRANSITION_TIME = 800;
  const END_TIME =
    MAX_NUMBER_OF_TERMS * (TRANSITION_TIME + HOLD_TIME) + HOLD_TIME;

  console.log(`${scriptName} length: ${END_TIME / 1000} seconds.`);

  /**
   * Part 1 shows the 3 taylor expansions for the sine wave, starting at 0 terms, ending with 3 perfect approximations.
   * @param time Measured in frames.
   */
  function show(time: DOMHighResTimeStamp): void {
    if (time < 0) {
      // TODO hide everything??
      return;
    }
    if (time >= END_TIME) {
      // TODO hide everything??
      return;
    }
    const integerNumberOfTerms = Math.floor(
      time / (HOLD_TIME + TRANSITION_TIME)
    );
    const timeWithinTerm =
      time - integerNumberOfTerms * (HOLD_TIME + TRANSITION_TIME);
    const timeWithinTransition = Math.max(0, timeWithinTerm - HOLD_TIME);
    const fraction = timeWithinTransition / TRANSITION_TIME;
    const termsToShow = integerNumberOfTerms + fraction;
    const functionInfo = Sine.instance;
    OriginalFunctionElement.instance.draw(functionInfo, false);
    TaylorElements.instances[0].drawAll(
      functionInfo,
      (-Math.PI * 7) / 4,
      termsToShow
    );
    TaylorElements.instances[1].drawAll(functionInfo, 0, termsToShow);
    TaylorElements.instances[2].drawAll(
      functionInfo,
      (Math.PI * 3) / 2,
      termsToShow
    );
  }

  function initScreenCapture(): {
    firstFrame: number;
    lastFrame: number;
  } {
    return {
      firstFrame: 0,
      lastFrame: Math.floor((END_TIME / 1000) * 60), // Convert from milliseconds to the number of frames.
    };
  }
  ScriptDispatcher.instance.addScript(scriptName, { show, initScreenCapture });
}

{
  const scriptName = "part 2";

  const MAX_NUMBER_OF_TERMS = 20;
  const HOLD_TIME = 1100;
  const TRANSITION_TIME = 900;
  const END_TIME =
    MAX_NUMBER_OF_TERMS * (TRANSITION_TIME + HOLD_TIME) + HOLD_TIME;
  const SLIDER_START_TIME = 13000;
  const SLIDER_END_TIME = 22000;
  const SLIDER_X0 = makeLinear(SLIDER_START_TIME, -9, SLIDER_END_TIME, 9);

  console.log(`${scriptName} length: ${END_TIME / 1000} seconds.`);

  function show(time: DOMHighResTimeStamp): void {
    if (time < 0) {
      // TODO hide everything??
      return;
    }
    if (time >= END_TIME) {
      // TODO hide everything??
      return;
    }
    const integerNumberOfTerms = Math.floor(
      time / (HOLD_TIME + TRANSITION_TIME)
    );
    const timeWithinTerm =
      time - integerNumberOfTerms * (HOLD_TIME + TRANSITION_TIME);
    const timeWithinTransition = Math.max(0, timeWithinTerm - HOLD_TIME);
    const fraction = timeWithinTransition / TRANSITION_TIME;
    const termsToShow = integerNumberOfTerms + fraction;
    const functionInfo = Reciprocal.instance;
    OriginalFunctionElement.instance.draw(functionInfo, false);
    TaylorElements.instances[0].drawAll(functionInfo, -2, termsToShow);
    TaylorElements.instances[1].drawAll(functionInfo, 1, termsToShow);
    if (time < SLIDER_START_TIME || time > SLIDER_END_TIME) {
      TaylorElements.instances[2].hide();
    } else {
      TaylorElements.instances[2].drawAll(
        functionInfo,
        SLIDER_X0(time),
        termsToShow
      );
    }
  }

  function initScreenCapture(): {
    firstFrame: number;
    lastFrame: number;
  } {
    return {
      firstFrame: 0,
      lastFrame: Math.floor((END_TIME / 1000) * 60), // Convert from milliseconds to the number of frames.
    };
  }
  ScriptDispatcher.instance.addScript(scriptName, { show, initScreenCapture });
}

{
  const scriptName = "part 3";

  // Goal 20 seconds.
  const MAX_NUMBER_OF_TERMS = 12;
  const HOLD_TIME = 920;
  const TRANSITION_TIME = 666;
  const END_TIME =
    MAX_NUMBER_OF_TERMS * (TRANSITION_TIME + HOLD_TIME) + HOLD_TIME;

  console.log(`${scriptName} length: ${END_TIME / 1000} seconds.`);

  function show(time: DOMHighResTimeStamp): void {
    if (time < 0) {
      // TODO hide everything??
      return;
    }
    if (time >= END_TIME) {
      // TODO hide everything??
      return;
    }
    const integerNumberOfTerms = Math.floor(
      time / (HOLD_TIME + TRANSITION_TIME)
    );
    const timeWithinTerm =
      time - integerNumberOfTerms * (HOLD_TIME + TRANSITION_TIME);
    const timeWithinTransition = Math.max(0, timeWithinTerm - HOLD_TIME);
    const fraction = timeWithinTransition / TRANSITION_TIME;
    const termsToShow = integerNumberOfTerms + fraction;
    const functionInfo = HiddenPoles.instance;
    OriginalFunctionElement.instance.draw(functionInfo, false);
    TaylorElements.instances[0].drawAll(functionInfo, -1, termsToShow);
    TaylorElements.instances[1].drawAll(functionInfo, 0, termsToShow);
    TaylorElements.instances[2].drawAll(functionInfo, 2, termsToShow);
  }

  function initScreenCapture(): {
    firstFrame: number;
    lastFrame: number;
  } {
    return {
      firstFrame: 0,
      lastFrame: Math.floor((END_TIME / 1000) * 60), // Convert from milliseconds to the number of frames.
    };
  }
  ScriptDispatcher.instance.addScript(scriptName, { show, initScreenCapture });
}

{
  const scriptName = "part 4";

  // Goal 23 seconds.
  const MAX_NUMBER_OF_TERMS = 23;
  const HOLD_TIME = 500;
  const TRANSITION_TIME = 478.5;
  const END_TIME =
    MAX_NUMBER_OF_TERMS * (TRANSITION_TIME + HOLD_TIME) + HOLD_TIME;

  console.log(`${scriptName} length: ${END_TIME / 1000} seconds.`);

  /**
   * Very similar to part 1 but with the radius of convergence showing.
   * @param time Measured in frames.
   */
  function show(time: DOMHighResTimeStamp): void {
    if (time < 0) {
      // TODO hide everything??
      return;
    }
    if (time >= END_TIME) {
      // TODO hide everything??
      return;
    }
    const integerNumberOfTerms = Math.floor(
      time / (HOLD_TIME + TRANSITION_TIME)
    );
    const timeWithinTerm =
      time - integerNumberOfTerms * (HOLD_TIME + TRANSITION_TIME);
    const timeWithinTransition = Math.max(0, timeWithinTerm - HOLD_TIME);
    const fraction = timeWithinTransition / TRANSITION_TIME;
    const termsToShow = integerNumberOfTerms + fraction;
    const functionInfo = Sine.instance;
    OriginalFunctionElement.instance.draw(functionInfo, true);
    TaylorElements.instances[0].drawAll(
      functionInfo,
      (-Math.PI * 7) / 4,
      termsToShow
    );
    TaylorElements.instances[1].drawAll(functionInfo, 0, termsToShow);
    TaylorElements.instances[2].drawAll(
      functionInfo,
      (Math.PI * 3) / 2,
      termsToShow
    );
  }

  function initScreenCapture(): {
    firstFrame: number;
    lastFrame: number;
  } {
    return {
      firstFrame: 0,
      lastFrame: Math.floor((END_TIME / 1000) * 60), // Convert from milliseconds to the number of frames.
    };
  }
  ScriptDispatcher.instance.addScript(scriptName, { show, initScreenCapture });
}

{
  const scriptName = "part 5";

  const MAX_NUMBER_OF_TERMS = 20;
  const HOLD_TIME = 820;
  const TRANSITION_TIME = 640;
  const END_TIME =
    MAX_NUMBER_OF_TERMS * (TRANSITION_TIME + HOLD_TIME) + HOLD_TIME;
  const SLIDER_START_TIME = 22000;
  const SLIDER_END_TIME = 27000;
  const SLIDER_X0 = makeLinear(SLIDER_START_TIME, -9, SLIDER_END_TIME, 9);

  // Goal is 30 seconds.
  console.log(`${scriptName} length: ${END_TIME / 1000} seconds.`);

  function show(time: DOMHighResTimeStamp): void {
    if (time < 0) {
      // TODO hide everything??
      return;
    }
    if (time >= END_TIME) {
      // TODO hide everything??
      return;
    }
    const integerNumberOfTerms = Math.floor(
      time / (HOLD_TIME + TRANSITION_TIME)
    );
    const timeWithinTerm =
      time - integerNumberOfTerms * (HOLD_TIME + TRANSITION_TIME);
    const timeWithinTransition = Math.max(0, timeWithinTerm - HOLD_TIME);
    const fraction = timeWithinTransition / TRANSITION_TIME;
    const termsToShow = integerNumberOfTerms + fraction;
    const functionInfo = Reciprocal.instance;
    OriginalFunctionElement.instance.draw(functionInfo, true);
    TaylorElements.instances[0].drawAll(functionInfo, -2, termsToShow);
    TaylorElements.instances[1].drawAll(functionInfo, 1, termsToShow);
    if (time < SLIDER_START_TIME || time > SLIDER_END_TIME) {
      TaylorElements.instances[2].hide();
    } else {
      TaylorElements.instances[2].drawAll(
        functionInfo,
        SLIDER_X0(time),
        termsToShow
      );
    }
  }

  function initScreenCapture(): {
    firstFrame: number;
    lastFrame: number;
  } {
    return {
      firstFrame: 0,
      lastFrame: Math.floor((END_TIME / 1000) * 60), // Convert from milliseconds to the number of frames.
    };
  }
  ScriptDispatcher.instance.addScript(scriptName, { show, initScreenCapture });
}

{
  const scriptName = "part 6";

  // Goal 80 seconds.
  // The first 60 are the most important.
  // The lines will start jumping around more after that.
  const MAX_NUMBER_OF_TERMS = 7;
  const PERIOD = 10000;
  const END_TIME = (1 + MAX_NUMBER_OF_TERMS) * PERIOD;

  console.log(`${scriptName} length: ${END_TIME / 1000} seconds.`);

  const HALF_PERIOD = PERIOD / 2;
  const goLeft = makeLinear(0, -7, HALF_PERIOD, 7);
  const goRight = makeLinear(HALF_PERIOD, 7, PERIOD, -7);

  function show(time: DOMHighResTimeStamp): void {
    if (time < 0) {
      // TODO hide everything??
      return;
    }
    if (time >= END_TIME) {
      // TODO hide everything??
      return;
    }
    const termsToShow = (time / PERIOD) | 0;
    const phase = time % PERIOD;
    const x0 = phase < HALF_PERIOD ? goLeft(phase) : goRight(phase);
    const functionInfo = HiddenPoles.instance;
    OriginalFunctionElement.instance.draw(functionInfo, true);
    TaylorElements.instances[0].hide();
    TaylorElements.instances[1].hide();
    TaylorElements.instances[2].drawAll(functionInfo, x0, termsToShow);
  }

  function initScreenCapture(): {
    firstFrame: number;
    lastFrame: number;
  } {
    return {
      firstFrame: 0,
      lastFrame: Math.floor((END_TIME / 1000) * 60), // Convert from milliseconds to the number of frames.
    };
  }
  ScriptDispatcher.instance.addScript(scriptName, { show, initScreenCapture });
}

(window as any).debugStuff = {
  HiddenPoles,
  Sine,
  Reciprocal,
  TaylorElements,
  ScriptDispatcher,
};
console.log("debugStuff", (window as any).debugStuff);

{
  const functionSelectElement = querySelector(
    "#manual-controls select",
    HTMLSelectElement
  );
  const numberOfTermsInputElement = querySelector(
    "#manual-controls > input",
    HTMLInputElement
  );
  const [fewerTermsButton, moreTermsButton] = querySelectorAll(
    "[data-term-stepper] button",
    HTMLButtonElement,
    2,
    2
  );
  const numberOfTermsSpan = querySelector(
    "[data-term-stepper] span",
    HTMLSpanElement
  );
  const x0Elements = querySelectorAll(
    "#manual-controls > div[data-x0]",
    HTMLDivElement,
    3,
    3
  ).map((parent) => {
    const [use, value] = querySelectorAll(
      "input",
      HTMLInputElement,
      2,
      2,
      parent
    );
    use.addEventListener("input", drawItSoon);
    value.addEventListener("input", () => {
      use.checked = true;
      drawItSoon();
    });
    return { use, value };
  });
  const showBadPointsInput = getById("show-bad-points", HTMLInputElement);
  function drawItSoon() {
    drawItNow();
  }
  function drawItNow() {
    const x0s = x0Elements.map(({ use, value }) => {
      if (use.checked) {
        return value.valueAsNumber;
      } else {
        return undefined;
      }
    });
    debugDraw(
      parseIntX(functionSelectElement.value)!,
      showBadPointsInput.checked,
      numberOfTermsInputElement.valueAsNumber,
      ...x0s
    );
  }
  functionSelectElement.addEventListener("input", drawItSoon);
  let fewerTerms = NaN;
  let moreTerms = NaN;
  function numberOfTermsChanged() {
    const currentValue = numberOfTermsInputElement.valueAsNumber;
    if (Number.isInteger(currentValue)) {
      fewerTerms = Math.max(0, currentValue - 1);
      moreTerms = Math.min(12, currentValue + 1);
    } else {
      fewerTerms = Math.floor(currentValue);
      moreTerms = Math.ceil(currentValue);
    }
    numberOfTermsSpan.innerText = currentValue.toFixed(3);
    fewerTermsButton.innerText = fewerTerms.toString();
    moreTermsButton.innerText = moreTerms.toString();
  }
  numberOfTermsInputElement.addEventListener("input", () => {
    numberOfTermsChanged();
    drawItSoon();
  });
  fewerTermsButton.addEventListener("click", () => {
    numberOfTermsInputElement.value = fewerTerms.toString();
    numberOfTermsChanged();
    drawItSoon();
  });
  moreTermsButton.addEventListener("click", () => {
    numberOfTermsInputElement.value = moreTerms.toString();
    numberOfTermsChanged();
    drawItSoon();
  });
  showBadPointsInput.addEventListener("input", drawItSoon);
  numberOfTermsChanged();
  drawItSoon();
}

/**
 * This function shows off all of the functionality on this page!
 * @param sampleIndex Which function to display.  An integer.
 * @param termsToShow How many terms to show.  Not limited to an integer.
 * @param x0s The center for each of the Taylor series.  `undefined` or an invalid value (e.g. leads to division by 0) means to hide the series.
 */
function debugDraw(
  sampleIndex: number,
  showBadPoints: boolean,
  termsToShow: number,
  ...x0s: (number | undefined)[]
) {
  const samples = [Sine.instance, Reciprocal.instance, HiddenPoles.instance];
  const functionInfo = samples[sampleIndex % samples.length];
  OriginalFunctionElement.instance.draw(functionInfo, showBadPoints);
  TaylorElements.instances.forEach((display, index) => {
    const x0 = x0s[index];
    if (x0 === undefined) {
      display.hide();
    } else {
      display.drawAll(functionInfo, x0, termsToShow);
    }
  });
}
(window as any).debugDraw = debugDraw;
