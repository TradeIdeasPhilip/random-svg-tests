import { getById } from "phil-lib/client-misc";
import "./tau.css";
import { assertValidT, makeTSplitter, selectorQueryAll } from "./utility";
import {
  initializedArray,
  makeBoundedLinear,
  makeLinear,
  positiveModulo,
} from "phil-lib/misc";
import { PathShape } from "./path-shape";
import { TextLayout } from "./letters-more";

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

function showMain(t: number) {
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

class Handwriting {
  weight = 1;
  soFar = 0.01;
  constructor(public readonly parent: SVGGElement) {}
  add(letter: { x: number; baseline: number; shape: PathShape }) {
    const segments = letter.shape.splitOnMove().map((shape) => {
      const element = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      element.setAttribute("d", shape.rawPath);
      element.style.transform = `translate(${letter.x}px, ${letter.baseline}px)`;
      this.parent.appendChild(element);
      const before = this.soFar;
      const length = element.getTotalLength();
      const after = before + length;
      this.soFar = after;
      element.style.setProperty("--offset", before.toString());
      element.style.setProperty("--length", length.toString());
      return { element, before, length, after };
    });
    this.updateTotalLength();
    return segments;
  }
  updateTotalLength() {
    const totalLength = this.soFar;
    this.parent.style.setProperty("--total-length", totalLength.toString());
  }
}

/**
 * Draws the discussion on the left with the handwriting effect.
 */
const conversationHandwriting: Animator["show"] = (() => {
  const parent = getById("conversation-handwriting", SVGGElement);
  const handwriting = new Handwriting(parent);
  const textLayout = new TextLayout(40);
  textLayout.rightMargin = 1000;
  textLayout.CRLF();
  textLayout.baseline += 10;
  function say(text: string, className: "student" | "teacher") {
    const leftMargin = className == "student" ? 120 : 45;
    textLayout.x = textLayout.leftMargin = leftMargin;
    const layoutInfo = textLayout.addText(text);
    layoutInfo.forEach((letter) => {
      handwriting
        .add({
          baseline: letter.baseline,
          x: letter.x,
          shape: letter.description.shape,
        })
        .forEach(({ element }) => {
          element.classList.add(className);
        });
    });
    textLayout.baseline += 10;
    textLayout.CRLF();
  }
  say("Did you see the latest 3Blue1Brown video?", "teacher");
  say("Yes.  It looks amazing!", "student");
  say(
    "Would you like to see something similar with tau instead of pi?",
    "teacher"
  );
  say("Of course!", "student");
  say(
    "I have some real stuff on the way.  I just really ♡ some of those animations so I had to try them myself.",
    "teacher"
  );
  const timingFunction = makeBoundedLinear(0.05, 0, 0.8, 1);

  function show(t: number): void {
    parent.style.setProperty("--t", timingFunction(t).toFixed(6));
    assertValidT(t);
  }
  return show;
})();

function showFrame(t: number) {
  assertValidT(t);
  showMain(t);
  conversationHandwriting(t);
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