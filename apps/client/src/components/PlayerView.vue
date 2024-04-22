<script lang="ts" setup>
import { ref, watch, nextTick, type Ref } from 'vue';
import panzoom from 'panzoom';
import { useEventListener, useWakeLock } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMapStore } from '../logic/useMapStore';
import paper from 'paper';
import { updateFOW } from '../logic/fowScaling';

const mapStore = useMapStore();
const { imagePath, fowData } = storeToRefs(mapStore);

const imageRef = ref<HTMLImageElement | null>(null);
let instance: ReturnType<typeof panzoom> | null = null;
const canvasRef = ref<HTMLCanvasElement | null>(null);
const width = ref(0);
const height = ref(0);
const containerRef = ref<HTMLDivElement | null>(null);

function initPaper() {
    if (canvasRef.value) {
        paper.setup(canvasRef.value);
        loadExistingFow();
    }
}

function loadExistingFow() {
    let data = mapStore.fowData;
    if (data == undefined) return;
    updateFOW(data);
}

const { request, release } = useWakeLock();
async function toggleFullscreen() {
    if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
        await request('screen');
    } else {
        await document.exitFullscreen?.();
        await release();
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
    void initCanvas(imageRef);
});

async function initCanvas(imageRef: Ref<HTMLImageElement | null>) {
    if (!imageRef.value || !canvasRef.value) {
        return;
    }
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

let resizeTimer: ReturnType<typeof setTimeout> | undefined = undefined;
useEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
        initCanvas(imageRef);
    }, 100);
});

watch(fowData, (newFowData) => {
    if (!newFowData || !canvasRef.value || !imageRef.value) {
        return;
    }

    updateFOW(newFowData);
});
</script>

<template>
    <div :key="imagePath" ref="containerRef" class="center">
        <template v-if="imagePath">
            <img ref="imageRef" :src="imagePath" alt="" />
            <canvas
                ref="canvasRef"
                :height="height"
                :width="width"
                hidpi="off"
            />
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
}

.center {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}
</style>
