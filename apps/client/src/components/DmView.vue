<script setup lang="ts">
import { useMapStore } from '../logic/useMapStore';
import { computed, onBeforeUnmount, ref } from 'vue';
import { useEventListener, useMouse } from '@vueuse/core';
import paper from 'paper';
import BaseView from './BaseView.vue';
import { type FogOfWar } from '../../../../libs/base/src/lib/fogOfWar';
import { scg } from 'ioc-service-container';
import { useDetune } from '../logic/useDetune';
import Toolbar from './toolbar/Toolbar.vue';
import ToolbarButton from './toolbar/ToolbarButton.vue';

enum Tool {
    FogOfWar,
    Circle,
    Rectangle,
    Arrow,
}

const mapStore = useMapStore();
const addFow = ref(false);
const fogOfWarColor = '#000000A0';
const { x: mouseX, y: mouseY } = useMouse();
type PaperMouseEvent = { point: paper.Segment | paper.PointLike | number[] };
const currentTool = ref<Tool>(Tool.Circle);
const paperTool = new paper.Tool();

function changeDrawingTool() {
    // TODO: later let this be controlled by UI

    switch (currentTool.value) {
        case Tool.FogOfWar:
            currentTool.value = Tool.Circle;
            break;
        case Tool.Circle:
            currentTool.value = Tool.Rectangle;
            break;
        case Tool.Rectangle:
            currentTool.value = Tool.Arrow;
            break;
        case Tool.Arrow:
            currentTool.value = Tool.FogOfWar;
    }
    initDrawingTools();
}

function setDrawingTool(tool: Tool) {
    currentTool.value = tool;
    initDrawingTools();
}

function initDrawingTools() {
    switch (currentTool.value) {
        case Tool.FogOfWar:
            initFogTool();
            break;
        case Tool.Circle:
            initCircleTool();
            break;
        case Tool.Rectangle:
            initRectangleTool();
            break;
        case Tool.Arrow:
            initArrowTool();
            break;
    }
}

function gridLines(
    start: paper.Point,
    end: paper.Point,
): {
    h: number[];
    v: number[];
    length: number;
} {
    const hDiff = end.y - start.y;
    const vDiff = end.x - start.x;

    const diff = Math.max(Math.abs(hDiff), Math.abs(vDiff)) / 2;

    const count = 13;
    const before = Math.floor((count - 1) / 2);

    const diffStart = before * -diff;
    const diffs = Array.from({ length: count }, (_, i) => diffStart + i * diff);

    return {
        h: diffs.map((diff) => start.y + diff),
        v: diffs.map((diff) => start.x + diff),
        length: diff * (count - 1),
    };
}

function initGridTool() {
    baseViewRef.value?.activateDrawingLayer();
    const hLines: paper.Path[] = [];
    const vLines: paper.Path[] = [];

    let startPoint: paper.Point;

    function makeLines(currentPoint: paper.Point) {
        const { h, v, length } = gridLines(startPoint, currentPoint);

        h.forEach((y, idx) => {
            hLines[idx] = new paper.Path.Line(
                new paper.Point(startPoint.x - length / 2, y),
                new paper.Point(startPoint.x + length / 2, y),
            );
            hLines[idx].strokeColor = new paper.Color('black');
        });

        v.forEach((x, idx) => {
            vLines[idx] = new paper.Path.Line(
                new paper.Point(x, startPoint.y - length / 2),
                new paper.Point(x, startPoint.y + length / 2),
            );
            vLines[idx].strokeColor = new paper.Color('black');
        });
    }

    function removeLines() {
        hLines.forEach((line) => line.remove());
        hLines.length = 0;
        vLines.forEach((line) => line.remove());
        vLines.length = 0;
    }

    paper.tool.onMouseDown = (event: paper.ToolEvent) => {
        startPoint = event.point;

        makeLines(event.point);
    };

    paper.tool.onMouseDrag = (event: paper.ToolEvent) => {
        removeLines();
        makeLines(event.point);
    };

    paper.tool.onMouseUp = (event: paper.ToolEvent) => {
        hLines.forEach((line) => line.remove());
        vLines.forEach((line) => line.remove());
    };
}

// TODO: add function to clear drawing layer + ui

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

function initRectangleTool() {
    baseViewRef.value?.activateFowLayer();
    let rectangle: paper.Path.Rectangle;
    let startPoint: paper.Point;

    paper.tool.onMouseDown = (event: paper.ToolEvent) => {
        startPoint = event.point;
        rectangle = new paper.Path.Rectangle(startPoint, new paper.Size(1, 1));
        rectangle.strokeColor = new paper.Color('red');
    };

    paper.tool.onMouseDrag = (event: paper.ToolEvent) => {
        let endPoint = event.point;
        rectangle.remove();
        rectangle = new paper.Path.Rectangle({
            from: startPoint,
            to: endPoint,
        });
        rectangle.strokeColor = new paper.Color('red');
    };

    paperTool.onMouseUp = (event: paper.ToolEvent) => {
        rectangle.closed = true;
        addFow.value ? addPathToFow(rectangle) : removePathFromFow(rectangle);
        sendFowUpdate();
    };
    paperTool.activate();
}

