import { getById } from "phil-lib/client-misc";
import "./sky-writing.css";
//import { DescriptionOfLetter, Font, FontMetrics } from "./letters-base";
import { TextLayout } from "./letters-more";
import { describeFont } from "./letters-base";

const inputTextArea = getById("input", HTMLTextAreaElement);
const mainSvg = getById("main", SVGElement);

{
  const textLayout = new TextLayout();
  const font = textLayout.font;
  const { normal } = describeFont(font);
  const span = getById("available", HTMLSpanElement);
  span.innerText = [...normal].sort().join(" ");
}

function updateSvg() {
  mainSvg.innerHTML = "";
  const textLayout = new TextLayout();
  textLayout.restart();
  const text = inputTextArea.value;
  const t = textLayout.addText(text);
  textLayout.displayText(t, mainSvg);
  mainSvg.ownerSVGElement!.viewBox.baseVal.height =
    textLayout.baseline + textLayout.font.get("0")!.fontMetrics.bottom;
}

inputTextArea.addEventListener("input", () => {
  updateSvg();
});
