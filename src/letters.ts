import { getById } from "phil-lib/client-misc";
import "./style.css";
import { initializedArray, makeLinear, sleep } from "phil-lib/misc";
import { PathShape } from "./path-shape";
import { makeLineFont } from "./line-font";
import rough from "roughjs";
import { Options } from "roughjs/bin/core";
import { DescriptionOfLetter, Font, FontMetrics } from "./letters-base";
import { lerp } from "./utility";

const svg = getById("main", SVGSVGElement);

function convertToCubics(original: Font): Font {
  const result = new Map<string, DescriptionOfLetter>();
  original.forEach((originalDescription, key) => {
    const { advance, fontMetrics } = originalDescription;
    const shape = originalDescription.shape.convertToCubics();
    const newDescription = new DescriptionOfLetter(shape, advance, fontMetrics);
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
function makeRoughFont(baseFont: Font, options: Options): Font {
  const baseOptions = {
    roughness: 0.5,
    bowing: 3,
    disableMultiStroke: true,
    preserveVertices: true,
  } as const;
  const generator = rough.generator({
    options: { ...baseOptions, ...options },
  });
  const result = new Map<string, DescriptionOfLetter>();
  baseFont.forEach((baseDescription, key) => {
    const shape = () => {
      const drawable = generator.path(baseDescription.d);
      const allPathInfo = generator.toPaths(drawable);
      const pathStrings = allPathInfo.map((pathInfo) => pathInfo.d);
      return PathShape.fromStrings(...pathStrings);
    };
    const newDescription = new DescriptionOfLetter(
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
      const { x, baseline } = this;
      element.style.transform = `translate(${x}px,${baseline}px)`;
      this.advance(description);
      return { element, x, baseline };
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
          const shown = this.show1(description);
          return { ...shown, description, char };
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
  {
    const letters = writer.show(normal);
    letters.forEach(({ element }) => {
      element.classList.add("lights");
    });
    makeDivRect(letters).style.fill = "black";
  }

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
  writer.font = makeSmallCaps(5, 3);
  writer.show("Small  Caps");

  writer.lineHeight *= 1.125;
  const baseFont = makeLineFont(new FontMetrics(6, 0.5));
  const cubicFont = convertToCubics(baseFont);
  // You can adjust the font metrics to tell it your desired stroke width.  Or you can
  // read the recommended value from the fontMetrics (shown below) then update the elements
  // style with this value.
  //const strokeWidth = cubicFont.get("0")!.fontMetrics.strokeWidth.toString();
  const rowsOfLetters = [
    { roughness: 0.4, title: "Heartbeat" },
    { roughness: 0.44, title: "Toggle (snap)" },
    { roughness: 0.5, title: "Skywriting" },
    { roughness: 0.54, title: "Do the Wave" },
    { roughness: 0.64, title: "Blustery day" },
  ].map((lineInfo) => {
    const { roughness, title } = lineInfo;
    writer.font = makeRoughFont(cubicFont, { roughness });
    writer.CRLF();
    return writer.show(
      `${Math.round(roughness * 100)} ${title ?? "Rough Font"} [4XxYyZ]`
    );
  });
  const heartbeatRow = rowsOfLetters[0];
  const toggleRow = rowsOfLetters[1];
  const skywritingRow = rowsOfLetters[2];
  const waveRow = rowsOfLetters[3];
  const blusteryRow = rowsOfLetters[4];
  /**
   * On the screen this looks the same as the cubicFont font, but it includes
   * some extra M commands to match the output of rough.js.
   */
  const smoothFont = makeRoughFont(cubicFont, { roughness: 0 });

  // Cycle between different rough versions of each letter.
  // All versions of all letters use the same roughness settings.
  // The speed and complexity of each letter are different from each other.
  blusteryRow.forEach((letter) => {
    /**
     *
     * @returns 50% chance of 0, 50% chance of 1.
     */
    function coinFlip() {
      return (Math.random() + 0.5) | 0;
    }
    //letter.element.style.stroke="red";
    const pathCount = 3 + coinFlip() + coinFlip() + coinFlip();
    const frames = initializedArray(pathCount, () => ({
      d: letter.description.cssPath,
    }));
    frames.push(frames[0]);
    const maxDuration = (pathCount * 10000) / 3;
    const minDuration = maxDuration / 8;
    const duration = Math.exp(
      lerp(Math.log(minDuration), Math.log(maxDuration), Math.random())
    );
    letter.element.animate(frames, { duration, iterations: Infinity });
  });
  // Snaps between normal and rough.
  // There is a short animation period and a long period of no animation.
  toggleRow.forEach((letter) => {
    const smoothPath = smoothFont.get(letter.char)!.cssPath;
    const roughPath = letter.element.style.d;
    const moveTime = 0.03;
    const keyframes: Keyframe[] = [
      { offset: 0, d: roughPath },
      { offset: moveTime, d: smoothPath },
      { offset: 0.5, d: smoothPath },
      { offset: moveTime + 0.5, d: roughPath },
      { offset: 1, d: roughPath },
    ];
    letter.element.animate(keyframes, {
      duration: 2000,
      iterations: Infinity,
    });
  });
  {
    // Wave!
    /**
     * In units to be determined later.
     */
    const rampUpTime = 4;
    /**
     * Same units as `rampUpTime`.
     */
    const holdTime = 2;
    /**
     * Same units as `rampUpTime`.
     */
    const rampDownTime = 8;
    /**
     * How far after this letter starts should the next letter start.
     * Same units as `rampUpTime`.
     */
    const startNextTime = 3;
    const letterCount = waveRow.length;
    const period = letterCount * startNextTime;
    const msPerLetter = 5000;
    waveRow.forEach((letter, index) => {
      const smoothPath = smoothFont.get(letter.char)!.cssPath;
      const roughPath = letter.element.style.d;
      const smoothTransform = letter.element.style.transform;
      const roughTransform = smoothTransform + " scale(1.32)";

      const common = { d: smoothPath, transform: smoothTransform };
      const special = { d: roughPath, transform: roughTransform };
      const keyframes: Keyframe[] = [
        { offset: 0, ...common },
        { offset: rampUpTime / period, ...special },
        {
          offset: (rampUpTime + holdTime) / period,
          ...special,
        },
        { offset: (rampUpTime + holdTime + rampDownTime) / period, ...common },
        { offset: 1, ...common },
      ];

      letter.element.animate(keyframes, {
        duration: msPerLetter,
        iterationStart: 1 - index / letterCount,
        iterations: Infinity,
      });
    });
  }
  function makeDivRect(
    letters: readonly {
      readonly description: DescriptionOfLetter;
      readonly element: SVGElement;
      readonly baseline: number;
    }[]
  ) {
    const padding = 1;
    let topSoFar = Infinity;
    let bottomSoFar = -Infinity;
    letters.forEach((letter) => {
      const { description, baseline } = letter;
      const { fontMetrics } = description;
      topSoFar = Math.min(topSoFar, fontMetrics.top + baseline);
      bottomSoFar = Math.max(bottomSoFar, fontMetrics.bottom + baseline);
    });
    const top = topSoFar - padding;
    const bottom = bottomSoFar + padding;
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    element.x.baseVal.value = 0; //left;
    element.y.baseVal.value = top;
    element.width.baseVal.value = 100; //right - left;
    element.height.baseVal.value = bottom - top;
    svg.insertBefore(element, letters[0].element);
    return element;
  }
  {
    // Spreads out like old skywriting.
    const row = skywritingRow;
    makeDivRect(row).style.fill = "hwb(190 10% 0% / 1)";
    row.forEach((letter) => {
      const smoothPath = smoothFont.get(letter.char)!.cssPath;
      const roughPath = letter.element.style.d;
      const offset1 = 1 / 16;
      const offset2 = 15 / 16;
      const duration = 14000;
      const strokeWidthKeyframes: Keyframe[] = [
        { offset: 0, strokeWidth: 0.5 },
        { offset: offset1, strokeWidth: 0.5 },
        { offset: offset2, strokeWidth: 2.25 },
        { offset: 1, strokeWidth: 2.25 },
      ];
      const roughnessKeyframes: Keyframe[] = [
        { offset: 0, d: smoothPath },
        {
          offset: offset1,
          d: smoothPath,
          easing: "cubic-bezier(0.275, 0.760, 0.495, 1.005)",
        },
        { offset: offset2, d: roughPath },
        { offset: 1, d: roughPath },
      ];
      const opacityKeyframes: Keyframe[] = [
        { offset: 0, opacity: 1 },
        {
          offset: offset1,
          opacity: 1,
          easing: "cubic-bezier(0.280, 0.650, 0.630, 1.000)",
        }, // TODO this gets way too transparent way too fast!
        { offset: offset2, opacity: 0 },
        { offset: 1, opacity: 0 },
      ];
      letter.element.animate(opacityKeyframes, {
        duration,
        iterations: Infinity,
      });
      letter.element.animate(roughnessKeyframes, {
        duration,
        iterations: Infinity,
      });
      letter.element.animate(strokeWidthKeyframes, {
        duration,
        iterations: Infinity,
      });
      letter.element.style.stroke = "white";
    });
  }
  // beep, beep, beep, ...
  heartbeatRow.forEach((letter) => {
    const smoothPath = smoothFont.get(letter.char)!.cssPath;
    const roughPath = letter.element.style.d;
    const duration = 750;
    const easing = /*"ease-in-out"*/ "cubic-bezier(.55,0,1,.55)";
    letter.element.animate(
      [
        { offset: 0, d: smoothPath, easing },
        {
          offset: 0.5,
          d: roughPath,
          easing,
        },
        {
          offset: 1,
          d: smoothPath,
        },
      ],
      { duration, iterations: Infinity }
    );
  });

  {
    writer.CRLF();
    const minRoughness = 0.25;
    const maxRoughness = 1.5;
    const text =
      "The more I drink the more I want to tell you what I really think about you.";
    const roughness = makeLinear(
      0,
      minRoughness,
      text.length - 1,
      maxRoughness
    );
    const elementInfo =[...text].flatMap((char, index) => {
      writer.font = makeRoughFont(cubicFont, { roughness: roughness(index) });
      return writer.splitAndShow(char);      
    });
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
        const writeTime = 30000;
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
  }
}

// TODO:  Handwriting on a chalkboard effect as in https://www.youtube.com/watch?v=8K0i8odwA9Q
