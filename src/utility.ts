// TODO stop copying this and move it to phil-lib.
export class AnimationLoop {
  constructor(private readonly onWake: (time: DOMHighResTimeStamp) => void) {
    this.callback = this.callback.bind(this);
    // This next line isn't quite right.
    // Sometimes this timestamp is greater than the timestamp of the first requestAnimationFrame() callback.
    // TODO fix it.
    this.callback(performance.now());
  }
  #cancelled = false;
  cancel() {
    this.#cancelled = true;
  }
  private callback(time: DOMHighResTimeStamp) {
    if (!this.#cancelled) {
      requestAnimationFrame(this.callback);
      this.onWake(time);
    }
  }
}

// This is dead wrong in phil-lib/misc.ts!!!
export function polarToRectangular(r: number, θ: number) {
  return { x: Math.cos(θ) * r, y: Math.sin(θ) * r };
}

export const phi = (1 + Math.sqrt(5)) / 2;

// I copied dateToFileName() from ../../tournament-bracket/src/main.ts

/**
 *
 * @param date To convert to a string.
 * @returns Like the MySQL format, but avoids the colon because that's not valid in a file name.
 */
export function dateToFileName(date: Date) {
  if (isNaN(date.getTime())) {
    return "0000⸱00⸱00 00⦂00⦂00";
  } else {
    return `${date.getFullYear().toString().padStart(4, "0")}⸱${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}⸱${date.getDate().toString().padStart(2, "0")} ${date
      .getHours()
      .toString()
      .padStart(2, "0")}⦂${date.getMinutes().toString().padStart(2, "0")}⦂${date
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;
  }
}

/**
 * ```
 * const randomValue = lerp(lowestLegalValue, HighestLegalValue, Math.random())
 * ```
 * @param at0 `lerp(at0, at1, 0)` → at0
 * @param at1 `lerp(at0, at1, 1)` → at1
 * @param where
 * @returns
 */
export function lerp(at0: number, at1: number, where: number) {
  return at0 + (at1 - at0) * where;
}

/**
 * This is a wrapper around `isFinite()`.
 * @param values the values to check.
 * @throws If any of the values are not finite, an error is thrown.
 */
export function assertFinite(...values: number[]): void {
  values.forEach((value) => {
    if (!isFinite(value)) {
      throw new Error("wtf");
    }
  });
}

/**
 * Randomly reorder the contents of the array.
 * @param array The array to shuffle.  This is modified in place.
 * @returns The original array.
 */
export function shuffleArray<T>(array: T[]) {
  // https://stackoverflow.com/a/12646864/971955
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * 2π radians.
 */
export const FULL_CIRCLE = 2 * Math.PI;

export const degreesPerRadian = 360 / FULL_CIRCLE;
export const radiansPerDegree = FULL_CIRCLE / 360;

/**
 * Find the shortest path from `angle1` to `angle2`.
 * This will never take the long way around the circle or make multiple loops around the circle.
 *
 * More precisely find `difference` where `positiveModulo(angle1 + difference, FULL_CIRCLE) == positiveModulo(angle2, FULL_CIRCLE)`.
 * Then select the `difference` where `Math.abs(difference)` is smallest.
 * Return the `difference`.
 * @param angle1 radians
 * @param angle2 radians
 * @returns A value to add to `angle1` to get another angle that is equivalent to `angle2`.
 * A value between -π and π.
 */
export function angleBetween(angle1: number, angle2: number) {
  angle1 = positiveModulo(angle1, FULL_CIRCLE);
  angle2 = positiveModulo(angle2, FULL_CIRCLE);
  let difference = angle2 - angle1;
  const maxDifference = FULL_CIRCLE / 2;
  if (difference > maxDifference) {
    difference -= FULL_CIRCLE;
  } else if (difference < -maxDifference) {
    difference += FULL_CIRCLE;
  }
  if (Math.abs(difference) > maxDifference) {
    throw new Error("wtf");
  }
  return difference;
}

/**
 * This is similar to `numerator % denominator`, i.e. modulo division.
 * The difference is that the result will never be negative.
 * If the numerator is negative `%`  will return a negative number.
 *
 * If the 0 point is chosen arbitrarily then you should use `positiveModulo()` rather than `%`.
 * For example, C's `time_t` and JavaScript's `Date.prototype.valueOf()` say that 0 means midnight January 1, 1970.
 * Negative numbers refer to times before midnight January 1, 1970, and positive numbers refer to times after midnight January 1, 1970.
 * But midnight January 1, 1970 was chosen arbitrarily, and you probably don't want to treat times before that differently than times after that.
 * And how many people would even think to test a negative date?
 *
 * `positiveModulo(n, d)` will give the same result as `positiveModulo(n + d, d)` for all vales of `n` and `d`.
 * (You might get 0 sometimes and -0 other times, but those are both `==` so I'm not worried about that.)
 */
export function positiveModulo(numerator: number, denominator: number) {
  const simpleAnswer = numerator % denominator;
  if (simpleAnswer < 0) {
    return simpleAnswer + Math.abs(denominator);
  } else {
    return simpleAnswer;
  }
}

/**
 * Create a new array by rotating another array.
 * @param input The initial array.
 * @param by How many places to rotate left.
 * Negative values mean to the right.
 * This should be a 32 bit integer.
 * 0 and large numbers are handled efficiently.
 */
export function rotateArray<T>(input: ReadonlyArray<T>, by: number) {
  if ((by | 0) != by) {
    throw new Error(`invalid input: ${by}`);
  }
  by = positiveModulo(by, input.length);
  if (by == 0) {
    return input;
  } else {
    return [...input.slice(by), ...input.slice(0, by)];
  }
}

/**
 * This object contains a random number generator.
 * If you want an **exact** copy of this object, you will want to start from the same seed.
 */
export type HasSeed = { readonly seed: string };

/**
 * This provides a random number generator that can be seeded.
 * `Math.rand()` cannot be seeded.  Using a seed will allow
 * me to repeat things in the debugger when my program acts
 * strange.
 */
export class Random {
  /**
   * sfc32 (Simple Fast Counter) is part of the [PractRand](http://pracrand.sourceforge.net/)
   * random number testing suite (which it passes of course).
   * sfc32 has a 128-bit state and is very fast in JS.
   *
   * [Source](https://stackoverflow.com/a/47593316/971955)
   * @param a A 32 bit integer.  The 1st part of the seed.
   * @param b A 32 bit integer.  The 2nd part of the seed.
   * @param c A 32 bit integer.  The 3rd part of the seed.
   * @param d A 32 bit integer.  The 4th part of the seed.
   * @returns A function that will act a lot like `Math.rand()`, but it starts from the given seed.
   */
  private static sfc32(a: number, b: number, c: number, d: number) {
    return function () {
      a |= 0;
      b |= 0;
      c |= 0;
      d |= 0;
      let t = (((a + b) | 0) + d) | 0;
      d = (d + 1) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
  }
  static #nextSeedInt = 42;
  /**
   * Create a new instance of a random number generator.
   * @param seed The result from a previous call to `Random.newSeed()`.
   * By default this will create a new seed.
   * Either way the seed will be sent to the JavaScript console.
   *
   * Typical use:  Use the default until you want to repeat something.
   * Then copy the last seed from the log and use here.
   * @returns A function that can be used as a drop in replacement for `Math.random()`.
   * @throws If the seed is invalid this will `throw` an `Error`.
   */
  static create(seed: string = this.newSeed()) {
    console.info(seed);
    const seedObject: unknown = JSON.parse(seed);
    if (!(seedObject instanceof Array)) {
      throw new Error("invalid seed");
    }
    if (seedObject.length != 4) {
      throw new Error("invalid seed");
    }
    const [a, b, c, d] = seedObject;
    if (
      !(
        typeof a == "number" &&
        typeof b == "number" &&
        typeof c == "number" &&
        typeof d == "number"
      )
    ) {
      throw new Error("invalid seed");
    }
    return this.sfc32(a, b, c, d);
  }
  /**
   *
   * @returns A new seed value appropriate for use in a call to `Random.create()`.
   * This will be reasonably random.
   *
   * The seed is intended to be opaque, a magic cookie.
   * It's something that's easy to copy and paste.
   * Don't try to parse or create one of these.
   */
  static newSeed() {
    const ints: number[] = [];
    ints.push(Date.now());
    ints.push(this.#nextSeedInt++);
    ints.push((Math.random() * 2 ** 31) | 0);
    ints.push((Math.random() * 2 ** 31) | 0);
    const seed = JSON.stringify(ints);
    return seed;
  }
}
