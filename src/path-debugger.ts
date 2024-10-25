import { PathShape, QCommand } from "./path-shape";
import "./sky-writing.css";
import "./path-debugger.css";
import { getById } from "phil-lib/client-misc";
import { initializedArray } from "phil-lib/misc";
import {
  angleBetween,
  degreesPerRadian,
  polarToRectangular,
  radiansPerDegree,
} from "./utility";

const svg = document.querySelector("svg")!;
const input = document.querySelector("input")!;
const button = document.querySelector("button")!;

button.addEventListener("click", () => {
  const asString = input.value;
  const pathShape = PathShape.fromStrings([asString]);
  const element = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  element.style.d = pathShape.cssPath;
  svg.appendChild(element);
  const bBox = element.getBBox();
  svg.viewBox.baseVal.x = bBox.x;
  svg.viewBox.baseVal.y = bBox.y;
  svg.viewBox.baseVal.width = bBox.width;
  svg.viewBox.baseVal.height = bBox.height;
});

{
  const byAngleTable = getById("byAngle", HTMLTableElement);
  const initialOffset = 0; //45 * radiansPerDegree;
  const columnCount = 11;
  const incomingAngles = initializedArray(
    columnCount,
    (n) => initialOffset + (Math.PI * 2 * n) / columnCount
  );
  const rowCount = 17;
  const outgoingAngles = initializedArray(
    rowCount,
    (n) => initialOffset + (Math.PI * 2 * n) / rowCount
  );
  function appendTH(tr: HTMLTableRowElement, angle?: number) {
    const th = document.createElement("th");
    tr.appendChild(th);
    if (angle !== undefined) {
      th.append(
        (angle * degreesPerRadian).toFixed(1) + "° " + angle.toFixed(3)
      );
    }
  }
  {
    const topRow = byAngleTable.insertRow();
    appendTH(topRow);
    incomingAngles.forEach((angle) => {
      appendTH(topRow, angle);
    });
  }
  outgoingAngles.forEach((outgoingAngle, _rowIndex) => {
    const tr = byAngleTable.insertRow();
    appendTH(tr, outgoingAngle);
    incomingAngles.forEach((incomingAngle, _columnIndex) => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.classList.add("angles");
      const fromX = 0;
      const toX = 1;
      const fromY = 0;
      const toY = 1;
      svg.viewBox.baseVal.x = fromX;
      svg.viewBox.baseVal.y = fromY;
      svg.viewBox.baseVal.width = toX - fromX;
      svg.viewBox.baseVal.height = toY - fromY;
      const td = tr.insertCell();
      td.appendChild(svg);
      function showAngle(angle: number, fromTopLeft: boolean) {
        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        const length = 0.2;
        const [x1, y1, a1] = fromTopLeft
          ? [fromX, fromY, angle + Math.PI]
          : [toX, toY, angle];
        const end = polarToRectangular(length, a1);
        line.x1.baseVal.value = x1;
        line.x2.baseVal.value = x1 + end.x;
        line.y1.baseVal.value = y1;
        line.y2.baseVal.value = y1 + end.y;
        svg.appendChild(line);
      }
      showAngle(incomingAngle, true);
      showAngle(outgoingAngle, false);
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      const qCommand = QCommand.tryAngles(
        fromX,
        fromY,
        incomingAngle,
        toX,
        toY,
        outgoingAngle
      );
      if (qCommand) {
        const d = new PathShape([qCommand]).rawPath;
        path.setAttribute("d", d);
        svg.appendChild(path);
        const error =
          Math.abs(angleBetween(incomingAngle, qCommand.incomingAngle)) +
          Math.abs(angleBetween(outgoingAngle, qCommand.outgoingAngle));
        if (error > radiansPerDegree) {
          console.error({
            error,
            degrees: error * degreesPerRadian,
            path,
            inExpected: incomingAngle,
            inFound: qCommand.incomingAngle,
            outExpected: outgoingAngle,
            outFound: qCommand.outgoingAngle,
            qCommand,
          });
          svg.style.backgroundColor = "lightpink";
        }
      } else {
        svg.style.backgroundColor = "hsl(190 100% 85% / 1)";
      }
      svg.addEventListener("click", () => {
        console.log({
          inExpected: incomingAngle,
          inFound: qCommand?.incomingAngle,
          outExpected: outgoingAngle,
          outFound: qCommand?.outgoingAngle,
          qCommand,
        });
        debugger;
        const newCommand = QCommand.tryAngles(
          fromX,
          fromY,
          incomingAngle,
          toX,
          toY,
          outgoingAngle
        );
        console.log({
          newCommand,
          incomingAngle: newCommand?.incomingAngle,
          outgoingAngle: newCommand?.outgoingAngle,
        });
      });
    });
  });
}
