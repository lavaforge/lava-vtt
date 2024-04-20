import { defineStore } from 'pinia';
import { computed, ref, shallowReadonly, watch } from 'vue';
import { scg } from 'ioc-service-container';

export const useMapStore = defineStore('map', () => {
    const conduit = scg('conduit');
    const apiUrl = scg('apiUrl');

    const currentHash = ref<string>();
    const currentFowData = ref<number[]>();

    conduit.attune('imageHash', async (lore) => {
        const newHash = lore.hash;
        if (!newHash) {
            currentHash.value = undefined;
            currentFowData.value = undefined;
            return;
        }

        const newFow = (
            await conduit.invoke('requestFow', 'nexus', { hash: newHash })
        ).fow;

        currentFowData.value = newFow ?? undefined;
        currentHash.value = newHash;
    });

    conduit.attune('fowUpdate', (lore) => {
        if (lore.hash !== currentHash.value) return;
        currentFowData.value = lore.fow;
    });

    const imagePath = computed(() =>
        currentHash.value ? `${apiUrl}/api/image/${currentHash.value}` : '',
    );

    function setFow(fowData: number[]) {
        if (!currentHash.value) return;
        currentFowData.value = fowData;
        conduit.broadcast('fowUpdate', {
            hash: currentHash.value,
            fow: fowData,
        });
    }

    return { imagePath, fowData: shallowReadonly(currentFowData), setFow };
});
