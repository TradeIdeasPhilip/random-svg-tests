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
  zoom: 100,
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
  topG.append(path, circle);
  svg.appendChild(topG);
  return { topG, circle, path };
}

function nthLocation(n: number) {
  const ACROSS = 8;
  const DOWN = 4;
  const column = Math.floor(n / DOWN);
  const row = n % DOWN;
  const x = ((column + 0.5) * WIDTH) / ACROSS;
  const y = ((row + 0.5) * WIDTH) / ACROSS;
  return { x, y };
}

let howManyHaveBeenPlaced = 0;
function nextLocation() {
  const result = nthLocation(howManyHaveBeenPlaced);
  howManyHaveBeenPlaced++;
  return result;
}

/* 
makeCompareElement({
  cssPath: "path('M 0 -1 L 1 0 0 1 -1 0 Z')",
  ...nextLocation(),
});
 */

[3, 4, 5, 6, 7, 8, 9, 10].forEach((numberOfSides) => {
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
  const polygon: QCommand[] = [];
  const curved: QCommand[] = [];
  points.forEach((point, index, array) => {
    const nextPoint = array[(index + 1) % array.length];
    const line = QCommand.line2(point, nextPoint);
    const curve = QCommand.angles(
      point.x,
      point.y,
      point.tangentAngle,
      nextPoint.x,
      nextPoint.y,
      nextPoint.tangentAngle
    );
    polygon.push(line);
    curved.push(curve);
  });
  [polygon, curved].forEach((qCommands) => {
    const cssPath = new PathShape(qCommands).cssPath;
    makeCompareElement({
      cssPath,
      ...nextLocation(),
    });
  });
});
