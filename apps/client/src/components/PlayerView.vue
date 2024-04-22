<script lang="ts" setup>
import { ref } from 'vue';
import panzoom from 'panzoom';
import { useWakeLock } from '@vueuse/core';
import BaseView from './BaseView.vue';

let panZoomInstance: ReturnType<typeof panzoom> | null = null;
const containerRef = ref<HTMLDivElement | null>(null);

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
};

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
</script>

<template>
    <div ref="containerRef" class="container">
        <BaseView @image-loaded="resetZoom" />
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
</style>
