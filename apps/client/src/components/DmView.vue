<script setup lang="ts">
import { useMapStore } from '../logic/useMapStore';
import { ref } from 'vue';
import { useEventListener, useMouse } from '@vueuse/core';
import paper from 'paper';
import BaseView from './BaseView.vue';
import { number } from 'zod';

enum Tool {
    FogOfWar,
    Circle,
    Arrow,
}

const mapStore = useMapStore();
const addFow = ref(false);
const fogOfWarColor = '#000000A0';
const arrowThickness = 10;
const { x: mouseX, y: mouseY } = useMouse();
type PaperMouseEvent = { point: paper.Segment | paper.PointLike | number[] };
let currentTool = Tool.Circle;
const paperTool = new paper.Tool();

function changeDrawingTool() {
    // TODO: later let this be controlled by UI

    switch (currentTool) {
        case Tool.FogOfWar:
            currentTool = Tool.Circle;
            break;
        case Tool.Circle:
            currentTool = Tool.Arrow;
            break;
        case Tool.Arrow:
            currentTool = Tool.FogOfWar;
    }
    initDrawingTools();
}

function initDrawingTools() {
    switch (currentTool) {
        case Tool.FogOfWar:
            initCircleTool();
            break;
        case Tool.Circle:
            initArrowTool();
            break;
        case Tool.Arrow:
            initFogTool();
    }
}

function initArrowTool() {
    baseViewRef.value?.activateDrawingLayer();
    let arrowShaft: paper.Path;
    let arrowHeadLeft: paper.Path;
    let arrowHeadRight: paper.Path;
    let startPoint: paper.Point;

    paper.tool.onMouseDown = (event: paper.ToolEvent) => {
        startPoint = event.point;
        arrowShaft = new paper.Path({
            segments: [startPoint, startPoint],
            strokeColor: new paper.Color('red'),
            strokeWidth: arrowThickness,
            strokeCap: 'round',
        });

        arrowHeadLeft = new paper.Path({
            segments: [startPoint, startPoint],
            strokeColor: new paper.Color('red'),
            srokeWidth: arrowThickness,
            strokeCap: 'round',
        });

        arrowHeadRight = new paper.Path({
            segments: [startPoint, startPoint],
            strokeColor: new paper.Color('red'),
            srokeWidth: arrowThickness,
            strokeCap: 'round',
        });
    };

    paper.tool.onMouseDrag = (event: paper.ToolEvent) => {
        let endPoint = event.point;
        arrowShaft.lastSegment.point = endPoint;

        let vector = new paper.Point(
            endPoint.x - startPoint.x,
            endPoint.y - startPoint.y,
        );
        let arrowVector = vector.normalize(
            startPoint.getDistance(endPoint) / 3,
        );

        let arrowHeadLeftVector = arrowVector
            .rotate(145, new paper.Point(0, 0))
            .add(endPoint);
        let arrowHeadRightVector = arrowVector
            .rotate(-145, new paper.Point(0, 0))
            .add(endPoint);

        arrowHeadLeft.segments = [
            new paper.Segment(endPoint),
            new paper.Segment(arrowHeadLeftVector),
        ];
        arrowHeadLeft.strokeWidth = arrowThickness;
        arrowHeadRight.segments = [
            new paper.Segment(endPoint),
            new paper.Segment(arrowHeadRightVector),
        ];
        arrowHeadRight.strokeWidth = arrowThickness;
    };
    paperTool.activate();
}

function initCircleTool() {
    baseViewRef.value?.activateFowLayer();
    let circle: paper.Path.Circle;
    let startPoint: paper.Point;

    paper.tool.onMouseDown = (event: paper.ToolEvent) => {
        startPoint = event.point;
        circle = new paper.Path.Circle(event.point, 10);
        circle.strokeColor = new paper.Color('red');
    };

    paper.tool.onMouseDrag = (event: paper.ToolEvent) => {
        let radius = startPoint.getDistance(event.point);
        circle.remove();
        circle = new paper.Path.Circle({
            center: startPoint,
            radius: radius,
            strokeColor: 'red',
        });
    };

    paperTool.onMouseUp = (event: paper.ToolEvent) => {
        circle.closed = true;
        addFow.value ? addPathToFow(circle) : removePathFromFow(circle);
        sendFowUpdate();
    };
    paperTool.activate();
}

function initFogTool() {
    baseViewRef.value?.activateFowLayer();
    let path: paper.Path;
    paperTool.onMouseDown = (event: PaperMouseEvent) => {
        path = new paper.Path();
        path.add(event.point);
    };

    paperTool.onMouseDrag = (event: PaperMouseEvent) => {
        if (path) {
            addFow.value
                ? (path.strokeColor = new paper.Color('black'))
                : (path.strokeColor = new paper.Color('red'));
            path.add(event.point);
        }
    };

    paperTool.onMouseUp = () => {
        if (!path) return;

        path.closed = true;
        path.simplify();

        addFow.value ? addPathToFow(path) : removePathFromFow(path);

        sendFowUpdate();
    };
    paperTool.activate();
}

function addPathToFow(path: paper.Path) {
    baseViewRef.value?.activateFowLayer();
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
    baseViewRef.value?.activateFowLayer();
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

function sendFowUpdate() {
    baseViewRef.value?.activateFowLayer();
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
    } else if (e.key === 'c') {
        changeDrawingTool();
    }
});

const baseViewRef = ref<{
    activateDrawingLayer: () => void;
    activateFowLayer: () => void;
}>();
</script>

<template>
    <div ref="containerRef" class="container">
        <BaseView
            ref="baseViewRef"
            @image-loaded="initDrawingTools"
            :fog-of-war-color="fogOfWarColor"
        />
        <div
            class="indicator"
            :style="{ 'background-color': addFow ? 'black' : 'white' }"
        />
        <div class="vertical-line" :style="{ left: mouseX + 'px' }"></div>
        <div class="horizontal-line" :style="{ top: mouseY + 'px' }"></div>
    </div>
</template>

<style scoped>
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
</style>
