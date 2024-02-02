<script setup lang="ts">
import { computed, ref } from "vue";
import { useSocket } from "../logic/useSocket.ts";
import { useEventListener } from "@vueuse/core";
import { FogOfWar } from "../logic/FogOfWar.ts";

const { emit } = useSocket({
  event: "new-image",
  callback: (_data) => {
    console.log("new image");
    hash.value = new Date().toISOString();
  },
});

const hash = ref(new Date().toISOString());
const imagePath = computed(
  () => `${window.location.origin}/image?hash=${hash.value}`,
);

// log image dimensions once every second
const imageRef = ref<HTMLImageElement | null>(null);
const width = ref(0);
const height = ref(0);

let shouldUpdate = true;
useSocket({
  event: "fow-broadcast",
  callback: (data) => {
    if (shouldUpdate) {
      fow?.setData(data);
      fow?.update(true);
      shouldUpdate = false;
    }
  },
});

useEventListener(imageRef, "load", () => {
  if (!imageRef.value || !canvasRef.value) {
    throw new Error("no image or canvas");
  }
  shouldUpdate = true;
  emit("loaded");

  width.value = imageRef.value.naturalWidth;
  height.value = imageRef.value.naturalHeight;

  const ctx = canvasRef.value.getContext("2d");
  if (!ctx) {
    throw new Error("no ctx");
  }

  off?.();
  fow = new FogOfWar(ctx, width.value, height.value, true);
  ({ off } = fow.onUpdate((data) => {
    console.warn("new fow");
    emit("new-fow", data);
  }));

  fow.update(true);
});

let fow: FogOfWar | null = null;
let off: ReturnType<FogOfWar["onUpdate"]>["off"] | null = null;

const canvasRef = ref<HTMLCanvasElement | null>(null);

useEventListener(canvasRef, "click", (e) => {
  if (!canvasRef.value) {
    return;
  }
  const canvas = canvasRef.value;

  // Get the bounding rectangle of the canvas
  const rect = canvas.getBoundingClientRect();

  // Calculate the scaling factors
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  // Adjust mouse event coordinates
  const canvasX = Math.floor((e.clientX - rect.left) * scaleX);
  const canvasY = Math.floor((e.clientY - rect.top) * scaleY);

  // canvasX and canvasY are the coordinates in the canvas's internal resolution
  console.log("Canvas X: " + canvasX + ", Canvas Y: " + canvasY);

  if (fow) {
    console.log("set run");
    const lines: Array<[{ x: number; y: number }, number]> = [];
    for (let y = canvasY - 100; y < canvasY + 100; y++) {
      lines.push([{ x: canvasX - 100, y }, 200]);
    }

    lines.forEach(([start, length]) => {
      fow?.drawRunInSingleLine(true, start, length);
    });
    console.log(lines[0]);

    fow.update();
  }
});
</script>

<template>
  <div :key="imagePath" ref="containerRef" class="center">
    <img ref="imageRef" :src="imagePath" />
    <canvas :width="width" :height="height" ref="canvasRef" />
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
</style>
