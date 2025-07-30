<template>
  <div>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h6">{{ $customT('holes.title') }}</div>
      <q-btn color="primary" icon="add" :label="$customT('holes.addHole')" @click="openNewHoleDialog" />
    </div>

    <q-list bordered separator v-if="holes.length > 0">
      <q-slide-item
        v-for="hole in holes"
        :key="hole.id"
        @right="deleteHoleDirect(hole)"
        right-color="negative"
      >
        <template v-slot:right>
          <div class="row items-center">
            <q-icon name="delete" />
          </div>
        </template>
        <q-item>
          <q-item-section>
            <q-item-label>{{ $customT('holes.hole') }} {{ hole.hole }}</q-item-label>
            <q-item-label caption>
              {{ $customT('holes.index') }}: {{ String(hole.hole_index).padStart(2, '0') }} |
              {{ $customT('holes.lengthLabel') }}: {{ String(hole.hole_length).padStart(2, '0') }}m |
              <q-icon
                :name="hole.gps_tee?.latitude ? 'square' : 'square'"
                :color="hole.gps_tee?.latitude ? 'positive' : 'grey'"
                size="xs"
                class="q-mr-sm"
              />
              <q-icon
                :name="hole.gps_green?.latitude ? 'circle' : 'circle'"
                :color="hole.gps_green?.latitude ? 'positive' : 'grey'"
                size="xs"
              />
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn-group flat>
              <q-btn flat round icon="edit" @click="openEditHoleDialog(hole)" />
            </q-btn-group>
          </q-item-section>
        </q-item>
      </q-slide-item>
    </q-list>

    <div v-else class="text-center q-pa-md text-grey">{{ $customT('holes.noHolesYet') }}</div>

    <!-- Dialoog voor toevoegen/bewerken van hole -->
    <q-dialog v-model="holeDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ isNewHole ? $customT('holes.newHole') : $customT('holes.editHole') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit="onHoleSubmit" class="q-gutter-md">
            <q-input
              v-model="holeForm.hole"
              type="number"
              inputmode="numeric"
              :label="$customT('holes.holeNumber')"
              :rules="[
                (val) => !!val || $customT('holes.holeNumberRequired'),
                (val) => val > 0 || $customT('holes.holeNumberPositive'),
                (val) => val <= 18 || $customT('holes.holeNumberMax'),
                (val) => !existingHoleNumbers.includes(val) || $customT('holes.holeNumberExists'),
              ]"
              :disable="!isNewHole"
            />

            <q-input
              v-model="holeForm.hole_index"
              type="number"
              inputmode="numeric"
              :label="$customT('holes.holeIndex')"
              :rules="[
                (val) => !!val || $customT('holes.holeIndexRequired'),
                (val) => val > 0 || $customT('holes.holeIndexPositive'),
                (val) => val <= 18 || $customT('holes.holeIndexMax'),
                (val) => !existingHoleIndexes.includes(val) || $customT('holes.holeIndexExists'),
              ]"
            />

            <q-input
              v-model="holeForm.hole_length"
              type="number"
              inputmode="numeric"
              :label="$customT('holes.length')"
              :rules="[
                (val) => !!val || $customT('holes.lengthRequired'),
                (val) => val >= 15 || $customT('holes.lengthMin'),
                (val) => val <= 90 || $customT('holes.lengthMax'),
              ]"
            />

            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-6">
                <q-btn
                  :color="holeForm.gps_tee.latitude ? 'positive' : 'grey'"
                  icon="square"
                  :label="
                    holeForm.gps_tee.latitude
                      ? $customT('holes.teeLocationSaved')
                      : $customT('holes.teeLocationAdd')
                  "
                  @click="
                    holeForm.gps_tee.latitude ? clearGpsData('tee') : getCurrentLocation('tee')
                  "
                  :loading="gettingLocation"
                  class="full-width"
                />
              </div>
              <div class="col-6">
                <q-btn
                  :color="holeForm.gps_green.latitude ? 'positive' : 'grey'"
                  icon="circle"
                  :label="
                    holeForm.gps_green.latitude
                      ? $customT('holes.greenLocationSaved')
                      : $customT('holes.greenLocationAdd')
                  "
                  @click="
                    holeForm.gps_green.latitude
                      ? clearGpsData('green')
                      : getCurrentLocation('green')
                  "
                  :loading="gettingLocation"
                  class="full-width"
                />
              </div>
            </div>

            <q-input
              v-model="holeForm.calculated_length"
              :label="$customT('holes.calculatedLength')"
              type="number"
              readonly
              outlined
              class="q-mb-md"
              :hint="!hasGpsData ? $customT('holes.calculatedLengthHint') : ''"
            >
              <template v-slot:append>
                <q-icon name="calculate" />
              </template>
            </q-input>

            <div class="q-mb-md">
              <div class="image-upload-container cursor-pointer" @click="triggerImageUpload">
                <q-img
                  v-if="getCurrentImageUrl()"
                  :src="getCurrentImageUrl()"
                  style="height: 200px; width: 100%"
                  class="rounded-borders"
                >
                  <div class="absolute-bottom-right q-pa-sm">
                    <q-btn
                      round
                      color="negative"
                      icon="delete"
                      size="sm"
                      @click.stop="clearImage"
                    />
                  </div>
                </q-img>
                <div v-else class="image-placeholder">
                  <q-icon name="add_photo_alternate" size="48px" />
                  <div class="text-subtitle2 q-mt-sm">{{ $customT('holes.clickToAddPhoto') }}</div>
                </div>
              </div>
              <input
                ref="imageInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleImageUpload"
              />
            </div>

            <div class="row justify-end q-gutter-sm">
              <q-btn :label="$customT('holes.cancel')" color="grey" v-close-popup />
              <q-btn :label="$customT('holes.save')" type="submit" color="primary" :loading="loading" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialoog voor locatie selecteren op kaart -->
    <q-dialog v-model="locationDialog" persistent>
      <q-card style="min-width: 80vw; min-height: 80vh">
        <q-card-section>
          <div class="text-h6">
            {{
              locationType === 'tee'
                ? $customT('holes.selectTeeLocation')
                : $customT('holes.selectGreenLocation')
            }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <LocationPicker
            :center="mapCenter"
            :marker="selectedLocation"
            :marker-color="locationType === 'tee' ? '#FF0000' : '#00FF00'"
            @marker-click="onMarkerClick"
            @map-click="onMapClick"
            style="height: 60vh; width: 100%"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn :label="$customT('holes.cancel')" color="grey" v-close-popup />
          <q-btn
            :label="$customT('holes.confirm')"
            color="primary"
            v-close-popup
            @click="confirmLocation"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Bevestigingsdialoog voor verwijderen -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">{{ $customT('holes.deleteHoleConfirm') }}</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$customT('holes.cancel')" color="grey" v-close-popup />
          <q-btn flat :label="$customT('holes.delete')" color="negative" @click="deleteHole" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { usePocketbase } from 'src/composables/usePocketbase';
import { getFileUrl } from 'src/utils/pocketbase-helpers';
import { debug } from 'src/utils/debug';
import LocationPicker from './LocationPicker.vue';

const props = defineProps<{
  courseId: string;
}>();

// Verwijder de emit die we niet meer nodig hebben
// const emit = defineEmits<{
//   (e: 'get-course-location'): void;
// }>();

const $q = useQuasar();
const pb = usePocketbase();

// I18n moet na andere composables worden aangeroepen
const { t: $customT } = useI18n();

const holes = ref([]);
const loading = ref(false);
const holeDialog = ref(false);
const deleteDialog = ref(false);
const isNewHole = ref(false);
const holeToDelete = ref(null);
const gettingLocation = ref(false);

const holeForm = ref({
  hole: null,
  hole_index: null,
  hole_length: null,
  image: null,
  existingImage: null,
  gps_tee: {
    latitude: null,
    longitude: null,
  },
  gps_green: {
    latitude: null,
    longitude: null,
  },
  calculated_length: null,
});

const imageInput = ref<HTMLInputElement | null>(null);
const hasGpsData = computed(() => {
  return holeForm.value.gps_tee.latitude && holeForm.value.gps_green.latitude;
});

const getCurrentImageUrl = () => {
  if (holeForm.value.image instanceof File) {
    return URL.createObjectURL(holeForm.value.image);
  } else if (holeForm.value.existingImage) {
    return getFileUrl('course_detail', holeToDelete.value?.id, holeForm.value.existingImage);
  }
  return '';
};

const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    holeForm.value.image = input.files[0];
    holeForm.value.existingImage = null;
  }
};

