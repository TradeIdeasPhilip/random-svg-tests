import "./style.css";
import "./dx.css";
import { getById } from "phil-lib/client-misc";
import { selectorQueryAll } from "./utility";

const WIDTH = 16;
const HEIGHT = 9;
WIDTH * HEIGHT;

const mainSvg = getById("main", SVGSVGElement);
mainSvg;

const dxSizeInput = getById("dxSize", HTMLInputElement);

{
  function updateFromInput() {
    const newSize = dxSizeInput.valueAsNumber;
    setDxSize(newSize);
  }
  dxSizeInput.addEventListener("input", updateFromInput);
  updateFromInput();
}

const colorsBase: readonly number[] = [0, 1, 1, 2, 2, 3];
const colorStops = selectorQueryAll(
  "#mediumGradient stop",
  SVGStopElement,
  colorsBase.length,
  colorsBase.length
);

/**
 *
 * @param newColor 0 for red, 1 for yellow, 2 for green.
 * Any value in between will work.
 */
function setColor(newColor: number) {
  colorStops.forEach((colorStop, index) => {
    const base = colorsBase[index];
    const newPosition = Math.min(1, Math.max(0, base - newColor));
    colorStop.offset.baseVal = newPosition;
  });
}

const colorInput = getById("color", HTMLInputElement);

{
  function updateFromInput() {
    const newColor = colorInput.valueAsNumber;
    setColor(newColor);
  }
  colorInput.addEventListener("input", updateFromInput);
  updateFromInput();
}

function setDxSize(newSize: number) {
  selectorQueryAll(
    '[data-equation="1"] .big-change-stroke',
    SVGLineElement,
    2,
    2
  ).forEach((line) => {
    const from = line.x1.baseVal.value;
    const to = from + newSize;
    line.x2.baseVal.value = to;
  });
  selectorQueryAll(
    '[data-equation="2"] [data-animate]',
    SVGRectElement
  ).forEach((rectElement) => {
    let adjustWidth = false;
    let adjustHeight = false;
    switch (rectElement.dataset["animate"]) {
      case "horizontal": {
        adjustHeight = true;
        break;
      }
      case "vertical": {
        adjustWidth = true;
        break;
      }
      case "square": {
        adjustHeight = true;
        adjustWidth = true;
        break;
      }
    }
    if (!(adjustHeight || adjustWidth)) {
      throw new Error("wtf");
    }
    if (adjustWidth) {
      rectElement.width.baseVal.value = newSize;
    }
    if (adjustHeight) {
      const bottom =
        rectElement.height.baseVal.value + rectElement.y.baseVal.value;
      const top = bottom - newSize;
      rectElement.y.baseVal.value = top;
      rectElement.height.baseVal.value = newSize;
    }
  });
}
