import { onBeforeUnmount } from 'vue';

export function useDetune({ detune }: { detune: () => void }) {
    onBeforeUnmount(detune);
}
