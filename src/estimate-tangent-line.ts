import { getById } from "phil-lib/client-misc";
import "./estimate-tangent-line.css";
import {
  assertClass,
  FIGURE_SPACE,
  FULL_CIRCLE,
  makeBoundedLinear,
  makeLinear,
  polarToRectangular,
} from "phil-lib/misc";
import { assertValidT, makeTSplitter, selectorQueryAll } from "./utility";

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
  assertValidT(t);
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
  assertValidT(t);
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

function initIntroduction() {
  const splitter = makeTSplitter(3, 1);
  const getPosition = [
    makeLinear(0, 0.25, 1, 0),
    makeLinear(0, 0, 1, 0.04),
  ] as const;
  function showFrame(t: number) {
    const component = splitter(t);
    showHalfCircle(getPosition[component.index](component.t));
  }
  return showFrame;
}

/**
 * This is like an ease-in-out for the first half
 * followed by a second ease-in-out for the second half.
 *
 * I.e. It moves slowly at the beginning, in the middle, and at the end.
 * And it speeds up at the other times to make up for lost ground.
 * Sometimes the derivative is 0, but never negative.
 * @param t Standard 0-1
 * @returns Standard 0-1, but with a different acceleration profile.
 */
function doubleEaseInOut(t: number): number {
  function base(θ: number) {
    return θ - Math.sin(θ);
  }
  const scale = 2 * FULL_CIRCLE;
  return base(t * scale) / scale;
}

/**
 *
 * @param cycleCount Very arbitrary.  The voiceover for this part is slow.  My original plan was to use ½ of one cycle.
 */
function makePopper(cycleCount = 3) {
  const scale = (FULL_CIRCLE / 2) * cycleCount;
  /**  The output will get here sometimes. And it will spend a lot of time near here.  And it will start and end here. */
  const slowExtreme = 0;
  /**
   * The output will get to here sometimes, but it will quickly move away.
   */
  const fastExtreme = 0.25;
  const scaleOutput = makeLinear(1, slowExtreme, 0, fastExtreme);
  function popper(t: number) {
    const θ = t * scale;
    const unscaledResult = Math.abs(Math.cos(θ));
    const result = scaleOutput(unscaledResult);
    return result;
  }
  return popper;
}
function initMain() {
  const start0 = (1 * 60 + 36) * 60 + 56;
  const start1 = (1 * 60 + 40) * 60 + 9;
  const start2 = (1 * 60 + 57) * 60 + 0;
  //const start3 = (2 * 60 + 11) * 60 + 30;
  const start4 = (2 * 60 + 16) * 60 + 22;
  const acts = [
    {
      weight: start1 - start0,
      display: showHalfCircle,
      timingFunction: makeLinear(0, 0.0371, 1, 0.0056),
    },
    {
      weight: start2 - start1,
      display: showFullCircle,
      timingFunction: doubleEaseInOut,
    },
    {
      weight: start4 - start2,
      display: showHalfCircle,
      timingFunction: makePopper(),
    },
  ];
  const splitter = makeTSplitter(...acts.map((act) => act.weight));
  function showFrame(t: number) {
    const split = splitter(t);
    const { display, timingFunction } = acts[split.index];
    display(timingFunction(split.t));
  }
  console.log(start4 - start0, (start4 - start0) / 60);
  return showFrame;
}

let showFrame = (t: number): void => {
  console.warn(`showFrame(${t})`);
};

function setScript(script: unknown) {
  switch (script) {
    case "full circle": {
      showFrame = showFullCircle;
      break;
    }
    case "half circle": {
      showFrame = showHalfCircle;
      break;
    }
    case "introduction": {
      showFrame = initIntroduction();
      break;
    }
    case "main": {
      showFrame = initMain();
      break;
    }
    default: {
      throw new Error("invalid script name");
    }
  }
}

{
  const updateTime = () => showFrame(timeInput.valueAsNumber);
  const updateScript = () => {
    const newScript = selectorQueryAll(
      'input[name="script"]:checked',
      HTMLInputElement,
      1,
      1
    )[0].value;
    setScript(newScript);
    updateTime();
  };
  updateScript();
  timeInput.addEventListener("input", updateTime);
  selectorQueryAll('input[name="script"]', HTMLInputElement, 2).forEach(
    (element) => element.addEventListener("click", updateScript)
  );
}

function initScreenCapture(script: unknown) {
  document
    .querySelectorAll("[data-hideBeforeScreenshot]")
    .forEach((element) => {
      if (!(element instanceof SVGElement || element instanceof HTMLElement)) {
        throw new Error("wtf");
      }
      element.style.display = "none";
    });
  /*   document
    .querySelectorAll("[data-showBeforeScreenshot]")
    .forEach((element) => {
      if (!(element instanceof SVGElement || element instanceof HTMLElement)) {
        throw new Error("wtf");
      }
      element.style.display = "";
    }); */
  setScript(script);
  return {
    source: "estimate-tangent-line.ts",
    devicePixelRatio: devicePixelRatio,
    script,
  };
}

const GLOBAL = window as any;
GLOBAL.showFullCircle = showFullCircle;
GLOBAL.showHalfCircle = showHalfCircle;
GLOBAL.initScreenCapture = initScreenCapture;
GLOBAL.showFrame = (t: number) => showFrame(t);
