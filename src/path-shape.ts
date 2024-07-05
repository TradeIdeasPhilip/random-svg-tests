import { parseFloatX } from "phil-lib/misc";
import { assertFinite, lerp } from "./utility";

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

class HCommand implements Command {
  readonly y: number;
  constructor(
    public readonly x0: number,
    public readonly y0: number,
    public readonly x: number
  ) {
    assertFinite(x0, y0, x);
    this.y = y0;
    this.asString = `H ${x}`;
  }
  readonly incomingAngle = NaN; // TODO
  readonly outgoingAngle = NaN; // TODO
  readonly command = "H";
  readonly asString: string;
  translate(Δx: number, Δy: number): Command {
    return new HCommand(this.x0 + Δx, this.y0 + Δy, this.x + Δx);
  }
  toCubic() {
    return new CCommand(
      this.x0,
      this.y0,
      lerp(this.x0, this.x, 1 / 3),
      this.y0,
      lerp(this.x0, this.x, 2 / 3),
      this.y0,
      this.x,
      this.y0
    );
  }
}

class VCommand implements Command {
  readonly x: number;
  constructor(
    public readonly x0: number,
    public readonly y0: number,
    public readonly y: number
  ) {
    assertFinite(x0, y0, y);
    this.x = x0;
    this.asString = `V ${y}`;
  }
  readonly incomingAngle = NaN; // TODO
  readonly outgoingAngle = NaN; // TODO
  readonly command = "V";
  readonly asString: string;
  translate(Δx: number, Δy: number): Command {
    return new VCommand(this.x0 + Δx, this.y0 + Δy, this.y + Δy);
  }
  toCubic(): CCommand {
    return new CCommand(
      this.x0,
      this.y0,
      this.x0,
      lerp(this.y0, this.y, 1 / 3),
      this.x0,
      lerp(this.y0, this.y, 2 / 3),
      this.x0,
      this.y
    );
  }
}

export class LCommand implements Command {
  constructor(
    public readonly x0: number,
    public readonly y0: number,
    public readonly x: number,
    public readonly y: number
  ) {
    assertFinite(x0, y0, x, y);
    this.asString = `L ${x},${y}`;
  }
  readonly incomingAngle = NaN; // TODO
  readonly outgoingAngle = NaN; // TODO
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

class QCommand implements Command {
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
  readonly incomingAngle = NaN; // TODO
  readonly outgoingAngle = NaN; // TODO
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
  readonly incomingAngle = NaN; // TODO
  readonly outgoingAngle = NaN; // TODO
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
  addCommands(commands: readonly Command[]) {
    this.#commands.push(...commands);
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
  #nextStart:
    | undefined
    | {
        readonly x: number;
        readonly y: number;
        readonly outgoingAngle: number;
      };
  M(x: number, y: number): this {
    assertFinite(x, y);
    this.#nextStart = { x, y, outgoingAngle: NaN };
    return this;
  }
  private peekPrevious() {
    return this.#nextStart ?? this.#commands.at(-1);
  }
  private consumePrevious() {
    const result = this.peekPrevious();
    this.#nextStart = undefined;
    return result;
  }
  /**
   * Add an H command to `this`.
   * @param x The argument for the H command.
   * @returns A new PathBuilder ending with this command.
   */
  H(x: number) {
    const previous = this.consumePrevious()!;
    this.#commands.push(new HCommand(previous.x, previous.y, x));
    return this;
  }
  V(y: number): PathBuilder {
    const previous = this.consumePrevious()!;
    this.#commands.push(new VCommand(previous.x, previous.y, y));
    return this;
  }
  L(x: number, y: number): PathBuilder {
    const previous = this.consumePrevious()!;
    this.#commands.push(new LCommand(previous.x, previous.y, x, y));
    return this;
  }
  Q(x1: number, y1: number, x: number, y: number) {
    const previous = this.consumePrevious()!;
    this.#commands.push(new QCommand(previous.x, previous.y, x1, y1, x, y));
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
    const previous = this.peekPrevious()!;
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
    const previous = this.peekPrevious()!;
    return this.Q(previous.x, y, x, y);
  }
  C(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    const previous = this.consumePrevious()!;
    this.#commands.push(
      new CCommand(previous.x, previous.y, x1, y1, x2, y2, x, y)
    );
    return this;
  }
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
}
