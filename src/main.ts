// This is the preferred way to include a css file.
import "./style.css";

import { LinearFunction, makeLinear, pick, sleep } from "phil-lib/misc";
import { getById } from "phil-lib/client-misc";
import { AnimationLoop, phi, polarToRectangular } from "./utility";

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
   *
   * @param destination Start by considering a vector from `this` to `destination`
   * @param ratio How far to stretch the vector.
   * A ratio of 0 will return `this`.
   * A ratio of 1 will return `destination`.
   * A ratio 0.5 will return a new `Point` halfway between `this` and `destination`.
   * Etc.
   * @param maxLength The maximum distance to travel from `this`.  Defaults to Infinity for unlimited.
   * @returns A new `Point` on the line connecting `this` and `destination`.  `ratio` and maxLength pick which point on that line.
   */
  extendPast(destination: Point, ratio: number, maxLength = Infinity) {
    // I hate the name "extendPast"!
    const angle = Math.atan2(destination.y - this.y, destination.x - this.x);
    const initialDistance = this.distanceTo(destination);
    const finalDistance = Math.min(initialDistance * ratio, maxLength);
    const finalVector = polarToRectangular(finalDistance, angle);
    const result = new Point(this.x + finalVector.x, this.y + finalVector.y);
    return result;
  }
  static readonly ZERO = new Point(0, 0);
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
   * @returns A set of all circles currently attached to the background.
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
  static removeAll() {
    [...Circle.allAttached()].forEach((c) => (c.attached = false));
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
  static readonly parent = getById("circle-parent", SVGElement);
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
          Circle.parent.appendChild(element);
        } else {
          element.remove();
        }
      });
      this.#attached = shouldBeAttached;
    }
  }
  sendToBack() {
    this.attached = true;
    this.elements
      .toReversed()
      .forEach((element) =>
        Circle.parent.insertBefore(element, Circle.parent.firstChild)
      );
    return this;
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

// MARK: Animation
/**
 * This is a wrapper around AnimationLoop.
 * AnimationLoop was written for use with unnamed functions.
 * Animation is a nice base class if you want to add a lot of properties.
 */
abstract class Animation {
  #previousTimestamp: number | undefined;

  private onAnimationFrame(timestamp: DOMHighResTimeStamp) {
    const msSinceLastUpdate =
      this.#previousTimestamp == undefined
        ? undefined
        : timestamp - this.#previousTimestamp;
    // Interesting.  Sometimes msSinceLastUpdate is negative!  Seems to only happen on the first try and only sometimes.
    this.#previousTimestamp = timestamp;
    this.beforeUpdate?.(msSinceLastUpdate);
    this.update(msSinceLastUpdate);
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
        this.#previousTimestamp = undefined;
      } else {
        this.#animationLoop = new AnimationLoop(
          this.onAnimationFrame.bind(this)
        );
      }
    }
    if (newValue != this.paused) {
      console.error("wtf");
    }
  }

  protected abstract update(
    msSinceLastUpdate: DOMHighResTimeStamp | undefined
  ): void;
  /**
   * Call this callback each animation frame immediately before doing any work.
   *
   * This gives someone the ability to update the goal every animation frame.
   */
  beforeUpdate:
    | ((msSinceLastUpdate: DOMHighResTimeStamp | undefined) => void)
    | undefined;

  constructor(initiallyPaused = false) {
    this.paused = initiallyPaused;
  }
}

// MARK: InertiaAndBounce

/**
 * For use with InertiaAndBounce.configure()
 */
type InertiaAndBounceConfig = {
  paused?: boolean;
  /**
   * This gets passed directly to this.circle.config().
   */
  circle?: CircleConfig;
  /**
   * SVG units / millisecond.  Positive for left.
   */
  xSpeed?: number;
  /**
   * SVG units / millisecond.  Positive for down.
   */
  ySpeed?: number;
};

/**
 * This object adds *simple* physics to the circle.
 * It goes as a constant speed until it bounces off a wall.
 * Other parts of the software can change the speed as required.
 */
