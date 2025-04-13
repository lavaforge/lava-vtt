<script setup lang="ts">
import { useMapStore } from '../../logic/useMapStore';
import { ref, watch } from 'vue';
import { useEventListener, useMouse, useLocalStorage } from '@vueuse/core';
import paper from 'paper';
import BaseView from '../BaseView.vue';
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

const emit = defineEmits<{
    'fow-update': [];
    'drawing-update': [];
}>();

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
watch(addFow, () => {
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
    emit('fow-update');
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
        .filter((element) => !!element);
    mapStore.setDrawing(drawingObject, false);
    emit('drawing-update');
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

useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'x') {
        addFow.value = !addFow.value;
    } else if (e.key === 'Q' && e.shiftKey) {
        clearDrawingLayer();
    } else if (e.key === 'W' && e.shiftKey) {
        clearFowLayer();
    }
});

const baseViewRef = ref<{
    activateDrawingLayer: () => void;
    activateFowLayer: () => void;
    imageRef: HTMLImageElement | null;
}>();

const toolbarOpen = useLocalStorage('imageEditorToolbarOpen', false);

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
    }
});

/**
 * Toggles the addFow value
 * @param button - The button that was pressed
 */
function buttonTrigger(button: string) {
    if (button === 'fowState') {
        addFow.value = !addFow.value;
    }
}

defineExpose({
    initDrawingTools,
    clearDrawingLayer,
    clearFowLayer,
    baseViewRef,
});
</script>

<template>
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
        <Toolbar
            v-model:open="toolbarOpen"
            class="toolbar"
            v-model:active-button="activeToolbarButton"
            :is-adding-fow="addFow"
            @trigger="buttonTrigger"
        />
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
