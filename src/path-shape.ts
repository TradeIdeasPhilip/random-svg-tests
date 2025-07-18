import {
  angleBetween,
  assertFinite,
  assertNonNullable,
  degreesPerRadian,
  FULL_CIRCLE,
  initializedArray,
  lerp,
  makeLinear,
  parseFloatX,
  polarToRectangular,
  positiveModulo,
  radiansPerDegree,
  RealSvgRect,
} from "phil-lib/misc";
import { transform } from "./transforms";

/**
 * This is a wrapper around an `SVGPathElement`.
 *
 * You cannot call `getPointAtLength()` or `getTotalLength()` on a `<path>` object without doing some extra work.
 */
export class PathCaliper {
  /**
   * The path needs to be attached to an SVG and both need to be visible,
   * Otherwise a call to `this.length` or `this.getPoint()` will return incorrect values.
   */
  readonly #svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  readonly #path = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  constructor() {
    this.#svg.style.width = "0";
    this.#svg.style.height = "0";
    this.#svg.style.position = "absolute";
    this.#svg.appendChild(this.#path);
    document.body.appendChild(this.#svg);
  }
  getBBox(): RealSvgRect {
    // bBox explicitly does not require the path to be visible.
    // I've just included it here for convenience.
    // Put all the related tools together.
    return this.#path.getBBox();
  }
  get d(): string {
    return this.#path.getAttribute("d") ?? "";
  }
  /**
   * Read or set the value of the `d` attribute of the path.
   *
   * The default value is "".
   *
   * Attempting to set `d` to an invalid value with throw an `Error`.
   * The value of `d` will remain unchanged.
   */
  set d(newValue: string) {
    this.#path.style.d = "";
    this.#path.style.d = PathShape.cssifyPath(newValue);
    /**
     * Error checking is complicated.
     * If you set the d attribute to a bad value it will print an error message on the console, but it will not report anything to the program.
     * The attribute will be set to the bad value.
     * Attempting to call `this.length` or `this.getPoint()` will throw an error.
     * If you set the d style property to a bad value, nothing will be reported, but the property value will not change.
     * On success,the new value will change, but **not** necessarily to an exact copy of the requested value.
     */
    const success = this.#path.style.d != "";
    this.#path.style.d = "";
    if (success) {
      this.#path.setAttribute("d", newValue);
    } else {
      throw new Error("Invalid path");
    }
  }
  /**
   * Returns true if this is in the default state, `d == ""`.
   */
  get empty() {
    return this.d == "";
  }
  /**
   * Returns this to the default state, `d == ""`.
   */
  clear() {
    this.d = "";
  }
  /**
   * Returns the length of the path.  0 for an empty path.
   */
  get length() {
    return this.#path.getTotalLength();
  }
  /**
   * Find a point along the path.
   * @param distance 0 for the start of the path.
   * this.length for the end of the path.
   * Values below 0 return the start of the path.
   * Values above this.length return the end of the path.
   * @returns The point at `distance` from the start of the path.
   */
  getPoint(distance: number) {
    return this.#path.getPointAtLength(distance);
  }
  /**
   * A way of setting the `d` property.
   * This automatically converts from other formats to a string.
   * @param path Set `this.d` to this value.
   */
  load(path: string | Command | PathShape) {
    if (typeof path !== "string") {
      if (!(path instanceof PathShape)) {
        path = new PathShape([path]);
      }
      path = path.rawPath;
    }
    this.d = path;
  }
  /**
   * This is a wrapper around `this.load()` and `this.length`.
   *
   * This is a convenience in a lot of place where you just want a function call, not an object.
   * @param path To be measured.
   * @returns The length of the path.
   */
  measure(path: string | Command | PathShape) {
    this.load(path);
    return this.length;
  }
}

const formatForSvg = new Intl.NumberFormat("en-US", {
  maximumSignificantDigits: 8,
  useGrouping: false,
}).format;

// MARK: Command
export type Command = {
  /**
   * Create another command that will follow the same path, but backwards.
   * If you stroke or fill the path, it will look just like the original.
   * But some animations can tell the difference.
   */
  reverse(): Command;
  /**
   * The initial x value.
   *
   * We do not have to write this as part of the command.
   * SVG knows this from the end of the previous command.
   * We us this for things like reversing a command or splitting a command into multiple commands.
   */
  readonly x0: number;
  /**
   * The initial y value.
   *
   * We do not have to write this as part of the command.
   * SVG knows this from the end of the previous command.
   * We us this for things like reversing a command or splitting a command into multiple commands.
   */
  readonly y0: number;
  /**
   * The final x value.
   * This will be x0 for the next command.
   */
  readonly x: number;
  /**
   * The final y value.
   * This will be y0 for the next command.
   */
  readonly y: number;
  readonly incomingAngle: number;
  readonly outgoingAngle: number;
  /**
   * E.g. "C", "Q", "L", etc.
   *
   * Never "M".  "M" commands get added at a later stage.
   */
  readonly command: string;
  /**
   * E.g. "H 5", "L 2,3", etc.
   */
  readonly asString: string;
  translate(Δx: number, Δy: number): Command;
  toCubic(): CCommand;
  transform(matrix: DOMMatrix): Command;
};

// MARK: LCommand
export class LCommand implements Command {
  reverse(): LCommand {
    return new LCommand(this.x, this.y, this.x0, this.y0);
  }
  /**
   * This was an interesting idea, but the `PathShape.rawPath`
   * seem like a better idea.
   * @returns Enough information to find and call the constructor.
   */
  toJSON() {
    return { command: "L", x0: this.x0, y0: this.y0, x: this.x, y: this.y };
  }
  constructor(
    public readonly x0: number,
    public readonly y0: number,
    public readonly x: number,
    public readonly y: number
  ) {
    assertFinite(x0, y0, x, y);
    this.asString = `L ${formatForSvg(x)},${formatForSvg(y)}`;
    this.outgoingAngle = this.incomingAngle = Math.atan2(y - y0, x - x0);
  }
  /**
   * Like you are reading values from an `l` command.
   * A lower case "l."
   * @param x0 The start of this line.
   * @param y0 The start of this line.
   * @param dx The end of this line measured relative to x0.
   * @param dy The end of this line measured relative to y0.
   * @returns A new `LCommand` object.
   */
  static relative(x0: number, y0: number, dx: number, dy: number) {
    return new this(x0, y0, dx + x0, dy + y0);
  }
  readonly incomingAngle;
  readonly outgoingAngle;
  readonly command = "L";
  readonly asString: string;
  get length() {
    return Math.hypot(this.x0 - this.x, this.y0 - this.y);
  }
  translate(Δx: number, Δy: number): Command {
    return new LCommand(this.x0 + Δx, this.y0 + Δy, this.x + Δx, this.y + Δy);
  }
  toCubic(): CCommand {
    return new CCommand(
      this.x0,
      this.y0,
      lerp(this.x0, this.x, 1 / 3),
      lerp(this.y0, this.y, 1 / 3),
      lerp(this.x0, this.x, 2 / 3),
      lerp(this.y0, this.y, 2 / 3),
      this.x,
      this.y
    );
  }
  transform(matrix: DOMMatrix): LCommand {
    const p = transform(this.x, this.y, matrix);
    const p0 = transform(this.x0, this.y0, matrix);
    return new LCommand(p0.x, p0.y, p.x, p.y);
  }
}

// MARK: QCommand

/**
 * What function was used to create this object?
 * in the case of `angles()` the two angle inputs might get lost if we can't create the requested curve.
 * In this case we might want to try again or to display the element differently.
 * I.e. failures in red for debugging.
 * `success == true` means that the actual angles are the same as the requested angles, ± round-off error.
 */
export type QCreationInfo = Readonly<
  | { source: "line" }
  | { source: "controlPoints" }
  | { source: "angles"; success: boolean; angle0: number; angle: number }
>;

export type QCommandFromAngles = QCommand & {
  creationInfo: { source: "angles" };
};

