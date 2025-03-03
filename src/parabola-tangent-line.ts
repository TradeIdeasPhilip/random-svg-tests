import { getById } from "phil-lib/client-misc";
import "./parabola-tangent-line.css";
import { selectorQuery, selectorQueryAll } from "./utility";

const functionPath = getById("function", SVGPathElement);
const [fixedCircle, movingCircle] = selectorQueryAll(
  "circle.measurement-fill",
  SVGCircleElement,
  2,
  2
);
const estimateLine = selectorQuery("line.estimate-stroke", SVGLineElement);

console.log({ functionPath, fixedCircle, movingCircle, estimateLine });

/**
 * Next:
 *
 * 0:25:16 - 1:43:30 for the whole list:
 * 1) Start from the intro demo
 * 2) initially two fairly small circles for the inputs.
 * 3) The circles are exactly the same size as the line, and drawn on top.
 * 4) At some point the circles get bigger and get fuzzy edges.
 * 5) The line is replaced my multiple lines spread out to show multiple possible lines that go through both circles.
 * 6) Use repeatable randomness to pick points from anywhere in the possible range.
 * 7) The line can be blurry or partially transparent.
 * 8) The closer the line was to the center of each point, the sharper the line will be.
 * 9) The line's blurriness will be based on the worst of the two points.
 * 10) The line will always be at least somewhat visible, even if the line crossed though the most transparent edge of the point.
 * 11) Get rid of the % precision issues thing.  (I don't want to try to sync that with the rest of this demo.)
 * 12) Eventually move the points close together and slowly move from almost touching to largely overlapping.
 *
 * Use a parabola for the function, y=x*x.
 * the point we care about is y′(0) = 0.
 * Draw a J shape, with a little bit to the left of x=0 just for context.
 * One point will be fixed at x=0.
 * dx will always be positive, so the second point will always be on the left,
 * like in my previous semi circle demo, but focused on the bottom of the path.
 *
 * Start far away from the inner point and quickly move toward it to show
 * the estimate getting better.
 * Approach 0 at an exponentially decreasing rate.
 * No blurriness or zooming yet.
 * 0:33:30 - But in the real world
 * Reset the drawing,
 * start animating the lines to show the margin of error.
 * Draw 3 or so lines, each based on the two points.
 * The error at each point for each line will be some continuous noise function.
 * The speed and character of the noise is constant, even when the points slow down or stop.
 * Initially things are similar to the first run, with the 3 lines almost perfectly overlapping.
 * As the points get closer the errors become more obvious.
 * Eventually we start zooming in.
 * The shape of the parabola is changing as we zoom in.
 * The position of the center of both points stop moving.  (The y of the x+dx point will change to match the path)
 * The size of the cloud around each point is growing as we zoom in.
 * The stroke-width of the lines and the parabola stay the same as we zoom in.
 * Shortly after the clouds start to overlap, stop moving the closer,
 * or at least slow down tremendously so it's obvious how wildly the lines are swinging around.
 *
 * margin of error in the legend will have a triple image of each letter.
 * The letters will move independently.
 * The animation will mostly focus on being readable, but with some extremes to show when it's not.
 *
 * 0:33:30 - But in the real world
 * 1:11:00 - 1:20:15 If you try to push the limit, it is fuzzy.
 * 1:25:00 - 1:43:30 If you really want to push the limits you need a better approach. ... more smarter math.
 * 1:43:30 - My solution was so simple.
 * 2:04:00 - 2:23:29 Let's take a closer look. ...  ... a second sample twice as far away.
 * 2:25:09-ish and I wanted to know the value at 0
 * 2:37:36 -  so all I did was extrapolate
 * 2:47:00 - so, why does this work so well?  ... was linear now quadratic
 * 3:09:11 - imagine a taylor expansion
 *
 * 1:43:30 - 2:47:00 So my new solution.  D(f, x0, dx)  Use a lot of real code.
 *
 * I need to match the new video content to the voiceover found here:
 * https://www.youtube.com/watch?v=qzbga-c3mk0
 * "better derivative, longer voiceover"
 *
 */
