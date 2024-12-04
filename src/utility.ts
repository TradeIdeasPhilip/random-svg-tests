import { assertClass } from "phil-lib/misc";

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
