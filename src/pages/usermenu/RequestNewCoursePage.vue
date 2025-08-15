<template>
  <div class="q-pa-md">
    <div class="text-h5 q-mb-md">{{ $customT('courses.requestNewCourse') }}</div>

    <!-- Scroll indicator -->
    <div class="scroll-indicator q-mb-md cursor-pointer" @click="scrollToForm">
      <q-icon name="keyboard_arrow_down" size="24px" class="text-grey-6" />
      <div class="text-caption text-grey-6">{{ $customT('courses.scrollForForm') }}</div>
    </div>

    <!-- Informatie tekst -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div
          class="text-body1"
          v-html="
            $customT('courses.courseRequestInfo')
              .replace(/\n\n/g, '</p><p>')
              .replace(/^/, '<p>')
              .replace(/$/, '</p>')
          "
        ></div>
        <div class="q-mt-md">
          <q-btn
            flat
            color="primary"
            icon="list"
            :label="$customT('courses.viewCourseList')"
            @click="navigateToBanenOverview"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Formulier -->
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ $customT('courses.courseRequestForm') }}</div>
        <div class="text-caption text-negative q-mt-sm">
          <q-icon name="info" size="16px" class="q-mr-xs" />
          {{ $customT('courses.allFieldsRequired') }}
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md" ref="formRef">
          <!-- Naam van de baan -->
          <q-input
            v-model="formData.name"
            :label="$customT('courses.name')"
            :rules="[(val) => !!val || $customT('validation.required')]"
            outlined
          />

          <!-- Website -->
          <q-input
            v-model="formData.website"
            :label="$customT('courses.website')"
            :hint="$customT('courses.websiteHint')"
            :rules="[(val) => !!val || $customT('validation.required')]"
            outlined
          />

          <!-- Locatie sectie -->
          <div class="text-subtitle1 q-mb-sm">{{ $customT('courses.selectLocation') }}</div>
          <div class="text-caption text-grey q-mb-sm">
            <q-icon name="help" size="16px" class="q-mr-xs" />
            {{ $customT('courses.locationSearchHint') }}
          </div>

          <!-- Zoek veld -->
          <q-input
            v-model="searchQuery"
            :label="$customT('courses.searchLocation')"
            outlined
            clearable
            @keyup.enter="searchLocation"
          >
            <template v-slot:append>
              <q-btn round dense flat icon="search" @click="searchLocation" />
            </template>
          </q-input>

          <!-- Map container -->
          <div class="map-wrapper" style="height: 400px; border-radius: 8px; overflow: hidden">
            <location-picker
              ref="locationPickerRef"
              :center="mapCenter"
              :marker="selectedLocation"
              marker-color="#FF5722"
              @map-click="onMapClick"
              @update:latitude="onLatitudeUpdate"
              @update:longitude="onLongitudeUpdate"
            />
          </div>

          <!-- Geselecteerde locatie info -->
          <div v-if="selectedLocation" class="text-caption q-mt-sm">
            <div>
              <strong>{{ $customT('courses.selectedLocation') }}:</strong>
            </div>
            <div>Latitude: {{ selectedLocation.lat.toFixed(6) }}</div>
            <div>Longitude: {{ selectedLocation.lng.toFixed(6) }}</div>
          </div>

          <!-- Knoppen -->
          <div class="row justify-end q-gutter-sm q-mt-md">
            <q-btn :label="$customT('common.cancel')" color="grey" @click="goBack" />
            <q-btn
              :label="$customT('courses.submitRequest')"
              type="submit"
              color="secondary"
              :loading="loading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from 'stores/auth';
import LocationPicker from 'src/components/LocationPicker.vue';
import { debug } from 'src/utils/debug';

const $q = useQuasar();
const { t: $customT } = useI18n();
const router = useRouter();
const { pb } = usePocketbase();
const authStore = useAuthStore();

// Form data
const formData = ref({
  name: '',
  website: '',
});

// Map related
const locationPickerRef = ref();
const searchQuery = ref('');
const mapCenter = ref({ lat: 52.3676, lng: 4.9041 }); // Amsterdam als standaard
const selectedLocation = ref<{ lat: number; lng: number } | null>(null);

// UI state
const loading = ref(false);
const formRef = ref();

