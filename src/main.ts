// This is the preferred way to include a css file.
import "./style.css";

import { pick } from "phil-lib/misc";

import { getById } from "phil-lib/client-misc";

/**
 * Basically these objects are __read-only__ and that's the main point of this class.
 * If someone gives you a point you can hold onto it.  You don't have to make a copy.
 */
class Point {
  constructor(public readonly x: number, public readonly y: number) {}
  equals(other: Point) {
    return this.x == other.x && this.y == other.y;
  }
  /**
   * The center of the drawing area.
   */
  static readonly CENTER = new Point(0.5, 0.5);
  /**
   * Randomly create a new point.
   * @param radius Leave at least this much distance from the edge.
   *
   * The idea is the the output of this function will become the
   * center of a circle with the given `radius`.  The circle will
   * be completely within the drawing area.
   * @returns A random point in the drawing area.
   */
  static random(radius = 0) {
    function randomInRange() {
      return radius + Math.random() * (1 - 2 * radius);
    }
    return new this(randomInRange(), randomInRange());
  }
  /**
   * ```
   * const original = Point.random();
   * const onTheWire = JSON.stringify(original);
   * const clone = Point.fromJSON(JSON.parse(onTheWire));
   * assert(clone!.equals(original));
   * ```
   * @param original The result of a call to JSON.parse().
   * (Possibly the entire result, more likely just part of a larger JSON file.)
   * @returns A clone of the original Point, or undefined if there were any problems.
   */
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

/**
 * A simple wrapper around an `SVGCircleElement`.
 */
class Circle extends Object {
  static readonly #parent = getById("circle-parent", SVGElement);
  /**
   * The underlying SVG element.
   */
  readonly #element = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  #radius = Math.random() * 0.25 + 0.125;
  #color = pick([
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "indigo",
    "violet",
  ]);
  #center = Point.random(this.#radius);
  constructor() {
    super();
    this.#element.classList.add("simple");
    this.radius = this.#radius;
    this.color = this.#color;
    this.center = this.#center;
    this.attached = true;
  }
  #attached = false;
  /**
   * Set this to false to remove the circle from view.
   * Set this to true to reattach the circle to the display.
   * New circles are all initially attached.
   *
   * ("Attached" could almost be "visible."
   * "Visible" is not 100% accurate.
   * The idea is right and you can ignore the details most of the time.)
   */
  get attached() {
    return this.#attached;
  }
  set attached(shouldBeAttached: boolean) {
    // This test is more than an optimization.
    // Appending an element that is already a child will move that element to the end.
    if (shouldBeAttached != this.#attached) {
      if (shouldBeAttached) {
        Circle.#parent.appendChild(this.#element);
      } else {
        this.#element.remove();
      }
      this.#attached = shouldBeAttached;
    }
  }
  get center() {
    return this.#center;
  }
  set center(newValue: Point) {
    this.#center = newValue;
    const element = this.#element;
    element.cx.baseVal.value = newValue.x;
    element.cy.baseVal.value = newValue.y;
  }
  get radius() {
    return this.#radius;
  }
  set radius(newValue: number) {
    this.#radius = newValue;
    this.#element.r.baseVal.value = newValue;
  }
  get color() {
    return this.#color;
  }
  set color(newValue) {
    this.#color = newValue;
    this.#element.style.fill = this.#color;
  }
  /**
   * See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
   * and search for `toJSON()` for more details.
   * @returns Creates a simpler object, with all the data from this object, suitable for JSON'ing.
   */
  toJSON() {
    const { center, radius, color, attached } = this;
    return { center, radius, color, attached };
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
    try {
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
      const attached = original.attached;
      const result = new this();
      result.center = center;
      result.color = color;
      result.radius = radius;
      result.attached = attached;
      return result;
    } catch {
      // Presumably the original was not an object.
      return undefined;
    }
  }
  /**
   * Mostly for logging and debugging, not end user facing.
   * This is inspired by the syntax of an SVG file, but I cut some corners.
   */
  override toString(): string {
    return `<center cx="${this.center.x}" cy="${this.center.y}" r="${
      this.radius
    }" fill=${JSON.stringify(this.color)} \\>`;
  }
}

(window as any).Circle = Circle;
