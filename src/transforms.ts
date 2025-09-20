import { Random, ReadOnlyRect } from "phil-lib/misc";

export function unmatrix(matrix: DOMMatrix): string {
  // The following test caused problems with an SVG matrix, and I just don't want to deal with it.
  //if (matrix.is2D) {
  //  throw new Error("not supported");
  //}
  const translateX = matrix.e;
  const translateY = matrix.f;
  const scaleX = matrix.a;
  const scaleY = matrix.d;
  const skewX = Math.atan(matrix.b / scaleX);
  const skewY = Math.atan(matrix.c / scaleY);
  const result: string[] = [];
  if (translateX != 0 || translateY != 0) {
    result.push(`translate(${translateX}px, ${translateY}px)`);
  }
  if (skewX != 0 || skewY != 0) {
    result.push(`skew(${skewX}rad, ${skewY}rad)`);
  }
  if (scaleX != 1 || scaleY != 1) {
    if (scaleX == scaleY) {
      result.push(`scale(${scaleX})`);
    } else {
      result.push(`scale(${scaleX}, ${scaleY})`);
    }
  }
  return result.join(" ");
}
(window as any).unmatrix = unmatrix;

/**
 * Apply a transformation matrix to a point.
 * @param x The point to transform.
 * @param y The point to transform.
 * @param matrix The transform to apply.
 * @returns The point in the transformed coordinate system.
 */
export function transform(x: number, y: number, matrix: DOMMatrix): DOMPoint {
  return new DOMPoint(x, y).matrixTransform(matrix);
}

/**
 * Apply a transformation matrix to a `Rect`.
 * @param rect The input to transform.
 * @param matrix The transformation to make.
 * @returns A new `Rect`.
 */
