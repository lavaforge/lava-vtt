<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';

const server = ref('');

onMounted(async () => {
    const s = await storage.getItem('local:server', {
        defaultValue: 'http://localhost:3000',
    });
    server.value = s!;
});

watch(server, (value) => {
    console.log(value);
    storage.setItem('local:server', value);
});
</script>

<template>
    <h1>LAVA VTT</h1>
    <p>please configure your server address:</p>
    <input type="text" v-model="server" />
</template>

<style scoped>
.logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
}
.logo:hover {
    filter: drop-shadow(0 0 2em #54bc4ae0);
}
.logo.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
