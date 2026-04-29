import {
  FULL_CIRCLE,
  NON_BREAKING_SPACE,
  angleBetween,
  assertNonNullable,
  initializedArray,
  zip,
} from "phil-lib/misc";
import { LCommand, PathShape, Point, QCommand } from "../path-shape";
import { averageAngle } from "../utility";

// https://emergent.unpythonic.net/software/hershey
// curl https://media.unpythonic.net/emergent-files/software/hershey/cursive.jhf> src/hersey-fonts/cursive.jhf
import cursiveAsString from "./cursive.jhf?raw";

// curl https://media.unpythonic.net/emergent-files/software/hershey/futural.jhf> src/hersey-fonts/futural.jhf
import futuraLAsString from "./futural.jhf?raw";

// Not very interesting.
// Seems to be a dark version of futuraL.
// It uses two adjacent strokes to make things darker.
// That doesn't work perfectly yet and would need more work.
// It's probably not worth it.  Use futuraL with a thicker stroke, instead.
import futuraMAsString from "./futuram.jhf?raw";

import { DescriptionOfLetter, Font, FontMetrics } from "../letters-base";

/**
 * See https://github.com/TradeIdeasPhilip/canvas-recorder/tree/master/src/glib
 * for the most current way that I use these.
 *
 * I export the files as JSON.
 * I sometimes tweak the JSON by hand.
 * I have routines that read the JSON file instead of rebuilding from scratch each time.
 */

/**
 * Mostly internal.
 * See {@link HersheyFont.raw}.
 */
export type RawLetter = {
  readonly pathShape: PathShape;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly leftSideBearing: number;
  readonly rightSideBearing: number;
};

/**
 * A font read from a *.jhf file and converted into a more convenient format.
 */
export class HersheyFont {
  /**
   *
   * @param name Something human readable.
   * @param wholeFile The contents of the original `*.jhf` file.
   * Possibly from `import futuraLAsString from "./futural.jhf?raw";`
   * @param decoder An array of unicode characters.
   * The nth character in this list corresponds to the nth glyph in `wholeFile`.
   * The number of glyphs and the size of this decoder must match or this will throw an `Error`.
   * @param bottom
   * @param top
   * @param mHeight
   * @param baseline I use 0 for my baseline.  The input uses 0 for the center.
   */
  constructor(
    readonly name: string,
    wholeFile: string,
    decoder: readonly string[],
    bottom: number,
    top: number,
    mHeight: number,
    baseline: number,
  ) {
    this.raw = splitCharacters(wholeFile).map((encodedDescription) =>
      parseCharacterDescription(encodedDescription),
    );
    this.font = makeRoundFont(
      this.raw,
      { baseline, bottom, mHeight, top },
      decoder,
    );
    this.originalBaseline = baseline;
  }
  readonly originalBaseline: number;
  /**
   * This shows the letters before they have been completely processed.
   * This is aimed in my internal tools.
   * See {@link font} for the preferred way to use this font.
   */
  readonly raw: readonly RawLetter[];
  readonly font: Font;
}

const ASCII_decoder = [
  NON_BREAKING_SPACE,
  "!",
  '"',
  "#",
  "$",
  "%",
  "&",
  "’",
  "(",
  ")",
  "*",
  "+",
  ",",
  "-",
  ".",
  "/",
  ...initializedArray(10, (n) => String.fromCharCode(n + "0".charCodeAt(0))),
  ":",
  ";",
  "<",
  "=",
  ">",
  "?",
  "@",
  ...initializedArray(26, (n) => String.fromCharCode(n + "A".charCodeAt(0))),
  "[",
  "\\",
  "]",
  "^",
  "_",
  "‘",
  ...initializedArray(26, (n) => String.fromCharCode(n + "a".charCodeAt(0))),
  "{",
  "|",
  "}",
  "~",
  "▮",
];

/**
 * This is known in the original as Futura L.
 * L, I eventually realized, is for light.
 * Futura M, medium, is a thing, but it doesn't work well.
 * In our system it's better to change the line weight to make things darker.
 * The L version works perfectly, so *now* I'm *just* calling it "Futura".
 *
 * See {@link hersheyFonts} for the complete list.
 */
export const futura = new HersheyFont(
  "Futura",
  futuraLAsString,
  ASCII_decoder,
  17,
  -17,
  21,
  9,
);
/**
 * Standard Hershey cursive font.
 *
 * See {@link hersheyFonts} for the complete list.
 */
export const cursive = new HersheyFont(
  "Cursive",
  cursiveAsString,
  ASCII_decoder,
  21,
  -16,
  21,
  9,
);
export const hersheyFonts: HersheyFont[] = [
  futura,
  new HersheyFont(
    "Futura Bold",
    futuraMAsString,
    ASCII_decoder,
    17,
    -17,
    21,
    9,
  ),
  cursive,
];

/**
 * Split the input file into records.
 * Each record is a string representing a single character.
 * @param wholeFile The input as one big string.  Presumably read from a file as one big string.
 * @returns A list of strings, each one corresponding a single character.
 */