export function transformRect(rect: ReadOnlyRect, matrix: DOMMatrix): Rect {
  const x1 = rect.x + rect.width;
  const y1 = rect.y + rect.height;
  const transformedTopLeft = transform(rect.x, rect.y, matrix);
  const transformedBottomRight = transform(x1, y1, matrix);
  return {
    x: transformedTopLeft.x,
    y: transformedTopLeft.y,
    height: transformedBottomRight.y - transformedTopLeft.y,
    width: transformedBottomRight.x - transformedTopLeft.x,
  };
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The result of a call to `rectToRect()`.
 */
type RectToRectResult = {
  /**
   * A string in the right format for the css `transform` property or the `DOMMatrix` constructor.
   * This string will turn the `srcRect` into the `destRect`.
   *
   * The format of this string will be consistent.
   * If you call rectToRect() multiple times, you can smoothly animate between the resulting transform strings.
   */
  transformString: string;
  /**
   * `srcRect.width * xScale = destRect.width`
   */
  xScale: number;
  /**
   * `srcRect.height * yScale = destRect.height`
   */
  yScale: number;
};

/**
 * Given two rectangles, create a css transform to convert from the first to the second.
 *
 * This will scale and translate as required.
 * This will never rotate or skew.
 *
 * If you need a transform that preserves aspect ratios, consider `panAndZoom()` instead of this function.
 * @param srcRect
 * @param destRect
 * @returns Instructions for converting `srcRect` to `destRect`.
 */
export function rectToRect(
  srcRect: ReadOnlyRect,
  destRect: ReadOnlyRect
): RectToRectResult {
  const xScale = destRect.width / srcRect.width;
  const yScale = destRect.height / srcRect.height;
  const scaledSrcX = srcRect.x * xScale;
  const scaledSrcY = srcRect.y * yScale;
  const translateX = destRect.x - scaledSrcX;
  const translateY = destRect.y - scaledSrcY;
  const transformString = `translate(${translateX}px, ${translateY}px) scale(${xScale}, ${yScale})`;
  return { xScale, yScale, transformString };
}

function testRectToRect(testCount = 10, seed = "𝔗𝔯𝔞𝔫𝔰𝔣𝔬𝔯𝔪") {
  const random = Random.fromString(seed);
  function makeRect(): ReadOnlyRect {
    const x = random() * 300 - 100;
    const y = random() * 300 - 100;
    const width = random() * 50 + 10;
    const height = random() * 60 + 10;
    return { x, y, width, height };
  }
  /**
   * Compares two rectangles to see how close they are.
   * @returns 0 Is ideal.  Close to 0 is small.  Result is never negative.
   */
  function compare(a: ReadOnlyRect, b: ReadOnlyRect) {
    // Root-mean-square of the individual errors.
    return Math.hypot(
      a.x - b.x,
      a.y - b.y,
      a.height - b.height,
      a.width - b.width
    );
  }
  /**
   * Compare two rectangles and report the results to the console.
   * @param a A rectangle that should be the same as `b` ± any round off error.
   * @param b A rectangle that should be the same as `a` ± any round off error.
   */
  function test1(a: ReadOnlyRect, b: ReadOnlyRect) {
    const result = rectToRect(a, b);
    const matrix = new DOMMatrix(result.transformString);
    const aTransformed = transformRect(a, matrix);
    const error = compare(aTransformed, b);
    if (error == 0) {
      // Ideal
      console.info(error, b);
    } else if (error < 0.0001) {
      // Small error, maybe round off.
      console.log(error, aTransformed, b);
    } else {
      // Big error.
      console.error({ error, aTransformed, b, result, a });
    }
  }
  test1(
    { x: 0, y: 0, height: 10, width: 20 },
    { x: 0, y: 0, height: 20, width: 10 }
  );
  test1(
    { x: 0, y: 0, height: 10, width: 20 },
    { x: 70, y: 80, height: 10, width: 20 }
  );
  test1(
    { x: 1, y: 1, height: 1, width: 1 },
    { x: 2, y: 2, height: 2, width: 2 }
  );
  test1(
    { x: 1, y: 2, height: 1, width: 2 },
    { x: 2, y: 4, height: 2, width: 4 }
  );
  test1(
    { x: 1, y: 2, height: 3, width: 4 },
    { x: 5, y: 6, height: 7, width: 8 }
  );
  for (let i = 0; i < testCount; i++) {
    const a = makeRect();
    const b = makeRect();
    test1(a, b);
  }
}
if (false) {
  testRectToRect();
}

/**
 * This function creates a transform matrix mapping one rectangle to another.
 * The matrix can only pan and zoom.  I.e. it can scale, but always the same amount in both dimensions.
 * And it can translate.  If the two rectangles have different aspect ratios, the `aspect` parameter will provide further guidance.
 * @param srcRect Often the result of `getBBox()` on an `SVGElement`.  This describes the input coordinate system.
 * @param destRect Often the the size and shape of an `HTMLElement`, with the top left corner at (0,0).  This describes the output coordinate system.
 * @param aspect What to do if the `destRect` has a different aspect ratio than `srcRect`.
 * The terms `meet` and `slice` come from https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/preserveAspectRatio
 * * `meet` — Everything in the `srcRect` will fit into the `destRect`.  There maybe be unused space in the `destRect`.
 * * `slice` — Every part of the `destRect` will be filled with something from the `srcRect`.  Some parts of the `srcRect` might not be contained in the `destRect`.
 * * `srcRect fits completely into destRect` — an alias for `meet`.
 * * `srcRect completely covers destRect` — an alias for `slice`.
 *
 * If you do not want to preserve the aspect ratio, then consider `rectToRect()` instead.
 * @param howFarRight If there is extra space in the horizontal direction, how should it
 * be distributed?
 * * 0 means the content is all the way to the left.
 * * 0.5, the default, means the content is centered.
 * * 1 means that the content is all the way to the right.
 * * etc.
 * @param howFarDown If there is extra space in the vertical direction, how should it
 * be distributed?
 * * 0 means the content is at the very top.
 * * 0.5, the default, means the content is centered.
 * * 1 means that the content is all the way to the bottom.
 * * etc.
 * @returns A new matrix mapping srcRect to destRect.
 */
export function panAndZoom(
  srcRect: ReadOnlyRect,
  destRect: ReadOnlyRect,
  aspect:
    | "meet"
    | "slice"
    | "srcRect fits completely into destRect"
    | "srcRect completely covers destRect",
  howFarRight = 0.5,
  howFarDown = 0.5
): DOMMatrix {
  return new DOMMatrix(
    panAndZoomString(srcRect, destRect, aspect, howFarRight, howFarDown)
  );
}

/**
 * This function creates a transform string mapping one rectangle to another.
 * The matrix can only pan and zoom.  I.e. it can scale, but always the same amount in both dimensions.
 * And it can translate.  If the two rectangles have different aspect ratios, the `aspect` parameter will provide further guidance.
 * @param srcRect Often the result of `getBBox()` on an `SVGElement`.  This describes the input coordinate system.
 * @param destRect Often the the size and shape of an `HTMLElement`, with the top left corner at (0,0).  This describes the output coordinate system.
 * @param aspect What to do if the `destRect` has a different aspect ratio than `srcRect`.
 * The terms `meet` and `slice` come from https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/preserveAspectRatio
 * * `meet` — Everything in the `srcRect` will fit into the `destRect`.  There maybe be unused space in the `destRect`.
 * * `slice` — Every part of the `destRect` will be filled with something from the `srcRect`.  Some parts of the `srcRect` might not be contained in the `destRect`.
 * * `srcRect fits completely into destRect` — an alias for `meet`.
 * * `srcRect completely covers destRect` — an alias for `slice`.
 * @param howFarRight If there is extra space in the horizontal direction, how should it
 * be distributed?
 * * 0 means the content is all the way to the left.
 * * 0.5, the default, means the content is centered.
 * * 1 means that the content is all the way to the right.
 * * etc.
 * @param howFarDown If there is extra space in the vertical direction, how should it
 * be distributed?
 * * 0 means the content is at the very top.
 * * 0.5, the default, means the content is centered.
 * * 1 means that the content is all the way to the bottom.
 * * etc.
 * @returns A string, appropriate for the css `transform` property, mapping srcRect to destRect.
 */
export function panAndZoomString(
  srcRect: ReadOnlyRect,
  destRect: ReadOnlyRect,
  aspect:
    | "meet"
    | "slice"
    | "srcRect fits completely into destRect"
    | "srcRect completely covers destRect",
  howFarRight = 0.5,
  howFarDown = 0.5
): string {
  // Step 1: Compute the scaling factors to fit or fill the destination
  const srcAspect = srcRect.width / srcRect.height;
  const destAspect = destRect.width / destRect.height;

  let scale: number;
  switch (aspect) {
    case "meet":
    case "srcRect fits completely into destRect": {
      // meet: Scale to fit entirely within destRect, preserving aspect ratio
      if (srcAspect > destAspect) {
        // Source is wider than destination: scale by width, letterbox height
        scale = destRect.width / srcRect.width;
      } else {
        // Source is taller than destination: scale by height, letterbox width
        scale = destRect.height / srcRect.height;
      }
      break;
    }
    case "slice":
    case "srcRect completely covers destRect": {
      // slice: Scale to fill destRect, preserving aspect ratio, may crop
      if (srcAspect > destAspect) {
        // Source is wider than destination: scale by height, crop width
        scale = destRect.height / srcRect.height;
      } else {
        // Source is taller than destination: scale by width, crop height
        scale = destRect.width / srcRect.width;
      }
      break;
    }
    default: {
      throw new Error("wtf");
    }
  }

  // Step 2: Compute the translation to center the path (xMidYMid)
  // Translate the source rectangle's origin (srcRect.x, srcRect.y) to (0,0),
  // scale it, then translate to the center of the destination rectangle
  const translateX =
    -srcRect.x * scale +
    howFarRight * (destRect.width - srcRect.width * scale) +
    destRect.x;
  const translateY =
    -srcRect.y * scale +
    howFarDown * (destRect.height - srcRect.height * scale) +
    destRect.y;

  // Step 3: Create the DOMMatrix
  return `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

/**
 * Test cases for panAndZoom
 */
function runTests() {
  // Test 1: Your original test case (meet, source square, destination wider)
  {
    const testFrom: Rect = { x: -1, y: -1, width: 2, height: 2 };
    const testTo: Rect = { x: 0, y: 0, height: 244, width: 325 };
    const testMatrix = panAndZoom(testFrom, testTo, "meet");
    // console.log("Test 1 (meet, square to wider):", {
    //   testFrom,
    //   testTo,
    //   testMatrix: testMatrix.toJSON(),
    // });

    const corners = [
      { x: testFrom.x, y: testFrom.y }, // (-1, -1)
      { x: testFrom.x + testFrom.width, y: testFrom.y }, // (1, -1)
      { x: testFrom.x + testFrom.width, y: testFrom.y + testFrom.height }, // (1, 1)
      { x: testFrom.x, y: testFrom.y + testFrom.height }, // (-1, 1)
    ];

    corners.forEach(({ x: xFrom, y: yFrom }) => {
      const toPoint = transform(xFrom, yFrom, testMatrix);
      //console.log({ xFrom, yFrom, toPoint: { x: toPoint.x, y: toPoint.y } });
      // Expectation: All points should be within testTo (x: [0, 325], y: [0, 244])
      if (
        toPoint.x < testTo.x ||
        toPoint.x > testTo.x + testTo.width ||
        toPoint.y < testTo.y ||
        toPoint.y > testTo.y + testTo.height
      ) {
        throw new Error(
          `Test 1 failed: Point (${toPoint.x}, ${toPoint.y}) is outside destination (${testTo.x}, ${testTo.y}, ${testTo.width}, ${testTo.height})`
        );
      }
    });
  }

  // Test 2: meet, source square, destination taller
  {
    const testFrom: Rect = { x: -1, y: -1, width: 2, height: 2 };
    const testTo: Rect = { x: 0, y: 0, height: 325, width: 244 };
    const testMatrix = panAndZoom(testFrom, testTo, "meet");
    // console.log("Test 2 (meet, square to taller):", {
    //   testFrom,
    //   testTo,
    //   testMatrix: testMatrix.toJSON(),
    // });

    const corners = [
      { x: testFrom.x, y: testFrom.y },
      { x: testFrom.x + testFrom.width, y: testFrom.y },
      { x: testFrom.x + testFrom.width, y: testFrom.y + testFrom.height },
      { x: testFrom.x, y: testFrom.y + testFrom.height },
    ];

    corners.forEach(({ x: xFrom, y: yFrom }) => {
      const toPoint = transform(xFrom, yFrom, testMatrix);
      //console.log({ xFrom, yFrom, toPoint: { x: toPoint.x, y: toPoint.y } });
      if (
        toPoint.x < testTo.x ||
        toPoint.x > testTo.x + testTo.width ||
        toPoint.y < testTo.y ||
        toPoint.y > testTo.y + testTo.height
      ) {
        throw new Error(
          `Test 2 failed: Point (${toPoint.x}, ${toPoint.y}) is outside destination (${testTo.x}, ${testTo.y}, ${testTo.width}, ${testTo.height})`
        );
      }
    });
  }

  // Test 3: slice, source square, destination wider
  {
    // const testFrom: Rect = { x: -1, y: -1, width: 2, height: 2 };
    // const testTo: Rect = { x: 0, y: 0, height: 244, width: 325 };
    // const testMatrix = panAndZoom(testFrom, testTo, "slice");
    // console.log("Test 3 (slice, square to wider):", {
    //   testFrom,
    //   testTo,
    //   testMatrix: testMatrix.toJSON(),
    // });
    // const corners = [
    //   { x: testFrom.x, y: testFrom.y },
    //   { x: testFrom.x + testFrom.width, y: testFrom.y },
    //   { x: testFrom.x + testFrom.width, y: testFrom.y + testFrom.height },
    //   { x: testFrom.x, y: testFrom.y + testFrom.height },
    // ];
    // corners.forEach(({ x: xFrom, y: yFrom }) => {
    //   const toPoint = transform(xFrom, yFrom, testMatrix);
    //   console.log({ xFrom, yFrom, toPoint: { x: toPoint.x, y: toPoint.y } });
    //   // For "slice", points may be outside, but the scaled rectangle should cover the destination
    //   // Check that the x and y ranges cover the destination
    // });
  }

  //console.log("All tests passed!");
}
if (false) {
  // Run the tests
  runTests();
}

/**
 * Create a matrix to translate from one  coordinate space to another.
 *
 * Use case:
 * * All of my objects created by one part of the code are in one `<g>` element,
 * * All of my objects created by another part of the code are in a different `<g>` element,
 * * The two `<g>` elements use totally different coordinate systems, probably due to implementation details and the code's history.
 * * You want to make an object of one type, and you want to place at at the same location as an object of the other type.
 *
 * Or, you want to move an element from one `<g>` element to a different one.
 * To give it a new home.
 * But that's an implementation detail.
 * You want the object to look the same before and after the move.
 * @param coordinatesComeFromHere An element where your coordinates make sense.
 * @param coordinatesWillBeUsedHere An element where you want to use your coordinates.
 * @returns A matrix that will transform from coordinates the first coordinate space to the second.
 */
export function rehome(
  coordinatesComeFromHere: SVGGraphicsElement,
  coordinatesWillBeUsedHere: SVGGraphicsElement
): DOMMatrix {
  // Get the CTMs for both elements
  const sourceCTM = coordinatesComeFromHere.getCTM();
  const targetCTM = coordinatesWillBeUsedHere.getCTM();

  if (!sourceCTM || !targetCTM) {
    throw new Error("Unable to compute CTM for one or both elements");
  }

  // Compute the transformation matrix: targetCTM^-1 * sourceCTM
  return targetCTM.inverse().multiply(sourceCTM);
}
