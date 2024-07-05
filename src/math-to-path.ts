import { initializedArray, makeLinear } from "phil-lib/misc";
import { polarToRectangular } from "./utility";

export type Point = { readonly x: number; readonly y: number };

type Options = {
  /**
   * An integer greater than 0.
   * A larger number will give you more precision and a longer string.
   *
   * Each segment will correspond to a single quadratic Bézier curve.
   * So each segment can only curve one way or the other.
   * And a single segment can't curve ≥180° around.
   */
  numberOfSegments?: number;
  /**
   * * M — Move to the initial position of this curve.  I.e. pen up.
   * * L — Draw a line from the current position to the initial position of this curve.  I.e. pen down.
   */
  initialCommand?: "M" | "L";
};

/**
 * This is a function that describes a path.
 *
 * If you call this function with a parameter of 0 the result should be the the point at the beginning of the path.
 * If you call this with 1, the result should be the point at the end of the path.
 * If you call it with any value in between, you should get a point on the path.
 * As you make smaller and smaller changes to the input, you should get smaller and smaller changes in the output.
 * I.e. the function is continuous and smooth.
 *
 * (Aside from being smooth) the change in output does not have to be linked to the change in input.
 * In the spiral example each segment covers the same number of degrees.  The animation will automatically
 * move a certain specific distance / second.  It will take more time to traverse longer segments than to traverse
 * shorter segments.  We get this for free because we are creating a single segment.  If you break your animation
 * up into multiple functions, you'll have to deal with that yourself.
 */
export type VectorFunction = (t: number) => Point;

/**
 * What direction is the output of the given function moving at the given time?
 *
 * Basically a derivative in more dimensions.
 * @param f Find the derivative of this function.
 * @param t Take the derivative at this time.
 * @param ε A small value that we can add to t or subtract from t, to estimate the derivative.
 * @returns An angle, in a form suitable for Math.tan().  Or NaN in case of any errors.
 */
