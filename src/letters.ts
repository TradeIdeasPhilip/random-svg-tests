import { getById } from "phil-lib/client-misc";
import "./style.css";
import { initializedArray, makeLinear, sleep } from "phil-lib/misc";
import { PathShape } from "./path-shape";
import { makeLineFont } from "./line-font";
import rough from "roughjs";
import { Options } from "roughjs/bin/core";
import { DescriptionOfLetter, Font, FontMetrics } from "./letters-base";
import { assertFinite, lerp } from "./utility";

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
      return PathShape.fromStrings(pathStrings);
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
  class TextLayout {
    leftMargin = 0;
    rightMargin = 95;
    x = this.leftMargin;
    baseline = 0;
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
    static join(
      letters: {
        readonly x: number;
        readonly baseline: number;
        readonly description: { readonly shape: PathShape };
      }[]
    ) {
      return new PathShape(
        letters.flatMap(
          (letter) =>
            letter.description.shape.translate(letter.x, letter.baseline)
              .commands
        )
      );
    }
    displayText<
      T extends {
        readonly x: number;
        readonly baseline: number;
        readonly description: { readonly shape: PathShape };
      }
    >(letters: readonly T[]) {
      return letters.map((letter) => {
        const shape = letter.description.shape;
        const element = shape.makeElement();
        svg.appendChild(element);
        element.style.transform = `translate(${this.x}px,${this.baseline}px)`;
        return { ...letter, shape, element };
      });
    }
    private static wordBreak = /^( +|[^ ]+)(.*)/;
    addText(toAdd: string) {
      const invalid = new Set<string>();
      const result: {
        x: number;
        baseline: number;
        description: DescriptionOfLetter;
        char: string;
      }[] = [];
      while (true) {
        const pieces = TextLayout.wordBreak.exec(toAdd);
        if (!pieces) {
          break;
        }
        const thisWord = pieces[1];
        toAdd = pieces[2];
        if (thisWord[0] == " ") {
          this.addSpace(thisWord.length);
        } else {
          /**
           * Position relative to the first character.
           */
          let x = 0;
          /**
           * Placeholder.
           */
          const baseline = 0;
          const wordInfo = [...thisWord].flatMap((char) => {
            const description = this.getDescription(char);
            if (description) {
              const width =
                description.advance + description.fontMetrics.defaultKerning;
              const charInfo = { x, width, baseline, description, char };
              x += width;
              return charInfo;
            } else {
              invalid.add(char);
              return [];
            }
          });
          if (this.x + x > this.rightMargin && this.x > this.leftMargin) {
            this.carriageReturn();
            this.lineFeed();
          }
          wordInfo.forEach((charInfo) => {
            charInfo.x += this.x;
            charInfo.baseline = this.baseline;
            result.push(charInfo);
          });
          this.x += x;
        }
      }
      if (invalid.size > 0) {
        console.warn(invalid);
      }
      return result;
    }
    addSpace(numberOfSpaces = 1) {
      this.x += this.font.get("0")!.fontMetrics.spaceWidth * numberOfSpaces;
    }
  }

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
     * @deprecated See `showAndAdvance()`
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
     * @deprecated See `showAndAdvance()`
     */
    advance(description: DescriptionOfLetter) {
      this.x += description.advance + description.fontMetrics.defaultKerning;
    }
    /**
     * @deprecated See `showAndAdvance()`
     */
    moveToCursor(element: SVGElement) {
      element.style.transform = `translate(${this.x}px,${this.baseline}px)`;
    }
    showAndAdvance(element: SVGElement, advance: number) {
      if (this.x + advance > this.rightMargin && this.x > this.leftMargin) {
        this.carriageReturn();
        this.lineFeed();
      }
      svg.appendChild(element);
      element.style.transform = `translate(${this.x}px,${this.baseline}px)`;
      this.x += advance;
    }
    show1(description: DescriptionOfLetter) {
      this.makeRoom(description);
      const element = description.makeElement();
      svg.appendChild(element);
      const { x, baseline } = this;
      this.moveToCursor(element);
      this.advance(description);
      return { element, x, baseline };
    }
    splitAndShow1(description: DescriptionOfLetter) {
      this.makeRoom(description);
      const elementInfo = description.makeElements();
      elementInfo.forEach(({ element }) => {
        svg.appendChild(element);
        this.moveToCursor(element);
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
      // This is a really bad interface.  show() vs splitAndShow()
      // I knew that from the beginning.  Now that I've been manipulating paths more I see the answer.
      // One item should be responsible for layout:  Assign an x and y coordinate to each letter and remember where we left off.
      // Another should be responsible for displaying things that are in that format.
      // Some things (like splitting each character to PathSegments) should be done to the the intermediate data structure between those two calls.
      // So the structure will have to be flexible.  E.g. allow for multiple PathSegment objects per record.
      // And other things can consume this data.  E.g. this should be a valid input to a lot of special effects.
      // Or an input to the thing that merges multiple paths into one path.
      // TODO fix this soon.
      const invalid = new Set<string>();
      const result = [...message].flatMap((char) => {
        const description = this.getDescription(char);
        if (description) {
          return this.splitAndShow1(description);
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
    assertFinite(distance);
    return distance;
  };
  const { totalLength, maxLength } = elementInfo.reduce(
    ({ totalLength, maxLength }, { element }, index) => {
      const elementLength = element.getTotalLength();
      assertFinite(elementLength);
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
    { roughness: 0.59, title: "Wavy Lights." },
    { roughness: 0.64, title: "Blustery day.i" },
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
  const lightsRow = rowsOfLetters[4];
  const blusteryRow = rowsOfLetters[5];
  /**
   * On the screen this looks the same as the cubicFont font, but it includes
   * some extra M commands to match the output of rough.js.
   */
  const smoothFont = makeRoughFont(cubicFont, { roughness: 0 });

  makeDivRect(lightsRow).style.fill = "black";
  lightsRow.forEach(({ element }) => {
    element.classList.add("lights");
  });

  // Cycle between different rough versions of each letter.
  // All versions of all letters use the same roughness settings.
  // The speed and complexity of each letter are different from each other.
  [lightsRow, blusteryRow].forEach((row) => {
    row.forEach((letter) => {
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
    const elementInfo = [...text].flatMap((char, index) => {
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
        previous.endX - current.startX, // Used HERE (https://www.youtube.com/watch?v=4yVOFGLoeIE for details)
        previous.endY - current.startY
      );
      assertFinite(distance);
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
  {
    writer.font = baseFont;
    writer.CRLF();
    function makeIt(it: string) {
      const layout = new TextLayout();
      layout.font = baseFont;
      const a = layout.addText(it);
      const shape = TextLayout.join(a);
      const advance = layout.x;
      return { shape, advance };
    }
    const stopShapeInfo = makeIt("Stop");
    const goShapeInfo = makeIt("Go");
    writer.CRLF();
    const stopElement = stopShapeInfo.shape.makeElement();
    writer.showAndAdvance(stopElement, stopShapeInfo.advance);
    writer.showSpace();
    const goElement = goShapeInfo.shape.makeElement();
    writer.showAndAdvance(goElement, goShapeInfo.advance);
    const morphable = goShapeInfo.shape.matchForMorph(stopShapeInfo.shape);
    console.log({
      goCommands: goShapeInfo.shape.commands,
      stopCommands: stopShapeInfo.shape.commands,
      goString: morphable.pathForThis,
      stopString: morphable.pathForOther,
    });
    const morphableGoPath = morphable.pathForThis;
    const morphableStopPath = morphable.pathForOther;
    const morphingElement = stopShapeInfo.shape.makeElement();
    writer.showSpace();
    writer.showAndAdvance(morphingElement, stopShapeInfo.advance);
    writer.showAndAdvance(morphingElement, stopShapeInfo.advance);
    morphingElement.animate(
      [
        { d: morphableGoPath },
        { d: morphableGoPath, easing: "ease" },
        { d: morphableStopPath },
        { d: morphableStopPath, easing: "ease" },
        { d: morphableGoPath },
      ],
      { duration: 5000, iterations: Infinity }
    );
  }
  // Automatically adjust the size of the SVG to fit everything I've added so far.
  if (writer.x > writer.rightMargin) {
    writer.CRLF();
  }
  svg.viewBox.baseVal.height =
    writer.baseline + writer.font.get("0")!.fontMetrics.bottom;
}

// TODO:  Steal the handwriting on a chalkboard effect as in https://www.youtube.com/watch?v=8K0i8odwA9Q
// And a lot of other effects from aftereffects.  Once I click on that video I see a lot of other
// effects.
//