function initArrowTool() {
    baseViewRef.value?.activateDrawingLayer();
    let arrowShaft: paper.Path;
    let arrowHeadLeft: paper.Path;
    let arrowHeadRight: paper.Path;
    let arrowTip: paper.Path;
    let startPoint: paper.Point;
    let arrowThickness: number = 1;

    paper.tool.onMouseDown = (event: paper.ToolEvent) => {
        startPoint = event.point;
        arrowShaft = new paper.Path({
            strokeColor: new paper.Color('red'),
            strokeWidth: 1,
            fillColor: new paper.Color('red'),
        });

        arrowHeadLeft = new paper.Path({
            strokeColor: new paper.Color('red'),
            strokeWidth: 1,
            fillColor: new paper.Color('red'),
        });

        arrowHeadRight = new paper.Path({
            strokeColor: new paper.Color('red'),
            strokeWidth: 1,
            fillColor: new paper.Color('red'),
        });

        arrowTip = new paper.Path({
            strokeColor: new paper.Color('red'),
            strokeWidth: 1,
            fillColor: new paper.Color('red'),
        });
    };

    paper.tool.onMouseDrag = (event: paper.ToolEvent) => {
        let endPoint = event.point;
        let arrowLength = startPoint.getDistance(endPoint);
        let thickness = (arrowThickness * arrowLength) / 8;

        let vector = new paper.Point(
            endPoint.x - startPoint.x,
            endPoint.y - startPoint.y,
        );
        let normal = vector
            .normalize()
            .rotate(90, new paper.Point(0, 0))
            .multiply(thickness / 2);

        arrowShaft.removeSegments();
        arrowShaft.addSegments([
            new paper.Segment(startPoint.add(normal)),
            new paper.Segment(endPoint.add(normal)),
            new paper.Segment(endPoint.subtract(normal)),
            new paper.Segment(startPoint.subtract(normal)),
        ]);
        arrowShaft.closed = true;

        let arrowVector = vector.normalize(thickness * 2);
        let arrowHeadLeftVector = arrowVector
            .rotate(145, new paper.Point(0, 0))
            .add(endPoint);
        let arrowHeadRightVector = arrowVector
            .rotate(-145, new paper.Point(0, 0))
            .add(endPoint);

        arrowHeadLeft.removeSegments();
        arrowHeadLeft.addSegments([
            new paper.Segment(endPoint.add(normal)),
            new paper.Segment(arrowHeadLeftVector.add(normal)),
            new paper.Segment(arrowHeadLeftVector.subtract(normal)),
            new paper.Segment(endPoint.subtract(normal)),
        ]);
        arrowHeadLeft.closed = true;

        arrowHeadRight.removeSegments();
        arrowHeadRight.addSegments([
            new paper.Segment(endPoint.add(normal)),
            new paper.Segment(arrowHeadRightVector.add(normal)),
            new paper.Segment(arrowHeadRightVector.subtract(normal)),
            new paper.Segment(endPoint.subtract(normal)),
        ]);
        arrowHeadRight.closed = true;

        let tipVector = vector.normalize(thickness * 0.71); // magic numbers; don't touch
        let arrowTipBaseLeft = tipVector
            .rotate(110, new paper.Point(0, 0))
            .add(endPoint);
        let arrowTipBaseRight = tipVector
            .rotate(-110, new paper.Point(0, 0))
            .add(endPoint);
        let arrowTipPoint = endPoint.add(tipVector);

        arrowTip.removeSegments();
        arrowTip.addSegments([
            new paper.Segment(arrowTipBaseLeft),
            new paper.Segment(arrowTipPoint),
            new paper.Segment(arrowTipBaseRight),
        ]);
        arrowTip.closed = true;
    };

    paper.tool.onMouseUp = (event: paper.ToolEvent) => {
        sendDrawingUpdate();
    };

    paper.tool.activate();
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

function sendDrawingUpdate() {
    baseViewRef.value?.activateDrawingLayer();
    const drawings = getActiveLayer().children;
    const drawingObject = drawings
        .map((singleDrawing) => {
            if (
                singleDrawing instanceof paper.CompoundPath ||
                singleDrawing instanceof paper.Path
            ) {
                if (singleDrawing) {
                    return {
                        svgPath: singleDrawing.pathData,
                        canvas: {
                            width: paper.view.size.width,
                            height: paper.view.size.height,
                            posX: singleDrawing.position.x,
                            posY: singleDrawing.position.y,
                        },
                    };
                }
            }
        })
        .filter((element): element is FogOfWar => !!element); // TODO: add drawing type with color value
    console.log(drawingObject);
    mapStore.setDrawing(drawingObject, false);
}

function getFirstActiveLayerChild() {
    if (getActiveLayer().children.length == 1)
        return getActiveLayer().children.at(0);
}

function getActiveLayer() {
    return paper.project.activeLayer;
}

const conduit = scg('conduit');
useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'x') {
        addFow.value = !addFow.value;
    } else if (e.key === 'c') {
        changeDrawingTool();
    } else if (e.key === 'r') {
        conduit.broadcast('iWantToKnowAllPlayerViews', { name: conduit.name });
        showRemoteControl.value = true;
    } else if (e.key === 'Escape') {
        if (showRemoteControl.value) {
            showRemoteControl.value = false;
            names.value = [];
            selectedPlayerView.value = null;
        }
    } else if (e.key.startsWith('Arrow') && selectedPlayerView.value) {
        e.preventDefault();
        const direction = e.key.slice(5).toLowerCase();
        if (e.shiftKey) {
            control(selectedPlayerView.value, {
                type: 'zoom',
                direction: direction === 'up' ? 'in' : 'out',
            });
        } else {
            control(selectedPlayerView.value, {
                type: 'pan',
                direction: direction as any,
            });
        }
    } else {
        console.log(e.key);
    }
});

