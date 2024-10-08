import { getById } from "phil-lib/client-misc";
import "./sky-writing.css";
import { TextLayout } from "./letters-more";
import { describeFont, DescriptionOfLetter, Font } from "./letters-base";
import { assertFinite, polarToRectangular } from "./utility";
import { Command, PathShape, QCommand } from "./path-shape";
import { lerpPoints, Point } from "./math-to-path";

const inputTextArea = getById("input", HTMLTextAreaElement);
const mainSvg = getById("main", SVGElement);

{
  const textLayout = new TextLayout();
  const font = textLayout.font;
  const { normal } = describeFont(font);
  const span = getById("available", HTMLSpanElement);
  span.innerText = [...normal].sort().join(" ");
}

abstract class AnimationController {
  static #current: undefined | AnimationController; // (() => void);
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
  start() {
    AnimationController.doCleanup();
    this.startImpl();
    AnimationController.#current = this;
  }
  protected abstract startImpl(): void;
  protected doCleanup() {}
}

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

const completionRatioInput = getById("completionRatio", HTMLInputElement);

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
    let soFar = 0;
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
    //    throw new Error("Method not implemented."); TODO finishme
  }
  static start() {
    new this().start();
  }
}
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
    let soFar = 0;
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

function noContinuousCurves(shape: PathShape): boolean {
  let previousAngle = NaN;
  for (const command of shape.commands) {
    const { incomingAngle, outgoingAngle } = command;
    // TODO this next line still fails A LOT!
    assertFinite(incomingAngle, outgoingAngle);
    if (!Number.isNaN(previousAngle)) {
      const difference = Math.abs(previousAngle - incomingAngle);
      if (difference < Math.PI / 180) {
        return false;
      }
    }
    previousAngle = outgoingAngle;
  }
  return true;
}
noContinuousCurves;
function roughStrategy1(shape: PathShape): boolean {
  // All are lines.  That's a good start for now.  noContinuousCurves() can be better but that needs a lot of work.
  // This strategy should work for ⭒ but not for o.  They both use only Q commands.  I want to treat the case of the
  // curvy star ⭒ exactly like the case of the straight line star.  But I have to do something different for the
  // o.  Taking something round and giving it a lot of kinks usually looks bad.  That's the main reason I'm avoiding
  // it now.  I'm not sure what my strategy will be, yet.
  // Until I implement incomingAngle and outgoingAngle I have not way to know the difference between these cases.
  return !shape.commands.some((command) => command.command != "L");
}

