import { AnimationLoop, getById, selectorQueryAll } from "phil-lib/client-misc";
import { assertValidT, makeTSplitter } from "./utility";
import "./show-text.css";
import { TextLayout } from "./letters-more";
import { makeLineFont } from "./line-font";
import { makeRoughShape } from "./rough-lib";
import { LinearFunction, makeLinear, parseIntX, Random } from "phil-lib/misc";

const inputTextArea = getById("input", HTMLTextAreaElement);
const randomSeedInput = getById("randomSeed", HTMLInputElement);
const drawButton = getById("draw", HTMLButtonElement);
const timeInSecondsInput = getById("timeInSeconds", HTMLInputElement);
const startButton = getById("start", HTMLButtonElement);
const timeRangeElement = getById("time", HTMLInputElement);
//const mainSvg = getById("main", SVGSVGElement);
const handwritingG = getById("handwriting", SVGGElement);
const morphG = getById("morph", SVGGElement);

const previous = { text: "", alignment: "" };

drawButton.addEventListener("click", () => {
  setUpText();
});

function setUpText(text = inputTextArea.value) {
  const alignment = selectorQueryAll(
    'input[name="align"]:checked',
    HTMLInputElement,
    1,
    1
  )[0].value;
  if (alignment != "left" && alignment != "center" && alignment != "right") {
    throw new Error("wtf");
  }

  /**
   * Automatically update the random seed if nothing else has changed.
   */
  const nothingElseHasChanged =
    text == previous.text && alignment == previous.alignment;
  previous.text = text;
  previous.alignment = alignment;
  let seed = randomSeedInput.value;
  if (nothingElseHasChanged || !Random.seedIsValid(seed)) {
    seed = Random.newSeed();
    randomSeedInput.value = seed;
  }
  const random = Random.create(seed);

  handwritingG.innerHTML = "";
  morphG.innerHTML = "";
  const textLayout = new TextLayout();
  textLayout.font = makeLineFont(7);
  const fontMetrics = textLayout.font.get("0")!.fontMetrics;
  textLayout.lineHeight = fontMetrics.bottom - fontMetrics.capitalTop;
  textLayout.restart();
  const original = textLayout.addText(text, alignment);
  const colorsAvailable = [
    "hwb(180deg 0% 25.07%)",
    "hwb(180deg 0% 25.07%)",
    "white",
    "hwb(47.34deg 8.63% 5.88%)",
  ];
  const colorsByBaseline = new Map<number, string>();
  const colorful = original.map((letter) => {
    const baseline = letter.baseline;
    let color = colorsByBaseline.get(baseline);
    if (color === undefined) {
      color = colorsAvailable.shift();
      color ??= "violet";
      colorsByBaseline.set(baseline, color);
    }
    return { ...letter, color };
  });
  const roughed = colorful.map((letter) => {
    const rough = makeRoughShape(
      letter.description.shape,
      letter.description.fontMetrics.strokeWidth,
      random
    );
    const roughShape = rough.after;
    const normalShape = rough.before;
    const description = { shape: roughShape };
    return { ...letter, roughShape, normalShape, description };
  });
  const morph = TextLayout.displayText(roughed, morphG);
  const morphAnimations = morph.map((letter) => {
    letter.element.style.stroke = letter.color;
    const keyframes: Keyframe[] = [
      { offset: 0, d: letter.roughShape.cssPath },
      {
        offset: 1,
        d: letter.normalShape
          .cssPath /*, strokeWidth:0.333,stroke:"hwb(47.34deg 8.63% 5.88%)"*/,
      },
    ];
    const animation = letter.element.animate(keyframes, {
      duration: 1,
      fill: "both",
    });
    animation.pause();
    return animation;
  });
  //  shuffleArray(morphAnimations);
  const hideMorph = () => {
    morphG.style.display = "none";
  };
  const showMorph = (t: number) => {
    assertValidT(t);
    morphG.style.display = "";
    const scaled = t * morphAnimations.length;
    morphAnimations.forEach((animation, index) => {
      const local = scaled - index;
      const clamped = Math.min(1, Math.max(0, local));
      animation.currentTime = clamped;
    });
  };
  {
    let soFar = 0.01;
    roughed.forEach((letter) => {
      letter.roughShape.splitOnMove().map((shape) => {
        const element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        element.setAttribute("d", shape.rawPath);
        element.style.transform = `translate(${letter.x}px, ${letter.baseline}px)`;
        element.style.stroke = letter.color;
        handwritingG.appendChild(element);
        const before = soFar;
        const length = element.getTotalLength();
        const after = before + length;
        soFar = after;
        element.style.setProperty("--offset", before.toString());
        element.style.setProperty("--length", length.toString());
      });
      const totalLength = soFar;
      handwritingG.style.setProperty("--total-length", totalLength.toString());
    });
  }
  const hideHandwriting = () => {
    handwritingG.style.display = "none";
  };
  const showHandwriting = (t: number) => {
    assertValidT(t);
    handwritingG.style.display = "";
    handwritingG.style.setProperty("--t", t.toString());
  };
  (window as any).showHandwriting = showHandwriting;
  const splitter = makeTSplitter(2, 1);
  const showFrame = (t: number) => {
    const component = splitter(t);
    switch (component.index) {
      case 0: {
        hideMorph();
        showHandwriting(component.t);
        break;
      }
      case 1: {
        hideHandwriting();
        showMorph(component.t);
        break;
      }
      default: {
        throw new Error("wtf");
      }
    }
  };
  (window as any).showFrame = showFrame;
  startButton.disabled = false;
}

let previousAnimationLoop: AnimationLoop | undefined;

startButton.addEventListener("click", () => {
  previousAnimationLoop?.cancel();
  const timeInSeconds = parseIntX(timeInSecondsInput.value);
  if (timeInSeconds === undefined) {
    // User error.
    // I could disable this button until the value is valid.
    throw new Error("I don't want to do this better");
  }
  let endTime = 0;
  let getT: LinearFunction | undefined;
  const animationLoop = new AnimationLoop((time) => {
    if (!getT) {
      endTime = time + timeInSeconds * 1000;
      getT = makeLinear(time, 0, endTime, 1);
    }
    if (time > endTime) {
      animationLoop.cancel();
      // TODO WTF put this somewhere better than (window as any)
      // Note that this also exists in show-text-1.ts
      (window as any).showFrame(1);
    } else {
      const t = getT(time);
      timeRangeElement.value = t.toString();
      (window as any).showFrame(t);
    }
  });
  previousAnimationLoop = animationLoop;
});

// MARK: initScreenCapture()
function initScreenCapture() {
  setUpText();
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
  return {
    source: "show-text.ts",
    devicePixelRatio: devicePixelRatio,
  };
}

(window as any).initScreenCapture = initScreenCapture;
