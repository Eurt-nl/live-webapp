<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h4">{{ $customT('courses.title') }}</div>
    </div>

    <!-- Zoekveld voor banen -->
    <div class="row q-mb-md">
      <div class="col-12">
        <q-input
          v-model="searchQuery"
          :placeholder="$customT('courses.searchPlaceholder')"
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

    <!-- Banenlijst, gefilterd op land indien geselecteerd -->
    <div class="row q-col-gutter-md">
      <div v-for="baan in filteredBanen" :key="baan.id" class="col-12 col-sm-6 col-md-4">
        <q-card class="cursor-pointer" @click="navigateToBaan(baan.id)" style="position: relative">
          <!-- Landen vlaggetje in de hoek -->
          <div style="position: absolute; top: 8px; right: 8px; z-index: 1">
            <img
              v-if="getCountryFlag(baan.country)"
              :src="'data:image/png;base64,' + getCountryFlag(baan.country)"
              :alt="getCountryName(baan.country)"
              width="20"
              height="14"
              :title="getCountryName(baan.country)"
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
              {{ getCountryName(baan.country).substring(0, 2).toUpperCase() }}
            </div>
          </div>

          <q-card-section class="row items-center">
            <q-avatar size="48px" class="q-mr-md">
              <img :src="getLogoUrl(baan)" />
            </q-avatar>
            <div class="flex-grow-1">
              <div class="text-h6">{{ baan.name }}</div>
              <div class="text-caption text-grey">
                {{ baan.city }}, {{ getCountryName(baan.country) }}
                <span v-if="userLocation && baan.gps" class="text-primary">
                  | <q-icon name="location_on" size="12px" />
                  {{ formatDistance(getDistance(baan.gps, userLocation)) }}
                </span>
              </div>
              <!-- Categorie -->
              <div v-if="baan.expand?.category?.name" class="text-caption text-grey-6 q-mt-xs">
                {{ baan.expand.category.name }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Geen banen gevonden bericht -->
    <div v-if="filteredBanen.length === 0" class="text-center q-pa-lg">
      <q-icon name="golf_course" size="64px" color="grey-4" />
      <div class="text-h6 text-grey-6 q-mt-md">
        {{
          searchQuery.trim()
            ? $customT('courses.noCoursesFound')
            : $customT('courses.noCoursesFound')
        }}
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { getFileUrl } from 'src/utils/pocketbase-helpers';
import type { Course, Country } from 'src/components/models';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useLocationStore } from 'stores/location';
import { useLocationFocus } from 'src/composables/useLocationFocus';

const { t: $customT } = useI18n();
const router = useRouter();
const { pb } = usePocketbase();
const banen = ref<Course[]>([]);
const countries = ref<Record<string, Country>>({});
const searchQuery = ref('');
const userLocation = ref<{ latitude: number; longitude: number } | null>(null);
const locationStore = useLocationStore();

// Setup focus-based locatie ophaling
useLocationFocus();

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

// Formatteer afstand in leesbare vorm
const formatDistance = (distance: number): string => {
  if (distance === Infinity) return $customT('courses.unknownDistance');
  if (distance < 1) return `${Math.round(distance * 1000)}m`;
  if (distance < 10) return `${distance.toFixed(1)}km`;
  return `${Math.round(distance)}km`;
};

// Sorteer banen op afstand tot gebruiker (indien locatie bekend)
const sortedBanen = computed(() => {
  if (!userLocation.value) return banen.value;
  return [...banen.value].sort((a, b) => {
    const distA = getDistance(a.gps, userLocation.value);
    const distB = getDistance(b.gps, userLocation.value);
    return distA - distB;
  });
});

// Filter de banen op zoekquery
const filteredBanen = computed(() => {
  const lijst = sortedBanen.value;
  if (!searchQuery.value.trim()) return lijst;

  const query = searchQuery.value.toLowerCase().trim();
  return lijst.filter((baan) => {
    const name = baan.name.toLowerCase();
    const city = baan.city.toLowerCase();
    const countryName = getCountryName(baan.country).toLowerCase();

    return name.includes(query) || city.includes(query) || countryName.includes(query);
  });
});

