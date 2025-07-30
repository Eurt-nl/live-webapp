<template>
  <div class="q-pa-md">
    <h2>{{ $customT('fileDisplay.title') }}</h2>

    <div v-if="fileUrl" class="q-mb-md">
      <h3>{{ $customT('fileDisplay.originalFile') }}</h3>
      <img :src="fileUrl" :alt="$customT('fileDisplay.originalFile')" />
    </div>

    <div v-if="thumbUrl" class="q-mb-md">
      <h3>{{ $customT('fileDisplay.thumbnail') }}</h3>
      <img :src="thumbUrl" :alt="$customT('fileDisplay.thumbnail')" />
    </div>

    <div v-if="customUrl" class="q-mb-md">
      <h3>{{ $customT('fileDisplay.customFile') }}</h3>
      <img :src="customUrl" :alt="$customT('fileDisplay.customFile')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { getFileUrl, getThumbUrl, getFileUrlWithParams } from '../utils/pocketbase-helpers';

const { t: $customT } = useI18n();

const fileUrl = ref<string>('');
const thumbUrl = ref<string>('');
const customUrl = ref<string>('');

onMounted(() => {
  // Vervang deze waarden met echte waarden uit je PocketBase database
  const collectionName = 'your_collection';
  const recordId = 'your_record_id';
  const fileName = 'your_file.jpg';

  fileUrl.value = getFileUrl(collectionName, recordId, fileName);
  thumbUrl.value = getThumbUrl(collectionName, recordId, fileName, '200x200');
  customUrl.value = getFileUrlWithParams(collectionName, recordId, fileName, {
    width: '300',
    height: '300',
    fit: 'cover',
  });
});
</script>

<style scoped>
.q-pa-md {
  padding: 16px;
}
.q-mb-md {
  margin-bottom: 16px;
}
img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
