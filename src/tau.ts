import { getById } from "phil-lib/client-misc";
import "./tau.css";
import { assertValidT, makeTSplitter, selectorQueryAll } from "./utility";
import { initializedArray, makeLinear, positiveModulo } from "phil-lib/misc";

const tauPath = getById("tau", SVGPathElement);
const tauPathLength = tauPath.getTotalLength();

type Animator = {
  show: (t: number) => void;
  hide: () => void;
};

/**
 * Draws the big τ with the handwriting effect.
 */
const mainHandwriting: Animator = (() => {
  const element = getById("main-handwriting", SVGUseElement);
  element.style.strokeDasharray = `0, ${tauPathLength + 1}, ${
    tauPathLength + 1
  },0`;
  const timingFunction = makeLinear(0, 0, 1, -tauPathLength);
  function show(t: number): void {
    assertValidT(t);
    element.style.display = "";
    element.style.strokeDashoffset = timingFunction(t).toFixed(6);
  }
  function hide(): void {
    element.style.display = "none";
  }
  return { show, hide };
})();

const danceElement = getById("dance", SVGGElement);
const pointCount = 4;
const danceLines = selectorQueryAll(
  "#dance line",
  SVGLineElement,
  pointCount,
  pointCount
);
const danceCircles = selectorQueryAll(
  "#dance circle",
  SVGCircleElement,
  pointCount,
  pointCount
);

const spreadPoints: Animator = (() => {
  function show(t: number): void {
    assertValidT(t);
    danceElement.style.display = "";
    danceLines.forEach((circle) => (circle.style.display = "none"));
    const points = initializedArray(pointCount, (n) => {
      const offset = positiveModulo((t * (n + 1)) / pointCount, 1);
      return tauPath.getPointAtLength(tauPathLength * offset);
    });
    points.forEach((point, index) => {
      const circle = danceCircles[index];
      circle.cx.baseVal.value = point.x;
      circle.cy.baseVal.value = point.y;
    });
  }
  function hide(): void {
    danceElement.style.display = "";
  }
  return { show, hide };
})();

const mainDance: Animator = (() => {
  function show(t: number): void {
    assertValidT(t);
    danceElement.style.display = "";
    danceLines.forEach((circle) => (circle.style.display = ""));
    const points = initializedArray(pointCount, (n) => {
      const offset = positiveModulo(t + n / pointCount, 1);
      return tauPath.getPointAtLength(tauPathLength * offset);
    });
    points.forEach((point, index) => {
      const line = danceLines[index];
      const circle = danceCircles[index];
      line.x1.baseVal.value = circle.cx.baseVal.value = point.x;
      line.y1.baseVal.value = circle.cy.baseVal.value = point.y;
      const nextPoint = points[index + 1] ?? points[0];
      line.x2.baseVal.value = nextPoint.x;
      line.y2.baseVal.value = nextPoint.y;
    });
  }
  function hide(): void {
    danceElement.style.display = "none";
  }
  return { show, hide };
})();

const danceRepeatCount = 3;

const splitter = makeTSplitter(1, 1, danceRepeatCount);

function showFrame(t: number) {
  assertValidT(t);
  mainHandwriting.hide();
  spreadPoints.hide();
  mainDance.hide();
  const component = splitter(t);
  switch (component.index) {
    case 0: {
      mainHandwriting.show(component.t);
      break;
    }
    case 1: {
      spreadPoints.show(component.t);
      break;
    }
    case 2: {
      const t1 = (component.t * danceRepeatCount) % 1;
      mainDance.show(t1);
      break;
    }
    default: {
      throw new Error("wtf");
    }
  }
}

{
  const timeInput = getById("time", HTMLInputElement);
  const showNow = () => {
    const value = timeInput.valueAsNumber;
    showFrame(value);
  };
  timeInput.addEventListener("input", showNow);
  showNow();
}
