import { parseFloatX } from "phil-lib/misc";

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
  readonly reversed?: string;
};

const afterCommand = " *";
const number = "(-?[0-9]+.?[0-9]*)";
const between = " *[, ] *";
const mCommand = new RegExp(
  `^M${afterCommand}${number}${between}${number}(.*)$`
);
const qCommand  = new RegExp(
  `^Q${afterCommand}${number}${between}${number}${between}${number}${between}${number}(.*)$`
);
const cCommand  = new RegExp(
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
    strings.forEach(s=>result.fromString(s));
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
          console.error(result,x,y,this);
          throw new Error("wtf");
        }
        this.M(x,y);
        s = result[3];
        continue;
      }
      result = qCommand.exec(s);
      if (result) {
        const x1 = parseFloatX(result[1]);
        const y1 = parseFloatX(result[2]);
        const x2 = parseFloatX(result[3]);
        const y2 = parseFloatX(result[4]);
        if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
          console.error(result,x1,y1,x2,y2,this);
          throw new Error("wtf");
        }
        this.Q(x1,y1,x2,y2);
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
        if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined || x3 === undefined || y3 === undefined) {
          console.error(result,x1,y1,x2,y2,x3,y3,this);
          throw new Error("wtf");
        }
        this.C(x1,y1,x2,y2,x3,y3);
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
    this.#commands.push({
      endX: x,
      endY: y,
      asString: `M ${x},${y}`,
      translate,
    });
    return this;
  }
  /** Add an H command to the path. */
  H(x: number) {
    assertFinite(x);
    function translate(destination: PathShape, Δx: number, _Δy: number): void {
      destination.H(x + Δx);
    }
    this.#commands.push({
      endX: x,
      endY: this.endY,
      asString: `H ${x}`,
      translate,
    });
    return this;
  }
  /** Add a V command to the path. */
  V(y: number) {
    assertFinite(y);
    function translate(destination: PathShape, _Δx: number, Δy: number): void {
      destination.V(y + Δy);
    }
    this.#commands.push({
      endX: this.endX,
      endY: y,
      asString: `V ${y}`,
      translate,
    });
    return this;
  }
  /** Add an L command to the path. */
  L(x: number, y: number) {
    assertFinite(x, y);
    function translate(destination: PathShape, Δx: number, Δy: number): void {
      destination.L(x + Δx, y + Δy);
    }
    this.#commands.push({
      endX: x,
      endY: y,
      asString: `L ${x},${y}`,
      translate,
    });
    return this;
  }
  /** Add a Q command to the path. */
  Q(x1: number, y1: number, x2: number, y2: number) {
    assertFinite(x1, y1, x2, y2);
    function translate(destination: PathShape, Δx: number, Δy: number): void {
      destination.Q(x1 + Δx, y1 + Δy, x2 + Δx, y2 + Δy);
    }
    this.#commands.push({
      endX: x2,
      endY: y2,
      asString: `Q ${x1},${y1} ${x2},${y2}`,
      translate,
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
    this.#commands.push({
      endX: x3,
      endY: y3,
      asString: `C ${x1},${y1} ${x2},${y2} ${x3},${y3}`,
      translate,
    });
    return this;
  }
  static cssifyPath(rawPath: string) {
    return `path('${rawPath}')`;
  }
  get cssPath() {
    return PathShape.cssifyPath(this.rawPath);
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
}
