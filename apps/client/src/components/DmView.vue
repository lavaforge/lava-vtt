<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMapStore } from '../logic/useMapStore';
import { nextTick, ref, type Ref } from 'vue';
import { useEventListener, useMouse } from '@vueuse/core';
import paper from 'paper';
import { updateFOW } from '../logic/fowScaling';

const mapStore = useMapStore();
const { imagePath, fowData } = storeToRefs(mapStore);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const width = ref(0);
const height = ref(0);
const addFow = ref(false);
const { x: mouseX, y: mouseY } = useMouse();

type PaperMouseEvent = { point: paper.Segment | paper.PointLike | number[] };

function initPaper() {
    if (!canvasRef.value) {
        return;
    }

    paper.setup(canvasRef.value);
    initDrawingTools();
    loadExistingFow();
}

function loadExistingFow() {
    let data = mapStore.fowData;
    if (data == undefined) return;
    updateFOW(data);
}

function initDrawingTools() {
    // TODO: also set up drawing tools for freehand drawing
    const tool = new paper.Tool();

    let path: paper.Path;
    tool.onMouseDown = (event: PaperMouseEvent) => {
        path = new paper.Path();
        path.add(event.point);
    };

    tool.onMouseDrag = (event: PaperMouseEvent) => {
        if (path) {
            addFow.value
                ? (path.strokeColor = new paper.Color('black'))
                : (path.strokeColor = new paper.Color('red'));
            path.add(event.point);
        }
    };

    tool.onMouseUp = () => {
        if (!path) return;

        path.closed = true;
        path.simplify();

        addFow.value ? addPathToFow(path) : removePathFromFow(path);

        sendPathUpdate();
    };
    tool.activate();
}

function addPathToFow(path: paper.Path) {
    let combinedPath: paper.Path | paper.PathItem = path;
    paper.project.activeLayer.children.forEach((child) => {
        if (
            child != path &&
            (child instanceof paper.Path ||
                child instanceof paper.CompoundPath ||
                child instanceof paper.PathItem)
        ) {
            combinedPath = combinedPath.unite(child);
        }
    });
    combinedPath.fillColor = new paper.Color('black');
    combinedPath.strokeColor = new paper.Color('black');
    paper.project.activeLayer.removeChildren();
    paper.project.activeLayer.addChild(combinedPath);
}

function removePathFromFow(path: paper.Path) {
    let substractedPath:
        | paper.CompoundPath
        | paper.PathItem
        | paper.Path
        | paper.Item = path;
    paper.project.activeLayer.children.forEach((child) => {
        if (
            (child instanceof paper.CompoundPath ||
                child instanceof paper.Path ||
                child instanceof paper.PathItem) &&
            child != path
        ) {
            substractedPath = child.subtract(path);
        }
    });
    paper.project.activeLayer.removeChildren();
    substractedPath.fillColor = new paper.Color('black');
    substractedPath.strokeColor = new paper.Color('black');
    paper.project.activeLayer.addChild(substractedPath);
}

function sendPathUpdate() {
    // TODO: add listener for fow update -> send fow to api + client
    let firstChild: paper.Item | undefined = getFirstActiveLayerChild();
    if (
        firstChild instanceof paper.CompoundPath ||
        firstChild instanceof paper.Path
    ) {
        let pathData = addScaleAndPositionToPathData(
            firstChild.pathData,
            paper.view.size.width,
            paper.view.size.height,
            firstChild.position.x,
            firstChild.position.y,
        );
        mapStore.setFow(pathData);
    }
}

function addScaleAndPositionToPathData(
    pathData: string,
    width: number,
    height: number,
    posX: number,
    posY: number,
) {
    return {
        canvas: {
            width,
            height,
            posX,
            posY,
        },
        svgPath: pathData,
    };
}

function getFirstActiveLayerChild() {
    if (getActiveLayer().children.length == 1)
        return getActiveLayer().children.at(0);
}

function getActiveLayer() {
    return paper.project.activeLayer;
}

useEventListener(imageRef, 'load', async () => {
    void initCanvas(imageRef);
});

async function initCanvas(imageRef: Ref<HTMLImageElement | null>) {
    if (!imageRef.value || !canvasRef.value) {
        throw new Error('no image or canvas');
    }

    width.value = imageRef.value.width;
    height.value = imageRef.value.height;

    const ctx = canvasRef.value.getContext('2d');
    if (!ctx) {
        throw new Error('no ctx');
    }

    await nextTick();
    initPaper();

    // TODO: load fow from api
    // TODO: store fow in database
}

useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'x') {
        addFow.value = !addFow.value;
    }
});

let resizeTimer: ReturnType<typeof setTimeout> | undefined;
useEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
        initCanvas(imageRef);
    }, 100);
});
</script>

<template>
    <div :key="imagePath" ref="containerRef" class="center">
        <template v-if="imagePath">
            <img ref="imageRef" :src="imagePath" alt="" />
            <canvas
                ref="canvasRef"
                :width="width"
                :height="height"
                hidpi="off"
            />
            <div ref="rectangleRef" class="rectangle" />
            <div
                class="indicator"
                :style="{ 'background-color': addFow ? 'black' : 'white' }"
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
