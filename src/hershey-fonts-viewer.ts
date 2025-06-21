import "./style.css";
import "./hershey-fonts-viewer.css";
import { cursiveLetters, futuraLLetters } from "./hershey-fonts/hershey-fonts";
import { getById } from "phil-lib/client-misc";
import { Command, LCommand, PathShape, QCommand } from "./path-shape";
import { angleBetween, FULL_CIRCLE } from "phil-lib/misc";

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

// TODO The start of the cursive small w.  
// The start and the end of the s part of the $ in both fonts.
// And more.  There's a corner between the first and second segments and I don't know why.
// The curve seems small and consistent with other segments that work correctly.
// The curvy end of the 5, both ends of the 6.  Both ends of the 9.
// Not every curve.  But when there is a problem it's always the first and/or last in the connected segment.

// TODO if the curve makes a loop i.e. if the start and end are at the same point, then our curving algorithm
// should try to match the ends.  This was an oversight initially.
// Examples:  % , . :

// TODO check out 0 and 8 and %.  They have flat spots.  They might be one or the other of the previous
// TODO items, or maybe a combination of both.

// TODO take a closer look at the futura capital U.
// Look at where the curvy part joins with the straight part.
// It doesn't look perfect where they meet.
// It looks like a small corner.
// I'd love to see the actual commands and compare the incoming and outgoing angles.
// Isn't that part of the path debugger?  Can I drop something in with the GUI without changing any code?

function makeSmooth(original: PathShape, cutoff = (FULL_CIRCLE / 4) * 1.01) {
  function makeSmoothConnected(original: PathShape): Command[] {
    const originalCommands = original.commands;
    const alteredCommands = originalCommands.map(
      (thisCommand, index, array) => {
        if (
          !(thisCommand instanceof LCommand || thisCommand instanceof QCommand)
        ) {
          console.info("hmmm");
          // If I have a more complicated command, then trying to change it to a Q might make things worse.
          // Keeping the old command should work, just like it does below.
          // But I can't really test this case because I'm only expecting L commands in my input.
          // So if you see this message, there's probably nothing wrong, but please double check the result.
          return undefined;
        } else {
          const previousCommand = array[index - 1];
          const nextCommand = array[index + 1];
          function averageAngle(angleKeep: number, angleTry: number) {
            const between = angleBetween(angleKeep, angleTry);
            if (Math.abs(between) > cutoff) {
              return angleKeep;
            } else {
              return angleKeep + angleBetween(angleKeep, angleTry) / 2;
            }
          }
          const incomingAngle = previousCommand
            ? averageAngle(
                thisCommand.incomingAngle,
                previousCommand.outgoingAngle
              )
            : thisCommand.incomingAngle;
          const outgoingAngle = nextCommand
            ? averageAngle(thisCommand.outgoingAngle, nextCommand.incomingAngle)
            : thisCommand.outgoingAngle;
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
  const result = new PathShape(
    original.splitOnMove().flatMap((shape) => makeSmoothConnected(shape))
  );
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
