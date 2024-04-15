// This is the preferred way to include a css file.
import "./style.css";

//import { getById } from "phil-lib/client-misc";
//const circle = document.querySelectorAll("circle")[0];

class Point {
  constructor(public readonly x: number, public readonly y: number) {}
  equals(other: Point) {
    return this.x == other.x && this.y == other.y;
  }
  static readonly CENTER = new Point(0.5, 0.5);
  static fromJSON(original: any) {
    try {
      const x = original.x;
      const y = original.y;
      if (typeof x != "number" || typeof y != "number") {
        return undefined;
      } else {
        return new this(x, y);
      }
    } catch {
      return undefined;
    }
  }
}

class Circle extends Object {
  readonly #element = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  #center = Point.CENTER;
  #radius = 0.25;
  #color = "orange";
  #attached = true;
  constructor() {
    super();
    this.#element.classList.add("simple");
    this.updateGui();
  }
  updateGui() {
    const element = this.#element;
    element.cx.baseVal.value = this.#center.x;
    element.cy.baseVal.value = this.#center.y;
    element.r.baseVal.value = this.#radius;
    element.style.fill = this.#color;
    //TODO attached
  }
  get center() {
    return this.#center;
  }
  set center(newValue: Point) {
    if (!newValue.equals(this.#center)) {
      this.#center = newValue;
      this.updateGui();
    }
  }
  get radius() {
    return this.#radius;
  }
  set radius(newValue: number) {
    if (this.#radius != newValue) {
      this.#radius = newValue;
      this.updateGui();
    }
  }
  get color() {
    return this.#color;
  }
  set color(newValue) {
    if (this.#color != newValue) {
      this.#color = newValue;
      this.updateGui();
    }
  }
  toJSON() {
    const { center, radius, color } = this;
    return { center, radius, color };
  }
  /**
   * ```
   * const c = new Circle();
   * const clone1 = Circle.fromJSON(JSON.parse(JSON.stringify(c)));
   * const clone2 = Circle.fromJSON(c.toJSON());
   * ```
   * @param original This is the output from `JSON.parse()` or `Circle.toJSON()`.
   * @returns A new Circle object that is a clone of the original.  Or `undefined` if the input is invalid.
   */
  static fromJSON(original: any) {
    const center = Point.fromJSON(original.center);
    if (!center) {
      return undefined;
    }
    const color = original.color;
    if (typeof color != "string") {
      return undefined;
    }
    const radius = original.radius;
    if (typeof radius != "number") {
      return undefined;
    }
    const result=  new this();
    result.center = center;
    result.color = color;
    result.radius = radius;
    return result;
  }
  override toString(): string {
    return `<center cx="${this.center.x}" cy="${this.center.y}" r="${
      this.radius
    }" fill=${JSON.stringify(this.color)} \\>`;
  }
}

(window as any).Circle = Circle;
