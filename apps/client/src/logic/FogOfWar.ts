type Point = { x: number; y: number };

export class FogOfWar {
  private data: number[];

  constructor(
    private readonly context: CanvasRenderingContext2D,
    readonly width: number,
    readonly height: number,
    private readonly forDm: boolean,
  ) {
    this.data = [0, width * height];
  }

  setData(data: number[]) {
    this.data = data;
  }

  pixelIndexToPixel(idx: number): Point {
    return {
      x: idx % this.width,
      y: Math.floor(idx / this.width),
    };
  }

  pixelToPixelIndex(point: Point): number {
    return point.y * this.width + point.x;
  }

  pixelIndexToRunIndex(idx: number): number {
    let total = 0;
    for (const [index, value] of this.data.entries()) {
      total += value;
      if (total >= idx) {
        return index;
      }
    }
    throw new Error('Pixel index out of bounds');
  }

  runIndexToStartPixelIndex(idx: number): number {
    return this.data.slice(0, idx).reduce((a, b) => a + b, 0);
  }

  drawRunInSingleLine(cover: boolean, point: Point, length: number) {
    if (point.x >= this.width || point.y >= this.height || point.y < 0) {
      return;
    }

    if (point.x < 0) {
      length -= Math.abs(point.x);
      point.x = 0;
    }

    length = Math.min(length, this.width - point.x);

    const startRunIdx = this.pixelToRunIndex(point);
    const endRunIdx = this.pixelIndexToRunIndex(
      this.pixelToPixelIndex(point) + length,
    );

    const endRunLength = this.data[endRunIdx];

    const newStartRunLength =
      this.pixelToPixelIndex(point) -
      this.runIndexToStartPixelIndex(startRunIdx);
    const newEndRunLength =
      endRunLength -
      (this.pixelToPixelIndex(point) +
        length -
        this.runIndexToStartPixelIndex(endRunIdx));

    const startIsCovered = startRunIdx % 2 === 0;
    const endIsCovered = endRunIdx % 2 === 0;

    const toInsert = [length];

    if (startIsCovered === cover) {
      toInsert.unshift(0);
    }

    if (endIsCovered === cover) {
      toInsert.push(0);
    }

    toInsert.unshift(newStartRunLength);
    toInsert.push(newEndRunLength);

    this.data.splice(startRunIdx, endRunIdx - startRunIdx + 1, ...toInsert);

    this.optimize();
  }

  pixelToRunIndex(point: Point): number {
    return this.pixelIndexToRunIndex(this.pixelToPixelIndex(point));
  }

  optimize() {
    while (this.data.at(-1) === 0) {
      this.data.pop();
    }

    for (let i = this.data.length - 2; i > 0; i--) {
      if (this.data[i] === 0) {
        const prev = this.data[i - 1];
        const next = this.data[i + 1];

        this.data.splice(i - 1, 3, prev + next);
      }
    }
  }

  update(noNotify?: boolean) {
    const ctx = this.context;
    ctx.clearRect(0, 0, this.width, this.height);

    let total = 0;

    ctx.fillStyle = this.forDm ? 'rgba(0, 0, 0, 0.5)' : 'black';
    for (const [index, runLength] of this.data.entries()) {
      const isCovered = index % 2 === 0;
      if (!isCovered) {
        total += runLength;
        continue;
      }

      const startPixel = this.pixelIndexToPixel(total);

      // first line
      const pixelAmount = Math.min(runLength, this.width - startPixel.x);
      ctx.fillRect(startPixel.x, startPixel.y, pixelAmount, 1);

      if (pixelAmount < runLength) {
        let remaining = runLength - pixelAmount;
        for (let y = startPixel.y + 1; y < this.height; y++) {
          const pixelAmount = Math.min(remaining, this.width);
          ctx.fillRect(0, y, pixelAmount, 1);
          remaining -= pixelAmount;
          if (remaining <= 0) {
            break;
          }
        }
      }

      total += runLength;
    }

    if (!noNotify) {
      console.log(
        'internal notify',
        this.width,
        this.height,
        this.updateListeners,
      );
      this.updateListeners.forEach((listener) => listener(this.data));
    }
  }

  private updateListeners: ((data: number[]) => void)[] = [];
  onUpdate(callback: (data: number[]) => void): { off: () => void } {
    this.updateListeners.push(callback);
    console.log(this.updateListeners);
    return {
      off: () => {
        this.updateListeners = this.updateListeners.filter(
          (listener) => listener !== callback,
        );
      },
    };
  }
}
