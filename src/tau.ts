import { getById, selectorQueryAll } from "phil-lib/client-misc";
import "./tau.css";
import { assertValidT, makeTSplitter } from "./utility";
import {
  initializedArray,
  makeBoundedLinear,
  makeLinear,
  positiveModulo,
  Random,
} from "phil-lib/misc";
import { PathShape } from "./path-shape";
import { TextLayout } from "./letters-more";
import { makeRoughShape } from "./rough-lib";
import { HandwritingEffect } from "./handwriting-effect";

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

const dancingTauPath = selectorQueryAll(
  "#dance .main-path",
  SVGPathElement,
  1,
  1
)[0];

const danceBorderAnimation = (() => {
  const originalShape = PathShape.fromString(tauPath.getAttribute("d")!);
  const seeds = [
    "[865414075,46,1165012143,288037704]",
    "[888652358,42,1959707975,1083510000]",
    "[888761724,43,1169051802,-2117776296]",
  ];
  const roughShapes = seeds.map((seed) => {
    const roughness = 25;
    const random = Random.create(seed);
    const shape = makeRoughShape(originalShape, roughness, random);
    if (shape.after.commands.length != originalShape.commands.length) {
      throw new Error("wtf");
    }
    return shape;
  });
  const originalPath = roughShapes[0].before.cssPath;
  const roughPaths = roughShapes.map((shape) => shape.after.cssPath);
  const animation = dancingTauPath.animate(
    [
      { offset: 0, d: originalPath },
      { offset: 0.1, d: originalPath },
      { offset: 0.2, d: roughPaths[0] },
      { offset: 0.4, d: roughPaths[0] },
      { offset: 0.5, d: originalPath },
      { offset: 0.7, d: roughPaths[1] },
      { offset: 0.9, d: roughPaths[2] },
      { offset: 1, d: originalPath },
    ],
    { duration: 1, fill: "both" }
  );
  animation.pause();
  return animation;
})();

const spreadPoints: Animator = (() => {
  function show(t: number): void {
    assertValidT(t);
    danceElement.style.display = "";
    danceLines.forEach((circle) => (circle.style.display = "none"));
    danceBorderAnimation.currentTime = 0;
    const points = initializedArray(pointCount, (n) => {
      const offset = positiveModulo((t * (n + 1)) / pointCount, 1);
      return dancingTauPath.getPointAtLength(
        dancingTauPath.getTotalLength() * offset
      );
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

const mainDance = (() => {
  function show(t: number, repeatCount: number): void {
    function updatePoints(t: number) {
      assertValidT(t);
      danceElement.style.display = "";
      danceLines.forEach((circle) => (circle.style.display = ""));
      const points = initializedArray(pointCount, (n) => {
        const offset = positiveModulo(t + n / pointCount, 1);
        return dancingTauPath.getPointAtLength(
          dancingTauPath.getTotalLength() * offset
        );
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
    danceBorderAnimation.currentTime = t;
    updatePoints((t * repeatCount) % 1);
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
      mainDance.show(component.t, danceRepeatCount);
      break;
    }
    default: {
      throw new Error("wtf");
    }
  }
}

const conversationHandwritingGroup = getById(
  "conversation-handwriting",
  SVGGElement
);
const thumbnailTextGroup = getById("thumbnail-text", SVGGElement);

/**
 * Draws the discussion on the left with the handwriting effect.
 */
const conversationHandwriting: Animator["show"] = (() => {
  const parent = conversationHandwritingGroup;
  const handwriting = new HandwritingEffect(parent);
  const textLayout = new TextLayout(40);
  textLayout.rightMargin = 1000;
  textLayout.lineHeight *= 0.87;
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
    handwriting.setProgress(timingFunction(t));
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

function showScene(scene: unknown) {
  switch (scene) {
    case "main": {
      thumbnailTextGroup.style.display = "none";
      conversationHandwritingGroup.style.display = "";
      break;
    }
    case "thumbnail": {
      conversationHandwritingGroup.style.display = "none";
      thumbnailTextGroup.style.display = "";
      break;
    }
    default: {
      throw new Error(`unknown scene: ${scene}`);
    }
  }
}

{
  const showThumbnailInput = getById("showThumbnail", HTMLInputElement);
  function checkNow() {
    const showThumbnail = showThumbnailInput.checked;
    const scene = showThumbnail ? "thumbnail" : "main";
    showScene(scene);
  }
  showThumbnailInput.addEventListener("click", checkNow);
  checkNow();
}

// MARK: initScreenCapture()
function initScreenCapture(scene: unknown) {
  showScene(scene);
  document
    .querySelectorAll("[data-hideBeforeScreenshot]")
    .forEach((element) => {
      if (!(element instanceof SVGElement || element instanceof HTMLElement)) {
        throw new Error("wtf");
      }
      element.style.display = "none";
    });
  return {
    source: "tau.ts",
    devicePixelRatio: devicePixelRatio,
    scene,
  };
}

const GLOBAL = window as any;
GLOBAL.initScreenCapture = initScreenCapture;
GLOBAL.showFrame = showFrame;
GLOBAL.showScene = showScene;
