import { getById } from "phil-lib/client-misc";
import "./style.css";
import { initializedArray, makeLinear, sleep } from "phil-lib/misc";
import { PathShape, Command } from "./path-shape";
import { makeLineFont } from "./line-font";
import rough from "roughjs";
import { Options } from "roughjs/bin/core";
import { describeFont, DescriptionOfLetter, Font, FontMetrics } from "./letters-base";
import { assertFinite, lerp, rotateArray, shuffleArray } from "./utility";
import { TextLayout, Writer } from "./letters-more";

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
  const writer = new Writer(svg);
  const {normal}=describeFont(writer.font);

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
    { roughness: 0.4, title: '"Heartbeat!"' },
    { roughness: 0.44, title: "Toggle @#$%" },
    { roughness: 0.5, title: "Skywriting ♡" },
    { roughness: 0.54, title: "The Wave's *" },
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
    const stopShapeInfo = TextLayout.textToShape("Stop°", baseFont);
    const goShapeInfo = TextLayout.textToShape("Go◯", baseFont);
    writer.CRLF();
    const stopElement = stopShapeInfo.shape.makeElement();
    writer.showAndAdvance(stopElement, stopShapeInfo.advance);
    writer.showSpace();
    const goElement = goShapeInfo.shape.makeElement();
    writer.showAndAdvance(goElement, goShapeInfo.advance);
    const morphable = goShapeInfo.shape.matchForMorph(stopShapeInfo.shape);
    //console.log({ goShapeInfo, stopShapeInfo, morphable });
    const morphableGoPath = morphable[0];
    const morphableStopPath = morphable[1];
    const morphingElement = stopShapeInfo.shape.makeElement();
    writer.showSpace();
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
  {
    // This next section shows "123" morphing into "ABC."
    // I used this for the thumbnail of https://www.youtube.com/watch?v=uIcByP_9NuM
    /**
     *
     * @param toStack What to display.
     * @returns A shape with all of the letters stacked vertically.
     */
    const stackIt = (toStack: string) => {
      return TextLayout.textToShape([...toStack].join("\n"), baseFont).shape;
    };
    const initial = stackIt("123");
    const final = stackIt("ABC");
    const [initialD, finalD] = initial.matchForMorph(final);
    writer.CRLF();
    initializedArray(7, (columnIndex) => {
      const element = initial.makeElement();
      writer.showAndAdvance(element, 10 * (6 / 7) * 0.86);
      /*const animation = */ element.animate([{ d: initialD }, { d: finalD }], {
        duration: Number.MAX_SAFE_INTEGER,
        iterations: 1,
        iterationStart: (columnIndex / 6) * 0.999,
      });
      // The animation will not update when paused.  You can set the iterationStart or a few
      // other properties to change the position of the animation, but nothing will change on
      // the screen until the animation is resumed. :(
      // animation.pause();
    });
    writer.lineFeed(2.5);
  }
  {
    writer.CRLF();
    type Shapes = readonly [PathShape, PathShape];
    type ReadonlyShapes = readonly [PathShape, PathShape];
    function showMorph(shapes: ReadonlyShapes) {
      const element = shapes[0].makeElement();
      writer.showAndAdvance(element, 0);
      const d = shapes[0].matchForMorph(shapes[1]);
      element.animate(
        [
          { d: d[0] },
          { d: d[0], easing: "ease" },
          { d: d[1] },
          { d: d[1], easing: "ease" },
          { d: d[0] },
        ],
        { duration: 5000, iterations: Infinity }
      );
    }
    function shuffleOne(shapes: ReadonlyShapes): Shapes {
      const newSecondShape = new PathShape(
        shuffleArray([...shapes[1].commands])
      );
      return [shapes[0], newSecondShape];
    }
    shuffleOne;
    function reverseOne(shapes: ReadonlyShapes): Shapes {
      const newSecondShape = new PathShape(shapes[1].commands.toReversed());
      return [shapes[0], newSecondShape];
    }
    function rotateOneLinearly(shapes: ReadonlyShapes, ratio: number): Shapes {
      const commands = shapes[1].commands;
      const howMany = Math.round(commands.length * ratio);
      const rotatedCommands = rotateArray(commands, howMany);
      const newSecondShape = new PathShape(rotatedCommands);
      return [shapes[0], newSecondShape];
    }
    rotateOneLinearly;
    function closestSegments(shapes: ReadonlyShapes): Shapes {
      {
        const empty = shapes.map((shape) => !shape.commands.length);
        if (empty[0] && empty[1]) {
          return shapes;
        }
        if (empty[0] || empty[1]) {
          throw new Error("wtf");
        }
      }
      function compare(
        a: Command,
        b: Command
      ): { distance: number; needToReverse: boolean } {
        const same =
          Math.hypot(a.x - b.x, a.y - b.y) +
          Math.hypot(a.x0 - b.x0, a.y0 - b.y0);
        const reversed =
          Math.hypot(a.x - b.x0, a.y - b.y0) +
          Math.hypot(a.x0 - b.x0, a.y - b.y);
        const needToReverse = reversed < same;
        const distance = needToReverse ? reversed : same;
        return { distance, needToReverse };
      }
      // We could try every combination, but that would take ridiculous time.
      // Maybe:
      //   let extra = longer.length - shorter.length
      //   For each item in the longer list
      //     compare it to each item in the shorter list to find the best match.
      //     If (extra > 0) {
      //         extra--;
      //         increment the use count of this item.
      //      } else {
      //         only allow a use count to go from 0 to 1 now.
      //         i.e. don't reuse or split any segments
      //      }
      // Or maybe one single pass that is allowed to steal from another if that's
      // a net positive, or take one that's still available.  Like a white elephant
      // party.
      //
      // Or iterate from the shorter list.
      //   Maybe randomize it first, so there's no obvious bias.
      //   Each item in the shorter list picks its favorite from the longer list.
      //   That piece is removed from the longer list so it can't be reused.
      // Then there will be some pieces left in the longer list.
      //   Iterate over those.
      //   Each can pick it's favorite from the short list.
      //   Each will cause a duplication (or a split) of the piece from the short list.
      //   Every piece on the short list is valid and can be used as many times as requested.
      const commands = shapes.map((shape) => shape.commands);
      const [shorter, longer] =
        commands[0].length < commands[1].length
          ? commands
          : commands.toReversed();
      const longerSource = [...longer];
      const longerDestination: Command[] = [];
      const newShorter = shuffleArray([...shorter]);
      newShorter.forEach((shorterCommand) => {
        let bestSoFar = {
          command: undefined! as Command,
          distance: Infinity,
          index: NaN,
        };
        longerSource.forEach((longerCommand, index) => {
          const { distance, needToReverse } = compare(
            shorterCommand,
            longerCommand
          );
          if (distance < bestSoFar.distance) {
            const command = needToReverse
              ? longerCommand.toCubic().reverse()
              : longerCommand;
            bestSoFar = { command, distance, index };
          }
        });
        const winner = bestSoFar;
        longerDestination.push(winner.command);
        longerSource.splice(winner.index, 1);
      });
      if (newShorter.length != longerDestination.length) {
        throw new Error("wtf");
      }
      longerSource.forEach((longerCommand) => {
        let bestSoFar = {
          command: undefined! as Command,
          distance: Infinity,
          index: NaN,
        };
        newShorter.forEach((shorterCommand, index) => {
          const { distance, needToReverse } = compare(
            shorterCommand,
            longerCommand
          );
          if (distance < bestSoFar.distance) {
            const command = needToReverse
              ? shorterCommand.toCubic().reverse()
              : shorterCommand;
            bestSoFar = { command, distance, index };
          }
        });
        const winner = bestSoFar;
        newShorter.push(winner.command);
        longerDestination.push(longerCommand);
      });
      if (newShorter.length != longerDestination.length) {
        throw new Error("wtf");
      }
      const newCommands = [newShorter, longerDestination];
      if (shorter == commands[1]) {
        newCommands.reverse();
      }
      return [new PathShape(newCommands[0]), new PathShape(newCommands[1])];
    }
    function rotateOneAround(
      _shapes: ReadonlyShapes,
      _centerX: number,
      _centerY: number,
      _radians: number
    ) {
      throw new Error("TODO");
    }
    rotateOneAround;
    const fromShapeInfo = TextLayout.textToShape(
      "Round\n  and\nround!",
      baseFont
    );
    const toShapeInfo = TextLayout.textToShape(
      "Circle\n  in a\nspiral",
      baseFont
    );
    const shapes = [fromShapeInfo.shape, toShapeInfo.shape] as const;
    showMorph(shapes);
    writer.x += Math.max(fromShapeInfo.advance, toShapeInfo.advance);
    writer.showSpace(4);
    showMorph(closestSegments(shapes));
    writer.x += Math.max(fromShapeInfo.advance, toShapeInfo.advance);
    writer.showSpace(4);
    showMorph(reverseOne(shapes));
    writer.lineFeed(2.5);
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
