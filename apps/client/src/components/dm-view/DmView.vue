<script setup lang="ts">
import { computed, ref } from 'vue';
import { useEventListener } from '@vueuse/core';
import ImageHistory from './ImageHistory.vue';
import Dropzone from './Dropzone.vue';
import { scg } from 'ioc-service-container';
import { useDetune } from '../../logic/useDetune';
import ImageEditor from './ImageEditor.vue';

const conduit = scg('conduit');

const names = ref<string[]>([]);
const selectedPlayerView = ref<string | null>(null);
useDetune(
    conduit.attune('iAmAPlayerView', (lore) => {
        names.value.push(lore.name);
    }),
);

const showRemoteControl = ref(false);

useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
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
        imageEditorRef.value?.clearDrawingLayer();
    } else if (e.key === 'W' && e.shiftKey) {
        imageEditorRef.value?.clearFowLayer();
    }
});

/**
 * Reference to the image editor component
 */
const imageEditorRef = ref<{
    clearDrawingLayer: () => void;
    clearFowLayer: () => void;
    baseViewRef: {
        imageRef: HTMLImageElement | null;
    };
}>();

/**
 * Controls the player view
 * @param name - The name of the player view to control
 * @param payload - The payload to control the player view
 */
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
    const img = imageEditorRef.value?.baseViewRef?.imageRef;
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
</script>

<template>
    <div class="content">
        <Dropzone />
        <ImageEditor ref="imageEditorRef" />
        <!-- TODO: move remote control to a separate component -->
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
        <ImageHistory />
    </div>
</template>

<style scoped lang="scss">
.content {
    display: flex;
    justify-content: center;
    height: 100vh;
    width: 100vw;
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
