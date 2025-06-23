import {
  FULL_CIRCLE,
  angleBetween,
  initializedArray,
  zip,
} from "phil-lib/misc";
import { LCommand, PathShape, Point, QCommand } from "../path-shape";
import { assertNonNullable, averageAngle } from "../utility";

// https://emergent.unpythonic.net/software/hershey
// curl https://media.unpythonic.net/emergent-files/software/hershey/cursive.jhf> src/hersey-fonts/cursive.jhf
import cursiveAsString from "./cursive.jhf?raw";

// curl https://media.unpythonic.net/emergent-files/software/hershey/futural.jhf> src/hersey-fonts/futural.jhf
import futuraLAsString from "./futural.jhf?raw";
import { DescriptionOfLetter, Font, FontMetrics } from "../letters-base";

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

const cursiveCharacterDescriptions = splitCharacters(cursiveAsString);
const futuraLCharacterDescriptions = splitCharacters(futuraLAsString);

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

export const cursiveLetters = cursiveCharacterDescriptions.map(
  (characterDescription) => parseCharacterDescription(characterDescription)
);
export const futuraLLetters = futuraLCharacterDescriptions.map(
  (characterDescription) => parseCharacterDescription(characterDescription)
);

// TODO the top of the 2 looks funny.  Where it changes from straight to curved.
// I took a closer look in the debugger.
// There were no problems with the angles.
// However, I could make things much better by merging the two curved segments adjacent to the two straight segments.
// I can't think of a general rule to go with that.
// Can I / should I do more?
// TODO similar with the capital Z in cursive.
// In the debugger I clicked on segment 14 in the debugger, then I said merge with next.
// Again, it looks better, but I don't know a rule.
// TODO the ? is wrong.  The bottom segment of the top is short, but it should still be straight.
// This breaks all of my heuristics.  I can't easily fix this without breaking other letters.
// I think I'll need a more specific rule, maybe looking for this one letter!
// This one is bad and can't be ignored.
/**
 *
 * @param original
 * @param angleCutoff If two adjacent L commands came together with an angle difference that is smaller than this, try to turn that corner into a smooth curve.
 * If it is larger than this, assume the corner was put there on purpose.
 * This defaults to just over 90°.
 * This is good because the font often uses squares which should become circles.
 * @returns
 */
export function makeSmooth(
  original: PathShape,
  angleCutoff = (FULL_CIRCLE / 4) * 1.01
) {
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
              nextCommand.incomingAngle
            );
            const difference = newOutgoingAngle - thisCommand.outgoingAngle;
            const newIncomingAngle = thisCommand.incomingAngle - difference;
            return QCommand.angles(
              thisCommand.x0,
              thisCommand.y0,
              newIncomingAngle,
              thisCommand.x,
              thisCommand.y,
              newOutgoingAngle
            );
          }
        } else if (!nextCommand) {
          // Last command
          if (thisCommand.length >= heuristicCutoff) {
            return undefined;
          } else {
            const newIncomingAngle = averageAngle(
              previousCommand.outgoingAngle,
              thisCommand.incomingAngle
            );
            const difference = newIncomingAngle - thisCommand.incomingAngle;
            const newOutgoingAngle = thisCommand.incomingAngle - difference;
            return QCommand.angles(
              thisCommand.x0,
              thisCommand.y0,
              newIncomingAngle,
              thisCommand.x,
              thisCommand.y,
              newOutgoingAngle
            );
          }
        } else {
          // Command in the middle.
          const incomingAngle = averageAngle(
            thisCommand.incomingAngle,
            previousCommand.outgoingAngle
          );
          const outgoingAngle = averageAngle(
            thisCommand.outgoingAngle,
            nextCommand.incomingAngle
          );
          const proposed = QCommand.angles(
            thisCommand.x0,
            thisCommand.y0,
            incomingAngle,
            thisCommand.x,
            thisCommand.y,
            outgoingAngle
          );
          if (proposed.creationInfo.success) {
            return proposed;
          } else {
            return undefined;
          }
        }
      }
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
        outgoingAngle
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
      alteredCommand ? alteredCommand : originalCommands[index]
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
          angleBetween(previousCommand.outgoingAngle, thisCommand.incomingAngle)
        ) > angleCutoff
      ) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
    currentSegment.push(thisCommand);
  });
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }
  const segmentsWithCurves = segments.map((segment) =>
    makeSmoothConnected(segment)
  );
  const result = new PathShape(segmentsWithCurves.flat());
  return result;
}
export const decoder = [
  " ",
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

type RoundFontInputs = {
  readonly bottom: number;
  readonly top: number;
  readonly mHeight: number;
  readonly baseline: number;
};

function makeRoundFont(wholeFile: string, options: RoundFontInputs): Font {
  const characterDescriptions = splitCharacters(wholeFile).map(
    (encodedDescription) => parseCharacterDescription(encodedDescription)
  );
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
    top: options.top,
    strokeWidth: 1,
    spaceWidth: space.rightSideBearing - space.leftSideBearing,
  };
  const result: Font = new Map();
  for (const [key, characterDescription] of zip(
    decoder,
    characterDescriptions
  )) {
    const matrix = new DOMMatrix();
    matrix.translateSelf(
      -characterDescription.leftSideBearing,
      options.baseline
    );
    const roughShape = characterDescription.pathShape.transform(matrix);
    const pathShape = makeSmooth(roughShape);
    const advance =
      characterDescription.rightSideBearing -
      characterDescription.leftSideBearing;
    const descriptionOfLetter = new DescriptionOfLetter(
      pathShape,
      advance,
      fontMetrics
    );
    result.set(key, descriptionOfLetter);
  }
  return result;
}

export const roundCursiveFont = makeRoundFont(cursiveAsString, {
  baseline: 9,
  bottom: 22,
  top: -17,
  mHeight: 21,
});
export const roundFuturaLFont = makeRoundFont(futuraLAsString, {
  baseline: 9,
  bottom: 17,
  top: -17,
  mHeight: 21,
});