function splitCharacters(wholeFile: string): string[] {
  const result = new Array<string>();
  wholeFile.split("\n").forEach((line) => {
    if (/^[0-9 ]{8}/.test(line)) {
      // A good line should start with 8 digits or spaces, representing the first two fields.
      result.push(line);
    } else {
      // If this is not the start of a good line, assume it is a continuation of the line before it.
      // It looks like long lines are just broken at a certain length, and there were no other
      // obvious clues telling you when you need to join two parts of the line.
      result.push(assertNonNullable(result.pop()) + line);
    }
  });
  return result;
}

function parseCharacterDescription(characterDescription: string) {
  const LEFT_SIDE_BEARING_INDEX = 8;
  const RIGHT_SIDE_BEARING_INDEX = 9;
  const FIRST_PAIR_INDEX = 10;
  const zeroPoint = "R".charCodeAt(0);
  if (
    characterDescription.length < FIRST_PAIR_INDEX ||
    characterDescription.length % 2 == 1
  ) {
    throw new Error("wtf");
  }
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  let from: Point | undefined;
  let result: LCommand[] = [];
  for (let i = FIRST_PAIR_INDEX; i < characterDescription.length; i += 2) {
    const pair = characterDescription.substring(i, i + 2);
    if (pair == " R") {
      from = undefined;
    } else {
      const x = pair.charCodeAt(0) - zeroPoint;
      const y = pair.charCodeAt(1) - zeroPoint;
      if (from) {
        const command = new LCommand(from.x, from.y, x, y);
        result.push(command);
      }
      from = { x, y };
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  const leftSideBearing =
    characterDescription.charCodeAt(LEFT_SIDE_BEARING_INDEX) - zeroPoint;
  const rightSideBearing =
    characterDescription.charCodeAt(RIGHT_SIDE_BEARING_INDEX) - zeroPoint;

  return {
    pathShape: new PathShape(result),
    left,
    right,
    top,
    bottom,
    leftSideBearing,
    rightSideBearing,
  };
}

// TODO the top of the 2 looks funny.  Where it changes from straight to curved.
// I took a closer look in the debugger.
// There were no problems with the angles.
// However, I could make things much better by merging the two curved segments adjacent to the two straight segments.
// I can't think of a general rule to go with that.
// Can I / should I do more?
// TODO similar with the capital Z in cursive.
// In the debugger I clicked on segment 14 in the debugger, then I said merge with next.
// Again, it looks better, but I don't know a rule.
/**
 *
 * @param original
 * @param angleCutoff If two adjacent L commands came together with an angle difference that is smaller than this, try to turn that corner into a smooth curve.
 * If it is larger than this, assume the corner was put there on purpose.
 * This defaults to just over 90°.
 * This is good because the font often uses squares which should become circles.
 * @returns
 */
function makeSmooth(original: PathShape, specialInstructions?: "?") {
  const angleCutoff = (FULL_CIRCLE / 4) * 1.01;
  function makeSmoothConnected(originalCommands: readonly LCommand[]) {
    /**
     * Any L command longer than this is assumed to be straight.
     */
    const heuristicCutoff = 5;
    const alteredCommands = originalCommands.map(
      (thisCommand, index, array) => {
        const previousCommand = array[index - 1];
        const nextCommand = array[index + 1];
        if (!previousCommand && !nextCommand) {
          // A single L command.  There's nothing we can do with it.
          return undefined;
        } else if (!previousCommand) {
          // First command
          if (thisCommand.length >= heuristicCutoff) {
            return undefined;
          } else {
            const newOutgoingAngle = averageAngle(
              thisCommand.outgoingAngle,
              nextCommand.incomingAngle,
            );
            const difference = newOutgoingAngle - thisCommand.outgoingAngle;
            const newIncomingAngle = thisCommand.incomingAngle - difference;
            return QCommand.angles(
              thisCommand.x0,
              thisCommand.y0,
              newIncomingAngle,
              thisCommand.x,
              thisCommand.y,
              newOutgoingAngle,
            );
          }
        } else if (!nextCommand) {
          // Last command
          if (thisCommand.length >= heuristicCutoff) {
            return undefined;
          } else {
            const newIncomingAngle = averageAngle(
              previousCommand.outgoingAngle,
              thisCommand.incomingAngle,
            );
            const difference = newIncomingAngle - thisCommand.incomingAngle;
            const newOutgoingAngle = thisCommand.incomingAngle - difference;
            return QCommand.angles(
              thisCommand.x0,
              thisCommand.y0,
              newIncomingAngle,
              thisCommand.x,
              thisCommand.y,
              newOutgoingAngle,
            );
          }
        } else {
          // Command in the middle.
          const incomingAngle = averageAngle(
            thisCommand.incomingAngle,
            previousCommand.outgoingAngle,
          );
          const outgoingAngle = averageAngle(
            thisCommand.outgoingAngle,
            nextCommand.incomingAngle,
          );
          const proposed = QCommand.angles(
            thisCommand.x0,
            thisCommand.y0,
            incomingAngle,
            thisCommand.x,
            thisCommand.y,
            outgoingAngle,
          );
          if (proposed.creationInfo.success) {
            return proposed;
          } else {
            return undefined;
          }
        }
      },
    );
    alteredCommands.forEach((thisCommand, index) => {
      if (!thisCommand) {
        // We already gave up on altering this command in the first step.
        return;
      }
      const previousAlteredCommand = alteredCommands[index - 1];
      const previousOriginalCommand = originalCommands[index - 1];
      const previousNeedsAttention =
        previousOriginalCommand && !previousAlteredCommand;
      const nextAlteredCommand = alteredCommands[index + 1];
      const nextOriginalCommand = originalCommands[index + 1];
      const nextNeedsAttention = nextOriginalCommand && !nextAlteredCommand;
      if (!(previousNeedsAttention || nextNeedsAttention)) {
        return;
      }
      // We created thisCommand with angles half way between the original command and the adjacent commands.
      // But at least one of the adjacent commands didn't change to meet us half way.
      // So we try to make this command curve further to meet the adjacent command where the adjacent command is.
      const incomingAngle = previousNeedsAttention
        ? previousOriginalCommand.outgoingAngle
        : thisCommand.incomingAngle;
      const outgoingAngle = nextNeedsAttention
        ? nextOriginalCommand.incomingAngle
        : thisCommand.outgoingAngle;
      const secondTry = QCommand.angles(
        thisCommand.x0,
        thisCommand.y0,
        incomingAngle,
        thisCommand.x,
        thisCommand.y,
        outgoingAngle,
      );
      if (secondTry.creationInfo.success) {
        // If this works, use it.
        // If not, keep the existing one.
        // It's probably closer to correct than backing out completely.
        // This approach is simple and means we never need an additional pass.
        alteredCommands[index] = secondTry;
      }
    });
    const result = alteredCommands.map((alteredCommand, index) =>
      alteredCommand ? alteredCommand : originalCommands[index],
    );
    return result;
  }
  /**
   * Break the original path into pieces.
   * Any place that the path jumps (with an M command), break the path there.
   * If the angle between two adjacent commands is greater than the threshold, break it there.
   * Each segment in this array contains one or more L commands that we will consider turning into curved Q commands.
   */
  const segments: LCommand[][] = [];
  let currentSegment: LCommand[] = [];
  original.commands.forEach((thisCommand) => {
    if (!(thisCommand instanceof LCommand)) {
      // This function would be more complicated if we had to accept other commands.
      // And in this case I know I have only L commands.
      throw new Error("wtf");
    }
    const previousCommand = currentSegment.at(-1);
    if (previousCommand) {
      if (
        previousCommand.x != thisCommand.x0 ||
        previousCommand.y != thisCommand.y0 ||
        Math.abs(
          angleBetween(
            previousCommand.outgoingAngle,
            thisCommand.incomingAngle,
          ),
        ) > angleCutoff
      ) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
    if (specialInstructions === "?" && currentSegment.length == 12) {
      // Break the last segment of the top part of the ? into it's own piece.
      // So it will be straight.
      segments.push(currentSegment);
      currentSegment = [];
    }

    currentSegment.push(thisCommand);
  });
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }
  const segmentsWithCurves = segments.map((segment) => {
    return makeSmoothConnected(segment);
  });
  const result = new PathShape(segmentsWithCurves.flat());
  return result;
}
type RoundFontInputs = {
  readonly bottom: number;
  readonly top: number;
  readonly mHeight: number;
  readonly baseline: number;
};

function makeRoundFont(
  characterDescriptions: readonly RawLetter[],
  options: RoundFontInputs,
  decoder: readonly string[],
): Font {
  if (characterDescriptions.length != decoder.length) {
    // TODO
    // The two fonts I looked at both have the same characters in the same positions.
    // I'm not sure what to expect from the other files.
    throw new Error("wtf");
  }
  const space = characterDescriptions[0];
  const fontMetrics: FontMetrics = {
    bottom: options.bottom - options.baseline,
    capitalTop: 0 - options.mHeight,
    defaultKerning: 0,
    mHeight: options.mHeight,
    top: options.top - options.baseline,
    strokeWidth: 1,
    spaceWidth: space.rightSideBearing - space.leftSideBearing,
  };
  const result: Font = new Map();
  for (const [key, characterDescription] of zip(
    decoder,
    characterDescriptions,
  )) {
    const matrix = new DOMMatrix();
    matrix.translateSelf(
      -characterDescription.leftSideBearing,
      -options.baseline,
    );
    const roughShape = characterDescription.pathShape.transform(matrix);
    const pathShape = makeSmooth(roughShape, key == "?" ? "?" : undefined);
    const advance =
      characterDescription.rightSideBearing -
      characterDescription.leftSideBearing;
    const descriptionOfLetter = new DescriptionOfLetter(
      pathShape,
      advance,
      fontMetrics,
    );
    result.set(key, descriptionOfLetter);
  }
  return result;
}
