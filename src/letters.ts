import { getById } from "phil-lib/client-misc";
import "./style.css";

const svg = getById("main", SVGSVGElement);

class FontMetrics {
  readonly mHeight: number;
  readonly xHeight: number;
  readonly aWidth: number;
  readonly defaultKerning: number;
  constructor(fontSize: number) {
    if (fontSize <= 0 || !isFinite(fontSize)) {
      throw new Error("wtf");
    }
    this.mHeight = fontSize;
    this.xHeight = fontSize * 0.5;
    this.aWidth = fontSize * 0.75;
    this.defaultKerning = fontSize * 0.25;
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
  const x0 = 0;
  const y0 = 0;
  const { aWidth, mHeight, xHeight } = fontMetrics;
  {
    // MARK: 0
    const advance = mHeight / 2;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const y1 = -radius;
    const y2 = -(mHeight - radius);
    const y3 = -mHeight;
    const d = `M ${x1},${y3} Q ${x2},${y3} ${x2},${y2} L ${x2},${y1} Q ${x2},${y0} ${x1},${y0} Q ${x0},${y0} ${x0},${y1} L ${x0},${y2} Q ${x0},${y3} ${x1},${y3}`;
    add("0", d, advance);
  }
  {
    // MARK: 1
    const advance = mHeight / 2;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const y1 = -(mHeight - radius);
    const y2 = -mHeight;
    const d = `M ${x0},${y1} Q ${x1},${y1} ${x1},${y2} L ${x1},${y0} M ${x0},${y0} L ${x2},${y0}`;
    add("1", d, advance);
  }
  {
    // MARK: 2
    //const advance = mHeight / 2;
    //const radius = advance / 2;
  }
  {
    // MARK: 8
    const advance = mHeight / 2;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const y1 = -radius;
    const y2 = -2 * radius;
    const y3 = -3 * radius;
    const y4 = -mHeight;
    const d = `M ${x1},${y4} Q ${x2},${y4} ${x2},${y3} Q ${x2},${y2} ${x1},${y2} Q ${x0},${y2} ${x0},${y1} Q ${x0},${y0} ${x1},${y0} Q ${x2},${y0} ${x2},${y1} Q ${x2},${y2} ${x1},${y2} Q ${x0},${y2} ${x0},${y3} Q ${x0},${y4} ${x1},${y4}`;
    add("8", d, advance);
  }
  {
    // MARK: A
    const d = `M ${x0},${y0} L ${x0 + aWidth / 2},${y0 - mHeight} L ${
      x0 + aWidth
    },${y0} M ${x0 + aWidth / 4},${y0 - xHeight} L ${x0 + aWidth * 0.75},${
      y0 - xHeight
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
    const d = `M ${x0},${y0 - mHeight} L ${x0},${y0} L ${
      x0 + bottomLineLength
    },${y0} M ${x0 + Math.max(bottomLineLength, topLineLength)},${
      y0 - xHeight
    } L ${x0},${y0 - xHeight} M ${x0},${y0 - mHeight} L ${x0 + topLineLength},${
      y0 - mHeight
    } Q ${x0 + topLineLength + topRadius},${y0 - mHeight} ${
      x0 + topLineLength + topRadius
    },${y0 - mHeight + topRadius} Q ${x0 + topLineLength + topRadius},${
      y0 - xHeight
    } ${x0 + topLineLength},${y0 - xHeight} M ${x0 + bottomLineLength},${
      y0 - xHeight
    } Q ${x0 + bottomLineLength + bottomRadius},${y0 - xHeight} ${
      x0 + bottomLineLength + bottomRadius
    },${y0 - bottomRadius} Q ${x0 + bottomLineLength + bottomRadius},${y0} ${
      x0 + bottomLineLength
    },${y0}`;
    add("B", d, advance);
  }
  {
    // MARK: C
    const advance = Math.min(aWidth, mHeight * 0.5);
    const radius = advance / 2;
    const x1 = x0 + radius;
    const x2 = x0 + advance;
    const y1 = y0 - radius;
    const y3 = y0 - mHeight;
    const y2 = y3 + radius;
    const d = `M ${x2},${y2} Q ${x2},${y3} ${x1},${y3} Q ${x0},${y3} ${x0},${y2} L ${x0},${y1} Q ${x0},${y0} ${x1},${y0} Q ${x2},${y0} ${x2},${y1}`;
    add("C", d, advance);
  }
  {
    // MARK: D
    const advance = Math.min(aWidth, mHeight * 0.5);
    const radius = advance / 2;
    const x1 = x0 + radius;
    const x2 = x0 + advance;
    const y1 = y0 - radius;
    const y3 = y0 - mHeight;
    const y2 = y3 + radius;
    const d = `M ${x0},${y3} L ${x0},${y0} L ${x1},${y0} Q ${x2},${y0} ${x2},${y1} L ${x2},${y2} Q ${x2},${y3} ${x1},${y3} L ${x0},${y3}`;
    add("D", d, advance);
  }
  {
    // MARK: E
    const advance = mHeight / 2;
    const x1 = x0 + advance * (2 / 3);
    const x2 = x0 + advance;
    const y1 = y0 - xHeight;
    const y2 = y0 - mHeight;
    const d = `M ${x2},${y2} L ${x0},${y2} L ${x0},${y0} L ${x2},${y0} M ${x1},${y1} L ${x0},${y1}`;
    add("E", d, advance);
  }
  {
    // MARK: F
    const advance = mHeight / 2;
    const x1 = x0 + advance * (2 / 3);
    const x2 = x0 + advance;
    const y1 = y0 - xHeight;
    const y2 = y0 - mHeight;
    const d = `M ${x2},${y2} L ${x0},${y2} L ${x0},${y0} M ${x1},${y1} L ${x0},${y1}`;
    add("F", d, advance);
  }
  {
    // MARK: G
    const advance = mHeight * 0.5;
    const radius = advance / 2;
    const x1 = x0 + radius;
    const x2 = x0 + advance;
    const y1 = y0 - radius;
    const y2 = y0 - xHeight;
    const y4 = y0 - mHeight;
    const y3 = y4 + radius;
    const d = `M ${x2},${y3} Q ${x2},${y4} ${x1},${y4} Q ${x0},${y4} ${x0},${y3} L ${x0},${y1} Q ${x0},${y0} ${x1},${y0} Q ${x2},${y0} ${x2},${y1} L ${x2},${y2} L ${x1},${y2}`;
    add("G", d, advance);
  }
  {
    // MARK: H
    const advance = mHeight / 2;
    const x1 = x0 + advance;
    const y1 = y0 - xHeight;
    const y2 = y0 - mHeight;
    const d = `M ${x0},${y2} L ${x0},${y0} M ${x1},${y2} L ${x1},${y0} M ${x0},${y1} L ${x1},${y1}`;
    add("H", d, advance);
  }
  {
    // MARK: I
    const advance = mHeight / 3;
    const x1 = x0 + advance / 2;
    const x2 = x0 + advance;
    const y1 = y0 - mHeight;
    const d = `M ${x0},${y1} L ${x2},${y1} M ${x0},${y0} L ${x2},${y0} M ${x1},${y1} L ${x1},${y0}`;
    add("I", d, advance);
  }
  {
    // MARK: J
    const advance = mHeight / 2;
    const radius = advance / 2;
    const x1 = x0 + radius;
    const x2 = x0 + advance;
    const y1 = y0 - radius;
    const y2 = y0 - mHeight;
    const d = `M ${x2},${y2} L ${x2},${y1} Q ${x2},${y0} ${x1},${y0} Q ${x0},${y0} ${x0},${y1}`;
    add("J", d, advance);
  }
  return result;
}

{
  const font = makeLineFont(5);

  let x = 5;
  const baseLine = 10;
  function show(message: string) {
    const invalid = new Set<string>();
    for (const char of message) {
      const description = font.get(char);
      if (description === undefined) {
        invalid.add(char);
      } else {
        const element = description.makeElement();
        svg.appendChild(element);
        element.style.transform = `translate(${x}px,${baseLine}px)`;
        x += description.advance + description.fontMetrics.defaultKerning;
      }
    }
    if (invalid.size > 0) {
      console.warn(invalid);
    }
  }

  //show("AB😎CDE😎FG😎HIJ");
  for (const char of font.keys()) {
    show(char);
  }
}
