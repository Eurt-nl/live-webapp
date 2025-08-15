<template>
  <div class="rafi-chat">
    <!-- Header met baan informatie -->
    <div class="rafi-header q-pa-md">
      <div class="row items-center justify-between">
        <div class="col">
          <div class="text-h6">{{ $customT('rafi.title') }}</div>
          <div v-if="nearestCourse" class="text-body2 text-grey-7">
            {{ $customT('rafi.header.course') }}: {{ nearestCourse.courseName }} ({{
              formatDistance(nearestCourse.distance)
            }})
            <q-badge v-if="localRules.length > 0" color="positive" class="q-ml-sm">
              {{ $customT('rafi.header.localRulesActive') }}
            </q-badge>
          </div>
          <div v-else-if="error" class="text-body2 text-negative">
            {{ error }}
          </div>
          <div v-else-if="!locationStore.userLocation" class="text-body2 text-grey-7">
            {{ $customT('rafi.header.noLocation') }}
            <q-btn
              flat
              dense
              size="sm"
              @click="requestLocation"
              class="q-ml-sm"
              :loading="isLoading"
            >
              {{ $customT('rafi.header.shareLocation') }}
            </q-btn>
          </div>
          <div v-else class="text-body2 text-grey-7">
            {{ $customT('rafi.header.noCourseFound') }}
          </div>
        </div>
        <div class="col-auto">
          <q-btn
            v-if="!nearestCourse && !error"
            icon="refresh"
            flat
            round
            @click="findNearestCourse"
            :loading="isLoading"
            :aria-label="$customT('rafi.messages.courseFound')"
          />
        </div>
      </div>
    </div>

    <!-- Chat berichten -->
    <div class="rafi-messages q-pa-md" ref="messagesContainer">
      <q-chat-message
        v-for="(message, index) in chatMessages"
        :key="index"
        :name="message.sender === 'user' ? authStore.user?.name : 'Rafi'"
        :avatar="message.sender === 'rafi' ? rafiAvatar : undefined"
        :text="[message.text]"
        :sent="message.sender === 'user'"
        :stamp="message.timestamp"
        class="q-mb-md"
      />

      <!-- Loading indicator -->
      <div v-if="rafiLoading" class="text-center q-pa-md">
        <q-spinner-dots color="primary" size="2em" />
        <div class="text-caption q-mt-sm">{{ $customT('rafi.chat.loading') }}</div>
      </div>
    </div>

    <!-- Input gebied -->
    <div class="rafi-input q-pa-md">
      <div class="row items-end q-gutter-sm">
        <div class="col">
          <q-input
            v-model="userInput"
            :placeholder="$customT('rafi.chat.placeholder')"
            :disable="!canType"
            :loading="rafiLoading"
            @keyup.enter="sendMessage"
            autogrow
            outlined
            dense
            :aria-label="$customT('rafi.chat.placeholder')"
          >
            <template v-slot:append>
              <q-btn
                icon="send"
                flat
                round
                :disable="!canSendMessage"
                :loading="rafiLoading"
                @click="sendMessage"
                :aria-label="$customT('rafi.chat.send')"
              />
            </template>
          </q-input>
        </div>
      </div>

      <!-- Foutmelding -->
      <div v-if="rafiError" class="text-negative text-caption q-mt-sm">
        {{ rafiError }}
        <q-btn flat dense size="sm" @click="retryLastMessage" class="q-ml-sm">
          {{ $customT('rafi.chat.retry') }}
        </q-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLocalRules, type LocalRule } from '../composables/useLocalRules';
import { useRafi, type RafiRequest } from '../composables/useRafi';
import { usePocketbase } from '../composables/usePocketbase';
import { useLocationStore } from '../stores/location';
import { useAuthStore } from '../stores/auth';

const { t: $customT } = useI18n();
const { pb } = usePocketbase();

// Composables
const locationStore = useLocationStore();
const authStore = useAuthStore();
const { fetchLocalRules, compactRulesForPrompt, localRules } = useLocalRules();
const { askRafi, rafiLogger, getClientMeta, isLoading: rafiLoading, error: rafiError } = useRafi();

// Reactive data
const nearestCourse = ref<NearestCourse | null>(null);
const userInput = ref('');
const chatMessages = ref<
  Array<{
    sender: 'user' | 'rafi';
    text: string;
    timestamp: string;
  }>
>([]);
const messagesContainer = ref<HTMLElement>();
const lastQuestion = ref('');
const isLoading = ref(false);
const error = ref<string | null>(null);

// Avatars
const rafiAvatar = ref('/public/rafi-avatar.png');

// Computed properties
const canSendMessage = computed(() => {
  return nearestCourse.value && userInput.value.trim().length > 0 && !rafiLoading.value;
});

const canType = computed(() => {
  return nearestCourse.value && !rafiLoading.value;
});

// Types
interface NearestCourse {
  courseId: string;
  courseName: string;
  distance: number;
}

