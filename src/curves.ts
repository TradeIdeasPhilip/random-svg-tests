import "./curves.css";

import {
  VectorFunction,
  WidthFunction,
  makeInwardSpiral,
  makeLogarithmicSpiral,
  makeOutwardSpiral,
  mathToPath,
  spiralPath,
  variableWidthPath,
} from "./math-to-path";
import { getById } from "phil-lib/client-misc";
import { makeLinear, makePromise } from "phil-lib/misc";

const svgElement = getById("main", SVGSVGElement);
const controlsElement = getById("controls", HTMLDivElement);

function addCheckBox(description: string, svgPathElement: SVGPathElement) {
  const containerElement = document.createElement("div");
  controlsElement.appendChild(containerElement);
  containerElement.classList.add("check-box-container");
  const id = `_addCheckBox__${description}`;
  const inputElement = document.createElement("input");
  containerElement.appendChild(inputElement);
  inputElement.type = "checkbox";
  inputElement.id = id;
  const labelElement = document.createElement("label");
  containerElement.appendChild(labelElement);
  labelElement.htmlFor = id;
  labelElement.innerText = description;
  const spanElement = document.createElement("span");
  containerElement.appendChild(spanElement);
  spanElement.innerText = " 🐢";
  spanElement.style.cursor = "pointer";
  spanElement.addEventListener("click", () => {
    animatePath(svgPathElement.style.d);
  });
  svgPathElement.style.display = "none";
  inputElement.addEventListener("input", () => {
    svgPathElement.style.display = inputElement.checked ? "" : "none";
  });
}

function magentaSpiral() {
  const path = spiralPath({ x: 50, y: 10 }, { x: 50, y: 50 }, 3);
  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathElement.style.d = `path("${path}")`;
  pathElement.style.fill = "none";
  pathElement.style.stroke = "magenta";
  svgElement.appendChild(pathElement);
  addCheckBox("Magenta", pathElement);
}
magentaSpiral();

function limeSpiral() {
  const functions = [
    makeInwardSpiral({ x: 50, y: 10 }, { x: 50, y: 50 }, 3),
    makeOutwardSpiral({ x: 50, y: 50 }, { x: 90, y: 50 }, 3),
  ];
  const path =
    functions
      .map((f, index) =>
        mathToPath(f, {
          numberOfSegments: 25,
          initialCommand: index ? "L" : "M",
        })
      )
      .join(" ") + " z";
  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathElement.style.d = `path("${path}")`;
  pathElement.style.fill = "lime";
  pathElement.style.stroke = "none";
  svgElement.appendChild(pathElement);
  addCheckBox("Lime", pathElement);
}
limeSpiral();

function orangeSpiral() {
  const functions = [
    makeInwardSpiral({ x: 50, y: 90 }, { x: 50, y: 50 }, 3),
    makeOutwardSpiral({ x: 50, y: 50 }, { x: 10, y: 50 }, 3),
  ];
  const path =
    functions
      .map((f, index) =>
        mathToPath(f, {
          numberOfSegments: 23,
          initialCommand: index ? "L" : "M",
        })
      )
      .join(" ") + " z";
  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathElement.style.d = `path("${path}")`;
  pathElement.style.fill = "orange";
  pathElement.style.stroke = "none";
  svgElement.appendChild(pathElement);
  addCheckBox("Orange", pathElement);
}
orangeSpiral();

async function animatePath(path: string) {
  const gElement = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const textElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "text"
  );
  textElement.textContent = "🐢";
  textElement.style.fontSize = "10px";
  textElement.style.transform = "scale(-1, 1)";
  textElement.style.textAnchor = "middle";
  gElement.style.offsetPath = path;
  gElement.style.offsetPosition = "center";
  gElement.style.offsetDistance = "0%";
  svgElement.appendChild(gElement);
  gElement.appendChild(textElement);
  const animation = gElement.animate({ offsetDistance: "100%" }, 10000);
  await animation.finished;
  gElement.remove();
}

function blueTriangleSpiral() {
  const rotations = 3;
  const base = makeInwardSpiral({ x: 50, y: 10 }, { x: 50, y: 50 }, rotations);
  const width1 = makeLinear(0, 40 / rotations, 1, 0);
  const width: WidthFunction = ({ t }): number => width1(t);
  const path = variableWidthPath(base, width, rotations * Math.PI * 3);
  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathElement.style.d = `path("${path}")`;
  pathElement.style.fill = "blue";
  pathElement.style.stroke = "none";
  svgElement.appendChild(pathElement);
  addCheckBox("Blue Triangle", pathElement);
}
blueTriangleSpiral();

