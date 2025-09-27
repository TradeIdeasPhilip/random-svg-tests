import {
  angleBetween,
  assertClass,
  assertFinite,
  makeBoundedLinear,
  parseIntX,
  positiveModulo,
  sum,
} from "phil-lib/misc";

// TODO Mark selectorQuery() and selectorQueryAll() as deprecated, in favor of these.
// I created the previously named versions by mistake.  I wasn't paying attention.

/**
 * This is a wrapper around `document.querySelectorAll()`.
 * This is analogous to `getById()`.
 *
 * This includes a lot of assertions.
 * These have good error messages aimed at a developer.
 * The assumption is that you will run this very early in the main program and store the results in a constant.
 * If there is a problem we want to catch it ASAP.
 *
 * You can set the min and max number of elements.
 * That's another thing that's good to check early.
 * The default range is 1 - Infinity.
 * Set `min` to 0 to completely disable this test.
 *
 * @param selector What you are looking for.  E.g. `"[data-precisionIssues]"`
 * @param ty The expected type of the items.  E.g. `SVGTextElement`
 * @param min The minimum number of items allowed.  Defaults to 1.
 * @param max The maximum number of items allowed.  Defaults to Infinity.
 * @returns An array containing all of the objects that matches the selector.
 * @throws If we don't get the right number of objects or if any of the objects have the wrong type.
 */
export function querySelectorAll<T extends Element>(
  selector: string,
  ty: { new (): T },
  min = 1,
  max = Infinity,
  start: Pick<Document, "querySelectorAll"> = document
): readonly T[] {
  const result: T[] = [];
  start.querySelectorAll(selector).forEach((element) => {
    result.push(assertClass(element, ty));
  });
  if (result.length < min || result.length > max) {
    throw new Error(
      `Expecting "${selector}" to return [${min} - ${max}] instances of ${ty.name}, found ${result.length}.`
    );
  }
  return result;
}

/**
 * This is a wrapper around `document.querySelector()`.
 *
 * This looks for elements matching the query string.
 * This ensures that exactly one element matches the query string, and that element has the expected type.
 * @param selector What to search for.  E.g. `"#main p:first-child"`
 * @param ty The expected type.  E.g. `HTMLParagraphElement`
 * @param start Where to look for the element.  Defaults to `window.document`.
 * @returns The new element.
 * @throws If we don't find the object, we find multiple matching objects or we find an object of the wrong type.
 */
export function querySelector<T extends Element>(
  selector: string,
  ty: { new (): T },
  start: Pick<Document, "querySelectorAll"> = document
): T {
  return querySelectorAll(selector, ty, 1, 1, start)[0];
}

export function averageAngle(angle1: number, angle2: number) {
  const between = angleBetween(angle1, angle2);
  return angle1 + between / 2;
}

/**
 * Look up a value in an array.
 *
 * If the array is empty, throw an Error.
 * Otherwise this always returns an element from the array.
 *
 * If the index is in range, this is the same as array[index].
 * -1 refers to the last valid index, as in array.at().
 * However, this function goes even further.
 * It's like the array's contents are repeated over and over forever in both directions.
 * @param array Look in here.
 * @param index At this index.
 * @returns The value in that place.
 * @throws If the array is empty, throw an error.
 */
export function getMod<T>(array: readonly T[], index: number): T {
  if (array.length == 0) {
    throw new Error("empty array");
  }
  index = positiveModulo(index, array.length);
  return array[index];
}

/**
 * Assert that `t` is between 0 and 1, inclusive.
 * This type of value is used to control a lot of animations.
 * 0 is the start of the animation, 1 is the end.
 * @param
 */
export function assertValidT(t: number) {
  if (!(Number.isFinite(t) && t >= 0 && t <= 1)) {
    throw new Error(`t should be between 0 and 1, inclusive. t == ${t}`);
  }
}

