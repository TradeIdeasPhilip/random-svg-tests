import { PathShape, PathShapeError, QCommand } from "./path-shape";
import "./path-debugger.css";
import { getById } from "phil-lib/client-misc";
import { initializedArray } from "phil-lib/misc";
import {
  angleBetween,
  degreesPerRadian,
  polarToRectangular,
  radiansPerDegree,
  RealSvgRect,
  RectUnion,
} from "./utility";

/**
 * If there are three straight lines in a row, and the middle one is tiny,
 * then delete the middle one.
 * Reconnect the two new loose ends.
 * Use the average of the two points as the new endpoint for each segment.
 * New angle:  Make the new connection smooth
 * Don't overthink it.  There will be an adjustment phase soon.
 * 
 * 👆 Update: I didn't actually have 3 straight lines in a row.  Some were
 * almost lines, but with a very tight curve at the end, you could miss
 * it if you weren't looking close.  In any case, I fixed that and
 * related issues.  And I no longer see three lines in a row.  So that
 * specific pattern isn't interesting any more.  But there are still some
 * good ideas in the previous paragraph.
 * 
 * 👆 Most of this work was focused on the second `@` in the sky-writing
 * demo.  This pattern is the default if you hit the Display button in the
 * path-debugger. Use the following string to see what that looked like
 * before the recent fixes:
 * 
 * ```
 * M 7.1538154883661145,-7.480293555924569 Q 7.409808340073928,-9.27515747446764 5.7630382598450325,-9.210474329718688 Q 1.8464397799298131,-9.056635060083273 3.4070887371081833,-5.56786398895746 Q 4.441931156328437,-3.254513328808433 7.635120807107003,-4.945727924399682 Q 8.681130161494316,-5.499727680359518 7.5166699420259055,-7.517494736600969 Q 7.612031597111727,-6.668370500899633 9.275991236913981,-7.113116162522168 Q 10.152210420235685,-7.987365722393067 11.028429603557388,-8.861615282263966 Q 11.00019693760491,-8.524464788915399 11.000196937604912,-8.524464788915418 Q 8.167041667103442,-10.66703775386983 5.333886396601973,-12.80961071882424 Q -0.5094669437503738,-14.44804090691655 -0.10101514219622686,-6.127466746635721 Q 0.8532776326675772,13.31243723631145 5.699438670360397,-1.8489848221148395 Q 5.949056437321195,-2.6299246812608157 8.202547109648547,-2.847660789138898
 * ```
 * Need to keep track of the requested angles for `QCommand.Angles()`.
 *
 * Need to keep track of the requested smooth vs kink for each connection.
 * Need to preserve this across a lot of perturbations.
 * Mostly because it's simpler to think about if I save it explicitly!
 * A lot of annoying details disappear‼
 *
 * And the same goes for the multiple disconnected segments.
 * But that should be easier.
 *
 * Remaining tiny segments.
 * Should all tiny segments get merged into other segments?
 * Or at least try, but skip any that cause problems.
 * Or maybe when we see another problem,
 * the first thing we should do is check if a nearby merge would help.
 * Easy to merge.
 * Try to spread these out:
 * If there are nothing but short segments, don't start from one end and keep merging to the end.
 * At least try to start in the middle and/or start with the smallest.
 * And merge it with the smaller of its two neighbors.
 * I.e. similar to a Huffman tree.
 * Replace two adjacent segments with one.
 * Try to keep the angles for the two remaining end points.
 *
 * Should we consider segments that were tiny before the move but are bigger now?
 * Maybe in some of the algorithms above,
 * like the three straights in a row and the middle one is tiny, or all tiny segments should be combined.
 * Or maybe consider all of the things that have grown the most.
 * That will cover things that were tiny before growing,
 * and normal things that got huge because of the angles.
 *
 * TO figure out:  How to adjust when the angles just don't match.
 * I've covered some big, obvious things, above.
 * But I'm sure that won't cover all of the cases.
 * I need something more general.
 */

const svg = getById("singlePathSvg", SVGSVGElement);
const input = getById("pathInputElement", HTMLInputElement);
const button = getById("displaySinglePath", HTMLButtonElement);
const errorElement = getById("singlePathErrorMessage", HTMLSpanElement);
const segmentsTable = getById("segments", HTMLTableElement);

button.addEventListener("click", () => {
  svg.innerHTML = "";
  document
    .querySelectorAll("#segments tr[data-temporary]")
    .forEach((dataRow) => {
      if (dataRow.firstElementChild) dataRow.remove();
    });
  const asString = input.value;
  const fullPathShape = PathShape.fromString(asString);
  let fullBBox: undefined | RealSvgRect;
  const commands = fullPathShape.commands;
  commands.map((command, index) => {
    const pathElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    pathElement.style.d = new PathShape([command]).cssPath;
    const color = `hsl(${2.4 * index}rad ${60 + Math.sin(index) * 40}% 50%)`;
    pathElement.style.stroke = color;
    svg.appendChild(pathElement);
    const bBox: RealSvgRect = pathElement.getBBox();
    if (fullBBox) {
      fullBBox = RectUnion(fullBBox, bBox);
    } else {
      fullBBox = bBox;
    }
    const rowElement = segmentsTable.insertRow();
    rowElement.dataset["temporary"] = "😎";
    const indexCell = rowElement.insertCell();
    indexCell.innerText = index.toString();
    indexCell.style.color = color;
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
          document
            .querySelectorAll("#singlePath .selected")
            .forEach((element) => element.classList.remove("selected"));
          [pathElement, indexCell].forEach((element) =>
            element.classList.add("selected")
          );
        });
      });
    }
  });
  if (fullBBox) {
    svg.viewBox.baseVal.x = fullBBox.x;
    svg.viewBox.baseVal.y = fullBBox.y;
    svg.viewBox.baseVal.width = fullBBox.width;
    svg.viewBox.baseVal.height = fullBBox.height;
  }
});

