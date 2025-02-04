import { getById } from "phil-lib/client-misc";
import "./style.css";
import "./tangent-line-2.css";
import {
  count,
  FULL_CIRCLE,
  initializedArray,
  makeBoundedLinear,
  makeLinear,
} from "phil-lib/misc";
import { PathShape, QCommand } from "./path-shape";
import { assertValidT, lcm, makeTSplitterA, selectorQueryAll } from "./utility";

const WIDTH = 1920;
const HEIGHT = 1080;

const svg = getById("main", SVGSVGElement);

{
  const legend = getById("legend", SVGTextElement);
  const totalLength = legend.getComputedTextLength();
  // This has multiple issues.  I've seen this fail when the fonts were acting up.
  // I think the real font was coming in slowly, maybe after the script ran.
  const breaks = ["Gold", "Gold = goal. ", "Gold = goal.  Blue"].map(
    (prefix) => {
      const mainLength = legend.getSubStringLength(0, prefix.length);
      const spaceLength = legend.getSubStringLength(prefix.length, 1);
      const splitPosition = mainLength + spaceLength / 2;
      return splitPosition / totalLength;
    }
  );
  const stops = selectorQueryAll(
    "#legendGradient stop",
    SVGStopElement,
    (breaks.length + 1) * 2,
    (breaks.length + 1) * 2
  );
  breaks.forEach((offset, index) => {
    const relevantStops = stops.slice(index * 2 + 1, index * 2 + 3);
    if (relevantStops.length != 2) {
      throw new Error("wtf");
    }
    relevantStops.forEach((stop) => {
      stop.offset.baseVal = offset;
    });
  });
}

type Request = {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
  readonly cssPath: string;
};

const DEFAULTS: Request = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  zoom: 275,
  cssPath: "",
};

/** Circle vs. path */
type CompareElement = {
  topG: SVGGElement;
  circle: SVGCircleElement;
  path: SVGPathElement;
  text: SVGTextElement;
};

function makeCompareElement(request: Partial<Request>): CompareElement {
  const r = { ...DEFAULTS, ...request };
  const topG = document.createElementNS("http://www.w3.org/2000/svg", "g");
  topG.classList.add("compare");
  const transform = `translate(${r.x}px,${r.y}px) scale(${r.zoom})`;
  topG.style.transform = transform;
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.r.baseVal.value = 1;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.style.d = r.cssPath;
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  topG.append(circle, path, text);
  svg.appendChild(topG);
  return { topG, circle, path, text };
}
/*
function nthLocation(n: number) {
  const ACROSS = 2;
  const DOWN = 1;
  const column = Math.floor(n / DOWN);
  const row = n % DOWN;
  const x = ((column + 0.5) * WIDTH) / ACROSS;
  const y = ((row + 0.5) * HEIGHT) / DOWN;
  return { x, y };
}

let howManyHaveBeenPlaced = 0;
function nextLocation() {
  const result = nthLocation(howManyHaveBeenPlaced);
  howManyHaveBeenPlaced++;
  return result;
}

function drawShape(qCommands: readonly QCommand[]) {
  const cssPath = new PathShape(qCommands).cssPath;
  return makeCompareElement({
    cssPath,
    ...nextLocation(),
  });
}
*/

function getPoints(numberOfSides: number) {
  const FIRST_ANGLE = -FULL_CIRCLE / 4;
  const LAST_ANGLE = FIRST_ANGLE + FULL_CIRCLE;
  const nthAngle = makeLinear(0, FIRST_ANGLE, numberOfSides, LAST_ANGLE);
  const points = initializedArray(numberOfSides, (n) => {
    const angle = nthAngle(n);
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    const tangentAngle = angle + FULL_CIRCLE / 4;
    return { x, y, tangentAngle };
  });
  return points;
}

function setCount(
  compareElement: CompareElement,
  count: number,
  opacity: number
) {
  const textElement = compareElement.text;
  textElement.textContent = count.toString();
  textElement.style.opacity = opacity.toString();
}

function setD(
  compareElement: CompareElement,
  paths: {
    start: PathShape;
    end: PathShape;
  },
  t: number
) {
  const pathElement = compareElement.path;
  pathElement.getAnimations().forEach((animation) => animation.cancel());
  const animation = pathElement.animate(
    [{ d: paths.start.cssPath }, { d: paths.end.cssPath }],
    { duration: 1, fill: "both" }
  );
  animation.pause();
  animation.currentTime = t;
}

