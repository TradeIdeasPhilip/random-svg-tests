// This is the preferred way to include a css file.
import "./style.css";

import { pick } from "phil-lib/misc";
import { getById } from "phil-lib/client-misc";
import { AnimationLoop } from "./utility";

// MARK: Point
/**
 * Basically these objects are __read-only__ and that's the main point of this class.
 * If someone gives you a point you can hold onto it.  You don't have to make a copy.
 */
class Point {
  constructor(public readonly x: number, public readonly y: number) {}
  equals(other: Point) {
    return this.x == other.x && this.y == other.y;
  }
  distanceTo(other: Point) {
    return Math.hypot(this.x - other.x, this.y - other.y);
  }
  /**
   * The center of the drawing area.
   */
  static readonly CENTER = new Point(0.5, 0.5);
  /**
   * Randomly create a new Point.
   * @param radius Leave at least this much distance from the edge.
   *
   * The idea is the the output of this function will become the
   * center of a Circle with the given `radius`.  The circle will
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

// MARK: Circle

/**
 * All of the publicly modifiable properties of Circle are listed here.
 * This is for use with Circle.configure().
 */
type CircleConfig = {
  attached?: boolean;
  color?: string;
  center?: Point;
  radius?: number;
};

/**
 * A simple wrapper around an `SVGCircleElement`.
 */
class Circle extends Object {
  /**
   *
   * @param other
   * @returns True if the two circles overlap.
   */
  overlaps(other: Circle): boolean {
    const distance = this.center.distanceTo(other.center);
    return distance < this.radius || distance < other.radius;
  }
  /**
   *
   * @param universe A list of circles to compare.
   * @returns A list of each pair of overlapping circles.
   * Each pair is only listed once.
   */
  static overlapping(universe: ReadonlyArray<Circle>) {
    const result: [Circle, Circle][] = [];
    universe.forEach((secondCircle, secondIndex) => {
      for (var firstIndex = 0; firstIndex < secondIndex; firstIndex++) {
        const firstCircle = universe[firstIndex];
        if (firstCircle.overlaps(secondCircle)) {
          result.push([firstCircle, secondCircle]);
        }
      }
    });
    return result;
  }
  /**
   *
   * @returns A list of all circles currently attached to the background.
   */
  static allAttached() {
    const result = new Set<Circle>();
    document.querySelectorAll("circle").forEach((element) => {
      const circle = this.for(element);
      if (circle) {
        result.add(circle);
      }
    });
    return result;
  }
  /**
   * This is a way to set the properties of this object.
   * This is a convenience allowing you to create and configure an object without creating a temporary value.
   * Mostly I use it for one-liners in the console. 
   * @param param0 A collection of property names and their desired values.
   * @returns this
   */
  configure({ attached, center, color, radius }: CircleConfig) {
    if (attached !== undefined) {
      this.attached = attached;
    }
    if (center !== undefined) {
      this.center = center;
    }
    if (color !== undefined) {
      this.color = color;
    }
    if (radius !== undefined) {
      this.radius = radius;
    }
    return this;
  }
  static readonly #parent = getById("circle-parent", SVGElement);
  /**
   * The underlying SVG element.
   */
  readonly #colorElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  readonly #shapeElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  readonly #allElements: ReadonlyArray<SVGCircleElement> = [
    this.#colorElement,
    this.#shapeElement,
  ];
  get elements(): ReadonlyArray<SVGElement> {
    return this.#allElements;
  }
  #radius = Math.random() * (1 / 8) + 1 / 16;
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
    this.#colorElement.classList.add("simple");
    this.#shapeElement.classList.add("sphere");
    this.radius = this.#radius;
    this.color = this.#color;
    this.center = this.#center;
    this.attached = true;
    this.#allElements.forEach((element) =>
      Circle.#byElement.set(element, this)
    );
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
      this.#allElements.forEach((element) => {
        if (shouldBeAttached) {
          Circle.#parent.appendChild(element);
        } else {
          element.remove();
        }
      });
      this.#attached = shouldBeAttached;
    }
  }
  get center() {
    return this.#center;
  }
  set center(newValue: Point) {
    this.#center = newValue;
    this.#allElements.forEach((element) => {
      element.cx.baseVal.value = newValue.x;
      element.cy.baseVal.value = newValue.y;
    });
  }
  get radius() {
    return this.#radius;
  }
  set radius(newValue: number) {
    this.#radius = newValue;
    this.#allElements.forEach((element) => {
      element.r.baseVal.value = newValue;
    });
  }
  /**
   * The apparent size of the sphere.  this.volume == this.radius³
   */
  get volume() {
    return Math.pow(this.radius, 3);
  }
  set volume(newValue) {
    this.radius = Math.pow(newValue, 1 / 3);
  }
  /**
   * I hand this directly to the `fill` css property of an `SVGElement`.
   */
  get color() {
    return this.#color;
  }
  set color(newValue) {
    this.#color = newValue;
    this.#colorElement.style.fill = this.#color;
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
      if (typeof attached != "boolean") {
        return undefined;
      }
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
  static #byElement = new WeakMap<SVGElement, Circle>();
  static for(element: SVGElement) {
    return this.#byElement.get(element);
  }
}

// MARK: InertiaAndBounce
/**
 * This object adds *simple* physics to the circle.
 * It goes as a constant speed until it bounces off a wall.
 * Other parts of the software can change the speed as required. 
 */
class InertiaAndBounce {
  /**
   * SVG units / millisecond.  Positive for left.
   */
  xSpeed = Math.random() / 1000;
  /**
   * SVG units / millisecond.  Positive for down.
   */
  ySpeed = Math.random() / 1000;
  #previousTimestamp: number | undefined;
  constructor(readonly circle: Circle = new Circle()) {
    this.paused = false;
    circle.elements.forEach((element) =>
      InertiaAndBounce.#byElement.set(element, this)
    );
  }
  private update(timestamp: DOMHighResTimeStamp) {
    if (this.#previousTimestamp !== undefined) {
      const msPassed = timestamp - this.#previousTimestamp;
      const min = this.circle.radius;
      const max = 1 - min;
      let { x, y } = this.circle.center;
      x += this.xSpeed * msPassed;
      if (x <= min) {
        x = min;
        this.xSpeed = Math.abs(this.xSpeed);
      } else if (x >= max) {
        x = max;
        this.xSpeed = -Math.abs(this.xSpeed);
      }
      y += this.ySpeed * msPassed;
      if (y <= min) {
        y = min;
        this.ySpeed = Math.abs(this.ySpeed);
      } else if (y >= max) {
        y = max;
        this.ySpeed = -Math.abs(this.ySpeed);
      }
      this.circle.center = new Point(x, y);
    }
    this.#previousTimestamp = timestamp;
  }
  #animationLoop: AnimationLoop | undefined;
  get paused() {
    return !this.#animationLoop;
  }
  set paused(newValue) {
    if (newValue != this.paused) {
      if (newValue) {
        this.#animationLoop!.cancel();
        this.#animationLoop = undefined;
      } else {
        this.#animationLoop = new AnimationLoop(this.update.bind(this));
      }
    }
    if (newValue != this.paused) {
      console.error("wtf");
    }
  }
  static #byElement = new WeakMap<SVGElement, InertiaAndBounce>();
  static for(element: SVGElement) {
    return this.#byElement.get(element);
  }
}

// MARK: Export to Console
(window as any).Circle = Circle;
(window as any).InertiaAndBounce = InertiaAndBounce;