class InertiaAndBounce extends Animation {
  /**
   * This is an alternative syntax for setting the properties.
   * @param param0 A collection of property names and their desired values.
   * @returns this
   */
  configure({ paused, circle, xSpeed, ySpeed }: InertiaAndBounceConfig) {
    if (paused !== undefined) {
      this.paused = paused;
    }
    if (circle) {
      this.circle.configure(circle);
    }
    if (xSpeed !== undefined) {
      this.xSpeed = xSpeed;
    }
    if (ySpeed !== undefined) {
      this.ySpeed = ySpeed;
    }
    return this;
  }
  /**
   * SVG units / millisecond.  Positive for left.
   */
  xSpeed = Math.random() / 1000;
  /**
   * SVG units / millisecond.  Positive for down.
   */
  ySpeed = Math.random() / 1000;
  constructor(readonly circle: Circle = new Circle()) {
    super();
    circle.elements.forEach((element) =>
      InertiaAndBounce.#byElement.set(element, this)
    );
  }
  override update(msPassed: DOMHighResTimeStamp | undefined) {
    if (msPassed !== undefined) {
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
  }
  static #byElement = new WeakMap<SVGElement, InertiaAndBounce>();
  static for(element: SVGElement) {
    return this.#byElement.get(element);
  }
}

// MARK: Follower

abstract class SmartFollower extends Animation {
  goal = Point.random();
  /**
   * Update the `goal`.  This is convenience aimed at using the console.
   * @param x
   * @param y
   */
  moveTo(x: number, y: number) {
    this.goal = new Point(x, y);
  }
  followCircle(toFollow: Circle) {
    this.beforeUpdate = () => (this.goal = toFollow.center);
  }
}

// MARK: ExponentialFollower

type ExponentialFollowerConfig = {
  paused?: boolean;
  /**
   * This gets passed directly to this.circle.config().
   */
  circle?: CircleConfig;
  goal?: Point;
  /**
   * If the `goal` doesn't move, the `Circle` will move half way to the `goal` every `halfLife` milliseconds.
   */
  halflife?: number;
};

class ExponentialFollower extends SmartFollower {
  /**
   * This is an alternate syntax for setting this object's properties.
   * @param param0 A list of names and desired values for each property to change.
   * @returns this
   */
  configure({ paused, circle, goal, halflife }: ExponentialFollowerConfig) {
    if (paused !== undefined) {
      this.paused = paused;
    }
    if (circle) {
      this.circle.configure(circle);
    }
    if (goal) {
      this.goal = goal;
    }
    if (halflife !== undefined) {
      this.halflife = halflife;
    }
    return this;
  }
  protected override update(
    msSinceLastUpdate: DOMHighResTimeStamp | undefined
  ): void {
    if (msSinceLastUpdate !== undefined) {
      const skipRatio = Math.pow(0.5, msSinceLastUpdate / this.halflife);
      const newCenter = this.circle.center.extendPast(this.goal, 1 - skipRatio);
      this.circle.center = newCenter;
    }
  }
  /**
   * If the `goal` doesn't move, `this.circle` will move half way to the `goal` every `halfLife` milliseconds.
   */
  halflife = 250;
  constructor(public readonly circle = new Circle()) {
    super();
  }
}

// MARK: Pointer Control

/**
 * Translate from mouse coordinates to SVG drawing coordinates.
 * So you can draw something right under the mouse.
 * @param coordinates This is presumably a PointerEvent.
 * You can't just ask for the mouse position any time you want.
 * It only comes from an event.
 * @returns A new Point that can be used to draw on the SVG surface.
 */
function translateCoordinates(coordinates: {
  clientX: number;
  clientY: number;
}) {
  // I'm assuming that the client rectangle can change all the time.
  // I think that includes resizing and scrolling.
  const rect = Circle.parent.getBoundingClientRect();
  // I'm assuming that SVG coordinates will always go from (0,0) to (1,1).
  // I have full control over that and I've decided to focus on this fixed
  // size to keep things simple.
  const x = (coordinates.clientX - rect.left) / rect.width;
  const y = (coordinates.clientY - rect.top) / rect.height;
  return new Point(x, y);
}

/**
 * Any time you have the left mouse button down the given Circle
 * will immediately move to the mouse location.  Or the
 * ExponentialFollower will adjust it's goal and start moving
 * toward the mouse.
 * @param follower This is the thing that you want to follow the mouse.
 * @returns A function you can call to stop following the mouse.
 */
function followMouse(follower: Circle | ExponentialFollower) {
  function update(pointerEvent: PointerEvent) {
    const svgCoordinates = translateCoordinates(pointerEvent);
    if (follower instanceof Circle) {
      follower.center = svgCoordinates;
    } else {
      follower.goal = svgCoordinates;
    }
  }
  const abortController = new AbortController();
  Circle.parent.addEventListener(
    "pointerdown",
    (pointerEvent) => {
      if (pointerEvent.button == 0) {
        // The user just pressed button 1.
        update(pointerEvent);
      }
    },
    { signal: abortController.signal }
  );
  Circle.parent.addEventListener(
    "pointermove",
    (pointerEvent) => {
      if (pointerEvent.buttons & 1) {
        // The user is moving the mouse while button 1 is down.
        update(pointerEvent);
      }
    },
    { signal: abortController.signal }
  );
  return abortController.abort.bind(abortController);
}

// MARK: Physics
/**
 * This uses physics to limit the changes you can make to a circle.
 * Instead of directly setting the position or velocity, you should only set the acceleration.
 * I.e. apply a force, like in real life.
 */
class Physics extends SmartFollower {
  /**
   * This applies the immutable laws of physics.
   * See `beforeUpdate` for the strategies for updating the forces.
   * @param msSinceLastUpdate
   */
  protected override update(
    msSinceLastUpdate: DOMHighResTimeStamp | undefined
  ): void {
    if (msSinceLastUpdate !== undefined) {
      const ms = msSinceLastUpdate;
      function addScaled(startFrom: Point, direction: Point) {
        const x = startFrom.x + direction.x * ms;
        const y = startFrom.y + direction.y * ms;
        return new Point(x, y);
      }
      this.circle.center = addScaled(this.circle.center, this.velocity);
      this.velocity = addScaled(this.velocity, this.acceleration);
    }
  }
  /**
   * SVG Units / millisecond².
   */
  maxAcceleration = 0.000003;
  #acceleration = new Point(0, 0);
  get acceleration() {
    return this.#acceleration;
  }
  set acceleration(requestedValue) {
    // TODO this is totally wrong.
    this.#acceleration = Point.ZERO.extendPast(
      requestedValue,
      1,
      this.maxAcceleration
    );
  }
  /**
   * SVG Units / millisecond.
   */
  maxSpeed = 0.001;
  #velocity = new Point(0, 0);
  get velocity() {
    return this.#velocity;
  }
  set velocity(requestedValue) {
    this.#velocity = Point.ZERO.extendPast(requestedValue, 1, this.maxSpeed);
  }
  constructor(public readonly circle = new Circle()) {
    super();
    // This default algorithm is very dumb.
    // It aims directly at the goal and applies maximum throttle.
    // In practice this usually leads to the circle orbiting around the goal.
    this.beforeUpdate = (
      msSinceLastUpdate: DOMHighResTimeStamp | undefined
    ) => {
      if (msSinceLastUpdate !== undefined) {
        const Δx = this.goal.x - this.circle.center.x;
        const Δy = this.goal.y - this.circle.center.y;
        this.acceleration = new Point(Δx, Δy);
      }
    };
  }
}

