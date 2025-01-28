import { makeLinear } from "phil-lib/misc";
import { PathBuilder, PathShape, QCommand } from "./path-shape";
import "./style.css";

function squashedCircle(description: {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly downRatio: number;
  readonly backRatio: number;
}) {
  const { cx, cy, r, downRatio, backRatio } = description;
  const initialCommands = PathBuilder.M(cx, cy - r)
    .arc(cx, cy, cx, cy + r, "cw")
    .arc(cx, cy, cx, cy - r, "cw").commands;
  const translateXDown = makeLinear(cx, cx, cx + 1, cx + downRatio);
  const translateXBack = makeLinear(cx, cx, cx + 1, cx + backRatio);
  const half = initialCommands.length / 2;
  if (half != (half | 0)) {
    throw new Error("wtf");
  }
  const commands = initialCommands.map((command, index) => {
    const down = index < half;
    const translateX = down ? translateXDown : translateXBack;
    if (!(command instanceof QCommand)) {
      throw new Error("wtf");
    }
    const x0 = translateX(command.x0);
    const x1 = translateX(command.x1);
    const x = translateX(command.x);
    const { y0, y1, y } = command;
    return QCommand.controlPoints(x0, y0, x1, y1, x, y);
  });
  return new PathShape(commands);
}

const cx=32;
const cy=32;
const  r=27;

const start = squashedCircle({cx,cy,r, downRatio:-1, backRatio:1});
const middle = squashedCircle({cx,cy,r, downRatio:1, backRatio:1});
const end = squashedCircle({cx,cy,r, downRatio:1, backRatio:-1});
console.log(start.cssPath,middle.cssPath, end.cssPath);
