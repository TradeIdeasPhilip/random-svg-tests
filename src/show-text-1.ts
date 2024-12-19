import "./show-text-1.css";
import { AnimationLoop, getById } from "phil-lib/client-misc";
import { LinearFunction, makeLinear, parseIntX } from "phil-lib/misc";
import { Random } from "./utility";
import { TextLayout } from "./letters-more";
import { makeLineFont } from "./line-font";

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
const outputFormatter = Intl.NumberFormat(undefined, {
  useGrouping: true,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const errorFormatter = Intl.NumberFormat(undefined, {
  useGrouping: true,
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

function formatOutput(output: number, error: number) {
  const errorMessage = "#DIV/0!";
  const o = isFinite(output) ? outputFormatter.format(output) : errorMessage;
  const e = isFinite(error) ? errorFormatter.format(error) : errorMessage;
  return o + " ± " + e;
}

function setUpText() {
  const baseValues = [10001, 1001, 101, 11, 2, 1.1, 1.01, 1.001, 1.0001, 1];
  // need to set a font size based on the number of rows and the size of the svg.
  const values = baseValues.map((baseValue) => {
    const input = `(${inputFormatter.format(
      baseValue
    )} ± 1) ÷ (${inputFormatter.format(baseValue)} ± 1)`;
    //→ 1.00 ± 0.0000
    const maxIn = baseValue + 1;
    const minIn = baseValue - 1;
    const maxOut = maxIn / minIn;
    const minOut = minIn / maxIn;
    const out = (maxOut + minOut) / 2;
    const error = maxOut - out;
    const output = `${input} → ${formatOutput(out, error)}`;
    console.log(output);
    return { output, error };
  });

  let seed = randomSeedInput.value;
  if (!Random.seedIsValid(seed)) {
    seed = Random.newSeed();
    randomSeedInput.value = seed;
  }
  const random = Random.create(seed);

  handwritingG.innerHTML = "";
  morphG.innerHTML = "";
  const textLayout = new TextLayout();
  textLayout.font = makeLineFont(2.7);
  textLayout.lineHeight = 3.7;
  textLayout.restart();
  const original = textLayout.addText(values.map((i) => i.output).join("\n"));
  textLayout.displayText(original, handwritingG);
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
    } else {
      const t = getT(time);
      timeRangeElement.value = t.toString();
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
