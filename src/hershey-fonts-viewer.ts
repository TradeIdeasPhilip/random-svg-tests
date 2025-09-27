import "./style.css";
import "./hershey-fonts-viewer.css";
import {
  cursiveLetters,
  decoder,
  futuraLLetters,
  indexOfQuestionMark,
  makeSmooth,
  roundCursiveFont,
  roundFuturaLFont,
} from "./hershey-fonts/hershey-fonts";
import { download, getById } from "phil-lib/client-misc";
import { TextLayout } from "./letters-more";
import { PathShape } from "./path-shape";
import { querySelectorAll } from "./utility";
import { Font, fontToJSON } from "./letters-base";

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

const cursiveSummary = {
  baseline: 9,
  capitalTop: -12,
  ...summarize(cursiveLetters),
};
const futuraLSummary = {
  baseline: 9,
  capitalTop: -12,
  ...summarize(futuraLLetters),
};

samplesDiv.insertAdjacentHTML(
  "beforeend",
  `<div></div><div>Cursive</div><div>Smooth Cursive</div><div>Futura L</div><div>Smooth Futura L</div><div></div><div>${JSON.stringify(
    cursiveSummary
  )}</div><div></div><div>${JSON.stringify(futuraLSummary)}</div><div></div>`
);

// MARK: Draw SVGs

cursiveLetters.forEach((cursiveLetter, index) => {
  samplesDiv.insertAdjacentHTML(
    "beforeend",
    `<div class="character">${decoder[index] ?? "⁉️"}</div>`
  );
  const futuraLLetter = futuraLLetters[index];
  [
    { letter: cursiveLetter, summary: cursiveSummary },
    { letter: futuraLLetter, summary: futuraLSummary },
  ].forEach(({ letter, summary }) => {
    const slop = 0;
    const specialInstructions = index == indexOfQuestionMark ? "?" : undefined;
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
      },${summary.baseline} M ${summary.left - slop},${summary.capitalTop} L ${
        summary.right + slop
      },${summary.capitalTop}" /><path class="left" d="M ${
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
      },${summary.baseline} M ${summary.left - slop},${summary.capitalTop} L ${
        summary.right + slop
      },${summary.capitalTop}" /><path class="left" d="M ${
        letter.leftSideBearing
      },${summary.top - slop} L ${letter.leftSideBearing},${
        summary.bottom + slop
      }" /><path class="right" d="M ${letter.rightSideBearing},${
        summary.top - slop
      } L ${letter.rightSideBearing},${
        summary.bottom + slop
      }" /><path class="main" d="${
        makeSmooth(letter.pathShape, specialInstructions).rawPath
      }"></path></svg>`
    );
  });
});

const convertedSvg = getById("converted", SVGSVGElement);

/**
 * Remove the dot from the top of the i's.
 */
const newFont = new Map(roundCursiveFont);
{
  const originalI = roundCursiveFont.get("i")!;
  const newPathShape = originalI.shape.splitOnMove()[1];
  const newI = originalI.reshape(newPathShape);
  newFont.set("i", newI);
}

/**
 * This is useful if you want a completely connected path,
 * or something very close it it.  Use the fixed version of the
 * letter when the previous letter was a lower case letter.
 * @param letter The letter to fix
 * @param alternateLetter The letter to use when we want the fixed version.
 */
function fixLetter(letter: string, alternateLetter: string) {
  const original = newFont.get(letter)!;
  const additionalCommands = original.shape.commands
    .slice(0, 6)
    .reverse()
    .map((command) => command.reverse());
  const newShape = new PathShape([
    ...additionalCommands,
    ...original.shape.commands,
  ]);
  const newLetter = original.reshape(newShape);
  newFont.set(alternateLetter, newLetter);
}
fixLetter("a", "à");
fixLetter("c", "ç");
fixLetter("d", "ď");

let fullMessage = "";

//const layoutInfo = textLayout.addText("Like share and subscribe.","center");
["Like", "shàre", "anď", "subsçribe"].forEach((word, index) => {
  const textLayout = new TextLayout(newFont);
  textLayout.rightMargin = 120;
  const layoutInfo = textLayout.addText(word, "center");
  console.log("layoutInfo", layoutInfo);
  const down = index * textLayout.lineHeight;
  let fullPathShape = PathShape.join(
    layoutInfo.map((letter) => ({
      shape: letter.description.shape,
      Δx: letter.x,
      Δy: letter.baseline + down,
    }))
  );
  if (index % 2) {
    fullPathShape = fullPathShape.reverse();
  }
  const element = fullPathShape.makeElement();
  convertedSvg.appendChild(element);
  fullMessage += fullPathShape.rawPath;
});
console.log("Like, share and subscribe:", fullMessage);
/*
layoutInfo.forEach(letterInfo => {
  const element = letterInfo.description.makeElement();
  convertedSvg.appendChild(element);
});
*/

querySelectorAll("button[data-download-font]", HTMLButtonElement).forEach(
  (button) => {
    const fontName = button.dataset.downloadFont;
    let font: Font;
    switch (fontName) {
      case "Cursive": {
        font = roundCursiveFont;
        break;
      }
      case "Futura L": {
        font = roundFuturaLFont;
        break;
      }
      default: {
        throw new Error("wtf");
      }
    }
    const asJSON = JSON.stringify(fontToJSON(font));
    button.addEventListener("click", () => {
      download(`${fontName}.json`, asJSON);
    });
  }
);

/**
 * TODO
 * The TextLayout class still has issues.
 * IT's an improvement over the previous version and a step in the right direction.
 * Centering is incomplete at best.
 *
 * Proposal:
 * ParagraphLayout class.
 * It does not expect it be reset.
 * It does not expect you to mess with x and y in the middle of the work.
 * When you are done with the paragraph you tell it how to align the content.
 * left, center, right or justify.
 *
 * It will return objects as you add text, like TextLayout does.
 * But it will remember all of the objects that is has been returning.
 * It will need that to do the text alignment.
 * We can also use that in two other functions.
 * One to create a single PathShape out of all of the letters.
 * And maybe one to create all of the elements and add them to an SVG.
 * Both taking care of the location of each letter.
 *
 * Speaking of the location of each letter.
 * We have a function for joining multiple paths and adjusting their positions at the same time.
 * But the format is slightly different between the output of our function and the input of the join function.
 * That should be fixed.
 *
 * Top and bottom can be done better.
 * Maybe we have a top margin property.
 * The top of the top line of text will touch the top margin.
 * If multiple fonts are all used on the same line, we use the baseline of each font to line the characters up.
 * If we are multi line, we use the top and bottom of each character on the line to determine the line height.
 * There can be an override to add more space between each pair of lines.
 * At the end you can ask what's the y for the bottom of the paragraph.
 * And you can ask for the baseline of the last line.
 * So you can line other things up with this.
 * Each returned object (one per letter) will also include it's baseline.
 * It already does, but we might rename that Δy as described above.
 */
