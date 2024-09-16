import { getById } from "phil-lib/client-misc";
import "./sky-writing.css";
import { TextLayout } from "./letters-more";
import { describeFont } from "./letters-base";
import { assertFinite } from "./utility";

const inputTextArea = getById("input", HTMLTextAreaElement);
const mainSvg = getById("main", SVGElement);

{
  const textLayout = new TextLayout();
  const font = textLayout.font;
  const { normal } = describeFont(font);
  const span = getById("available", HTMLSpanElement);
  span.innerText = [...normal].sort().join(" ");
}

abstract class AnimationController {
  static #current: undefined | AnimationController; // (() => void);
  /**
   * Stop the current animation (if there is one) and clear the SVG.
   */
  static doCleanup() {
    this.#current?.doCleanup();
    this.#current = undefined;
    mainSvg.innerHTML = "";
  }
  /**
   * Does nothing if there is no current animation.
   */
  static restartCurrent() {
    const current = this.#current;
    if (current) {
      this.doCleanup();
      current.start();
    }
  }
  start() {
    AnimationController.doCleanup();
    this.startImpl();
    AnimationController.#current = this;
  }
  protected abstract startImpl(): void;
  protected doCleanup() {}
}

class Simple extends AnimationController {
  override startImpl(): void {
    const textLayout = new TextLayout();
    textLayout.restart();
    const text = inputTextArea.value;
    const t = textLayout.addText(text);
    textLayout.displayText(t, mainSvg);
    mainSvg.ownerSVGElement!.viewBox.baseVal.height =
      textLayout.baseline + textLayout.font.get("0")!.fontMetrics.bottom;
  }
  static start() {
    new this().start();
  }
}

const completionRatioInput = getById("completionRatio", HTMLInputElement);

class Handwriting extends AnimationController {
  protected override startImpl(): void {
    const textLayout = new TextLayout();
    textLayout.restart();
    const text = inputTextArea.value;
    const t = textLayout.addText(text);
    mainSvg.ownerSVGElement!.viewBox.baseVal.height =
      textLayout.baseline + textLayout.font.get("0")!.fontMetrics.bottom;
    const pathShape = TextLayout.join(t);
    const parentGElement = document.createElementNS("http://www.w3.org/2000/svg","g");
    parentGElement.classList.add("handwriting");
    mainSvg.appendChild(parentGElement);
    let soFar = 0;
    pathShape.splitOnMove().forEach(shape => {
      const element = document.createElementNS("http://www.w3.org/2000/svg","path");
      element.setAttribute("d", shape.rawPath);
      parentGElement.appendChild(element);
      const before = soFar;
      const length = element.getTotalLength();
      const after = before + length;
      soFar = after;
      element.style.setProperty("--offset",before.toString());
      element.style.setProperty("--length",length.toString());
    });
    const abortController = new AbortController();
    this.doCleanup = () => abortController.abort();
    // finish one time stuff. 
    const totalLength = soFar;
    const updatePosition = () => {
      const position =  completionRatioInput.valueAsNumber * totalLength;
      assertFinite(position);
      parentGElement.style.setProperty("--total-position",position.toString());
    };
    updatePosition();
    completionRatioInput.addEventListener("input", updatePosition, {
      signal: abortController.signal,
    });
    //    throw new Error("Method not implemented."); TODO finishme
  }
  static start() {
    new this().start();
  }
}

inputTextArea.addEventListener("input", () => {
  AnimationController.restartCurrent();
});

function selectAnimation() {
  const id = document.querySelector('input[name="type"]:checked')?.id;
  switch (id) {
    case "simpleType": {
      Simple.start();
      break;
    }
    case "handwritingType": {
      new Handwriting().start();
      break;
    }
    default: {
      throw new Error(`invalid id: ${id}`);
    }
  }
}

selectAnimation();
document.querySelectorAll('input[name="type"]').forEach((element) => {
  element.addEventListener("click", selectAnimation);
});
