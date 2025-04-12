<script setup lang="ts">
import { useMapStore } from '../../logic/useMapStore';
import { computed, ref, watch } from 'vue';
import { useEventListener, useMouse, useLocalStorage } from '@vueuse/core';
import paper from 'paper';
import BaseView from '../BaseView.vue';
import ImageHistory from './ImageHistory.vue';
import type { FogOfWar } from '@base';
import { scg } from 'ioc-service-container';
import { useDetune } from '../../logic/useDetune';
import Toolbar from '../toolbar/Toolbar.vue';
import ToolbarButton from '../toolbar/ToolbarButton.vue';
import {
    Tool,
    fogOfWarColor,
    resetPaperTool,
    initFogTool,
    initCircleTool,
    initRectangleTool,
    initArrowTool,
    initPolygonTool,
    addPathToFow,
    removePathFromFow,
    getFirstActiveLayerChild,
    getActiveLayer,
} from './fow-tools';

const mapStore = useMapStore();
const addFow = ref(false);
const { x: mouseX, y: mouseY } = useMouse();

// IMPORTANT: change both together
const currentTool = ref<Tool>(Tool.Rectangle);
const activeToolbarButton = ref('fowRectangle');

const paperTool = new paper.Tool();

function setDrawingTool(tool: Tool) {
    currentTool.value = tool;
    initDrawingTools();
}

/**
 * Initialize drawing tools
 */
function initDrawingTools() {
    resetPaperTool(paperTool);
    switch (currentTool.value) {
        case Tool.FogOfWar:
            initFogTool(
                baseViewRef.value,
                paperTool,
                addFow.value,
                addPathToFow,
                removePathFromFow,
                sendFowUpdate,
            );
            break;
        case Tool.Circle:
            initCircleTool(
                baseViewRef.value,
                paperTool,
                addFow.value,
                addPathToFow,
                removePathFromFow,
                sendFowUpdate,
            );
            break;
        case Tool.Rectangle:
            initRectangleTool(
                baseViewRef.value,
                paperTool,
                addFow.value,
                addPathToFow,
                removePathFromFow,
                sendFowUpdate,
            );
            break;
        case Tool.Arrow:
            initArrowTool(baseViewRef.value, paperTool, sendDrawingUpdate);
            break;
        case Tool.Polygon:
            initPolygonTool(
                baseViewRef.value,
                paperTool,
                addFow.value,
                addPathToFow,
                removePathFromFow,
                sendFowUpdate,
            );
            break;
    }
}

// Watch for changes in addFow and reinitialize drawing tools
watch(addFow, (newValue) => {
    console.log('addFow changed to:', newValue, 'reinitializing tools');
    initDrawingTools();
});

/**
 * Sends an update to the fog of war layer
 */
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

/**
 * Sends an update to the drawing layer
 */
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

/**
 * Clears the drawing layer
 */
function clearDrawingLayer() {
    baseViewRef.value?.activateDrawingLayer();
    getActiveLayer().removeChildren();
    sendDrawingUpdate();
    initDrawingTools();
}

/**
 * Clears the fog of war layer
 */
function clearFowLayer() {
    baseViewRef.value?.activateFowLayer();
    getActiveLayer().removeChildren();
    sendFowUpdate();
    initDrawingTools();
}

const conduit = scg('conduit');
useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'x') {
        addFow.value = !addFow.value;
    } else if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
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
    } else if (e.key === 'Q' && e.shiftKey) {
        clearDrawingLayer();
    } else if (e.key === 'W' && e.shiftKey) {
        clearFowLayer();
    } else {
        console.log(e.key, e);
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

/**
 * Converts image coordinates to client coordinates
 * @param num - The number to convert
 * @param type - The type of coordinate to convert ('x', 'y', or 'size')
 * @returns The converted coordinate
 */
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

const toolbarOpen = useLocalStorage('dmViewToolbarOpen', false);

watch(activeToolbarButton, (newValue) => {
    switch (newValue) {
        case 'fowFreeForm':
            setDrawingTool(Tool.FogOfWar);
            break;
        case 'fowCircle':
            setDrawingTool(Tool.Circle);
            break;
        case 'fowRectangle':
            setDrawingTool(Tool.Rectangle);
            break;
        case 'fowArrow':
            setDrawingTool(Tool.Arrow);
            break;
        case 'fowPolygon':
            setDrawingTool(Tool.Polygon);
            break;
        default:
            console.warn(
                `activeToolbarButton "${activeToolbarButton}" doesn't have a corresponding drawing tool!`,
            );
    }
});

function buttonTrigger(button: string) {
    if (button === 'fowState') {
        console.log('Toggling addFow from', addFow.value, 'to', !addFow.value);
        addFow.value = !addFow.value;
    }
}
</script>

<template>
    <div class="content">
        <div
            ref="containerRef"
            class="editor-container"
            @contextmenu.prevent
        >
            <BaseView
                ref="baseViewRef"
                class="base-view"
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

            <!--        <div-->
            <!--            class="indicator"-->
            <!--            :style="{ 'background-color': addFow ? 'black' : 'white' }"-->
            <!--        />-->
        </div>
        <div
            class="remote-control"
            v-if="showRemoteControl"
        >
            <div
                class="single-control"
                v-for="name in names"
                :key="name"
            >
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
                'pointer-events': 'none',
            }"
        >
            {{ rect.name }}
        </div>
        <Toolbar
            v-model:open="toolbarOpen"
            class="toolbar"
            v-model:active-button="activeToolbarButton"
            :is-adding-fow="addFow"
            @trigger="buttonTrigger"
        />
        <ImageHistory />
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

.content {
    display: flex;
    justify-content: center;
    height: 100vh;
    width: 100vw;
}

.editor-container {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    flex: 1;
    min-width: 0; // Important for flex child to respect parent's width
    min-height: 0; // Important for flex child to respect parent's height
}

:deep(.base-view) {
    cursor: crosshair;
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
    // display: none;
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
