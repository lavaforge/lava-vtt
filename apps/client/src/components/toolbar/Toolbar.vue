<script setup lang="ts">
import ToolbarButton from './ToolbarButton.vue';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
    open: boolean;
    activeButton?: string;
}>();

const emit = defineEmits<{
    'update:open': [open: boolean];
    buttonPress: [text: string];
}>();

const buttons = ref([
    { text: '1' },
    { text: '2' },
    { text: '3' },
    { text: '4' },
    { text: '5' },
    { text: '6' },
    { text: '7' },
    { text: '8' },
    { text: '9' },
    { text: '0' },
    { text: 'close' },
]);

const toggle = ref(props.open);
const distances = computed(() => {
    if (toggle.value) {
        return buttons.value.map(() => '0');
    } else {
        const bw = 3;
        const gap = 1;

        const half = buttons.value.length / 2 - 0.5;
        return buttons.value.map((_, i) => {
            const btnDist = half - i;
            const actDist = btnDist * (bw + gap);
            return `${actDist}rem`;
        });
    }
});

const opacity = ref(props.open ? 1 : 0);
const actOpen = ref(props.open);
watch(
    () => props.open,
    (newVal) => {
        if (!newVal) {
            // setAnimationDistances();
            toggle.value = false;
            opacity.value = 0;
            setTimeout(() => {
                actOpen.value = false;
            }, 200);
        } else {
            actOpen.value = true;
            setTimeout(() => {
                opacity.value = 1;
                //resetDistances();
                toggle.value = true;
            }, 0);
        }
    },
);

function handlePress(text: string) {
    if (text === 'close') {
        emit('update:open', false);
    } else {
        emit('buttonPress', text);
    }
}
</script>

<template>
    <div
        v-if="actOpen"
        class="toolbar-host"
    >
        <ToolbarButton
            :key="btn.text"
            v-for="(btn, i) in buttons"
            :class="['button', { active: btn.text === props.activeButton }]"
            :style="{
                transform:
                    distances[i] !== '0' ? `translateX(${distances[i]})` : null,
                opacity: opacity,
            }"
            :text="btn.text"
            @press="handlePress(btn.text)"
        />
    </div>
</template>

<style scoped lang="scss">
.toolbar-host {
    display: flex;
    gap: 1rem;

    padding: 0.5rem;

    .button {
        transition:
            transform 0.2s ease-in-out,
            opacity 0.2s ease-in-out;
    }
}
</style>
