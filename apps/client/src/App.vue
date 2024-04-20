<script lang="ts" setup>
import PlayerView from './components/PlayerView.vue';
import DmView from './components/DmView.vue';

const isPlayerView = !window.location.search.includes('admin');
</script>

<template>
    <PlayerView v-if="isPlayerView" />
    <DmView v-else />
</template>

<style scoped></style>
