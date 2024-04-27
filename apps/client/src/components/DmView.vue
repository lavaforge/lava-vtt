<script setup lang="ts">
import { useMapStore } from '../logic/useMapStore';
import { ref } from 'vue';
import { useEventListener, useMouse } from '@vueuse/core';
import paper from 'paper';
import BaseView from './BaseView.vue';

const mapStore = useMapStore();

const addFow = ref(false);
const fogOfWarColor = '#000000A0';

const someButtonColor = '#0000ff';

var counter = 0;
var counterMax = 10;

function generateWholeButtonBar(amount: any) {
    for (let i = 0; i <= amount; i++) {}
}
function generateButtonColor() {
    const red = counter / counterMax;
    const blue = 1 - counter / counterMax;

    //console.log(counter);
    counter++;
    if (counter > counterMax) counter = 0;

    return 'rgb(' + 255 * red + ',0,' + 255 * blue + ')';
    //return "rgb(0,0,"+(255*0.5)+")";
}

const btnColor = ref(generateButtonColor());

const { x: mouseX, y: mouseY } = useMouse();

type PaperMouseEvent = { point: paper.Segment | paper.PointLike | number[] };

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
    combinedPath.fillColor = new paper.Color(fogOfWarColor);
    combinedPath.strokeColor = new paper.Color(fogOfWarColor);
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
    substractedPath.fillColor = new paper.Color(fogOfWarColor);
    substractedPath.strokeColor = new paper.Color(fogOfWarColor);
    paper.project.activeLayer.addChild(substractedPath);
}

function sendPathUpdate() {
    const firstChild = getFirstActiveLayerChild();
    if (
        firstChild instanceof paper.CompoundPath ||
        firstChild instanceof paper.Path
    ) {
        mapStore.setFow(
            {
                svgPath: firstChild.pathData,
                canvas: {
                    width: paper.view.size.width,
                    height: paper.view.size.height,
                    posX: firstChild.position.x,
                    posY: firstChild.position.y,
                },
            },
            false,
        );
    }
}

function getFirstActiveLayerChild() {
    if (getActiveLayer().children.length == 1)
        return getActiveLayer().children.at(0);
}

function getActiveLayer() {
    return paper.project.activeLayer;
}

useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'x') {
        addFow.value = !addFow.value;
    }
});
</script>

<template>
    <div ref="containerRef" class="container">
        <BaseView
            @image-loaded="initDrawingTools"
            :fog-of-war-color="fogOfWarColor"
        />
        <div
            class="indicator"
            :style="{ 'background-color': addFow ? 'black' : 'white' }"
        />
        <a class="button-bar">
            <button
                class="cool-button"
                :style="{ 'background-color': generateButtonColor() }"
            >
                A
            </button>
            <button
                class="cool-button"
                :style="{ 'background-color': generateButtonColor() }"
            >
                B
            </button>
            <button
                class="cool-button"
                :style="{ 'background-color': generateButtonColor() }"
            >
                C
            </button>
            <button
                class="cool-button"
                :style="{ 'background-color': generateButtonColor() }"
            >
                D
            </button>
            <button
                class="cool-button"
                :style="{ 'background-color': generateButtonColor() }"
            >
                E
            </button>
            <button
                class="cool-button"
                :style="{ 'background-color': generateButtonColor() }"
            >
                F
            </button>
            <button
                class="cool-button"
                :style="{ 'background-color': generateButtonColor() }"
            >
                G
            </button>
            <button
                class="cool-button"
                :style="{ 'background-color': generateButtonColor() }"
            >
                H
            </button>
            <button
                class="cool-button"
                :style="{ 'background-color': generateButtonColor() }"
            >
                I
            </button>
            <button
                class="cool-button"
                :style="{ 'background-color': generateButtonColor() }"
            >
                J
            </button>
        </a>
        <div class="vertical-line" :style="{ left: mouseX + 'px' }"></div>
        <div class="horizontal-line" :style="{ top: mouseY + 'px' }"></div>
    </div>
</template>

<style scoped lang="scss">
.container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
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

.button-bar {
    position: fixed;
    top: 0;
}

.cool-button {
    border: none;
    position: relative;
    //background-color: rgb(255,255,0);
    //background-color: v-bind(btnColor);
    width: 100px;
    height: 100px;
}
</style>
