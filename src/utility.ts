// TODO stop copying this and move it to phil-lib.
export class AnimationLoop {
  constructor(private readonly onWake: (time: DOMHighResTimeStamp) => void) {
    this.callback = this.callback.bind(this);
    this.callback(performance.now());
  }
  #cancelled = false;
  cancel() {
    this.#cancelled = true;
  }
  private callback(time: DOMHighResTimeStamp) {
    if (!this.#cancelled) {
      requestAnimationFrame(this.callback);
      this.onWake(time);
    }
  }
}

// This is dead wrong in phil-lib/misc.ts!!!
export function polarToRectangular(r: number, θ: number) {
  return { x: Math.cos(θ) * r, y: Math.sin(θ) * r };
}

