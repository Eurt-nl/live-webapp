import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useLocationStore } from 'stores/location';

// Centrale composable voor oefenronde-dialog
export function usePracticeRoundDialog() {
  const $q = useQuasar();
  const { t: $customT } = useI18n();
  const pb = usePocketbase();
  const locationStore = useLocationStore();

  const showPracticeDialog = ref(false);
  const filteredCourses = ref([]);
  const defaultCourseId = ref('');

  // Open de dialog na ophalen en filteren van banen
  async function openPracticeRoundDialog() {
    console.log('DEBUG: openPracticeRoundDialog (begin)', showPracticeDialog.value);
    // Gebruik de centrale locatie uit de store
    const loc = await locationStore.getOrFetchLocation();
    const latitude = loc?.latitude ?? null;
    const longitude = loc?.longitude ?? null;
    // Landcode via Nominatim (cache in localStorage)
    let countryCode = localStorage.getItem('userCountryCode');
    if (!countryCode && latitude && longitude) {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        {
          headers: { 'User-Agent': 'pnplokaal-app/1.0 (info@pnplokaal.nl)' },
        },
      );
      const data = await resp.json();
      countryCode = data.address?.country_code?.toUpperCase() || '';
      if (countryCode) localStorage.setItem('userCountryCode', countryCode);
    }
    // Landrecord ophalen
    let country = null;
    if (countryCode) {
      try {
        country = await pb.collection('countries').getFirstListItem(`isoAlpha2 = "${countryCode}"`);
      } catch {
        // Land niet gevonden, gebruik null
      }
    }
    // Banen ophalen en filteren
    let allCourses = [];
    if (latitude && longitude && country) {
      const coursesResult = await pb.collection('courses').getList(1, 100, {
        filter: `country = "${country.id}"`,
        sort: 'name',
      });
      allCourses = coursesResult.items;
      allCourses = allCourses
        .filter((course) => {
          if (
            !course.gps ||
            typeof course.gps.latitude !== 'number' ||
            typeof course.gps.longitude !== 'number'
          )
            return false;
          const distance = getDistance(
            latitude,
            longitude,
            course.gps.latitude,
            course.gps.longitude,
          );
          return distance <= 0.3; // 300m
        })
        .sort((a, b) => {
          if (!a.gps || !b.gps) return 0;
          const distA = getDistance(latitude, longitude, a.gps.latitude, a.gps.longitude);
          const distB = getDistance(latitude, longitude, b.gps.latitude, b.gps.longitude);
          return distA - distB;
        });
      filteredCourses.value = allCourses;
      defaultCourseId.value = ''; // Gebruiker moet zelf kiezen
    } else {
      filteredCourses.value = [];
      defaultCourseId.value = '';
      $q.notify({
        color: 'warning',
        message: $customT('practiceRound.noNearbyCourses'),
        icon: 'warning',
      });
    }
    showPracticeDialog.value = true;
    console.log('DEBUG: openPracticeRoundDialog (eind)', showPracticeDialog.value);
  }

  // Haversine-formule
  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Handler voor sluiten van de dialog na aanmaken ronde
  function onPracticeRoundCreated() {
    showPracticeDialog.value = false;
  }

  return {
    showPracticeDialog,
    filteredCourses,
    defaultCourseId,
    openPracticeRoundDialog,
    onPracticeRoundCreated,
  };
}
