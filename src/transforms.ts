import { ReadOnlyRect } from "phil-lib/misc";

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

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
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
  // Step 1: Compute the scaling factors to fit or fill the destination
  const srcAspect = srcRect.width / srcRect.height;
  const destAspect = destRect.width / destRect.height;

  let scaleX: number, scaleY: number;
  switch (aspect) {
    case "meet":
    case "srcRect fits completely into destRect": {
      // meet: Scale to fit entirely within destRect, preserving aspect ratio
      if (srcAspect > destAspect) {
        // Source is wider than destination: scale by width, letterbox height
        scaleX = destRect.width / srcRect.width;
        scaleY = scaleX;
      } else {
        // Source is taller than destination: scale by height, letterbox width
        scaleY = destRect.height / srcRect.height;
        scaleX = scaleY;
      }
      break;
    }
    case "slice":
    case "srcRect completely covers destRect": {
      // slice: Scale to fill destRect, preserving aspect ratio, may crop
      if (srcAspect > destAspect) {
        // Source is wider than destination: scale by height, crop width
        scaleY = destRect.height / srcRect.height;
        scaleX = scaleY;
      } else {
        // Source is taller than destination: scale by width, crop height
        scaleX = destRect.width / srcRect.width;
        scaleY = scaleX;
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
    -srcRect.x * scaleX +
    howFarRight * (destRect.width - srcRect.width * scaleX) +
    destRect.x;
  const translateY =
    -srcRect.y * scaleY +
    howFarDown * (destRect.height - srcRect.height * scaleY) +
    destRect.y;

  // Step 3: Create the DOMMatrix
  const matrix = new DOMMatrix()
    .translate(translateX, translateY)
    .scale(scaleX, scaleY);

  return matrix;
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
// Run the tests
runTests();
