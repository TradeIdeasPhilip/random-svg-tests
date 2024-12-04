import { getById } from "phil-lib/client-misc";
import "./estimate-tangent-line.css";
import {
  assertClass,
  FIGURE_SPACE,
  FULL_CIRCLE,
  lerp,
  makeBoundedLinear,
  makeLinear,
  polarToRectangular,
} from "phil-lib/misc";
import { selectorQueryAll } from "./utility";

const mainSvg = getById("main", SVGSVGElement);
const legend = getById("legend", SVGGElement);
const fullCircle = getById("fullCircle", SVGCircleElement);
const halfCircle = getById("halfCircle", SVGPathElement);
const leftDot = getById("leftDot", SVGCircleElement);
const rightDot = getById("rightDot", SVGCircleElement);
const approximateLine = getById("approximateLine", SVGLineElement);
const timeInput = getById("time", HTMLInputElement);

{
  const top = legend.firstElementChild!;
  const bottom = assertClass(top.cloneNode(true), SVGGElement);
  legend.insertBefore(bottom, top);
  bottom.classList.add("border");
}

const precisionIssuesText = selectorQueryAll(
  "[data-precisionIssues]",
  SVGTextElement,
  2,
  2
);

const viewBox = mainSvg.viewBox.baseVal;
{
  const diameter = 2;
  const below = 0.1;
  const above = 0.6;
  const height = diameter + below + above;
  const aspectRatio = 16 / 9;
  const width = height * aspectRatio;
  viewBox.height = height;
  viewBox.width = width;
  viewBox.x = width / -2 - 1.1;
  viewBox.y = -(above + diameter / 2);
}

function hide(element: SVGElement) {
  element.style.display = "none";
}

function reveal(element: SVGElement) {
  element.style.display = "";
}

function attenuate(strength: number, line = approximateLine) {
  const fullWidth = 0.04;
  const currentWidth = fullWidth * strength;
  line.style.strokeDasharray = `${currentWidth} ${fullWidth - currentWidth}`;
  line.style.strokeWidth = currentWidth.toString();
  precisionIssuesText.forEach(
    (text) =>
      (text.textContent = ((1 - strength) * 100)
        .toFixed(0)
        .padStart(3, FIGURE_SPACE))
  );
}

const fullCircleStrength = makeBoundedLinear(0, 0, 0.011, 1);

function showFullCircle(t: number) {
  hide(halfCircle);
  reveal(fullCircle);
  const angle = (t - 0.25) * FULL_CIRCLE;
  const { x, y } = polarToRectangular(1, angle);
  leftDot.cx.baseVal.value = x;
  leftDot.cy.baseVal.value = y;
  rightDot.cx.baseVal.value = -x;
  rightDot.cy.baseVal.value = y;
  approximateLine.x1.baseVal.value = -4;
  approximateLine.y1.baseVal.value = y;
  approximateLine.x2.baseVal.value = 4;
  approximateLine.y2.baseVal.value = y;
  const distanceFromProblem = Math.min(t, 1 - t, Math.abs(t - 0.5));
  const strength = fullCircleStrength(distanceFromProblem);
  attenuate(strength);
}

const halfCircleStrength = makeBoundedLinear(0, 0, 0.022, 1);

function showHalfCircle(t: number) {
  hide(fullCircle);
  reveal(halfCircle);
  const angle = (t - 0.25) * FULL_CIRCLE;
  const { x, y } = polarToRectangular(1, angle);
  const x1 = 0;
  const y1 = -1;
  const x2 = Math.abs(x);
  const y2 = y;
  leftDot.cx.baseVal.value = x1;
  leftDot.cy.baseVal.value = y1;
  rightDot.cx.baseVal.value = x2;
  rightDot.cy.baseVal.value = y2;
  // WARNING this doesn't work for verticals, and I'm not sure about close to vertical.
  // I'm ignoring that for now because I don't think the main program will go anywhere near vertical.
  const xToY = makeLinear(x1, y1, x2, y2);
  approximateLine.x1.baseVal.value = -4;
  approximateLine.y1.baseVal.value = xToY(-4);
  approximateLine.x2.baseVal.value = 4;
  approximateLine.y2.baseVal.value = xToY(4);
  attenuate(halfCircleStrength(t));
}

function showFrame(t: number) {
  const firstPart = 0.5;
  const repeatCount = 3;
  if (t < firstPart) {
    const t1 = t / firstPart;
    const t2 = (t1 * repeatCount) % 1;
    showFullCircle(t2);
  } else {
    const t1 = (t - firstPart) / (1 - firstPart);
    const t2 = (t1 * repeatCount) % 1;
    const limit = 0.25; // Go this far, then go back to 0.
    if (t2 < 0.5) {
      // First half of the cycle: Angle getting larger.

      const t3 = t2 * 2;

      const t4 = lerp(0, limit, t3);
      showHalfCircle(t4);
    } else {
      // Second half of cycle, angle getting smaller.
      const t3 = t2 * 2 - 1;
      const t4 = lerp(limit, 0, t3);
      showHalfCircle(t4);
    }
  }
}

{
  const updateTime = () => showFrame(timeInput.valueAsNumber);
  updateTime();
  timeInput.addEventListener("input", updateTime);
}

const GLOBAL = window as any;
GLOBAL.showFullCircle = showFullCircle;
GLOBAL.showHalfCircle = showHalfCircle;
GLOBAL.showFrame = showFrame;

/*
TODO

hide the input on command.
make a simple function with a well known name in the global name space

*/
