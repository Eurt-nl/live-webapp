<template>
  <q-page class="rafi-page">
    <div class="rafi-container">
      <RafiChat />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import RafiChat from '../components/RafiChat.vue';
</script>

<style scoped>
.rafi-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.rafi-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  height: 100%;
}

/* Responsive design */
@media (max-width: 600px) {
  .rafi-container {
    max-width: 100%;
    margin: 0;
  }
}
</style>
