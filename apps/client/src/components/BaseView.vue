<script setup lang="ts">
import { useMapStore } from '../logic/useMapStore';
import { storeToRefs } from 'pinia';
import { nextTick, type Ref, ref, watch } from 'vue';
import paper from 'paper';
import { useEventListener } from '@vueuse/core';
import type { DrawingData, FogOfWar } from '@base';

let fowLayer: paper.Layer;
let drawingLayer: paper.Layer;

const props = withDefaults(defineProps<{ fogOfWarColor: string }>(), {
    fogOfWarColor: 'black',
    arrowColor: 'red',
});

const emit = defineEmits<{
    imageLoaded: [];
}>();

const mapStore = useMapStore();
const { imagePath, fowData, drawingData } = storeToRefs(mapStore);

const imageRef = ref<HTMLImageElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const width = ref(0);
const height = ref(0);

let resizeTimer: ReturnType<typeof setTimeout> | undefined = undefined;

useEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
        initCanvas(imageRef);
    }, 50);
});

useEventListener(imageRef, 'load', async () => {
    await initCanvas(imageRef);
    emit('imageLoaded');
});

async function initCanvas(imageRef: Ref<HTMLImageElement | null>) {
    if (!imageRef.value || !canvasRef.value) {
        return;
    }

    height.value = imageRef.value.height;
    width.value = imageRef.value.width;

    await nextTick();

    paper.setup(canvasRef.value);
    initLayers();

    if (mapStore.fowData != undefined) {
        updateFOW(mapStore.fowData);
    }

    if (mapStore.drawingData != undefined) {
        updateDrawing(mapStore.drawingData);
    }
}

function initLayers() {
    drawingLayer = paper.project.activeLayer;
    fowLayer = new paper.Layer();
}

function activateFowLayer() {
    fowLayer.activate();
}

function activateDrawingLayer() {
    drawingLayer.activate();
}

watch(fowData, (newFowData) => {
    if (newFowData && canvasRef.value && imageRef.value) {
        updateFOW(newFowData);
    }
});

watch(drawingData, (newDrawingData) => {
    if (newDrawingData && canvasRef.value && imageRef.value) {
        updateDrawing(newDrawingData);
    }
});

function updateFOW(data: FogOfWar) {
    activateFowLayer();
    let path: paper.CompoundPath = new paper.CompoundPath(data.svgPath);
    path.fillColor = new paper.Color(props.fogOfWarColor);

    scaleAndPositionPath(path, data.canvas);

    paper.project.activeLayer.removeChildren();
    paper.project.activeLayer.addChild(path);
}

function updateDrawing(data: DrawingData) {
    activateDrawingLayer();
    paper.project.activeLayer.removeChildren();

    data.forEach((element) => {
        let path: paper.CompoundPath = new paper.CompoundPath(element.svgPath);
        path.fillColor = new paper.Color(props.arrowColor);
        path.strokeColor = new paper.Color('red'); // TODO: also store color values for all items on drawing layer
        path.fillColor = new paper.Color('red');
        scaleAndPositionPath(path, element.canvas);
        paper.project.activeLayer.addChild(path);
    });
}

function scaleAndPositionPath(
    path: paper.CompoundPath,
    canvasGeometry: FogOfWar['canvas'],
) {
    console.log(path.pathData);
    console.log(canvasGeometry);
    const newCanvasWidth = paper.view.size.width;
    const newCanvasHeight = paper.view.size.height;

    if (newCanvasWidth == undefined || newCanvasHeight == undefined) return;

    const scaleX = newCanvasWidth / canvasGeometry.width;
    const scaleY = newCanvasHeight / canvasGeometry.height;
    const uniformScale = Math.min(scaleX, scaleY);

    path.position = new paper.Point(
        canvasGeometry.posX * scaleX,
        canvasGeometry.posY * scaleY,
    );
    path.scale(uniformScale);
}

defineExpose({
    activateDrawingLayer,
    activateFowLayer,
});
</script>

<template>
    <template v-if="imagePath">
        <img ref="imageRef" :src="imagePath" alt="" />
        <canvas
            ref="canvasRef"
            :height="height"
            :width="width"
            data-paper-hidpi="off"
        />
    </template>
    <div v-else>no image loaded</div>
</template>

<style scoped>
img {
    max-width: 100vw;
    max-height: 100vh;
}

canvas {
    position: absolute;
}
</style>