export class QCommand implements Command {
  reverse(): QCommand {
    return QCommand.controlPoints(
      this.x,
      this.y,
      this.x1,
      this.y1,
      this.x0,
      this.y0
    );
  }
  /**
   * Create a line segment.
   * @param x0 Initial x
   * @param y0 Initial y
   * @param x Final x
   * @param y Final y
   * @param creationInfo Store this.
   * @returns A new QCommand.
   */
  private static line(
    x0: number,
    y0: number,
    x: number,
    y: number,
    creationInfo: QCreationInfo
  ) {
    return new this(x0, y0, (x0 + x) / 2, (y0 + y) / 2, x, y, creationInfo);
  }
  /**
   * Create a line segment using a Q command.
   *
   * This version takes 4 numbers as inputs.
   * See `line2()` if you have 2 points.
   * @param x0 Initial x
   * @param y0 Initial y
   * @param x Final x
   * @param y Final y
   * @returns A new Q command.
   */
  static line4(x0: number, y0: number, x: number, y: number) {
    return this.line(x0, y0, x, y, { source: "line" });
  }
  /**
   * Create a line segment using a Q command.
   *
   * This version takes 2 points as inputs.
   * See `line4()` if you have 4 numbers.
   * @param from Initial point
   * @param to Final point
   * @returns A new Q command.
   */
  static line2(from: Point, to: Point) {
    return this.line4(from.x, from.y, to.x, to.y);
  }
  /**
   * Create a `QCommand` based on two points and the angle at those
   * two points.
   *
   * This is the same as `tryAngles()` on success.  However, they
   * handle errors differently.  If this request cannot be satisfied
   * this function will return a straight line.  But on an error this
   * `tryAngles()` will return `undefined`.
   *
   * Generally the straight line works well in production because it
   * covers up a lot of problems, especially when the segments are
   * small.  And it's bad in testing for the exact same reason.
   * @param x0 x of the starting point.
   * @param y0 y of the ending point.
   * @param angle0 The direction that the curve is moving at the first point.
   * Like a tangent line, but with a direction.
   *
   * Both angles are pointing _forward_.  So `angle0` is pointing into the
   * curve and `angle1` is pointing out of the curve.
   * @param x x of the ending point.
   * @param y y of the ending point.
   * @param angle The direction that the curve is moving at the end point.
   * Like a tangent line, but with a direction.
   *
   * Both angles are pointing _forward_.  So `angle0` is pointing into the
   * curve and `angle1` is pointing out of the curve.
   * @returns A new `QCommand`.
   */
  static angles(
    x0: number,
    y0: number,
    angle0: number,
    x: number,
    y: number,
    angle: number
  ) {
    assertFinite(x0, y0, angle0, x, y, angle);
    const controlPoint = findIntersection(
      {
        x0,
        y0,
        angle: angle0,
      },
      {
        x0: x,
        y0: y,
        angle: angle + Math.PI,
      }
    );
    if (!controlPoint) {
      // Ignore the requested angles and just draw a line segment.
      // Store the original in case we want to try to fix it or report it.
      return this.line(x0, y0, x, y, {
        source: "angles",
        success: false,
        angle,
        angle0,
      }) as QCommandFromAngles;
    } else {
      const result = new this(x0, y0, controlPoint.x, controlPoint.y, x, y, {
        source: "angles",
        success: true,
        angle,
        angle0,
      });
      return result as QCommandFromAngles;
    }
  }
  /**
   * Create a new `QCommand` based on `this` one.
   * The requested fields will be changed.
   * The other fields will be copied as is.
   * @param incomingAngle The new requested value, or undefined to keep the previously requested value.
   * @param outgoingAngle The new requested value, or undefined to keep the previously requested value.
   * @returns The requested object.
   */
  newAngles(
    incomingAngle: number | undefined,
    outgoingAngle: number | undefined
  ) {
    incomingAngle ??= this.requestedIncomingAngle;
    outgoingAngle ??= this.requestedOutgoingAngle;
    return QCommand.angles(
      this.x0,
      this.y0,
      incomingAngle,
      this.x,
      this.y,
      outgoingAngle
    );
  }
  /**
   * This stores some information that `PathShape.rawPath` might have missed.
   * @returns Enough information to find and call the constructor.
   */
  toJSON() {
    return {
      command: "Q",
      x0: this.x0,
      y0: this.y0,
      x1: this.x1,
      y1: this.y1,
      x: this.x,
      y: this.y,
      creationInfo: this.creationInfo,
    };
  }
  static controlPoints(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x: number,
    y: number
  ) {
    return new this(x0, y0, x1, y1, x, y, { source: "controlPoints" });
  }
  /**
   * Like you are reading values from a `c` command.
   * A lower case "c."
   * @param x0 The start of this curve.
   * @param y0 The start of this curve.
   * @param dx1 A control point measured relative to x0.
   * @param dy1 A control point measured relative to y0.
   * @param dx A control point measured relative to x0.
   * @param dy A control point measured relative to y0.
   * @returns A new `CCommand` object.
   */
  static relative(
    x0: number,
    y0: number,
    dx1: number,
    dy1: number,
    dx: number,
    dy: number
  ) {
    return this.controlPoints(x0, y0, dx1 + x0, dy1 + y0, dx + x0, dy + y0);
  }
  private constructor(
    public readonly x0: number,
    public readonly y0: number,
    public readonly x1: number,
    public readonly y1: number,
    public readonly x: number,
    public readonly y: number,
    public readonly creationInfo: QCreationInfo
  ) {
    assertFinite(x0, y0, x1, y1, x, y);
    this.asString = `Q ${formatForSvg(x1)},${formatForSvg(y1)} ${formatForSvg(
      x
    )},${formatForSvg(y)}`;
  }
  get incomingAngle() {
    return Math.atan2(this.y1 - this.y0, this.x1 - this.x0);
  }
  get outgoingAngle(): number {
    return Math.atan2(this.y - this.y1, this.x - this.x1);
  }
  get requestedIncomingAngle(): number {
    if (this.creationInfo.source == "angles") {
      return this.creationInfo.angle0;
    } else {
      return this.incomingAngle;
    }
  }
  get requestedOutgoingAngle(): number {
    if (this.creationInfo.source == "angles") {
      return this.creationInfo.angle;
    } else {
      return this.outgoingAngle;
    }
  }
  readonly command = "Q";
  readonly asString: string;
  translate(Δx: number, Δy: number): QCommand {
    return QCommand.controlPoints(
      this.x0 + Δx,
      this.y0 + Δy,
      this.x1 + Δx,
      this.y1 + Δy,
      this.x + Δx,
      this.y + Δy
    );
  }
  transform(matrix: DOMMatrix): QCommand {
    const p0 = transform(this.x0, this.y0, matrix);
    const p1 = transform(this.x1, this.y1, matrix);
    const p = transform(this.x, this.y, matrix);
    return QCommand.controlPoints(p0.x, p0.y, p1.x, p1.y, p.x, p.y);
  }

  toCubic(): CCommand {
    return new CCommand(
      this.x0,
      this.y0,
      lerp(this.x0, this.x1, 2 / 3),
      lerp(this.y0, this.y1, 2 / 3),
      lerp(this.x, this.x1, 2 / 3),
      lerp(this.y, this.y1, 2 / 3),
      this.x,
      this.y
    );
  }
  /**
   *
   * @param at 0 for the start, 1 for the end, 0.5 for right in the middle.
   * @returns A pair of commands which together trace the same path as `this`.
   */
  split(at: number): [QCommand, QCommand] {
    //https://math.stackexchange.com/questions/1408478/subdividing-a-b%C3%A9zier-curve-into-n-curves
    const { x, x0, x1, y, y0, y1 } = this;
    const x0_first = x0;
    const y0_first = y0;
    const x1_first = (1 - at) * x0 + at * x1;
    const y1_first = (1 - at) * y0 + at * y1;
    const x_first = (1 - at) ** 2 * x0 + 2 * (1 - at) * at * x1 + at ** 2 * x; // 𝑃1,2=(1−𝑧)2𝑃0+2(1−𝑧)𝑧𝑃1+𝑧2𝑃2
    const y_first = (1 - at) ** 2 * y0 + 2 * (1 - at) * at * y1 + at ** 2 * y; // 𝑃1,2=(1−𝑧)2𝑃0+2(1−𝑧)𝑧𝑃1+𝑧2𝑃2
    const first_command = QCommand.controlPoints(
      x0_first,
      y0_first,
      x1_first,
      y1_first,
      x_first,
      y_first
    );
    const x0_second = x_first;
    const y0_second = y_first;
    const x1_second = (1 - at) * x1 + at * x;
    const y1_second = (1 - at) * y1 + at * y;
    const x_second = x;
    const y_second = y;
    const second_command = QCommand.controlPoints(
      x0_second,
      y0_second,
      x1_second,
      y1_second,
      x_second,
      y_second
    );
    return [first_command, second_command];
  }
  multiSplit(count: number): QCommand[] {
    assertFinite(count);
    if (count < 1 || (count | 0) != count) {
      throw new Error("wtf");
    }
    const result: QCommand[] = [];
    let remaining: QCommand = this;
    while (count > 1) {
      const at = 1 / count;
      let small: QCommand;
      [small, remaining] = remaining.split(at);
      result.push(small);
      count--;
    }
    result.push(remaining);
    return result;
  }
}

// MARK: CCommand
/**
 * A cubic Bézier segment.
 *
 * I don't use this much myself.
 * It's mostly aimed at imported curves.
 */
class CCommand implements Command {
  reverse() {
    return new CCommand(
      this.x,
      this.y,
      this.x2,
      this.y2,
      this.x1,
      this.y1,
      this.x0,
      this.y0
    );
  }
  constructor(
    public readonly x0: number,
    public readonly y0: number,
    public readonly x1: number,
    public readonly y1: number,
    public readonly x2: number,
    public readonly y2: number,
    public readonly x: number,
    public readonly y: number
  ) {
    assertFinite(x0, y0, x1, y1, x2, y2, x, y);
    this.asString = `C ${formatForSvg(x1)},${formatForSvg(y1)} ${formatForSvg(
      x2
    )},${formatForSvg(y2)} ${formatForSvg(x)},${formatForSvg(y)}`;
  }
  /**
   * Like you are reading values from a `c` command.
   * A lower case "c."
   * @param x0 The start of this curve.
   * @param y0 The start of this curve.
   * @param x1 A control point measured relative to x0.
   * @param y1 A control point measured relative to y0.
   * @param x2 A control point measured relative to x0.
   * @param y2 A control point measured relative to y0.
   * @param x A control point measured relative to x0.
   * @param y A control point measured relative to y0.
   * @returns A new `CCommand` object.
   */
  static relative(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x: number,
    y: number
  ) {
    return new this(x0, y0, x1 + x0, y1 + y0, x2 + x0, y2 + y0, x + x0, y + y0);
  }
  get incomingAngle() {
    return Math.atan2(this.y1 - this.y0, this.x1 - this.x0);
  }
  get outgoingAngle(): number {
    return Math.atan2(this.y - this.y2, this.x - this.x2);
  }
  readonly command = "C";
  readonly asString: string;
  translate(Δx: number, Δy: number): CCommand {
    return new CCommand(
      this.x0 + Δx,
      this.y0 + Δy,
      this.x1 + Δx,
      this.y1 + Δy,
      this.x2 + Δx,
      this.y2 + Δy,
      this.x + Δx,
      this.y + Δy
    );
  }
  transform(matrix: DOMMatrix): CCommand {
    const p0 = transform(this.x0, this.y0, matrix);
    const p1 = transform(this.x1, this.y1, matrix);
    const p2 = transform(this.x2, this.y2, matrix);
    const p = transform(this.x, this.y, matrix);
    return new CCommand(p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p.x, p.y);
  }
  toCubic(): CCommand {
    return this;
  }
}

// MARK: PathBuilder

