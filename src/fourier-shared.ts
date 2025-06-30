import { fft } from "fft-js";
import {
  Command,
  LCommand,
  ParametricFunction,
  PathShape,
  Point,
} from "./path-shape";
import { PathWrapper, Random } from "./utility";
import { initializedArray, sum } from "phil-lib/misc";
import { samples } from "./fourier-samples";

/**
 *
 * @param numberOfPoints
 * @param skip 0 to make a polygon.
 * 1 to make a star, if numberOfPoints is odd and at least 5.
 * 2 to make a different star, if numberOfPoints is odd and at least 7.
 * @param random A random number generator or a seed for a new random number generator.
 */
export function makePolygon(
  numberOfPoints: number,
  skip: number,
  random: (() => number) | string = "My seed 2025",
  randomness = 0.25
) {
  const rotate = ((2 * Math.PI) / numberOfPoints) * (1 + skip);
  if (typeof random === "string") {
    random = Random.fromString(random);
  }
  const jiggle = () => (random() - 0.5) * randomness;
  const vertices = initializedArray(numberOfPoints, (i) => {
    const θ = i * rotate;
    return { x: Math.cos(θ) + jiggle(), y: Math.sin(θ) + jiggle() };
  });
  const commands = vertices.map((vertex, index) => {
    const nextVertex = vertices[(index + 1) % numberOfPoints];
    return new LCommand(vertex.x, vertex.y, nextVertex.x, nextVertex.y);
  });
  return new PathShape(commands);
}

// Flip it left to right.  The table was covering his head and beak.
// Now it's covering his butt.
// Use .reverse() to restore the original clockwise direction.
samples.kiwi = PathShape.fromString(samples.kiwi)
  .transform(new DOMMatrix("scaleX(-1)"))
  .reverse().rawPath;

export interface FourierTerm {
  frequency: number;
  amplitude: number;
  phase: number;
}

export type Complex = [real: number, imaginary: number];

export function samplesFromParametric(
  func: ParametricFunction,
  numSamples: number = 1024
): Complex[] {
  if (Math.log2(numSamples) % 1 !== 0) {
    throw new Error("numSamples must be a power of 2");
  }
  const samples: Complex[] = [];
  for (let i = 0; i < numSamples; i++) {
    const t = i / (numSamples - 1);
    const point = func(t);
    samples.push([point.x, point.y]);
  }
  return samples;
}

function keepNonZeroTerms(terms: readonly FourierTerm[]): FourierTerm[] {
  let sum = 0;
  terms.forEach((term) => (sum += term.amplitude));
  const cutoff = sum / 1e7;
  const result = terms.filter((term) => term.amplitude > cutoff);
  let newSum = 0;
  result.forEach((term) => (newSum += term.amplitude));
  return result;
}

export function samplesToFourier(samples: Complex[]): FourierTerm[] {
  const numSamples = samples.length;
  if (Math.log2(numSamples) % 1 !== 0) {
    throw new Error("numSamples must be a power of 2");
  }
  const phasors = fft(samples);
  const terms: FourierTerm[] = [];
  for (let k = 0; k < numSamples; k++) {
    const [real, imag] = phasors[k];
    const amplitude = Math.sqrt(real * real + imag * imag) / numSamples;
    const phase = Math.atan2(imag, real);
    const frequency = k <= numSamples / 2 ? k : k - numSamples; // Map k > N/2 to negative
    terms.push({ frequency, amplitude, phase });
  }
  // Sort by amplitude, descending
  terms.sort((a, b) => b.amplitude - a.amplitude);
  return keepNonZeroTerms(terms);
}

export function termsToParametricFunction(
  terms: readonly FourierTerm[],
  numTerms: number,
  start = 0
): ParametricFunction {
  const end = Math.min(start + numTerms, terms.length);
  return (t: number): Point => {
    let x = 0,
      y = 0;
    for (let k = start; k < end; k++) {
      const { frequency, amplitude, phase } = terms[k];
      const angle = 2 * Math.PI * frequency * t + phase;
      x += amplitude * Math.cos(angle);
      y += amplitude * Math.sin(angle);
    }
    return { x, y };
  };
}

/**
 * If a term's frequency is 0 then its contribution will be fixed.
 * I.e. it will not depend on the angle.
 * @param term Created by samplesToFourier()
 * @returns `undefined` if this term does not have a fixed value.
 * Otherwise returns the contribution of the term.
 */
