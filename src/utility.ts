import { assertClass, pick, sum } from "phil-lib/misc";

const previousCountPrivate = new Map<string, number>();
/**
 *
 * This is mostly aimed at debugging.
 * In C++ I'd add something like this as a static variable within a function, right where I need it.
 * In TypeScript I have to make a global variable or a class static variable.
 * That's just not always convenient.
 * Especially when I'm moving the debug code from one place to another.
 * @param key Each key gets its own counter.
 * This function call replaces a variable, so think of key as the variable name.
 * @returns 0 the first time you call this on a specific key.
 * 1 the second time.
 * 2 the third time. etc.
 */
export function previousCount(key: string): number {
  const result = previousCountPrivate.get(key) ?? 0;
  previousCountPrivate.set(key, result + 1);
  return result;
}

/**
 * This is a wrapper around `window.selectorQueryAll()`.
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
 * @param min The minimum number of items allowed.
 * @param max The maximum number of items allowed.
 * @returns An array containing all of the objects that matches the selector.
 * @throws If we don't get the right number of objects or if any of the objects have the wrong type.
 */
export function selectorQueryAll<T extends Element>(
  selector: string,
  ty: { new (): T },
  min = 1,
  max = Infinity
): readonly T[] {
  const result: T[] = [];
  document.querySelectorAll(selector).forEach((element) => {
    result.push(assertClass(element, ty));
  });
  if (result.length < min || result.length > max) {
    throw new Error(
      `Expecting "${selector}" to return [${min} - ${max}] instances of ${ty.name}, found ${result.length}.`
    );
  }
  return result;
}

type RandomFunction = {
  readonly currentSeed: string;
  (): number;
};

/**
 * This provides a random number generator that can be seeded.
 * `Math.rand()` cannot be seeded.  Using a seed will allow
 * me to repeat things in the debugger when my program acts
 * strange.
 *
 * I temporarily copied this from phil-lib so I could add some
 * features.  TODO merge it back in.
 */
export class Random {
  private constructor() {
    throw new Error("wtf");
  }
  /**
   * Creates a new random number generator using the sfc32 algorithm.
   *
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
  private static sfc32(
    a: number,
    b: number,
    c: number,
    d: number
  ): RandomFunction {
    function random() {
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
    }
    const result = random as RandomFunction;
    Object.defineProperty(result, "currentSeed", {
      get() {
        return JSON.stringify([a, b, c, d]);
      },
    });
    return result;
  }
  static #nextSeedInt = 42;
  static seedIsValid(seed: string): boolean {
    try {
      this.create(seed);
      return true;
    } catch {
      return false;
    }
  }
  static create(seed = this.newSeed()): RandomFunction {
    console.info(seed);
    const seedObject: unknown = JSON.parse(seed);
    if (!(seedObject instanceof Array)) {
      throw new Error("invalid input");
    }
    if (seedObject.length != 4) {
      throw new Error("invalid input");
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
      throw new Error("invalid input");
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
    ints.push(Date.now() | 0);
    ints.push(this.#nextSeedInt++ | 0);
    ints.push((Math.random() * 2 ** 31) | 0);
    ints.push((performance.now() * 10000) | 0);
    const seed = JSON.stringify(ints);
    return seed;
  }
  static test() {
    const maxGenerators = 10;
    const iterationsPerCycle = 20;
    const generators = [this.create()];
    while (generators.length <= maxGenerators) {
      for (let iteration = 0; iteration < iterationsPerCycle; iteration++) {
        const results = generators.map((generator) => generator());
        for (let i = 1; i < results.length; i++) {
          if (results[i] !== results[0]) {
            debugger;
            throw new Error("wtf");
          }
        }
      }
      const currentSeed = pick(generators).currentSeed;
      generators.forEach((generator) => {
        if (generator.currentSeed != currentSeed) {
          debugger;
          throw new Error("wtf");
        }
      });
      generators.push(this.create(currentSeed)!);
    }
  }
}

(window as any).Random = Random;

export function assertValidT(t: number) {
  if (!(isFinite(t) && t >= 0 && t <= 1)) {
    throw new Error(`t should be between 0 and 1, inclusive. t == ${t}`);
  }
}

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
  const splitter =(t:number) => {
    assertValidT(t);
    t *= total;
    for (let index = 0; index < weights.length; index++) {
      const weight = weights[index];
      if (t <= weight) {
        t /= weight;
        return {t, index};
      }
      t -= weight;
    }
    throw new Error("wtf");
  }
  return splitter;
}

/**
 * Asserts that the value is not `undefined` or `null`.
 * Similar to ! or NonNullable, but also performs the check at runtime.
 * @param value The value to check and return.
 * @returns The given value.
 * @throws If `value === undefined || value === null`.
 */
export function assertNonNullable<T>(value : T) : NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error("wtf");
  }
  return value;
}