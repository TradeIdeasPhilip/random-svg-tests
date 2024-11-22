import {
  initializedArray,
  makeBoundedLinear,
  polarToRectangular,
} from "phil-lib/misc";
import { DescriptionOfLetter, Font, FontMetrics } from "./letters-base";
import { PathShape, PathBuilder, LCommand, QCommand } from "./path-shape";

const dEast = 0;
const dSouthEast = Math.PI / 4; // 45°
const dSouth = 2 * dSouthEast; // 90°
const dSouthWest = 3 * dSouthEast;
const dWest = 4 * dSouthEast; // 180°
const dNorthWest = 5 * dSouthEast;
const dNorth = 6 * dSouthEast; // 270°
const dNorthEast = 7 * dSouthEast;

dEast || dSouthEast || dNorthEast;

/**
 * This seems silly.  Is size really the only input?
 * I'm not sure that the size should be fixed at this time.
 * And it seems like fontMetrics should be the input.
 * @param fontSize The M height in svg units.
 * @returns A new font.
 */
export function makeLineFont(fontMetrics: number | FontMetrics): Font {
  const result = new Map<string, DescriptionOfLetter>();
  if (typeof fontMetrics === "number") {
    fontMetrics = new FontMetrics(fontMetrics);
  }
  const add = (letter: string, shape: PathShape, advance: number) => {
    const description = new DescriptionOfLetter(shape, advance, fontMetrics);
    if (result.has(letter)) {
      throw new Error(
        `duplicate letter: "${letter}", previous letter: "${
          [...result].at(-1)![0]
        }"`
      );
    }
    result.set(letter, description);
  };
  const {
    aWidth,
    digitWidth,
    capitalTop,
    capitalTopMiddle,
    capitalMiddle,
    capitalBottomMiddle,
    baseline,
    descender,
    strokeWidth,
  } = fontMetrics;
  const left = 0;
  const dotHeight = strokeWidth / 3;
  // MARK: &
  {
    // This code was automatically generated.
    // See path-debugger.ts for the source.
    const scaleFactor = fontMetrics.mHeight;
    const advance = 0.5803571598560251 * scaleFactor;
    const commands: QCommand[] = [];
    commands.push(
      QCommand.controlPoints(
        0.5803571598560251 * scaleFactor,
        -0.011904772996231272 * scaleFactor,
        0.1993461912459357 * scaleFactor,
        -0.4845653833822309 * scaleFactor,
        0.15178572549774305 * scaleFactor,
        -0.5833333559985097 * scaleFactor
      )
    );
    commands.push(
      QCommand.controlPoints(
        0.15178572549774305 * scaleFactor,
        -0.5833333559985097 * scaleFactor,
        0.07142858010885174 * scaleFactor,
        -0.7502096094253163 * scaleFactor,
        0.07142858010885174 * scaleFactor,
        -0.8809523915616125 * scaleFactor
      )
    );
    commands.push(
      QCommand.controlPoints(
        0.07142858010885174 * scaleFactor,
        -0.8809523915616125 * scaleFactor,
        0.07142858010885174 * scaleFactor,
        -1 * scaleFactor,
        0.18154763484090689 * scaleFactor,
        -1 * scaleFactor
      )
    );
    commands.push(
      QCommand.controlPoints(
        0.18154763484090689 * scaleFactor,
        -1 * scaleFactor,
        0.3125000278492327 * scaleFactor,
        -1 * scaleFactor,
        0.3125000278492327 * scaleFactor,
        -0.8809523857747589 * scaleFactor
      )
    );
    commands.push(
      QCommand.controlPoints(
        0.3125000278492327 * scaleFactor,
        -0.8809523857747589 * scaleFactor,
        0.3125000278492327 * scaleFactor,
        -0.795672021064033 * scaleFactor,
        0.14880952935525849 * scaleFactor,
        -0.5863095347804337 * scaleFactor
      )
    );
    commands.push(
      QCommand.controlPoints(
        0.14880952935525849 * scaleFactor,
        -0.5863095347804337 * scaleFactor,
        0 * scaleFactor,
        -0.39598002063544424 * scaleFactor,
        0 * scaleFactor,
        -0.23511904966855834 * scaleFactor
      )
    );
    commands.push(
      QCommand.controlPoints(
        0 * scaleFactor,
        -0.23511904966855834 * scaleFactor,
        0 * scaleFactor,
        0 * scaleFactor,
        0.16369048113341364 * scaleFactor,
        0 * scaleFactor
      )
    );
    commands.push(
      QCommand.controlPoints(
        0.16369048113341364 * scaleFactor,
        0 * scaleFactor,
        0.31699631330709954 * scaleFactor,
        0 * scaleFactor,
        0.45535713019840074 * scaleFactor,
        -0.4583333263408854 * scaleFactor
      )
    );
    add("&", new PathShape(commands), advance);
  }
  // MARK: < and >
  {
    const sideLength = digitWidth;
    const advance = (sideLength / 2) * Math.sqrt(3);
    const middle = (baseline + capitalTop) / 2;
    const top = middle - sideLength / 2;
    const bottom = top + sideLength;
    const left = 0;
    const right = advance;
    add(
      "<",
      new PathShape([
        QCommand.line4(right, top, left, middle),
        QCommand.line4(left, middle, right, bottom),
      ]),
      advance
    );
    add(
      ">",
      new PathShape([
        QCommand.line4(left, top, right, middle),
        QCommand.line4(right, middle, left, bottom),
      ]),
      advance
    );
  }
  // MARK: ?
  {
    const advance = digitWidth * 0.9;
    const center = advance / 2;
    //const right = advance;
    const radius = advance / 2;
    const sqrt = radius * Math.SQRT1_2;
    const pathBuilder = PathBuilder.M(left, capitalTop + radius);
    pathBuilder.arc(
      center,
      capitalTop + radius,
      center + sqrt,
      capitalTop + radius + sqrt,
      "cw"
    );
    pathBuilder.Q_angles(center, capitalBottomMiddle, dSouth);
    pathBuilder.M(center, baseline - dotHeight);
    pathBuilder.L(center, baseline);
    add("?", pathBuilder.pathShape, advance);
  }
  {
    const advance = (digitWidth * 7) / 8;
    const center = advance / 2;
    const right = advance;
    const radius = advance / 2;
    const tipHeight = fontMetrics.mHeight / 8;
    const top = capitalTop - tipHeight;
    const bottom = baseline + tipHeight;
    if (bottom - top < radius * 4) {
      throw new Error("wtf");
    }
    const middle = (top + bottom) / 2;
    const lShape = PathBuilder.M(right, top)
      .arc(right, top + radius, center, top + radius, "ccw")
      .L(center, middle - radius)
      .arc(left, middle - radius, left, middle, "cw")
      .arc(left, middle + radius, center, middle + radius, "cw")
      .L(center, bottom - radius)
      .arc(right, bottom - radius, right, bottom, "ccw").pathShape;
    add("{", lShape, advance);
    const rShape = PathBuilder.M(left, top)
      .arc(left, top + radius, center, top + radius, "cw")
      .L(center, middle - radius)
      .arc(right, middle - radius, right, middle, "ccw")
      .arc(right, middle + radius, center, middle + radius, "ccw")
      .L(center, bottom - radius)
      .arc(left, bottom - radius, left, bottom, "cw").pathShape;
    add("}", rShape, advance);
  }
  {
    const advance = digitWidth;
    const radius = advance / 2;
    const center = radius;
    const right = advance;
    {
      const curveHeight = (descender - baseline) * 2;
      const y0 = descender;
      const y1 = y0 - curveHeight;
      const y3 = capitalTop - curveHeight / 4;
      const y2 = y3 + curveHeight;
      if (curveHeight <= 0 || y0 <= y1 || y1 <= y2 || y2 <= y3) {
        throw new Error("wtf");
      }
      const advance = digitWidth * 0.5;
      {
        // MARK: (
        const shape = PathBuilder.M(advance, y3)
          .Q_HV(0, y2)
          .V(y1)
          .Q_VH(advance, y0).pathShape;
        add("(", shape, advance);
      }
      {
        // MARK: )
        const advance = digitWidth * 0.5;
        const shape = PathBuilder.M(0, y3)
          .Q_HV(advance, y2)
          .V(y1)
          .Q_VH(0, y0).pathShape;
        add(")", shape, advance);
      }
      {
        // MARK: [
        const shape = PathBuilder.M(advance, y3)
          .H(0)
          .V(y0)
          .H(advance).pathShape;
        add("[", shape, advance);
      }
      {
        // MARK: ]
        const shape = PathBuilder.M(0, y3).H(advance).V(y0).H(0).pathShape;
        add("]", shape, advance);
      }
    }
    {
      // MARK: ~
      const outerWidth = digitWidth * 0.4;
      const innerWidth = digitWidth * 0.3;
      const x0 = left;
      const x1 = x0 + outerWidth;
      const x2 = x1 + innerWidth;
      const x3 = x2 + innerWidth;
      const x4 = x3 + outerWidth;
      const advance = x4;
      const vOffset = digitWidth * 0.25;
      const middle = capitalMiddle;
      const top = middle - vOffset;
      const bottom = middle + vOffset;
      const shape = PathBuilder.M(x0, middle)
        .Q_angles(x1, top, dEast, dNorthEast)
        .Q_angles(x2, middle, (dSouth + dSouthEast) / 2)
        .Q_angles(x3, bottom, dEast)
        .Q_angles(x4, middle, dNorthEast).pathShape;
      //shape.dump();
      add("~", shape, advance);
    }
    {
      // MARK: +
      const advance = digitWidth * 0.75;
      const center = advance / 2;
      const shape = PathBuilder.M(center, capitalMiddle - center)
        .V(capitalMiddle + center)
        .M(left, capitalMiddle)
        .H(advance).pathShape;
      add("+", shape, advance);
    }
    {
      // MARK: -
      const advance = digitWidth * 0.75;
      const shape = PathBuilder.M(left, capitalMiddle).H(advance).pathShape;
      add("-", shape, advance);
    }
    {
      // MARK: *
      const outerRadius = (digitWidth / 2) * 0.9;
      const spokes = 5;
      const initialAngle = -Math.PI / 2;
      const middle = (capitalTop + baseline) / 2;
      const innerRadius = 0;
      const geometry = initializedArray(spokes, (n) => {
        const θ = (n * (Math.PI * 2)) / spokes + initialAngle;
        const inside = polarToRectangular(innerRadius, θ);
        const outside = polarToRectangular(outerRadius, θ);
        return [inside, outside];
      });
      const allPoints = geometry.flat();
      const smallestX = Math.min(...allPoints.map(({ x }) => x));
      allPoints.forEach((point) => {
        point.x -= smallestX;
        point.y += middle;
      });
      const commands = geometry.map(
        ([from, to]) => new LCommand(from.x, from.y, to.x, to.y)
      );
      const shape = new PathShape(commands);
      const advance = Math.max(...allPoints.map(({ x }) => x));
      add("*", shape, advance);
    }
    {
      // MARK: =
      const advance = digitWidth * 0.75;
      const shape = PathBuilder.M(left, capitalMiddle - strokeWidth * 1.25)
        .H(advance)
        .M(left, capitalMiddle + strokeWidth * 1.25)
        .H(advance).pathShape;
      add("=", shape, advance);
    }
    {
      // MARK: _
      const advance = digitWidth * 1.25;
      const y = baseline + strokeWidth;
      const shape = PathBuilder.M(0, y).H(advance).pathShape;
      add("_", shape, advance);
    }
    {
      // MARK: #
      const third = digitWidth / 2;
      const advance = 3 * third;
      const tilt = third / 3;
      const y0 = capitalTop;
      const y1 = y0 + third;
      const y2 = y1 + third;
      const y3 = y2 + third;
      const shape = PathBuilder.M(third + tilt, y0)
        .L(third - tilt, y3)
        .M(2 * third + tilt, y0)
        .L(2 * third - tilt, y3)
        .M(0, y1)
        .H(advance)
        .M(0, y2)
        .H(advance).pathShape;
      add("#", shape, advance);
    }
    {
      // MARK: @
      const third = digitWidth / 2;
      const advance = 3 * third;
      const left = 0;
      const leftCenter = third;
      const center = advance / 2;
      const rightCenter = 2 * third;
      const right = advance;
      const top = capitalTop + (fontMetrics.mHeight - advance) / 2; // And assert (left==0);
      const topMiddle = top + leftCenter;
      const middle = top + center;
      const bottomMiddle = top + rightCenter;
      const bottom = top + right;
      const shape = PathBuilder.M(rightCenter, middle)
        .Q_VH(center, topMiddle)
        .Q_HV(leftCenter, middle)
        .Q_VH(center, bottomMiddle)
        .Q_HV(rightCenter, middle)
        .Q_VH((rightCenter + right) / 2, bottomMiddle)
        .Q_HV(right, middle)
        .V((topMiddle + middle) / 2)
        .Q_VH(center, top)
        .Q_HV(left, middle)
        .Q_VH(center, bottom)
        .H((rightCenter + right) / 2).pathShape;
      add("@", shape, advance);
    }
    {
      // MARK: 0
      const shape = PathBuilder.M(center, capitalTop)
        .Q(right, capitalTop, right, capitalTopMiddle)
        .L(right, capitalBottomMiddle)
        .Q(right, baseline, center, baseline)
        .Q(left, baseline, left, capitalBottomMiddle)
        .L(left, capitalTopMiddle)
        .Q(left, capitalTop, center, capitalTop)
        .M(right, capitalTopMiddle)
        .L(left, capitalBottomMiddle).pathShape;
      add("0", shape, advance);
    }
    {
      // MARK: 1
      const shape = PathBuilder.M(left, capitalTopMiddle)
        .Q(center, capitalTopMiddle, center, capitalTop)
        .L(center, baseline)
        .M(left, baseline)
        .L(right, baseline).pathShape;
      add("1", shape, advance);
    }
    {
      // MARK: 2
      const shape = PathBuilder.M(left, capitalTopMiddle)
        .Q_VH(center, capitalTop)
        .Q_HV(right, capitalTopMiddle)
        .Q_VH(center, capitalMiddle)
        .Q_HV(left, baseline)
        .L(right, baseline).pathShape;
      add("2", shape, advance);
    }
    {
      // MARK: 3
      const shape = PathBuilder.M(left, capitalTopMiddle)
        .Q_VH(center, capitalTop)
        .Q_HV(right, capitalTopMiddle)
        .Q_VH(center, capitalMiddle)
        .Q_HV(right, capitalBottomMiddle)
        .Q_VH(center, baseline)
        .Q_HV(left, capitalBottomMiddle).pathShape;
      add("3", shape, advance);
    }
    {
      // MARK: 4
      const centerRight = (center + right) / 2;
      const centerLeft = (center + left) / 2;
      const shape = PathBuilder.M(right, capitalMiddle)
        .L(left, capitalMiddle)
        .L(centerLeft, capitalTop)
        .M(centerRight, capitalTop)
        .L(centerRight, baseline).pathShape;
      add("4", shape, advance);
    }
    {
      // MARK: 5
      const centerLeft = left + digitWidth / 5;
      const centerRight = right - digitWidth / 5;
      const curveMiddle = (capitalMiddle + capitalBottomMiddle) / 2;
      const shape = PathBuilder.M(centerRight, capitalTop)
        .L(centerLeft, capitalTop)
        .L(left, capitalMiddle)
        .Q_VH(center, capitalTopMiddle)
        .Q_HV(right, curveMiddle)
        .Q_VH(center, baseline)
        .Q_HV(left, capitalBottomMiddle).pathShape;
      add("5", shape, advance);
    }
    {
      // MARK: 6
      const shape = PathBuilder.M(right, capitalTop)
        .Q_HV(left, capitalBottomMiddle)
        .Q_VH(center, baseline)
        .Q_HV(right, capitalBottomMiddle)
        .Q_VH(center, capitalMiddle)
        .Q_HV(left, capitalBottomMiddle).pathShape;
      add("6", shape, advance);
    }
    {
      // MARK: 7
      const shape = PathBuilder.M(left, capitalTop)
        .L(right, capitalTop)
        .L(left, baseline).pathShape;
      add("7", shape, advance);
    }
    {
      // MARK: 8
      const shape = PathBuilder.M(center, capitalTop)
        .Q(right, capitalTop, right, capitalTopMiddle)
        .Q(right, capitalMiddle, center, capitalMiddle)
        .Q(left, capitalMiddle, left, capitalBottomMiddle)
        .Q(left, baseline, center, baseline)
        .Q(right, baseline, right, capitalBottomMiddle)
        .Q(right, capitalMiddle, center, capitalMiddle)
        .Q(left, capitalMiddle, left, capitalTopMiddle)
        .Q(left, capitalTop, center, capitalTop).pathShape;
      add("8", shape, advance);
    }
    {
      // MARK: 9
      const shape = PathBuilder.M(right, capitalTopMiddle)
        .Q(right, capitalTop, center, capitalTop)
        .Q(left, capitalTop, left, capitalTopMiddle)
        .Q(left, capitalMiddle, center, capitalMiddle)
        .Q(right, capitalMiddle, right, capitalTopMiddle)
        .Q(right, baseline, left, baseline).pathShape;
      add("9", shape, advance);
    }
  }

  {
    // MARK: A
    const shape = PathBuilder.M(left, baseline)
      .L(aWidth / 2, capitalTop)
      .L(fontMetrics.aWidth, baseline)
      .M(fontMetrics.aWidth / 4, capitalMiddle)
      .L(fontMetrics.aWidth * 0.75, capitalMiddle).pathShape;
    add("A", shape, aWidth);
  }
  {
    // MARK: B
    const advance = digitWidth;
    const topRadius = capitalTopMiddle - capitalTop;
    if (topRadius <= 0) {
      throw new Error("wtf");
    }
    const topLineLength = (advance - topRadius) * (2 / 3);
    const bottomRadius = baseline - capitalBottomMiddle;
    if (bottomRadius <= 0) {
      throw new Error("wtf");
    }
    const bottomLineLength = advance - bottomRadius;
    const shape = PathBuilder.M(left, baseline)
      .L(left, capitalTop)
      .L(topLineLength, capitalTop)
      .Q_HV(topLineLength + topRadius, capitalTop + topRadius)
      .Q(topLineLength + topRadius, capitalMiddle, topLineLength, capitalMiddle)
      .L(left, capitalMiddle)
      .M(Math.max(bottomLineLength, topLineLength), capitalMiddle)
      .Q_HV(bottomLineLength + bottomRadius, baseline - bottomRadius)
      .Q_VH(bottomLineLength, baseline)
      .L(left, baseline).pathShape;
    add("B", shape, advance);
  }
  {
    // MARK: C
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const shape = PathBuilder.M(x2, capitalTopMiddle)
      .Q(x2, capitalTop, x1, capitalTop)
      .Q(left, capitalTop, left, capitalTopMiddle)
      .L(left, capitalBottomMiddle)
      .Q(left, baseline, x1, baseline)
      .Q(x2, baseline, x2, capitalBottomMiddle).pathShape;
    add("C", shape, advance);
  }
  {
    // MARK: D
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const shape = PathBuilder.M(left, capitalTop)
      .L(left, baseline)
      .L(x1, baseline)
      .Q(x2, baseline, x2, capitalBottomMiddle)
      .L(x2, capitalTopMiddle)
      .Q(x2, capitalTop, x1, capitalTop)
      .L(left, capitalTop).pathShape;
    add("D", shape, advance);
  }
  {
    // MARK: E
    const advance = digitWidth;
    const x1 = advance * (2 / 3);
    const x2 = advance;
    const shape = PathBuilder.M(x2, capitalTop)
      .L(left, capitalTop)
      .L(left, baseline)
      .L(x2, baseline)
      .M(x1, capitalMiddle)
      .L(left, capitalMiddle).pathShape;
    add("E", shape, advance);
  }
  {
    // MARK: F
    const advance = digitWidth;
    const x1 = advance * (2 / 3);
    const x2 = advance;
    const shape = PathBuilder.M(x2, capitalTop)
      .L(left, capitalTop)
      .L(left, baseline)
      .M(x1, capitalMiddle)
      .L(left, capitalMiddle).pathShape;
    add("F", shape, advance);
  }
  {
    // MARK: G
    const advance = digitWidth;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const shape = PathBuilder.M(x2, capitalTopMiddle)
      .Q(x2, capitalTop, x1, capitalTop)
      .Q(left, capitalTop, left, capitalTopMiddle)
      .L(left, capitalBottomMiddle)
      .Q(left, baseline, x1, baseline)
      .Q(x2, baseline, x2, capitalBottomMiddle)
      .L(x2, capitalMiddle)
      .L(x1, capitalMiddle).pathShape;
    add("G", shape, advance);
  }
  {
    // MARK: H
    const advance = digitWidth;
    const x1 = advance;
    const shape = PathBuilder.M(left, capitalTop)
      .L(left, baseline)
      .M(x1, capitalTop)
      .L(x1, baseline)
      .M(left, capitalMiddle)
      .L(x1, capitalMiddle).pathShape;
    add("H", shape, advance);
  }
  {
    // MARK: I
    const advance = fontMetrics.mHeight / 3;
    const x1 = advance / 2;
    const x2 = advance;
    const shape = PathBuilder.M(left, capitalTop)
      .L(x2, capitalTop)
      .M(left, baseline)
      .L(x2, baseline)
      .M(x1, capitalTop)
      .L(x1, baseline).pathShape;
    add("I", shape, advance);
  }
  {
    // MARK: J
    const advance = digitWidth * 0.85;
    const radius = advance / 2;
    const x1 = radius;
    const x2 = advance;
    const shape = PathBuilder.M(x2, capitalTop)
      .L(x2, capitalBottomMiddle)
      .Q(x2, baseline, x1, baseline)
      .Q(left, baseline, left, capitalBottomMiddle).pathShape;
    add("J", shape, advance);
  }
  {
    // MARK: K
    const advance = digitWidth + strokeWidth;
    const middle = (capitalTop + baseline) / 2;
    const shape = PathBuilder.M(left, capitalTop)
      .L(left, baseline)
      .M(advance, capitalTop)
      .L(left + 0.5, middle)
      .L(advance, baseline).pathShape;
    add("K", shape, advance);
  }
  {
    // MARK: L
    const advance = digitWidth;
    const shape = PathBuilder.M(left, capitalTop)
      .L(left, baseline)
      .L(advance, baseline).pathShape;
    add("L", shape, advance);
  }
  {
    // MARK: M
    const advance = digitWidth * 1.5;
    const center = advance / 2;
    const shape = PathBuilder.M(left, baseline)
      .L(left, capitalTop)
      .L(center, capitalMiddle)
      .L(advance, capitalTop)
      .L(advance, baseline).pathShape;
    add("M", shape, advance);
  }
  {
    // MARK: N
    const advance = digitWidth * 1.2;
    const shape = PathBuilder.M(left, baseline)
      .L(left, capitalTop)
      .L(advance, baseline)
      .L(advance, capitalTop).pathShape;
    add("N", shape, advance);
  }
  {
    // MARK: O
    const advance = digitWidth * 1.5;
    const center = advance / 2;
    const middle = (capitalTop + baseline) / 2;
    const shape = PathBuilder.M(center, capitalTop)
      .Q_HV(advance, middle)
      .Q_VH(center, baseline)
      .Q_HV(left, middle)
      .Q_VH(center, capitalTop).pathShape;
    add("O", shape, advance);
  }
  {
    // MARK: P
    const advance = digitWidth;
    const radius = capitalMiddle - capitalTopMiddle;
    if (radius <= 0) {
      throw new Error("wtf");
    }
    const x1 = advance - radius;
    const shape = PathBuilder.M(left, capitalTop)
      .L(left, baseline)
      .M(left, capitalTop)
      .L(x1, capitalTop)
      .Q_HV(advance, capitalTopMiddle)
      .Q_VH(x1, capitalMiddle)
      .L(left, capitalMiddle).pathShape;
    add("P", shape, advance);
  }
  {
    // MARK: Q
    const advance = digitWidth * 1.5;
    const center = advance / 2;
    const middle = (capitalTop + baseline) / 2;
    const shape = PathBuilder.M(center, capitalTop)
      .Q_HV(advance, middle)
      .Q_VH(center, baseline)
      .Q_HV(left, middle)
      .Q_VH(center, capitalTop)
      .M(advance - center * 0.75, baseline - center * 0.75)
      .L(advance + center / 6, baseline + center / 6).pathShape;
    add("Q", shape, advance);
  }
  {
    // MARK: R
    const advance = digitWidth;
    const radius = capitalMiddle - capitalTopMiddle;
    if (radius <= 0) {
      throw new Error("wtf");
    }
    const x1 = advance - radius;
    const shape = PathBuilder.M(left, capitalTop)
      .L(left, baseline)
      .M(left, capitalTop)
      .L(x1, capitalTop)
      .Q_HV(advance, capitalTopMiddle)
      .Q_VH(x1, capitalMiddle)
      .L(left, capitalMiddle)
      .M(x1, capitalMiddle)
      .L(advance, baseline).pathShape;
    add("R", shape, advance);
  }
  {
    // MARK: S
    // This is basically a subset of the 8 with he direction is reversed.
    const advance = digitWidth;
    const center = digitWidth / 2;
    const right = digitWidth;
    const shape = PathBuilder.M(right, capitalTopMiddle)
      .Q_VH(center, capitalTop)
      .Q_HV(left, capitalTopMiddle)
      .Q_VH(center, capitalMiddle)
      .Q_HV(right, capitalBottomMiddle)
      .Q_VH(center, baseline)
      .Q_HV(left, capitalBottomMiddle).pathShape;
    add("S", shape, advance);
  }
  {
    // MARK: $
    // This is basically an S with an extra vertical line.
    const extraWidth = strokeWidth;
    const advance = digitWidth + extraWidth;
    const center = advance / 2;
    const right = advance;
    const tipHeight = fontMetrics.mHeight / 8;
    const shape = PathBuilder.M(right, capitalTopMiddle)
      .Q_VH(center, capitalTop)
      .Q_HV(left, capitalTopMiddle)
      .Q_VH(center, capitalMiddle)
      .Q_HV(right, capitalBottomMiddle)
      .Q_VH(center, baseline)
      .Q_HV(left, capitalBottomMiddle)
      .M(center, capitalTop - tipHeight)
      .V(baseline + tipHeight).pathShape;
    add("$", shape, advance);
  }
  {
    // MARK: T
    const advance = digitWidth;
    const center = advance / 2;
    const shape = PathBuilder.M(center, capitalTop)
      .L(center, baseline)
      .M(advance, capitalTop)
      .L(left, capitalTop).pathShape;
    // Down then back.  That's how I do it every time.
    add("T", shape, advance);
  }
  // MARK: U
  {
    const topOfCurve = (capitalBottomMiddle + capitalMiddle) / 2;
    const center = Math.abs(topOfCurve - baseline) * 0.85;
    const advance = center * 2;
    const shape = PathBuilder.M(left, capitalTop)
      .V(topOfCurve)
      .Q_VH(center, baseline)
      .Q_HV(advance, topOfCurve)
      .V(capitalTop).pathShape;
    add("U", shape, advance);
  }
  // MARK: V
  {
    const advance = aWidth;
    const center = advance / 2;
    const shape = PathBuilder.M(left, capitalTop)
      .L(center, baseline)
      .L(advance, capitalTop).pathShape;
    add("V", shape, advance);
  }
  // MARK: W
  {
    const advance = aWidth * 1.5;
    const x1 = advance / 3;
    const x2 = advance / 2;
    const x3 = x1 * 2;
    const shape = PathBuilder.M(left, capitalTop)
      .L(x1, baseline)
      .L(x2, capitalMiddle)
      .L(x3, baseline)
      .L(advance, capitalTop).pathShape;
    add("W", shape, advance);
  }
  // MARK: X
  {
    const advance = digitWidth;
    const shape = PathBuilder.M(advance, capitalTop)
      .L(left, baseline)
      .M(left, capitalTop)
      .L(advance, baseline).pathShape;
    add("X", shape, advance);
  }
  // MARK: Y
  {
    const extra = strokeWidth;
    const advance = digitWidth + extra;
    const shape = PathBuilder.M(advance, capitalTop)
      .L(extra, baseline)
      .M(left, capitalTop)
      .L(advance / 2, capitalMiddle).pathShape;
    add("Y", shape, advance);
  }
  // MARK: Z
  {
    const advance = digitWidth;
    const shape = PathBuilder.M(left, capitalTop)
      .H(advance)
      .L(left, baseline)
      .H(advance).pathShape;
    add("Z", shape, advance);
  }
  // MARK: %
  {
    const radius = digitWidth / 4;
    const advance = digitWidth * 1.2;
    // First draw the top circle.
    const pathBuilder = PathBuilder.M(radius * 2, capitalTop + radius)
      .Q_VH(radius, capitalTop)
      .Q_HV(0, capitalTop + radius)
      .Q_VH(radius, capitalTop + radius * 2)
      .Q_HV(radius * 2, capitalTop + radius);
    // Next draw the bottom circle.
    const topCircle = pathBuilder.pathShape;
    const bottomCircle = topCircle.translate(
      advance - radius * 2,
      fontMetrics.mHeight - radius * 2
    );
    pathBuilder.addCommands(bottomCircle.commands);
    // Finally the slash.
    pathBuilder.M(advance, capitalTop).L(left, baseline);
    const shape = pathBuilder.pathShape;
    add("%", shape, advance);
  }
  // MARK: /
  {
    const advance = digitWidth;
    const shape = PathBuilder.M(advance, capitalTop).L(
      left,
      baseline
    ).pathShape;
    add("/", shape, advance);
  }
  // MARK: \
  {
    const advance = digitWidth;
    const shape = PathBuilder.M(left, capitalTop).L(
      advance,
      baseline
    ).pathShape;
    add("\\", shape, advance);
  }
  // MARK: a
  {
    const base = digitWidth;
    const extra = strokeWidth / 2;
    const advance = base + extra;
    const center = base / 2;
    const shape = PathBuilder.M(center, capitalMiddle)
      .Q_HV(left, capitalBottomMiddle)
      .Q_VH(center, baseline)
      .Q_HV(base, capitalBottomMiddle)
      .Q_VH(center, capitalMiddle)
      .M(advance, capitalMiddle)
      .L(advance, baseline).pathShape;
    add("a", shape, advance);
  }
  // MARK: b
  {
    const base = digitWidth;
    const extra = strokeWidth / 2;
    const advance = base + extra;
    const circleLeft = extra;
    const circleCenter = extra + base / 2;
    const circleRight = advance;
    const shape = PathBuilder.M(left, capitalTop)
      .V(baseline)
      .M(circleLeft, capitalBottomMiddle)
      .Q_VH(circleCenter, baseline)
      .Q_HV(circleRight, capitalBottomMiddle)
      .Q_VH(circleCenter, capitalMiddle)
      .Q_HV(circleLeft, capitalBottomMiddle).pathShape;
    add("b", shape, advance);
  }
  // MARK: c
  {
    const advance = digitWidth * 0.875;
    const circleLeft = 0;
    const circleCenter = digitWidth / 2;
    const circleRight = advance;
    const yStart = (capitalMiddle + capitalBottomMiddle) / 2;
    const yEnd = (capitalBottomMiddle + baseline) / 2;
    const shape = PathBuilder.M(circleRight, yStart)
      .Q_VH(circleCenter, capitalMiddle)
      .Q_HV(circleLeft, capitalBottomMiddle)
      .Q_VH(circleCenter, baseline)
      .Q_HV(circleRight, yEnd).pathShape;
    add("c", shape, advance);
  }
  // MARK: d
  {
    const base = digitWidth;
    const extra = strokeWidth / 2;
    const advance = base + extra;
    const center = base / 2;
    const shape = PathBuilder.M(center, capitalMiddle)
      .Q_HV(left, capitalBottomMiddle)
      .Q_VH(center, baseline)
      .Q_HV(base, capitalBottomMiddle)
      .Q_VH(center, capitalMiddle)
      .M(advance, capitalTop)
      .L(advance, baseline).pathShape;
    add("d", shape, advance);
  }
  // MARK: e
  const offsetForSmallCurves = digitWidth / 8;
  {
    const advance = digitWidth;
    const center = digitWidth / 2;
    const right = advance;
    const xEnd = right - offsetForSmallCurves;
    const shape = PathBuilder.M(left, capitalBottomMiddle)
      .H(right)
      .Q_VH(center, capitalMiddle)
      .Q_HV(left, capitalBottomMiddle)
      .Q_VH(center, baseline)
      .H(xEnd).pathShape;
    add("e", shape, advance);
  }
  // MARK: f
  {
    const advance = digitWidth * 0.75;
    const center = advance / 2;
    const right = advance;
    const shape = PathBuilder.M(right, capitalTop)
      .Q_HV(center, capitalTopMiddle)
      .V(baseline)
      .M(right, capitalMiddle)
      .H(left).pathShape;
    add("f", shape, advance);
  }
  // MARK: g
  {
    const base = digitWidth;
    const extra = strokeWidth / 2;
    const advance = base + extra;
    const center = base / 2;
    const shape = PathBuilder.M(center, capitalMiddle)
      .Q_HV(left, capitalBottomMiddle)
      .Q_VH(center, baseline)
      .Q_HV(base, capitalBottomMiddle)
      .Q_VH(center, capitalMiddle)
      .M(advance, capitalMiddle)
      .V(baseline)
      .Q_VH(center, descender)
      .H(left + offsetForSmallCurves).pathShape;
    add("g", shape, advance);
  }
  // MARK: h
  {
    const advance = digitWidth * 0.85;
    const center = advance / 2;
    const shape = PathBuilder.M(left, capitalTop)
      .V(baseline)
      .Q_VH(center, capitalMiddle)
      .Q_HV(advance, capitalBottomMiddle)
      .V(baseline).pathShape;
    add("h", shape, advance);
  }
  // MARK: i
  {
    const advance = 0;
    const shape = PathBuilder.M(left, capitalMiddle)
      .V(baseline)
      .M(left, capitalTopMiddle)
      .V(capitalTopMiddle - dotHeight).pathShape;
    add("i", shape, advance);
  }
  // MARK: j
  {
    const advance = Math.abs(baseline - descender);
    const center = advance / 2;
    const shape = PathBuilder.M(advance, capitalMiddle)
      .V(baseline)
      .Q_VH(center, descender)
      .Q_HV(left, baseline)
      .M(advance, capitalTopMiddle)
      .V(capitalTopMiddle - dotHeight).pathShape;
    add("j", shape, advance);
  }
  // MARK: .
  {
    const advance = 0;
    const shape = PathBuilder.M(left, baseline).V(
      baseline - dotHeight
    ).pathShape;
    add(".", shape, advance);
  }
  // MARK: !
  {
    const advance = 0;
    const shape = PathBuilder.M(left, capitalTop)
      .V(capitalBottomMiddle)
      .M(left, baseline)
      .V(baseline - dotHeight).pathShape;
    add("!", shape, advance);
  }
  // MARK: ,
  {
    const advance = 0;
    const drop = (descender - baseline) / 2;
    const back = drop / 2;
    const shape = PathBuilder.M(left, baseline - dotHeight)
      .V(baseline)
      .Q_VH(-back, baseline + drop).pathShape;
    add(",", shape, advance);
  }
  // MARK: '
  {
    const advance = 0;
    const drop = (descender - baseline) / 2;
    const total = drop + dotHeight;
    const shape = new PathShape([
      new LCommand(left, capitalTop, left, capitalTop + total),
    ]);
    add("'", shape, advance);
  }
  // MARK: `
  {
    const drop = (descender - baseline) / 2;
    const total = drop + dotHeight;
    const advance = total;
    const right = total;
    const shape = new PathShape([
      new LCommand(left, capitalTop, right, capitalTop + total),
    ]);
    add("`", shape, advance);
  }
  // MARK: ^
  {
    const drop = (descender - baseline) / 2;
    const total = drop + dotHeight;
    const center = total;
    const advance = total * 2;
    const right = advance;
    const top = capitalTop;
    const bottom = capitalTop + total;
    const shape = PathBuilder.M(left, bottom)
      .L(center, top)
      .L(right, bottom).pathShape;
    add("^", shape, advance);
  }
  // MARK: "
  {
    const advance = strokeWidth * 2;
    const drop = (descender - baseline) / 2;
    const total = drop + dotHeight;
    const shape = new PathShape([
      new LCommand(left, capitalTop, left, capitalTop + total),
      new LCommand(advance, capitalTop, advance, capitalTop + total),
    ]);
    add('"', shape, advance);
  }
  // MARK: :
  {
    const advance = 0;
    const topDotTop = capitalMiddle;
    const shape = PathBuilder.M(left, baseline)
      .V(baseline - dotHeight)
      .M(left, topDotTop - dotHeight)
      .V(topDotTop).pathShape;
    add(":", shape, advance);
  }
  // MARK: |
  {
    const advance = 0;
    const shape = new PathShape([
      new LCommand(left, capitalTop, left, baseline),
    ]);
    add("|", shape, advance);
  }
  // MARK: ;
  {
    const advance = 0;
    const topDotTop = capitalMiddle;
    const drop = (descender - baseline) / 2;
    const back = drop / 2;
    const shape = PathBuilder.M(left, baseline - dotHeight)
      .V(baseline)
      .Q_VH(-back, baseline + drop)
      .M(left, topDotTop - dotHeight)
      .V(topDotTop).pathShape;
    add(";", shape, advance);
  }
  // MARK: k
  {
    const slashHeight = (fontMetrics.xHeight * 2) / 3;
    const bottomSticksOutBy = digitWidth / 10;
    const advance = slashHeight + bottomSticksOutBy;
    const shape = PathBuilder.M(left, capitalTop)
      .V(baseline)
      .M(slashHeight, capitalMiddle)
      .L(left, capitalMiddle + slashHeight)
      .M(slashHeight / 2, baseline - slashHeight)
      .L(advance, baseline).pathShape;
    add("k", shape, advance);
  }
  // MARK: l
  {
    const advance = 0;
    const shape = PathBuilder.M(left, capitalTop).V(baseline).pathShape;
    add("l", shape, advance);
  }
  // MARK: m
  {
    const advance = digitWidth * 1.5;
    const leftCenter = advance / 4;
    const center = advance / 2;
    const rightCenter = (advance * 3) / 4;
    const right = advance;
    const shape = PathBuilder.M(left, capitalMiddle)
      .V(baseline)
      .Q_VH(leftCenter, capitalMiddle)
      .Q_HV(center, capitalBottomMiddle)
      .V(baseline)
      .M(center, capitalBottomMiddle)
      .Q_VH(rightCenter, capitalMiddle)
      .Q_HV(right, capitalBottomMiddle)
      .V(baseline).pathShape;
    add("m", shape, advance);
  }
  // MARK: n
  {
    const advance = digitWidth * 0.85;
    const center = advance / 2;
    const shape = PathBuilder.M(left, capitalMiddle)
      .V(baseline)
      .Q_VH(center, capitalMiddle)
      .Q_HV(advance, capitalBottomMiddle)
      .V(baseline).pathShape;
    add("n", shape, advance);
  }
  // MARK: o
  {
    const advance = digitWidth;
    const circleLeft = 0;
    const circleCenter = advance / 2;
    const circleRight = advance;
    const shape = PathBuilder.M(circleCenter, capitalMiddle)
      .Q_HV(circleRight, capitalBottomMiddle)
      .Q_VH(circleCenter, baseline)
      .Q_HV(circleLeft, capitalBottomMiddle)
      .Q_VH(circleCenter, capitalMiddle).pathShape;
    add("o", shape, advance);
  }
  // MARK: p
  {
    const base = digitWidth;
    const extra = strokeWidth / 2;
    const advance = base + extra;
    const circleLeft = extra;
    const circleCenter = extra + base / 2;
    const circleRight = advance;
    const shape = PathBuilder.M(left, capitalMiddle)
      .V(descender)
      .M(circleLeft, capitalBottomMiddle)
      .Q_VH(circleCenter, capitalMiddle)
      .Q_HV(circleRight, capitalBottomMiddle)
      .Q_VH(circleCenter, baseline)
      .Q_HV(circleLeft, capitalBottomMiddle).pathShape;
    add("p", shape, advance);
  }
  // MARK: q
  {
    const circleRight = digitWidth;
    const circleCenter = circleRight / 2;
    const lineX = circleRight + strokeWidth / 2;
    const curlyWidth = Math.abs(baseline - descender);
    const curlyCenter = lineX + curlyWidth / 2;
    const advance = lineX + curlyWidth;
    const shape = PathBuilder.M(circleCenter, capitalMiddle)
      .Q_HV(left, capitalBottomMiddle)
      .Q_VH(circleCenter, baseline)
      .Q_HV(circleRight, capitalBottomMiddle)
      .Q_VH(circleCenter, capitalMiddle)
      .M(lineX, capitalMiddle)
      .V(baseline)
      .Q_VH(curlyCenter, descender)
      .Q_HV(advance, baseline).pathShape;
    add("q", shape, advance);
  }
  // MARK: r
  {
    const advance = digitWidth;
    const center = advance / 2;
    const shape = PathBuilder.M(left, capitalMiddle)
      .V(baseline)
      .Q_VH(center, capitalMiddle)
      .Q_HV(advance, capitalBottomMiddle).pathShape;
    // .V(baseline);
    add("r", shape, advance);
  }
  // MARK: s
  {
    const advance = (fontMetrics.xHeight * 2) / 3;
    const center = advance / 2;
    const y0 = baseline;
    const y2 = capitalBottomMiddle;
    const y4 = capitalMiddle;
    const y1 = (y0 + y2) / 2;
    const y3 = (y2 + y4) / 2;
    const yStart = (y3 + y4) / 2;
    const yEnd = (y0 + y1) / 2;
    const shape = PathBuilder.M(advance, yStart)
      .Q_VH(center, y4)
      .Q_HV(left, y3)
      .Q_VH(center, y2)
      .Q_HV(advance, y1)
      .Q_VH(center, y0)
      .Q_HV(left, yEnd).pathShape;
    add("s", shape, advance);
  }
  // MARK: t
  {
    const advance = digitWidth * 0.75;
    const center = advance / 2;
    const right = advance;
    const shape = PathBuilder.M(center, capitalTopMiddle)
      .V(capitalBottomMiddle)
      .Q_VH(right, baseline)
      .M(right, capitalMiddle)
      .H(left).pathShape;
    add("t", shape, advance);
  }
  // MARK: u
  {
    const advance = digitWidth * 0.85;
    const center = advance / 2;
    const shape = PathBuilder.M(left, capitalMiddle)
      .V(capitalBottomMiddle)
      .Q_VH(center, baseline)
      .Q_HV(advance, capitalMiddle)
      .L(advance, baseline).pathShape;
    add("u", shape, advance);
  }
  // MARK: v
  {
    const advance = digitWidth;
    const center = advance / 2;
    const shape = PathBuilder.M(left, capitalMiddle)
      .L(center, baseline)
      .L(advance, capitalMiddle).pathShape;
    add("v", shape, advance);
  }
  // MARK: w
  {
    const advance = fontMetrics.xHeight * 1.5;
    const x1 = advance / 3;
    const x2 = advance / 2;
    const x3 = x1 * 2;
    const shape = PathBuilder.M(left, capitalMiddle)
      .L(x1, baseline)
      .L(x2, capitalBottomMiddle)
      .L(x3, baseline)
      .L(advance, capitalMiddle).pathShape;
    add("w", shape, advance);
  }
  // MARK: x
  {
    const advance = digitWidth;
    const shape = PathBuilder.M(advance, capitalMiddle)
      .L(left, baseline)
      .M(left, capitalMiddle)
      .L(advance, baseline).pathShape;
    add("x", shape, advance);
  }
  // MARK: y
  {
    const advance = digitWidth;
    const meetingX = advance / 2;
    const meetingY = (capitalMiddle + descender) / 2;
    const shape = PathBuilder.M(advance, capitalMiddle)
      .L(left, descender)
      .M(left, capitalMiddle)
      .L(meetingX, meetingY).pathShape;
    add("y", shape, advance);
  }
  // MARK: z
  {
    const advance = digitWidth;
    const shape = PathBuilder.M(left, capitalMiddle)
      .H(advance)
      .L(left, baseline)
      .H(advance).pathShape;
    add("z", shape, advance);
  }
  // MARK: ° (degrees)
  {
    const advance = digitWidth / 2;
    const radius = advance / 2;
    const shape = PathBuilder.M(radius, capitalTop).circle(
      radius,
      capitalTop + radius,
      "cw"
    ).pathShape;
    add("°", shape, advance);
  }
  // MARK: ◯ (large circle)
  {
    const advance = -capitalTop;
    const radius = advance / 2;
    const shape = PathBuilder.M(radius, capitalTop).circle(
      radius,
      capitalTop + radius,
      "cw"
    ).pathShape;
    add("◯", shape, advance);
  }
  // MARK: ◠ (upper half circle)
  {
    const advance = -capitalTop;
    const radius = advance / 2;
    const middle = capitalTop / 2;
    const shape = PathBuilder.M(0, middle).arc(
      radius,
      middle,
      advance,
      middle,
      "cw"
    ).pathShape;
    add("◠", shape, advance);
  }
  // MARK: ◡ (lower half circle)
  {
    const advance = -capitalTop;
    const radius = advance / 2;
    const middle = capitalTop / 2;
    const shape = PathBuilder.M(0, middle).arc(
      radius,
      middle,
      advance,
      middle,
      "ccw"
    ).pathShape;
    add("◡", shape, advance);
  }
  // MARK: ♡ (white heart suit)
  {
    // This is a scaled down version of https://developer.mozilla.org/en-US/docs/Web/SVG/Element/path#example
    const advance = -capitalTop;
    const radius = advance / 4;
    const middle = capitalTop + radius;
    const shape = PathBuilder.M(radius * 2, middle)
      .arc(radius * 3, middle, advance, middle, "cw")
      .Q_angles(radius * 2, baseline, dSouthWest, dSouth)
      .Q_angles(0, middle, dNorth, dNorthWest)
      .arc(radius, middle, radius * 2, middle, "cw").pathShape;
    add("♡", shape, advance);
  }

  //MARK: ↔ ← → ↕ ↑ ↓
  {
    const shaftLength = fontMetrics.mHeight;
    // const headSideLength = shaftLength/3;
    // const headHalfBase = headSideLength / 2;
    // const headHeight = Math.sqrt(3)/2*headSideLength;
    const headHalfBase = shaftLength / 4;
    const headHeight = headHalfBase;
    {
      const advance = shaftLength;
      const middle = (capitalTop + baseline) / 2;
      const double = PathBuilder.M(headHeight, middle - headHalfBase)
        .L(0, middle)
        .L(headHeight, middle + headHalfBase)
        .M(0, middle)
        .L(advance, middle)
        .M(advance - headHeight, middle - headHalfBase)
        .L(advance, middle)
        .L(advance - headHeight, middle + headHalfBase);
      add("↔", double.pathShape, advance); // LEFT RIGHT ARROW
      const left = new PathShape(double.commands.slice(0, 3));
      add("←", left, advance); // LEFTWARDS ARROW
      const right = new PathShape(double.commands.slice(2, 5));
      add("→", right, advance); // RIGHTWARDS ARROW
    }
    {
      const left = 0;
      const center = headHalfBase;
      const advance = headHalfBase * 2;
      const right = advance;
      const double = PathBuilder.M(left, capitalTop + headHeight)
        .L(center, capitalTop)
        .L(right, capitalTop + headHeight)
        .M(center, capitalTop)
        .L(center, baseline)
        .M(left, baseline - headHeight)
        .L(center, baseline)
        .L(right, baseline - headHeight);
      add("↕", double.pathShape, advance); // UP DOWN ARROW
      const up = new PathShape(double.commands.slice(0, 3));
      add("↑", up, advance); // UPWARDS ARROW
      const down = new PathShape(double.commands.slice(2, 5));
      add("↓", down, advance); // DOWNWARDS ARROW
    }
  }
  // MARK: ✧ (white 4 pointed star)
  {
    const advance = fontMetrics.mHeight;
    const left = 0;
    const center = advance / 2;
    const right = advance;
    const top = capitalTop;
    const bottom = baseline;
    const middle = (top + bottom) / 2;
    const angle = Math.PI / 16;
    const shape = PathBuilder.M(center, top)
      .Q_angles(right, middle, dEast + angle, dSouth - angle)
      .Q_angles(center, bottom, dSouth + angle, dWest - angle)
      .Q_angles(left, middle, dWest + angle, dNorth - angle)
      .Q_angles(center, top, dNorth + angle, dEast - angle).pathShape;
    add("✧", shape, advance); //WHITE FOUR POINTED STAR
  }
  // MARK: ☆ (white star)
  {
    const numberOfVertices = 5;
    /**
     * * 1 would be a simple polygon.
     * * -1 would be a polygon drawn backwards.
     * * 2 for a simple star.
     * * If you had 7 vertices, 2 and 3 would give you different stars.
     */
    const overlap = 2;
    const initialAngle = dNorth;
    const vertices = initializedArray(numberOfVertices, (n) => {
      const angle =
        initialAngle + (n * (2 * Math.PI) * overlap) / numberOfVertices;
      return polarToRectangular(1, angle);
    });
    /**
     * Translate and resize an image to fit into a space.
     *
     * This starts with a summary of the image (the bounds of the image)
     * and returns functions used to convert the individual vertices of the image.
     * @param initial The bounds of the shape before we start.
     * We will preserve this aspect ratio.
     * @param final Something like `{top: capitalTop, bottom:baseline}`.
     * Left is always 0 and the width is computed to preserve the aspect ratio.
     * @returns `result.x()` and `result.y()` will convert x and y coordinates from the initial shape to the final shape.
     * `result.advance` contains the width of the final shape.
     */
    function forceFit(
      initial: { minX: number; maxX: number; minY: number; maxY: number },
      final: { top: number; bottom: number }
    ) {
      const initialHeight = initial.maxY - initial.minY;
      const finalHeight = final.bottom - final.top;
      const scaleBy = finalHeight / initialHeight;
      const initialWidth = initial.maxX - initial.minX;
      const finalWidth = initialWidth * scaleBy;
      const finalLeft = 0;
      const finalRight = finalWidth;
      const x = makeBoundedLinear(
        initial.minX,
        finalLeft,
        initial.maxX,
        finalRight
      );
      const y = makeBoundedLinear(
        initial.minY,
        final.top,
        initial.maxY,
        final.bottom
      );
      return { x, y, advance: finalRight };
    }
    /**
     * Examines and modifies vertices in place.
     * @returns The information required to translate additional points.
     */
    function normalize() {
      // It seems like I've done this before.
      // Consider making this a library routine.
      // TODO check out *.  That appears to have a lot of code that I should have reused.
      const min = { x: Infinity, y: Infinity };
      const max = { x: -Infinity, y: -Infinity };
      vertices.forEach((vertex) => {
        (["x", "y"] as const).forEach((index) => {
          min[index] = Math.min(min[index], vertex[index]);
          max[index] = Math.max(max[index], vertex[index]);
        });
      });
      const initial = { minX: min.x, maxX: max.x, minY: min.y, maxY: max.y };
      const final = { top: capitalTop, bottom: baseline };
      const translation = forceFit(initial, final);
      vertices.forEach((vertex) => {
        vertex.x = translation.x(vertex.x);
        vertex.y = translation.y(vertex.y);
      });
      return translation;
    }
    const translation = normalize();
    const lines = vertices.map((vertex, index, array) => {
      const next = array.at(index + 1 - array.length)!;
      return new LCommand(vertex.x, vertex.y, next.x, next.y);
    });
    add("☆", new PathShape(lines), translation.advance); // WHITE STAR
    const curves = vertices.map((vertex, index, array) => {
      const next = array.at(index + 1 - array.length)!;
      const baseAngle = Math.atan2(next.y - vertex.y, next.x - vertex.x);
      const tweakAngle = 0.175;
      return QCommand.angles(
        vertex.x,
        vertex.y,
        baseAngle + tweakAngle,
        next.x,
        next.y,
        baseAngle - tweakAngle
      );
    });
    add("⭒", new PathShape(curves), translation.advance); // WHITE SMALL STAR
  }
  // Sort the map by key.
  return new Map(
    [...result.entries()].sort(([a], [b]) => {
      if (a < b) {
        return -1;
      } else if (a == b) {
        return 1;
      } else {
        return 0;
      }
    })
  );
}
