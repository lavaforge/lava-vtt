<script setup lang="ts">
withDefaults(
    defineProps<{
        text: string;
        tooltipPos?: 'top' | 'bottom';
        active?: boolean;
    }>(),
    { tooltipPos: 'top', active: false },
);

defineEmits<{
    press: [];
}>();
</script>

<template>
    <button
        class="toolbar-button-host"
        @click="$emit('press')"
        :class="{ active }"
    >
        <span class="content">{{ text }}</span>
        <span :class="['tooltip', tooltipPos === 'top' ? 'top' : 'bottom']"
            >tooltip</span
        >
    </button>
</template>

<style scoped lang="scss">
.toolbar-button-host {
    position: relative;

    // color: #ddd;
    background-color: #fefcf1;
    box-shadow:
        0 0 0.5rem #fbb4577e inset,
        0.125rem 0.125rem 1rem black;

    $size: 3rem;
    min-width: $size;
    height: $size;
    border-radius: calc($size / 2);

    display: flex;
    justify-content: center;
    align-items: center;

    border: none;

    cursor: pointer;

    &.active {
        // font-size: 1.5rem;
        // border: 4px solid #808080;
        span {
            // text-decoration: underline;
            font-weight: bold;
            border: 1px solid black;
            border-radius: 0.5rem;
        }
    }

    .content {
        padding: 0 0.25rem;
    }

    .tooltip {
        opacity: 0;

        position: absolute;

        color: #ddd;
        background: rgba(0, 0, 0, 0.8);
        padding: 0.125rem 0.25rem;

        border-radius: 0.5rem;

        transition:
            opacity 0.2s ease,
            transform 0.2s ease-in-out;
        pointer-events: none;

        &.top {
            bottom: 110%;
        }

        &.bottom {
            top: 110%;
        }
    }

    &:hover {
        transform: scale(1.04);
        transition: transform 0.2s ease-in-out;

        .tooltip {
            opacity: 1;
            transform: scale(calc(1 / 1.04));
        }
    }

    &:active {
        background: darkred;
    }

    span {
        display: flex;
        justify-content: center;
        align-items: center;
    }
}
</style>
