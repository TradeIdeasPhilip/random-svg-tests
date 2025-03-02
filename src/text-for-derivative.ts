import { makeLinear } from "phil-lib/misc";
import "./text-for-derivative.css";
import { GetFrameNumber, selectorQueryAll } from "./utility";
import { PathBuilder } from "./path-shape";
import { getById } from "phil-lib/client-misc";

const getFrameNumber = new GetFrameNumber();

const textGroups = [
  selectorQueryAll("#main-text > g.top > text", SVGTextElement, 3, 3),
  selectorQueryAll("#main-text > g.left > text", SVGTextElement, 3, 3),
  selectorQueryAll("#main-text > g.right > text", SVGTextElement, 3, 3),
];

const T_videoStart = getFrameNumber.fromMSF(0, 8, 30);
const T_finishDisplayingText = getFrameNumber.fromMSF(0, 18, 30);
const T_changeTextColor = getFrameNumber.fromMSF(0, 20, 14);
const T_videoEnd = getFrameNumber.fromMSF(0, 25, 15);

const duration = T_videoEnd - T_videoStart;

const frameNumberToRatio = makeLinear(T_videoStart, 0, T_videoEnd, 1);

function animateTextClipping() {
  const startFrame = T_videoStart;
  const endFrame = T_finishDisplayingText;
  const totalFrameCount = endFrame - startFrame;
  const spareFrameCount = totalFrameCount * 0.5;
  const workingFrameCount = totalFrameCount - spareFrameCount;
  const animations = new Array<Animation>();
  textGroups.forEach((group, index) => {
    const groupOffset = (index * spareFrameCount) / textGroups.length;
    const groupStartFrame = startFrame + groupOffset;
    const groupEndFrame = groupStartFrame + workingFrameCount;
    const elementFrameCount = (groupEndFrame - groupStartFrame) / group.length;
    group.forEach((textElement, index) => {
      const elementStartFrame = groupStartFrame + index * elementFrameCount;
      const elementEndFrame = elementStartFrame + elementFrameCount;
      const updateClipShape = () => {
        const { width, height } = textElement.getBBox();
        const extraWidth = height * 2;
        const clip0 = PathBuilder.M(-extraWidth, 0)
          .L(0, 0)
          .Q_HV(-extraWidth, height)
          .L(-extraWidth, height).pathShape.cssPath;
        const clip1 = PathBuilder.M(-extraWidth, 0)
          .L(width + extraWidth, 0)
          .Q_HV(width, height)
          .L(-extraWidth, height).pathShape.cssPath;
        textElement.style.setProperty("--clip0", clip0);
        textElement.style.setProperty("--clip1", clip1);
      };
      updateClipShape();
      // This resizeObserver is required!
      // Most of the time it's not required when I view this page in my browser.  I.e. everything works in testing.
      // But it's often required when I render the video.  I.e. it fails in production.
      // Just copy this every time.
      const resizeObserver = new ResizeObserver((entries) => {
        console.info(entries);
        if (entries.length > 0) {
          updateClipShape();
        }
      });
      resizeObserver.observe(textElement);
      const clipStart = "var(--clip0)";
      const clipEnd = "var(--clip1)";
      const animation = textElement.animate(
        [
          {
            offset: 0,
            clipPath: clipStart,
          },
          {
            offset: frameNumberToRatio(elementStartFrame),
            easing: "linear",
            clipPath: clipStart,
          },
          {
            offset: frameNumberToRatio(elementEndFrame),
            clipPath: clipEnd,
          },
          {
            offset: 1,
            clipPath: clipEnd,
          },
        ],
        { duration, fill: "both" }
      );
      animations.push(animation);
    });
  });
  return animations;
}

const goodEnoughElement = getById("good-enough", SVGTSpanElement);

function animateTextColor() {
  const offset = frameNumberToRatio(T_changeTextColor);
  const animation = goodEnoughElement.animate(
    [
      { offset: 0, fill: "white" },
      { offset, fill: "white" },
      { offset, fill: "red" },
      { offset: 1, fill: "red" },
    ],
    { duration, fill: "both" }
  );
  return animation;
}

/**
 * Control the animations from here.
 *
 * When this page first loads, all of these animations start running from the beginning at normal speed.
 * (Hit refresh to repeat the animations from the beginning.)
 *
 * The `offset` values in the animation keyframes all go from 0 to 1.
 * That can't be changed.
 *
 * Each animation's  `currentTime` is measured in frames.
 * Set `currentTime` to 0 to show the first frame that this script is responsible for.
 * Set `currentTime` to _1_ to show the _second_ frame that this script is responsible for.
 */
const animations = animateTextClipping();
animations.push(animateTextColor());
animations.forEach(
  (animation) =>
    (animation.playbackRate = getFrameNumber.framesPerSecond / 1000)
);

const GLOBAL = window as any;
GLOBAL.ANIMATIONS = animations;

function initScreenCapture(script: unknown) {
  document
    .querySelectorAll("[data-hideBeforeScreenshot]")
    .forEach((element) => {
      if (!(element instanceof SVGElement || element instanceof HTMLElement)) {
        throw new Error("wtf");
      }
      element.style.display = "none";
    });
  animations.forEach((animation) => animation.pause());
  return {
    source: "text-for-derivative.ts",
    script,
    firstFrame: T_videoStart,
    lastFrame: T_videoEnd,
  };
}

GLOBAL.initScreenCapture = initScreenCapture;

function showFrame(frameNumber: number) {
  const currentTime = frameNumber - T_videoStart;
  animations.forEach((animation) => (animation.currentTime = currentTime));
}

GLOBAL.showFrame = showFrame;

/**
 * Next:
 *
 * 0:25:16 - 1:25:00 for the whole list:
 * 1) Start from the intro demo
 * 2) initially two fairly small circles for the inputs.
 * 3) The circles are exactly the same size as the line, and drawn on top.
 * 4) At some point the circles get bigger and get fuzzy edges.
 * 5) The line is replaced my multiple lines spread out to show multiple possible lines that go through both circles.
 * 6) Use repeatable randomness to pick points from anywhere in the possible range.
 * 7) The line can be blurry or partially transparent.
 * 8) The closer the line was to the center of each point, the sharper the line will be.
 * 9) The line's blurriness will be based on the worst of the two points.
 * 10) The line will always be at least somewhat visible, even if the line crossed though the most transparent edge of the point.
 * 11) Get rid of the % precision issues thing.  (I don't want to try to sync that with the rest of this demo.)
 * 12) Eventually move the points close together and slowly move from almost touching to largely overlapping.
 *
 * 0:33:30 - But in the real world
 * 1:11:00 - 1:20:15 If you try to push the limit, it is fuzzy.
 * 1:25:00 - 1:43:30 If you really want to push the limits you need a better approach. ... more smarter math.
 * 1:43:30 - My solution was so simple.
 * 2:04:00 - 2:23:29 Let's take a closer look. ...  ... a second sample twice as far away.
 * 2:25:09-ish and I wanted to know the value at 0
 * 2:37:36 -  so all I did was extrapolate
 * 2:47:00 - so, why does this work so well?  ... was linear now quadratic
 * 3:09:11 - imagine a taylor expansion
 *
 * I need to match the new video content to the voiceover found here:
 * https://www.youtube.com/watch?v=qzbga-c3mk0
 * "better derivative, longer voiceover"
 *
 */