const names = ref<string[]>([]);
const selectedPlayerView = ref<string | null>(null);
useDetune(
    conduit.attune('iAmAPlayerView', (lore) => {
        names.value.push(lore.name);
    }),
);

const showRemoteControl = ref(false);

const baseViewRef = ref<{
    activateDrawingLayer: () => void;
    activateFowLayer: () => void;
    imageRef: HTMLImageElement | null;
}>();

function control(
    name: string,
    payload:
        | { type: 'zoom'; direction: 'in' | 'out' }
        | { type: 'pan'; direction: 'up' | 'down' | 'left' | 'right' }
        | { type: 'reset' },
) {
    conduit.invoke('controlPlayerView', name as any, payload);
}

const displayRects = ref<
    Record<string, { x: number; y: number; width: number; height: number }>
>({});

const displayRectsViewModel = computed(() => {
    return Object.entries(displayRects.value).map(
        ([name, { x, y, width, height }]) => ({
            name,
            x,
            y,
            width,
            height,
        }),
    );
});

useDetune(
    conduit.attune('iWasControlled', (lore) => {
        console.log(lore.rect);
        displayRects.value[lore.name] = lore.rect;
    }),
);

function fromImgCoord(num: number, type: 'x' | 'y' | 'size') {
    const img = baseViewRef.value?.imageRef;
    if (!img) return 0;

    const factor = img.clientWidth / img.naturalWidth;

    const add =
        type === 'x'
            ? img.getBoundingClientRect().left
            : type === 'y'
              ? img.getBoundingClientRect().top
              : 0;

    return num * factor + add;
}

const toolbarOpen = ref(false);

const activeButton = computed(() =>
    currentTool.value === Tool.FogOfWar ? '1' : '2',
);
function handleButtonPress(text: string) {
    if (text === '1') {
        setDrawingTool(Tool.FogOfWar);
    } else if (text === '2') {
        setDrawingTool(Tool.Circle);
    }
}
</script>

<template>
    <div
        ref="containerRef"
        class="container"
    >
        <BaseView
            ref="baseViewRef"
            @image-loaded="initDrawingTools"
            :fog-of-war-color="fogOfWarColor"
        />
        <div
            class="vertical-line"
            :style="{ left: mouseX + 'px' }"
        ></div>
        <div
            class="horizontal-line"
            :style="{ top: mouseY + 'px' }"
        ></div>
        <Transition name="fade">
            <ToolbarButton
                v-if="!toolbarOpen"
                class="toolbar-open-button"
                @press="toolbarOpen = !toolbarOpen"
                alt-text="="
                tooltip="open toolbar"
                tooltip-pos="bottom"
            />
        </Transition>
        <Toolbar
            v-model:open="toolbarOpen"
            class="toolbar"
            @button-press="handleButtonPress"
            :active-button="activeButton"
        />
        <!--        <div-->
        <!--            class="indicator"-->
        <!--            :style="{ 'background-color': addFow ? 'black' : 'white' }"-->
        <!--        />-->
    </div>
    <div class="remote-control" v-if="showRemoteControl">
        <div class="single-control" v-for="name in names" :key="name">
            <input
                type="radio"
                :id="name"
                :value="name"
                v-model="selectedPlayerView"
            />
            <label :for="name">{{ name }}</label>
            <span @click="control(name, { type: 'reset' })">reset</span>
        </div>
    </div>
    <div
        v-for="rect in displayRectsViewModel"
        :style="{
            position: 'absolute',
            left: fromImgCoord(rect.x, 'x') + 'px',
            top: fromImgCoord(rect.y, 'y') + 'px',
            width: fromImgCoord(rect.width, 'size') + 'px',
            height: fromImgCoord(rect.height, 'size') + 'px',
            border: '2px solid black',
        }"
    >
        {{ rect.name }}
    </div>
</template>

<style scoped lang="scss">
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.toolbar {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
}

.toolbar-open-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
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
    display: none;
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

.remote-control {
    position: fixed;
    top: 50vh;
    left: 50vw;
    transform: translate(-50%, -50%);
    background-color: white;
    color: black;
    padding: 2rem;
}

.single-control {
    display: flex;
    gap: 1rem;
}

.single-control span {
    cursor: pointer;
}
</style>
