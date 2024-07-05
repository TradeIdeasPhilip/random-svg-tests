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

