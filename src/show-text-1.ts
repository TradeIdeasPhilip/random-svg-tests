import "./show-text-1.css";
import { AnimationLoop, getById } from "phil-lib/client-misc";
import { LinearFunction, makeLinear, parseIntX } from "phil-lib/misc";
import {
  assertValidT,
  constantAcceleration,
  makeTSplitter,
  Random,
} from "./utility";
import { LetterLayoutInfo, TextLayout } from "./letters-more";
import { makeLineFont } from "./line-font";
import { Font, FontMetrics } from "./letters-base";
import { makeRoughShape } from "./rough-lib";
import { HandwritingEffect } from "./handwriting-effect";
import { PathShape } from "./path-shape";

const randomSeedInput = getById("randomSeed", HTMLInputElement);
const drawButton = getById("draw", HTMLButtonElement);
const timeInSecondsInput = getById("timeInSeconds", HTMLInputElement);
const startButton = getById("start", HTMLButtonElement);
const timeRangeElement = getById("time", HTMLInputElement);
const handwritingG = getById("handwriting", SVGGElement);
const morphG = getById("morph", SVGGElement);

drawButton.addEventListener("click", () => {
  setUpText();
});

const inputFormatter = Intl.NumberFormat(undefined, {
  useGrouping: true,
  maximumFractionDigits: 4,
});
const meanFormatter = Intl.NumberFormat(undefined, {
  useGrouping: true,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const errorFormatter = Intl.NumberFormat(undefined, {
  useGrouping: true,
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

type ColorName = "blue" | "gold" | "white";
type ColorfulLayoutInfo = LetterLayoutInfo & { readonly colorName: ColorName };

function setUpText() {
  type NumberStrings = { baseValueString: string } & (
    | { finite: true; meanString: string; errorString: string }
    | { finite: false; errorMessage: string }
  );
  function numberInfo(baseValue: number): NumberStrings {
    const baseValueString = inputFormatter.format(baseValue);
    const maxIn = baseValue + 1;
    const minIn = baseValue - 1;
    const maxOut = maxIn / minIn;
    const minOut = minIn / maxIn;
    const mean = (maxOut + minOut) / 2;
    const error = maxOut - mean;
    if (isFinite(mean) && isFinite(error)) {
      return {
        baseValueString,
        finite: true,
        meanString: meanFormatter.format(mean),
        errorString: errorFormatter.format(error),
      };
    } else {
      return { baseValueString, finite: false, errorMessage: "#DIV/0!" };
    }
  }
  const rows: { strings: NumberStrings; finalRough: number }[] = [
    { strings: numberInfo(10001), finalRough: 0 },
    { strings: numberInfo(1001), finalRough: 0 },
    { strings: numberInfo(101), finalRough: 0.2 },
    { strings: numberInfo(11), finalRough: 0.45 },
    { strings: numberInfo(2), finalRough: 0.7 },
    { strings: numberInfo(1.1), finalRough: 1 },
    { strings: numberInfo(1.01), finalRough: 1.2 },
    { strings: numberInfo(1.001), finalRough: 1.5 },
    { strings: numberInfo(1.0001), finalRough: 2 },
    { strings: numberInfo(1), finalRough: 0 },
  ];

  let seed = randomSeedInput.value;
  if (!Random.seedIsValid(seed)) {
    seed = Random.newSeed();
    randomSeedInput.value = seed;
  }
  const random = Random.create(seed);

  handwritingG.innerHTML = "";
  morphG.innerHTML = "";
  type ReadonlyTextSegment = {
    readonly width: number;
    readonly letters: ColorfulLayoutInfo[];
  };
  class TextSegment {
    readonly #letters = new Array<ColorfulLayoutInfo>();
    get letters() {
      return [...this.#letters];
    }
    readonly #textLayout = new TextLayout();
    constructor(font: number | FontMetrics | Font) {
      if (!(font instanceof Map)) {
        font = makeLineFont(font);
      }
      this.#textLayout.font = font;
      this.restart();
    }
    restart() {
      this.#textLayout.restart(0, 0);
      this.#letters.length = 0;
    }
    addAndTag(text: string, colorName: ColorName) {
      const added = this.#textLayout.addText(text);
      const letters = this.#letters;
      added.forEach((letter) => letters.push({ colorName, ...letter }));
    }
    get width() {
      return this.#textLayout.x;
    }
    extract(): ReadonlyTextSegment {
      const result = { width: this.width, letters: this.letters };
      this.restart();
      return result;
    }
    single(text: string, colorName: ColorName) {
      this.restart();
      this.addAndTag(text, colorName);
      return this.extract();
    }
  }
  const font = makeLineFont(2.7);
  //textLayout.lineHeight = 3.7;
  const t = new TextSegment(font);
  const division = t.single(" ÷ ", "blue");
  const arrow = t.single(" → ", "blue");
  const textSegments = rows.map(
    (
      row
    ): { inputLayoutInfo: ReadonlyTextSegment } & (
      | {
          finite: false;
          messageLayoutInfo: ReadonlyTextSegment;
        }
      | {
          finite: true;
          meanLayoutInfo: ReadonlyTextSegment;
          errorLayoutInfo: ReadonlyTextSegment;
        }
    ) => {
      const strings = row.strings;
      t.addAndTag("(" + strings.baseValueString, "blue");
      t.addAndTag(" ± 1", "white");
      t.addAndTag(")", "blue");
      const inputLayoutInfo = t.extract();
      if (strings.finite) {
        const meanLayoutInfo = t.single(strings.meanString, "blue");
        const errorLayoutInfo = t.single(" ± " + strings.errorString, "white");
        return {
          inputLayoutInfo,
          finite: true,
          meanLayoutInfo,
          errorLayoutInfo,
        };
      } else {
        const messageLayoutInfo = t.single(strings.errorMessage, "gold");
        return { inputLayoutInfo, finite: false, messageLayoutInfo };
      }
    }
  );

  let left = 7;
  const maxInputWidth = Math.max(
    ...textSegments.map((row) => row.inputLayoutInfo.width)
  );
  const inputCenter1 = left + maxInputWidth / 2;
  left += maxInputWidth;
  const divisionLeft = left;
  left += division.width;
  const inputCenter2 = left + maxInputWidth / 2;
  left += maxInputWidth;
  const arrowLeft = left;
  left += arrow.width;
  const maxMeanWidth = Math.max(
    ...textSegments.flatMap((row) =>
      row.finite ? [row.meanLayoutInfo.width] : []
    )
  );
  const outputLeft = left;
  left += maxMeanWidth;
  const meanRight = left;
  const maxErrorWidth = Math.max(
    ...textSegments.flatMap((row) =>
      row.finite ? [row.errorLayoutInfo.width] : []
    )
  );
  left += maxErrorWidth;
  const errorRight = left;
  const outputRight = left;

  const inPosition = textSegments.map((row, rowIndex) => {
    type InputLetter = ReadonlyTextSegment["letters"][number];
    type OutputLetter = InputLetter & { neverLeaveRough: boolean };
    const allLetters: OutputLetter[] = [];
    const baseline = (rowIndex + 1) * 4.8 * 1.125;
    function addAndTransform(
      Δx: number,
      letters: InputLetter[],
      neverLeaveRough: boolean
    ) {
      letters.forEach((letter) => {
        allLetters.push({
          ...letter,
          x: letter.x + Δx,
          baseline,
          neverLeaveRough,
        });
      });
    }
    const inputOffset1 = inputCenter1 - row.inputLayoutInfo.width / 2;
    addAndTransform(inputOffset1, row.inputLayoutInfo.letters, true);
    addAndTransform(divisionLeft, division.letters, true);
    const inputOffset2 = inputOffset1 - inputCenter1 + inputCenter2;
    addAndTransform(inputOffset2, row.inputLayoutInfo.letters, true);
    addAndTransform(arrowLeft, arrow.letters, true);
    if (!row.finite) {
      const availableWidth = outputRight - outputLeft;
      const extraSpace = availableWidth - row.messageLayoutInfo.width;
      const left = outputLeft + extraSpace / 2;
      addAndTransform(left, row.messageLayoutInfo.letters, true);
    } else {
      const mean = row.meanLayoutInfo!;
      addAndTransform(meanRight - mean.width, mean.letters, false);
      const error = row.errorLayoutInfo!;
      addAndTransform(errorRight - error.width, error.letters, false);
    }
    return allLetters;
  });

  const roughed: (ColorfulLayoutInfo & {
    initialShape: PathShape;
    finalShape: PathShape;
    finalAnimation: number | "forever";
  })[] = [];
  inPosition.map((row, index) => {
    /**
     * 0 means end perfect.  1 means leave it as it was.  >1 means make it even rougher than it was.
     */
    const rowFinalRoughness = rows[index].finalRough;
    row.forEach((letter) => {
      const rough = makeRoughShape(
        letter.description.shape,
        letter.description.fontMetrics.strokeWidth,
        random
      );
      /**
       * 0 means end perfect.  1 means leave it as it was.  >1 means make it even rougher than it was.
       */
      const letterFinalRoughness = letter.neverLeaveRough
        ? 0
        : rowFinalRoughness;
      if (letterFinalRoughness <= 1) {
        //
        const initialShape = rough.after;
        const finalShape = rough.before;
        const finalAnimation = 1 - letterFinalRoughness;
        const description = letter.description.reshape(initialShape);
        roughed.push({
          ...letter,
          initialShape,
          finalShape,
          finalAnimation,
          description,
        });
      } else {
        //
        const rougher = makeRoughShape(
          rough.after,
          letter.description.fontMetrics.strokeWidth *
            (letterFinalRoughness - 1) *
            3,
          random
        );
        const initialShape = rougher.before;
        const finalShape = rougher.after;
        const finalAnimation = "forever";
        const description = letter.description.reshape(initialShape);
        roughed.push({
          ...letter,
          initialShape,
          finalShape,
          finalAnimation,
          description,
        });
      }
    });
  });
  const morph = TextLayout.displayText(roughed, morphG);

  const morphAnimations = morph.map((letter) => {
    letter.element.classList.add(letter.colorName);
    const finalTime = letter.finalAnimation;
    const keyframes: Keyframe[] = [
      { offset: 0, d: letter.initialShape.cssPath },
      {
        offset: 1,
        d: letter.finalShape.cssPath,
      },
    ];
    if (typeof finalTime === "number") {
      const temporaryAnimation = letter.element.animate(keyframes, {
        duration: 1,
        fill: "both",
      });
      temporaryAnimation.currentTime = finalTime;
      temporaryAnimation.commitStyles();
      temporaryAnimation.cancel();
      keyframes.pop();
      const animation = letter.element.animate(keyframes, {
        duration: 1,
        fill: "both",
      });
      animation.pause();
      return animation;
    } else {
      const animation = letter.element.animate(keyframes, {
        duration: 5,
        fill: "both",
        direction: "alternate",
        iterations: Infinity,
      });
      animation.pause();
      return animation;
    }
  });
  const hideMorph = () => {
    morphG.style.display = "none";
  };
  const showMorph = (t: number) => {
    assertValidT(t);
    morphG.style.display = "";
    /**
     * If the entire thing plays for `extra + 1` seconds,
     * then main part will finish in 1 second, and the last
     * `extra` seconds will have a few numbers dancing in place, but nothing else.
     */
    const extra = 0.5;
    const scaled = t * morphAnimations.length * (extra + 1);
    morphAnimations.forEach((animation, index) => {
      const local = scaled - index;
      animation.currentTime = local;
    });
  };
  {
    const handwritingEffect = new HandwritingEffect(handwritingG);
    roughed.forEach((letter) => {
      const pieces = handwritingEffect.add({
        baseline: letter.baseline,
        x: letter.x,
        shape: letter.description.shape,
      });
      pieces.forEach(({ element }) => {
        element.classList.add(letter.colorName);
      });
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
  const splitter = makeTSplitter(2, 1.5);
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
  const timingFunction = constantAcceleration(3);
  const animationLoop = new AnimationLoop((time) => {
    if (!getT) {
      endTime = time + timeInSeconds * 1000;
      getT = makeLinear(time, 0, endTime, 1);
    }
    if (time > endTime) {
      animationLoop.cancel();
      (window as any).showFrame(1);
    } else {
      const linear = getT(time);
      const t = timingFunction(linear);
      timeRangeElement.value = t.toString();
      // TODO WTF put this somewhere better than (window as any)
      // Note that this was copied as is from show-text.ts
      (window as any).showFrame(t);
    }
  });
  previousAnimationLoop = animationLoop;
});

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
  return {
    source: "show-text-1.ts",
    devicePixelRatio: devicePixelRatio,
  };
}

(window as any).initScreenCapture = initScreenCapture;
