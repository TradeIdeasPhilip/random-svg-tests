import { getById } from "phil-lib/client-misc";
import "./style.css";
import "./tangent-line-2.css";
import { FULL_CIRCLE, initializedArray, makeLinear } from "phil-lib/misc";
import { PathShape, QCommand } from "./path-shape";

const WIDTH = 1920;
const HEIGHT = 1080;

const svg = getById("main", SVGSVGElement);

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

function makeCompareElement(request: Partial<Request>) {
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

function drawShape(qCommands: readonly QCommand[]) {
  const cssPath = new PathShape(qCommands).cssPath;
  return makeCompareElement({
    cssPath,
    ...nextLocation(),
  });
}

[3].forEach((numberOfSides) => {
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

[5].forEach((numberOfSides) => {
  const points = getPoints(numberOfSides);
  const qCommands = points.map((point, index, array) => {
    const nextPoint = array[(index + 1) % array.length];
    const line = QCommand.line2(point, nextPoint);
    return line;
  });
  drawShape(qCommands).text.textContent = numberOfSides.toString();
});

//makeCompareElement
/**
 * start with a big circle (6 parabolas)
 * immediately animate to the 3 parabolas state.
 * Draw a 3 and pause for an appropriate amount of time.
 * animate to the 4, draw 4, pause and repeat.
 *
 * polygons.
 * Start the triangle by handwriting it.
 * All other transitions work the same as above.
 *
 * make the circle wink out and back in for each cycle of the parabola
 * but not for the polygons
 * and the parabolas update more slowly.
 * and display more polygons than parabolas
 * use a simple handwriting effect to wink in and out.
 *
 * legend:
 * ideal = white
 * approximation = gold
 * gold covers white = perfect
 * The words "gold" and "white" are colored as named.
 * All other words are in blue
 *
 *
 * then parabola demo on left and polygon demo on the right
 * number in the center of each circle
 * The old number disappears instantly when the morphing starts.
 * The new number gets handwriting-ed in.
 *
 * "parabolas" / "lines" at the bottom
 */
