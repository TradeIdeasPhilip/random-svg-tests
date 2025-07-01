import "./handwriting-effect.css";
import { PathShape } from "./path-shape";

export class HandwritingEffect {
  soFar = 0.01;
  constructor(public readonly parent: SVGGElement) {
    parent.classList.add("handwriting-effect-parent");
  }
  add(letter: { x: number; baseline: number; shape: PathShape }) {
    const segments = letter.shape.splitOnMove().map((shape) => {
      const element = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      element.setAttribute("d", shape.rawPath);
      element.style.transform = `translate(${letter.x}px, ${letter.baseline}px)`;
      this.parent.appendChild(element);
      const before = this.soFar;
      const length = element.getTotalLength();
      const after = before + length;
      this.soFar = after;
      element.style.setProperty("--offset", before.toString());
      element.style.setProperty("--length", length.toString());
      return { element, before, after };
    });
    this.updateTotalLength();
    return segments;
  }
  updateTotalLength() {
    const totalLength = this.soFar;
    this.parent.style.setProperty("--total-length", totalLength.toString());
  }
  /**
   *
   * @param t 0 for nothing drawn.  1 for everything drawn.
   */
  setProgress(t: number) {
    this.parent.style.setProperty("--t", t.toString());
  }
}
