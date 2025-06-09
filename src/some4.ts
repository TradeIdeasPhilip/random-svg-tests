import "./some4.css";

abstract class TaylorBase {
  abstract readonly numberOfTerms: number;
  abstract constant(x0: number, termNumber: number): number;
  compute(x: number, x0: number, numberOfTerms: number) {
    let result = 0;
    for (let termNumber = 0; termNumber < numberOfTerms; termNumber++) {
      const constant = this.constant(x0, termNumber);
      result += constant * (x - x0) ** termNumber;
    }
    return result;
  }
}

class Reciprocal extends TaylorBase {
  readonly numberOfTerms = Infinity;
  override constant(x0: number, termNumber: number): number {
    if (x0 === 0) {
      throw new Error("Reciprocal is undefined at x0 = 0");
    }
    return ((-1) ** termNumber) / (x0 ** (termNumber + 1));
  }
}

class Sine extends TaylorBase {
  readonly numberOfTerms = Infinity;
  override constant(x0: number, termNumber: number): number {
    // Compute sin(x0 + n * π/2) / n!
    const angle = x0 + (termNumber * Math.PI) / 2;
    let factorial = 1;
    for (let i = 1; i <= termNumber; i++) {
      factorial *= i;
    }
    return Math.sin(angle) / factorial;
  }
}

/**
 * 1 / (1 + x*x)
 */
class HiddenPoles extends TaylorBase {
  readonly numberOfTerms = 6;
  override constant(x0: number, termNumber: number): number {
    const denom = 1 + x0 * x0;
    switch (termNumber) {
      case 0:
        return 1 / denom;
      case 1:
        return (-2 * x0) / (denom ** 2);
      case 2:
        return (3 * x0 * x0 - 1) / (denom ** 3);
      case 3:
        return (2 * x0 * (3 - 5 * x0 * x0)) / (denom ** 4);
      case 4:
        return (25 * x0 ** 4 - 38 * x0 * x0 + 3) / (2 * denom ** 5);
      case 5:
        return (x0 * (2842 * x0 * x0 - 1450 * x0 ** 4 - 636)) / (5 * denom ** 6);
      default:
        throw new Error(`Term ${termNumber} not implemented.`);
    }
  }
}

console.log({HiddenPoles,Sine, Reciprocal})