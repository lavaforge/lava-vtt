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
  resetZoom();

  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) {
    throw new Error('no context');
  }
  await nextTick();
  initPaper();
  loadImage(); // TODO: put duplicate methods in shared space somewhere

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

function loadImage() {
  const raster = new paper.Raster('loaded-image');
  const scale = getScaleForImage(raster);
  raster.scale(scale, scale);
  raster.position = paper.view.center;
  const drawingLayer = new paper.Layer();
  drawingLayer.activate();
}

function getScaleForImage(raster: paper.Raster) {
  const widthRatioOfCanvasToImage =
    paper.view.bounds.width / raster.bounds.width;
  const heightRatioOfCanvasToImage =
    paper.view.bounds.height / raster.bounds.height;
  const scale = Math.min(widthRatioOfCanvasToImage, heightRatioOfCanvasToImage);
  return scale;
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
      <img
        id="loaded-image"
        ref="imageRef"
        :src="imagePath"
        style="display: none"
      />
      <canvas ref="canvasRef" />
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

html,
body {
  width: 100%;
  height: 100%;
}

canvas {
  width: 100%;
  height: 100%;
}

.center {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
</style>
