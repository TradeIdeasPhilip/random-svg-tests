import "./spheres-starfield.css";

import { getById } from "phil-lib/client-misc";
import { AnimationLoop, phi, polarToRectangular } from "./utility";
import { makeLinear } from "phil-lib/misc";

const svg = getById("main", SVGElement);

function ratio(objectToScreen: number, viewerToScreen: number): number {
  // This is the heart of the algorithm.
  // The rest all depends on this.
  return viewerToScreen / (objectToScreen + viewerToScreen);
}

const allColors: readonly string[] = [
  "red",
  "orange",
  "yellow",
  "green",
  "indigo",
  "violet",
  "pink",
  "darkblue",
  "black",
  "gray",
  "brown",
  "chartreuse",
  "aqua",
  "chocolate",
  "turquoise",
  "cadetblue",
  "coral",
  "darkgoldenrod",
  "darkgray",
  "fuchsia",
  "darkorchid",
  "#FF8080",
  "#80FF80",
  "#8080FF",
  "#FFFF80",
  "#FF80FF",
  "#80FFFF",
  "#C84",
  "#C48",
  "#8C4",
  "#84C",
  "#48C",
  "#4C8",
  "#046ABB",
];

let colors: string[] = [];

function animateSpiral() {
  const getColor = (n: number) => {
    return colors[n % colors.length];
  };
  function cleanUp() {
    svg.innerHTML = "";
  }
  const setPosition = (
    elements: readonly SVGCircleElement[],
    n: number,
    z: number
  ): void => {
    const perspectiveRatio = ratio(z, 1);
    const angleInRadians = (n / phi) * 2 * Math.PI;
    const tubeBaseRadius = 1;
    const tubeRadius = tubeBaseRadius * perspectiveRatio;
    const center = polarToRectangular(tubeRadius, angleInRadians);
    const sphereBaseRadius = 0.1;
    const sphereRadius = sphereBaseRadius * perspectiveRatio;
    elements.forEach((element) => {
      element.cx.baseVal.value = center.x;
      element.cy.baseVal.value = center.y;
      element.r.baseVal.value = sphereRadius;
    });
  };
  /**
   * Units:  circles created / millisecond
   */
  const frequency = 5 / 1000;
  /**
   * How many balls to display at once.
   * This does not have to be an integer.
   */
  const visibleAtOnce = 400;
  /**
   * When did this demo begin?  This will be set to the
   * timestamp of our first animation frame then it will
   * never change again.
   */
  let startTime: DOMHighResTimeStamp | undefined;
  const animationLoop = new AnimationLoop((time: DOMHighResTimeStamp) => {
    cleanUp();
    startTime ??= time;
    /**
     * Total time elapsed since the demo started.
     */
    const elapsed = time - startTime;
    const minN = elapsed * frequency;
    const maxN = minN + visibleAtOnce;
    const maxBallShouldBeVisible = Math.floor(maxN);
    const minBallShouldBeVisible = Math.ceil(minN);
    const getZ = makeLinear(minN, 0, maxN, visibleAtOnce / 25);
    for (let n = maxBallShouldBeVisible; n >= minBallShouldBeVisible; n--) {
      const colorElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      colorElement.classList.add("simple");
      svg.appendChild(colorElement);
      const shapeElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      shapeElement.classList.add("sphere");
      svg.appendChild(shapeElement);
      colorElement.style.fill = getColor(n);
      setPosition([colorElement, shapeElement], n, getZ(n));
    }
  });
  return animationLoop.cancel.bind(animationLoop);
}

animateSpiral();

const colorChoices: ReadonlyArray<number> = [1, 2, 3, 7, 8, 13, 17, 21, 34];

const controlsDiv = getById("controls", HTMLDivElement);

const allButtonInfo = colorChoices.map((colorCount) => {
  const element = document.createElement("button");
  controlsDiv.appendChild(element);
  element.innerText = colorCount.toString();
  return { element, colorCount };
});

function selectButton(n: number) {
  allButtonInfo.forEach((buttonInfo, index) => {
    if (n == index) {
      buttonInfo.element.classList.add("selected");
      const available = [...allColors];
      colors.length = 0;
      while (colors.length < buttonInfo.colorCount) {
        const [taken] = available.splice(
          (Math.random() * available.length) | 0,
          1
        );
        colors.push(taken);
      }
    } else {
      buttonInfo.element.classList.remove("selected");
    }
  });
}
selectButton(2);

allButtonInfo.forEach((buttonInfo, index) => {
  buttonInfo.element.addEventListener("click", () => selectButton(index));
});
