<script lang="ts" setup>
import { ref, watch, nextTick, type Ref } from 'vue';
import panzoom from 'panzoom';
import { useEventListener, useWakeLock } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMapStore } from '../logic/useMapStore';
import paper from 'paper';
import type { LoreSchema } from 'conduit';

const { imagePath, fowData } = storeToRefs(useMapStore());

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
        throw new Error('no image or canvas');
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

useEventListener('resize', () => {
    initCanvas(imageRef);
});

watch(fowData, (newFowData) => {
    if (newFowData) {
        updateFOW(newFowData);
    }
});

function updateFOW(data: LoreSchema<'paperFow'>) {
    let scalePositionQuadruple = getScaleAndPositionFromPathData(data);
    let path: paper.CompoundPath = new paper.CompoundPath(data.svgPath);
    path.fillColor = new paper.Color('black');
    scaleAndPositionPath(path, scalePositionQuadruple);

    getActiveLayer().removeChildren();
    getActiveLayer().addChild(path);
}

function scaleAndPositionPath(
    path: paper.CompoundPath,
    scalePositionQuadruple: number[] | null,
) {
    if (
        scalePositionQuadruple == null ||
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
    path.position = new paper.Point(
        scalePositionQuadruple[2] * scaleX,
        scalePositionQuadruple[3] * scaleY,
    );
    path.scale(uniformScale);
}

function getScaleAndPositionFromPathData(pathData: LoreSchema<'paperFow'>) {
    const { width, height, posX, posY } = pathData.canvas;
    return [width, height, posX, posY];
}

function getActiveLayer() {
    return paper.project.activeLayer;
}
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
