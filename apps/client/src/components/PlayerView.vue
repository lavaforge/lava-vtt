<script lang="ts" setup>
import { computed, nextTick, ref } from 'vue';
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
const width = ref(0);
const height = ref(0);

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
  if (!imageRef.value || !canvasRef.value) {
    throw new Error('no image or canvas');
  }
  emit('loaded');
  height.value = imageRef.value.naturalHeight;
  width.value = imageRef.value.naturalWidth;
  resetZoom();
  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) {
    throw new Error('no context');
  }
  await nextTick();
  initPaper();
  scalePaper();

  /*fow = new FogOfWar(ctx, width.value, height.value, false);
  fow.update();

  await fetch(`${apiUrl}/api/fow/${hash.value}`)
    .then((res) => res.json())
    .then((data) => {
      if (data) {
        fow?.setData(data);
        fow?.update();
      }
    }); */
});

function scalePaper() {
  const actualWidth = paper.view.viewSize.width;
  const actualHeight = paper.view.viewSize.height;
  const scaleX = actualWidth / width.value;
  const scaleY = actualHeight / height.value;
  paper.view.matrix.reset();
  const translateX = (actualWidth - width.value * Math.min(scaleX, scaleY)) / 2;
  const translateY =
    (actualHeight - height.value * Math.min(scaleX, scaleY)) / 2;
  paper.view.translate(new paper.Point(translateX, translateY));
  paper.view.scale(Math.min(scaleX, scaleY));
}

const { emit } = useSocket({
  event: 'fow-broadcast',
  callback: (data) => {
    console.log('fow-broadcast', data);
    updateFOW(data);
  },
});

function updateFOW(data: string) {
  let path: paper.CompoundPath = new paper.CompoundPath(data);
  console.log(path);
  path.fillColor = new paper.Color('black');
  getActiveLayer().removeChildren();
  getActiveLayer().addChild(path);
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

const containerRef = ref<HTMLDivElement | null>(null);
</script>

<template>
  <div :key="imagePath" ref="containerRef" class="center">
    <template v-if="hash">
      <img ref="imageRef" :src="imagePath" />
      <canvas ref="canvasRef" :height="height" :width="width" resize="true" />
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

canvas[resize] {
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
}
</style>
