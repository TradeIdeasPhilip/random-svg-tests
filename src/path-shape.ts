import { initializedArray, makeLinear, parseFloatX } from "phil-lib/misc";
import {
  angleBetween,
  assertFinite,
  degreesPerRadian,
  lerp,
  polarToRectangular,
  positiveModulo,
} from "./utility";

export type Command = {
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
  // split into pieces
};

export class LCommand implements Command {
  constructor(
    public readonly x0: number,
    public readonly y0: number,
    public readonly x: number,
    public readonly y: number
  ) {
    assertFinite(x0, y0, x, y);
    this.asString = `L ${x},${y}`;
    this.outgoingAngle = this.incomingAngle = Math.atan2(y - y0, x - x0);
  }
  readonly incomingAngle;
  readonly outgoingAngle;
  readonly command = "L";
  readonly asString: string;
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
}

export class QCommand implements Command {
  static line4(x0: number, y0: number, x: number, y: number) {
    return new this(x0, y0, (x0 + x) / 2, (y0 + y) / 2, x, y);
  }
  static line(from: Point, to: Point) {
    return this.line4(from.x, from.y, to.x, to.y);
  }
  static angles(
    x0: number,
    y0: number,
    angle0: number,
    x: number,
    y: number,
    angle: number
  ): QCommand {
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
        angle: angle+Math.PI,
      }
    );
    if (!controlPoint) {
      // I don't expect this to happen often.  Sometimes it's unavoidable.
      // But I want to know if it happens a lot.
      console.warn("Line instead of Q");
      // Ignore the requested angles and just draw a line segment.
      return this.line4(x0, y0, x, y);
    } else {
      const result = new this(x0, y0, controlPoint.x, controlPoint.y, x, y);
      return result;
    }
  }
  constructor(
    public readonly x0: number,
    public readonly y0: number,
    public readonly x1: number,
    public readonly y1: number,
    public readonly x: number,
    public readonly y: number
  ) {
    assertFinite(x0, y0, x1, y1, x, y);
    this.asString = `Q ${x1},${y1} ${x},${y}`;
  }
  get incomingAngle() {
    return Math.atan2(this.y1 - this.y0, this.x1 - this.x0);
  }
  get outgoingAngle(): number {
    return Math.atan2(this.y - this.y1, this.x - this.x1);
  }
  readonly command = "Q";
  readonly asString: string;
  translate(Δx: number, Δy: number): Command {
    return new QCommand(
      this.x0 + Δx,
      this.y0 + Δy,
      this.x1 + Δx,
      this.y1 + Δy,
      this.x + Δx,
      this.y + Δy
    );
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
}

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
    this.asString = `C ${x1},${y1} ${x2},${y2} ${x},${y}`;
  }
  get incomingAngle() {
    return Math.atan2(this.y1 - this.y0, this.x1 - this.x0);
  }
  get outgoingAngle(): number {
    return Math.atan2(this.y - this.y2, this.x - this.x2);
  }
  readonly command = "C";
  readonly asString: string;
  translate(Δx: number, Δy: number): Command {
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
  toCubic(): CCommand {
    return this;
  }
}

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
    this.addCommand(new QCommand(previous.x, previous.y, x1, y1, x, y));
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
    const ε = 0.01 / numberOfSegments;
    const samples = initializedArray(numberOfSegments + 1, (index) => {
      const t = index / numberOfSegments;
      const point = f(t);
      const direction = getDirection(f, t, ε);
      return { t, point, direction };
    });
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
    return this;
  }
}

type ParametricFunction = (t: number) => Point;

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

const afterCommand = " *";
const number = "(-?[0-9]+.?[0-9]*)";
const between = " *[, ] *";
const mCommand = new RegExp(
  `^M${afterCommand}${number}${between}${number}(.*)$`
);
const qCommand = new RegExp(
  `^Q${afterCommand}${number}${between}${number}${between}${number}${between}${number}(.*)$`
);
const cCommand = new RegExp(
  `^C${afterCommand}${number}${between}${number}${between}${number}${between}${number}${between}${number}${between}${number}(.*)$`
);

/**
 * This is a way to manipulate a path shape.
 * I.e. to create a string like "path('M 1,2 L 3,5')".
 *
 * This class is read only.
 * If you need to append commands one at a time, consider a `PathBuilder` object.
 * If you wan to make more complicated changes, work on an array of `Command` objects.
 */
export class PathShape {
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
  /**
   *
   * @param strings Each is a path string, e.g "M1,2 L3,4".
   * @returns A new PathShape based on the path strings.
   */
  static fromStrings(strings: string[]) {
    const pathBuilders = PathBuilder.fromStrings(strings);
    const commands = pathBuilders.flatMap(
      (pathBuilder) => pathBuilder.commands
    );
    const result = new this(commands);
    return result;
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
  static needAnM(before: Command | undefined, after: Command): boolean {
    if (!before) {
      return true;
    }
    if (before.x != after.x0) {
      return true;
    }
    if (before.y != after.y0) {
      return true;
    }
    return false;
  }
  get rawPath() {
    return this.commands
      .flatMap((command, index) => {
        const result: string[] = [];
        const previousCommand = this.commands[index - 1];
        if (PathShape.needAnM(previousCommand, command)) {
          result.push(`M ${command.x0},${command.y0}`);
        }
        result.push(command.asString);
        return result;
      })
      .join(" ");
  }
  /**
   * Like css path, but broken each time the pen is lifted.
   * Each string in the result is a valid path where all of the parts are connected.
   */
  get cssPaths(): string[] {
    return this.splitOnMove().map((shape) => shape.cssPath);
  }
  get rawPaths(): string[] {
    return this.splitOnMove().map((shape) => shape.rawPath);
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
      const previous = this.commands[index - 1];
      const notConnectedToPrevious = PathShape.needAnM(previous, command);
      const difference = notConnectedToPrevious
        ? {}
        : {
            difference: PathShape.toDegrees(
              angleBetween(previous.outgoingAngle, incomingAngle)
            ),
          };
      // path length
      return {
        x0,
        y0,
        x,
        y,
        incomingAngle: PathShape.toDegrees(incomingAngle),
        outgoingAngle: PathShape.toDegrees(outgoingAngle),
        c,
        ...difference,
      };
    });
    console.table(data);
  }
}

type Ray = { x0: number; y0: number; angle: number };
type Point = { readonly x: number; readonly y: number };

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
  const difference2 = angleBetween(r2.angle , lineAngle);
  const side1 = Math.sign(difference1);
  const side2 = Math.sign(difference2);
  if (side1 != side2 || side1 == 0) {
    // 0 means the ray is pointing parallel to the line.
    //   If both rays are parallel to the line that connects them, there are two possibilities:
    //   The rays will either overlap or they will point away from each other.
    //   Either way we cannot return __one__ point where the two rays overlap.
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

  if (isVertical1 || isVertical2) {
    const x = isVertical1 ? r1.x0 : r2.x0;
    const otherLine = isVertical1 ? {...r2,slope:slope2} : {...r1,slope:slope1};
    const y = otherLine.slope * (x - otherLine.x0) + otherLine.y0;
    return { x, y };
  } else {
    const x =
      (r2.y0 - slope2 * r2.x0 - r1.y0 + slope1 * r1.x0) /
      (slope1 - slope2);
    const y = slope1 * (x - r1.x0) + r1.y0;
    return { x, y };
  }
}