export function hasFixedContribution(term: FourierTerm): Point | undefined {
  if (term.frequency == 0) {
    return {
      x: Math.cos(term.phase) * term.amplitude,
      y: Math.sin(term.phase) * term.amplitude,
    };
  } else {
    return undefined;
  }
}

// TODO This can get noticeably slow for a complex path.  It takes about 1.3 seconds to
// decode the samples.likeShareAndSubscribe.  It took noticeable time for some of the other
// examples, too.  The time grows slightly faster than linearly as the path gets longer.
export function samplesFromPathOrig(
  pathString: string,
  numberOfTerms: number
): Complex[] {
  const path = new PathWrapper();
  path.d = pathString;
  const sampleCount = numberOfTerms;
  const segmentCount = sampleCount - 1;
  const totalLength = path.length;
  return initializedArray(sampleCount, (index) => {
    const point = path.getPoint((totalLength / segmentCount) * index);
    return [point.x, point.y];
  });
}

// This is more complicated than samplesFromPathOrig but it give you 3 things:
// * It is faster.  I was thinking about doing this just for the performance gain.
//   There is an issue where calling getPoint() on a long and complicated path gets slow.
// * It fills in the jumps.
//   They are replaced with straight lines.
//   That would have happened anyway, but this avoids the crazy oscillations.
// * This makes sure that every point named explicitly in the path string will be sampled.
//   Which is essential if one part of your path has a lot of detail.
export function samplesFromPath(
  pathString: string,
  numberOfTerms: number
): Complex[] {
  const caliper = new PathWrapper();
  try {
    const commands = PathShape.fromString(pathString).commands;
    if (commands.length == 0) {
      throw new Error("wtf");
    }
    const connectedCommands = new Array<Command>();
    commands.forEach((command, index) => {
      connectedCommands.push(command);
      const nextCommand = commands[(index + 1) % commands.length];
      if (PathShape.needAnM(command, nextCommand)) {
        const newSegment = new LCommand(
          command.x,
          command.y,
          nextCommand.x0,
          nextCommand.y0
        );
        connectedCommands.push(newSegment);
      }
    });
    const subPaths = connectedCommands.map(
      (command) => new PathShape([command])
    );
    const lengths = subPaths.map(
      (
        path,
        originalIndex
      ): {
        readonly path: PathShape;
        readonly length: number;
        readonly originalIndex: number;
        numberOfVertices: number;
      } => {
        caliper.d = path.rawPath;
        const length = caliper.length;
        return {
          path,
          length: length,
          numberOfVertices: 0,
          originalIndex,
        };
      }
    );
    {
      /**
       * This contains the same objects as the `lengths` array.
       * We are modifying the objects' `numberOfVertices` property.
       *
       * This is sorted with the longest items first in the list.
       * We will be removing the smallest items first, `pop`-ing them.
       */
      const working = lengths.toSorted((a, b) => b.length - a.length);
      let verticesAvailable = numberOfTerms;
      let lengthAvailable = sum(working.map(({ length }) => length));
      while (true) {
        if (verticesAvailable == 0) {
          break;
        }
        const segmentInfo = working.pop();
        if (!segmentInfo) {
          throw new Error("wtf");
        }
        if (segmentInfo.length > 0) {
          const idealNumberOfVertices =
            (verticesAvailable / lengthAvailable) * segmentInfo.length;
          const numberOfVertices = Math.max(
            1,
            Math.round(idealNumberOfVertices)
          );
          segmentInfo.numberOfVertices = numberOfVertices;
          verticesAvailable -= numberOfVertices;
          lengthAvailable -= segmentInfo.length;
        }
      }
    }
    console.table(lengths);
    const result = new Array<Complex>();
    lengths.forEach(({ length, numberOfVertices, path }) => {
      if (numberOfVertices > 0) {
        caliper.d = path.rawPath;
        for (let i = 0; i < numberOfVertices; i++) {
          const distance = (i / numberOfVertices) * length;
          const { x, y } = caliper.getPoint(distance);
          result.push([x, y]);
        }
      }
    });
    return result;
    /**
     * create a sorted copy of the lengths array, sorted by path length.
     * keep track of the number of vertices available,
     * starting with what we were given,
     * decreasing as we dole them out.
     *
     * can this get rid of the filter/flatMap above?
     * This step, not "const lengths = subPaths.map"
     * should get rid of paths with 0 length.
     * yes!!
     *
     * Start processing from the short end.
     * If a length is 0, skip the command entirely and continue on to the next.
     * Given the number of vertices available and the amount of distance available,
     * what is the ideal number of vertices per distance?
     * and what is the ideal number of vertices for this command?
     * Round to an integer.
     * Set a min value of 1 vertex.
     * Store the result for this record, remove it from the list, and repeat.
     */
    /**
     * Now that we know how many vertexes are allocated for each command,
     * the rest is trivial.
     * Go back to the original, unsorted array of lengths.
     * Go through them in order.
     * For i = (0 ... n-1), look at position i/n*length.
     * I.e. always do the staring point and never do the ending point.
     */
  } catch (reason) {
    console.warn("using fallback", reason);
    return samplesFromPathOrig(pathString, numberOfTerms);
  }
}