/**
 * This class helps you build a path in a somewhat traditional way.
 * Start with an M, all other commands start from where the previous command ended.
 */
export class PathBuilder {
  /**
   * The commands added so far.
   *
   * This result might or might not reuse an array object.
   * Use this value immediately, or save a __copy__ of it.
   */
  get commands(): readonly Command[] {
    return this.#commands;
  }
  addCommand(command: Command) {
    this.#commands.push(command);
    this.#recentMove = undefined;
  }
  addCommands(commands: readonly Command[]) {
    commands.forEach((command) => this.addCommand(command));
    return this;
  }
  /**
   * Convert a list of strings into a list of `PathSegments` objects.
   *
   * This function is aimed at the output of the rough.js library.
   * It does not support all legal commands.
   * @param strings These are the inputs.
   * @returns The path segments generated by the strings.
   * @throws Any problem interpreting the input will cause this method to throw an `Error`.
   * It's ugly.
   * It's aimed at someone in the debugger, not an end user.
   */
  static fromStrings(strings: readonly string[]): PathBuilder[] {
    let s = strings.join(" ");
    const allSegments: PathBuilder[] = [];
    let current: PathBuilder | undefined;
    while (true) {
      // Remove leading whitespace.
      s = s.replace(/^ */, "");
      if (s == "") {
        break;
      }
      let result = mCommand.exec(s);
      if (result) {
        const x = parseFloatX(result[1]);
        const y = parseFloatX(result[2]);
        if (x === undefined || y === undefined) {
          console.error(result, x, y, this);
          throw new Error("wtf");
        }
        if (current) {
          allSegments.push(current);
        }
        current = this.M(x, y);
        s = result[3];
        continue;
      }
      if (current) {
        result = lCommand.exec(s);
        if (result) {
          const x = parseFloatX(result[1]);
          const y = parseFloatX(result[2]);
          if (x === undefined || y === undefined) {
            console.error(result, x, y, this);
            throw new Error("wtf");
          }
          current = current.L(x, y);
          s = result[3];
          continue;
        }
        result = qCommand.exec(s);
        if (result) {
          const x1 = parseFloatX(result[1]);
          const y1 = parseFloatX(result[2]);
          const x2 = parseFloatX(result[3]);
          const y2 = parseFloatX(result[4]);
          if (
            x1 === undefined ||
            y1 === undefined ||
            x2 === undefined ||
            y2 === undefined
          ) {
            console.error(result, x1, y1, x2, y2, this);
            throw new Error("wtf");
          }
          current = current.Q(x1, y1, x2, y2);
          s = result[5];
          continue;
        }
        result = cCommand.exec(s);
        if (result) {
          const x1 = parseFloatX(result[1]);
          const y1 = parseFloatX(result[2]);
          const x2 = parseFloatX(result[3]);
          const y2 = parseFloatX(result[4]);
          const x3 = parseFloatX(result[5]);
          const y3 = parseFloatX(result[6]);
          if (
            x1 === undefined ||
            y1 === undefined ||
            x2 === undefined ||
            y2 === undefined ||
            x3 === undefined ||
            y3 === undefined
          ) {
            console.error(result, x1, y1, x2, y2, x3, y3, this);
            throw new Error("wtf");
          }
          current = current.C(x1, y1, x2, y2, x3, y3);
          s = result[7];
          continue;
        }
      }
      console.error(s);
      throw new Error("wtf");
    }
    if (current) {
      allSegments.push(current);
    }
    return allSegments;
  }