input.addEventListener("keyup", (event) => {
  if (event.code == "Enter") {
    button.click();
    event.preventDefault();
  }
});

{
  let errorClick = () => {};

  const inputListener = () => {
    const d = input.value;
    if (d.trim() === "") {
      input.style.backgroundColor = "";
      button.disabled = true;
      errorElement.innerText = "";
    } else {
      try {
        PathShape.fromString(d);
        button.disabled = false;
        errorElement.innerText = "";
      } catch (reason) {
        if (!(reason instanceof PathShapeError)) {
          throw reason;
        }
        button.disabled = true;
        errorElement.innerText = reason.message;
        errorClick = () => {
          input.focus();
          input.setSelectionRange(d.length - reason.where.length, d.length);
        };
      }
    }
  };
  input.addEventListener("input", inputListener);
  input.value =
    '{"commands":[{"command":"Q","x0":7.1538154883661145,"y0":-7.480293555924569,"x1":7.409808340073928,"y1":-9.27515747446764,"x":5.7630382598450325,"y":-9.210474329718688,"creationInfo":{"source":"angles","success":true,"angle":-3.180851267398103,"angle0":-1.4291265691784338}},{"command":"Q","x0":5.7630382598450325,"y0":-9.210474329718688,"x1":1.8464397799298093,"y1":-9.056635060083275,"x":3.4070887371081833,"y":-5.56786398895746,"creationInfo":{"source":"angles","success":true,"angle":1.1501609331315614,"angle0":-3.180851267398103}},{"command":"Q","x0":3.4070887371081833,"y0":-5.56786398895746,"x1":4.441931156328437,"y1":-3.2545133288084345,"x":7.635120807107003,"y":-4.945727924399682,"creationInfo":{"source":"angles","success":true,"angle":-0.48707103587175704,"angle0":1.1501609331315614}},{"command":"Q","x0":7.635120807107003,"y0":-4.945727924399682,"x1":8.681130161494314,"y1":-5.499727680359517,"x":7.5166699420259055,"y":-7.517494736600969,"creationInfo":{"source":"angles","success":true,"angle":-2.094209927326821,"angle0":-0.48707103587175704}},{"command":"Q","x0":7.5166699420259055,"y0":-7.517494736600969,"x1":7.612031597111727,"y1":-6.668370500899633,"x":9.275991236913981,"y":-7.113116162522168,"creationInfo":{"source":"angles","success":true,"angle":-0.26117633695366965,"angle0":1.4589590500865532}},{"command":"Q","x0":9.275991236913981,"y0":-7.113116162522168,"x1":10.152210420235685,"y1":-7.987365722393067,"x":11.028429603557388,"y":-8.861615282263966,"creationInfo":{"source":"angles","success":false,"angle":0.15833472101110302,"angle0":-0.26117633695366965}},{"command":"Q","x0":11.028429603557388,"y0":-8.861615282263966,"x1":11.01431327058115,"y1":-8.693040035589693,"x":11.000196937604912,"y":-8.524464788915418,"creationInfo":{"source":"angles","success":false,"angle":-1.3853385213833163,"angle0":0.15833472101110302}},{"command":"Q","x0":11.000196937604912,"y0":-8.524464788915418,"x1":11.918949961449401,"y1":-13.421510828588955,"x":5.333886396601973,"y":-12.80961071882424,"creationInfo":{"source":"angles","success":true,"angle":3.048936294908109,"angle0":-1.3853385213833163}},{"command":"Q","x0":5.333886396601973,"y0":-12.80961071882424,"x1":-0.40286919185697295,"y1":-12.276537447821935,"x":-0.10101514219622686,"y":-6.127466746635721,"creationInfo":{"source":"angles","success":true,"angle":1.5217463242305782,"angle0":3.048936294908109}},{"command":"Q","x0":-0.10101514219622686,"y0":-6.127466746635721,"x1":0.4024910522016845,"y1":4.1294610345805625,"x":5.699438670360397,"y":-1.8489848221148395,"creationInfo":{"source":"angles","success":true,"angle":-0.8457659177724672,"angle0":1.5217463242305782}},{"command":"Q","x0":5.699438670360397,"y0":-1.8489848221148395,"x1":6.575365258901424,"y1":-2.837606961038838,"x":8.202547109648547,"y":-2.847660789138898,"creationInfo":{"source":"angles","success":true,"angle":-0.006178596547134373,"angle0":-0.8457659177724672}}]}';
  inputListener();
  errorElement.parentElement!.addEventListener("click", () => errorClick());
}
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
      // TODO remove deprecated function tryAngles().
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
        } else {
          svg.style.backgroundColor = "rgb(26, 217, 255)";
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