const locationDialog = ref(false);
const locationType = ref<'tee' | 'green'>('tee');
const mapMarkers = ref<
  Array<{
    position: { lat: number; lng: number };
    color: string;
  }>
>([]);
const mapCenter = ref({ lat: 52.3676, lng: 4.9041 }); // Amsterdam als standaard
const selectedLocation = ref(null);

// Voeg een ref toe voor de baan locatie
const courseLocation = ref<{ lat: number; lng: number } | null>(null);

const openLocationDialog = (type: 'tee' | 'green') => {
  locationType.value = type;
  locationDialog.value = true;

  // Als er al een locatie is, toon deze op de kaart
  const existingLocation = type === 'tee' ? holeForm.value.gps_tee : holeForm.value.gps_green;
  if (existingLocation?.latitude) {
    mapCenter.value = {
      lat: existingLocation.latitude,
      lng: existingLocation.longitude,
    };
    mapMarkers.value = [
      {
        position: mapCenter.value,
        color: type === 'tee' ? 'red' : 'green',
      },
    ];
  } else if (courseLocation.value) {
    // Als er geen bestaande locatie is maar wel een baan locatie, gebruik die
    mapCenter.value = courseLocation.value;
    mapMarkers.value = [];
    debug('Kaart gecentreerd op baan locatie:', courseLocation.value);
  } else {
    // Als er geen baan locatie is, probeer deze eerst te laden
    void loadCourseLocation().then(() => {
      if (courseLocation.value) {
        mapCenter.value = courseLocation.value;
        debug('Baan locatie geladen en kaart gecentreerd:', courseLocation.value);
      } else {
        // Als er geen baan locatie is, gebruik standaard locatie
        mapCenter.value = { lat: 52.3676, lng: 4.9041 }; // Amsterdam als standaard
      }
    });
    mapMarkers.value = [];
  }
};

