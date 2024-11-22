import { getById } from "phil-lib/client-misc";
import "./sky-writing.css";
import { TextLayout } from "./letters-more";
import { describeFont, DescriptionOfLetter, Font } from "./letters-base";
import { PathShape, QCommand } from "./path-shape";
import { lerpPoints, Point } from "./math-to-path";
import { makeLineFont } from "./line-font";
import { createPathDebugger } from "./path-debugger-widget";
import {
  assertFinite,
  angleBetween,
  radiansPerDegree,
  polarToRectangular,
  HasSeed,
  Random,
} from "phil-lib/misc";

// MARK: One time setup

const inputTextArea = getById("input", HTMLTextAreaElement);
const mainSvg = getById("main", SVGElement);
const completionRatioInput = getById("completionRatio", HTMLInputElement);

{
  const textLayout = new TextLayout();
  const font = textLayout.font;
  const { normal } = describeFont(font);
  const span = getById("available", HTMLSpanElement);
  span.innerText = [...normal].sort().join(" ");
}

/**
 * The image before the morph starts.
 */
const debuggerBefore = createPathDebugger();
debuggerBefore.insertBefore("debuggerBefore");

/**
 * The image after the morph is complete.
 */
const debuggerAfter = createPathDebugger();
debuggerAfter.insertBefore("debuggerAfter");

// MARK: AnimationController

/**
 * This is shared by all animations.
 * In particular it makes sure than no more than one animation is running at a time.
 */
abstract class AnimationController {
  static #current: undefined | AnimationController;
  /**
   * Stop the current animation (if there is one) and clear the SVG.
   */
  static doCleanup() {
    this.#current?.doCleanup();
    this.#current = undefined;
    mainSvg.innerHTML = "";
  }
  /**
   * Does nothing if there is no current animation.
   */
  static restartCurrent() {
    const current = this.#current;
    if (current) {
      this.doCleanup();
      current.start();
    }
  }
  /**
   * Start this animation.
   *
   * This will stop any other animations from running before starting the new animation.
   */
  start() {
    AnimationController.doCleanup();
    this.startImpl();
    AnimationController.#current = this;
  }
  protected abstract startImpl(): void;
  protected doCleanup() {}
}

// MARK: Simple

/**
 * Display the text with no embellishments.
 */
class Simple extends AnimationController {
  override startImpl(): void {
    const textLayout = new TextLayout();
    textLayout.restart();
    const text = inputTextArea.value;
    const t = textLayout.addText(text);
    textLayout.displayText(t, mainSvg);
    mainSvg.ownerSVGElement!.viewBox.baseVal.height =
      textLayout.baseline + textLayout.font.get("0")!.fontMetrics.bottom;
  }
  static start() {
    new this().start();
  }
}

// MARK: Handwriting

/**
 * As time progresses (simulated by the range control) we draw more of the text.
 */
class Handwriting extends AnimationController {
  protected override startImpl(): void {
    const textLayout = new TextLayout();
    textLayout.restart();
    const text = inputTextArea.value;
    const t = textLayout.addText(text);
    mainSvg.ownerSVGElement!.viewBox.baseVal.height =
      textLayout.baseline + textLayout.font.get("0")!.fontMetrics.bottom;
    const pathShape = TextLayout.join(t);
    const parentGElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    parentGElement.classList.add("handwriting");
    mainSvg.appendChild(parentGElement);
    let soFar = 0.01;
    pathShape.splitOnMove().forEach((shape) => {
      const element = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      element.setAttribute("d", shape.rawPath);
      parentGElement.appendChild(element);
      const before = soFar;
      const length = element.getTotalLength();
      const after = before + length;
      soFar = after;
      element.style.setProperty("--offset", before.toString());
      element.style.setProperty("--length", length.toString());
    });
    const abortController = new AbortController();
    this.doCleanup = () => abortController.abort();
    // finish one time stuff.
    const totalLength = soFar;
    const updatePosition = () => {
      const position = completionRatioInput.valueAsNumber * totalLength;
      assertFinite(position);
      parentGElement.style.setProperty("--total-position", position.toString());
    };
    updatePosition();
    completionRatioInput.addEventListener("input", updatePosition, {
      signal: abortController.signal,
    });
  }
  static start() {
    new this().start();
  }
}

