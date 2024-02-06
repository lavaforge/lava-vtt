<script lang="ts" setup>
import PlayerView from "./components/PlayerView.vue";
import { useSocket } from "./logic/useSocket.ts";
import DmViewV2 from "./components/DmViewV2.vue";

useSocket({ initialize: true });

const isPlayerView = !window.location.search.includes("admin");
</script>

<template>
  <PlayerView v-if="isPlayerView" />
  <DmViewV2 v-else />
</template>

<style scoped></style>