function exponentialSpiral() {
  const path = makeLogarithmicSpiral({
    center: { x: 50, y: 50 },
    fromAngle: -Math.PI / 2,
    toAngle: Math.PI * 4,
    fromRadius: 40,
    toRadius: 4,
    widthRatio: 0.5,
  });
  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathElement.style.d = `path("${path}")`;
  pathElement.style.fill = "slategray";
  pathElement.style.stroke = "none";
  svgElement.appendChild(pathElement);
  addCheckBox("Exponential", pathElement);
}
exponentialSpiral();

function calligraphySpiral() {
  const rotations = 3;
  const base = makeInwardSpiral({ x: 50, y: 10 }, { x: 50, y: 50 }, rotations);
  const width: WidthFunction = ({ tangentAngle }): number =>
    Math.pow(Math.sin(tangentAngle), 2) * 2 + 0.2;
  const path = variableWidthPath(base, width, rotations * Math.PI * 3);
  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathElement.style.d = `path("${path}")`;
  pathElement.style.fill = "tan";
  pathElement.style.stroke = "none";
  svgElement.appendChild(pathElement);
  addCheckBox("Calligraphy", pathElement);
}
calligraphySpiral();

function simpleHeart() {
  const path =
    "M 10,30  A 20,20 0,0,1 50,30  A 20,20 0,0,1 90,30  Q 90,60 50,90  Q 10,60 10,30 z";
  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathElement.style.d = `path("${path}")`;
  pathElement.style.fill = "none";
  pathElement.style.stroke = "red";
  svgElement.appendChild(pathElement);
  addCheckBox("Simple ♡", pathElement);
}
simpleHeart();

/**
 * This is the inverse of `mathToPath()`.  If you call one of these functions on the output of the other,
 * you'll get an approximation of the initial input.
 *
 * This function can create the `base` input to `variableWidthPath()`.
 * @param path A path in a format suitable for the `d` attribute of a `<path>` element.
 * @returns A `VectorFunction` describing the path.  0 points to the beginning of the path, 1 to the end.
 * And a `cleanup()` function.  Unfortunately I have to add an object to the DOM to implement this function
 * so the caller has to call `cleanup()` to remove the object when done.
 */
async function pathToMath(path: string): Promise<{
  vectorFunction: VectorFunction;
  cleanup(): void;
}> {
  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  function cleanup() {
    pathElement.remove();
  }
  pathElement.style.d = `path("${path}")`;
  if (pathElement.style.d == "") {
    console.error({ invalidPath: path });
    throw new Error("Invalid Path");
  }
  pathElement.style.display = "none";
  svgElement.appendChild(pathElement);
  function vectorFunction(t: number) {
    const length = t * pathElement.getTotalLength();
    return pathElement.getPointAtLength(length);
  }
  const promise = makePromise();
  requestAnimationFrame(() => {
    promise.resolve();
  });
  await promise.promise;
  return { cleanup, vectorFunction };
}

async function RecreatedHeart() {
  const originalPath =
    "M 50,30   A 20,20 0,0,1 90,30  Q 90,60 50,90  Q 10,60 10,30 A 20,20 0,0,1 50,30 z";
  const tempMath = await pathToMath(originalPath);
  const finalPath = mathToPath(tempMath.vectorFunction, {
    numberOfSegments: 41,
  });
  //console.log(finalPath);
  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathElement.style.d = `path("${finalPath}")`;
  pathElement.style.fill = "none";
  pathElement.style.stroke = "pink";
  svgElement.appendChild(pathElement);
  addCheckBox("Recreated ♡", pathElement);
  tempMath.cleanup();
}
RecreatedHeart();

async function WeightedHeart() {
  const originalPath =
    "M 50,30   A 20,20 0,0,1 90,30  Q 90,60 50,90  Q 10,60 10,30 A 20,20 0,0,1 50,30 z";
  const heartMath = await pathToMath(originalPath);
  const numberOfCycles = 3;
  function timeToWidth({ t }: { t: number }) {
    return 1.5 - Math.cos(t * (2 * Math.PI) * numberOfCycles);
  }
  const finalPath = variableWidthPath(
    heartMath.vectorFunction,
    timeToWidth,
    51
  );
  //console.log(finalPath);
  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathElement.style.d = `path("${finalPath}")`;
  pathElement.style.fill = "lavender";
  pathElement.style.stroke = "none";
  svgElement.appendChild(pathElement);
  addCheckBox("Weighted ♡", pathElement);
  heartMath.cleanup();
}
WeightedHeart();
