<template>
  <q-page padding>
    <div class="text-h4 q-mb-md">{{ t('players.title') }}</div>

    <div class="row q-col-gutter-md">
      <div v-for="speler in spelers" :key="speler.id" class="col-12 col-sm-6 col-md-4">
        <q-card class="cursor-pointer" @click="navigateToSpeler(speler.id)">
          <q-card-section class="row items-center">
            <q-avatar size="48px" class="q-mr-md">
              <img :src="getAvatarUrl(speler)" />
            </q-avatar>
            <div>
              <div class="text-h6">{{ speler.name }}</div>
              <div class="text-caption text-grey">
                {{ speler.expand?.homecourse?.name || t('players.noHomecourse') }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { debug } from 'src/utils/debug';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import pb from 'src/config/pocketbase';
import { getAvatarUrl } from 'src/utils/avatar-utils';

const $q = useQuasar();
const router = useRouter();
const { t } = useI18n();
const loading = ref(true);
const spelers = ref([]);

// getAvatarUrl functie wordt nu geïmporteerd uit avatar-utils

const navigateToSpeler = (id) => {
  void router.push(`/spelers/${id}`);
};

onMounted(async () => {
  try {
    const result = await pb.collection('users').getList(1, 50, {
      sort: 'name',
      expand: 'homecourse',
    });
    spelers.value = result.items;
  } catch (error) {
    debug('Error loading data:', error);
    $q.notify({
      color: 'negative',
      message: t('players.loadError'),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
});
</script>