// Methods
const formatDistance = (distance: number): string => {
  const distanceText =
    distance === 1 ? $customT('rafi.messages.meters') : $customT('rafi.messages.metersPlural');
  return `${distance} ${distanceText}`;
};

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// Haversine-formule voor afstandsberekening (hergebruik van usePracticeRoundDialog)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Zoek dichtstbijzijnde baan met bestaande functionaliteit
const findNearestCourse = async (): Promise<NearestCourse | null> => {
  isLoading.value = true;
  error.value = null;

  try {
    // Gebruik de bestaande locatie functionaliteit
    const location = await locationStore.getOrFetchLocation();

    if (!location) {
      error.value = $customT('rafi.geolocation.permissionDenied');
      isLoading.value = false;
      return null;
    }

    const latitude = location.latitude;
    const longitude = location.longitude;

    // Landcode via Nominatim (cache in localStorage) - hergebruik van usePracticeRoundDialog
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

    // Landrecord ophalen - hergebruik van usePracticeRoundDialog
    let country = null;
    if (countryCode) {
      try {
        country = await pb.collection('countries').getFirstListItem(`isoAlpha2 = "${countryCode}"`);
      } catch {
        // Land niet gevonden, gebruik null
      }
    }

    // Banen ophalen en filteren - hergebruik van usePracticeRoundDialog
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
          return distance <= 3; // 3km voor Rafi (meer dan de 300m voor oefenrondes)
        })
        .sort((a, b) => {
          if (!a.gps || !b.gps) return 0;
          const distA = getDistance(latitude, longitude, a.gps.latitude, a.gps.longitude);
          const distB = getDistance(latitude, longitude, b.gps.latitude, b.gps.longitude);
          return distA - distB;
        });
    }

    if (allCourses.length === 0) {
      error.value = $customT('rafi.messages.noCourseNearby');
      isLoading.value = false;
      return null;
    }

    // Neem de dichtstbijzijnde baan (eerste in de lijst, gesorteerd op afstand)
    const nearest = allCourses[0];
    const distance = getDistance(
      location.latitude,
      location.longitude,
      nearest.gps.latitude,
      nearest.gps.longitude,
    );

    const course: NearestCourse = {
      courseId: nearest.id,
      courseName: nearest.name,
      distance: Math.round(distance * 1000), // Convert to meters
    };

    isLoading.value = false;
    return course;
  } catch (err) {
    console.error('Error finding nearest course:', err);
    error.value = $customT('rafi.courses.findError');
    isLoading.value = false;
    return null;
  }
};

// Vraag locatie op na user gesture
const requestLocation = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    await locationStore.refreshLocation();
    const location = await locationStore.getOrFetchLocation();

    if (location) {
      // Nu kunnen we de chat initialiseren
      await initializeChat();
    } else {
      error.value = $customT('rafi.geolocation.permissionDenied');
    }
  } catch (err) {
    console.error('Error requesting location:', err);
    error.value = $customT('rafi.geolocation.unknownError');
  } finally {
    isLoading.value = false;
  }
};

const sendMessage = async () => {
  if (!canSendMessage.value) return;

  const question = userInput.value.trim();
  if (!question) return;

  // Voeg gebruikersbericht toe
  chatMessages.value.push({
    sender: 'user',
    text: question,
    timestamp: new Date().toLocaleTimeString(),
  });

  lastQuestion.value = question;
  userInput.value = '';

  await scrollToBottom();

  // Bereid Rafi request voor
  const request: RafiRequest = {
    question,
    courseId: nearestCourse.value.courseId,
    courseName: nearestCourse.value.courseName,
    localRules: compactRulesForPrompt(localRules.value),
    lang: $customT('app.language') || 'nl',
  };

  // Stuur naar Rafi API
  const response = await askRafi(request);

  if (response) {
    // Voeg Rafi antwoord toe
    chatMessages.value.push({
      sender: 'rafi',
      text: response.answer,
      timestamp: new Date().toLocaleTimeString(),
    });

    // Log chat (als ingeschakeld)
    await rafiLogger.logChat({
      userId: pb.authStore.model?.id,
      courseId: nearestCourse.value.courseId,
      question,
      answer: response.answer,
      usedRules: response.usedRules,
      distance: nearestCourse.value.distance,
      clientMeta: getClientMeta(),
    });
  }

  await scrollToBottom();
};

const retryLastMessage = async () => {
  if (lastQuestion.value) {
    userInput.value = lastQuestion.value;
    await sendMessage();
  }
};

const initializeChat = async () => {
  try {
    // Zoek dichtstbijzijnde baan
    const course = await findNearestCourse();

    if (course) {
      nearestCourse.value = course;

      // Haal lokale regels op
      await fetchLocalRules(course.courseId);
    }
  } catch (error) {
    console.error('Error initializing chat:', error);
  }
};

// Lifecycle
onMounted(async () => {
  try {
    // Alleen initialiseren als er al een locatie is
    if (locationStore.userLocation) {
      await initializeChat();
    } else {
      // No location found, waiting for user gesture
    }
  } catch (error) {
    console.error('Error in RafiChat onMounted:', error);
  }
});

// Watch voor scroll naar beneden bij nieuwe berichten
watch(
  chatMessages,
  () => {
    scrollToBottom();
  },
  { deep: true },
);

// Watch voor locatie wijzigingen
watch(
  () => locationStore.userLocation,
  async (newLocation) => {
    if (newLocation && !nearestCourse.value) {
      // Als er een nieuwe locatie is en er nog geen baan is gevonden, initialiseer de chat
      await initializeChat();
    }
  },
  { immediate: false },
);
</script>

<style scoped>
.rafi-chat {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.rafi-header {
  border-bottom: 1px solid var(--q-separator-color);
  flex-shrink: 0;
}

.rafi-messages {
  flex: 1;
  overflow-y: auto;
  max-height: 60vh;
}

.rafi-input {
  border-top: 1px solid var(--q-separator-color);
  flex-shrink: 0;
}

/* Accessibility improvements */
.rafi-chat:focus-within {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

/* Responsive design */
@media (max-width: 600px) {
  .rafi-messages {
    max-height: 50vh;
  }
}
</style>
