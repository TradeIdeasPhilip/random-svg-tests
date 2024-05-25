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
 * Start with something that would look good drawn in normal 2d.
 * This will adjust the size and position of the item to send it into the background.
 *
 * This does __not__ adjust the z-order.
 * That should be handled elsewhere.
 * @param element The item to adjust.  Typically that's a `<g>` but it could be almost anything.
 * @param ratio Typically the result of `ratio()`
 */
function addPerspective(element: SVGElement | HTMLElement, ratio: number) {
  element.style.transform = `scale(${ratio})`;
}

/**
 * If we draw a sphere touching the screen, this will be its radius.
 */
const sphereBaseRadius = 0.1;

/**
 * Draw something like there was no 3d and this item was in the foreground.
 *
 * Currently this draws a single sphere on each call.
 * But this is just a placeholder.
 * You can draw any shape you want here.
 * @param color The base color, before adding the shading.
 * @param x Where it should appear when z = 0, i.e. drawing right on the screen, i.e drawing without any 3d.
 * @param y Where it should appear when z = 0, i.e. drawing right on the screen, i.e drawing without any 3d.
 * @returns A `<g>` containing the sphere.
 */
function createSimpleSphere(color: string, x: number, y: number): SVGElement {
  const groupElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
  );
  svg.appendChild(groupElement);
  const colorElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  colorElement.classList.add("simple");
  groupElement.appendChild(colorElement);
  const shapeElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  shapeElement.classList.add("sphere");
  groupElement.appendChild(shapeElement);
  colorElement.style.fill = color;
  [colorElement, shapeElement].forEach((element) => {
    element.r.baseVal.value = sphereBaseRadius;
    element.cx.baseVal.value = x;
    element.cy.baseVal.value = y;
  });
  return groupElement;
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

/**
 * Use this to control the perspective.  This is a function so it can
 * be animated.  The default function returns 1, a good default.  Replace
 * this with a different function to change the perspective.
 * @param _time The current animation time and/or `performance.now()`
 * @returns A value appropriate for the `viewerToScreen` parameter to
 * `ratio()`
 */
let timeToUserPosition = (_time: DOMHighResTimeStamp) => 1;

/**
 * This is the main() program.
 */
function animateSpiral() {
  /**
   *
   * @param n 0 refers to the first ball, the one that is closest to the screen when we first start.
   * This ball will be the first ball to disappear off the screen as the animation starts.  Depending
   * on your perspective and your window's aspect ratio, that ball might not actually appear on the
   * screen at all.  1 is the second ball, etc.  There is no end.
   * @returns
   */
  const getColor = (n: number) => {
    return colors[n % colors.length];
  };
  /**
   * Remove all of the balls from the screen.
   * Each frame will remove all of the old objects and start fresh.
   */
  function cleanUp() {
    svg.innerHTML = "";
  }
  /**
   *
   * @param elements A single ball is implemented by two SVG elements.
   * They will need identical sizes and positions.
   * @param n 0 for the first ball in the series, which might nor might not be currently visible.
   * @param z How far behind the screen to draw the ball.
   * @param userToScreen How far in front of the screen the user is.
   */
  const getFlatPosition = (n: number): { x: number; y: number } => {
    /**
     * Each sphere is located on the surface on a tube.
     * `angleInRadians` and `z` are enough to specify a position on the tube.
     */
    const angleInRadians = (n / phi) * 2 * Math.PI;
    /**
     * If the screen is a square it should fit perfectly within the tube.
     * I.e. if a ball is heading for a corner of the screen, we should stop
     * drawing the ball just after it goes off screen.  So the user
     * sees balls flying off screen, never just disappearing.
     */
    const tubeRadius = Math.SQRT1_2 + sphereBaseRadius;
    const position2d = polarToRectangular(tubeRadius, angleInRadians);
    return position2d;
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
    /**
     * What's the lowest numbered ball that we need to display.
     * This is __not__ an integer.  The balls move smoothly and continuously.
     */
    const minN = elapsed * frequency;
    /**
     * What's the highest numbered ball that we need to display.
     * This is __not__ an integer.  The balls move smoothly and continuously.
     */
    const maxN = minN + visibleAtOnce;
    /**
     * What's the lowest numbered ball that we need to display.
     * This __is__ an integer.  This refers to a specific object.
     */
    const maxBallShouldBeVisible = Math.floor(maxN);
    /**
     * What's the lowest numbered ball that we need to display.
     * This __is__ an integer.  This refers to a specific object.
     */
    const minBallShouldBeVisible = Math.ceil(minN);
    /**
     * This function maps between the ball number and the ball's z position.
     */
    const getZ = makeLinear(minN, 0, maxN, visibleAtOnce / 25);
    /**
     * Perspective (camera position)
     */
    const userToScreen = timeToUserPosition(time);
    for (let n = maxBallShouldBeVisible; n >= minBallShouldBeVisible; n--) {
      /**
       * How much to adjust an item's size and position to make the scene appear 3d.
       *
       * 1.0 means to keep the "base" or "nominal" size.
       * 0.5 means to draw the item half as tall, half as wide, and half as far
       * from the vanishing point.
       */
      const perspectiveRatio = ratio(getZ(n), userToScreen);
      const color = getColor(n);
      const { x, y } = getFlatPosition(n);
      const element = createSimpleSphere(color, x, y);
      addPerspective(element, perspectiveRatio);
    }
  });
  /**
   * Type animationLoop.cancel() at the console to stop the animation.
   * This will leave the current spheres on the screen.
   */
  (window as any).animationLoop = animationLoop;
}

animateSpiral();

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

/**
 *
 * @param newValue The new userToScreen (a.k.a. perspective) value.
 * This will start an animation which will smoothly move between the
 * current value and this value.
 */
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

/**
 * Select a new set of colors for the display.
 * These are selected and ordered randomly randomly with different results every time.
 * @param colorCount The number colors to use.
 */
function showNColors(colorCount: number) {
  const available = [...allColors];
  colors.length = 0;
  while (colors.length < colorCount) {
    const [taken] = available.splice((Math.random() * available.length) | 0, 1);
    colors.push(taken);
  }
}

/**
 * If you click on a button it will call this function.
 * You can call this at other times,
 * like setting the default before the user hits any button.
 * @param n Which button.
 */
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
/**
 * Start with the second button selected.  This is 13 colors, which is one
 * of the better views.  Also, this option doesn't try to change the perspective.
 * It looked weird to me when the visual tried to zoom in or out as soon as
 * the page was displayed.  I could have disabled that just for the initial
 * setting, but it seemed like unnecessary work.
 */
selectButton(1);

allButtonInfo.forEach((buttonInfo, index) => {
  buttonInfo.element.addEventListener("click", () => selectButton(index));
});

/**
 * Share these things with the console.
 *
 * These are only for debugging.
 */
const GLOBAL = window as any;
GLOBAL.showNColors = showNColors;
GLOBAL.setUserToScreen = setUserToScreen;
