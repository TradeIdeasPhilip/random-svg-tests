import { parseFloatX } from "phil-lib/misc";
import { lerp } from "./utility";

function assertFinite(...values: number[]): void {
  values.forEach((value) => {
    if (!isFinite(value)) {
      throw new Error("wtf");
    }
  });
}

/**
 * This represents something like `M 1,2` or `Q 1,2 3,4`, with some additional information.
 *
 * `PathShape` is a collection of `PathCommand` objects.
 */
type PathCommand = {
  readonly endX: number;
  readonly endY: number;
  readonly asString: string;
  /**
   * Create an altered copy of this immutable object.
   *
   * Normally we use the `<path>`'s `transform` property to reposition a letter.
   * This can be useful when combining multiple paths into a single path.
   * @param destination Add the modified command to this.
   */
  translate(destination: PathShape, Δx: number, Δy: number): void;
  /**
   * Convert a command into a C command.
   * L, H, V, and Q commands can all be expressed as C commands with no loss.
   * This can be useful when animating a transition between two paths.
   * @param destination Add the modified command to this.
   */
  toCubic(destination: PathShape): void;
};

abstract class PathSegment {
  protected constructor(
    protected readonly previous: PathSegment | undefined,
    public readonly endX: number,
    public readonly endY: number
  ) {}
  abstract get asString(): string;
}
PathSegment;

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
 */
