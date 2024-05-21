import "./spheres-starfield.css";

import { getById } from "phil-lib/client-misc";
import { AnimationLoop, phi, polarToRectangular } from "./utility";
import { makeBoundedLinear, makeLinear } from "phil-lib/misc";

const svg = getById("main", SVGElement);

/**
 * We want to __draw__ an object __on__ the screen.
 * We want to __pretend__ that the object is __behind__ the screen.
 * This function tells you how to adjust the object on the screen to make it look like it's further away.
 * @param objectToScreen How far the object is behind the screen.
 *
 * 0 means that the pretend object is touching the screen, so no adjustment is necessary.
 * Larger numbers mean that the pretend object is further away, and will need to be scaled down more to look right.
 * Negative numbers are invalid.
 * A negative number would mean that the pretend object is on the wrong side of the screen!
 *
 * I usually position some objects right at z=0, so I know objectToScreen will be 0.
 * That way I know exactly how some of my objects will be laid out on the screen.
 * Then I use the same scale for x, y, and z because that's convenient.
 * @param viewerToScreen How far the simulated viewer is from the screen.
 * The number must be positive.
 * 0 would mean that the viewer's eye is pressed against the monitor
 * and negative numbers would mean that the viewer is on the wrong side of the screen.
 *
 * Smaller numbers make the perspective more obvious.
 * I usually start with 1 for this value.
 * If I don't like the result, I tweak this number.
 *
 * `objectToScreen` and `viewerToScreen` use the same units as each other.
 * @returns A ratio describing how to draw the object.
 * 1 means to ignore the z and draw everything in its nominal size and position.
 * Smaller numbers mean to scale the result down.
 * I.e. `svgRadius = pretend3DRadius * ratio`.
 * This result should never be negative.
 */
function ratio(objectToScreen: number, viewerToScreen: number): number {
  /**
   * This is a common and useful __approximation__.
   */
  const viewerToObject = objectToScreen + viewerToScreen;
  // This is the heart of the algorithm.
  // The rest all depends on this.
  return viewerToScreen / viewerToObject;
}

/**
 * The balls' colors are randomly selected from this list.
 */
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

/**
 * These are the colors that will be used for drawing the spheres.
 *
 * Each frame we redraw everything from scratch.
 * All you hve to do is change the contents of this list.
 */
const colors: string[] = [];

let timeToUserPosition = (_time: DOMHighResTimeStamp) => 1;

/**
 * This is the main() program.
 */
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
    z: number,
    userToScreen: number
  ): void => {
    const perspectiveRatio = ratio(z, userToScreen);
    const sphereBaseRadius = 0.1;
    const sphereRadius = sphereBaseRadius * perspectiveRatio;
    const angleInRadians = (n / phi) * 2 * Math.PI;
    const tubeBaseRadius = Math.SQRT1_2 + sphereBaseRadius;
    const tubeRadius = tubeBaseRadius * perspectiveRatio;
    const center = polarToRectangular(tubeRadius, angleInRadians);
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
  new AnimationLoop((time: DOMHighResTimeStamp) => {
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
    const userToScreen = timeToUserPosition(time);
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
      setPosition([colorElement, shapeElement], n, getZ(n), userToScreen);
    }
  });
}

animateSpiral();

//5,11,55????? zoom to 10
//2,4,8 -- zoom in, 1/5
// 17,34 (2) -- zoom to 2.5
// 3,7,21 -- zoom = 1
// 5 works at 1/5 ❌
//13?

type ButtonAction = "blank" | { colorCount: number; perspective?: number };
const colorChoices: ReadonlyArray<ButtonAction> = [
  "blank",
  { colorCount: 1 },
  { colorCount: 13 },
  "blank",
  { colorCount: 2, perspective: 1 / 7 },
  { colorCount: 4, perspective: 1 / 7 },
  { colorCount: 8, perspective: 1 / 7 },
  "blank",
  { colorCount: 2, perspective: 2.5 },
  { colorCount: 17, perspective: 2.5 },
  { colorCount: 34, perspective: 2.5 },
  "blank",
  { colorCount: 3, perspective: 1 },
  { colorCount: 7, perspective: 1 },
  { colorCount: 21, perspective: 1 },
  "blank",
  { colorCount: 5, perspective: 10 },
  { colorCount: 11, perspective: 10 },
  { colorCount: 55, perspective: 10 },
];

const controlsDiv = getById("controls", HTMLDivElement);

const allButtonInfo = colorChoices.flatMap((buttonAction) => {
  if (buttonAction == "blank") {
    const element = document.createElement("div");
    element.classList.add("spacer");
    element.appendChild(document.createComment("spacer"));
    controlsDiv.appendChild(element);
    return [];
  } else {
    const element = document.createElement("button");
    controlsDiv.appendChild(element);
    element.innerText = buttonAction.colorCount.toString();
    return { element, ...buttonAction };
  }
});

function setUserToScreen(newValue: number) {
  const now = performance.now();
  const currentValue = timeToUserPosition(now);
  const duration = 3000;
  timeToUserPosition = makeBoundedLinear(
    now,
    currentValue,
    now + duration,
    newValue
  );
}

function showNColors(colorCount: number) {
  const available = [...allColors];
  colors.length = 0;
  while (colors.length < colorCount) {
    const [taken] = available.splice((Math.random() * available.length) | 0, 1);
    colors.push(taken);
  }
}

function selectButton(n: number) {
  allButtonInfo.forEach((buttonInfo, index) => {
    if (n == index) {
      buttonInfo.element.classList.add("selected");
      showNColors(buttonInfo.colorCount);
      if (buttonInfo.perspective !== undefined) {
        setUserToScreen(buttonInfo.perspective);
      }
    } else {
      buttonInfo.element.classList.remove("selected");
    }
  });
}
selectButton(1);

allButtonInfo.forEach((buttonInfo, index) => {
  buttonInfo.element.addEventListener("click", () => selectButton(index));
});

const GLOBAL = window as any;
GLOBAL.showNColors = showNColors;
GLOBAL.setUserToScreen = setUserToScreen;