class Rough extends AnimationController {
  //enroughenify
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
    roughness: number
  ): { before: PathShape; after: PathShape } {
    // should be a flatMap of parts????
    const before = new Array<Command>();
    const after = new Array<Command>();
    shape.splitOnMove().forEach((connectedShape): void => {
      // TODO I should also check that these are all L or Q commands.
      if (roughStrategy1(connectedShape)) {
        const commands = connectedShape.commands;
        const sharedPoints: ReadonlyArray<Point> = commands.flatMap(
          (command, index) => {
            if (index == 0) {
              return [];
            } else {
              return { x: command.x0, y: command.y0 };
            }
          }
        );

        function adjust(
          initial: Point,
          scale?: "½"
        ): Point & { offset: Point; initial: Point } {
          const r = roughness * (scale ? Math.SQRT1_2 : 1) * Math.random();
          const θ = Math.random() * Math.PI * 2;
          const offset = polarToRectangular(r, θ);
          const x = initial.x + offset.x;
          const y = initial.y + offset.y;
          return { x, y, offset, initial };
        }

        const firstCommand = commands[0];
        const endPoints = [
          adjust({ x: firstCommand.x0, y: firstCommand.y0 }, "½"),
        ];
        sharedPoints.forEach((point) => {
          endPoints.push(adjust(point));
        });
        const lastCommand = commands[commands.length - 1];
        endPoints.push(adjust(lastCommand));

        if (
          endPoints.length != commands.length + 1 ||
          commands.length != sharedPoints.length + 1
        ) {
          throw new Error("wtf");
        }

        commands.forEach((command, index): void => {
          const from = endPoints[index];
          const to = endPoints[index + 1];
          const middle1: Point =
            command instanceof QCommand
              ? { x: command.x1, y: command.y1 }
              : lerpPoints(from, to, Math.random());

          // Adjust to match the average of the adjustments of the two end points.
          const middle2 = {
            x: middle1.x + (from.offset.x + to.offset.x) / 2,
            y: middle1.y + (from.offset.y + to.offset.y) / 2,
          };

          // Add additional randomness.
          const middle3 = adjust(middle2, "½");
          before.push(
            new QCommand(
              from.initial.x,
              from.initial.y,
              middle2.x,
              middle2.y,
              to.initial.x,
              to.initial.y
            )
          );
          after.push(
            new QCommand(from.x, from.y, middle3.x, middle3.y, to.x, to.y)
          );
        });
      } else {
        before.push(...connectedShape.commands);
        after.push(...connectedShape.commands);
      }
    });
    return { before: new PathShape(before), after: new PathShape(after) };
  }
  static makeRoughFont(baseFont: Font): Font {
    const result: Font = new Map();
    baseFont.forEach((baseLetter, key) => {
      const newLetter = new DescriptionOfLetter(
        () =>
          this.makeRoughShape(
            baseLetter.shape,
            baseLetter.fontMetrics.strokeWidth * 1.5
          ).before,
        baseLetter.advance,
        baseLetter.fontMetrics
      );
      result.set(key, newLetter);
    });
    return result;
  }
  static #recentValues: readonly {
    readonly char: string;
    readonly shape: PathShape;
  }[] = [];
  private static instantiate<
    T extends {
      readonly char: string;
      readonly description: { readonly shape: PathShape };
    }
  >(letters: readonly T[]) {
    /**
     * These are the shapes that we used last time.
     */
    const available = [...this.#recentValues];
    /**
     * Start from the beginning of the current string and the beginning of previous string.
     * Keep pairing up the characters until the first character that doesn't match any more.
     */
    let frontStillMatches = true;
    /**
     * Copy the input to the result, one character at a time.
     * Include a copy of the `shape` field from the recentValues, if there was a match.
     */
    const result = letters.map((input) => {
      if (frontStillMatches) {
        const possibleMatch = available.at(0);
        if (possibleMatch?.char === input.char) {
          // We are using this character from recentValues, so it is no longer available.
          available.shift();
          return {
            ...input,
            shape: possibleMatch.shape,
          };
        }
        frontStillMatches = false;
      }
      // Keep the character as is.
      return input;
    });
    // Now try to match characters from the end.
    // The idea is that you are likely to type, delete, cut or paste just one area of the field
    // at a time.  Everything before and after that change should still match up.
    for (let index = result.length - 1; index >= 0; index--) {
      const possibleMatch = available.pop();
      if (possibleMatch === undefined) {
        // All of the previous items have already been used.
        break;
      }
      const current = result[index];
      if (possibleMatch.char != current.char) {
        // We've found a change.  Presumably this is a new character that the user typed or pasted.
        break;
      }
      const replacement = { ...current, shape: possibleMatch.shape };
      result[index] = replacement;
    }
    return result;
  }
  protected override startImpl(): void {
    const textLayout = new TextLayout();
    textLayout.font = Rough.makeRoughFont(textLayout.font);
    textLayout.restart();
    const text = inputTextArea.value;
    const t = textLayout.addText(text);
    const t1 = Rough.instantiate(t);
    Rough.#recentValues = textLayout.displayText(t1, mainSvg);
    mainSvg.ownerSVGElement!.viewBox.baseVal.height =
      textLayout.baseline + textLayout.font.get("0")!.fontMetrics.bottom;
  }
  static start() {
    new this().start();
  }
}

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
