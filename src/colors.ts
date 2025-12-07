import "./colors.css"
import { querySelector } from "phil-lib/client-misc";

function hueToRgbPositive(hue: number): { r: number; g: number; b: number } {
  const h = ((hue % 360) + 360) % 360;
  const c = 0.8; // fixed for L=10%, S=100%
  const hPrime = h / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  const m = -0; // fixed offset

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
    r: Math.max(0, r1 + m),
    g: Math.max(0, g1 + m),
    b: Math.max(0, b1 + m),
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
    r: (base.r / brightest) ,
    g: (base.g / brightest) ,
    b: (base.b / brightest) ,
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
  BASE: { r: number; g: number; b: number }
): string {
  // Clamp
  const v = Math.max(0, Math.min(255, value));

  // Compute luminance of base color
  const baseLuminance = 0.299 * BASE.r + 0.587 * BASE.g + 0.114 * BASE.b;

  const baseColor = `color(srgb-linear ${BASE.r} ${BASE.g} ${BASE.b})`;
  // color-mix(in srgb-linear, color(srgb-linear 0 1 0) 5%, black) is very dark green

  if (v > baseLuminance) {
    // Brighter: interpolate to white
    const whitePercent = (v - baseLuminance) / (1 - baseLuminance)*100 ;
    return `color-mix(in srgb, white ${whitePercent}%, ${baseColor})`;
  } else {
    // Darker: interpolate to black
    const baseColorPercent = v / baseLuminance * 100;
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

const canvas = querySelector("canvas", HTMLCanvasElement);

function drawPalette() {
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

/*
let output = [];
for (let hue = 0; hue < 360; hue += 5) {
  output.push({ hue, ...hueToRgbPositive(hue) });
}
console.table(output);
*/
