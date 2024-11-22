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
