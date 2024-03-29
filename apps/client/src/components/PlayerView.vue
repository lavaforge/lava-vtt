<script lang="ts" setup>
import { computed, ref } from 'vue';
import panzoom from 'panzoom';
import { useEventListener } from '@vueuse/core';
import { useSocket } from '../logic/useSocket';
import { FogOfWar } from '../logic/FogOfWar';
import { scg } from 'ioc-service-container';

const apiUrl = scg('apiUrl');
const hash = ref('');
const imagePath = computed(() => `${apiUrl}/api/image/${hash.value}`);

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

const imageRef = ref<HTMLImageElement | null>(null);

let instance: ReturnType<typeof panzoom> | null = null;
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

const canvasRef = ref<HTMLCanvasElement | null>(null);

let fow: FogOfWar | null = null;

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

  fow = new FogOfWar(ctx, width.value, height.value, false);
  fow.update();

  await fetch(`${apiUrl}/api/fow/${hash.value}`)
    .then((res) => res.json())
    .then((data) => {
      if (data) {
        fow?.setData(data);
        fow?.update();
      }
    });
});

const { emit } = useSocket({
  event: 'fow-broadcast',
  callback: (data) => {
    fow?.setData(data);
    fow?.update();
  },
});

useSocket({
  event: 'new-image',
  callback: (newHash) => {
    console.log('new image', newHash);
    hash.value = newHash;
  },
});

const width = ref(0);
const height = ref(0);

const containerRef = ref<HTMLDivElement | null>(null);
</script>

<template>
  <div :key="imagePath" ref="containerRef" class="center">
    <template v-if="hash">
      <img ref="imageRef" :src="imagePath" />
      <canvas ref="canvasRef" :height="height" :width="width" />
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
</style>
