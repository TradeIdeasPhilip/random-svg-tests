import { DescriptionOfLetter, Font, FontMetrics } from "./letters-base";
import { PathShape, PathBuilder } from "./path-shape";

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
    const shape = PathBuilder.M(left, capitalTop)
      .L(left, baseline)
      .L(bottomLineLength, baseline)
      .M(Math.max(bottomLineLength, topLineLength), capitalMiddle)
      .L(left, capitalMiddle)
      .M(left, capitalTop)
      .L(topLineLength, capitalTop)
      .Q(
        topLineLength + topRadius,
        capitalTop,
        topLineLength + topRadius,
        capitalTop + topRadius
      )
      .Q(topLineLength + topRadius, capitalMiddle, topLineLength, capitalMiddle)
      .M(bottomLineLength, capitalMiddle)
      .Q(
        bottomLineLength + bottomRadius,
        capitalMiddle,
        bottomLineLength + bottomRadius,
        baseline - bottomRadius
      )
      .Q(
        bottomLineLength + bottomRadius,
        baseline,
        bottomLineLength,
        baseline
      ).pathShape;
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
  const dotHeight = strokeWidth / 4;
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
