const FULL_CIRCLE = 2 * Math.PI;

type Point = { readonly x: number; readonly y: number };

type ParametricFunction = (t: number) => Point;

function circle(t: number): Point {
  const θ = t / FULL_CIRCLE;
  const x = Math.cos(θ);
  const y = Math.sin(θ);
  return { x, y };
}

let myPath : ParametricFunction = circle;

function makeCircle(radius: number, center: Point): ParametricFunction {
  function circle(t: number): Point {
    const θ = t / FULL_CIRCLE;
    const x = radius * Math.cos(θ) + center.x;
    const y = radius * Math.sin(θ) + center.y;
    return { x, y };
  }
  return circle;
}

myPath = makeCircle(5, {x:6, y:6});

function picky(t : number) : Point {
  const x = Math.sqrt(t);
  const y = Math.sqrt(1-t);
  if (!(isFinite(x)&&isFinite(y))) {
    throw new Error("Input must be between 0 and 1, inclusive.")
  }
  return { x, y };
}

myPath = picky;