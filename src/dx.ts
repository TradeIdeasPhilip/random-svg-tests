import "./style.css";
import "./dx.css";
import { getById } from "phil-lib/client-misc";
import { selectorQueryAll } from "./utility";
import { makeLinear } from "phil-lib/misc";

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

const colorStops = selectorQueryAll(
  "#radialGradient stop",
  SVGStopElement,
  2,
  2
);

const colorInfo = [
  { color: "red", offset: makeLinear(0, 1, 1, 0) },
  { color: "#00c000", offset: makeLinear(1, 0, 2, 1) },
];

/**
 *
 * @param newColor 0 for red, 1 for yellow, 2 for green.
 * Any value in between will work.
 */
function setColor(newColor: number) {
  const index = newColor < 1 ? 0 : 1;
  const { color, offset } = colorInfo[index];
  const offsetValue = offset(newColor);
  colorStops.forEach((colorStop) => {
    colorStop.offset.baseVal = offsetValue;
  });
  colorStops[0].setAttribute("stop-color", color);
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
  document.body.style.setProperty("--dx-size", `${newSize}px`);
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
  selectorQueryAll("rect[data-animate]", SVGRectElement).forEach(
    (rectElement) => {
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
    }
  );
}
