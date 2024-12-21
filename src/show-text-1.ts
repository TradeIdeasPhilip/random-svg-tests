import "./show-text-1.css";
import { AnimationLoop, getById } from "phil-lib/client-misc";
import { LinearFunction, makeLinear, parseIntX } from "phil-lib/misc";
import { assertValidT, makeTSplitter, Random } from "./utility";
import { LetterLayoutInfo, TextLayout } from "./letters-more";
import { makeLineFont } from "./line-font";
import { Font, FontMetrics } from "./letters-base";
import { makeRoughShape } from "./rough-lib";

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

const XL_ERROR_MESSAGE = "#DIV/0!";

type ColorName = "blue" | "gold" | "white";
type ColorfulLayoutInfo = LetterLayoutInfo & { readonly colorName: ColorName };

function setUpText() {
  const baseValues = [10001, 1001, 101, 11, 2, 1.1, 1.01, 1.001, 1.0001, 1];
  // need to set a font size based on the number of rows and the size of the svg.
  const values = baseValues.map((baseValue) => {
    const baseValueString = inputFormatter.format(baseValue);
    const maxIn = baseValue + 1;
    const minIn = baseValue - 1;
    const maxOut = maxIn / minIn;
    const minOut = minIn / maxIn;
    const mean = (maxOut + minOut) / 2;
    const error = maxOut - mean;
    const taggedUnion =
      isFinite(mean) && isFinite(error)
        ? {
            finite: true as const,
            meanString: meanFormatter.format(mean),
            errorString: errorFormatter.format(error),
          }
        : { finite: false as const };
    return { baseValue, baseValueString, mean, error, ...taggedUnion };
  });

  let seed = randomSeedInput.value;
  if (!Random.seedIsValid(seed)) {
    seed = Random.newSeed();
    randomSeedInput.value = seed;
  }
  const random = Random.create(seed);
  random; // Coming soon: "rough" text.

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
  const original = values.map(
    (
      row
    ): typeof row & {
      inputLayoutInfo: ReadonlyTextSegment;
      messageLayoutInfo?: ReadonlyTextSegment;
      meanLayoutInfo?: ReadonlyTextSegment;
      errorLayoutInfo?: ReadonlyTextSegment;
    } => {
      t.addAndTag("(" + row.baseValueString, "blue");
      t.addAndTag(" ± 1", "white");
      t.addAndTag(")", "blue");
      const inputLayoutInfo = t.extract();
      if (row.finite) {
        const meanLayoutInfo = t.single(row.meanString, "blue");
        const errorLayoutInfo = t.single(" ± " + row.errorString, "white");
        return { ...row, inputLayoutInfo, meanLayoutInfo, errorLayoutInfo };
      } else {
        const messageLayoutInfo = t.single(XL_ERROR_MESSAGE, "gold");
        return { ...row, inputLayoutInfo, messageLayoutInfo };
      }
    }
  );

  let left = 5;
  const maxInputWidth = Math.max(
    ...original.map((row) => row.inputLayoutInfo.width)
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
    ...original.flatMap((row) =>
      row.meanLayoutInfo ? [row.meanLayoutInfo.width] : []
    )
  );
  const outputLeft = left;
  left += maxMeanWidth;
  const meanRight = left;
  const maxErrorWidth = Math.max(
    ...original.flatMap((row) =>
      row.errorLayoutInfo ? [row.errorLayoutInfo.width] : []
    )
  );
  left += maxErrorWidth;
  const errorRight = left;
  const outputRight = left;

  type Group = "base" | "mean" | "error";
  const inPosition = original.map((row, rowIndex) => {
    type InputLetter = ReadonlyTextSegment["letters"][number];
    type OutputLetter = InputLetter & { group: Group };
    const allLetters: OutputLetter[] = [];
    const baseline = (rowIndex + 1) * 4.8;
    function addAndTransform(Δx: number, group: Group, letters: InputLetter[]) {
      letters.forEach((letter) => {
        allLetters.push({ ...letter, x: letter.x + Δx, baseline, group });
      });
    }
    const inputOffset1 = inputCenter1 - row.inputLayoutInfo.width / 2;
    addAndTransform(inputOffset1, "base", row.inputLayoutInfo.letters);
    addAndTransform(divisionLeft, "base", division.letters);
    const inputOffset2 = inputOffset1 - inputCenter1 + inputCenter2;
    addAndTransform(inputOffset2, "base", row.inputLayoutInfo.letters);
    addAndTransform(arrowLeft, "base", arrow.letters);
    if (row.messageLayoutInfo) {
      const availableWidth = outputRight - outputLeft;
      const extraSpace = availableWidth - row.messageLayoutInfo.width;
      const left = outputLeft + extraSpace / 2;
      addAndTransform(left, "base", row.messageLayoutInfo.letters);
    } else {
      const mean = row.meanLayoutInfo!;
      addAndTransform(meanRight - mean.width, "mean", mean.letters);
      const error = row.errorLayoutInfo!;
      addAndTransform(errorRight - error.width, "error", error.letters);
    }
    return allLetters;
  });

  const roughed = inPosition.flat().map((letter) => {
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
    //    letter.element.style.stroke = letter.color;
    letter.element.classList.add(letter.colorName);
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
        //element.style.stroke = letter.color;
        element.classList.add(letter.colorName);
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

  //const visible = TextLayout.displayText(inPosition.flat(), handwritingG);
  //visible.forEach((letter) => letter.element.classList.add(letter.colorName));
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
      (window as any).showFrame(1);
    } else {
      const t = getT(time);
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
