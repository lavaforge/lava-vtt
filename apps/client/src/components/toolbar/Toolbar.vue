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

/**
 * @description Button props
 */
interface ButtonProps {
    id: string;
    label: string;
    icon?: string | (() => string);
    subButtons?: ButtonProps[];
    backgroundColor?: () => string;
    triggerable?: boolean;
    tooltip?: string;
}

const buttons = ref<ButtonProps[]>([
    {
        id: 'fowFreeForm',
        label: 'free form',
        tooltip: 'free form',
        icon: icons.fogOfWar,
    },
    { id: 'fowCircle', label: 'circle', tooltip: 'circle', icon: icons.circle },
    {
        id: 'fowRectangle',
        label: 'rectangle',
        tooltip: 'rectangle',
        icon: icons.square,
    },
    {
        id: 'fowPolygon',
        label: 'polygon',
        tooltip: 'polygon',
        icon: icons.polygon,
    },
    { id: 'fowArrow', label: 'arrow', tooltip: 'arrow', icon: icons.arrow }, // TODO: move to other toolbar than fog of war
    {
        id: 'fowState',
        label: 'state',
        tooltip: 'toggle subtract/add fog of war',
        triggerable: true,
        icon: () => (props.isAddingFow ? icons.cloudMinus : icons.cloudPlus),
    },
    {
        id: 'close',
        label: 'close',
        tooltip: 'close fog of war toolbar',
        icon: icons.close,
    },
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

/**
 * @description Handle button press
 * @param text - Button id
 */
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
            :key="btn.id"
            v-for="btn in buttons"
            :class="['button', { active: btn.id === props.activeButton }]"
            :style="{
                opacity: opacity,
            }"
            :alt-text="btn.label"
            :tooltip="btn.tooltip ?? btn.label"
            :icon="typeof btn.icon === 'function' ? btn.icon() : btn.icon"
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