const parabolaDisplay = makeCompareElement({ x: WIDTH / 4, y: HEIGHT / 2 });
parabolaDisplay.text.textContent = "#";
const lineDisplay = makeCompareElement({ x: (WIDTH * 3) / 4, y: HEIGHT / 2 });
lineDisplay.text.textContent = "#";
/*
[].forEach((numberOfSides) => {
  const points = getPoints(numberOfSides);
  const qCommands = points.map((point, index, array) => {
    const nextPoint = array[(index + 1) % array.length];
    return QCommand.angles(
      point.x,
      point.y,
      point.tangentAngle,
      nextPoint.x,
      nextPoint.y,
      nextPoint.tangentAngle
    );
  });
  drawShape(qCommands).text.textContent = numberOfSides.toString();
});

[3].forEach((numberOfSides) => {
  const points = getPoints(numberOfSides);
  const qCommands = points.map((point, index, array) => {
    const nextPoint = array[(index + 1) % array.length];
    const line = QCommand.line2(point, nextPoint);
    return line;
  });
  drawShape(qCommands).text.textContent = numberOfSides.toString();
});
*/
//makeCompareElement
/**
 * start with a big circle (6 parabolas)
 * immediately animate to the 3 parabolas state.
 * Draw a 3 and pause for an appropriate amount of time.
 * animate to the 4, draw 4, pause and repeat.
 *
 * make the circle wink out and back in for each cycle of the parabola
 * but not for the polygons
 * and the parabolas update more slowly.
 * and display more polygons than parabolas
 * use a simple handwriting effect to wink in and out.
 *
 * filling in the new numbers:
 * When we first start transitioning from one shape to the next, we clear the number.  Opacity = 0.
 * As we transition toward the new shape, we display the number associated with the new shape, and the opacity goes up to 1.
 * Once transition is complete the number will stay visible, completely opaque.
 *
 * The circle:
 * - start fully visible
 * - stay there for a while.
 * - Rotate the circle out of there.
 * - stay on no circle for a while.
 * - rotate in the same direction to get the circle back.
 * - stay there for a while.
 * Use flat line ends to avoid that problem at the edge.
 * Only for the parabolas.
 *
 * Do the parabolas and the lines separately and in parallel.
 *
 * Divide the region with a TSplitter.
 * The first n regions correspond to different numbers.
 * The last region might sit at the end of the previous region with no animation.
 *
 * Same for both types of approximation
 * Have a list of ideal ways to draw the approximation at each number.
 * Add a large circle (or other odd shape) to the beginning of the list.
 * For each adjacent pair, create matching shapes with the right number of segments.
 * Transition from one of these new shapes to the other, never bothering with the original shape.
 *
 * New perspective:  The parabola thing looks good.
 * I'm planning to make the polygons very similar.
 * Even more similar than initially planned (and described above).
 * The parabolas and the lines should be animated together.
 * They will both be at exactly the same place in their animations at the same time.
 * I will move the number to the middle, so it will be shared by both circles.
 *
 * I will hide the gold circle from both sides.
 * This will be more obvious on the polygon, but more important for the parabolas.
 * The polygon one will help people know when I'm removing it from the parabola one.
 */

const parabolaCounts = [...count(3, 13)];
const parabolaStartDelay = -0.5;
const parabolaEndDelay = 3;
const parabolaScheduler = makeTSplitterA(
  parabolaStartDelay,
  parabolaCounts.length,
  parabolaEndDelay
);
const parabolaPaths = parabolaCounts.map((numberOfSides) => {
  const points = getPoints(numberOfSides);
  const qCommands = points.map((point, index, array): QCommand => {
    const nextPoint = array[(index + 1) % array.length];
    return QCommand.angles(
      point.x,
      point.y,
      point.tangentAngle,
      nextPoint.x,
      nextPoint.y,
      nextPoint.tangentAngle
    );
  });
  return qCommands;
});
/*parabolaPaths[-1] = [
  { x: -0.3, y: -1.2 },
  { x: 1.05, y: -0.5 },
  { x: 0.9, y: 0.5 },
  { x: -0.43, y: 1.3 },
  { x: -1.05, y: 0.01 },
].map((point, index, array) => {
  return QCommand.line2(point, array[(index + 1) % array.length]);
}); parabolaPaths[0];*/
const pairedParabolaPaths = parabolaPaths.map((idealEnd, index) => {
  const idealStart = parabolaPaths[index - 1] ?? idealEnd;
  const LCM = lcm(idealStart.length, idealEnd.length);
  const [start, end] = [idealStart, idealEnd].map((commands) => {
    const expandBy = LCM / commands.length;
    const newCommands = commands.flatMap((command) =>
      command.multiSplit(expandBy)
    );
    return new PathShape(newCommands);
  });
  return { start, end };
});

const parabolaTransition = makeBoundedLinear(0, 0, -parabolaStartDelay, 1);

function showParabolaFrame(t: number) {
  const current = parabolaScheduler(t);
  const count = parabolaCounts[current.index];
  const transitionProgress =
    current.index == 90 ? 1 : parabolaTransition(current.t);
  setCount(parabolaDisplay, count, transitionProgress);
  setD(parabolaDisplay, pairedParabolaPaths[current.index], transitionProgress);
}

function showLineFrame(t: number) {
  t;
}

function showFrame(t: number) {
  assertValidT(t);
  showParabolaFrame(t);
  showLineFrame(t);
}

function initScreenCapture(script: unknown) {
  return {
    source: "tangent-line-2.ts",
    devicePixelRatio: devicePixelRatio,
    script,
  };
}

const GLOBAL = window as any;
GLOBAL.initScreenCapture = initScreenCapture;
GLOBAL.showFrame = showFrame;

{
  const timeInput = getById("time", HTMLInputElement);
  const showNow = () => {
    const value = timeInput.valueAsNumber;
    showFrame(value);
  };
  timeInput.addEventListener("input", showNow);
  showNow();
}
