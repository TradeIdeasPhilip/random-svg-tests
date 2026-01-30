import "./colors.css";
import { querySelector } from "phil-lib/client-misc";
import { getOkLCHMaxChroma } from "colorizr";

const RED_VALUE = 0.299;
const GREEN_VALUE = 0.587;
const BLUE_VALUE = 0.114;

function hueToRgbPositive(hue: number): { r: number; g: number; b: number } {
  const h = ((hue % 360) + 360) % 360;
  const c = 0.8; // fixed for L=10%, S=100%
  const hPrime = h / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));

  let r1 = 0,
    g1 = 0,
    b1 = 0;
  if (hPrime < 1) {
    r1 = c;
    g1 = x;
  } else if (hPrime < 2) {
    r1 = x;
    g1 = c;
  } else if (hPrime < 3) {
    g1 = c;
    b1 = x;
  } else if (hPrime < 4) {
    g1 = x;
    b1 = c;
  } else if (hPrime < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  return {
    r: Math.max(0, r1 /* / RED_VALUE */),
    g: Math.max(0, g1 /* / GREEN_VALUE */),
    b: Math.max(0, b1 /* / BLUE_VALUE */),
  };
}

/**
 * Maintain the hue.
 * Scale all three channels equally.
 * Make the brightest channel 1.0.
 * @param hue In degrees.  0 = 360 = red, 120 = green, 240 = blue
 * @returns A color.  Values from 0 - 1
 */
function hueToBrightest(hue: number) {
  const base = hueToRgbPositive(hue);
  const brightest = Math.max(base.r, base.g, base.b);
  return {
    r: base.r / brightest,
    g: base.g / brightest,
    b: base.b / brightest,
  };
}

/**
 * TODO fix these comments!!
 * Maps a grayscale value (0-255) to a monochromatic palette defined by a base color.
 * - 0 → black
 * - luminance(base) → base color
 * - 255 → white
 * @param value Grayscale input (0-255)
 * @param baseColorHex Base color in #RRGGBB format (e.g. "#FFA500")
 * @returns Hex color string (e.g. "#FFAB12")
 */
function grayscaleToPalette(
  value: number,
  BASE: { r: number; g: number; b: number },
): string {
  // Clamp
  const v = Math.max(0, Math.min(1, value));

  // Compute luminance of base color
  const baseLuminance =
    RED_VALUE * BASE.r + GREEN_VALUE * BASE.g + BLUE_VALUE * BASE.b;

  const baseColor = `color(srgb-linear ${BASE.r} ${BASE.g} ${BASE.b})`;
  // color-mix(in srgb-linear, color(srgb-linear 0 1 0) 5%, black) is very dark green

  if (v > baseLuminance) {
    // Brighter: interpolate to white
    const whitePercent = ((v - baseLuminance) / (1 - baseLuminance)) * 100;
    return `color-mix(in srgb-linear, white ${whitePercent}%, ${baseColor})`;
  } else {
    // Darker: interpolate to black
    const baseColorPercent = (v / baseLuminance) * 100;
    return `color-mix(in srgb-linear, ${baseColor} ${baseColorPercent}%, black)`;
  }
}

/**
 * Create the most saturated color possible for a give hue and value.
 * @param hue In degrees.  0 = 360 = red, 120 = green, 240 = blue
 * @param value 0 = black, 255 = white
 * @returns a color.
 */
function fromHueValue(hue: number, value: number) {
  return grayscaleToPalette(value, hueToBrightest(hue));
}
(window as any).fromHueValue = fromHueValue;

const myCanvas = querySelector("canvas#mine", HTMLCanvasElement);
const libraryCanvas = querySelector("canvas#library", HTMLCanvasElement);

function drawPalette() {
  const canvas = myCanvas;
  const { height, width } = canvas;
  const context = canvas.getContext("2d")!;
  for (let x = 0; x < width; x++) {
    const hue = (x * 360) / width;
    const base = hueToBrightest(hue);
    for (let y = 0; y < height; y++) {
      const minValue = 0.05;
      const maxValue = 0.95;
      const value = (y * (maxValue - minValue)) / (height - 1) + minValue;
      context.fillStyle = grayscaleToPalette(value, base);
      context.fillRect(x, y, 1, 1);
    }
  }
}

drawPalette();

/**
 * Returns a fully saturated, perceptually correct CSS color string
 * for any hue + lightness/value (0–1).
 * Uses OKLCH — modern, native, beautiful.
 */
export function hueToCssColor(hue: number, lightness: number): string {
  const h = ((hue % 360) + 360) % 360;

  // lightness in OKLCH is 0–1 (same as your input)
  const l = Math.max(0, Math.min(1, lightness));

  // Get the maximum possible chroma for this hue + lightness
  const c = getOkLCHMaxChroma({ l, h, c: 0.25404 });

  // Optional: add alpha = 1 (or let caller pass it)
  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${h.toFixed(2)}deg)`;
}

function drawPalette1() {
  const canvas = libraryCanvas;
  const { height, width } = canvas;
  const context = canvas.getContext("2d")!;
  for (let x = 0; x < width; x++) {
    const hue = (x * 360) / width;
    for (let y = 0; y < height; y++) {
      const minValue = 0.4;
      const maxValue = 0.95;
      const value = (y * (maxValue - minValue)) / (height - 1) + minValue;
      context.fillStyle = hueToCssColor(hue, value);
      context.fillRect(x, y, 1, 1);
    }
  }
}
drawPalette1();

{
  const colors = [
    0 /* red */,
    1 /* orange */,
    "#d8d800" /* 2 yellow */,
    "#0e0" /* 4 lime */,
    "#00d8d8" /* 6 cyan */,
    7 /* azure */,
    "rgb(32, 64, 255)" /* 8 blue */,
    9 /* violet */,
    10 /* magenta */,
  ];
  ["svg#black-background", "svg#white-background"].forEach((selectorString) => {
    const svg = querySelector(selectorString, SVGSVGElement);
    colors.forEach((value, index) => {
      const color =
        typeof value == "string"
          ? value
          : `hwb(${((360 / 12) * value).toFixed(2)}deg 0% 0%)`;
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle",
      );
      circle.cx.baseVal.value = index + 0.5;
      circle.cy.baseVal.value = 0.5;
      circle.r.baseVal.value = 0.3;
      circle.style.fill = color;
      svg.append(circle);
      const thinLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      thinLine.x1.baseVal.value = index + 0.2;
      thinLine.x2.baseVal.value = index + 0.8;
      thinLine.y1.baseVal.value = 1.2;
      thinLine.y2.baseVal.value = 1.8;
      thinLine.style.stroke = color;
      thinLine.style.strokeWidth = "0.02";
      svg.append(thinLine);
      const thickLine = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line",
      );
      thickLine.x1.baseVal.value = index + 0.8;
      thickLine.x2.baseVal.value = index + 0.2;
      thickLine.y1.baseVal.value = 1.2;
      thickLine.y2.baseVal.value = 1.8;
      thickLine.style.stroke = color;
      thickLine.style.strokeWidth = "0.1";
      svg.append(thickLine);
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      text.style.fill = color;
      text.style.fontSize = "0.25px";
      //text.style. dominantBaseline="central";
      text.style.textAnchor = "middle";
      text.textContent = "Philip";
      text.setAttribute("x", (index + 0.5).toString());
      text.setAttribute("y", "2.5");
      text.style.transform = "rotate(-45deg)";
      text.style.transformBox = "fill-box";
      text.style.transformOrigin = "center";
      svg.append(text);
    });
  });
}