function getAmplitudes(terms: readonly FourierTerm[]) {
  let totalAmplitude = 0;
  terms.forEach((term) => (totalAmplitude += term.amplitude));
  /**
   * `here` is the amount of amplitude expressed as a percent.
   *
   * `before` and `after` are the sum of all of the amplitudes
   * before and after this row.  I precompute these mostly so I
   * can control the round off error.
   */
  const amplitudes = terms.map((term) => {
    const here = (term.amplitude / totalAmplitude) * 100;
    return { here, before: NaN, after: NaN };
  });
  {
    let beforeSoFar = 0;
    let afterSoFar = 0;
    amplitudes.forEach((beforeRow, beforeIndex, array) => {
      beforeRow.before = beforeSoFar;
      beforeSoFar += beforeRow.here;
      const afterIndex = array.length - beforeIndex - 1;
      const afterRow = array[afterIndex];
      afterRow.after = afterSoFar;
      afterSoFar += afterRow.here;
    });
    //console.log(beforeSoFar, afterSoFar, amplitudes);
  }
  return amplitudes;
}

export type ScriptEntry = {
  offset: number;
  startTime: number;
  endTime: number;
  usingCircles: number;
  usingAmplitude: number;
  addingCircles: number;
  addingAmplitude: number;
  availableAmplitude: number;
  availableCircles: number;
};
export function groupTerms(inputs: {
  readonly pauseTime: number;
  readonly addTime: number;
  readonly maxGroupsToDisplay: number;
  readonly terms: readonly FourierTerm[];
}) {
  const amplitudes = getAmplitudes(inputs.terms);
  const script = new Array<ScriptEntry>();
  let usingCircles = 0;
  for (
    let remainingGroupsToDisplay = inputs.maxGroupsToDisplay - 1;
    remainingGroupsToDisplay >= 0 && usingCircles < amplitudes.length;
    remainingGroupsToDisplay--
  ) {
    let addingAmplitude = 0;
    let addingCircles = 0;
    let termIndex = usingCircles;
    const usingAmplitude = amplitudes[termIndex].before;
    while (true) {
      addingAmplitude += amplitudes[termIndex].here;
      addingCircles++;
      termIndex++;
      if (termIndex >= amplitudes.length) {
        break;
      }
      if (remainingGroupsToDisplay > 0) {
        const remainingAmplitude = amplitudes[termIndex].after;
        const averageRemainingBinSize =
          remainingAmplitude / remainingGroupsToDisplay;
        if (addingAmplitude > averageRemainingBinSize) {
          break;
        }
      }
    }
    const availableAmplitude = amplitudes[termIndex - 1].after;
    const availableCircles = amplitudes.length - termIndex;
    script.push({
      offset: NaN,
      startTime: NaN,
      endTime: NaN,
      usingCircles,
      usingAmplitude,
      addingCircles, // 👈 Adding
      addingAmplitude,
      availableAmplitude,
      availableCircles,
    });
    usingCircles += addingCircles;
    script.push({
      offset: NaN,
      startTime: NaN,
      endTime: NaN,
      usingCircles,
      usingAmplitude: usingAmplitude + addingAmplitude,
      addingCircles: 0, // 👈 Pausing
      addingAmplitude: 0,
      availableAmplitude,
      availableCircles,
    });
  }
  // Fill in startTime and endTime for each row of the script.
  let startTime = 0;
  script.forEach((scriptEntry) => {
    const duration = scriptEntry.addingCircles
      ? inputs.addTime
      : inputs.pauseTime;
    const endTime = startTime + duration;
    scriptEntry.startTime = startTime;
    scriptEntry.endTime = endTime;
    startTime = endTime;
  });
  script.forEach((keyframe) => {
    keyframe.offset = keyframe.startTime / startTime;
  });
  const last = script.at(-1)!;
  const final = { ...last, startTime, offset: 1 };
  script.push(final);
  return script;
}
