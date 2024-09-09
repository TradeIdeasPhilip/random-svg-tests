import { getById } from "phil-lib/client-misc";
import "./sky-writing.css";
//import { DescriptionOfLetter, Font, FontMetrics } from "./letters-base";
import { TextLayout } from "./letters-more";

const inputTextArea = getById("input", HTMLTextAreaElement);
const mainSvg = getById("main", SVGElement);

function updateSvg() {
  mainSvg.innerHTML = "";
  const textLayout = new TextLayout();
  textLayout.restart();
  const text = inputTextArea.value;
  const t = textLayout.addText(text);
  textLayout.displayText(t, mainSvg);
}

inputTextArea.addEventListener("input", () => {
  updateSvg();
});
