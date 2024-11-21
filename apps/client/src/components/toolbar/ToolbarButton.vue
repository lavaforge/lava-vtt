<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { useIntersectionObserver, useResizeObserver } from '@vueuse/core';

withDefaults(
    defineProps<{
        altText: string;
        tooltipPos?: 'top' | 'bottom';
        active?: boolean;
        icon?: string;
        tooltip: string;
        backgroundColor?: string;
    }>(),
    { tooltipPos: 'top', active: false },
);

defineEmits<{
    press: [];
}>();

const hostRef = ref<HTMLButtonElement | null>(null);
const tooltipRef = ref<HTMLSpanElement | null>(null);
const tooltipOffsetDirection = ref<'offsetLeft' | 'offsetRight' | null>(null);
const tooltipOffsetAmount = ref(0);
const originOffsetAmount = ref(0);

const { pause, resume } = useIntersectionObserver(
    tooltipRef,
    ([entry]) => {
        const fullyInViewport = entry.isIntersecting;

        if (fullyInViewport) {
            pause();
            return;
        }

        const outsideOnTheLeft = entry.boundingClientRect.left <= 0;
        tooltipOffsetDirection.value = outsideOnTheLeft
            ? 'offsetLeft'
            : 'offsetRight';

        if (tooltipOffsetDirection.value === 'offsetLeft') {
            tooltipOffsetAmount.value = -Math.abs(
                (hostRef.value?.getBoundingClientRect().left ?? 0) -
                    entry.intersectionRect.left,
            );
            originOffsetAmount.value =
                -Math.abs(
                    entry.intersectionRect.left - entry.boundingClientRect.left,
                ) +
                Math.abs(
                    entry.boundingClientRect.right -
                        (hostRef.value?.getBoundingClientRect().right ?? 0),
                ) +
                (hostRef.value?.getBoundingClientRect().width ?? 0) / 2;
        } else {
            tooltipOffsetAmount.value = -Math.abs(
                (hostRef.value?.getBoundingClientRect().right ?? 0) -
                    entry.intersectionRect.right,
            );
            originOffsetAmount.value =
                Math.abs(
                    entry.intersectionRect.right -
                        entry.boundingClientRect.right,
                ) +
                Math.abs(
                    entry.boundingClientRect.left -
                        (hostRef.value?.getBoundingClientRect().left ?? 0),
                ) +
                (hostRef.value?.getBoundingClientRect().width ?? 0) / 2;
        }

        pause();
    },
    // .999 because 1.0 leads to false positives which have a ratio of .9999...
    { threshold: 0.999, rootMargin: '-8px' },
);

useResizeObserver(
    document.body,
    () => {
        tooltipOffsetDirection.value = null;
        tooltipOffsetAmount.value = 0;
        originOffsetAmount.value = 0;
        nextTick(() => resume());
    },
    { box: 'border-box' },
);
</script>

<template>
    <button
        class="toolbar-button-host"
        @click="$emit('press')"
        :class="{ active }"
        :style="{ backgroundColor: backgroundColor || undefined }"
        ref="hostRef"
    >
        <img
            :src="icon"
            v-if="icon"
        />
        <span
            v-else
            class="content"
            >{{ altText }}</span
        >
        <span
            ref="tooltipRef"
            :class="['tooltip', tooltipPos === 'top' ? 'top' : 'bottom']"
            :style="[
                tooltipOffsetDirection
                    ? tooltipOffsetDirection === 'offsetLeft'
                        ? { left: tooltipOffsetAmount + 'px' }
                        : { right: tooltipOffsetAmount + 'px' }
                    : null,
                {
                    transformOrigin: originOffsetAmount
                        ? `${originOffsetAmount}px 50%`
                        : 'center',
                },
            ]"
            >{{ tooltip }}</span
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

    &.active:after {
        // "selected" border
        position: absolute;
        content: '';
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;

        box-shadow: 0 0 0 4px black inset;
        border-radius: calc($size / 2);
    }

    .content {
        padding: 0 0.25rem;
    }

    .tooltip {
        opacity: 0;

        position: absolute;
        width: max-content;
        max-width: 90vw;

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

        &.offsetLeft {
            left: 0;
        }

        &.offsetRight {
            right: -0.5rem;
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
