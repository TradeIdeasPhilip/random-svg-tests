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
    return this.fontSize * 0.25;
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
   */
  constructor(public readonly fontSize: number) {
    if (fontSize <= 0 || !isFinite(fontSize)) {
      throw new Error("wtf");
    }
  }
}

function cssifyPath(path: string) {
  return `path('${path}')`;
}

class DescriptionOfLetter {
  constructor(
    public readonly letter: string,
    public readonly d: string,
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
    return cssifyPath(this.d);
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
  const add = (letter: string, d: string, advance: number) => {
    const description = new DescriptionOfLetter(
      letter,
      d,
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
  {
    // MARK: 0
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const y1 = -radius;
    const d = `M ${x1},${capitalTop} Q ${x2},${capitalTop} ${x2},${capitalTopMiddle} L ${x2},${y1} Q ${x2},${baseline} ${x1},${baseline} Q 0,${baseline} 0,${y1} L 0,${capitalTopMiddle} Q 0,${capitalTop} ${x1},${capitalTop}`;
    add("0", d, advance);
  }
  {
    // MARK: 1
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const d = `M 0,${capitalTopMiddle} Q ${x1},${capitalTopMiddle} ${x1},${capitalTop} L ${x1},${baseline} M 0,${baseline} L ${x2},${baseline}`;
    add("1", d, advance);
  }
  {
    // MARK: 2
    //const advance = digitWidth;
    //const radius = advance / 2;
  }
  {
    // MARK: 8
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const y1 = -radius;
    const y2 = -2 * radius;
    const y3 = -3 * radius;
    const d = `M ${x1},${capitalTop} Q ${x2},${capitalTop} ${x2},${y3} Q ${x2},${y2} ${x1},${y2} Q 0,${y2} 0,${y1} Q 0,${baseline} ${x1},${baseline} Q ${x2},${baseline} ${x2},${y1} Q ${x2},${y2} ${x1},${y2} Q 0,${y2} 0,${y3} Q 0,${capitalTop} ${x1},${capitalTop}`;
    add("8", d, advance);
  }
  {
    // MARK: 9
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    //const y1 = -radius;
    const y2 = -2 * radius;
    const y3 = -3 * radius;
    const d = `M ${x2}, ${y3} Q ${x2},${capitalTop} ${x1},${capitalTop} Q 0,${capitalTop} 0,${y3} Q 0,${y2} ${x1},${y2} Q ${x2},${y2} ${x2},${y3} Q ${x2},${baseline} 0,${baseline}`;
    add("9", d, advance);
  }
  {
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const y1 = -2 * radius;
    const y2 = -3 * radius;
    const d = `M ${x2}, ${y2} Q ${x2},${capitalTop} ${x1},${capitalTop} Q 0,${capitalTop} 0,${y2} Q 0,${y1} ${x1},${y1} Q ${x2},${y1} ${x2},${y2} L ${x2},${baseline}`;
    add("9a", d, advance);
  }
  {
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const y1 = -radius;
    const y2 = -2 * radius;
    const y3 = -3 * radius;
    const d = `M ${x2}, ${y3} Q ${x2},${capitalTop} ${x1},${capitalTop} Q 0,${capitalTop} 0,${y3} Q 0,${y2} ${x1},${y2} Q ${x2},${y2} ${x2},${y3} L ${x2},${y1} Q ${x2},${baseline} ${x1},${baseline} Q 0,${baseline} 0,${y1}`;
    add("9b", d, advance);
  }
  {
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const y1 = -radius;
    const y2 = -2 * radius;
    const y3 = -3 * radius;
    const d = `M ${x2}, ${y3} Q ${x2},${capitalTop} ${x1},${capitalTop} Q 0,${capitalTop} 0,${y3} Q 0,${y2} ${x1},${y2} Q ${x2},${y2} ${x2},${y3} Q ${x2},${baseline} ${x1},${baseline} Q 0,${baseline} 0,${y1}`;
    add("9c", d, advance);
  }
  {
    // MARK: A
    const d = `M 0,${baseline} L ${fontMetrics.aWidth / 2},${capitalTop} L ${
      fontMetrics.aWidth
    },${baseline} M ${fontMetrics.aWidth / 4},${capitalMiddle} L ${
      fontMetrics.aWidth * 0.75
    },${capitalMiddle}`;
    add("A", d, aWidth);
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
    const d = `M 0,${capitalTop} L 0,${baseline} L ${bottomLineLength},${baseline} M ${Math.max(
      bottomLineLength,
      topLineLength
    )},${capitalMiddle} L 0,${capitalMiddle} M 0,${capitalTop} L ${topLineLength},${capitalTop} Q ${
      topLineLength + topRadius
    },${capitalTop} ${topLineLength + topRadius},${capitalTop + topRadius} Q ${
      topLineLength + topRadius
    },${capitalMiddle} ${topLineLength},${capitalMiddle} M ${bottomLineLength},${capitalMiddle} Q ${
      bottomLineLength + bottomRadius
    },${capitalMiddle} ${bottomLineLength + bottomRadius},${
      baseline - bottomRadius
    } Q ${
      bottomLineLength + bottomRadius
    },${baseline} ${bottomLineLength},${baseline}`;
    add("B", d, advance);
  }
  {
    // MARK: C
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const d = `M ${x2},${capitalTopMiddle} Q ${x2},${capitalTop} ${x1},${capitalTop} Q 0,${capitalTop} 0,${capitalTopMiddle} L 0,${capitalBottomMiddle} Q 0,${baseline} ${x1},${baseline} Q ${x2},${baseline} ${x2},${capitalBottomMiddle}`;
    add("C", d, advance);
  }
  {
    // MARK: D
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const d = `M 0,${capitalTop} L 0,${baseline} L ${x1},${baseline} Q ${x2},${baseline} ${x2},${capitalBottomMiddle} L ${x2},${capitalTopMiddle} Q ${x2},${capitalTop} ${x1},${capitalTop} L 0,${capitalTop}`;
    add("D", d, advance);
  }
  {
    // MARK: E
    const advance = digitWidth;
    const x1 = advance * (2 / 3);
    const x2 = advance;
    const d = `M ${x2},${capitalTop} L 0,${capitalTop} L 0,${baseline} L ${x2},${baseline} M ${x1},${capitalMiddle} L 0,${capitalMiddle}`;
    add("E", d, advance);
  }
  {
    // MARK: F
    const advance = digitWidth;
    const x1 = advance * (2 / 3);
    const x2 = advance;
    const d = `M ${x2},${capitalTop} L 0,${capitalTop} L 0,${baseline} M ${x1},${capitalMiddle} L 0,${capitalMiddle}`;
    add("F", d, advance);
  }
  {
    // MARK: G
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const d = `M ${x2},${capitalTopMiddle} Q ${x2},${capitalTop} ${x1},${capitalTop} Q 0,${capitalTop} 0,${capitalTopMiddle} L 0,${capitalBottomMiddle} Q 0,${baseline} ${x1},${baseline} Q ${x2},${baseline} ${x2},${capitalBottomMiddle} L ${x2},${capitalMiddle} L ${x1},${capitalMiddle}`;
    add("G", d, advance);
  }
  {
    // MARK: H
    const advance = digitWidth;
    const x1 = advance;
    const d = `M 0,${capitalTop} L 0,${baseline} M ${x1},${capitalTop} L ${x1},${baseline} M 0,${capitalMiddle} L ${x1},${capitalMiddle}`;
    add("H", d, advance);
  }
  {
    // MARK: I
    const advance = fontMetrics.mHeight / 3;
    const x1 = advance / 2;
    const x2 = advance;
    const d = `M 0,${capitalTop} L ${x2},${capitalTop} M 0,${baseline} L ${x2},${baseline} M ${x1},${capitalTop} L ${x1},${baseline}`;
    add("I", d, advance);
  }
  {
    // MARK: J
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const d = `M ${x2},${capitalTop} L ${x2},${capitalBottomMiddle} Q ${x2},${baseline} ${x1},${baseline} Q 0,${baseline} 0,${capitalBottomMiddle}`;
    add("J", d, advance);
  }
  return result;
}

{
  const font = makeLineFont(5);

  let x = 5;
  const baseLine = 10;

  // the is the only way to see 9a
  function show1(char: string) {
    const description = font.get(char);
    if (description === undefined) {
      return false;
    } else {
      const element = description.makeElement();
      svg.appendChild(element);
      element.style.transform = `translate(${x}px,${baseLine}px)`;
      x += description.advance + description.fontMetrics.defaultKerning;
      return true;
    }
  }

  function show(message: string) {
    const invalid = new Set<string>();
    for (const char of message) {
      const success = show1(char);
      if (!success) {
        invalid.add(char);
      }
    }
    if (invalid.size > 0) {
      console.warn(invalid);
    }
  }

  show(""); // Show something specific or
  // Show everything that's available.
  for (const char of font.keys()) {
    show1(char);
  }
}
