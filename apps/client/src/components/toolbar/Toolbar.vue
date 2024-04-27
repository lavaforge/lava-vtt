<script setup lang="ts">
import ToolbarButton from './ToolbarButton.vue';
import { ref, watch } from 'vue';
import { icons } from '../../icons';

const props = defineProps<{
    open: boolean;
    activeButton?: string;
}>();

const emit = defineEmits<{
    'update:open': [open: boolean];
    buttonPress: [text: string];
}>();

interface ButtonDto {
    id: string;
    label: string;
    icon?: string;
    subButtons?: ButtonDto[];
}

const buttons = ref<ButtonDto[]>([
    { id: '1', label: '1', icon: icons.fogOfWar },
    { id: '2', label: '2' },
    { id: 'fog-of-war', label: 'fog of war', icon: icons.fogOfWar },
    { id: '4', label: '4' },
    { id: '5', label: '5' },
    { id: '6', label: '6' },
    { id: '7', label: '7' },
    { id: '8', label: '8' },
    { id: '9', label: '9' },
    {
        id: '0',
        icon: icons.fogOfWar,
        label: 'asdfölkajsdöflkjasdf ölkajsd fölakjs dfölkajs döflkja sdöflja södflkj asödlfkj asöldfkj aösldfkj aösldfjk aösldkfj aösldkfj aösldkjf aölsdkjf öalsdfj aölsdkjf aölsdkjf aölsdkfj aöslkdfj asdf',
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
            :key="btn.label"
            v-for="btn in buttons"
            :class="['button', { active: btn.id === props.activeButton }]"
            :style="{
                opacity: opacity,
            }"
            :alt-text="btn.label"
            :tooltip="btn.label"
            :icon="btn.icon"
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
