<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSocket } from '../logic/useSocket';
import { useEventListener } from '@vueuse/core';
import { FogOfWar } from '../logic/FogOfWar';
import { useMouse } from '@vueuse/core';
import { scg } from 'ioc-service-container';

const { emit } = useSocket({
  event: 'new-image',
  callback: (data) => {
    hash.value = data;
  },
});

const apiUrl = scg('apiUrl');

const hash = ref('');
const imagePath = computed(() => `${apiUrl}/api/image/${hash.value}`);

// log image dimensions once every second
const imageRef = ref<HTMLImageElement | null>(null);
const width = ref(0);
const height = ref(0);

useEventListener(imageRef, 'load', async () => {
  if (!imageRef.value || !canvasRef.value) {
    throw new Error('no image or canvas');
  }

  width.value = imageRef.value.naturalWidth;
  height.value = imageRef.value.naturalHeight;

  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) {
    throw new Error('no ctx');
  }

  off?.();

  console.log('before fow', width.value, height.value);
  fow = new FogOfWar(ctx, width.value, height.value, true);
  try {
    await fetch(`${apiUrl}/api/fow/${hash.value}`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          console.log('setting data', data);
          fow?.setData(data);
          fow?.update();
          console.log('initial update');
        }
      });
  } catch (e) {
    console.error(e);
  }

  console.log('after fow fetch');

  console.log(fow.width, fow.height);
  ({ off } = fow.onUpdate((data) => {
    console.warn('new fow');
    emit('new-fow', data);
  }));

  fow.update(true);
});

let fow: FogOfWar | null = null;
let off: ReturnType<FogOfWar['onUpdate']>['off'] | null = null;

const canvasRef = ref<HTMLCanvasElement | null>(null);

type Point = { x: number; y: number };

let startPoint: Point | null = null;
let mouseStart: Point | null = null;
useEventListener(canvasRef, 'mousedown', (e) => {
  if (!canvasRef.value) {
    return;
  }

  startPoint = getPointOnCanvas(
    { x: e.clientX, y: e.clientY },
    canvasRef.value,
  );
  mouseStart = { x: mouseX.value, y: mouseY.value };
});

function getPointOnCanvas(p: Point, canvas: HTMLCanvasElement): Point {
  // Get the bounding rectangle of the canvas
  const rect = canvas.getBoundingClientRect();

  // Calculate the scaling factors
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  // Adjust mouse event coordinates
  const canvasX = Math.floor((p.x - rect.left) * scaleX);
  const canvasY = Math.floor((p.y - rect.top) * scaleY);

  return { x: canvasX, y: canvasY };
}

useEventListener(canvasRef, 'mouseup', (e) => {
  if (!canvasRef.value || !startPoint) {
    return;
  }

  const end = getPointOnCanvas({ x: e.clientX, y: e.clientY }, canvasRef.value);

  console.log(startPoint, end);
  const [topLeft, bottomRight] = getTopLeftAndBottomRight(startPoint, end);
  paintRectangle(topLeft, bottomRight);

  startPoint = null;
  if (rectangleRef.value) {
    rectangleRef.value.style.display = 'none';
  }
});

const shouldCover = ref(false);
function paintRectangle(topLeft: Point, bottomRight: Point) {
  if (!fow) {
    return;
  }

  const lines: Array<[{ x: number; y: number }, number]> = [];
  for (let y = topLeft.y; y < bottomRight.y; y++) {
    lines.push([{ x: topLeft.x, y }, bottomRight.x - topLeft.x]);
  }

  console.log('painting');
  lines.forEach(([start, length]) => {
    fow?.drawRunInSingleLine(shouldCover.value, start, length);
  });

  console.log('updating');
  fow.update();
  console.log('updated');
}

function getTopLeftAndBottomRight(start: Point, end: Point): [Point, Point] {
  return [
    { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) },
    { x: Math.max(start.x, end.x), y: Math.max(start.y, end.y) },
  ];
}

const rectangleRef = ref<HTMLDivElement | null>(null);
useEventListener(canvasRef, 'mousemove', () => {
  if (!startPoint || !mouseStart || !rectangleRef.value) {
    return;
  }

  const currentX = mouseX.value;
  const currentY = mouseY.value;

  const width = Math.abs(currentX - mouseStart.x);
  const height = Math.abs(currentY - mouseStart.y);

  rectangleRef.value.style.left = `${Math.min(currentX, mouseStart.x)}px`;
  rectangleRef.value.style.top = `${Math.min(currentY, mouseStart.y)}px`;
  rectangleRef.value.style.width = `${width}px`;
  rectangleRef.value.style.height = `${height}px`;
  rectangleRef.value.style.display = 'block';
});

useEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'x') {
    shouldCover.value = !shouldCover.value;
  }
});

const { x: mouseX, y: mouseY } = useMouse();
</script>

<template>
  <div :key="imagePath" ref="containerRef" class="center">
    <template v-if="hash">
      <img ref="imageRef" :src="imagePath" />
      <canvas :width="width" :height="height" ref="canvasRef" />
      <div ref="rectangleRef" class="rectangle" />
      <div
        class="indicator"
        :style="{ 'background-color': shouldCover ? 'black' : 'white' }"
      />
      <div class="vertical-line" :style="{ left: mouseX + 'px' }"></div>
      <div class="horizontal-line" :style="{ top: mouseY + 'px' }"></div>
    </template>
    <div v-else>no image loaded</div>
  </div>
</template>

<style scoped>
img {
  max-width: 100vw;
  max-height: 100vh;
}

canvas {
  position: absolute;
  max-width: 100vw;
  max-height: 100vh;
}

.center {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.rectangle {
  position: absolute;
  border: 1px dashed red;
  display: none;
  pointer-events: none;
}

.indicator {
  position: fixed;
  top: 0;
  right: 0;
  width: 50px;
  height: 50px;
  border: 2px solid black;
}

.vertical-line,
.horizontal-line {
  position: absolute;
  background-color: black;
  pointer-events: none;
}

.vertical-line {
  width: 1px;
  height: 100%;
  left: v-bind(mouseX) px;
}

.horizontal-line {
  width: 100%;
  height: 1px;
  top: v-bind(mouseY) px;
}
</style>
