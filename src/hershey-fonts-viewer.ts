import "./style.css";
import "./hershey-fonts-viewer.css";
import {
  cursive,
  HersheyFont,
  hersheyFonts,
} from "./hershey-fonts/hershey-fonts";
import { download, getById } from "phil-lib/client-misc";
import { TextLayout } from "./letters-more";
import { PathShape } from "./path-shape";
import { fontToJSON } from "./letters-base";
import { pickAny, zip } from "phil-lib/misc";

const samplesDiv = getById("samples", HTMLDivElement);

function summarize(font: HersheyFont) {
  const lefts = font.raw
    .flatMap((letter) => [letter.left, letter.leftSideBearing])
    .filter((value) => isFinite(value));
  const left = Math.min(...lefts);
  const rights = font.raw
    .flatMap((letter) => [letter.right, letter.rightSideBearing])
    .filter((value) => isFinite(value));
  const right = Math.max(...rights);
  const top = Math.min(
    ...font.raw.map((letter) => letter.top).filter((value) => isFinite(value)),
  );
  const bottom = Math.max(
    ...font.raw
      .map((letter) => letter.bottom)
      .filter((value) => isFinite(value)),
  );
  const count = font.raw.length;
  const capitalTop =
    pickAny(font.font)!.fontMetrics.capitalTop + font.originalBaseline;
  const baseline = font.originalBaseline;
  return { top, bottom, left, right, count, capitalTop, baseline };
}

const params = new URLSearchParams(location.search);
const leftParam = parseInt(params.get("left") ?? "");
const rightParam = parseInt(params.get("right") ?? "");
const leftValid =
  Number.isInteger(leftParam) &&
  leftParam >= 0 &&
  leftParam < hersheyFonts.length;
const rightValid =
  Number.isInteger(rightParam) &&
  rightParam >= 0 &&
  rightParam < hersheyFonts.length;
const leftIndex = leftValid && rightValid ? leftParam : 0;
const rightIndex = leftValid && rightValid ? rightParam : 2;
const leftFont = hersheyFonts[leftIndex];
const rightFont = hersheyFonts[rightIndex];

const fontSelector = getById("font-selector", HTMLFormElement);
(["left", "right"] as const).forEach((name) => {
  const select = fontSelector.elements.namedItem(name) as HTMLSelectElement;
  const currentIndex = name === "left" ? leftIndex : rightIndex;
  hersheyFonts.forEach((font, i) => {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = font.name;
    if (i === currentIndex) option.selected = true;
    select.appendChild(option);
  });
});

function htmlEscape(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

samplesDiv.insertAdjacentHTML(
  "beforeend",
  `<div></div><div>${htmlEscape(leftFont.name)}</div><div>Smooth ${htmlEscape(leftFont.name)}</div><div>${htmlEscape(rightFont.name)}</div><div>Smooth ${htmlEscape(rightFont.name)}</div><div></div><div>${JSON.stringify(
    summarize(leftFont),
    undefined,
    1,
  )}</div><div></div><div>${JSON.stringify(summarize(rightFont), undefined, 1)}</div><div></div>`,
);

function getNext<T>(generator: Generator<T>): T | undefined {
  // TODO it seems like the problem is the return type of zip().
  // Just generator.next().value should be enough but that gives me a type of `any`.
  const next = generator.next();
  if (next.done) {
    return undefined;
  } else {
    return next.value;
  }
}

// MARK: Draw SVGs
const leftSummary = summarize(leftFont);
const rightSummary = summarize(rightFont);
const leftIterator = zip(leftFont.raw, leftFont.font.entries());
const rightIterator = zip(rightFont.raw, rightFont.font.entries());
while (true) {
  const left = getNext(leftIterator);
  const right = getNext(rightIterator);
  if (left === undefined && right === undefined) {
    break;
  }
  samplesDiv.insertAdjacentHTML(
    "beforeend",
    `<div class="character">${(left ?? right)![1][0]}</div>`,
  );
  [
    { letter: left, summary: leftSummary },
    { letter: right, summary: rightSummary },
  ].forEach(({ letter, summary }) => {
    const slop = 0;
    if (!letter) {
      samplesDiv.insertAdjacentHTML("beforeend", "<div></div><div></div>");
    } else {
      {
        const rawLetter = letter[0];
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
            rawLetter.leftSideBearing
          },${summary.top - slop} L ${rawLetter.leftSideBearing},${
            summary.bottom + slop
          }" /><path class="right" d="M ${rawLetter.rightSideBearing},${
            summary.top - slop
          } L ${rawLetter.rightSideBearing},${
            summary.bottom + slop
          }" /><path class="main" d="${rawLetter.pathShape.rawPath}"></path></svg>`,
        );
      }
      {
        const descriptionOfLetter = letter[1][1];
        const maxWidth = summary.right - summary.left;
        const offset = (maxWidth - descriptionOfLetter.advance) / 2;
        descriptionOfLetter.fontMetrics.top;
        samplesDiv.insertAdjacentHTML(
          "beforeend",
          `<svg viewBox="${0}, ${descriptionOfLetter.fontMetrics.top}, ${
            maxWidth
          }, ${
            descriptionOfLetter.fontMetrics.bottom -
            descriptionOfLetter.fontMetrics.top
          }" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"><path class="axes" d="M ${0 - slop},${0} L ${
            maxWidth + slop
          },${0} M ${0 - slop},${descriptionOfLetter.fontMetrics.capitalTop} L ${
            maxWidth + slop
          },${descriptionOfLetter.fontMetrics.capitalTop}" /><path class="left" d="M ${offset},${descriptionOfLetter.fontMetrics.top - slop} L ${offset},${
            descriptionOfLetter.fontMetrics.bottom + slop
          }" /><path class="right" d="M ${offset + descriptionOfLetter.advance},${
            descriptionOfLetter.fontMetrics.top - slop
          } L ${offset + descriptionOfLetter.advance},${
            descriptionOfLetter.fontMetrics.bottom + slop
          }" /><path class="main" d="${
            descriptionOfLetter.shape.translate(offset, 0).rawPath
          }"></path></svg>`,
        );
      }
    }
  });
}

const convertedSvg = getById("converted", SVGSVGElement);

/**
 * Remove the dot from the top of the i's.
 */
const newFont = new Map(cursive.font);
{
  const originalI = cursive.font.get("i")!;
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
    })),
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

const downloadButtons = getById("download-buttons", HTMLSpanElement);
hersheyFonts.forEach((hersheyFont) => {
  const button = document.createElement("button");
  button.textContent = hersheyFont.name;
  const asJSON = JSON.stringify(fontToJSON(hersheyFont.font));
  button.addEventListener("click", () => {
    download(`${hersheyFont.name}.json`, asJSON);
  });
  downloadButtons.appendChild(button);
});

/**
 * Note:  The TextLayout class is old and has issues.
 * See https://github.com/TradeIdeasPhilip/canvas-recorder/blob/master/src/glib/paragraph-layout.ts
 * for a much newer iteration of the same idea.
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