const onMapClick = (position) => {
  selectedLocation.value = position;
};

const onMarkerClick = (position: { lat: number; lng: number }) => {
  selectedLocation.value = position;
};

const confirmLocation = () => {
  debug('Selected location:', selectedLocation.value); // Debug log
  if (selectedLocation.value) {
    if (locationType.value === 'tee') {
      holeForm.value.gps_tee = {
        latitude: selectedLocation.value.lat,
        longitude: selectedLocation.value.lng,
      };
      debug('Updated tee location:', holeForm.value.gps_tee); // Debug log
    } else {
      holeForm.value.gps_green = {
        latitude: selectedLocation.value.lat,
        longitude: selectedLocation.value.lng,
      };
      debug('Updated green location:', holeForm.value.gps_green); // Debug log
    }

    // Bereken de afstand als beide locaties aanwezig zijn
    if (holeForm.value.gps_tee?.latitude && holeForm.value.gps_green?.latitude) {
      calculateDistance();
    }

    locationDialog.value = false;
    selectedLocation.value = null;
  }
};

const getCurrentLocation = (type) => {
  locationType.value = type;
  openLocationDialog(type);
};

const calculateDistance = () => {
  if (!holeForm.value.gps_tee || !holeForm.value.gps_green) return;

  // Haversine formule voor horizontale afstand
  const R = 6371e3; // Straal van de aarde in meters
  const φ1 = (holeForm.value.gps_tee.latitude * Math.PI) / 180;
  const φ2 = (holeForm.value.gps_green.latitude * Math.PI) / 180;
  const Δφ =
    ((holeForm.value.gps_green.latitude - holeForm.value.gps_tee.latitude) * Math.PI) / 180;
  const Δλ =
    ((holeForm.value.gps_green.longitude - holeForm.value.gps_tee.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const horizontalDistance = R * c; // Horizontale afstand in meters

  // Update de berekende afstand (alleen horizontale afstand)
  holeForm.value.calculated_length = Math.round(horizontalDistance);
};

const existingHoleNumbers = computed(() => {
  if (!isNewHole.value && holeForm.value.hole) {
    return holes.value.filter((h) => h.id !== holeToDelete.value?.id).map((h) => h.hole);
  }
  return holes.value.map((h) => h.hole);
});

const existingHoleIndexes = computed(() => {
  if (!isNewHole.value && holeForm.value.hole_index) {
    return holes.value.filter((h) => h.id !== holeToDelete.value?.id).map((h) => h.hole_index);
  }
  return holes.value.map((h) => h.hole_index);
});

const loadHoles = async () => {
  try {
    loading.value = true;

    // Wacht even om te voorkomen dat er te snel achter elkaar requests worden gedaan
    await new Promise((resolve) => setTimeout(resolve, 100));

    const result = await pb.collection('course_detail').getList(1, 50, {
      filter: `course = "${props.courseId}"`,
      sort: 'hole',
      requestKey: `holes-${props.courseId}`, // Unieke request key per course
    });

    if (result && result.items) {
      holes.value = result.items.map((hole) => ({
        ...hole,
        hole_length: Number(hole.hole_length) || 0,
        gps_tee: hole.gps_tee || { latitude: null, longitude: null },
        gps_green: hole.gps_green || { latitude: null, longitude: null },
      }));
    }
  } catch (error) {
    if (error.message?.includes('autocancelled')) {
      debug('Request was autocancelled, retrying...');
      // Wacht iets langer voordat we opnieuw proberen
      await new Promise((resolve) => setTimeout(resolve, 500));
      return loadHoles();
    }

    debug('Error loading holes:', error);
    $q.notify({
      color: 'negative',
      message: $customT('notifications.loadDataError'),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

const openNewHoleDialog = () => {
  isNewHole.value = true;
  holeForm.value = {
    hole: null,
    hole_index: null,
    hole_length: null,
    image: null,
    existingImage: null,
    gps_tee: {
      latitude: null,
      longitude: null,
    },
    gps_green: {
      latitude: null,
      longitude: null,
    },
    calculated_length: null,
  };
  holeDialog.value = true;
};

const openEditHoleDialog = async (hole) => {
  isNewHole.value = false;
  holeToDelete.value = hole;

  // Controleer of de afbeelding nog bestaat
  let existingImage = null;
  if (hole.image) {
    try {
      const fileUrl = getFileUrl('course_detail', hole.id, hole.image);
      const response = await fetch(fileUrl);
      if (response.ok) {
        existingImage = hole.image;
      }
    } catch (error) {
      debug('Error checking image:', error);
    }
  }

  holeForm.value = {
    hole: hole.hole,
    hole_index: hole.hole_index,
    hole_length: hole.hole_length,
    image: null,
    existingImage: existingImage,
    gps_tee: hole.gps_tee || { latitude: null, longitude: null },
    gps_green: hole.gps_green || { latitude: null, longitude: null },
    calculated_length: hole.calculated_length,
  };
  holeDialog.value = true;
};

const onHoleSubmit = async () => {
  try {
    loading.value = true;
    const formData = new FormData();

    formData.append('course', props.courseId);
    formData.append('hole', holeForm.value.hole.toString());
    formData.append('par', '3');
    formData.append('hole_length', holeForm.value.hole_length.toString());
    formData.append('hole_index', holeForm.value.hole_index.toString());
    formData.append('gps_tee', JSON.stringify(holeForm.value.gps_tee));
    formData.append('gps_green', JSON.stringify(holeForm.value.gps_green));

    // Als er een nieuwe afbeelding is, voeg deze toe
    if (holeForm.value.image) {
      formData.append('image', holeForm.value.image);
    }
    // Als er een bestaande afbeelding was en deze is verwijderd, stuur een lege string
    else if (holeForm.value.existingImage === null && !isNewHole.value) {
      formData.append('image', '');
    }

    if (isNewHole.value) {
      await pb.collection('course_detail').create(formData);
    } else {
      await pb.collection('course_detail').update(holeToDelete.value.id, formData);
    }

    $q.notify({
      color: 'positive',
      message: isNewHole.value
        ? $customT('notifications.holeAdded')
        : $customT('notifications.holeUpdated'),
      icon: 'check',
    });

    holeDialog.value = false;
    await loadHoles();
  } catch (error) {
    debug('Error saving hole:', error);
    $q.notify({
      color: 'negative',
      message: $customT('notifications.saveError'),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

const deleteHole = async () => {
  try {
    loading.value = true;
    await pb.collection('course_detail').delete(holeToDelete.value.id);
    $q.notify({
      color: 'positive',
      message: $customT('notifications.holeDeleted'),
      icon: 'check',
    });
    deleteDialog.value = false;
    await loadHoles();
  } catch (error) {
    debug('Error deleting hole:', error);
    $q.notify({
      color: 'negative',
      message: $customT('notifications.deleteError'),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

const triggerImageUpload = () => {
  if (imageInput.value) {
    imageInput.value.click();
  }
};

const clearImage = (e) => {
  e.stopPropagation();
  holeForm.value.image = null;
  holeForm.value.existingImage = null;
};

const clearGpsData = (type: 'tee' | 'green') => {
  if (type === 'tee') {
    holeForm.value.gps_tee = { latitude: null, longitude: null };
  } else {
    holeForm.value.gps_green = { latitude: null, longitude: null };
  }
  holeForm.value.calculated_length = null;
};

const deleteHoleDirect = async (hole) => {
  try {
    loading.value = true;
    await pb.collection('course_detail').delete(hole.id);
    $q.notify({
      color: 'positive',
      message: $customT('notifications.holeDeleted'),
      icon: 'check',
    });
    await loadHoles();
  } catch (error) {
    debug('Error deleting hole:', error);
    $q.notify({
      color: 'negative',
      message: $customT('notifications.deleteError'),
      icon: 'error',
    });
  } finally {
    loading.value = false
  }
};

// Voeg een functie toe om de baan locatie op te halen
const loadCourseLocation = async () => {
  try {
    const course = await pb.collection('courses').getOne(props.courseId);
    if (course.gps && course.gps.latitude && course.gps.longitude) {
      courseLocation.value = {
        lat: course.gps.latitude,
        lng: course.gps.longitude,
      };
      // Update ook de mapCenter zodat deze direct beschikbaar is
      mapCenter.value = courseLocation.value;
      debug('Baan locatie geladen:', courseLocation.value);
    }
  } catch (error) {
    debug('Error loading course location:', error);
  }
};

// Voeg een cleanup functie toe voor de watch
const cleanup = () => {
  // Reset de holes array als de component wordt unmount
  holes.value = [];
};

// Pas de watch aan om de cleanup functie te gebruiken
watch(
  () => props.courseId,
  async (newId) => {
    if (newId) {
      // Laad eerst de baan locatie, dan de holes
      await loadCourseLocation();
      await loadHoles();
    } else {
      cleanup();
    }
  },
  { immediate: true },
);

// Voeg een onUnmounted hook toe
onUnmounted(() => {
  cleanup();
});
</script>

<style lang="scss" scoped>
.hole-image {
  max-width: 100px;
  max-height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.image-upload-container {
  border: 2px dashed #ccc;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--q-primary);
  }
}

.image-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  background-color: #f5f5f5;
}
</style>
