import { getById } from "phil-lib/client-misc";
import "./style.css";
import { sleep } from "phil-lib/misc";
import { PathShape } from "./path-shape";
import { makeLineFont } from "./line-font";
import rough from "roughjs";
import { Config } from "roughjs/bin/core";
import { DescriptionOfLetter, Font, FontMetrics } from "./letters-base";

const svg = getById("main", SVGSVGElement);

function convertToCubics(original: Font): Font {
  const result = new Map<string, DescriptionOfLetter>();
  original.forEach((originalDescription, key) => {
    const { letter, advance, fontMetrics } = originalDescription;
    const shape = originalDescription.shape.convertToCubics();
    const newDescription = new DescriptionOfLetter(
      letter,
      shape,
      advance,
      fontMetrics
    );
    result.set(key, newDescription);
  });
  return result;
}

function makeSmallCaps(
  capitalSize: number,
  smallSize: number = capitalSize * 0.75
): Font {
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
function makeRoughFont(baseFont: Font, config: Config): Font {
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
        } else if (char == " ") {
          this.showSpace();
          return [];
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
        } else if (char == " ") {
          this.showSpace();
          return [];
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
    showSpace() {
      this.x += this.font.get("0")!.fontMetrics.spaceWidth;
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

  writer.lineHeight *= 1.2;
  const baseFont = makeLineFont(new FontMetrics(6, 0.5));
  const cubicFont = convertToCubics(baseFont);
  writer.CRLF();
  writer.font = cubicFont;
  //const strokeWidth = cubicFont.get("0")!.fontMetrics.strokeWidth.toString();
  writer.show("Cubic Line 6"); //.forEach(element => element.style.strokeWidth = strokeWidth);
  const roughOptions = {
    options: {
      roughness: 0.5,
      bowing: 3,
      disableMultiStroke: false,
      preserveVertices: true,
    },
  };
  writer.font = makeRoughFont(baseFont, roughOptions);
  writer.CRLF();
  writer
    .show("Rough Font 1")
    .forEach((element) => (element.style.strokeWidth = "0.25"));
  writer.font = makeRoughFont(cubicFont, roughOptions);
  writer.CRLF();
  writer
    .show("Rough Font 2")
    .forEach((element) => (element.style.strokeWidth = "0.25"));
  roughOptions.options.disableMultiStroke = true;
  writer.font = makeRoughFont(cubicFont, roughOptions);
  writer.CRLF();
  writer.show("Rough Font 3");
  roughOptions.options.preserveVertices = false;
  roughOptions.options.roughness = 0.3;
  writer.font = makeRoughFont(cubicFont, roughOptions);
  writer.CRLF();
  writer.show("Rough Font 4");
  roughOptions.options.disableMultiStroke = false;
  writer.font = makeRoughFont(cubicFont, roughOptions);
  writer.CRLF();
  writer
    .show("Rough Font 5")
    .forEach((element) => (element.style.strokeWidth = "0.25"));
}