// Functie om locatie te zoeken
const searchLocation = async () => {
  if (!searchQuery.value.trim()) return;

  try {
    loading.value = true;

    // Gebruik OpenStreetMap Nominatim API voor geocoding
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}&limit=1`,
    );

    const data = await response.json();

    if (data && data.length > 0) {
      const location = data[0];
      const newCenter = {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lon),
      };

      mapCenter.value = newCenter;
      selectedLocation.value = newCenter;

      $q.notify({
        color: 'positive',
        message: $customT('courses.locationFound'),
        icon: 'check',
      });
    } else {
      $q.notify({
        color: 'warning',
        message: $customT('courses.locationNotFound'),
        icon: 'warning',
      });
    }
  } catch (error) {
    debug('Error searching location:', error);
    $q.notify({
      color: 'negative',
      message: $customT('courses.locationSearchError'),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

// Map event handlers
const onMapClick = (position: { lat: number; lng: number }) => {
  selectedLocation.value = position;
};

const onLatitudeUpdate = (lat: number) => {
  if (selectedLocation.value) {
    selectedLocation.value.lat = lat;
  }
};

const onLongitudeUpdate = (lng: number) => {
  if (selectedLocation.value) {
    selectedLocation.value.lng = lng;
  }
};

// Form submission
const onSubmit = async () => {
  debug('onSubmit called');
  debug('Form data:', formData.value);
  debug('Selected location:', selectedLocation.value);

  // Valideer form
  const isValid = await formRef.value?.validate();
  if (!isValid) {
    debug('Form validation failed');
    return;
  }

  if (!selectedLocation.value) {
    $q.notify({
      color: 'warning',
      message: $customT('courses.selectLocationFirst'),
      icon: 'warning',
    });
    return;
  }

  try {
    loading.value = true;
    debug('Loading started, fetching superusers...');

    // Haal superusers op
    let superusersResult = await pb.collection('users').getList(1, 50, {
      filter: 'role.name = "superuser"',
      expand: 'role',
    });

    debug('Superusers found:', superusersResult.items);
    debug('Current user:', authStore.user);

    if (superusersResult.items.length === 0) {
      // Fallback: probeer de gebruiker met email rh.hasper@me.com
      try {
        debug('No superusers found, trying fallback to admin user...');
        const adminUser = await pb
          .collection('users')
          .getFirstListItem('email = "rh.hasper@me.com"');
        debug('Admin gebruiker gevonden via email:', adminUser);

        // Gebruik admin user als superuser
        superusersResult = {
          items: [adminUser],
          page: 1,
          perPage: 1,
          totalItems: 1,
          totalPages: 1,
        };
      } catch (emailError) {
        debug('Ook geen admin gebruiker gevonden via email:', emailError);
        $q.notify({
          color: 'negative',
          message: $customT('courses.noSuperusersFound'),
          icon: 'error',
        });
        return;
      }
    }

    // Maak notificatie data volgens Optie 3 (template + data)
    const notificationData = {
      from_user: authStore.user?.id,
      to_user: superusersResult.items.map((user) => user.id),
      title: `Nieuw baan verzoek: ${formData.value.name}`, // Originele title voor backward compatibility
      body: `
Nieuwe baan aanvraag:

Naam: ${formData.value.name}
Website: ${formData.value.website}
Locatie: ${selectedLocation.value.lat}, ${selectedLocation.value.lng}

Aangevraagd door: ${authStore.user?.name} (${authStore.user?.email})
      `.trim(),
      link: '',
      seen: false,
      // Template en data voor Optie 3
      template: 'course_request',
      data: JSON.stringify({
        courseName: formData.value.name,
        userName: authStore.user?.name,
        website: formData.value.website,
        latitude: selectedLocation.value.lat,
        longitude: selectedLocation.value.lng,
        requested_by: authStore.user?.id,
      }),
      original_language: 'nl', // Nederlandse gebruiker
    };

    debug('Notification data:', notificationData);

    // Maak notificatie aan
    const createdNotification = await pb.collection('notifications').create(notificationData);
    debug('Notification created:', createdNotification);

    $q.notify({
      color: 'positive',
      message: $customT('courses.requestSubmitted'),
      icon: 'check',
    });

    // Ga terug naar de banenlijst
    void router.push('/banen');
  } catch (error) {
    debug('Error submitting course request:', error);
    console.error('Full error details:', error);
    $q.notify({
      color: 'negative',
      message: $customT('courses.requestSubmitError'),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

// Navigatie
const goBack = () => {
  void router.push('/banen');
};

const navigateToBanenOverview = () => {
  void router.push('/banen');
};

// Scroll to form function
const scrollToForm = () => {
  const formElement = document.querySelector('.q-card');
  if (formElement) {
    formElement.scrollIntoView({ behavior: 'smooth' });
  }
};

onMounted(() => {
  // Centreer op huidige locatie als beschikbaar
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        mapCenter.value = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      },
      (error) => {
        debug('Error getting current location:', error);
      },
    );
  }
});
</script>

<style scoped>
.map-wrapper {
  border: 1px solid #ddd;
}

.scroll-indicator {
  text-align: center;
  animation: bounce 2s infinite;
  transition: all 0.3s ease;
}

.scroll-indicator:hover {
  transform: translateY(-2px);
  opacity: 0.8;
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}
</style>