  /**
   * Create a new `PathBuilder`.
   *
   * Note that all paths start with an M command.
   * This method is sometimes a convenient way to create a new PathBuild that is guaranteed to be in a valid state.
   * @param x Begin the following `Command` here.
   * @param y Begin the following `Command` here.
   * @returns A new `PathBuilder` containing a single M command.
   */
  static M(x: number, y: number): PathBuilder {
    const result = new PathBuilder();
    result.M(x, y);
    return result;
  }
  readonly #commands: Command[] = [];
  get pathShape() {
    return new PathShape(this.#commands);
  }
  /**
   * If the last command was an M, store the info here.
   * Otherwise this will be `undefined`.
   */
  #recentMove:
    | undefined
    | {
        readonly x: number;
        readonly y: number;
        readonly outgoingAngle: number;
      };
  M(x: number, y: number, outgoingAngle = NaN): this {
    assertFinite(x, y);
    this.#recentMove = { x, y, outgoingAngle };
    return this;
  }
  /**
   *
   * @returns The final position and angle from the previous command.
   * Or `undefined` if there was no previous command.
   */
  private previous() {
    return this.#recentMove ?? this.#commands.at(-1);
  }

  /**
   * Add an H command to `this`.
   *
   * More precisely, add an equivalent L command.
   * @param x The argument for the H command.
   * I.e. the x of the final position.
   * @returns this.
   */
  H(x: number) {
    const previous = this.previous()!;
    this.addCommand(new LCommand(previous.x, previous.y, x, previous.y));
    return this;
  }

  /**
   * Add a V command to `this`.
   *
   * More precisely, add an equivalent L command.
   * @param y The argument for the V command.
   * I.e. the y of the final position.
   * @returns `this`.
   */
  V(y: number): PathBuilder {
    const previous = this.previous()!;
    this.addCommand(new LCommand(previous.x, previous.y, previous.x, y));
    return this;
  }

  /**
   * Append an L command to `this`.
   * @param x The x argument for the L command.
   * I.e. the x of the final position.
   * @param y The y argument for the L command.
   * I.e. the y of the final position.
   * @returns `this`.
   */
  L(x: number, y: number): PathBuilder {
    const previous = this.previous()!;
    this.addCommand(new LCommand(previous.x, previous.y, x, y));
    return this;
  }
  Q(x1: number, y1: number, x: number, y: number) {
    const previous = this.previous()!;
    this.addCommand(
      QCommand.controlPoints(previous.x, previous.y, x1, y1, x, y)
    );
    return this;
  }
  /**
   * This adds a new Q command to the shape.
   * The caller explicitly supplies the second control point.
   * This automatically computes the first control point.
   * This assumes the incoming angle is horizontal and the outgoing angle is vertical.
   * @param x The x for both control points.
   * @param y The y for the final control point.
   */
  Q_HV(x: number, y: number) {
    const previous = this.previous()!;
    return this.Q(x, previous.y, x, y);
  }
  /**
   * This adds a new Q command to the shape.
   * The caller explicitly supplies the second control point.
   * This automatically computes the first control point.
   * This assumes the incoming angle is vertical and the outgoing angle is horizontal.
   * @param x The x for the final control point.
   * @param y The y for both control points.
   */
  Q_VH(x: number, y: number) {
    const previous = this.previous()!;
    return this.Q(previous.x, y, x, y);
  }
  /**
   *
   * @param x The end point.
   * @param y The end point.
   * @param finalAngle The angle at the end point.
   * @param initialAngle The angle at the beginning.
   * By default this is read from the previous command.
   * @returns `this`.
   */
  Q_angles(x: number, y: number, finalAngle: number, initialAngle?: number) {
    const previous = this.previous()!;
    initialAngle ??= previous.outgoingAngle;
    if (initialAngle === undefined) {
      throw new Error("wtf");
    }
    this.addCommand(
      QCommand.angles(previous.x, previous.y, initialAngle, x, y, finalAngle)
    );
    return this;
  }
  C(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    const previous = this.previous()!;
    this.addCommand(new CCommand(previous.x, previous.y, x1, y1, x2, y2, x, y));
    return this;
  }
  /**
   * Add a new circle to the path starting and ending at the current point.
   * @param cx The center of the circle.
   * @param cy The center of the circle.
   * @param direction Clockwise or counterclockwise.
   * The direction does __not__ matter for a simple fill or stroke.
   * However, it can make a difference with animations an special effects.
   * @returns `this`.
   */
  circle(cx: number, cy: number, direction: "cw" | "ccw" = "cw") {
    const previous = this.previous()!;
    const x0 = previous.x;
    const y0 = previous.y;
    const fromAngle = Math.atan2(y0 - cy, x0 - cx);
    const radius = Math.hypot(y0 - cy, x0 - cx);
    const forward = direction == "cw" ? 1 : -1;
    const toAngle = fromAngle + Math.PI * 2 * forward;
    const getAngle = makeLinear(0, fromAngle, 1, toAngle);
    function f(t: number): Point {
      switch (t) {
        case 0:
        case 1: {
          return previous;
        }
        default: {
          const angle = getAngle(t);
          const relative = polarToRectangular(radius, angle);
          return { x: cx + relative.x, y: cy + relative.y };
        }
      }
    }
    //const log = new Array();
    function fAndLog(t: number): Point {
      const result = f(t);
      // log.push({
      //   t,
      //   angle: (getAngle(t) / Math.PI) * 180,
      //   x: result.x,
      //   y: result.y,
      // });
      return result;
    }
    const numberOfSegments = 8;
    this.addParametricPath(fAndLog, numberOfSegments);
    //console.table(log);
    return this;
  }
  /**
   * Add an arc of a circle to the path.
   * Start at the current point.
   * Rotate around (cx,cy).
   * End at (x,y).
   * @param cx The center of the circle.
   * @param cy The center of the circle.
   * @param x Where to end.
   * @param y Where to end.
   * @param direction Clockwise or counterclockwise.
   * Flipping this value will draw a complementary arc.
   * The two together would form a complete circle.
   * @returns `this`
   */
  arc(cx: number, cy: number, x: number, y: number, direction: "cw" | "ccw") {
    const previous = this.previous()!;
    const x0 = previous.x;
    const y0 = previous.y;
    let fromAngle = positiveModulo(Math.atan2(y0 - cy, x0 - cx), Math.PI * 2);
    const fromRadius = Math.hypot(y0 - cy, x0 - cx);
    let toAngle = positiveModulo(Math.atan2(y - cy, x - cx), Math.PI * 2);
    const toRadius = Math.hypot(y - cy, x - cx);
    if (direction == "cw") {
      if (fromAngle > toAngle) {
        toAngle += Math.PI * 2;
      }
    } else {
      if (fromAngle < toAngle) {
        fromAngle += Math.PI * 2;
      }
    }
    const angleTraversed = Math.abs(fromAngle - toAngle);
    const numberOfSegments = Math.ceil(angleTraversed * 1.17 + 0.0001);
    const getRadius = makeLinear(0, fromRadius, 1, toRadius);
    const getAngle = makeLinear(0, fromAngle, 1, toAngle);
    function f(t: number): Point {
      switch (t) {
        case 0: {
          return previous;
        }
        case 1: {
          return { x, y };
        }
        default: {
          const relative = polarToRectangular(getRadius(t), getAngle(t));
          return { x: cx + relative.x, y: cy + relative.y };
        }
      }
    }
    return this.addParametricPath(f, numberOfSegments);
  }
  /**
   * Add a path described by a TypeScript function.
   * @param f An input of 0 should return the point at the beginning of the path.
   * An input of 1 should return the point at the end of the path.
   * Other inputs in that range will cause the output to move smoothly.
   * @param numberOfSegments How many Q commands to create.
   * More gives you more detail.
   * @returns `this`.
   */
  addParametricPath(f: ParametricFunction, numberOfSegments: number) {
    // This idea was called math-to-path in previous incarnations.
    // This version is better because it fills a PathBuilder rather
    // than creating a string.  And this version fixes a few bugs.
    if (numberOfSegments <= 0) {
      throw new Error("wtf");
    }
    const ε = 0.0001 / numberOfSegments;
    const samples = initializedArray(numberOfSegments + 1, (index) => {
      const t = index / numberOfSegments;
      const point = f(t);
      const direction = getDirection(f, t, ε);
      return { t, point, direction };
    });
    if (samples.some((sample) => !isFinite(sample.direction))) {
      const { x, y } = samples[0].point;
      assertFinite(x, y);
      if (
        samples.some((sample) => sample.point.x != x || sample.point.y != y)
      ) {
        throw new Error(
          "Unable to create a path from this function.  Unable to compute the derivative."
        );
      }
      // All of the points are identical so none of the derivatives exist.
      for (let i = 0; i < numberOfSegments; i++) {
        this.Q(x, y, x, y);
      }
    } else {
      const segments = initializedArray(numberOfSegments, (index) => ({
        from: samples[index],
        to: samples[index + 1],
      }));
      segments.forEach((segment) => {
        this.Q_angles(
          segment.to.point.x,
          segment.to.point.y,
          segment.to.direction,
          segment.from.direction
        );
      });
    }
    return this;
  }
}

// MARK: PathShape Support

export type ParametricFunction = (t: number) => Point;

/**
 * What direction is the output of the given function moving at the given time?
 *
 * Basically a derivative in more dimensions.
 *
 * This "quick" version of the function is not always as accurate as I'd like.
 * "Quickly" is a relative term.
 * (None of this code has been optimized yet.)
 * See `getDirection()` for a more accurate version of this function.
 * @param f Find the derivative of this function.
 * @param t Take the derivative at this time.
 * @param ε A small value that we can add to t or subtract from t, to estimate the derivative.
 * @returns An angle, in a form suitable for Math.tan().  Or NaN in case of any errors.
 */
function getDirectionQuickly(f: ParametricFunction, t: number, ε: number) {
  if (!(t >= 0 && t <= 1)) {
    throw new Error("Expected 0 ≤ t ≤ 1");
  }
  const fromInput = Math.max(0, t - ε);
  const fromOutput = f(fromInput);
  const toInput = Math.min(1, t + ε); // TODO port this fix back to ../../chuzzle/src/math-to-path.ts
  const toOutput = f(toInput);
  const Δx = toOutput.x - fromOutput.x;
  const Δy = toOutput.y - fromOutput.y;
  if (Δx == 0 && Δy == 0) {
    return NaN;
  }
  return Math.atan2(Δy, Δx);
}

/**
 * What direction is the output of the given function moving at the given time?
 *
 * Basically a derivative in more dimensions.
 * @param f Find the derivative of this function.
 * @param t Take the derivative at this time.
 * @param ε A small value that we can add to t or subtract from t, to estimate the derivative.
 * @returns An angle, in a form suitable for Math.tan().  Or NaN in case of any errors.
 */
function getDirection(f: ParametricFunction, t: number, ε: number) {
  // We can't ask for getDirectionQuickly(f, t, 0),
  // so we extrapolate from two nearby inputs.
  const θ2 = getDirectionQuickly(f, t, ε * 2);
  const θ1 = getDirectionQuickly(f, t, ε * 1);
  const θDiff = θ2 - θ1;
  const θ0 = θ1 - θDiff;
  return θ0;
}

const afterCommand = " *";
const number = "(-?[0-9]+\\.?[0-9]*(?:[eE][-+]?[0-9]+)?)";
/**
 * Between two arguments you can have
 * * One or more spaces,
 * * a comma with optional spaces around it, _or_
 * * if the second argument starts with a minus then the empty string can separate two arguments.
 */
const between = "(?: *[, ] *|(?=-))";
const mCommand = new RegExp(
  `^M${afterCommand}${number}${between}${number}(.*)$`
);
const mCommandRelative = new RegExp(
  `^m${afterCommand}${number}${between}${number}(.*)$`
);
const lCommand = new RegExp(
  `^L${afterCommand}${number}${between}${number}(.*)$`
);
const lCommandContinuation = new RegExp(
  `^${between}${number}${between}${number}(.*)$`
);
const lCommandRelative = new RegExp(
  `^l${afterCommand}${number}${between}${number}(.*)$`
);
const hCommand = new RegExp(`^H${afterCommand}${number}(.*)$`);
const hCommandRelative = new RegExp(`^h${afterCommand}${number}(.*)$`);
const vCommand = new RegExp(`^V${afterCommand}${number}(.*)$`);
const vCommandRelative = new RegExp(`^v${afterCommand}${number}(.*)$`);
const vCommandContinuation = new RegExp(`^${between}${number}(.*)$`);
const hCommandContinuation = vCommandContinuation;
const qCommand = new RegExp(
  `^Q${afterCommand}${number}${between}${number}${between}${number}${between}${number}(.*)$`
);
const qCommandContinuation = new RegExp(
  `^${between}${number}${between}${number}${between}${number}${between}${number}(.*)$`
);
const qCommandRelative = new RegExp(
  `^q${afterCommand}${number}${between}${number}${between}${number}${between}${number}(.*)$`
);
const cCommand = new RegExp(
  `^C${afterCommand}${number}${between}${number}${between}${number}${between}${number}${between}${number}${between}${number}(.*)$`
);
const cCommandContinuation = new RegExp(
  `^${between}${number}${between}${number}${between}${number}${between}${number}${between}${number}${between}${number}(.*)$`
);
const cCommandRelative = new RegExp(
  `^c${afterCommand}${number}${between}${number}${between}${number}${between}${number}${between}${number}${between}${number}(.*)$`
);
const zCommand = new RegExp("^[zZ](.*)$");

/**
 * If the user enters a path string (like in `path-debugger.html`) that is invalid
 * we want to give a good error message back to the user.
 */
export class PathShapeError extends Error {
  constructor(message: string, readonly where: string) {
    super(message);
  }
}

// MARK: PathShape

/**
 * This is a way to manipulate a path shape.
 * I.e. to create a string like "path('M 1,2 L 3,5')".
 *
 * This class is read only.
 * If you need to append commands one at a time, consider a `PathBuilder` object.
 * If you wan to make more complicated changes, work on an array of `Command` objects.
 */
export class PathShape {
  /**
   * Create another path that will look the same, but backwards.
   * If you stroke or fill the path, it will look just like the original.
   * But some animations can tell the difference.
   */
  reverse() {
    return new PathShape(
      this.commands.toReversed().map((command) => command.reverse())
    );
  }
  /**
   * Convert a string into a `PathShape`.
   * @param d A valid d attribute for an `SVGPathElement`.
   * E.g "M1,2 L3,4".
   *
   * Or the result of a previous call to `JSON.stringify()` on a `PathShape`.
   * @returns The path segment generated by the string.
   * @throws An invalid input will throw a PathShapeError.
   */
  static fromString(d: string): PathShape {
    const fromJson = this.fromJson(d);
    if (fromJson) {
      return fromJson;
    }
    // TODO There is a strange bug in here.
    // I had a "c" in my string and it was silently ignored.
    // This routine does not handle "c" yet.
    // It will soon!
    // But until then I was expecting this to throw a PathShapeError.
    // See path-debugger.ts where I've embedded a good test string and additional notes.
    let remaining = d;
    let found: RegExpExecArray | null = null;
    const fail = (message: string): PathShapeError => {
      return new PathShapeError(message, remaining);
    };
    const parseOrThrow = (s: string): number => {
      const result = parseFloatX(s);
      if (result === undefined) {
        throw fail(`Invalid number: "${s}"`);
      }
      return result;
    };
    let x0 = 0;
    let y0 = 0;
    const commands: Command[] = [];
    const push = (command: Command) => {
      commands.push(command);
      x0 = command.x;
      y0 = command.y;
    };
    let recentMove: { readonly x0: number; readonly y0: number } | undefined;
    while (true) {
      // Remove leading whitespace.
      remaining = remaining.replace(/^ */, "");
      if (remaining == "") {
        break;
      }
      if ((found = mCommand.exec(remaining))) {
        x0 = parseOrThrow(found[1]);
        y0 = parseOrThrow(found[2]);
        recentMove = { x0, y0 };
        remaining = found[3];
        continue;
      }
      if ((found = mCommandRelative.exec(remaining))) {
        x0 += parseOrThrow(found[1]);
        y0 += parseOrThrow(found[2]);
        recentMove = { x0, y0 };
        remaining = found[3];
        while ((found = lCommandContinuation.exec(remaining))) {
          const current = LCommand.relative(
            x0,
            y0,
            parseOrThrow(found[1]),
            parseOrThrow(found[2])
          );
          push(current);
          remaining = found[3];
        }
        continue;
      }
      if (!recentMove) {
        throw fail("Must start with an M command.");
      }
      if ((found = zCommand.exec(remaining))) {
        if (x0 != recentMove.x0 || y0 != recentMove.y0) {
          const current = new LCommand(x0, y0, recentMove.x0, recentMove.y0);
          push(current);
        }
        remaining = found[1];
        continue;
      }
      if ((found = lCommand.exec(remaining))) {
        const x = parseOrThrow(found[1]);
        const y = parseOrThrow(found[2]);
        const current = new LCommand(x0, y0, x, y);
        push(current);
        remaining = found[3];
        continue;
      }
      if ((found = lCommandRelative.exec(remaining))) {
        while (found) {
          const dx = parseOrThrow(found[1]);
          const dy = parseOrThrow(found[2]);
          const current = LCommand.relative(x0, y0, dx, dy);
          push(current);
          remaining = found[3];
          found = lCommandContinuation.exec(remaining);
        }
        continue;
      }
      if ((found = hCommand.exec(remaining))) {
        const x = parseOrThrow(found[1]);
        const current = new LCommand(x0, y0, x, y0);
        push(current);
        remaining = found[2];
        continue;
      }
      if ((found = hCommandRelative.exec(remaining))) {
        while (found) {
          const dx = parseOrThrow(found[1]);
          const current = new LCommand(x0, y0, x0 + dx, y0);
          push(current);
          remaining = found[2];
          found = hCommandContinuation.exec(remaining);
        }
        continue;
      }
      if ((found = vCommand.exec(remaining))) {
        const y = parseOrThrow(found[1]);
        const current = new LCommand(x0, y0, x0, y);
        push(current);
        remaining = found[2];
        continue;
      }
      if ((found = vCommandRelative.exec(remaining))) {
        while (found) {
          const dy = parseOrThrow(found[1]);
          const current = new LCommand(x0, y0, x0, y0 + dy);
          push(current);
          remaining = found[2];
          found = vCommandContinuation.exec(remaining);
        }
        continue;
      }
      if ((found = qCommand.exec(remaining))) {
        const x1 = parseOrThrow(found[1]);
        const y1 = parseOrThrow(found[2]);
        const x = parseOrThrow(found[3]);
        const y = parseOrThrow(found[4]);
        const current = QCommand.controlPoints(x0, y0, x1, y1, x, y);
        push(current);
        remaining = found[5];
        continue;
      }
      if ((found = qCommandRelative.exec(remaining))) {
        while (found) {
          const dx1 = parseOrThrow(found[1]);
          const dy1 = parseOrThrow(found[2]);
          const dx = parseOrThrow(found[3]);
          const dy = parseOrThrow(found[4]);
          const current = QCommand.relative(x0, y0, dx1, dy1, dx, dy);
          push(current);
          remaining = found[5];
          found = qCommandContinuation.exec(remaining);
        }
        continue;
      }
      if ((found = cCommand.exec(remaining))) {
        while (found) {
          const x1 = parseOrThrow(found[1]);
          const y1 = parseOrThrow(found[2]);
          const x2 = parseOrThrow(found[3]);
          const y2 = parseOrThrow(found[4]);
          const x3 = parseOrThrow(found[5]);
          const y3 = parseOrThrow(found[6]);
          const current = new CCommand(x0, y0, x1, y1, x2, y2, x3, y3);
          push(current);
          remaining = found[7];
          found = cCommandContinuation.exec(remaining);
        }
        continue;
      }
      if ((found = cCommandRelative.exec(remaining))) {
        while (found) {
          const x1 = parseOrThrow(found[1]);
          const y1 = parseOrThrow(found[2]);
          const x2 = parseOrThrow(found[3]);
          const y2 = parseOrThrow(found[4]);
          const x3 = parseOrThrow(found[5]);
          const y3 = parseOrThrow(found[6]);
          const current = CCommand.relative(x0, y0, x1, y1, x2, y2, x3, y3);
          push(current);
          remaining = found[7];
          found = cCommandContinuation.exec(remaining);
        }
        continue;
      }
      // This could be a faulty path string.
      // This could be a command that I just haven't implemented yet.
      // And sometimes it's a small bit of syntax that I missed.
      throw fail("Confused.");
    }
    return new this(commands);
  }

