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
   * In between means to interpolate.
   * Values outside of this range should be avoided.
   */
  setProgress(t: number) {
    this.parent.style.setProperty("--t", t.toString());
  }
  /**
   * This is similar to setProgress().
   * By specifying progress in length,
   * we can write short things quickly,
   * and take more time to write longer things,
   * like in the real world.
   * @param length 0 means hide everything.
   * Positive values mean to show more.
   * This says how much length, in SVG user units, to show.
   * See `this.soFar` for the current length (so far).
   *
   * Out of range values are capped.
   */
  setProgressLength(length: number) {
    const proportion = length / this.soFar;
    const safe = Math.min(1, Math.max(0, proportion));
    this.setProgress(safe);
  }
}
