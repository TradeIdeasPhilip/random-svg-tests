import { getById } from "phil-lib/client-misc";
import "./style.css";
import { sleep } from "phil-lib/misc";
import { PathShape } from "./path-shape";
import { makeLineFont } from "./line-font";
import rough from "roughjs";
import { Config } from "roughjs/bin/core";

const svg = getById("main", SVGSVGElement);

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
  get d() {
    return this.shape.rawPath;
  }
  private static makeElement(cssPath: string) {
    const pathElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    pathElement.style.d = cssPath;
    if (pathElement.style.d == "") {
      console.error(cssPath, pathElement);
      throw new Error("wtf");
    }
    return pathElement;
  }
  /**
   * Create a new element to draw this letter.
   * @returns Currently this is always a <path> element.
   * I might or might not want to change that to be a <g> element.
   */
  makeElement(): SVGElement {
    return DescriptionOfLetter.makeElement(this.cssPath);
  }
  /**
   *
   * @returns One element part continuous part of the path.
   */
  makeElements() {
    return this.shape.splitOnMove().map((innerShape) => ({
      innerShape,
      element: DescriptionOfLetter.makeElement(innerShape.cssPath),
    }));
  }
}

function makeSmallCaps(
  capitalSize: number,
  smallSize: number = capitalSize * 0.75
) {
  const bigFont = makeLineFont(capitalSize);
  const smallFont = makeLineFont(smallSize);
  smallFont.forEach((descriptionOfLetter, letter) => {
    const lowerCase = letter.toLowerCase();
    if (lowerCase != letter) {
      bigFont.set(lowerCase, descriptionOfLetter);
    }
  });
  return bigFont;
}

/**
 *
 * @param size This will be passed to makeLineFont()
 * @param config This will be passed to Rough.js
 * https://github.com/rough-stuff/rough/wiki#options
 * @returns The requested font.
 */
function makeRoughFont(size: number, config: Config) {
  const baseFont = makeLineFont(size);
  const generator = rough.generator(config);
  const result = new Map<string, DescriptionOfLetter>();
  baseFont.forEach((baseDescription, key) => {
    const drawable = generator.path(baseDescription.d);
    const allPathInfo = generator.toPaths(drawable);
    const pathStrings = allPathInfo.map((pathInfo) => pathInfo.d);
    const shape = PathShape.fromStrings(...pathStrings);
    const newDescription = new DescriptionOfLetter(
      baseDescription.letter,
      shape,
      baseDescription.advance,
      baseDescription.fontMetrics
    );
    result.set(key, newDescription);
  });
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
    /**
     * __Before__ drawing the letter.
     */
    makeRoom(description: DescriptionOfLetter) {
      if (
        this.x + description.advance > this.rightMargin &&
        this.x > this.leftMargin
      ) {
        this.carriageReturn();
        this.lineFeed();
      }
    }
    /**
     * __After__ drawing the letter.
     */
    advance(description: DescriptionOfLetter) {
      this.x += description.advance + description.fontMetrics.defaultKerning;
    }
    show1(description: DescriptionOfLetter) {
      this.makeRoom(description);
      const element = description.makeElement();
      svg.appendChild(element);
      element.style.transform = `translate(${this.x}px,${this.baseline}px)`;
      this.advance(description);
      return element;
    }
    splitAndShow1(description: DescriptionOfLetter) {
      this.makeRoom(description);
      const elementInfo = description.makeElements();
      elementInfo.forEach(({ element }) => {
        svg.appendChild(element);
        element.style.transform = `translate(${this.x}px,${this.baseline}px)`;
      });
      this.advance(description);
      return elementInfo;
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
    splitAndShow(message: string) {
      const invalid = new Set<string>();
      const result = [...message].flatMap((char) => {
        const description = this.getDescription(char);
        if (description) {
          const elements = this.splitAndShow1(description);
          return elements;
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
    writer.show1(description).classList.add("historical");
  });
  writer.CRLF();
  writer.show(normal).forEach((element) => {
    element.classList.add("lights");
  });

  writer.CRLF();
  const elementInfo = writer.splitAndShow(normal);
  const distanceBefore = (index: number) => {
    if (index == 0) {
      return 0;
    }
    const current = elementInfo[index].innerShape;
    const previous = elementInfo[index - 1].innerShape;
    const distance = Math.hypot(
      previous.endX - current.startX,
      previous.endY - current.startY
    );
    return distance;
  };
  const { totalLength, maxLength } = elementInfo.reduce(
    ({ totalLength, maxLength }, { element }, index) => {
      const elementLength = element.getTotalLength();
      totalLength += distanceBefore(index) + elementLength;
      maxLength = Math.max(maxLength, elementLength);
      return { totalLength, maxLength };
    },
    { totalLength: 0, maxLength: 0 }
  );

  // Draw the letters as if a person were writing with a pen.
  // I.e. animate it to look like someone is writing.
  const lineLength = Math.ceil(maxLength) + 1;
  const strokeDasharray = `0 ${lineLength} ${lineLength} 0`;
  async function loopIt() {
    while (true) {
      /**
       * Number of MS while the screen is blank before we start drawing the text each time.
       */
      const initialDelay = 1000;
      /**
       * Number of ms that it takes to do the writing.
       */
      const writeTime = 20000;
      // const totalTime = 12000;
      let lengthSoFar = 0;
      let lastAnimation: Animation;
      elementInfo.forEach(({ element }, index) => {
        const elementLength = element.getTotalLength();
        lengthSoFar += distanceBefore(index);
        /**
         * start delay
         */
        const delay = initialDelay + (lengthSoFar / totalLength) * writeTime;
        lengthSoFar += elementLength;
        const duration = (elementLength / totalLength) * writeTime;
        lastAnimation = element.animate(
          [
            { strokeDasharray, strokeDashoffset: 0.00001 },
            { strokeDasharray, strokeDashoffset: -elementLength },
          ],
          { delay, duration, fill: "backwards" }
        );
      });
      await lastAnimation!.finished;
      // Wait this long with everything visible before restarting the loop and clearing the screen.
      await sleep(3000);
    }
  }
  loopIt();

  writer.CRLF();
  writer.font = makeSmallCaps(5);
  writer.show("Small  Caps");

  writer.font = makeRoughFont(14, {
    options: { roughness: 0.5, bowing: 3, disableMultiStroke: true },
  });
  writer.lineHeight *= 3;
  writer.CRLF();
  writer.show("Rough Font");
}
