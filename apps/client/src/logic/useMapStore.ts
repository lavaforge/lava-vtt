import { defineStore } from 'pinia';
import { computed, ref, shallowReadonly, watch } from 'vue';
import { scg } from 'ioc-service-container';

export const useMapStore = defineStore('map', () => {
  const conduit = scg('conduit');
  const apiUrl = scg('apiUrl');

  const currentHash = ref<string>();
  const nextHash = ref<string>();
  const currentFowData = ref<number[]>();

  conduit.attune('imageHash', (lore) => {
    nextHash.value = lore.hash;
  });

  conduit.attune('fowUpdate', (lore) => {
    if (lore.hash !== currentHash.value) return;
    currentFowData.value = lore.fow;
  });

  watch(nextHash, async (newHash) => {
    if (!newHash) return;
    const newFow = (
      await conduit.invoke('requestFow', 'nexus', { hash: newHash })
    ).fow;
    console.log('newFow', newFow);
    if (newFow) currentFowData.value = newFow;
    currentHash.value = newHash;
  });

  const imagePath = computed(() =>
    currentHash.value ? `${apiUrl}/api/image/${currentHash.value}` : '',
  );

  function setFow(fowData: number[]) {
    if (!currentHash.value) return;
    currentFowData.value = fowData;
    conduit.broadcast('fowUpdate', { hash: currentHash.value, fow: fowData });
  }

  return { imagePath, fowData: shallowReadonly(currentFowData), setFow };
});