  /**
   * The inverse of JSON.stringify().
   *
   * See also PathShape.fromString().  That works with JSON and other formats.
   * @param source The result of a call to JSON.stringify() on a PathShape object.
   * @returns A new PathShape object.  Any and all errors will cause this to return `undefined`.
   * @throws Nothing.  Returns `undefined` on any error.  There is some addition information if
   * you trace through the source code.  But I don't need to implement a JSON tester/debugger.
   */
  static fromJson(source: string): PathShape | undefined {
    try {
      type CommandDescription =
        | {
            command: "C";
            x0: number;
            y0: number;
            x1: number;
            y1: number;
            x2: number;
            y2: number;
            x: number;
            y: number;
          }
        | {
            command: "Q";
            x0: number;
            y0: number;
            x1: number;
            y1: number;
            x: number;
            y: number;
            creationInfo: QCreationInfo;
          }
        | { command: "L"; x0: number; y0: number; x: number; y: number };
      // '{"commands":[{"command":"Q","x0":7.5,"y0":-7.5,"x1":7.5,"y1":-9.375,"x":5.625,"y":-9.375,"creationInfo":{"source":"controlPoints"}}]}'
      // The following line throws a lot of exceptions, by design.
      // If you checked "pause on caught exceptions", and you are here,
      // just hit resume.
      const sourceCommands: CommandDescription[] = JSON.parse(source).commands;
      const commands: Command[] = sourceCommands.map((sourceCommand) => {
        switch (sourceCommand.command) {
          case "C": {
            const { x0, y0, x1, y1, x2, y2, x, y } = sourceCommand;
            return new CCommand(x0, y0, x1, y1, x2, y2, x, y);
          }
          case "L": {
            const { x0, y0, x, y } = sourceCommand;
            return new LCommand(x0, y0, x, y);
          }
          case "Q": {
            const { x0, y0, x, y, creationInfo } = sourceCommand;
            switch (creationInfo.source) {
              case "angles": {
                const { angle0, angle } = creationInfo;
                const result = QCommand.angles(x0, y0, angle0, x, y, angle);
                if (
                  result.creationInfo.source != "angles" ||
                  result.creationInfo.success != creationInfo.success
                ) {
                  // There are some legit reasons this could happen but they should be very rare.
                  console.warn("different", sourceCommand, result);
                }
                return result;
              }
              case "controlPoints": {
                const { x1, y1 } = sourceCommand;
                const result = QCommand.controlPoints(x0, y0, x1, y1, x, y);
                return result;
              }
              case "line": {
                return QCommand.line4(x0, y0, x, y);
              }
              default: {
                throw new Error(
                  `Unknown source: "${(creationInfo as QCreationInfo).source}"`
                );
              }
            }
          }
          default: {
            throw new Error(
              `Unknown command: "${(sourceCommand as any).command}"`
            );
          }
        }
      });
      return new PathShape(commands);
    } catch (reason: unknown) {
      // This could happen a lot.
      return undefined;
    }
  }

  /**
   * Use this to animate from any path string to any other path string.
   *
   * This function is very generic and works in a lot of cases.  However, it don't
   * work well.  This is a great prototype.  But in general you should use a
   * smarter version of this.
   * @param other You want to morph from `this` to `other`.
   * @returns A new pair of path strings.  The first looks like `this` and the second
   * looks like `other`.  However, these might use different commands to get the same
   * appearance.  The two result strings will have compatible commands, so you can
   * morph between them with normal CSS animations.
   */
  matchForMorph(other: PathShape): [pathForThis: string, pathForOther: string] {
    const commandsForThis = this.commands.map((command) => command.toCubic());
    const commandsForOther = other.commands.map((command) => command.toCubic());
    if (commandsForThis.length != commandsForOther.length) {
      const { shorter, longer } =
        commandsForThis.length < commandsForOther.length
          ? { shorter: commandsForThis, longer: commandsForOther }
          : { shorter: commandsForOther, longer: commandsForThis };
      if (shorter.length == 0) {
        // One list of segments was completely empty and the other was not.
        throw new Error("can't morph something into nothing");
      }
      /**
       * This will be greater than one.
       */
      const ratio = longer.length / shorter.length;
      const replacementForShorter: CCommand[] = [];
      shorter.forEach((command, index) => {
        const desiredLength = Math.round((index + 1) * ratio);
        //const howManyToAdd = Math.ceil(replacementForShorter.length - desiredLength);
        // TODO The command should really be split.  https://pomax.github.io/bezierinfo/#splitting
        // Copying is a temporary solution, just enough to get morphing working.
        while (replacementForShorter.length < desiredLength) {
          replacementForShorter.push(command);
        }
      });
      shorter.length = 0;
      shorter.push(...replacementForShorter);
    }
    if (commandsForThis.length != commandsForOther.length) {
      throw new Error("wtf");
    }
    function fullSplit(commands: readonly Command[]) {
      return PathShape.cssifyPath(
        commands.map((command) => new PathShape([command]).rawPath).join()
      );
    }
    const pathForThis = fullSplit(commandsForThis);
    const pathForOther = fullSplit(commandsForOther);
    return [pathForThis, pathForOther];
  }
  readonly commands: readonly Command[];
  get endX() {
    // Defined HERE (https://www.youtube.com/watch?v=4yVOFGLoeIE for details)
    return this.commands.at(-1)?.x;
  }
  get endY() {
    return this.commands.at(-1)?.y;
  }
  get startX() {
    return this.commands.at(0)?.x0;
  }
  get startY() {
    return this.commands.at(0)?.y0;
  }
  constructor(commands: readonly Command[]) {
    this.commands = [...commands];
  }

