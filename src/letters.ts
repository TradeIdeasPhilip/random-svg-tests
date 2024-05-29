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
  get aWidth() {
    return this.fontSize * 0.75;
  }
  get digitWidth() {
    return this.fontSize * 0.5;
  }
  get defaultKerning() {
    return this.fontSize * 0.25;
  }
  get baseline() {
    return 0;
  }
  get capitalTop() {
    return this.baseline - this.mHeight;
  }
  get capitalMiddle() {
    return this.baseline - this.xHeight;
  }
  get capitalTopMiddle() {
    return (this.capitalTop + this.capitalMiddle) / 2;
  }
  get capitalBottomMiddle() {
    return (this.baseline + this.capitalMiddle) / 2;
  }
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
    public readonly advance: number,
    public readonly fontMetrics: FontMetrics
  ) {}
  get cssPath() {
    return cssifyPath(this.d);
  }
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
  const { aWidth, mHeight, xHeight, digitWidth } = fontMetrics;
  {
    // MARK: 0
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const y1 = -radius;
    const y2 = -(mHeight - radius);
    const y3 = -mHeight;
    const d = `M ${x1},${y3} Q ${x2},${y3} ${x2},${y2} L ${x2},${y1} Q ${x2},${fontMetrics.baseline} ${x1},${fontMetrics.baseline} Q 0,${fontMetrics.baseline} 0,${y1} L 0,${y2} Q 0,${y3} ${x1},${y3}`;
    add("0", d, advance);
  }
  {
    // MARK: 1
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const y1 = -(mHeight - radius);
    const y2 = -mHeight;
    const d = `M 0,${y1} Q ${x1},${y1} ${x1},${y2} L ${x1},${fontMetrics.baseline} M 0,${fontMetrics.baseline} L ${x2},${fontMetrics.baseline}`;
    add("1", d, advance);
  }
  {
    // MARK: 2
    //const advance = mHeight / 2;
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
    const y4 = -mHeight;
    const d = `M ${x1},${y4} Q ${x2},${y4} ${x2},${y3} Q ${x2},${y2} ${x1},${y2} Q 0,${y2} 0,${y1} Q 0,${fontMetrics.baseline} ${x1},${fontMetrics.baseline} Q ${x2},${fontMetrics.baseline} ${x2},${y1} Q ${x2},${y2} ${x1},${y2} Q 0,${y2} 0,${y3} Q 0,${y4} ${x1},${y4}`;
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
    const y4 = -mHeight;
    const d = `M ${x2}, ${y3} Q ${x2},${y4} ${x1},${y4} Q 0,${y4} 0,${y3} Q 0,${y2} ${x1},${y2} Q ${x2},${y2} ${x2},${y3} Q ${x2},${fontMetrics.baseline} 0,${fontMetrics.baseline}`;
    add("9", d, advance);
  }
  {
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const y1 = -2 * radius;
    const y2 = -3 * radius;
    const y3 = -mHeight;
    const d = `M ${x2}, ${y2} Q ${x2},${y3} ${x1},${y3} Q 0,${y3} 0,${y2} Q 0,${y1} ${x1},${y1} Q ${x2},${y1} ${x2},${y2} L ${x2},${fontMetrics.baseline}`;
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
    const y4 = -mHeight;
    const d = `M ${x2}, ${y3} Q ${x2},${y4} ${x1},${y4} Q 0,${y4} 0,${y3} Q 0,${y2} ${x1},${y2} Q ${x2},${y2} ${x2},${y3} L ${x2},${y1} Q ${x2},${fontMetrics.baseline} ${x1},${fontMetrics.baseline} Q 0,${fontMetrics.baseline} 0,${y1}`;
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
    const y4 = -mHeight;
    const d = `M ${x2}, ${y3} Q ${x2},${y4} ${x1},${y4} Q 0,${y4} 0,${y3} Q 0,${y2} ${x1},${y2} Q ${x2},${y2} ${x2},${y3} Q ${x2},${fontMetrics.baseline} ${x1},${fontMetrics.baseline} Q 0,${fontMetrics.baseline} 0,${y1}`;
    add("9c", d, advance);
  }
  {
    // MARK: A
    const d = `M 0,${fontMetrics.baseline} L ${fontMetrics.aWidth / 2},${
      fontMetrics.baseline - mHeight
    } L ${fontMetrics.aWidth},${fontMetrics.baseline} M ${
      fontMetrics.aWidth / 4
    },${fontMetrics.baseline - xHeight} L ${fontMetrics.aWidth * 0.75},${
      fontMetrics.baseline - xHeight
    }`;
    add("A", d, aWidth);
  }
  {
    // MARK: B
    const advance = mHeight / 2;
    const topRadius = (mHeight - xHeight) / 2;
    const topLineLength = (advance - topRadius) * (2 / 3);
    const bottomRadius = xHeight / 2;
    const bottomLineLength = advance - bottomRadius;
    const d = `M 0,${fontMetrics.baseline - mHeight} L 0,${
      fontMetrics.baseline
    } L ${bottomLineLength},${fontMetrics.baseline} M ${Math.max(
      bottomLineLength,
      topLineLength
    )},${fontMetrics.baseline - xHeight} L 0,${
      fontMetrics.baseline - xHeight
    } M 0,${fontMetrics.baseline - mHeight} L ${topLineLength},${
      fontMetrics.baseline - mHeight
    } Q ${topLineLength + topRadius},${fontMetrics.baseline - mHeight} ${
      topLineLength + topRadius
    },${fontMetrics.baseline - mHeight + topRadius} Q ${
      topLineLength + topRadius
    },${fontMetrics.baseline - xHeight} ${topLineLength},${
      fontMetrics.baseline - xHeight
    } M ${bottomLineLength},${fontMetrics.baseline - xHeight} Q ${
      bottomLineLength + bottomRadius
    },${fontMetrics.baseline - xHeight} ${bottomLineLength + bottomRadius},${
      fontMetrics.baseline - bottomRadius
    } Q ${bottomLineLength + bottomRadius},${
      fontMetrics.baseline
    } ${bottomLineLength},${fontMetrics.baseline}`;
    add("B", d, advance);
  }
  {
    // MARK: C
    const advance = Math.min(aWidth, mHeight * 0.5);
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const y1 = fontMetrics.baseline - radius;
    const y3 = fontMetrics.baseline - mHeight;
    const y2 = y3 + radius;
    const d = `M ${x2},${y2} Q ${x2},${y3} ${x1},${y3} Q 0,${y3} 0,${y2} L 0,${y1} Q 0,${fontMetrics.baseline} ${x1},${fontMetrics.baseline} Q ${x2},${fontMetrics.baseline} ${x2},${y1}`;
    add("C", d, advance);
  }
  {
    // MARK: D
    const advance = Math.min(aWidth, mHeight * 0.5);
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const y1 = fontMetrics.baseline - radius;
    const y3 = fontMetrics.baseline - mHeight;
    const y2 = y3 + radius;
    const d = `M 0,${y3} L 0,${fontMetrics.baseline} L ${x1},${fontMetrics.baseline} Q ${x2},${fontMetrics.baseline} ${x2},${y1} L ${x2},${y2} Q ${x2},${y3} ${x1},${y3} L 0,${y3}`;
    add("D", d, advance);
  }
  {
    // MARK: E
    const advance = mHeight / 2;
    const x1 = advance * (2 / 3);
    const x2 = advance;
    const y1 = fontMetrics.baseline - xHeight;
    const y2 = fontMetrics.baseline - mHeight;
    const d = `M ${x2},${y2} L 0,${y2} L 0,${fontMetrics.baseline} L ${x2},${fontMetrics.baseline} M ${x1},${y1} L 0,${y1}`;
    add("E", d, advance);
  }
  {
    // MARK: F
    const advance = mHeight / 2;
    const x1 = advance * (2 / 3);
    const x2 = advance;
    const y1 = fontMetrics.baseline - xHeight;
    const y2 = fontMetrics.baseline - mHeight;
    const d = `M ${x2},${y2} L 0,${y2} L 0,${fontMetrics.baseline} M ${x1},${y1} L 0,${y1}`;
    add("F", d, advance);
  }
  {
    // MARK: G
    const advance = mHeight * 0.5;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const y1 = fontMetrics.baseline - radius;
    const y2 = fontMetrics.baseline - xHeight;
    const y4 = fontMetrics.baseline - mHeight;
    const y3 = y4 + radius;
    const d = `M ${x2},${y3} Q ${x2},${y4} ${x1},${y4} Q 0,${y4} 0,${y3} L 0,${y1} Q 0,${fontMetrics.baseline} ${x1},${fontMetrics.baseline} Q ${x2},${fontMetrics.baseline} ${x2},${y1} L ${x2},${y2} L ${x1},${y2}`;
    add("G", d, advance);
  }
  {
    // MARK: H
    const advance = mHeight / 2;
    const x1 = advance;
    const y1 = fontMetrics.baseline - xHeight;
    const y2 = fontMetrics.baseline - mHeight;
    const d = `M 0,${y2} L 0,${fontMetrics.baseline} M ${x1},${y2} L ${x1},${fontMetrics.baseline} M 0,${y1} L ${x1},${y1}`;
    add("H", d, advance);
  }
  {
    // MARK: I
    const advance = mHeight / 3;
    const x1 = advance / 2;
    const x2 = advance;
    const y1 = fontMetrics.baseline - mHeight;
    const d = `M 0,${y1} L ${x2},${y1} M 0,${fontMetrics.baseline} L ${x2},${fontMetrics.baseline} M ${x1},${y1} L ${x1},${fontMetrics.baseline}`;
    add("I", d, advance);
  }
  {
    // MARK: J
    const advance = mHeight / 2;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const y1 = fontMetrics.baseline - radius;
    const y2 = fontMetrics.baseline - mHeight;
    const d = `M ${x2},${y2} L ${x2},${y1} Q ${x2},${fontMetrics.baseline} ${x1},${fontMetrics.baseline} Q 0,${fontMetrics.baseline} 0,${y1}`;
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

  show("");
  for (const char of font.keys()) {
    show1(char);
  }
}
