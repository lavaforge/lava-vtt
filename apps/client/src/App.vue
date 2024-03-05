<script lang="ts" setup>
import PlayerView from './components/PlayerView.vue';
import { useSocket } from './logic/useSocket';
import DmView from './components/DmView.vue';

useSocket({ initialize: true });

const isPlayerView = !window.location.search.includes('admin');
</script>

<template>
  <PlayerView v-if="isPlayerView" />
  <DmView v-else />
</template>

<style scoped></style>
