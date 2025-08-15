<template>
  <div>
    <div class="text-h6 q-mb-md">Holes</div>

    <q-table
      v-if="holes.length > 0"
      :rows="holes"
      :columns="columns"
      row-key="id"
      flat
      bordered
      hide-pagination
      :pagination="{ rowsPerPage: 0 }"
    >
      <template v-slot:body-cell-image="props">
        <q-td :props="props">
          <q-img
            v-if="props.row.image"
            :src="getFileUrl('course_detail', props.row.id, props.row.image)"
            style="height: 50px; width: 50px; cursor: pointer"
            class="rounded-borders"
            @click="showImageDialog(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <div v-else class="text-center q-pa-md text-grey">Nog geen holes toegevoegd</div>

    <!-- Dialoog voor foto vergroting -->
    <q-dialog v-model="imageDialog" maximized>
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">Hole {{ selectedHole?.hole }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-img
            v-if="selectedHole?.image"
            :src="getFileUrl('course_detail', selectedHole.id, selectedHole.image)"
            style="max-height: 80vh; width: 100%"
            class="rounded-borders"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';
import { getFileUrl } from 'src/utils/pocketbase-helpers';

import { useI18n } from 'vue-i18n';

const { t: $customT } = useI18n();

const props = defineProps<{
  courseId: string;
}>();

const $q = useQuasar();
const { pb } = usePocketbase();

const holes = ref([]);
const loading = ref(false);
const imageDialog = ref(false);
const selectedHole = ref(null);

const columns = [
  {
    name: 'hole',
    label: 'Hole',
    field: 'hole',
    align: 'left' as const,
  },
  {
    name: 'hole_index',
    label: 'Index',
    field: 'hole_index',
    align: 'left' as const,
    format: (val: number) => String(val).padStart(2, '0'),
  },
  {
    name: 'hole_length',
    label: 'Lengte (m)',
    field: 'hole_length',
    align: 'left' as const,
    format: (val: number) => `${val}m`,
  },
  {
    name: 'image',
    label: 'Foto',
    field: 'image',
    align: 'center' as const,
    format: (val: string, row: { id: string }) => {
      if (val) {
        return `<img src="${getFileUrl('course_detail', row.id, val)}" class="hole-thumbnail" />`;
      }
      return '';
    },
  },
];

const showImageDialog = (hole) => {
  selectedHole.value = hole;
  imageDialog.value = true;
};

const loadHoles = async () => {
  try {
    loading.value = true;
    await new Promise((resolve) => setTimeout(resolve, 100));

    const result = await pb.collection('course_detail').getList(1, 50, {
      filter: `course = "${props.courseId}"`,
      sort: 'hole',
    });

    if (result && result.items) {
      holes.value = result.items.map((hole) => ({
        ...hole,
        hole_length: Number(hole.hole_length) || 0,
      }));
    }
  } catch (error) {
    if (error.message?.includes('autocancelled')) {
      console.log('Request was autocancelled, retrying...');
      void setTimeout(() => {
        void loadHoles();
      }, 200);
      return;
    }

    console.error('Error loading holes:', error);
    $q.notify({
      color: 'negative',
      message: $customT('notifications.loadHolesError'),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.courseId,
  (newId) => {
    if (newId) {
      void loadHoles();
    }
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.hole-thumbnail {
  height: 50px;
  width: 50px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}
</style>