const getLogoUrl = (baan: Course) => {
  if (baan.logo) {
    return getFileUrl('courses', baan.id, baan.logo);
  }
  return 'https://cdn.quasar.dev/img/parallax2.jpg';
};

const navigateToBaan = (id: string) => {
  // Navigatie belooft een Promise, maar we hoeven het resultaat niet af te handelen
  void router.push(`/banen/${id}`);
};

// Haversine-formule voor afstand tussen twee punten (in km)
function getDistance(
  gps: { latitude: number; longitude: number },
  loc: { latitude: number; longitude: number },
) {
  if (!gps || typeof gps.latitude !== 'number' || typeof gps.longitude !== 'number')
    return Infinity;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(gps.latitude - loc.latitude);
  const dLon = toRad(gps.longitude - loc.longitude);
  const lat1 = toRad(loc.latitude);
  const lat2 = toRad(gps.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Haal alle landen op met paginering
const fetchAllCountries = async () => {
  const allCountries: Country[] = [];
  let page = 1;
  const perPage = 100;
  let totalPages = 1;
  do {
    const result = await pb.collection('countries').getList(page, perPage);
    // Map elk record expliciet naar Country
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

// Functie om alle banen op te halen met paginering via PocketBase SDK
const fetchAllCourses = async () => {
  const allCourses: Course[] = [];
  let page = 1;
  const perPage = 100;
  let totalPages = 1;
  do {
    const result = await pb.collection('courses').getList(page, perPage, {
      sort: 'name',
      expand: 'category', // Breid categorie uit om iconen op te halen
    });
    // Map elk record expliciet naar Course (alle verplichte velden)
    allCourses.push(
      ...result.items.map((item: Record<string, unknown>) => ({
        id: typeof item.id === 'string' ? item.id : '',
        name: typeof item.name === 'string' ? item.name : '',
        city: typeof item.city === 'string' ? item.city : '',
        country: typeof item.country === 'string' ? item.country : '',
        gps: item.gps as { latitude: number; longitude: number },
        logo: typeof item.logo === 'string' ? item.logo : '',
        header: typeof item.header === 'string' ? item.header : '',
        header_image: typeof item.header_image === 'string' ? item.header_image : '',
        email: typeof item.email === 'string' ? item.email : '',
        website: typeof item.website === 'string' ? item.website : '',
        owner: typeof item.owner === 'string' ? item.owner : '',
        moderators: Array.isArray(item.moderators) ? (item.moderators as string[]) : [],
        category: typeof item.category === 'string' ? item.category : '',
        collectionId:
          item.collectionId && typeof item.collectionId === 'string'
            ? item.collectionId
            : undefined,
        collectionName:
          item.collectionName && typeof item.collectionName === 'string'
            ? item.collectionName
            : undefined,
        role:
          item.role && typeof item.role === 'string'
            ? (item.role as 'owner' | 'moderator')
            : undefined,
        expand: item.expand as { category?: { id: string; name: string; icon?: string } },
      })),
    );
    totalPages = result.totalPages;
    page++;
  } while (page <= totalPages);
  return allCourses;
};

// Bij het laden van de pagina of bij handmatig verversen:
async function fetchUserLocationAndBanen() {
  // Locatie wordt nu automatisch opgehaald door useLocationFocus
  // Gebruik locationStore.userLocation voor filtering/sortering van banen
  userLocation.value = locationStore.userLocation;
  try {
    // Haal alle banen op (met paginering)
    banen.value = await fetchAllCourses();

    // Haal alle landen op (met paginering)
    const landen = await fetchAllCountries();
    landen.forEach((land) => {
      countries.value[land.id] = land;
    });

    // Voeg eventueel landen toe die niet in de landenlijst zitten (fallback)
    const uniqueCountryIds = Array.from(new Set(banen.value.map((b) => b.country).filter(Boolean)));
    uniqueCountryIds.forEach((id) => {
      if (!countries.value[id]) {
        countries.value[id] = { id, name: id, flag: '' };
      }
    });
  } catch {
    // Silent error handling
  }
}

onMounted(async () => {
  await fetchUserLocationAndBanen();
});
</script>
