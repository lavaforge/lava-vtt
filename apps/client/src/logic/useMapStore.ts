import { defineStore } from 'pinia';
import { computed, ref, shallowReadonly } from 'vue';
import { scg } from 'ioc-service-container';
import type { FogOfWar } from '@base';
import type { DrawingData } from '@base';
import { refWithControl } from '@vueuse/core';

export const useMapStore = defineStore('map', () => {
    const conduit = scg('conduit');
    const apiUrl = scg('apiUrl');

    const currentHash = ref<string>();
    const currentFowData = refWithControl<FogOfWar | undefined>(undefined);
    const currentDrawingData = refWithControl<DrawingData | undefined>(
        undefined,
    );

    conduit.attune('imageHash', async (lore) => {
        const newHash = lore.hash;
        if (!newHash) {
            currentHash.value = undefined;
            currentFowData.value = undefined;
            return;
        }

        const newFow = await conduit.invoke('fowRequest', 'nexus', {
            hash: newHash,
        });

        const newDrawingData = await conduit.invoke('drawingRequest', 'nexus', {
            hash: newHash,
        });

        currentFowData.value = newFow.data;
        currentDrawingData.value = newDrawingData.data;
        currentHash.value = newHash;
    });

    conduit.attune('fowUpdate', (lore) => {
        if (lore.hash !== currentHash.value) {
            return;
        }

        currentFowData.value = lore.data;
    });

    conduit.attune('drawingUpdate', (lore) => {
        if (lore.hash !== currentHash.value) {
            return;
        }
        currentDrawingData.value = lore.data;
    });

    const imagePath = computed(() =>
        currentHash.value ? `${apiUrl}/api/image/${currentHash.value}` : '',
    );

    function setFow(fowData: FogOfWar, triggering: boolean = true) {
        if (!currentHash.value) return;

        currentFowData.set(fowData, triggering);
        conduit.broadcast('fowUpdate', {
            hash: currentHash.value,
            data: fowData,
        });
    }

    function setDrawing(drawingData: DrawingData, triggering: boolean = true) {
        if (!currentHash.value) return;

        currentDrawingData.set(drawingData, triggering);
        conduit.broadcast('drawingUpdate', {
            hash: currentHash.value,
            data: drawingData,
        });
    }

    return {
        imagePath,
        fowData: shallowReadonly(currentFowData),
        setFow,
        drawingData: shallowReadonly(currentDrawingData),
        setDrawing,
    };
});
