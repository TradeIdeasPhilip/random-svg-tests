import "./style.css";
import "./hershey-fonts-viewer.css";
import {
  cursiveLetters,
  decoder,
  futuraLLetters,
  makeSmooth,
  roundCursiveFont,
} from "./hershey-fonts/hershey-fonts";
import { getById } from "phil-lib/client-misc";
import { TextLayout } from "./letters-more";
import { PathShape } from "./path-shape";

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
        makeSmooth(letter.pathShape).rawPath
      }"></path></svg>`
    );
  });
});

const convertedSvg = getById("converted", SVGSVGElement);

//const layoutInfo = textLayout.addText("Like share and subscribe.","center");
["Like", "share", "and", "subscribe"].forEach((word, index) => {
  const textLayout = new TextLayout(roundCursiveFont);
  textLayout.rightMargin = 120;
  const layoutInfo = textLayout.addText(word, "center");
  console.log("layoutInfo", layoutInfo);
  const down = index * textLayout.lineHeight;
  const fullPathShape = PathShape.join(
    layoutInfo.map((letter) => ({
      shape: letter.description.shape,
      Δx: letter.x,
      Δy: letter.baseline + down,
    }))
  );
  const element = fullPathShape.makeElement();
  convertedSvg.appendChild(element);
});
/*
layoutInfo.forEach(letterInfo => {
  const element = letterInfo.description.makeElement();
  convertedSvg.appendChild(element);
});
*/