// MARK: Skywriting

/**
 * This is a combination of multiple effects.
 * See the skywriting example at https://tradeideasphilip.github.io/random-svg-tests/letters.html for the previous version of this effect.
 * The goal of this project is do a better version of this effect.
 * The other classes / animations let me test the parts individually.
 * This is very rough at the moment, little more than a placeholder.
 */
class Skywriting extends AnimationController {
  protected override startImpl(): void {
    const textLayout = new TextLayout();
    textLayout.restart();
    const text = inputTextArea.value;
    const t = textLayout.addText(text);
    mainSvg.ownerSVGElement!.viewBox.baseVal.height =
      textLayout.baseline + textLayout.font.get("0")!.fontMetrics.bottom;
    const pathShape = TextLayout.join(t);
    const parentGElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g"
    );
    parentGElement.classList.add("handwriting", "skywriting");
    mainSvg.appendChild(parentGElement);
    let soFar = 0.01;
    pathShape.splitOnMove().forEach((shape) => {
      const element = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      element.setAttribute("d", shape.rawPath);
      parentGElement.appendChild(element);
      const before = soFar;
      const length = element.getTotalLength();
      const after = before + length;
      soFar = after;
      element.style.setProperty("--offset", before.toString());
      element.style.setProperty("--length", length.toString());
    });
    const abortController = new AbortController();
    this.doCleanup = () => abortController.abort();
    // finish one time stuff.
    /**
     * Continue for enough time to add this much length.
     * Nothing will be added but what's there will be animated.
     */
    const extraLength = 40;
    const totalLength = soFar + extraLength;
    const updatePosition = () => {
      const position = completionRatioInput.valueAsNumber * totalLength;
      assertFinite(position);
      parentGElement.style.setProperty("--total-position", position.toString());
    };
    updatePosition();
    completionRatioInput.addEventListener("input", updatePosition, {
      signal: abortController.signal,
    });
  }
  static start() {
    new this().start();
  }
}

// MARK: Rough

/**
 * Equal or almost equal.  Ideally I'd use == but that would never
 * work because of round off error.
 * @param angle1
 * @param angle2
 * @returns true if the inputs are within 1° of each other.
 */
function similarAngles(angle1: number, angle2: number) {
  const difference = angleBetween(angle1, angle2);
  /**
   * 1° converted to radians.
   */
  const cutoff = 1 * radiansPerDegree;
  return Math.abs(difference) < cutoff;
}

/**
 * This tests the part of the code that makes lines less straight, etc.
 *
 * My first attempt used Rough.js.
 * That package is great, but I ran into some limitations.
 * For example:
 * * Consider
 */