export class PathShape {
  //
  /**
   * Invariant:  The first command will always be a move.
   * (And therefor there will always be at least on element in this array.)
   */
  #commands: PathCommand[] = [];
  get endX() {
    return this.#commands.at(-1)!.endX;
  }
  get endY() {
    return this.#commands.at(-1)!.endY;
  }
  get startX() {
    // The first command will always be a move.
    return this.#commands[0].endX;
  }
  get startY() {
    // The first command will always be a move.
    return this.#commands[0].endY;
  }
  static M(x: number, y: number) {
    return new this().M(x, y);
  }
  checkInvariants() {
    if (this.#commands[0].asString[0] != "M") {
      throw new Error("wtf");
    }
  }
  /**
   *
   * @param strings Each is a path string, e.g "M1,2 L3,4".
   * @returns A new PathShape based on the path strings.
   */
  static fromStrings(...strings: string[]) {
    const result = new this();
    strings.forEach((s) => result.fromString(s));
    result.checkInvariants();
    return result;
  }
  /**
   * Add new commands from the given string to this `PathShape`.
   *
   * This does not understand all valid commands.
   * This is currently aimed at parsing a string from rough.js.
   * @param s A path string, e.g "M1,2 L3,4".
   */
  fromString(s: string) {
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
        this.M(x, y);
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
        this.Q(x1, y1, x2, y2);
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
        this.C(x1, y1, x2, y2, x3, y3);
        s = result[7];
        continue;
      }
      console.error(s);
      throw new Error("wtf");
    }
    return this;
  }
  private constructor() {}
  /** Add an M command to the path. */
  M(x: number, y: number) {
    assertFinite(x, y);
    function translate(destination: PathShape, Δx: number, Δy: number): void {
      destination.M(x + Δx, y + Δy);
    }
    function toCubic(destination: PathShape): void {
      destination.M(x, y);
    }
    this.#commands.push({
      endX: x,
      endY: y,
      asString: `M ${x},${y}`,
      translate,
      toCubic,
    });
    return this;
  }
  /** Add an H command to the path. */
  H(x: number) {
    assertFinite(x);
    function translate(destination: PathShape, Δx: number, _Δy: number): void {
      destination.H(x + Δx);
    }
    const initialX = this.endX;
    const initialY = this.endY;
    function toCubic(destination: PathShape): void {
      destination.C(
        lerp(initialX, x, 1 / 3),
        initialY,
        lerp(initialX, x, 2 / 3),
        initialY,
        x,
        initialY
      );
    }
    this.#commands.push({
      endX: x,
      endY: initialY,
      asString: `H ${x}`,
      translate,
      toCubic,
    });
    return this;
  }
  /** Add a V command to the path. */
  V(y: number) {
    assertFinite(y);
    function translate(destination: PathShape, _Δx: number, Δy: number): void {
      destination.V(y + Δy);
    }
    const initialX = this.endX;
    const initialY = this.endY;
    function toCubic(destination: PathShape): void {
      destination.C(
        initialX,
        lerp(initialY, y, 1 / 3),
        initialX,
        lerp(initialY, y, 2 / 3),
        initialX,
        y
      );
    }
    this.#commands.push({
      endX: this.endX,
      endY: y,
      asString: `V ${y}`,
      translate,
      toCubic,
    });
    return this;
  }
  /** Add an L command to the path. */
  L(x: number, y: number) {
    assertFinite(x, y);
    function translate(destination: PathShape, Δx: number, Δy: number): void {
      destination.L(x + Δx, y + Δy);
    }
    const initialX = this.endX;
    const initialY = this.endY;
    function toCubic(destination: PathShape): void {
      destination.C(
        lerp(initialX, x, 1 / 3),
        lerp(initialY, y, 1 / 3),
        lerp(initialX, x, 2 / 3),
        lerp(initialY, y, 2 / 3),
        x,
        y
      );
    }
    this.#commands.push({
      endX: x,
      endY: y,
      asString: `L ${x},${y}`,
      translate,
      toCubic,
    });
    return this;
  }
  /** Add a Q command to the path. */
  Q(x1: number, y1: number, x2: number, y2: number) {
    assertFinite(x1, y1, x2, y2);
    function translate(destination: PathShape, Δx: number, Δy: number): void {
      destination.Q(x1 + Δx, y1 + Δy, x2 + Δx, y2 + Δy);
    }
    const initialX = this.endX;
    const initialY = this.endY;
    function toCubic(destination: PathShape): void {
      // https://fontforge.org/docs/techref/bezier.html#converting-truetype-to-postscript
      destination.C(
        lerp(initialX, x1, 2 / 3),
        lerp(initialY, y1, 2 / 3),
        lerp(x2, x1, 2 / 3),
        lerp(y2, y1, 2 / 3),
        x2,
        y2
      );
    }
    this.#commands.push({
      endX: x2,
      endY: y2,
      asString: `Q ${x1},${y1} ${x2},${y2}`,
      translate,
      toCubic,
    });
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
    return this.Q(x, this.endY, x, y);
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
    return this.Q(this.endX, y, x, y);
  }
  /** Add a C command to the path. */
  C(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
    assertFinite(x1, y1, x2, y2, x3, y3);
    function translate(destination: PathShape, Δx: number, Δy: number): void {
      destination.C(x1 + Δx, y1 + Δy, x2 + Δx, y2 + Δy, x3 + Δx, y3 + Δy);
    }
    function toCubic(destination: PathShape): void {
      destination.C(x1, y1, x2, y2, x3, y3);
    }
    this.#commands.push({
      endX: x3,
      endY: y3,
      asString: `C ${x1},${y1} ${x2},${y2} ${x3},${y3}`,
      translate,
      toCubic,
    });
    return this;
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

  get rawPath() {
    return this.#commands.map((command) => command.asString).join(" ");
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
  splitOnMove(): PathShape[] {
    const result: PathCommand[][] = [];
    let current: PathCommand[] = [];
    this.#commands.forEach((command) => {
      if (command.asString[0] == "M" && current.length > 0) {
        result.push(current);
        current = [];
      }
      current.push(command);
    });
    result.push(current);
    return result.map((commands) => {
      const path = new PathShape();
      path.#commands.push(...commands);
      return path;
    });
  }
  /**
   * @param shapes The shapes to merge
   * @returns A single shape that includes all of the input shapes
   */
  static join(
    pieces: { Δx: number; Δy: number; shape: PathShape }[]
  ): PathShape {
    const result = new PathShape();
    pieces.forEach(({ Δx, Δy, shape }) => {
      shape.#commands.forEach((command) => command.translate(result, Δx, Δy));
    });
    result.checkInvariants();
    return result;
  }
  convertToCubics(): PathShape {
    const result = new PathShape();
    this.#commands.forEach((command) => command.toCubic(result));
    result.checkInvariants();
    return result;
  }
  translate(Δx: number, Δy: number): PathShape {
    const result = new PathShape();
    this.#commands.forEach((command) => command.translate(result, Δx, Δy));
    result.checkInvariants();
    return result;
  }
}
