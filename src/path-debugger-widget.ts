import { assertClass } from "phil-lib/misc";
import "./path-debugger-widget.css";
import { PathShape, QCommand } from "./path-shape";

import {
  RealSvgRect,
  rectUnion,
  degreesPerRadian,
  angleBetween,
  rectAddPoint,
} from "./utility";
import { getById } from "phil-lib/client-misc";

export function createPathDebugger(pathShape?: PathShape) {
  const container = document.createElement("div");
  container.innerHTML = `
      <div class="pathDebugger">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        ></svg>
        <table class="segments">
          <tr>
            <th rowspan="2">#</th>
            <th rowspan="2">C</th>
            <th rowspan="2">Length</th>
            <th colspan="2">Requested</th>
            <th colspan="2">Actual</th>
            <th rowspan="2">Difference</th>
          </tr>
          <tr>
            <th>Incoming</th>
            <th>Outgoing</th>
            <th>Incoming</th>
            <th>Outgoing</th>
          </tr>
        </table>
      </div>`;
  const topLevelElement = assertClass(
    container.firstElementChild,
    HTMLDivElement
  );
  const svg = assertClass(topLevelElement.firstElementChild, SVGSVGElement);
  const segmentsTable = assertClass(svg.nextElementSibling, HTMLTableElement);

  let selectedIndex = -1;

  function updateDisplay() {
    // Delete old stuff.
    svg.innerHTML = "";
    segmentsTable.querySelectorAll("tr[data-temporary]").forEach((dataRow) => {
      if (dataRow.firstElementChild) dataRow.remove();
    });
    selectedIndex = -1;
    if (pathShape) {
      // Draw the new stuff.
      let fullBBox: undefined | RealSvgRect;
      const commands = pathShape.commands;
      commands.map((command, index) => {
        const pathElement = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        pathElement.style.d = new PathShape([command]).cssPath;
        const color = `hsl(${2.4 * index}rad ${
          60 + Math.sin(index) * 40
        }% 50%)`;
        pathElement.style.stroke = color;
        svg.appendChild(pathElement);
        const bBox: RealSvgRect = pathElement.getBBox();
        if (fullBBox) {
          fullBBox = rectUnion(fullBBox, bBox);
        } else {
          fullBBox = bBox;
        }
        const controlPoints: SVGCircleElement[] = [];
        if (command instanceof QCommand) {
          const circle = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );
          circle.classList.add("control-point");
          if (
            command.creationInfo.source == "angles" &&
            !command.creationInfo.success
          ) {
            circle.classList.add("error");
          }
          const x = command.x1;
          const y = command.y1;
          circle.cx.baseVal.value = 0;
          circle.cy.baseVal.value = 0;
          circle.r.baseVal.value = 1;
          const MYSTERY_FACTOR = 0.75; // TODO WTF?
          circle.style.setProperty(
            "--x",
            (x * MYSTERY_FACTOR).toFixed(6) + "pt"
          );
          circle.style.setProperty(
            "--y",
            (y * MYSTERY_FACTOR).toFixed(6) + "pt"
          );
          circle.style.fill = color;
          svg.appendChild(circle);
          controlPoints.push(circle);
          fullBBox = rectAddPoint(fullBBox, x, y);
        }

        const rowElement = segmentsTable.insertRow();
        rowElement.dataset["temporary"] = "😎";
        const indexCell = rowElement.insertCell();
        indexCell.innerText = index.toString();
        indexCell.style.color = color;
        indexCell.classList.add("index-column");
        const commandCell = rowElement.insertCell();
        commandCell.innerText = command.command;
        const lengthCell = rowElement.insertCell();
        lengthCell.innerText = pathElement.getTotalLength().toFixed(2);
        const showAngle = (element: HTMLTableCellElement, angle: number) => {
          element.innerText = (angle * degreesPerRadian).toFixed(2) + "°";
        };
        const incomingRequestedCell = rowElement.insertCell();
        const outgoingRequestedCell = rowElement.insertCell();
        if (command instanceof QCommand) {
          const creationInfo = command.creationInfo;
          if (creationInfo.source == "angles") {
            showAngle(incomingRequestedCell, creationInfo.angle0);
            showAngle(outgoingRequestedCell, creationInfo.angle);
            if (!creationInfo.success) {
              [incomingRequestedCell, outgoingRequestedCell].forEach((cell) =>
                cell.classList.add("error")
              );
            }
          }
        }
        const incomingCell = rowElement.insertCell();
        const incomingAngle = command.incomingAngle;
        showAngle(incomingCell, incomingAngle);
        const outgoingCell = rowElement.insertCell();
        const outgoingAngle = command.outgoingAngle;
        showAngle(outgoingCell, outgoingAngle);
        const differenceCell = rowElement.insertCell();
        const previousCommand = commands[index - 1];
        const difference = PathShape.needAnM(previousCommand, command)
          ? undefined
          : angleBetween(previousCommand.outgoingAngle, command.incomingAngle);
        if (difference !== undefined) {
          showAngle(differenceCell, difference);
        }
        {
          const normalCells: readonly HTMLTableCellElement[] = [
            indexCell,
            commandCell,
            lengthCell,
            incomingRequestedCell,
            outgoingRequestedCell,
            incomingCell,
            outgoingCell,
          ];
          const selectableElements = [pathElement, ...normalCells];
          const adjust = (action: "add" | "remove") => {
            selectableElements.forEach((display) => {
              display.classList[action]("hover");
            });
          };
          selectableElements.forEach((listener) => {
            listener.addEventListener("mouseenter", () => adjust("add"));
            listener.addEventListener("mouseleave", () => adjust("remove"));
            listener.addEventListener("click", () => {
              topLevelElement
                .querySelectorAll(".selected")
                .forEach((element) => element.classList.remove("selected"));
              [pathElement, indexCell].forEach((element) =>
                element.classList.add("selected")
              );
              selectedIndex = index;
              notifyListeners();
            });
          });
        }
      });
      if (fullBBox) {
        // Tell the SVG to display the entire path.  Don't include any margin or padding.
        svg.viewBox.baseVal.x = fullBBox.x;
        svg.viewBox.baseVal.y = fullBBox.y;
        svg.viewBox.baseVal.width = fullBBox.width;
        svg.viewBox.baseVal.height = fullBBox.height;
        // And scale the stroke-width to look approximately the same to the user
        // regardless of the scale.  The exact numbers were based on tweaking things
        // and seeing what looked good.
        svg.style.setProperty(
          "--stroke-width",
          (
            Math.hypot(fullBBox.width, fullBBox.height) * 0.008305657597434369
          ).toString()
        );
      }
    }
    if (!(pathShape && pathShape.commands.length > 0)) {
      const rowElement = segmentsTable.insertRow();
      rowElement.dataset["temporary"] = "🎃";
      const cellElement = rowElement.insertCell();
      cellElement.colSpan = 8;
      cellElement.classList.add("empty");
      cellElement.innerText = "Empty";
    }

    notifyListeners();
  }

  type Listener = () => void;
  const listeners: Listener[] = [];
  function notifyListeners(): void {
    listeners.forEach((listener) => {
      try {
        listener();
      } catch (reason) {
        console.error(reason);
      }
    });
  }

  updateDisplay();

  function insertBefore(element: Element | string) {
    if (typeof element === "string") {
      element = getById(element, Element);
    }
    element.parentElement!.insertBefore(topLevelElement, element);
  }

  return {
    topLevelElement,
    get pathShape() {
      return pathShape;
    },
    set pathShape(newValue) {
      pathShape = newValue;
      updateDisplay();
    },
    insertBefore,
    get selectedIndex() {
      return selectedIndex;
    },
    listeners,
  };
}
