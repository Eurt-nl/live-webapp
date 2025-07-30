<template>
  <q-page padding>
    <div v-if="speler" class="column items-center">
      <q-avatar size="120px" class="q-mb-md cursor-pointer" @click="showAvatarDialog = true">
        <img :src="getAvatarUrl(speler)" />
      </q-avatar>

      <div class="text-h4 q-mb-md">{{ speler.name }}</div>

      <q-card class="full-width">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="text-subtitle1">{{ $customT('players.homecourse') }}</div>
              <div class="text-body1">{{ homecourseName || $customT('players.noHomecourse') }}</div>
            </div>

            <div class="col-12 col-md-6">
              <div class="text-subtitle1">{{ $customT('players.category') }}</div>
              <div class="text-body1">{{ categoryName || $customT('players.notSpecified') }}</div>
            </div>

            <div class="col-12 col-md-6">
              <div class="text-subtitle1">{{ $customT('players.birthyear') }}</div>
              <div class="text-body1">{{ speler.birthyear }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div v-else class="text-center q-mt-lg">
      <q-spinner size="xl" />
      <div class="text-h6 q-mt-md">{{ $customT('players.loadingPlayer') }}</div>
    </div>

    <!-- Avatar Dialog -->
    <q-dialog v-model="showAvatarDialog">
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ speler?.name }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <img
            :src="getAvatarUrl(speler)"
            class="full-width"
            style="max-width: 500px; max-height: 500px; object-fit: contain"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import pb from 'src/config/pocketbase';
import { getAvatarUrl } from 'src/utils/avatar-utils';
import { debug } from 'src/utils/debug';

const { t: $customT } = useI18n();
const route = useRoute();
const speler = ref(null);
const categories = ref({});
const showAvatarDialog = ref(false);

const homecourseName = computed(() => {
  return speler.value?.expand?.homecourse?.name || null;
});

const categoryName = computed(() => {
  if (!speler.value?.category) return null;
  return categories.value[speler.value.category];
});

// getAvatarUrl functie wordt nu geïmporteerd uit avatar-utils

onMounted(async () => {
  try {
    // Haal de categories op
    const categoriesResult = await pb.collection('categories').getList(1, 50, {
      sort: 'name',
    });
    categories.value = categoriesResult.items.reduce((acc, category) => {
      acc[category.id] = category.name;
      return acc;
    }, {});

    // Haal de speler op met expanded homecourse
    const spelerId = route.params.id as string;
    speler.value = await pb.collection('users').getOne(spelerId, {
      expand: 'homecourse',
    });
  } catch (error) {
    debug('Error loading player details:', error);
  }
});
</script>