function getDirection(f: VectorFunction, t: number, ε: number) {
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
 * This allows you to specify a _smooth_ curve in terms of a JavaScript function, and it will return a path string suitable for use with
 * [svg](https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path) and
 * [css](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_motion_path).
 * @param f This function describes the desired path.  For any time between 0 and 1, this function will return a point.
 * These points are expected to describe a __smooth__ curve.
 * @param options Accuracy vs performance.
 * @returns A path string suitable for use with svg and css.
 */
export function mathToPath(f: VectorFunction, options: Options = {}) {
  const numberOfSegments = Math.ceil(options.numberOfSegments ?? 10);
  if (numberOfSegments < 1) {
    throw new Error(`Invalid numberOfSegments: ${numberOfSegments}`);
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
  const initialCommand = options.initialCommand ?? "M";
  let result = `${initialCommand} ${segments[0].from.point.x}, ${segments[0].from.point.y}`;
  segments.forEach((segment) => {
    const controlPoint = findIntersection(
      {
        x0: segment.from.point.x,
        y0: segment.from.point.y,
        slope: Math.tan(segment.from.direction),
      },
      {
        x0: segment.to.point.x,
        y0: segment.to.point.y,
        slope: Math.tan(segment.to.direction),
      }
    );
    if (controlPoint) {
      result += ` Q ${controlPoint.x},${controlPoint.y}`;
    } else {
      result += " M";
    }
    result += ` ${segment.to.point.x},${segment.to.point.y}`;
  });
  return result;
}

/**
 *
 * @param from The starting point of the path.  This is on the outside of the spiral.
 * @param to The ending point of the path.  This is at the center of the spiral.
 * @param numberOfTurns This should be a positive number.  Bigger numbers make longer paths.
 * @returns A path appropriate for use in CSS and SVG.
 */
export function spiralPath(from: Point, to: Point, numberOfTurns: number) {
  const f = makeInwardSpiral(from, to, numberOfTurns);
  return mathToPath(f, { numberOfSegments: numberOfTurns * 9.001002 });
}

/**
 *
 * @param from The staring point of the path.
 * The point to draw at t==0.
 * This is on the outside of the spiral.
 * @param to The ending point of the path.
 * The point to draw at t==1.
 * This is at the center of the spiral.
 * @param numberOfTurns This should be a positive number.  Bigger numbers make longer paths.
 * @returns A function appropriate for input to `mathToPath()` or `makeComposite()`.
 */
export function makeInwardSpiral(
  from: Point,
  to: Point,
  numberOfTurns: number
): VectorFunction {
  //debugger;
  const startTime = 0;
  const endTime = 1;
  const straightBack: Point = { x: from.x - to.x, y: from.y - to.y };
  const initialRadius = Math.hypot(straightBack.x, straightBack.y);
  const getRadius = makeLinear(startTime, initialRadius, endTime, 0);
  const initialAngle = Math.atan2(straightBack.y, straightBack.x);
  const getAngle = makeLinear(
    startTime,
    initialAngle,
    endTime,
    initialAngle + numberOfTurns * 2 * Math.PI
  );
  return function (t: number): Point {
    const radius = getRadius(t);
    const angle = getAngle(t);
    const offset = polarToRectangular(radius, angle);
    return { x: to.x + offset.x, y: to.y + offset.y };
  };
}

/**
 * This is the same as `makeInwardSpiral()` but it goes in the opposite direction.
 * @param from The staring point of the path.
 * The point to draw at t==0.
 * This is at the center of the spiral.
 * @param to The ending point of the path.
 * The point to draw at t==1.
 * This is on the outside of the spiral.
 * @param numberOfTurns This should be a positive number.  Bigger numbers make longer paths.
 * @returns A function appropriate for input to `mathToPath()` or `makeComposite()`.
 */
export function makeOutwardSpiral(
  from: Point,
  to: Point,
  numberOfTurns: number
): VectorFunction {
  const spiral = makeInwardSpiral(to, from, numberOfTurns);
  return (t: number) => spiral(1 - t);
}

/**
 * Create a circle suitable for input to `mathToPath()` or `makeComposite()`.
 *
 * The circle is centered at the origin.
 * The assumption is that `makeComposite()` will translate the result anyway.
 * @param radius The radius of the circle to create.
 * @param initialAngle Where on the circle to start, in radians.
 * @param finalAngle Where on the circle to end, in radians.
 *
 * Set finalAngle = initialAngle + (n ⨉ 2π) to make n complete loops around.
 * Make n negative to go the other direction.
 * @returns A function that will trace out a circle n times.
 */
export function makeCircle(
  radius: number,
  initialAngle: number,
  finalAngle: number
): VectorFunction {
  const angle = makeLinear(0, initialAngle, 1, finalAngle);
  return (t: number): Point => {
    return polarToRectangular(radius, angle(t));
  };
}

/**
 *
 * @param from Start at this point at t==0.
 * @param to End at this point at t==1.
 * @returns A function suitable for input to `mathToPath()` or `makeComposite()`.
 * The function will linearly interpolate between the start and end points.
 */
function makeLine(from: Point, to: Point): VectorFunction {
  const x = makeLinear(0, from.x, 1, to.x);
  const y = makeLinear(0, from.y, 1, to.y);
  return (t: number): Point => {
    return { x: x(t), y: y(t) };
  };
}

/**
 * Make a path with specific start and end points.
 * Use the additional functions to make the path more interesting.
 * This adds the results of the functions together, like wheels of a Spirograph.
 * This adds additional terms to make the start and end points match.
 * @param from The resulting function will return this point at t==0.
 * @param to The resulting function will return this point at t==1.
 * @param functions Add all of these functions together to get a result.
 * @returns A function that will have the given end points.
 * The input functions are used to add flourishes between the two ends.
 */
export function makeComposite(
  from: Point,
  to: Point,
  ...functions: VectorFunction[]
): VectorFunction {
  const sumAt = (t: number): Point => {
    const result = { x: 0, y: 0 };
    functions.forEach((f) => {
      const point = f(t);
      result.x += point.x;
      result.y += point.y;
    });
    return result;
  };
  const initialFrom = sumAt(0);
  const initialTo = sumAt(1);
  const adjustment = makeLine(
    { x: from.x - initialFrom.x, y: from.y - initialFrom.y },
    { x: to.x - initialTo.x, y: to.y - initialTo.y }
  );
  functions.push(adjustment);
  return sumAt;
}

// TODO these should really be rays.  Two rays might not meet at all.
// If they do meet, findIntersection() will give the right answer.
// We need to know an angle, not a slope, to find that out.
//
// TODO if there is a problem matching the rays, we should draw a
// straight line, instead of skipping the segment or drawing some
// wild curves.  As learned from #SOME3.  Still skip the segment
// if an input is NaN.
type Line = { x0: number; y0: number; slope: number };

function findIntersection(α: Line, β: Line): Point | undefined {
  if (isNaN(α.slope) || isNaN(β.slope) || α.slope == β.slope) {
    return undefined;
  }
  const αIsVertical = α.slope == Infinity || α.slope == -Infinity;
  const βIsVertical = β.slope == Infinity || β.slope == -Infinity;
  if (αIsVertical || βIsVertical) {
    return undefined;
  }
  const x = αIsVertical
    ? α.x0
    : βIsVertical
    ? β.x0
    : (β.y0 - β.slope * β.x0 - α.y0 + α.slope * α.x0) / (α.slope - β.slope);
  const y = αIsVertical
    ? β.slope * (x - β.x0) + β.y0
    : α.slope * (x - α.x0) + α.y0;
  return { x, y };
}

export type WidthFunction = (input: {
  direction: 1 | -1;
  t: number;
  position: Point;
  tangentAngle: number;
}) => number;
export function variableWidthPath(
  base: VectorFunction,
  width: WidthFunction,
  numberOfSegments: number
) {
  const ε = 0.01 / numberOfSegments;

  function out(t: number): Point {
    const basePoint = base(t);
    const tangentAngle = getDirection(base, t, ε);
    const normalAngle = tangentAngle + Math.PI / 2;
    const r = width({ direction: 1, t, position: basePoint, tangentAngle }) / 2;
    const offset = polarToRectangular(r, normalAngle);
    return { x: basePoint.x + offset.x, y: basePoint.y + offset.y };
  }
  const outString = mathToPath(out, { numberOfSegments });

  function back(backwardT: number): Point {
    const forwardT = 1 - backwardT;
    const basePoint = base(forwardT);
    const tangentAngle = getDirection(base, forwardT, ε);
    const normalAngle = tangentAngle - Math.PI / 2;
    const r =
      width({ direction: -1, t: forwardT, position: basePoint, tangentAngle }) /
      2;
    const offset = polarToRectangular(r, normalAngle);
    return { x: basePoint.x + offset.x, y: basePoint.y + offset.y };
  }
  const backString = mathToPath(back, {
    numberOfSegments,
    initialCommand: "L",
  });

  return `${outString} ${backString} z`;
}

export function makeLogarithmicSpiral(inputs: {
  fromAngle: number;
  toAngle: number;
  fromRadius: number;
  toRadius: number;
  center: Point;
  widthRatio: number;
}): string {
  const getAngle = makeLinear(0, inputs.fromAngle, 1, inputs.toAngle);
  const getLogRadius = makeLinear(
    0,
    Math.log(inputs.fromRadius),
    1,
    Math.log(inputs.toRadius)
  );
  const getRadius = (t: number) => Math.exp(getLogRadius(t));
  const getPosition = (t: number) => {
    const offset = polarToRectangular(getRadius(t), getAngle(t));
    return { x: offset.x + inputs.center.x, y: offset.y + inputs.center.y };
  };
  const oneRotation = (2 * Math.PI) / (inputs.toAngle - inputs.fromAngle);
  const getWidth: WidthFunction = ({ t, direction }) => {
    const previous = getRadius(t + oneRotation * direction);
    const current = getRadius(t);
    return Math.abs(current - previous) * inputs.widthRatio;
  };
  return variableWidthPath(
    getPosition,
    getWidth,
    Math.abs(inputs.fromAngle - inputs.toAngle) * 4
  );
}
