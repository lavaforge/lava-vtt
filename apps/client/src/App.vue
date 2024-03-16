<script lang="ts" setup>
import { scg } from 'ioc-service-container';
import { FrontendConduit } from './logic/conduit';
import { z } from 'zod';
import { ref } from 'vue';

const apiUrl = scg('apiUrl');

const conduit = new FrontendConduit(z.string().url().parse(apiUrl));

const name = ref('');
setTimeout(() => {
  name.value = conduit.name;
}, 1000);

const ping = ref('ping');
async function sendPing() {
  ping.value = (await conduit.invoke('ping', 'nexus', { msg: 'my ping' })).msg;
  setTimeout(() => {
    ping.value = 'ping';
  }, 1000);
}

async function sayHello() {
  await conduit.dispatch('hello', { name: conduit.name });
}

const whoSaidHello = ref('');

conduit.attune('hello', (lore) => {
  whoSaidHello.value = lore.name;
  setTimeout(() => {
    whoSaidHello.value = '';
  }, 2000);
});
</script>

<template>
  <div>hello {{ name }}</div>
  <button @click="sendPing">{{ ping }}</button>
  <button @click="sayHello">say hello</button>
  <div v-if="whoSaidHello">{{ whoSaidHello }} said hello!</div>
</template>

<style scoped></style>