  static cssifyPath(rawPath: string) {
    return `path('${rawPath}')`;
  }
  get cssPath() {
    return PathShape.cssifyPath(this.rawPath);
  }
  makeElement() {
    const pathElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    const cssPath = this.cssPath;
    pathElement.style.d = cssPath;
    if (pathElement.style.d == "") {
      console.error(cssPath, pathElement);
      throw new Error("wtf");
    }
    return pathElement;
  }
  /**
   * Internally we do not store any M commands.
   * If the next segment starts at exactly the same place as the previous segment ends, we assume they are connected.
   * Otherwise, they are not.
   * If these two commands are not connected, and we are generating a CSS friendly path string, then insert an M here.
   *
   * Note that there is no margin of error.
   * I'm looking for cases where we created the starting point of one command by _copying_ it from the ending point of
   * another.
   *
   * I am explicitly ignoring the case where you want to force and M.
   * That makes my life easier!
   * That's the same reason I'm using rounded corners and end caps.
   * @param before The first command.  This can be undefined if `after` is the first in a list of commands.
   * @param after The second command.  This can be undefined if `before` is the last in a list of commands.
   * @returns true if we need to insert an M command between the two given commands.
   */
  static needAnM(
    before: Command | undefined,
    after: Command | undefined
  ): boolean {
    if (!after) {
      // If there is no command `after` the `M` command, then the `M` command would clearly be unnecessary.
      return false;
    }
    if (!before) {
      // If `after` is the first command in a list then we absolutely need an `M` command before it.
      return true;
    }
    if (before.x != after.x0) {
      // There was a jump between the two commands, so we need to insert an `M` command to describe the jump.
      return true;
    }
    if (before.y != after.y0) {
      // There was a jump between the two commands, so we need to insert an `M` command to describe the jump.
      return true;
    }
    // The second command starts exactly where there the first ends.  So there is no need for an M.
    return false;
  }
  /**
   * Something that you might feed to the `d` __attribute__ of a `<path>` element.
   */
  get rawPath() {
    // TODO
    // Should do a full loopback test.  Currently I think we will interpret a Z or z correctly.
    // However, sometimes we insert a spurious Z.

    return this.splitOnMove()
      .flatMap((segment) => {
        const result = [
          `M ${formatForSvg(segment.startX)},${formatForSvg(segment.startY)}`,
        ];
        segment.commands.forEach((command) => result.push(command.asString));
        if (segment.startX == segment.endX && segment.startY == segment.endY) {
          result.push("Z");
        }
        return result;
      })
      .join(" ");
  }
  /**
   * Split this PathShape into smaller PathShapes.
   * Break it on the move (M) commands, so each of the
   * new shapes can be use independently.
   *
   * Undo with `PathShape.join()`.
   */
  splitOnMove() {
    const pieces: Command[][] = [];
    let current: Command[] = [];
    this.commands.forEach((command) => {
      if (PathShape.needAnM(current.at(-1), command)) {
        current = [];
        pieces.push(current);
      }
      current.push(command);
    });
    return pieces.map(
      (piece) =>
        // Asserted HERE (https://www.youtube.com/watch?v=4yVOFGLoeIE for details)
        new PathShape(piece) as PathShape & {
          readonly startX: number;
          readonly startY: number;
          readonly endX: number;
          readonly endY: number;
        }
    );
  }
  /**
   * @param shapes The shapes to merge
   * @returns A single shape that includes all of the input shapes
   */
  static join(
    pieces: { Δx: number; Δy: number; shape: PathShape }[]
  ): PathShape {
    return new PathShape(
      pieces.flatMap(({ Δx, Δy, shape }) => shape.translate(Δx, Δy).commands)
    );
  }
  convertToCubics(): PathShape {
    return new PathShape(this.commands.map((command) => command.toCubic()));
  }
  translate(Δx: number, Δy: number): PathShape {
    return new PathShape(
      this.commands.map((command) => command.translate(Δx, Δy))
    );
  }
  transform(matrix: DOMMatrix): PathShape {
    return new PathShape(
      this.commands.map((command) => command.transform(matrix))
    );
  }

  /**
   * Create a path described by a TypeScript function.
   * @param f An input of 0 should return the point at the beginning of the path.
   * An input of 1 should return the point at the end of the path.
   * Other inputs in that range will cause the output to move smoothly.
   * @param numberOfSegments How many Q commands to create.
   * More gives you more detail.
   * @returns A new PathShape object.
   */
  static parametric(
    f: ParametricFunction,
    numberOfSegments: number
  ): PathShape {
    const start = f(0);
    const result = PathBuilder.M(start.x, start.y).addParametricPath(
      f,
      numberOfSegments
    ).pathShape;
    return result;
  }
  /**
   * This is similar to parametric(), but this version is glitch-free.
   *
   * This version removes some ugly glitches.
   * That's any place where the graphic suddenly goes way off on a long, thin parabola.
   * These were artifacts of my algorithm, not the requested function.
   *
   * In exchange for this, you don't know for certain how many segments will be in the path.
   * We start with the requested number, then add more as necessary to patch the glitches.
   * This would cause a problem for interpolation.
   * @param f The function to turn into a path.
   * @param initialSegments The ideal numbers of segments in the path.
   * @returns A new path approximating the function, f.
   * Or `undefined` to say we gave up.
   */
  static glitchFreeParametric(
    f: ParametricFunction,
    initialSegments: number
  ): PathShape {
    const result = this.#glitchFreeParametric(f, initialSegments, 0);
    return assertNonNullable(result);
  }
  static #caliper = new PathCaliper();
  /**
   * This is a helper function for glitchFreeParametric().
   * @param f The function to turn into a path.
   * @param initialSegments The ideal numbers of segments in the path.
   * @param recursionCount 0 for calls from any other function.
   * @returns A new path approximating the function, f.
   * Or `undefined` to say we gave up.
   */
  static #glitchFreeParametric(
    f: ParametricFunction,
    initialSegments: number,
    recursionCount: number
  ): PathShape | undefined {
    if (recursionCount > 0) {
      console.log(recursionCount);
    }
    if (recursionCount >= 4) {
      // Avoid an infinite loop / stack overflow.
      console.log("⚝");
      return undefined;
    }
    const firstTry = this.parametric(f, initialSegments);
    const commands = firstTry.commands.map((command, index, array) => {
      const initialT = index / array.length;
      const finalT = (index + 1) / array.length;
      return { command, initialT, finalT };
    });
    let index = 0;
    const isGood = (command: Command): boolean => {
      const subPath = new this([command]);
      this.#caliper.d = subPath.rawPath;
      const actualLength = this.#caliper.length;
      const shortestLength = Math.hypot(
        command.x0 - command.x,
        command.y0 - command.y
      );
      const ratio = actualLength / shortestLength;
      // !isFinite(ratio) is because of that silly degenerate case where we get a point, a circle of radius 0.
      return ratio < 2 || !isFinite(ratio);
    };
    while (index < commands.length) {
      const command = commands[index].command;
      if (isGood(command)) {
        index++;
      } else {
        const startIndex = Math.max(0, index - 1);
        /**
         * The last index to include is the one *before* this value.
         */
        let endIndex = index + 1;
        while (endIndex < commands.length) {
          const nextCommand = commands[endIndex].command;
          endIndex++;
          if (isGood(nextCommand)) {
            break;
          }
        }
        const initialT = commands[startIndex].initialT;
        const finalT = commands[endIndex - 1].finalT;
        const localTime = makeLinear(0, initialT, 1, finalT);
        const newF = (t: number) => f(localTime(t));
        const numberOfCommandsToReplace = endIndex - startIndex;
        const numberOfReplacementCommands = numberOfCommandsToReplace + 1;
        const replacement = this.#glitchFreeParametric(
          newF,
          numberOfReplacementCommands,
          recursionCount + 1
        );
        if (replacement === undefined) {
          // We hit a limit on our recursion.
          if (recursionCount > 0) {
            // If this is not the top level recursion,
            // pass the message up.
            return undefined;
          }
          // We are at the top level of recursion.
          // Use a simpler approach.
          // Connect the two endpoints with a straight line.
          const segmentInfo = commands[index];
          const { x0, y0, x, y } = segmentInfo.command;
          segmentInfo.command = QCommand.line4(x0, y0, x, y);
          index++;
        } else {
          //
          commands.splice(
            startIndex,
            numberOfCommandsToReplace,
            ...replacement.commands.map(
              (
                command,
                index,
                array
              ): {
                command: Command;
                initialT: number;
                finalT: number;
              } => {
                const initialT = localTime(index / array.length);
                const finalT = localTime((index + 1) / array.length);
                return { command, initialT, finalT };
              }
            )
          );
          index += numberOfReplacementCommands;
        }
      }
    }
    return new PathShape(commands.map((command) => command.command));
    // New and improved thoughts:
    // This is focused on deglitching.
    // There are lots of possibilities for smoothing and other general improvements.
    // But those are a distraction.
    // If I'm right, the glitches are rare events that I can catch and fix.
    // Basically, any time you see a parabola segment get really big.
    // It's possible that the input function really was shaped like a long, thin parabola segment.
    // But it's unlikely that our normal algorithm would break the function up like that.
    // An artist who's drawing in inkscape might know what he's doing and use one long segment where it works.
    // But even if such a segment existed in the function, we would still chop it into pieces.
    //
    // Sometimes things aren't huge, but they still jump suddenly.
    // I'm working under the assumption that this is the same issue.
    // Maybe a smaller version, since the glitch didn't go across the screen, but still it was far enough off course to notice.
    //
    // If a segment is an error command, a failed Q, we ignore it.
    // It is being painted as a line segment,
    // the shortest distance between the end points,
    // exactly the opposite of the glitches I'm looking for.
    //
    // The measurement is the (length of the segment) / (shortest distance between the end points)
    // Off the top of my head, 2 seems like a reasonable cutoff.
    // We can find out what the value is for circles made of 8 segments.
    // This is what I consider normal and acceptable, so it's a good point of comparison.
    //
    // We don't care about interpolating this path against another path.
    // They might have different numbers of segments because of this algorithm.
    //
    // Basic idea:  If we find a bad Q command, we break it in half.
    // We add one new sample half way between those two endpoints.
    //
    // Issue:  We want limits.  Should we prioritize these?  Largest ones first?
    // In case we right out of fixes.
    // We want to have a hard limit on the maximum number of fixes.
    // Ideally that's not a problem.
    // I'm thinking either there are just a few glitches, or there's a serious problem.
    // In the latter case, if I find too many glitches, I just give up.
    //
    // Plan B:  If I can't fix a bad Q command, I could always make it a line segment.
    // Does that help?
    // It's probably an improvement over leaving the glitches in. ? ?
    //
    // Issue:  After breaking, one half could still be bad.
    // Record that case in the log.  I don't know if this is common or not.
    // There's no reason we shouldn't recursively try to break that bad things into smaller pieces.
    // With a limit on how far we can go to prevent an infinite loop or exponential blowup.
    //
    // Improvement:  Try to spread the change out.
    // If the bad segment is at the front or end of the path, use the simple approach described above.
    // Otherwise, replace the glitchy piece, its predecessor and its successor.
    // Replace all three of them with four new segments, each taking 3/4 of the space.
    // Maybe one of those points was the problem:
    // It was not just a lack of precision, but a little bit of bad luck.
    // If there are multiple bad segments in a row, join them and their two neighbors all at once.
  }
  /**
   * Avoid displaying numbers like 6.661338147750939e-16.
   * Instead display 0.
   *
   * This is especially relevant with `console.table()`.
   * By default it will display 6.661338147750939e-16 as "6.6613…" or similar.
   * You have to make that column really wide to see that it's actually very close to 0, not 6.66.
   *
   * I tweaked the implementation to look good in my example.
   * I'm not sure I'd trust this outside of debug code.
   * @param angle The angle you want to display.
   * @returns A value that is very similar to the input, but slightly more likely to be 0.
   */
  static fixAngleRounding(angle: number) {
    return angle + 400 - 400;
  }
  static toDegrees(angle: number): number {
    return Math.round(angle * degreesPerRadian * 100) / 100;
  }
  dump() {
    const data = this.commands.map((command, index) => {
      const {
        x0,
        y0,
        x,
        y,
        incomingAngle,
        outgoingAngle,
        command: c,
      } = command;
      const element = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      element.setAttribute("d", new PathShape([command]).rawPath);
      const length = element.getTotalLength();
      const previous = this.commands[index - 1];
      const notConnectedToPrevious = PathShape.needAnM(previous, command);
      const difference = notConnectedToPrevious
        ? {}
        : {
            difference: PathShape.toDegrees(
              angleBetween(previous.outgoingAngle, incomingAngle)
            ),
          };
      return {
        x0,
        y0,
        x,
        y,
        incomingAngle: PathShape.toDegrees(incomingAngle),
        outgoingAngle: PathShape.toDegrees(outgoingAngle),
        length,
        c,
        ...difference,
      };
    });
    console.table(data);
    console.log(this.rawPath);
    console.log(JSON.stringify(this));
  }
}

