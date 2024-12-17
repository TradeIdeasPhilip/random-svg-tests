import { polarToRectangular, angleBetween, radiansPerDegree } from "phil-lib/misc";
import { Point, lerpPoints } from "./math-to-path";
import { PathShape, QCommand } from "./path-shape";

/**
 * Equal or almost equal.  Ideally I'd use == but that would never
 * work because of round off error.
 * @param angle1
 * @param angle2
 * @returns true if the inputs are within 1° of each other.
 */
function similarAngles(angle1: number, angle2: number) {
  const difference = angleBetween(angle1, angle2);
  /**
   * 1° converted to radians.
   */
  const cutoff = 1 * radiansPerDegree;
  return Math.abs(difference) < cutoff;
}

/**
 *
 * @param shape The initial shape that you want to make rough.
 * @param roughness Roughly how many svg units each point is allowed to move.
 * @returns `after` is the rough version of the initial shape.
 * `before` will look the same as (or as close as possible to) the initial
 * shape, but it will be in a form that can morph into the rough shape.
 */

export function makeRoughShape(
  shape: PathShape,
  roughness: number,
  random: () => number
): { before: PathShape; after: PathShape; } {
  const before = shape.commands.map((command) => {
    if (command instanceof QCommand) {
      return command;
    } else {
      return QCommand.line2({ x: command.x0, y: command.y0 }, command);
    }
  });
  const after = new Array<QCommand>();
  new PathShape(before).splitOnMove().forEach((connectedShape): void => {
    const commandInfo = connectedShape.commands.map((command) => {
      if (!(command instanceof QCommand)) {
        throw new Error("wtf");
      }
      const element = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      const d = new PathShape([command]).rawPath;
      element.setAttribute("d", d);
      const length = element.getTotalLength();
      return { command, length };
    });
    const sharedPoints: ReadonlyArray<Point> = commandInfo.flatMap(
      ({ command }, index) => {
        if (index == 0) {
          return [];
        } else {
          return { x: command.x0, y: command.y0 };
        }
      }
    );

    function adjust(
      initial: Point,
      limit: number
    ): Point & { offset: Point; initial: Point; } {
      const r = Math.min(roughness, limit) * random();
      const θ = random() * Math.PI * 2;
      const offset = polarToRectangular(r, θ);
      const x = initial.x + offset.x;
      const y = initial.y + offset.y;
      return { x, y, offset, initial };
    }

    const firstCommandInfo = commandInfo[0];
    const endPoints = [
      adjust(
        {
          x: firstCommandInfo.command.x0,
          y: firstCommandInfo.command.y0,
        },
        firstCommandInfo.length
      ),
    ];
    sharedPoints.forEach((point, index) => {
      const before = commandInfo[index];
      const after = commandInfo[index + 1];
      const limit = Math.min(before.length, after.length) / 2;
      endPoints.push(adjust(point, limit));
    });
    const lastCommandInfo = commandInfo[commandInfo.length - 1];
    endPoints.push(adjust(lastCommandInfo.command, lastCommandInfo.length));

    if (endPoints.length != commandInfo.length + 1 ||
      commandInfo.length != sharedPoints.length + 1) {
      throw new Error("wtf");
    }

    commandInfo.forEach((commandInfo, index): void => {
      const from = endPoints[index];
      const to = endPoints[index + 1];
      let middle: Point = {
        x: commandInfo.command.x1,
        y: commandInfo.command.y1,
      };

      // Adjust to match the average of the adjustments of the two end points.
      middle = {
        x: middle.x + (from.offset.x + to.offset.x) / 2,
        y: middle.y + (from.offset.y + to.offset.y) / 2,
      };

      // Add additional randomness.
      middle = adjust(middle, commandInfo.length);

      after.push(
        QCommand.controlPoints(from.x, from.y, middle.x, middle.y, to.x, to.y)
      );
      {
        if (index > 0) {
          // This command and the previous command are connected.
          if (similarAngles(
            before.at(after.length - 2)!.requestedOutgoingAngle,
            before.at(after.length - 1)!.requestedIncomingAngle
          )) {
            // This was a smooth connection before randomizing.  Make it smooth again.
            const originalLast = after.pop()!;
            const originalPrevious = after.pop()!;
            const average = originalPrevious.requestedOutgoingAngle +
              angleBetween(
                originalPrevious.requestedOutgoingAngle,
                originalLast.requestedIncomingAngle
              ) /
              2;
            let previous: QCommand = originalPrevious.newAngles(
              undefined,
              average
            );
            let last: QCommand = originalLast.newAngles(average, undefined);
            function somethingFailed() {
              return [previous, last].some(
                (command) => command.creationInfo.source == "angles" &&
                  !command.creationInfo.success
              );
            }
            if (somethingFailed()) {
              const replacement = QCommand.angles(
                previous.x0,
                previous.y0,
                previous.incomingAngle,
                last.x,
                last.y,
                last.outgoingAngle
              );
              if (replacement.creationInfo.success) {
                const pathElement = document.createElementNS(
                  "http://www.w3.org/2000/svg",
                  "path"
                );
                pathElement.setAttribute(
                  "d",
                  new PathShape([replacement]).rawPath
                );
                const totalLength = pathElement.getTotalLength();
                const center = totalLength / 5;
                const offset = totalLength / 200;
                const a = pathElement.getPointAtLength(center - offset);
                const b = pathElement.getPointAtLength(center + offset);
                const centerPoint = lerpPoints(a, b, 0.5);
                const angleAtCenter = Math.atan2(b.y - a.y, b.x - a.x);
                previous = QCommand.angles(
                  previous.x0,
                  previous.y0,
                  previous.incomingAngle,
                  centerPoint.x,
                  centerPoint.y,
                  angleAtCenter
                );
                last = QCommand.angles(
                  centerPoint.x,
                  centerPoint.y,
                  angleAtCenter,
                  last.x,
                  last.y,
                  last.outgoingAngle
                );
                //console.log("merged", previous, last);
              }
            }
            if (somethingFailed()) {
              previous = originalPrevious;
              last = originalLast;
            }
            after.push(previous);
            after.push(last);
          }
        }
      }
    });
  });
  return { before: new PathShape(before), after: new PathShape(after) };
}
