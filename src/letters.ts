import { getById } from "phil-lib/client-misc";
import "./style.css";

const svg = getById("main", SVGSVGElement);

class FontMetrics {
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

/**
 * This is a way to manipulate a path shape.
 * I.e. to create a string like "path('M 1,2 L 3,5')".
 *
 * The only real output is that string.
 * However, there will be other ways to
 */
class PathShape {
  #x = NaN;
  #y = NaN;
  #soFar = "";
  get x() {
    return this.#x;
  }
  get y() {
    return this.#y;
  }
  constructor(x: number, y: number) {
    this.M(x, y);
  }
  M(x: number, y: number) {
    if (!(isFinite(x) && isFinite(y))) {
      throw new Error("wtf");
    }
    this.#x = x;
    this.#y = y;
    this.#soFar += `M${x},${y}`;
    return this;
  }
  H(x: number) {
    if (!isFinite(x)) {
      throw new Error("wtf");
    }
    this.#x = x;
    this.#soFar += `H${x}`;
    return this;
  }
  V(y: number) {
    if (!isFinite(y)) {
      throw new Error("wtf");
    }
    this.#y = y;
    this.#soFar += `V${y}`;
    return this;
  }
  L(x: number, y: number) {
    if (!(isFinite(x) && isFinite(y))) {
      throw new Error("wtf");
    }
    this.#x = x;
    this.#y = y;
    this.#soFar += `L${x},${y}`;
    return this;
  }
  Q(x1: number, y1: number, x2: number, y2: number) {
    if (!(isFinite(x1) && isFinite(y1) && isFinite(x2) && isFinite(y2))) {
      throw new Error("wtf");
    }
    this.#x = x2;
    this.#y = y2;
    this.#soFar += `Q${x1},${y1} ${x2},${y2}`;
    return this;
  }
  /**
   * This adds a new Q command to the shape.
   * The caller explicitly supplies the second control point.
   * This automatically computes the first control point.
   * This assumes the incoming angle is horizontal and the outgoing angle is vertical.
   * @param x The x for both control points.
   * @param y The y for the final control point.
   */
  Q_HV(x: number, y: number) {
    return this.Q(x, this.y, x, y);
  }
  /**
   * This adds a new Q command to the shape.
   * The caller explicitly supplies the second control point.
   * This automatically computes the first control point.
   * This assumes the incoming angle is vertical and the outgoing angle is horizontal.
   * @param x The x for the final control point.
   * @param y The y for both control points.
   */
  Q_VH(x: number, y: number) {
    return this.Q(this.x, y, x, y);
  }
  static cssifyPath(path: string) {
    return `path('${path}')`;
  }
  get cssPath() {
    return PathShape.cssifyPath(this.#soFar);
  }
}

class DescriptionOfLetter {
  constructor(
    public readonly letter: string,
    public readonly shape: PathShape,
    /**
     * How far to advance the print head after printing this character.
     * In SVG units.
     * Typically the "black" area of the character will start at x=0 and send at x=advance.
     */
    public readonly advance: number,
    public readonly fontMetrics: FontMetrics
  ) {}
  /**
   * This is in the right format for a lot of _css properties_.
   *
   * If you are planning to set the d _attribute_ of an element, use this.d instead.
   */
  get cssPath() {
    return this.shape.cssPath;
  }
  /**
   * Create a new element to draw this letter.
   * @returns Currently this is always a <path> element.
   * I might or might not want to change that to be a <g> element.
   */
  makeElement(): SVGElement {
    const pathElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    pathElement.style.d = this.cssPath;
    return pathElement;
  }
}

/**
 * This seems silly.  Is size really the only input?
 * I'm not sure that the size should be fixed at this time.
 * And it seems like fontMetrics should be the input.
 * @param fontSize The M height in svg units.
 * @returns A new font.
 */
function makeLineFont(fontSize: number) {
  const result = new Map<string, DescriptionOfLetter>();
  const fontMetrics = new FontMetrics(fontSize);
  const add = (letter: string, shape: PathShape, advance: number) => {
    const description = new DescriptionOfLetter(
      letter,
      shape,
      advance,
      fontMetrics
    );
    result.set(description.letter, description);
  };
  const {
    aWidth,
    digitWidth,
    capitalTop,
    capitalTopMiddle,
    capitalMiddle,
    capitalBottomMiddle,
    baseline,
  } = fontMetrics;
  const left = 0;
  {
    const advance = digitWidth;
    const radius = advance / 2;
    const center = radius;
    const right = advance;
    {
      // MARK: 0
      const shape = new PathShape(center, capitalTop)
        .Q(right, capitalTop, right, capitalTopMiddle)
        .L(right, capitalBottomMiddle)
        .Q(right, baseline, center, baseline)
        .Q(left, baseline, left, capitalBottomMiddle)
        .L(left, capitalTopMiddle)
        .Q(left, capitalTop, center, capitalTop);
      add("0", shape, advance);
    }
    {
      // MARK: 1
      const shape = new PathShape(left, capitalTopMiddle)
        .Q(center, capitalTopMiddle, center, capitalTop)
        .L(center, baseline)
        .M(left, baseline)
        .L(right, baseline);
      add("1", shape, advance);
    }
    {
      // MARK: 2
      const shape = new PathShape(left, capitalTopMiddle)
        .Q_VH(center, capitalTop)
        .Q_HV(right, capitalTopMiddle)
        .Q_VH(center, capitalMiddle)
        .Q_HV(left, baseline)
        .L(right, baseline);
      add("2", shape, advance);
    }
    {
      const shape = new PathShape(left, capitalTopMiddle)
        .Q_VH(center, capitalTop)
        .Q_HV(right, capitalTopMiddle)
        .Q_VH(center, capitalBottomMiddle)
        .Q_HV(left, baseline)
        .L(right, baseline);
      add("2a", shape, advance);
    }
    {
      // MARK: 3
      const shape = new PathShape(left, capitalTopMiddle)
        .Q_VH(center, capitalTop)
        .Q_HV(right, capitalTopMiddle)
        .Q_VH(center, capitalMiddle)
        .Q_HV(right, capitalBottomMiddle)
        .Q_VH(center, baseline)
        .Q_HV(left, capitalBottomMiddle);
      add("3", shape, advance);
    }
    {
      // MARK: 4
      const centerRight = (center + right) / 2;
      const centerLeft = (center + left) / 2;
      const shape = new PathShape(right, capitalMiddle)
        .L(left, capitalMiddle)
        .L(centerLeft, capitalTop)
        .M(centerRight, capitalTop)
        .L(centerRight, baseline);
      add("4", shape, advance);
    }
    {
      const shape = new PathShape(right, capitalTop)
        .L(right, baseline)
        .M(right, capitalMiddle)
        .L(left, capitalMiddle)
        .Q_HV(center, capitalTop);
      add("4a", shape, advance);
    }
    {
      const shape = new PathShape(right, capitalTop)
        .L(right, baseline)
        .M(right, capitalMiddle)
        .L(left, capitalMiddle)
        .L(left, capitalTop);
      add("4b", shape, advance);
    }
    {
      const shape = new PathShape(right, capitalTop)
        .L(right, baseline)
        .M(right, capitalMiddle)
        .L(left, capitalMiddle)
        .L((left + center) / 2, capitalTop);
      add("4c", shape, advance);
    }
    {
      const centerRight = (center + right) / 2;
      const shape = new PathShape(centerRight, baseline)
        .L(centerRight, capitalTop)
        .L(left, capitalMiddle)
        .L(right, capitalMiddle);
      add("4d", shape, advance);
    }
    {
      // MARK: 5
      const centerLeft = left + digitWidth / 5;
      const centerRight = right - digitWidth / 5;
      const curveMiddle = (capitalMiddle + capitalBottomMiddle) / 2;
      const shape = new PathShape(centerRight, capitalTop)
        .L(centerLeft, capitalTop)
        .L(left, capitalMiddle)
        .Q_VH(center, capitalTopMiddle)
        .Q_HV(right, curveMiddle)
        .Q_VH(center, baseline)
        .Q_HV(left, capitalBottomMiddle);
      add("5", shape, advance);
    }
    {
      // MARK: 6
      const shape = new PathShape(right, capitalTop)
        .Q_HV(left, capitalBottomMiddle)
        .Q_VH(center, baseline)
        .Q_HV(right, capitalBottomMiddle)
        .Q_VH(center, capitalMiddle)
        .Q_HV(left, capitalBottomMiddle);
      add("6", shape, advance);
    }
    {
      // MARK: 7
      const shape = new PathShape(left, capitalTop)
        .L(right, capitalTop)
        .L(left, baseline);
      add("7", shape, advance);
    }
    {
      // MARK: 8
      const shape = new PathShape(center, capitalTop)
        .Q(right, capitalTop, right, capitalTopMiddle)
        .Q(right, capitalMiddle, center, capitalMiddle)
        .Q(left, capitalMiddle, left, capitalBottomMiddle)
        .Q(left, baseline, center, baseline)
        .Q(right, baseline, right, capitalBottomMiddle)
        .Q(right, capitalMiddle, center, capitalMiddle)
        .Q(left, capitalMiddle, left, capitalTopMiddle)
        .Q(left, capitalTop, center, capitalTop);
      add("8", shape, advance);
    }
    {
      // MARK: 9
      const shape = new PathShape(right, capitalTopMiddle)
        .Q(right, capitalTop, center, capitalTop)
        .Q(left, capitalTop, left, capitalTopMiddle)
        .Q(left, capitalMiddle, center, capitalMiddle)
        .Q(right, capitalMiddle, right, capitalTopMiddle)
        .Q(right, baseline, left, baseline);
      add("9", shape, advance);
    }
    {
      const shape = new PathShape(right, capitalTopMiddle)
        .Q(right, capitalTop, center, capitalTop)
        .Q(left, capitalTop, left, capitalTopMiddle)
        .Q(left, capitalMiddle, center, capitalMiddle)
        .Q(right, capitalMiddle, right, capitalTopMiddle)
        .L(right, baseline);
      add("9a", shape, advance);
    }
    {
      const shape = new PathShape(right, capitalTopMiddle)
        .Q(right, capitalTop, center, capitalTop)
        .Q(left, capitalTop, left, capitalTopMiddle)
        .Q(left, capitalMiddle, center, capitalMiddle)
        .Q(right, capitalMiddle, right, capitalTopMiddle)
        .L(right, capitalBottomMiddle)
        .Q(right, baseline, center, baseline)
        .Q(left, baseline, left, capitalBottomMiddle);
      add("9b", shape, advance);
    }
    {
      const shape = new PathShape(right, capitalTopMiddle)
        .Q(right, capitalTop, center, capitalTop)
        .Q(left, capitalTop, left, capitalTopMiddle)
        .Q(left, capitalMiddle, center, capitalMiddle)
        .Q(right, capitalMiddle, right, capitalTopMiddle)
        .Q(right, baseline, center, baseline)
        .Q(left, baseline, left, capitalBottomMiddle);
      add("9c", shape, advance);
    }
  }

  {
    // MARK: A
    const shape = new PathShape(left, baseline)
      .L(aWidth / 2, capitalTop)
      .L(fontMetrics.aWidth, baseline)
      .M(fontMetrics.aWidth / 4, capitalMiddle)
      .L(fontMetrics.aWidth * 0.75, capitalMiddle);
    add("A", shape, aWidth);
  }
  {
    // MARK: B
    const advance = digitWidth;
    const topRadius = capitalTopMiddle - capitalTop;
    if (topRadius <= 0) {
      throw new Error("wtf");
    }
    const topLineLength = (advance - topRadius) * (2 / 3);
    const bottomRadius = baseline - capitalBottomMiddle;
    if (bottomRadius <= 0) {
      throw new Error("wtf");
    }
    const bottomLineLength = advance - bottomRadius;
    const shape = new PathShape(left, capitalTop)
      .L(left, baseline)
      .L(bottomLineLength, baseline)
      .M(Math.max(bottomLineLength, topLineLength), capitalMiddle)
      .L(left, capitalMiddle)
      .M(left, capitalTop)
      .L(topLineLength, capitalTop)
      .Q(
        topLineLength + topRadius,
        capitalTop,
        topLineLength + topRadius,
        capitalTop + topRadius
      )
      .Q(topLineLength + topRadius, capitalMiddle, topLineLength, capitalMiddle)
      .M(bottomLineLength, capitalMiddle)
      .Q(
        bottomLineLength + bottomRadius,
        capitalMiddle,
        bottomLineLength + bottomRadius,
        baseline - bottomRadius
      )
      .Q(bottomLineLength + bottomRadius, baseline, bottomLineLength, baseline);
    add("B", shape, advance);
  }
  {
    // MARK: C
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const shape = new PathShape(x2, capitalTopMiddle)
      .Q(x2, capitalTop, x1, capitalTop)
      .Q(left, capitalTop, left, capitalTopMiddle)
      .L(left, capitalBottomMiddle)
      .Q(left, baseline, x1, baseline)
      .Q(x2, baseline, x2, capitalBottomMiddle);
    add("C", shape, advance);
  }
  {
    // MARK: D
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const shape = new PathShape(left, capitalTop)
      .L(left, baseline)
      .L(x1, baseline)
      .Q(x2, baseline, x2, capitalBottomMiddle)
      .L(x2, capitalTopMiddle)
      .Q(x2, capitalTop, x1, capitalTop)
      .L(left, capitalTop);
    add("D", shape, advance);
  }
  {
    // MARK: E
    const advance = digitWidth;
    const x1 = advance * (2 / 3);
    const x2 = advance;
    const shape = new PathShape(x2, capitalTop)
      .L(left, capitalTop)
      .L(left, baseline)
      .L(x2, baseline)
      .M(x1, capitalMiddle)
      .L(left, capitalMiddle);
    add("E", shape, advance);
  }
  {
    // MARK: F
    const advance = digitWidth;
    const x1 = advance * (2 / 3);
    const x2 = advance;
    const shape = new PathShape(x2, capitalTop)
      .L(left, capitalTop)
      .L(left, baseline)
      .M(x1, capitalMiddle)
      .L(left, capitalMiddle);
    add("F", shape, advance);
  }
  {
    // MARK: G
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const shape = new PathShape(x2, capitalTopMiddle)
      .Q(x2, capitalTop, x1, capitalTop)
      .Q(left, capitalTop, left, capitalTopMiddle)
      .L(left, capitalBottomMiddle)
      .Q(left, baseline, x1, baseline)
      .Q(x2, baseline, x2, capitalBottomMiddle)
      .L(x2, capitalMiddle)
      .L(x1, capitalMiddle);
    add("G", shape, advance);
  }
  {
    // MARK: H
    const advance = digitWidth;
    const x1 = advance;
    const shape = new PathShape(left, capitalTop)
      .L(left, baseline)
      .M(x1, capitalTop)
      .L(x1, baseline)
      .M(left, capitalMiddle)
      .L(x1, capitalMiddle);
    add("H", shape, advance);
  }
  {
    // MARK: I
    const advance = fontMetrics.mHeight / 3;
    const x1 = advance / 2;
    const x2 = advance;
    const shape = new PathShape(left, capitalTop)
      .L(x2, capitalTop)
      .M(left, baseline)
      .L(x2, baseline)
      .M(x1, capitalTop)
      .L(x1, baseline);
    add("I", shape, advance);
  }
  {
    // MARK: J
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const shape = new PathShape(x2, capitalTop)
      .L(x2, capitalBottomMiddle)
      .Q(x2, baseline, x1, baseline)
      .Q(left, baseline, left, capitalBottomMiddle);
    add("J", shape, advance);
  }
  {
    // MARK: K
    const advance = digitWidth + fontMetrics.strokeWidth;
    const middle = (capitalTop + baseline) / 2;
    const shape = new PathShape(left, capitalTop)
      .L(left, baseline)
      .M(advance, capitalTop)
      .L(left + 0.5, middle)
      .L(advance, baseline);
    add("K", shape, advance);
  }
  {
    // MARK: L
    const advance = digitWidth;
    const shape = new PathShape(left, capitalTop)
      .L(left, baseline)
      .L(advance, baseline);
    add("L", shape, advance);
  }
  {
    // MARK: M
    const advance = digitWidth * 1.5;
    const center = advance / 2;
    const shape = new PathShape(left, baseline)
      .L(left, capitalTop)
      .L(center, capitalMiddle)
      .L(advance, capitalTop)
      .L(advance, baseline);
    add("M", shape, advance);
  }
  {
    // MARK: N
    const advance = digitWidth * 1.2;
    const shape = new PathShape(left, baseline)
      .L(left, capitalTop)
      .L(advance, baseline)
      .L(advance, capitalTop);
    add("N", shape, advance);
  }
  {
    // MARK: O
    const advance = digitWidth * 1.5;
    const center = advance / 2;
    const middle = (capitalTop + baseline) / 2;
    const shape = new PathShape(center, capitalTop)
      .Q_HV(advance, middle)
      .Q_VH(center, baseline)
      .Q_HV(left, middle)
      .Q_VH(center, capitalTop);
    add("O", shape, advance);
  }
  {
    // MARK: P
    const advance = digitWidth;
    const radius = capitalMiddle - capitalTopMiddle;
    if (radius <= 0) {
      throw new Error("wtf");
    }
    const x1 = advance - radius;
    const shape = new PathShape(left, capitalTop)
      .L(left, baseline)
      .M(left, capitalTop)
      .L(x1, capitalTop)
      .Q_HV(advance, capitalTopMiddle)
      .Q_VH(x1, capitalMiddle)
      .L(left, capitalMiddle);
    add("P", shape, advance);
  }
  {
    // MARK: Q
    const advance = digitWidth * 1.5;
    const center = advance / 2;
    const middle = (capitalTop + baseline) / 2;
    const shape = new PathShape(center, capitalTop)
      .Q_HV(advance, middle)
      .Q_VH(center, baseline)
      .Q_HV(left, middle)
      .Q_VH(center, capitalTop)
      .M(advance - center * 0.75, baseline - center * 0.75)
      .L(advance + center / 6, baseline + center / 6);
    add("Q", shape, advance);
  }
  {
    // MARK: R
    const advance = digitWidth;
    const radius = capitalMiddle - capitalTopMiddle;
    if (radius <= 0) {
      throw new Error("wtf");
    }
    const x1 = advance - radius;
    const shape = new PathShape(left, capitalTop)
      .L(left, baseline)
      .M(left, capitalTop)
      .L(x1, capitalTop)
      .Q_HV(advance, capitalTopMiddle)
      .Q_VH(x1, capitalMiddle)
      .L(left, capitalMiddle)
      .M(x1, capitalMiddle)
      .L(advance, baseline);
    add("R", shape, advance);
  }
  {
    const advance = digitWidth;
    const radius = capitalMiddle - capitalTopMiddle;
    if (radius <= 0) {
      throw new Error("wtf");
    }
    const x1 = advance - radius;
    const shape = new PathShape(left, capitalTop)
      .L(left, baseline)
      .M(left, capitalTop)
      .L(x1, capitalTop)
      .Q_HV(advance, capitalTopMiddle)
      .Q_VH(x1, capitalMiddle)
      .L(left, capitalMiddle)
      .L(advance, baseline);
    add("Ra", shape, advance);
  }
  {
    // MARK: S
    // This is basically a subset of the 8 with he direction is reversed.
    const advance = digitWidth;
    const center = digitWidth / 2;
    const right = digitWidth;
    const shape = new PathShape(right, capitalTopMiddle)
      .Q_VH(center, capitalTop)
      .Q_HV(left, capitalTopMiddle)
      .Q_VH(center, capitalMiddle)
      .Q_HV(right, capitalBottomMiddle)
      .Q_VH(center, baseline)
      .Q_HV(left, capitalBottomMiddle);
    add("S", shape, advance);
  }
  {
    // MARK: T
    const advance = digitWidth;
    const center = advance / 2;
    const shape = new PathShape(center, capitalTop)
      .L(center, baseline)
      .M(advance, capitalTop)
      .L(left, capitalTop);
    // Down then back.  That's how I do it every time.
    add("T", shape, advance);
  }
  // MARK: U
  {
    const advance = digitWidth;
    const center = advance / 2;
    const shape = new PathShape(left, capitalTop)
      .V(capitalBottomMiddle)
      .Q_VH(center, baseline)
      .Q_HV(advance, capitalBottomMiddle)
      .V(capitalTop);
    add("U", shape, advance);
  }
  // MARK: V
  {
    const advance = aWidth;
    const center = advance / 2;
    const shape = new PathShape(left, capitalTop)
      .L(center, baseline)
      .L(advance, capitalTop);
    add("V", shape, advance);
  }
  // MARK: W
  {
    const advance = aWidth * 1.5;
    const x1 = advance / 3;
    const x2 = advance / 2;
    const x3 = x1 * 2;
    const shape = new PathShape(left, capitalTop)
      .L(x1, baseline)
      .L(x2, capitalMiddle)
      .L(x3, baseline)
      .L(advance, capitalTop);
    add("W", shape, advance);
  }
  // MARK: X
  {
    const advance = digitWidth;
    const shape = new PathShape(advance, capitalTop)
      .L(left, baseline)
      .M(left, capitalTop)
      .L(advance, baseline);
    add("X", shape, advance);
  }
  // MARK: Y
  {
    const extra = fontMetrics.strokeWidth;
    const advance = digitWidth + extra;
    const shape = new PathShape(advance, capitalTop)
      .L(extra, baseline)
      .M(left, capitalTop)
      .L(advance / 2, capitalMiddle);
    add("Y", shape, advance);
  }
  // MARK: Z
  {
    const advance = digitWidth;
    const shape = new PathShape(left, capitalTop)
      .H(advance)
      .L(left, baseline)
      .H(advance);
    add("Z", shape, advance);
  }
  // MARK: a
  {
    const base = digitWidth;
    const extra = fontMetrics.strokeWidth / 2;
    const advance = base + extra;
    const center = base / 2;
    const shape = new PathShape(center, capitalMiddle)
      .Q_HV(left, capitalBottomMiddle)
      .Q_VH(center, baseline)
      .Q_HV(base, capitalBottomMiddle)
      .Q_VH(center, capitalMiddle)
      .M(advance, capitalMiddle)
      .L(advance, baseline);
    add("a", shape, advance);
  }
  // MARK: b
  {
    const base = digitWidth;
    const extra = fontMetrics.strokeWidth / 2;
    const advance = base + extra;
    const circleLeft = extra;
    const circleCenter = extra + base / 2;
    const circleRight = advance;
    const shape = new PathShape(left, capitalTop)
      .V(baseline)
      .M(circleLeft, capitalBottomMiddle)
      .Q_VH(circleCenter, baseline)
      .Q_HV(circleRight, capitalBottomMiddle)
      .Q_VH(circleCenter, capitalMiddle)
      .Q_HV(circleLeft, capitalBottomMiddle);
    add("b", shape, advance);
  }
  // MARK: o
  {
    const advance = digitWidth;
    const circleLeft = 0;
    const circleCenter = advance / 2;
    const circleRight = advance;
    const shape = new PathShape(circleCenter, capitalMiddle)
      .Q_HV(circleRight, capitalBottomMiddle)
      .Q_VH(circleCenter, baseline)
      .Q_HV(circleLeft, capitalBottomMiddle)
      .Q_VH(circleCenter, capitalMiddle);
    add("o", shape, advance);
  }
  return result;
}

{
  class Writer {
    leftMargin = 5;
    rightMargin = 95;
    x = this.leftMargin;
    baseline = 10;
    lineHeight = 7.5;
    carriageReturn() {
      this.x = this.leftMargin;
    }
    lineFeed(lineCount = 1) {
      this.baseline += this.lineHeight * lineCount;
    }
    CRLF() {
      this.carriageReturn();
      this.lineFeed(4 / 3);
    }
    font = makeLineFont(5);
    getDescription(key: string) {
      return this.font.get(key);
    }
    show1(description: DescriptionOfLetter) {
      const advance = description.advance;
      if (this.x + advance > this.rightMargin && this.x > this.leftMargin) {
        this.carriageReturn();
        this.lineFeed();
      }
      const element = description.makeElement();
      svg.appendChild(element);
      element.style.transform = `translate(${this.x}px,${this.baseline}px)`;
      this.x += advance + description.fontMetrics.defaultKerning;
      return element;
    }
    show(message: string) {
      const invalid = new Set<string>();
      const result = [...message].flatMap((char) => {
        const description = this.getDescription(char);
        if (description) {
          const element = this.show1(description);
          return element;
        } else {
          invalid.add(char);
          return [];
        }
      });
      if (invalid.size > 0) {
        console.warn(invalid);
      }
      return result;
    }
  }

  const writer = new Writer();

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
  writer.font.forEach((value, key) => {
    if (isNormalChar(key)) {
      normal += key;
    } else {
      special.push(value);
    }
  });
  writer.show(normal);
  writer.CRLF();
  special.forEach((description) => {
    writer.show1(description);
  });
  writer.CRLF();
  writer.show(normal).forEach((element) => {
    element.classList.add("lights");
  });
}