/**
 * A way to split up the schedule of an animation into smaller parts for the sub-animations.
 * Typically you'd call this once in the setup part of the main program.
 * This will return a function that you will call once for each animation frame.
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
export function makeTSplitter(...weights: number[]) {
  weights.forEach((weight) => {
    if (!(weight >= 0 && weight < Number.MAX_SAFE_INTEGER)) {
      throw new Error("wtf");
    }
  });
  const total = sum(weights);
  if (total == 0) {
    throw new Error("wtf");
  }
  const splitter = (t: number) => {
    assertValidT(t);
    t *= total;
    for (let index = 0; index < weights.length; index++) {
      const weight = weights[index];
      if (t <= weight) {
        t /= weight;
        return { t, index };
      }
      t -= weight;
    }
    throw new Error("wtf");
  };
  return splitter;
}

/**
 * A way to split up the schedule of an animation into smaller parts for the sub-animations.
 * Typically you'd call this once in the setup part of the main program.
 * This will return a function that you will call once for each animation frame.
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
export function makeTSplitterA(
  preWeight: number,
  binCount: number,
  postWeight: number
) {
  const totalWeight = preWeight + binCount + postWeight;
  const importantPart = makeBoundedLinear(
    preWeight / totalWeight,
    0,
    (preWeight + binCount) / totalWeight,
    1
  );
  const splitter = (t: number) => {
    assertValidT(t);
    const biggerT = importantPart(t) * binCount;
    const index = Math.min(biggerT | 0, binCount - 1);
    const tWithinBin = biggerT - index;
    assertValidT(tWithinBin);
    return { t: tWithinBin, index };
  };
  return splitter;
}

/**
 * Creates a new function f() from one number to another where:
 *   * y = f(x) defines a parabola,
 *   * f(0) = 0,
 *   * f(1) = 1, and
 *   * f′(1) ÷ f′(0) = r
 *
 * This is nice for timing functions.
 * If showFrame(t) moves a circle from left to right at a constant pace,
 * and f = constantAcceleration(2),
 * then showFrame(f(t)) would show the circle move along the same path,
 * but constantly accelerating.
 * @param r The ratio between the derivative at x=1 and at x=0.
 *
 * 1 means constant speed, 0 acceleration.
 * I.e. a straight line.
 * This returns the identity function.
 *
 * Larger numbers lead to faster acceleration.
 * Smaller numbers lead to faster deceleration, i.e. slowing down.
 *
 * A negative value will cause the function to overshoot the value f(x)=1 and pull back to 1.
 * That's usually bad for a timing function.
 * @returns The new function.
 */
export function constantAcceleration(r: number) {
  const b = 2 / (r + 1);
  const a = 1 - b;
  const result = (t: number) => a * t * t + b * t;
  return result;
}

/**
 * This includes functions for converting from
 * minutes, seconds and frames into just frames.
 *
 * All accessor functions are pre-bound to the object, so it's safe to say:
 * `const convert = new GetFrameNumber(60).fromString;`
 *
 * This object is frozen to make sure the two functions and the accessor don't get out of sync.
 *
 * @deprecated
 */
export class GetFrameNumber {
  #framesPerSecond: number;
  constructor(framesPerSecond: number = 60) {
    assertFinite(framesPerSecond);
    if (framesPerSecond < 1 || framesPerSecond != (framesPerSecond | 0)) {
      throw new Error("wtf");
    }
    this.#framesPerSecond = framesPerSecond;
    this.fromMSF = this.fromMSF.bind(this);
    this.fromString = this.fromString.bind(this);
    Object.freeze(this);
  }
  get framesPerSecond() {
    return this.#framesPerSecond;
  }
  fromMSF(minute: number, second: number, frameNumber: number): number {
    return (minute * 60 + second) * this.#framesPerSecond + frameNumber;
  }
  fromString(time: string): number {
    const pieces = /^([0-9]+):([0-9]+):([0-9]+)$/.exec(time);
    if (!pieces) {
      throw new Error("wtf");
    }
    const minutes = parseIntX(pieces[1]);
    const seconds = parseIntX(pieces[2]);
    const frames = parseIntX(pieces[3]);
    if (
      minutes === undefined ||
      seconds === undefined ||
      frames === undefined
    ) {
      throw new Error("wtf");
    }
    const result = this.fromMSF(minutes, seconds, frames);
    return result;
  }
}

/**
 * This converts a linear timing to an eased timing.
 * This is similar to "ease" or "ease-in-out"
 * @param t A value between 0 and 1.
 * @returns A value between 0 and 1.
 */
export function ease(t: number): number {
  const angle = t * Math.PI;
  const cosine = Math.cos(angle);
  const result = (1 - cosine) / 2;
  return result;
}