class Rough extends AnimationController {
  /**
   *
   * @param shape The initial shape that you want to make rough.
   * @param roughness Roughly how many svg units each point is allowed to move.
   * @returns `after` is the rough version of the initial shape.
   * `before` will look the same as (or as close as possible to) the initial
   * shape, but it will be in a form that can morph into the rough shape.
   */
  static makeRoughShape(
    shape: PathShape,
    roughness: number,
    random: () => number
  ): { before: PathShape; after: PathShape } {
    const before = shape.commands.map((command) => {
      if (command instanceof QCommand) {
        return command;
      } else {
        return QCommand.line2({ x: command.x0, y: command.y0 }, command);
      }
    });
    const after = new Array<QCommand>();
    new PathShape(before).splitOnMove().forEach((connectedShape): void => {
      const commandInfo = connectedShape.commands.map((command) => {
        if (!(command instanceof QCommand)) {
          throw new Error("wtf");
        }
        const element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        const d = new PathShape([command]).rawPath;
        element.setAttribute("d", d);
        const length = element.getTotalLength();
        return { command, length };
      });
      const sharedPoints: ReadonlyArray<Point> = commandInfo.flatMap(
        ({ command }, index) => {
          if (index == 0) {
            return [];
          } else {
            return { x: command.x0, y: command.y0 };
          }
        }
      );

      function adjust(
        initial: Point,
        limit: number
      ): Point & { offset: Point; initial: Point } {
        const r = Math.min(roughness, limit) * random();
        const θ = random() * Math.PI * 2;
        const offset = polarToRectangular(r, θ);
        const x = initial.x + offset.x;
        const y = initial.y + offset.y;
        return { x, y, offset, initial };
      }

      const firstCommandInfo = commandInfo[0];
      const endPoints = [
        adjust(
          {
            x: firstCommandInfo.command.x0,
            y: firstCommandInfo.command.y0,
          },
          firstCommandInfo.length
        ),
      ];
      sharedPoints.forEach((point, index) => {
        const before = commandInfo[index];
        const after = commandInfo[index + 1];
        const limit = Math.min(before.length, after.length) / 2;
        endPoints.push(adjust(point, limit));
      });
      const lastCommandInfo = commandInfo[commandInfo.length - 1];
      endPoints.push(adjust(lastCommandInfo.command, lastCommandInfo.length));

      if (
        endPoints.length != commandInfo.length + 1 ||
        commandInfo.length != sharedPoints.length + 1
      ) {
        throw new Error("wtf");
      }

      commandInfo.forEach((commandInfo, index): void => {
        const from = endPoints[index];
        const to = endPoints[index + 1];
        let middle: Point = {
          x: commandInfo.command.x1,
          y: commandInfo.command.y1,
        };

        // Adjust to match the average of the adjustments of the two end points.
        middle = {
          x: middle.x + (from.offset.x + to.offset.x) / 2,
          y: middle.y + (from.offset.y + to.offset.y) / 2,
        };

        // Add additional randomness.
        middle = adjust(middle, commandInfo.length);

        after.push(
          QCommand.controlPoints(from.x, from.y, middle.x, middle.y, to.x, to.y)
        );
        {
          if (index > 0) {
            // This command and the previous command are connected.
            if (
              similarAngles(
                before.at(after.length - 2)!.requestedOutgoingAngle,
                before.at(after.length - 1)!.requestedIncomingAngle
              )
            ) {
              // This was a smooth connection before randomizing.  Make it smooth again.
              const originalLast = after.pop()!;
              const originalPrevious = after.pop()!;
              const average =
                originalPrevious.requestedOutgoingAngle +
                angleBetween(
                  originalPrevious.requestedOutgoingAngle,
                  originalLast.requestedIncomingAngle
                ) /
                  2;
              let previous: QCommand = originalPrevious.newAngles(
                undefined,
                average
              );
              let last: QCommand = originalLast.newAngles(average, undefined);
              function somethingFailed() {
                return [previous, last].some(
                  (command) =>
                    command.creationInfo.source == "angles" &&
                    !command.creationInfo.success
                );
              }
              if (somethingFailed()) {
                const replacement = QCommand.angles(
                  previous.x0,
                  previous.y0,
                  previous.incomingAngle,
                  last.x,
                  last.y,
                  last.outgoingAngle
                );
                if (replacement.creationInfo.success) {
                  const pathElement = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                  );
                  pathElement.setAttribute(
                    "d",
                    new PathShape([replacement]).rawPath
                  );
                  const totalLength = pathElement.getTotalLength();
                  const center = totalLength / 5;
                  const offset = totalLength / 200;
                  const a = pathElement.getPointAtLength(center - offset);
                  const b = pathElement.getPointAtLength(center + offset);
                  const centerPoint = lerpPoints(a, b, 0.5);
                  const angleAtCenter = Math.atan2(b.y - a.y, b.x - a.x);
                  previous = QCommand.angles(
                    previous.x0,
                    previous.y0,
                    previous.incomingAngle,
                    centerPoint.x,
                    centerPoint.y,
                    angleAtCenter
                  );
                  last = QCommand.angles(
                    centerPoint.x,
                    centerPoint.y,
                    angleAtCenter,
                    last.x,
                    last.y,
                    last.outgoingAngle
                  );
                  console.log("merged", previous, last);
                }
              }
              if (somethingFailed()) {
                previous = originalPrevious;
                last = originalLast;
              }
              after.push(previous);
              after.push(last);
            }
          }
        }
      });
    });
    return { before: new PathShape(before), after: new PathShape(after) };
  }
  /**
   * This is a simple alternative to the `Rough` class.
   *
   * This font will give you a rough version of each letter.
   * And the `shape` of the letter will change randomly each time you ask for that property.
   *
   * The `Rough` class goes directly to makeRoughShape so it can grab two versions of the shape.
   * This is required if you want to animate a change from no roughness to full roughness.
   * It was tough to map this functionality into a font because a font is such a simple interface.
   * That's why the `Rough` class eventually stopped using this function.  However, this function
   * should suffice in a lot of cases.
   * @param baseFont Start from this font.
   * @returns The new font.
   */
  static makeRoughFont(baseFont: Font, seed?: string): Font & HasSeed {
    const font: Font = new Map();
    if (seed == "" || seed === undefined) {
      seed = Random.newSeed();
    }
    const random = Random.create(seed);
    baseFont.forEach((baseLetter, key) => {
      const newLetter = new DescriptionOfLetter(
        () =>
          this.makeRoughShape(
            baseLetter.shape,
            baseLetter.fontMetrics.strokeWidth * 1.5,
            random
          ).after,
        baseLetter.advance,
        baseLetter.fontMetrics
      );
      font.set(key, newLetter);
    });
    const result: any = font;
    result.seed = seed;
    return result;
  }
  static #random = Random.create(
    /* Insert seed here. */ "[1729402151840,42,2115899219,1537839617]"
  );
  static #recentValues: readonly {
    readonly char: string;
    readonly shape0: PathShape;
    readonly shape1: PathShape;
  }[] = [];
  private static makeRough<
    T extends {
      readonly char: string;
      readonly shape: PathShape;
      readonly element: SVGPathElement;
      readonly description: DescriptionOfLetter;
    }
  >(letters: readonly T[]) {
    /**
     * Prepare a path element to display one of two shapes, or an interpolation between those two.
     * Returns an object used to control this display.
     * @param param0 `param0.shape0` is the initial shape. `param0.shape1` is the final shape.
     * @param element The path to animate.
     * @returns The new `Animation` object.
     * The controller is initially paused.
     * The intent is for the caller to update the `currentTime` of this controller with values between 0.0 and 1.0, inclusive.
     *
     * The current intent is to use the scrollbar to control the animation.
     * Eventually the interface could change to use standard css times and timing functions.
     */
    function animate(
      { shape0, shape1 }: { shape0: PathShape; shape1: PathShape },
      element: SVGPathElement
    ) {
      const keyframes: Keyframe[] = [
        { offset: 0, d: shape0.cssPath },
        { offset: 1, d: shape1.cssPath },
      ];
      const animation = element.animate(keyframes, {
        duration: 1,
        fill: "both",
      });
      animation.pause();
      return animation;
    }
    /**
     * These are the shapes that we used last time.
     */
    const available = [...this.#recentValues];
    /**
     * This are the characters we want to use.
     */
    const required = [...letters];

    /**
     * We will return a list of items of this type.
     *
     * The input items (in `T`) are copied as is.
     */
    type Result = T & {
      /**
       * Display this when animation.currentTime == 0.
       */
      readonly shape0: PathShape;
      /**
       * Display this when animation.currentTime == 1.
       */
      readonly shape1: PathShape;
      /**
       * Use this to select what to display.
       */
      readonly animation: Animation;
    };
    /**
     * Start from the beginning of the current string and the beginning of previous string.
     * Keep pairing up the characters until the first character that doesn't match any more.
     */
    // TODO !!!‼! This is broken.  If I add text at the end it's fine.  Sometimes deleting from
    // the middle seems to break the end part.  Or maybe it was when I was inserting in the
    // middle.  Definitely very repeatable.  TODO fix this bug.
    const front: Result[] = [];
    while (true) {
      if (available.length == 0) {
        break;
      }
      if (required.length == 0) {
        break;
      }
      if (available[0].char != required[0].char) {
        break;
      }
      const toCopy = available.shift()!;
      const request = required.shift()!;
      front.push({
        ...request,
        shape0: toCopy.shape0,
        shape1: toCopy.shape1,
        animation: animate(toCopy, request.element),
      });
    }

    /**
     * Now try to match characters from the end.
     *
     * The idea is that you are likely to type, delete, cut or paste just one area of the field
     * at a time.  Everything before and after that change should still match up.
     */
    const back: Result[] = [];
    while (true) {
      if (available.length == 0) {
        break;
      }
      if (required.length == 0) {
        break;
      }
      if (available.at(-1)!.char != required.at(-1)!.char) {
        break;
      }
      const toCopy = available.pop()!;
      const request = required.pop()!;
      front.push({
        ...request,
        shape0: toCopy.shape0,
        shape1: toCopy.shape1,
        animation: animate(toCopy, request.element),
      });
    }

    /**
     * Create new shapes for any remaining letters.
     */
    const middle: Result[] = required.map((letter) => {
      const rough = Rough.makeRoughShape(
        letter.shape,
        letter.description.fontMetrics.strokeWidth * 1.5, // This is 2.25 in my current examples.
        Rough.#random
      );
      const shape0 = rough.before;
      const shape1 = rough.after;
      return {
        ...letter,
        shape0,
        shape1,
        animation: animate({ shape0, shape1 }, letter.element),
      };
    });

    const result: readonly Result[] = [...front, ...middle, ...back];
    this.#recentValues = result;
    return result;
  }
  protected override startImpl(): void {
    const textLayout = new TextLayout();
    textLayout.font = makeLineFont(7);
    const fontMetrics = textLayout.font.get("0")!.fontMetrics;
    textLayout.lineHeight = fontMetrics.bottom - fontMetrics.capitalTop;
    textLayout.restart();
    const text = inputTextArea.value;
    const t = textLayout.addText(text);
    const t1 = textLayout.displayText(t, mainSvg);
    const t2 = Rough.makeRough(t1);
    t2.forEach((letter) => {
      letter.element.addEventListener("click", () => {
        console.log(letter);
        debuggerBefore.pathShape = letter.shape0;
        debuggerAfter.pathShape = letter.shape1;
        navigator.clipboard.writeText(JSON.stringify(letter.shape1));
        //letter.shape.dump();
        //letter.shape1.dump();
      });
      letter.element.style.cursor = "grab";
    });
    mainSvg.ownerSVGElement!.viewBox.baseVal.height =
      textLayout.baseline + textLayout.font.get("0")!.fontMetrics.bottom;
    const abortController = new AbortController();
    this.doCleanup = () => abortController.abort();

    // Attach the range control to the characters we just created above.
    const updateTime = () => {
      const time = completionRatioInput.valueAsNumber;
      assertFinite(time);
      t2.forEach(({ animation }) => {
        animation.currentTime = time;
      });
    };
    updateTime();
    completionRatioInput.addEventListener("input", updateTime, {
      signal: abortController.signal,
    });
  }
  static start() {
    new this().start();
  }
}

// MARK: Select an animation

// We someone types anything, restart the animation from scratch.
inputTextArea.addEventListener("input", () => {
  AnimationController.restartCurrent();
});

function selectAnimation() {
  const id = document.querySelector('input[name="type"]:checked')?.id;
  switch (id) {
    case "simpleType": {
      Simple.start();
      break;
    }
    case "handwritingType": {
      new Handwriting().start();
      break;
    }
    case "skywritingType": {
      new Skywriting().start();
      break;
    }
    case "roughType": {
      new Rough().start();
      break;
    }
    default: {
      throw new Error(`invalid id: ${id}`);
    }
  }
}

selectAnimation();
document.querySelectorAll('input[name="type"]').forEach((element) => {
  element.addEventListener("click", selectAnimation);
});
