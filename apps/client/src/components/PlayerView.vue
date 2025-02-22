<script lang="ts" setup>
import { onBeforeUnmount, ref } from 'vue';
import panzoom from 'panzoom';
import { useWakeLock, onKeyUp } from '@vueuse/core';
import BaseView from './BaseView.vue';
import { scg } from 'ioc-service-container';
import { useDetune } from '../logic/useDetune';

const conduit = scg('conduit');

let panZoomInstance: ReturnType<typeof panzoom> | null = null;
const containerRef = ref<HTMLDivElement | null>(null);

const isCursorHidden = ref(false);
let cursorHideTimeout: NodeJS.Timeout | undefined;

/**
 * Function shows cursor and starts 5 second time to hide it again
 */
const resetCursorTimer = () => {
    isCursorHidden.value = false;
    clearTimeout(cursorHideTimeout);

    cursorHideTimeout = setTimeout(() => {
        isCursorHidden.value = true;
    }, 5000);
};

/** Removes all potential event listeners of the curser timer */
const deregisterHideCursor = () => {
    window.removeEventListener('mousemove', resetCursorTimer);
    window.removeEventListener('keydown', resetCursorTimer);
    clearTimeout(cursorHideTimeout);
    isCursorHidden.value = false;
};
onBeforeUnmount(deregisterHideCursor);

const resetZoom = () => {
    panZoomInstance?.dispose();

    if (!containerRef.value) {
        return;
    }

    panZoomInstance = panzoom(containerRef.value, {
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

    panZoomInstance.on('panend', () => {
        const transform = panZoomInstance?.getTransform();
        if (transform)
            conduit.broadcast('loggingMessage', {
                data: `x: ${transform.x}, y: ${transform.y}, scale: ${transform.scale}`,
            });
    });
};

const { request, release } = useWakeLock();

/**
 * Toggle the browsers fullscreen mode
 */
async function toggleFullscreen() {
    if (!document.fullscreenElement) {
        await Promise.all([
            document.documentElement.requestFullscreen?.(),
            request('screen'),
        ]);

        window.addEventListener('mousemove', resetCursorTimer);
        window.addEventListener('keydown', resetCursorTimer);
        resetCursorTimer();
    } else {
        deregisterHideCursor();
        await Promise.all([document.exitFullscreen?.(), release()]);
    }
}

// Toggle the browsers fullscreen mode when pressing "f" key
onKeyUp('f', async () => {
    await toggleFullscreen();
});

const displayName = ref('');
useDetune(
    conduit.attune('iWantToKnowAllPlayerViews', (lore) => {
        conduit.invoke('iAmAPlayerView', lore.name, { name: conduit.name });
        displayName.value = conduit.name;
        setTimeout(() => (displayName.value = ''), 5000);
    }),
);

useDetune(
    conduit.attune('controlPlayerView', async (lore) => {
        if (!panZoomInstance) {
            return;
        }
        const { scale } = panZoomInstance.getTransform();
        switch (lore.type) {
            case 'reset':
                resetZoom();
                break;
            case 'zoom':
                const factor = lore.direction === 'in' ? 1.1 : 0.9;
                panZoomInstance.zoomTo(
                    document.body.clientWidth / 2,
                    document.body.clientHeight / 2,
                    factor,
                );
                break;
            case 'pan':
                const delta = 10;
                const diffX =
                    (lore.direction === 'left'
                        ? delta
                        : lore.direction === 'right'
                          ? -delta
                          : 0) * scale;
                const diffY =
                    (lore.direction === 'up'
                        ? delta
                        : lore.direction === 'down'
                          ? -delta
                          : 0) * scale;
                panZoomInstance.moveBy(diffX, diffY, false);
                break;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));

        const image = baseViewRef.value?.imageRef;
        if (image) {
            const imgWidth = image.naturalWidth;

            const rect = image.getBoundingClientRect();
            console.log(rect);
            const { width, height, left, top, right, bottom } = rect;
            const factor = imgWidth / width;

            const oneImgPixelInScreenPixels = width / imgWidth;
            console.log(oneImgPixelInScreenPixels, factor);

            const displayedWidth =
                width + left - (right - document.body.clientWidth);
            console.log(displayedWidth);

            const displayedPart = {
                width: document.body.clientWidth * factor,
                height: document.body.clientHeight * factor,
                x: -left * factor,
                y: -top * factor,
            };

            conduit.broadcast('iWasControlled', {
                name: conduit.name,
                rect: displayedPart,
            });
        } else {
            console.log('welp');
        }
    }),
);

const baseViewRef = ref<{
    imageRef: HTMLImageElement | null;
}>();
</script>

<template>
    <div
        ref="containerRef"
        class="container"
        :class="{ 'cursor-hidden': isCursorHidden }"
    >
        <BaseView
            @image-loaded="resetZoom"
            ref="baseViewRef"
        />
    </div>
    <div
        class="name-display"
        v-if="displayName"
    >
        {{ displayName }}
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

.name-display {
    position: absolute;
    top: 50vh;
    left: 50vw;
    background-color: white;
    color: black;
    padding: 2rem;
    transform: translate(-50%, -50%);
}

.cursor-hidden {
    cursor: none;
}
</style>
