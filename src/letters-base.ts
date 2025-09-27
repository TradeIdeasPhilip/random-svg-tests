import { pickAny } from "phil-lib/misc";
import { PathShape } from "./path-shape";

export type FontMetrics = {
  /**
   * The height of a capital M.  1em in css.
   *
   * `mHeight` is often but not necessarily the requested font size.
   */
  readonly mHeight: number;
  /**
   * Put this much space between adjacent characters.
   */
  readonly defaultKerning: number;
  /**
   * The font reserves the space between `top` and `bottom` for itself.
   */
  readonly top: number;
  /**
   * The font reserves the space between `top` and `bottom` for itself.
   */
  readonly bottom: number;
  /**
   * The y coordinate for the top of most capital letters.
   */
  readonly capitalTop: number;
  /**
   * The expected stroke width.
   */
  readonly strokeWidth: number;
  /**
   * The recommended width for a normal space.
   */
  readonly spaceWidth: number;
  // baseLine is now frozen at 0!!!!!
};

export class DescriptionOfLetter {
  /**
   * Create a new `DescriptionOfLetter` object exactly like this one but with a different shape.
   * @param newShape Replace the existing shape with this.
   * @returns The new `DescriptionOfLetter` object.
   */
  reshape(newShape: PathShape) {
    return new DescriptionOfLetter(newShape, this.advance, this.fontMetrics);
  }
  readonly #shapeFactory: () => PathShape;
  get shape() {
    return this.#shapeFactory();
  }
  constructor(
    shape: PathShape | (() => PathShape),
    /**
     * How far to advance the print head after printing this character.
     * In SVG units.
     * Typically the "black" area of the character will start at x=0 and end at x=advance.
     */
    public readonly advance: number,
    public readonly fontMetrics: FontMetrics
  ) {
    if (shape instanceof PathShape) {
      this.#shapeFactory = () => shape;
    } else {
      this.#shapeFactory = shape;
    }
  }
  /**
   * This is in the right format for a lot of _css properties_.
   *
   * If you are planning to set the d _attribute_ of an element, use this.d instead.
   */
  get cssPath() {
    return this.shape.cssPath;
  }
  get d() {
    return this.shape.rawPath;
  }
  /**
   * Create a new element to draw this letter.
   * @returns This is always a <path> element.
   *
   * I considered making that a <g> element.
   * But see makeElements(), translate(), etc. instead.
   * The focus of this project is creating and
   * manipulating paths.
   */
  makeElement(): SVGPathElement {
    return this.shape.makeElement();
  }
  /**
   *
   * @returns One element per continuous part of the path.
   */
  makeElements() {
    return this.shape.splitOnMove().map((innerShape) => ({
      innerShape,
      element: innerShape.makeElement(),
    }));
  }
}

/**
 * Order is explicitly undefined.
 * The order is based on the most convenient implementation and is likely to change.
 */
export type Font = Map<string, DescriptionOfLetter>;

export function resizeFont(originalFont: Font, newSize: number): Font {
  const newFont: Font = new Map();
  const originalFontMetrics = pickAny(originalFont)?.fontMetrics;
  if (originalFontMetrics) {
    const ratio = newSize / originalFontMetrics.mHeight;
    const newFontMetrics: FontMetrics = {
      bottom: ratio * originalFontMetrics.bottom,
      capitalTop: ratio * originalFontMetrics.capitalTop,
      defaultKerning: ratio * originalFontMetrics.defaultKerning,
      mHeight: ratio * originalFontMetrics.mHeight,
      spaceWidth: ratio * originalFontMetrics.spaceWidth,
      strokeWidth: ratio * originalFontMetrics.strokeWidth,
      top: ratio * originalFontMetrics.top,
    };
    const matrix = new DOMMatrix();
    matrix.scaleSelf(ratio);
    originalFont.forEach((originalLetter, key) => {
      if (originalLetter.fontMetrics != originalFontMetrics) {
        // Expecting all letters to come from the same font.
        throw new Error("wtf");
      }
      const newLetter = new DescriptionOfLetter(
        originalLetter.shape.transform(matrix),
        originalLetter.advance * ratio,
        newFontMetrics
      );
      newFont.set(key, newLetter);
    });
  }
  return newFont;
}

export function describeFont(font: Font) {
  /**
   *
   * @param s Something printable.  I.e. a key in a font.
   * @returns true for normal things like `2` or `9` or `A`,
   * false for special things like `9b` or `2a`.
   */
  function isNormalChar(s: string) {
    // This is not great.  Remember that s.length doesn't always equal [...s].length.
    // This will work for ASCII, so it's good enough for now.
    return s.length == 1;
  }

  let normal = "";
  let special: DescriptionOfLetter[] = [];
  font.forEach((value, key) => {
    if (isNormalChar(key)) {
      normal += key;
    } else {
      special.push(value);
    }
  });
  return { normal, special };
}

/**
 * Export a font as a simple JSON-able object.
 *
 * This is mostly aimed at my new graphics library and the Hershey fonts.
 * https://github.com/TradeIdeasPhilip/handwriting-effect/tree/master/src/glib#g-lib
 * There is no reason to decode and recreate those fonts the way we do every time I might want to use them.
 * Instead, I build and test those fonts here in random-svg-tests, and export a file that doesn't need much work or magic to decode.
 *
 * Notice that resizeFont() will work perfectly on the Hershey fonts.
 *
 * makeLineFont() actually returns different things depending on its input, and resizeFont() is not enough to fix it.
 * So I copied the entire makeLineFont() function to the new library, quirks and all.
 * @param font To be exported.
 * @returns A JSON friendly object with enough information to rebuild this font.
 */
export function fontToJSON(font: Font) {
  const fontMetrics = (font.get("0") ?? pickAny(font))?.fontMetrics;
  if (!fontMetrics) {
    throw new Error("wtf");
  }
  const { top, bottom, spaceWidth, strokeWidth, defaultKerning, mHeight } =
    fontMetrics;
  const letters: { key: string; d: string; advance: number }[] = Array.from(
    font,
    ([key, descriptionOfLetter]) => {
      const { d, advance } = descriptionOfLetter;
      return { key, d, advance };
    }
  );
  return {
    top,
    bottom,
    spaceWidth,
    strokeWidth,
    kerning: defaultKerning,
    mHeight,
    letters,
  };
}
