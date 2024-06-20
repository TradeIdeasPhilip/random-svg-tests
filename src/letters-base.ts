import { PathShape } from "./path-shape";

export class FontMetrics {
  /**
   * The height of a capital M.  1em in css.
   */
  get mHeight() {
    return this.fontSize;
  }
  /**
   * The height of a lower case x.
   */
  get xHeight() {
    return this.fontSize * 0.5;
  }
  /**
   * The width of a capital A.
   */
  get aWidth() {
    return this.fontSize * 0.75;
  }
  /**
   * The width of a 0, 1, ..., or 9.
   *
   * A lot of other characters use this same width because they are designed the same way as the digits.
   */
  get digitWidth() {
    return this.fontSize * 0.5;
  }
  /**
   * Put this much space between adjacent characters.
   */
  get defaultKerning() {
    return this.strokeWidth * 2.5;
  }
  /**
   * The recommended width for a normal space.
   */
  get spaceWidth() {
    return this.strokeWidth + this.digitWidth / 2;
  }
  get top() {
    return this.capitalTop - this.mHeight / 4;
  }
  /**
   * The y coordinate for the top of most capital letters.
   */
  get capitalTop() {
    return this.baseline - this.mHeight;
  }
  /**
   * Exactly half way between capitalTop and capitalMiddle.
   */
  get capitalTopMiddle() {
    return (this.capitalTop + this.capitalMiddle) / 2;
  }
  /**
   * The y coordinate for the mid line for E, F, G, H, etc.
   */
  get capitalMiddle() {
    return this.baseline - this.xHeight;
  }
  /**
   * Exactly half way between capitalMiddle  and baseline.
   */
  get capitalBottomMiddle() {
    return (this.baseline + this.capitalMiddle) / 2;
  }
  /**
   * The bottom of most letters, but not the descenders.
   *
   * The baseline is often used to line up different elements.
   */
  get baseline() {
    return 0;
  }
  /**
   * The y coordinate for the bottom of letters like g, y, p, q, and j.
   */
  get descender() {
    return this.mHeight / 4;
  }
  get bottom() {
    return this.descender + this.mHeight / 4;
  }

  /**
   *
   * @param fontSize How tall to make the font.
   * This is measured in svg units.
   * This is typically (but not always) the same as the mHeight.
   * @param strokeWidth The expected stroke width.
   * This is mostly ignored, by choice, but that's not always possible.
   */
  constructor(
    public readonly fontSize: number,
    public readonly strokeWidth = fontSize / 10
  ) {
    if (fontSize <= 0 || !isFinite(fontSize)) {
      throw new Error("wtf");
    }
  }
}

export class DescriptionOfLetter {
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
