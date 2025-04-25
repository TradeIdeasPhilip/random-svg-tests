import { getById } from "phil-lib/client-misc";
import "./style.css";
import "./parametric-path.css";
import { ParametricFunction, PathBuilder } from "./path-shape";
import { selectorQuery } from "./utility";

const goButton = getById("go", HTMLButtonElement);
const sourceTextArea = getById("source", HTMLTextAreaElement);
const errorDiv = getById("error", HTMLDivElement);
const resultDiv = getById("result", HTMLDivElement);
const filledSampleSvg = getById("filledSample", SVGSVGElement);
const filledSamplePath = selectorQuery("#filledSample path", SVGPathElement);

goButton.addEventListener("click", () => {
  const sourceText =
    '"use strict";\n' + sourceTextArea.value + "\nreturn { x, y };";
  let f: Function;
  try {
    f = new Function("t /* A value between 0 and 1, inclusive. */", sourceText);
  } catch (reason: unknown) {
    if (reason instanceof SyntaxError) {
      errorDiv.innerText = reason.message;
      return;
    } else {
      throw reason;
    }
  }

  console.log(f);
  const start = f(0);
  const d = PathBuilder.M(start.x, start.y).addParametricPath(
    f as ParametricFunction,
    10
  ).pathShape.rawPath;
  console.log(d);
  resultDiv.innerText = d;
  filledSamplePath.setAttribute("d", d);

  const bBox = filledSamplePath.getBBox();
  console.log(bBox, "TODO start here");
  filledSampleSvg;
});

// TODO
// * Create a path.
// * Display the path.
//   Try to set the svg's size to match the bbox
//   Special cases:  Vertical line, horizontal line, single point, empty, really big or small values?
//   Try making the viewbox of the svg match the bbox of the path, then adding padding with css.
// * Save the path as an SVG file.
// * Samples
//   Animated dots crawling along the path.
//   The line starts as nothing, grows from one end, when it hits the other end it starts shrinking.
//   Blowing in the wind animation?
//   A tau "creature" following the path, with and without rotations.
// * Display the path length.
//   And the bbox size.
// * Access to tsplitter and related tools through a parameter to the function.
// * Help!
// * Display the path, which might be long and ugly.
