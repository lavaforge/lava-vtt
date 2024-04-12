import { defineStore } from 'pinia';
import { computed, ref, shallowReadonly, watch } from 'vue';
import { scg } from 'ioc-service-container';
import type { LoreSchema } from 'conduit';

export const useMapStore = defineStore('map', () => {
    const conduit = scg('conduit');
    const apiUrl = scg('apiUrl');

    const currentHash = ref<string>();
    const currentFowData = ref<LoreSchema<'paperFow'>>();

    conduit.attune('imageHash', async (lore) => {
        const newHash = lore.hash;
        if (!newHash) {
            currentHash.value = undefined;
            currentFowData.value = undefined;
            return;
        }

        currentFowData.value = undefined;
        currentHash.value = newHash;
    });

    conduit.attune('paperFow', (lore) => {
        currentFowData.value = lore;
    });

    const imagePath = computed(() =>
        currentHash.value ? `${apiUrl}/api/image/${currentHash.value}` : '',
    );

    function setFow(fowData: LoreSchema<'paperFow'>) {
        currentFowData.value = fowData;
        conduit.broadcast('paperFow', fowData);
    }

    return { imagePath, fowData: shallowReadonly(currentFowData), setFow };
});
