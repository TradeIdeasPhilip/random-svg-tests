import { getById } from "phil-lib/client-misc";
import "./style.css";
import "./parametric-path.css";
import { ParametricFunction, PathBuilder } from "./path-shape";
import { selectorQueryAll } from "./utility";
import { assertClass } from "phil-lib/misc";

const goButton = getById("go", HTMLButtonElement);
const sourceTextArea = getById("source", HTMLTextAreaElement);
const errorDiv = getById("error", HTMLDivElement);
const resultElement = getById("result", HTMLElement);
//const filledSampleSvg = getById("filledSample", SVGSVGElement);
//const filledSamplePath = selectorQuery("#filledSample path", SVGPathElement);

const samples = selectorQueryAll("[data-sample]", SVGSVGElement).map((svg) => {
  const path = assertClass(svg.firstElementChild, SVGPathElement);
  return { svg, path };
});

const rangeInputs = selectorQueryAll(
  "input[data-name]",
  HTMLInputElement,
  3,
  3
);

const support = {
  get a() {
    return rangeInputs[0].valueAsNumber;
  },
  get b() {
    return rangeInputs[1].valueAsNumber;
  },
  get c() {
    return rangeInputs[2].valueAsNumber;
  },
};

rangeInputs.forEach((inputElement) =>
  inputElement.addEventListener("input", () => goButton.click())
);

{
  const doItNow = () => {
    const sourceText =
      '"use strict";\n' + sourceTextArea.value + "\nreturn { x, y };";
    let f: Function;
    try {
      f = new Function(
        "t /* A value between 0 and 1, inclusive. */",
        "support",
        sourceText
      );
    } catch (reason: unknown) {
      if (reason instanceof SyntaxError) {
        errorDiv.innerText = reason.message;
        return;
      } else {
        throw reason;
      }
    }
    const f1: ParametricFunction = (t: number) => {
      return f(t, support);
    };

    const start = f1(0);
    const d = PathBuilder.M(start.x, start.y).addParametricPath(f1, 10)
      .pathShape.rawPath;
    samples.forEach(({ path }) => path.setAttribute("d", d));
    resultElement.innerText = samples[0].path.outerHTML;

    samples.forEach(({ svg, path }) => {
      const bBox = path.getBBox();
      const to = svg.viewBox.baseVal;
      to.x = bBox.x;
      to.y = bBox.y;
      to.width = bBox.width;
      to.height = bBox.height;
      svg.style.setProperty(
        "--recommended-width",
        (Math.max(to.width, to.height) / 100).toString()
      );
    });
  };
  let scheduled = false;
  const doItSoon = () => {
    if (!scheduled) {
      requestAnimationFrame(() => {
        scheduled = false;
        doItNow();
      });
    }
  };
  goButton.addEventListener("click", doItSoon);
}

// TODO
// * Display the path.
//   Try to set the svg's size to match the bBox
//   Special cases:  Vertical line, horizontal line, single point, empty, really big or small values?
//   Try making the viewBox of the svg match the bBox of the path, then adding padding with css.
// * Save the path as an SVG file.
// * Samples
//   Animated dots crawling along the path.
//   The line starts as nothing, grows from one end, when it hits the other end it starts shrinking.
//   Blowing in the wind animation?
//   A tau "creature" following the path, with and without rotations.
// * Sample code.
//   Maybe a button that says "random sample"!! 🙂
// * Display the path length.
//   And the bBox size.
// * Access to TSplitter and related tools through a parameter to the function.
// * Help!
// * Add error handler for the function.
//   There is an error handler for syntax errors.
//   But runtime errors are raised elsewhere.
