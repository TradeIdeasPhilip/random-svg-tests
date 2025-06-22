import "./style.css";
import "./hershey-fonts-viewer.css";
import { cursiveLetters, futuraLLetters } from "./hershey-fonts/hershey-fonts";
import { getById } from "phil-lib/client-misc";
import { LCommand, PathShape, QCommand } from "./path-shape";
import { angleBetween, FULL_CIRCLE } from "phil-lib/misc";
import { averageAngle } from "./utility";

const samplesDiv = getById("samples", HTMLDivElement);

function summarize(font: typeof cursiveLetters) {
  const lefts = font
    .flatMap((letter) => [letter.left, letter.leftSideBearing])
    .filter((value) => isFinite(value));
  const left = Math.min(...lefts);
  const rights = font
    .flatMap((letter) => [letter.right, letter.rightSideBearing])
    .filter((value) => isFinite(value));
  const right = Math.max(...rights);
  const top = Math.min(
    ...font.map((letter) => letter.top).filter((value) => isFinite(value))
  );
  const bottom = Math.max(
    ...font.map((letter) => letter.bottom).filter((value) => isFinite(value))
  );
  const count = font.length;
  return { top, bottom, left, right, count };
}

const cursiveSummary = { baseline: 9, ...summarize(cursiveLetters) };
const futuraLSummary = { baseline: 9, ...summarize(futuraLLetters) };

samplesDiv.insertAdjacentHTML(
  "beforeend",
  `<div>Cursive</div><div>Smooth Cursive</div><div>Futura L</div><div>Smooth Futura L</div><div>${JSON.stringify(
    cursiveSummary
  )}</div><div></div><div>${JSON.stringify(futuraLSummary)}</div><div></div>`
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
function makeSmooth(
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

cursiveLetters.forEach((cursiveLetter, index) => {
  const futuraLLetter = futuraLLetters[index];
  [
    { letter: cursiveLetter, summary: cursiveSummary },
    { letter: futuraLLetter, summary: futuraLSummary },
  ].forEach(({ letter, summary }) => {
    const slop = 0;
    samplesDiv.insertAdjacentHTML(
      "beforeend",
      `<svg viewBox="${summary.left}, ${summary.top}, ${
        summary.right - summary.left
      }, ${
        summary.bottom - summary.top
      }" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><path class="axes" d="M 0,${
        summary.top - slop
      } L 0,${summary.bottom + slop} M ${summary.left - slop},0 L ${
        summary.right + slop
      },0 M ${summary.left - slop},${summary.baseline} L ${
        summary.right + slop
      },${summary.baseline}" /><path class="left" d="M ${
        letter.leftSideBearing
      },${summary.top - slop} L ${letter.leftSideBearing},${
        summary.bottom + slop
      }" /><path class="right" d="M ${letter.rightSideBearing},${
        summary.top - slop
      } L ${letter.rightSideBearing},${
        summary.bottom + slop
      }" /><path class="main" d="${letter.pathShape.rawPath}"></path></svg>`
    );
    samplesDiv.insertAdjacentHTML(
      "beforeend",
      `<svg viewBox="${summary.left}, ${summary.top}, ${
        summary.right - summary.left
      }, ${
        summary.bottom - summary.top
      }" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><path class="axes" d="M 0,${
        summary.top - slop
      } L 0,${summary.bottom + slop} M ${summary.left - slop},0 L ${
        summary.right + slop
      },0 M ${summary.left - slop},${summary.baseline} L ${
        summary.right + slop
      },${summary.baseline}" /><path class="left" d="M ${
        letter.leftSideBearing
      },${summary.top - slop} L ${letter.leftSideBearing},${
        summary.bottom + slop
      }" /><path class="right" d="M ${letter.rightSideBearing},${
        summary.top - slop
      } L ${letter.rightSideBearing},${
        summary.bottom + slop
      }" /><path class="main" d="${
        makeSmooth(letter.pathShape).rawPath
      }"></path></svg>`
    );
  });
});

// TODO 
// * Add an index number in a new column on the left of the letter samples.
// * Create a function mapping these numbers to JavaScript characters.
// * Each letter needs one more field, this string.
// * An unknown index will return a string like `unknown #${i}`
// * Convert these into fonts.
// * Draw the same sample text in three different fonts.
// * "Like\nshare\nand\subscribe"