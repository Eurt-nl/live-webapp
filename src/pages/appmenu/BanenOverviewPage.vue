<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h4">{{ $customT('courses.title') }}</div>
    </div>

    <!-- Landenfilter: vlaggen naast elkaar -->
    <div class="row q-gutter-sm q-mb-md" v-if="countryList.length > 0">
      <!-- "Alle landen" optie -->
      <div
        class="cursor-pointer flex flex-center"
        :style="{
          border: selectedCountry === null ? '2px solid #1976d2' : '2px solid transparent',
          padding: '2px',
          width: '34px',
          height: '24px',
        }"
        @click="toggleCountryFilter(null)"
      >
        <q-icon name="public" size="20px" color="primary" />
      </div>

      <!-- Landen vlaggen -->
      <div
        v-for="country in countryList"
        :key="country.id"
        class="cursor-pointer flex flex-center"
        :style="{
          border: selectedCountry === country.id ? '2px solid #1976d2' : '2px solid transparent',
          padding: '2px',
          width: '34px',
          height: '24px',
        }"
        @click="toggleCountryFilter(country.id)"
      >
        <img
          v-if="country.flag"
          :src="'data:image/png;base64,' + country.flag"
          :alt="country.name"
          width="30"
          height="20"
          :title="country.name"
          style="display: block; object-fit: cover; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08)"
          @error="handleFlagError"
        />
        <div
          v-else
          class="flex flex-center"
          style="
            width: 30px;
            height: 20px;
            background: #f0f0f0;
            border-radius: 2px;
            font-size: 10px;
            color: #666;
          "
        >
          {{ country.name.substring(0, 2).toUpperCase() }}
        </div>
      </div>
    </div>

    <!-- Banenlijst, gefilterd op land indien geselecteerd -->
    <div class="row q-col-gutter-md">
      <div v-for="baan in filteredBanen" :key="baan.id" class="col-12 col-sm-6 col-md-4">
        <q-card class="cursor-pointer" @click="navigateToBaan(baan.id)">
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
              <!-- Categorie tekst -->
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
          selectedCountry
            ? $customT('courses.noCoursesInCountry')
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
import pb from 'src/config/pocketbase';
import { useLocationStore } from 'stores/location';

const { t: $customT } = useI18n();
const router = useRouter();
const banen = ref<Course[]>([]);
const countries = ref<Record<string, Country>>({});
const countryList = ref<Country[]>([]);
const selectedCountry = ref<string | null>(null);
const userLocation = ref<{ latitude: number; longitude: number } | null>(null);
const locationStore = useLocationStore();

// Haal de naam van het land op basis van het id
const getCountryName = (countryId: string) => {
  return countries.value[countryId]?.name || countryId;
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

// Filter de banen op geselecteerd land
const filteredBanen = computed(() => {
  const lijst = sortedBanen.value;
  if (!selectedCountry.value) return lijst;
  return lijst.filter((baan) => baan.country === selectedCountry.value);
});

// Toggle filter: klik op vlag activeert of deactiveert filter
const toggleCountryFilter = (countryId: string | null) => {
  selectedCountry.value = countryId;
};

const handleFlagError = (event: Event) => {
  console.warn('Flag image failed to load:', event);
  // Optioneel: vervang de afbeelding met een fallback
  const img = event.target as HTMLImageElement;
  img.style.display = 'none';
  img.nextElementSibling?.classList.remove('hidden');
};

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
  const loc = await locationStore.getOrFetchLocation();
  // Gebruik locationStore.userLocation voor filtering/sortering van banen
  userLocation.value = loc;
  try {
    // Haal alle banen op (met paginering)
    banen.value = await fetchAllCourses();

    // Haal alle landen op (met paginering)
    const landen = await fetchAllCountries();
    landen.forEach((land) => {
      countries.value[land.id] = land;
    });

    // Verzamel unieke country-ids uit de banen
    const uniqueCountryIds = Array.from(new Set(banen.value.map((b) => b.country).filter(Boolean)));

    // Filter de landen die bij de banen horen
    countryList.value = landen.filter((land) => uniqueCountryIds.includes(land.id));

    // Voeg eventueel landen toe die niet in de landenlijst zitten (fallback)
    uniqueCountryIds.forEach((id) => {
      if (!countries.value[id]) {
        countryList.value.push({ id, name: id, flag: '' });
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
