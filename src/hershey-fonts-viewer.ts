import "./style.css";
import "./hershey-fonts-viewer.css";
import { cursiveLetters, futuraLLetters } from "./hershey-fonts/hershey-fonts";
import { getById } from "phil-lib/client-misc";

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
  `<div>Cursive</div><div>Futura L</div><div>${JSON.stringify(
    cursiveSummary
  )}</div><div>${JSON.stringify(futuraLSummary)}</div>`
);

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
  });
});

/**
 * TODO
 * Try turning the straight lines into curves.
 * For every adjacent pair of segments, check angleBetween(previous.outgoingAngle, incomingAngle)
 * If it is <= 90° assume it should be flattened.
 * Take a smart average between to the two angles.
 * const angleMid = angleA + angleBetween(angleA, angleB) / 2;
 * That was copied from path-debugger.ts
 * path-debugger.ts is moving points and fixing angles, we're just fixing angles here.
 * Replace every segment with the same coordinates but the new angles.
 * 
 * What if a segment won't comply?
 * Look at the lower case h in cursive.  
 * Look at where is makes an s shape (but rotated and flipped).
 * There is a straight part in the middle of the change in curvature.
 * I bet it fails there.
 * Probably lots of places where there's a change in curvature in that font.
 * 
 * First, revert the broken Q to an L.
 * Second, try to change the adjacent items to compensate.
 * Instead of moving the adjacent Q to the average angle, move it all the way to the L's angle to create a smooth connection.
 * If the adjacent segment is already an L, don't do anything.
 * If the adjacent segment was working with the average, but not working when it has to go all the way,
 *   leave it in place with the half way.
 *   Then it will still have a correct curve on the other end.
 *   And it won't cause a cascade on the other end.
 *   The the broken end will still be closer to perfect than the original line was.
 *   I don't expect this to happen a lot, so hard to test, so keep a simple solution, do nothing.
 * 
 * Do it in the loop immediately above.  First do the cursive letter with the cursive font info.
 * Then do the curvy cursive letter with the unmodified cursive font info.
 * Then the same two things for the other font.
 * 4 across where it was 2 across.
 */
