import { getById } from "phil-lib/client-misc";
import "./style.css";

const svg = getById("main", SVGSVGElement);

class FontMetrics {
  readonly mHeight: number;
  readonly xHeight: number;
  readonly aWidth: number;
  readonly defaultKerning: number;
  constructor(fontSize: number) {
    if (fontSize <= 0 || !isFinite(fontSize)) {
      throw new Error("wtf");
    }
    this.mHeight = fontSize;
    this.xHeight = fontSize * 0.5;
    this.aWidth = fontSize * 0.75;
    this.defaultKerning = fontSize * 0.25;
  }
}

const fontMetrics = new FontMetrics(5);

function cssifyPath(path: string) {
  return `path('${path}')`;
}

type Drawing = { element: SVGElement; advance: number };

function drawA(x: number, y: number): Drawing {
  const { aWidth, mHeight, xHeight } = fontMetrics;
  const d = `M ${x},${y} L ${x + aWidth / 2},${y - mHeight} L ${
    x + aWidth
  },${y} M ${x + aWidth / 4},${y - xHeight} L ${x + aWidth * 0.75},${
    y - xHeight
  }`;
  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathElement.style.d = cssifyPath(d);
  return { element: pathElement, advance: aWidth };
}

function drawB(x: number, y: number): Drawing {
  const { aWidth, mHeight, xHeight } = fontMetrics;
  const advance = aWidth * 0.75;
  const topRadius = (mHeight - xHeight) / 2;
  const topLineLength = (advance - topRadius) * 0.75;
  const bottomRadius = xHeight / 2;
  const bottomLineLength = advance - bottomRadius;
  const d = `M ${x},${y - mHeight} L ${x},${y} L ${
    x + bottomLineLength
  },${y} M ${x + Math.max(bottomLineLength, topLineLength)},${
    y - xHeight
  } L ${x},${y - xHeight} M ${x},${y - mHeight} L ${x + topLineLength},${
    y - mHeight
  } Q ${x + topLineLength + topRadius},${y - mHeight} ${
    x + topLineLength + topRadius
  },${y - mHeight + topRadius} Q ${x + topLineLength + topRadius},${
    y - xHeight
  } ${x + topLineLength},${y - xHeight} M ${x + bottomLineLength},${
    y - xHeight
  } Q ${x + bottomLineLength + bottomRadius},${y - xHeight} ${
    x + bottomLineLength + bottomRadius
  },${y - bottomRadius} Q ${
    x + bottomLineLength + bottomRadius
  },${y} ${
    x + bottomLineLength
  },${y}`;
  const pathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  pathElement.style.d = cssifyPath(d);
  return { element: pathElement, advance };
}

function drawC(x: number, y: number): Drawing {
  const { aWidth, mHeight } = fontMetrics;
  const advance = Math.min(aWidth, mHeight *0.5);
  const radius = advance/2;
  const x1 = x+radius;
  const x2 = x + advance;
  const y1 = y - radius;
  const y3 = y - mHeight;
  const y2 = y3 + radius;
  const d = `M ${x2},${y2} Q ${x2},${y3} ${x1},${y3} Q ${x},${y3} ${x},${y2} L ${x},${y1} Q ${x},${y} ${x1},${y} Q ${x2},${y} ${x2},${y1}`;
  const element = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  element.style.d = cssifyPath(d);
  return { element, advance };
}

function drawD(x: number, y: number): Drawing {
  const { aWidth, mHeight } = fontMetrics;
  const advance = Math.min(aWidth, mHeight *0.5);
  const radius = advance/2;
  const x1 = x+radius;
  const x2 = x + advance;
  const y1 = y - radius;
  const y3 = y - mHeight;
  const y2 = y3 + radius;
  const d = `M ${x},${y3} L ${x},${y} L ${x1},${y} Q ${x2},${y} ${x2},${y1} L ${x2},${y2} Q ${x2},${y3} ${x1},${y3} L ${x},${y3}`;
  const element = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  element.style.d = cssifyPath(d);
  return { element, advance };
}

let x = 5;
function show(drawing: Drawing) {
  svg.appendChild(drawing.element);
  x += drawing.advance + fontMetrics.defaultKerning;
}
const baseLine = 10;

show(drawA(x, baseLine));
show(drawA(x, baseLine));
show(drawB(x, baseLine));
show(drawB(x, baseLine));
show(drawC(x, baseLine));
show(drawC(x, baseLine));
show(drawD(x, baseLine));
show(drawD(x, baseLine));
