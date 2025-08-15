<template>
  <q-page padding>
    <div class="text-h4 q-mb-md">{{ $customT('players.title') }}</div>

    <!-- Zoekveld voor spelers -->
    <div class="row q-mb-md">
      <div class="col-12">
        <q-input
          v-model="searchQuery"
          :placeholder="$customT('players.searchPlaceholder')"
          outlined
          dense
          clearable
          class="full-width"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div v-for="speler in filteredSpelers" :key="speler.id" class="col-12 col-sm-6 col-md-4">
        <q-card
          class="cursor-pointer"
          @click="navigateToSpeler(speler.id)"
          style="position: relative"
        >
          <!-- Landen vlaggetje in de hoek -->
          <div style="position: absolute; top: 8px; right: 8px; z-index: 1">
            <img
              v-if="getCountryFlag(speler.country)"
              :src="'data:image/png;base64,' + getCountryFlag(speler.country)"
              :alt="getCountryName(speler.country)"
              width="20"
              height="14"
              :title="getCountryName(speler.country)"
              style="
                display: block;
                object-fit: cover;
                border-radius: 2px;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
              "
              @error="handleFlagError"
            />
            <div
              v-else
              class="flex items-center justify-center"
              style="
                width: 20px;
                height: 14px;
                background: #f0f0f0;
                border-radius: 2px;
                font-size: 8px;
                color: #666;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
              "
            >
              {{ getCountryName(speler.country).substring(0, 2).toUpperCase() }}
            </div>
          </div>

          <q-card-section class="row items-center">
            <q-avatar size="48px" class="q-mr-md">
              <img :src="getAvatarUrl(speler)" />
            </q-avatar>
            <div>
              <div class="text-h6">{{ speler.name }}</div>
              <div class="text-caption text-grey">
                {{ speler.expand?.homecourse?.name || $customT('players.noHomecourse') }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Geen spelers gevonden bericht -->
    <div v-if="filteredSpelers.length === 0" class="text-center q-pa-lg">
      <q-icon name="person" size="64px" color="grey-4" />
      <div class="text-h6 text-grey-6 q-mt-md">
        {{ $customT('players.noPlayersFound') }}
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { debug } from 'src/utils/debug';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { usePocketbase } from 'src/composables/usePocketbase';
import { getAvatarUrl } from 'src/utils/avatar-utils';
import type { Country } from 'src/components/models';

const $q = useQuasar();
const router = useRouter();
const { t: $customT } = useI18n();
const { pb } = usePocketbase();
const loading = ref(true);
const spelers = ref([]);
const searchQuery = ref('');
const countries = ref<Record<string, Country>>({});

// getAvatarUrl functie wordt nu geïmporteerd uit avatar-utils

// Haal de naam van het land op basis van het id
const getCountryName = (countryId: string) => {
  return countries.value[countryId]?.name || countryId;
};

// Haal de vlag van het land op basis van het id
const getCountryFlag = (countryId: string) => {
  return countries.value[countryId]?.flag || '';
};

// Handle vlag loading errors
const handleFlagError = (event: Event) => {
  console.warn('Flag image failed to load:', event);
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  img.nextElementSibling?.classList.remove('hidden');
};

// Filter de spelers op zoekquery
const filteredSpelers = computed(() => {
  if (!searchQuery.value.trim()) return spelers.value;

  const query = searchQuery.value.toLowerCase().trim();
  return spelers.value.filter((speler) => {
    const name = speler.name?.toLowerCase() || '';
    const countryName = getCountryName(speler.country || '').toLowerCase();
    const homecourseName = speler.expand?.homecourse?.name?.toLowerCase() || '';

    return name.includes(query) || countryName.includes(query) || homecourseName.includes(query);
  });
});

const navigateToSpeler = (id) => {
  void router.push(`/spelers/${id}`);
};

// Haal alle landen op met paginering
const fetchAllCountries = async () => {
  const allCountries: Country[] = [];
  let page = 1;
  const perPage = 100;
  let totalPages = 1;
  do {
    const result = await pb.collection('countries').getList(page, perPage);
    allCountries.push(
      ...result.items.map((item: Record<string, unknown>) => ({
        id: typeof item.id === 'string' ? item.id : '',
        name: typeof item.name === 'string' ? item.name : '',
        flag: typeof item.flag === 'string' ? item.flag : '',
      })),
    );
    totalPages = result.totalPages;
    page++;
  } while (page <= totalPages);
  return allCountries;
};

onMounted(async () => {
  try {
    // Haal spelers en landen parallel op
    const [spelersResult, landen] = await Promise.all([
      pb.collection('users').getList(1, 50, {
        sort: 'name',
        expand: 'homecourse',
      }),
      fetchAllCountries(),
    ]);

    spelers.value = spelersResult.items;

    // Voeg landen toe aan de countries ref
    landen.forEach((land) => {
      countries.value[land.id] = land;
    });

    // Voeg eventueel landen toe die niet in de landenlijst zitten (fallback)
    const uniqueCountryIds = Array.from(
      new Set(spelers.value.map((s) => s.country).filter(Boolean)),
    );
    uniqueCountryIds.forEach((id) => {
      if (!countries.value[id]) {
        countries.value[id] = { id, name: id, flag: '' };
      }
    });
  } catch (error) {
    debug('Error loading data:', error);
    $q.notify({
      color: 'negative',
      message: $customT('players.loadError'),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
});
</script>
