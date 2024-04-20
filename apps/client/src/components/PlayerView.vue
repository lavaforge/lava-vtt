<script lang="ts" setup>
import { computed, nextTick, ref, type Ref } from 'vue';
import panzoom from 'panzoom';
import { useEventListener } from '@vueuse/core';
import { useSocket } from '../logic/useSocket';
import { scg } from 'ioc-service-container';
import paper from 'paper';

const apiUrl = scg('apiUrl');
const hash = ref('');
const imagePath = computed(() => `${apiUrl}/api/image/${hash.value}`);
const imageRef = ref<HTMLImageElement | null>(null);
let instance: ReturnType<typeof panzoom> | null = null;
const canvasRef = ref<HTMLCanvasElement | null>(null);
const someText = ref('');
const width = ref(0);
const height = ref(0);
const containerRef = ref<HTMLDivElement | null>(null);

function initPaper() {
  if (canvasRef.value) {
    paper.setup(canvasRef.value);
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

const resetZoom = () => {
  instance?.dispose();

  if (!containerRef.value) {
    return;
  }

  instance = panzoom(containerRef.value, {
    minZoom: 0.8,
    bounds: true,
    smoothScroll: false,
    beforeWheel(e) {
      return !e.altKey;
    },
    onTouch(e) {
      if (e.touches.length >= 5) {
        setTimeout(() => {
          toggleFullscreen();
          setTimeout(() => resetZoom(), 300);
        }, 300);
      } else if (e.touches.length >= 4) {
        setTimeout(() => {
          resetZoom();
        }, 300);
      }
      return true;
    },
  });
};

useEventListener(imageRef, 'load', async () => {
  initCanvas(imageRef);
});

async function initCanvas(imageRef: Ref<HTMLImageElement | null>) {
  if (!imageRef.value || !canvasRef.value) {
    throw new Error('no image or canvas');
  }
  emit('loaded');
  height.value = imageRef.value.height;
  width.value = imageRef.value.width;
  resetZoom();
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) {
    throw new Error('no context');
  }
  await nextTick();
  initPaper();
}

useEventListener('resize', (e) => {
  initCanvas(imageRef);
});

const { emit } = useSocket({
  event: 'fow-broadcast',
  callback: (data) => {
    console.log('fow-broadcast', data);
    updateFOW(data);
  },
});

function updateFOW(data: string) {
  let scalePositionQuadruple = getScaleAndPositionFromPathData(data);
  let path: paper.CompoundPath = new paper.CompoundPath(
    getPathDataWithoutScaleInfo(data),
  );

  console.log(data);
  console.log(scalePositionQuadruple);
  console.log(path);

  path.fillColor = new paper.Color('black');
  scaleAndPositionPath(path, scalePositionQuadruple);

  getActiveLayer().removeChildren();
  getActiveLayer().addChild(path);
}

function scaleAndPositionPath(
  path: paper.CompoundPath,
  scalePositionQuadruple: number[] | null,
) {
  if (scalePositionQuadruple == null || scalePositionQuadruple == undefined)
    return;
  if (
    scalePositionQuadruple[0] == undefined ||
    scalePositionQuadruple[1] == undefined ||
    scalePositionQuadruple[2] == undefined ||
    scalePositionQuadruple[3] == undefined
  )
    return;
  let newCanvasWidth = paper.view.size.width;
  let newCanvasHeight = paper.view.size.height;
  if (newCanvasWidth == undefined || newCanvasHeight == undefined) return;
  let scaleX = newCanvasWidth / scalePositionQuadruple[0];
  let scaleY = newCanvasHeight / scalePositionQuadruple[1];
  let uniformScale = Math.min(scaleX, scaleY);
  console.log('pos before: ' + path.position);
  path.position = new paper.Point(
    scalePositionQuadruple[2] * scaleX,
    scalePositionQuadruple[3] * scaleY,
  );
  console.log('pos after: ' + path.position);
  path.scale(uniformScale);
}

function getScaleAndPositionFromPathData(pathData: string) {
  const match = pathData.match(/\[(\d+),(\d+),(\d+\.\d+),(\d+\.\d+)\]/);
  if (match && match.length === 5) {
    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);
    const posX = parseFloat(match[3]);
    const posY = parseFloat(match[4]);
    return [width, height, posX, posY];
  }
  return null;
}

function getPathDataWithoutScaleInfo(pathData: string) {
  const cleanedPathData = pathData.replace(/\[\d+,\d+\]/, '');
  return cleanedPathData;
}

function getActiveLayer() {
  return paper.project.activeLayer;
}

useSocket({
  event: 'new-image',
  callback: (newHash) => {
    console.log('new image', newHash);
    hash.value = newHash;
  },
});
</script>

<template>
  <div :key="imagePath" ref="containerRef" class="center">
    <template v-if="hash">
      <img ref="imageRef" :src="imagePath" />
      <canvas ref="canvasRef" :height="height" :width="width" hidpi="off" />
      <p class="mf">{{ someText }}</p>
    </template>
    <div v-else>no image loaded</div>
  </div>
</template>

<style scoped>
h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

img {
  max-width: 100vw;
  max-height: 100vh;
}

canvas {
  position: absolute;
  background-color: red;
  opacity: 0.5;
}

.center {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: blue;
}

.mf {
  position: absolute;
  background-color: lime;
}
</style>