// MARK: ThreeDFlattener

/**
 * You can convert a 3d point to a 2d point in two steps.
 * First create a `ThreeDFlattener` with the z from the original point.
 * The call `flatten()` with the x and y from the original point.
 */
class ThreeDFlattener {
  /**
   * Use `ratio` to convert a _vector_  from 3d space to 2d space.
   * (ΔX, ΔY) in 3d space becomes (`ratio`*ΔX, `ratio`*ΔY) in 2d space.
   * Use `flatten()` to convert a _point_ from 3d space to 2d space.
   */
  readonly ratio: number;
  readonly #convert: LinearFunction;
  /**
   *
   * @param z The axis in and out of the screen.  Reasonable values are [0,1].  Larger values are further from the user.
   * @param perspective Very large values will completely ignore the value of z.  Small values will make the perspective more obvious.
   *
   * I always zoom in so that the square (0≤x≤1, 0≤y≤1, z=0) completely fills the SVG.
   * `perspective` says how far the camera is from the z=0 plane.
   *
   * This value is often presented as the field of view, an angle.
   * A larger `perspective` leads to a smaller field of view.
   * You could do some trig and do the same thing here.
   * But there's no point because in practice this value is just tweaked until it looks good.
   */
  constructor(public readonly z: number, perspective?: number) {
    perspective ??= 1;
    // This is the heart of the algorithm.
    // The rest all depends on this.
    this.ratio = perspective / (perspective + z);
    this.#convert = makeLinear(0.5, 0.5, 1, 0.5 + this.ratio * 0.5);
  }
  flatten({ x, y }: { readonly x: number; readonly y: number }): Point {
    return new Point(this.#convert(x), this.#convert(y));
  }
  static demo(n = 5, perspective?: number) {
    const lf = makeLinear(0, 0, n - 1, 1);
    const y = 0.75;
    const baseRadius = 1 / n / 3;
    for (let zIndex = n - 1; zIndex >= 0; zIndex--) {
      const z = lf(zIndex);
      const flattener = new ThreeDFlattener(z, perspective);
      const radius = baseRadius * flattener.ratio;
      for (let xIndex = 0; xIndex < n; xIndex++) {
        const x = lf(xIndex);
        const flattened = flattener.flatten({ x, y });
        const circle = new Circle();
        circle.center = flattened;
        circle.radius = radius;
        const color = ["#004", "#00F"][(zIndex + xIndex) % 2];
        //console.log({color,x,y,z, circle});
        circle.color = color;
      }
    }
  }
  static demo3(n = 5, perspective?: number) {
    const lf = makeLinear(0, 0, n - 1, 1);
    const baseRadius = 1 / n / 3;
    for (let zIndex = n - 1; zIndex >= 0; zIndex--) {
      const z = lf(zIndex);
      const flattener = new ThreeDFlattener(z, perspective);
      const radius = baseRadius * flattener.ratio;
      for (let yIndex = 0; yIndex < n; yIndex++) {
        const y = lf(yIndex);
        for (let xIndex = 0; xIndex < n; xIndex++) {
          const x = lf(xIndex);
          const flattened = flattener.flatten({ x, y });
          const circle = new Circle();
          circle.center = flattened;
          circle.radius = radius;
          const color = ["#004", "#00F"][(zIndex + yIndex + xIndex) % 2];
          //console.log({color,x,y,z, circle});
          circle.color = color;
        }
      }
    }
  }
  static async tunnelDemo(
    options: {
      readonly count?: number;
      readonly perspective?: number;
      readonly perRevolution?: number;
      readonly periodMS?: number;
    } = {}
  ) {
    const count = options.count ?? 50;
    const perRevolution = options.perRevolution ?? 17.5;
    const periodMS = options.periodMS ?? 10;
    const drawCircle = (
      center: { readonly x: number; readonly y: number },
      z: number
    ) => {
      const flattener = new this(z, options.perspective);
      const result = new Circle();
      result.center = flattener.flatten(center);
      result.radius = flattener.ratio * 0.09;
      return result;
    };
    const getCenter = (numberOfTurns: number) => {
      const angle = numberOfTurns * (2 * Math.PI);
      const radius = 0.4;
      const center = polarToRectangular(radius, angle);
      center.x += Point.CENTER.x;
      center.y += Point.CENTER.y;
      return center;
    };
    for (let n = 0; n < count; n++) {
      drawCircle(getCenter(n / perRevolution), n / 30)
        .sendToBack()
        .configure({ color: `hsl(none 0% ${100 - n * (100 / count)}%)` });
      if (periodMS > 0) {
        await sleep(periodMS);
      }
    }
  }
}

// MARK: Export to Console
const SHARE = window as any;
SHARE.Circle = Circle;
SHARE.InertiaAndBounce = InertiaAndBounce;
SHARE.ExponentialFollower = ExponentialFollower;
SHARE.Physics = Physics;
SHARE.followMouse = followMouse;
SHARE.ThreeDFlattener = ThreeDFlattener;
SHARE.phi = phi;