type Ray = { x0: number; y0: number; angle: number };
export type Point = { readonly x: number; readonly y: number };

/**
 *
 * @param r1 A ray pointing to the desired intersection point.
 * This might be the incoming angle of a QCommand pointing from the first point of the command to the middle control point.
 * @param r2 Another ray pointing to the desired intersection point.
 * This might be **(180° +** the outgoing angle) pointing from the last point of a QCommand to the middle control point.
 * The Command objects always work with the angle going in the forward direction.
 * But this function is expecting both vectors to be pointing inward, not forward.
 * @returns If the two rays intersect in a single point, return that point.
 * Return undefined if the two rays completely miss each other, or if they overlap.
 * I am **explicitly** talking about **rays, not lines**.
 */
function findIntersection(r1: Ray, r2: Ray): Point | undefined {
  assertFinite(r1.x0, r1.y0, r1.angle, r2.x0, r2.y0, r2.angle);
  if (isNaN(r1.angle) || isNaN(r2.angle) || r1.angle == r2.angle) {
    return undefined;
  }
  const slope1 = Math.tan(r1.angle);
  const slope2 = Math.tan(r2.angle);
  const isVertical1 = Math.abs(slope1) * 100 > Number.MAX_SAFE_INTEGER;
  const isVertical2 = Math.abs(slope2) * 100 > Number.MAX_SAFE_INTEGER;
  if (isVertical1 && isVertical2) {
    // Notice the bug fix.
    // When I copied this from math-to-path.ts (which itself is copied from another project)
    // I changed if (αIsVertical || βIsVertical) to if (αIsVertical && βIsVertical)
    return undefined;
  }

  /**
   * If we drew a line segment with the same endpoints,
   * what angle would that line segment point?
   */
  const lineAngle = Math.atan2(r2.y0 - r1.y0, r2.x0 - r1.x0);
  const difference1 = angleBetween(r1.angle, lineAngle);
  const difference2 = angleBetween(r2.angle, lineAngle);
  if (difference1 == 0 || Math.abs(difference2) == Math.PI) {
    if (Math.abs(difference1) == Math.PI || difference2 == 0) {
      return undefined;
    }
    const x = (r1.x0 + r2.x0) / 2;
    const y = (r1.y0 + r2.y0) / 2;
    return { x, y };
  }
  //console.log({phil: Math.abs(difference2)<= Math.abs(difference1),raw1: r1.angle * degreesPerRadian, raw2:r2.angle * degreesPerRadian, difference1:difference1*degreesPerRadian, difference2:difference2*degreesPerRadian,totalDifference:(difference1+difference2)*degreesPerRadian})
  const side1 = Math.sign(difference1);
  const side2 = Math.sign(difference2);
  if (side1 != side2 || side1 == 0) {
    // 1 means the ray is pointing to one particular side of the line.
    //   It doesn't matter which side.
    //   All that matters is that this is consistent for both rays.
    // -1 means the ray is pointing to the opposite side of the line.
    // If the two rays are pointing to opposite sides of this line,
    //   Then they cannot intersect with each other.
    //   If think you see an intersection, you are probably thinking about lines rather than rays.
    // TODO what about ±180°⁈
    return undefined;
  }
  if (Math.abs(difference2) <= Math.abs(difference1) + radiansPerDegree) {
    // if Math.abs(difference2) < Math.abs(difference1) then the two rays are too far apart.
    //   They will not meet.  If you try to find the point where they meet, you will go
    //   backwards, to the wrong side, and the curve will be totally wrong.
    // If the two values are the same, then the rays will be parallel and never meet.
    // If they are really close, but not exactly parallel, then the curve will be really
    //   big and is probably a mistake.  I added 1° (1 * radiansPerDegree) to avoid this
    //   problem.
    return undefined;
  }

  if (isVertical1 || isVertical2) {
    const x = isVertical1 ? r1.x0 : r2.x0;
    const otherLine = isVertical1
      ? { ...r2, slope: slope2 }
      : { ...r1, slope: slope1 };
    const y = otherLine.slope * (x - otherLine.x0) + otherLine.y0;
    return { x, y };
  } else {
    const x =
      (r2.y0 - slope2 * r2.x0 - r1.y0 + slope1 * r1.x0) / (slope1 - slope2);
    const y = slope1 * (x - r1.x0) + r1.y0;
    return { x, y };
  }
}

function assertFromAngles(command: Command) {
  if (!(command instanceof QCommand)) {
    // I can't use assertClass() here because QCommand has a private constructor.
    throw new Error("wtf");
  }
  if (command.creationInfo.source != "angles") {
    throw new Error("wtf");
  }
  return command as QCommandFromAngles;
}

type CommandInfo = {
  command: QCommandFromAngles;
  /**
   * A value between 0 (inclusive) and `endT` (exclusive).
   *
   * `startT` is the parameter that I should apply to the function to know about the start of this path segment.
   */
  startT: number;
  /**
   * A value between `startT` (exclusive) and 1 (inclusive).
   *
   * `startT` is the parameter that I should apply to the function to know about the start of this path segment.
   */
  endT: number;
  /**
   * A good estimate of what the length of this curve should be.
   */
  polyLineLength: number;
  /**
   * The actual length of the curve we are displaying.
   */
  curveLength: number;
  /**
   * The error.
   *
   * Use this to decide what needs more attention and what is acceptable.
   * Our goal is to find places where the estimated curve does not match the desired curve very well.
   */
  metric: number;
};

/**
 * This provides a way to create a path from a parametric function.
 * This provides the same basic functionality as PathShape.parametric()
 * and PathShape.glitchFreeParametric().
 *
 * This class tries to feel out the function to automatically decide how many segments to use.
 * And the segments do not all need to be the same size.
 * So more detailed parts of the curve can receive a lot more segments than the boring parts of the curve.
 *
 * Ideally this could reduce the number of segments that we create to get similar quality.
 * I'm currently seeing about the same number of segments as when I manually tweak PathShape.parametric().
 * But I can't always manually tweak things, so the old way I'd probably add a lot of slack.
 * In that case I could reduce the number of segments.
 * ParametricToPath gives good results without the need for so much padding and guessing.
 *
 * This is a class, instead of a function, mostly for development.
 * This makes it easy for me to step through and see what's going on.
 */
