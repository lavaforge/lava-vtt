<script setup lang="ts">
import ToolbarButton from './ToolbarButton.vue';
import { ref, watch } from 'vue';
import { icons } from '../../icons';

const props = defineProps<{
    open: boolean;
    activeButton?: string;
    isAddingFow?: boolean;
}>();

const emit = defineEmits<{
    'update:open': [open: boolean];
    'update:activeButton': [id: string];
    trigger: [id: string];
}>();

interface ButtonDto {
    id: string;
    label: string;
    icon?: string;
    subButtons?: ButtonDto[];
    backgroundColor?: () => string;
    triggerable?: boolean;
}

const buttons = ref<ButtonDto[]>([
    { id: 'fowFreeForm', label: 'free form', icon: icons.fogOfWar },
    { id: 'fowCircle', label: 'c' },
    { id: 'fowRectangle', label: 'r' },
    { id: 'fowPolygon', label: 'p' },
    { id: 'fowArrow', label: '->' },
    {
        id: 'fowState',
        label: 's',
        triggerable: true,
        backgroundColor: () => (props.isAddingFow ? 'black' : 'white'),
    },
    { id: 'close', label: 'x' },
]);

const toggle = ref(props.open);

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
    const dto = buttons.value.find((b) => b.id === text);
    if (text === 'close') {
        emit('update:open', false);
    } else if (dto?.triggerable) {
        emit('trigger', dto.id);
    } else {
        emit('update:activeButton', text);
    }
}
</script>

<template>
    <div
        v-if="actOpen"
        class="toolbar-host"
    >
        <ToolbarButton
            :key="btn.label"
            v-for="btn in buttons"
            :class="['button', { active: btn.id === props.activeButton }]"
            :style="{
                opacity: opacity,
            }"
            :alt-text="btn.label"
            :tooltip="btn.label"
            :icon="btn.icon"
            :background-color="btn.backgroundColor?.()"
            @press="handlePress(btn.id)"
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
