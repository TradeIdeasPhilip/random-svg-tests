import { LCommand, PathShape, Point } from "../path-shape";
import { assertNonNullable } from "../utility";

// https://emergent.unpythonic.net/software/hershey
// curl https://media.unpythonic.net/emergent-files/software/hershey/cursive.jhf> src/hersey-fonts/cursive.jhf
import cursiveAsString from "./cursive.jhf?raw";

// curl https://media.unpythonic.net/emergent-files/software/hershey/futural.jhf> src/hersey-fonts/futural.jhf
import futuraLAsString from "./futural.jhf?raw";

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