export class ParametricToPath {
  static readonly #caliper = new PathCaliper();
  /**
   * Invariant:
   * * This array is sorted by the metric field, highest values at the end.
   * * The array is never empty.
   * * The startT and endT values of all of the elements in the array
   * will cover the range 0 - 1 with no gaps or duplicates.
   *
   * TODO Do we need a sorted list?
   * It seems like a simple depth first search would be fine.
   * The order doesn't seem to matter.
   * This was helpful in development, I could really see what was going on.
   * This will need a way to dump it's state if it hits the limit and has to stop
   * - But maybe that's only in development.
   * - It seems like running into that hard limit is a serious error, maybe an exception, in live code.
   * - Sometimes you want the best possible instead of failing, I guess.
   * - I like the idea of getting rid of the sorted list and its O(n²) nonsense.
   * - But can I really give up and not worry about a best alternative?
   * - Maybe on failure it returns undefined.
   * - If the caller wants he can ?? that into something safer like PathShape.parametric().
   *
   * TODO
   * - Are we worried about a glitch right before the request stage?
   * - I.e. a really ugly picture with something sticking way out and seriously distorting the bounding box.
   * - How about calling glitchFreeParametric() instead of parametric()?
   * - Need to make a small change to that so it exports the t values for each command.
   * - How does that work in extremes, like the butterfly curve, with lots of straight lines?
   */
  #commands: CommandInfo[];
  readonly #cutoff: number;
  constructor(
    readonly f: ParametricFunction,
    initialSegmentCount = 16,
    diagonal?: number | RealSvgRect
  ) {
    const initialPath = PathShape.parametric(f, initialSegmentCount);
    this.#commands = initialPath.commands
      .map((command, index, array): CommandInfo => {
        const startT = index / array.length;
        const endT = (index + 1) / array.length;
        return this.#createCommandInfo(startT, endT, assertFromAngles(command));
      })
      .sort((a, b) => a.metric - b.metric);
    if (diagonal === undefined) {
      ParametricToPath.#caliper.load(initialPath);
      diagonal = ParametricToPath.#caliper.getBBox();
    }
    if (typeof diagonal != "number") {
      diagonal = Math.hypot(diagonal.height, diagonal.width);
    }
    this.#cutoff = 0.001 * diagonal;
  }
  get commands(): readonly Readonly<CommandInfo>[] {
    return this.#commands;
  }
  /**
   * Maintain the order of the list.  Insert the new item into the correct position.
   * @param newCommandInfo To insert.
   */
  #insert(newCommandInfo: CommandInfo) {
    this.#commands.splice(
      this.#commands.findLastIndex(
        (commandInfo) => commandInfo.metric <= newCommandInfo.metric
      ) + 1,
      0,
      newCommandInfo
    );
  }
  #createCommandInfo(
    startT: number,
    endT: number,
    command: QCommandFromAngles
  ): CommandInfo {
    const subSegmentCount = 4;
    let polyLineLength = 0;
    {
      const endPoints: Point[] = [{ x: command.x0, y: command.y0 }];
      for (let i = 1; i < subSegmentCount; i++) {
        const internalPosition = i / subSegmentCount;
        const t = lerp(startT, endT, internalPosition);
        endPoints.push(this.f(t));
      }
      endPoints.push({ x: command.x, y: command.y });
      endPoints.forEach((start, index) => {
        const end = endPoints[index + 1];
        if (end) {
          polyLineLength += Math.hypot(start.x - end.x, start.y - end.y);
        }
      });
    }
    const curveLength = ParametricToPath.#caliper.measure(command);
    const metric = Math.abs(polyLineLength - curveLength);
    if (!command.creationInfo.success) {
      // TODO add additional penalties for the corners.
      /**
       * What about problems where we fall back to a straight line segments?
       * We also have to worry about the corners.
       * The visibility of the corner problem has nothing to do with the length of the segment.
       * (Possibly excepting a very small segment, who's length was around the size of its width.)
       * We could judge the size of the error by comparing the actual angle to the desired angle.
       * We'd need a constant or something to put that angle onto the same scale as the differences
       * in length.
       * Each of these issues is separate and cumulative.
       * The error associated with this segment will be the error that we compute for the length
       * plus the error of each corner.
       * If two straight pieces both touch, ignore the point between them, no penalty.
       * TODO!
       */
    }
    return {
      startT,
      endT,
      command,
      polyLineLength,
      curveLength,
      metric,
    };
  }
  /**
   * This is a simple wrapper around `addOne()`.
   * This is aimed at the console where you might not want to write a loop.
   * @param count How many items to add.
   */
  add(count: number) {
    for (let i = 0; i < count; i++) this.addOne();
  }
  /**
   * Take the worst item segment and break it into two.
   *
   * This will always add one more segment.
   * Consider calling `go()` instead.
   * `go()` will call this function in a loop until `done()`.
   * This function is public __only for development__ reasons.
   * @returns Debug info about the change.  Likely to change.
   */
  addOne() {
    const toSplit = this.#commands.pop()!;
    const { startT, endT } = toSplit;
    const midpointT = (startT + endT) / 2;
    const midPoint = this.f(midpointT);
    // From PathBuilder.addParametricPath():
    // const ε = 0.01 / numberOfSegments;
    // This is consistent with PathBuilder.addParametricPath.
    // As the segments are broken into smaller pieces,
    // ε scales linearly with them.
    const ε = 0.0001 * (midpointT - startT);
    const midPointAngle = getDirection(this.f, midpointT, ε);
    const firstCommand = QCommand.angles(
      toSplit.command.x0,
      toSplit.command.y0,
      toSplit.command.requestedIncomingAngle,
      midPoint.x,
      midPoint.y,
      midPointAngle
    );
    const firstCommandInfo = this.#createCommandInfo(
      startT,
      midpointT,
      firstCommand
    );
    this.#insert(firstCommandInfo);
    const secondCommand = QCommand.angles(
      midPoint.x,
      midPoint.y,
      midPointAngle,
      toSplit.command.x,
      toSplit.command.y,
      toSplit.command.requestedOutgoingAngle
    );
    const secondCommandInfo = this.#createCommandInfo(
      midpointT,
      endT,
      secondCommand
    );
    this.#insert(secondCommandInfo);
    return { toSplit, firstCommandInfo, secondCommandInfo };
  }
  /**
   *
   * @returns true if the curve is good enough and requires no more work.
   */
  done() {
    return this.commands.at(-1)!.metric < this.#cutoff;
  }
  /**
   * The main event.  Do as much process as needed then stop.
   * @param maxNewSegments This is aimed at keeping the program from running forever.
   * The default is currently way too log.
   */
  go(maxNewSegments = 50): void {
    for (let i = 0; i < maxNewSegments && !this.done(); i++) {
      this.addOne();
    }
  }
  /**
   * This can be slow.
   * It's reasonably to call once, but you probably don't want to call it in a loop.
   * And there is no caching, this will do work on every call.
   */
  get pathShape() {
    return new PathShape(
      this.#commands
        .toSorted((a, b) => a.startT - b.startT)
        .map(({ command }) => command)
    );
  }
  /**
   * Collect and return debug info.
   * @returns Some statics on the state of `this.#commands`.
   */
  summarize() {
    function summarizeArray(numbers: number[]) {
      numbers.sort((a, b) => a - b);
      const count = numbers.length;
      function rank(r: number) {
        const maxIndex = numbers.length - 1;
        const index = maxIndex * r;
        if (Number.isInteger(index)) {
          return numbers[index];
        } else {
          const lowIndex = Math.floor(index);
          const highIndex = lowIndex + 1;
          const where = index - lowIndex;
          const result = lerp(numbers[lowIndex], numbers[highIndex], where);
          return result;
        }
      }
      if (numbers.length < 2) {
        throw new Error("wtf");
      }
      const quartiles = initializedArray(5, (n) => rank(n / 4));
      let sx = 0;
      let sxx = 0;
      numbers.forEach((number) => {
        sx += number;
        sxx += number * number;
      });
      const mean = sx / count;
      const standardDeviation = Math.sqrt(
        (sxx - count * mean * mean) / (count - 1)
      );
      return {
        quartiles,
        mean,
        standardDeviation,
      };
    }
    return {
      polyLineLength: summarizeArray(
        this.#commands.map(({ polyLineLength }) => polyLineLength)
      ),
      curveLength: summarizeArray(
        this.#commands.map(({ curveLength }) => curveLength)
      ),
      metric: summarizeArray(this.#commands.map(({ metric }) => metric)),
      tCoverage: summarizeArray(
        this.#commands.map(({ startT, endT }) => endT - startT)
      ),
      generation: summarizeArray(
        this.#commands.map(({ startT, endT }) => -Math.log2(endT - startT))
      ),
      count: this.#commands.length,
    };
  }
  /**
   * A quick debug dump.
   * This sends a table to the console.
   */
  dump() {
    console.table(
      this.commands.map(({ startT, endT, metric, curveLength }) => {
        return {
          startT,
          tCoverage: endT - startT,
          generation: -Math.log2(endT - startT),
          metric,
          curveLength,
        };
      })
    );
  }
  /**
   * This is a metric I sometimes use for measuring errors.
   *
   * I know that if I create a circle with only 4 segments it won't look good.
   * But if I use 8, it will look good.
   * More importantly, numbers slightly bigger than 8 don't make a big difference.
   * I.e. I start to see diminishing marginal returns as I add more than 8 pieces.
   * This function shows that to me.
   *
   * Note that the algorithm now uses a polyline with 4 segments to go with each curve segment.
   * So you might want to multiply your input by 4 to see how well the new metric can estimate your errors.
   *
   * This function is not used in production.
   * It's only used for development, usually from the console.
   * @param numberOfChords What if I divide the circle into this many pieces?
   * Does not have to be an integer.
   * @returns The ratio of the arc of a circle and the chord of the same circle covering the same angle.
   * This gives us an idea how closely a line segment can approximate a curve.
   */
  static chordRatio(numberOfChords: number) {
    const arcLength = FULL_CIRCLE / numberOfChords;
    // Chord Length = 2 * radius * sin(arc length / (2 * radius))
    const chordLength = 2 * 1 * Math.sin(arcLength / (2 * 1));
    return arcLength / chordLength;
  }
}
(window as any).ParametricToPath = ParametricToPath;
