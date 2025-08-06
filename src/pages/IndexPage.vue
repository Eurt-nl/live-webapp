<template>
  <q-page class="q-pa-md">
    <div class="column q-gutter-y-md" style="max-width: 800px; width: 100%; margin: 0 auto">
      <!-- Logo en "is live!" tekst -->
      <div class="row items-center justify-center q-mb-md" style="width: 100%">
        <div class="row items-center">
          <img src="/logo.png" alt="Logo" style="max-width: 150px; height: auto" />
          <div
            class="text-h2 text-negative q-ml-md"
            style="font-weight: bold; font-family: 'Caveat', cursive"
          >
            {{ $customT('app.isLive') }}
          </div>
        </div>
      </div>

      <!-- About this app knop -->
      <div class="row justify-center q-mb-md">
        <q-btn
          color="primary"
          :label="$customT('home.aboutThisApp')"
          icon="info"
          @click="showInfoDialog = true"
          class="q-px-lg"
        />
      </div>

      <!-- Sectie voor ingelogde gebruikers -->
      <div v-if="authStore.isAuthenticated" class="row q-col-gutter-md full-width custom-gutter">
        <div class="col-12">
          <q-card>
            <q-card-section class="q-pa-md">
              <div class="text-h6 text-center">{{ $customT('home.whatToDo') }}</div>
              <div class="row q-col-gutter-sm q-mt-md">
                <!-- Marker knop verborgen, code blijft staan voor later gebruik -->
                <!--
                <div class="col-6">
                  <q-btn
                    color="primary"
                    class="full-width"
                    label="Marker"
                    icon="qr_code_scanner"
                    to="/marker-scan"
                  />
                </div>
                -->
                <div class="col-12">
                  <q-btn
                    color="secondary"
                    class="full-width"
                    :label="$customT('home.startPracticeRound')"
                    @click="
                      () => {
                        console.log('DEBUG: start practice round button clicked');
                        openPracticeRoundDialog();
                      }
                    "
                  />
                </div>
              </div>

              <!-- Events sectie: altijd tonen, ook als leeg -->
              <div class="q-mt-md">
                <q-separator class="q-my-md" />
                <div class="text-subtitle2 text-center q-mb-sm">
                  {{ $customT('home.nearbyEvents') }}
                </div>
                <div v-if="visibleNearbyEvents.length > 0" class="row q-col-gutter-sm">
                  <div v-for="event in visibleNearbyEvents" :key="event.id" class="col-12">
                    <q-btn
                      :color="getEventBtnColor(event)"
                      class="full-width"
                      :label="getEventBtnLabel(event)"
                      :icon="getEventIcon(event)"
                      :disable="!hasActiveRoundForEvent(event.id) && hasReachedMaxRounds(event.id)"
                      @click="handleEventButtonClick(event)"
                    >
                      <q-badge
                        v-if="event.starttime"
                        color="white"
                        text-color="primary"
                        floating
                        rounded
                      >
                        {{ formatTime(event.starttime) }}
                      </q-badge>
                    </q-btn>
                  </div>
                </div>
                <div v-else class="text-center text-grey q-mt-md">
                  {{ $customT('home.noNearbyEvents') }}
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Sectie voor niet-ingelogde gebruikers -->
      <div v-else class="row q-col-gutter-md full-width custom-gutter">
        <div class="col-12">
          <q-card>
            <q-card-section class="q-pa-md">
              <div class="text-h6 text-center q-mb-md">{{ $customT('auth.welcome') }}</div>
              <div class="text-body1 text-center q-mb-lg">
                {{ $customT('home.guestMessage') }}
              </div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <q-btn
                    color="primary"
                    class="full-width"
                    :label="$customT('auth.login')"
                    icon="login"
                    to="/auth/login"
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-btn
                    color="secondary"
                    class="full-width"
                    :label="$customT('auth.register')"
                    icon="person_add"
                    to="/auth/register"
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Info dialog over de app -->
      <q-dialog v-model="showInfoDialog" maximized>
        <q-card>
          <q-card-section class="q-pa-lg">
            <div class="row items-center justify-between q-mb-md">
              <div class="text-h5">{{ $customT('home.infoAboutApp') }}</div>
              <q-btn flat round icon="close" @click="showInfoDialog = false" />
            </div>

            <div class="info-content q-gutter-y-lg">
              <!-- Wat doet deze app -->
              <div>
                <div class="text-h6 q-mb-sm">{{ $customT('home.whatDoesAppDo') }}</div>
                <div class="text-body1 q-mb-md">{{ $customT('home.appDescription') }}</div>
                <ul class="q-mb-md">
                  <li>{{ $customT('home.appFeature1') }}</li>
                  <li>{{ $customT('home.appFeature2') }}</li>
                  <li>{{ $customT('home.appFeature3') }}</li>
                </ul>
                <div class="text-body2 text-grey">{{ $customT('home.appNote') }}</div>
              </div>

              <q-separator />

              <!-- Hoe werkt het -->
              <div>
                <div class="text-h6 q-mb-sm">{{ $customT('home.howItWorks') }}</div>
                <div class="text-body1 q-gutter-y-sm">
                  <div>{{ $customT('home.howItWorks1') }}</div>
                  <div>{{ $customT('home.howItWorks2') }}</div>
                  <div class="q-ml-md">
                    <div>• {{ $customT('home.howItWorks3') }}</div>
                    <div>• {{ $customT('home.howItWorks4') }}</div>
                  </div>
                  <div>{{ $customT('home.howItWorks5') }}</div>
                  <div class="q-ml-md">
                    <div>• {{ $customT('home.howItWorks6') }}</div>
                    <div>• {{ $customT('home.howItWorks7') }}</div>
                  </div>
                  <div>{{ $customT('home.howItWorks8') }}</div>
                  <div>{{ $customT('home.howItWorks9') }}</div>
                </div>
              </div>

              <q-separator />

              <!-- Wie maakt de events aan -->
              <div>
                <div class="text-h6 q-mb-sm">{{ $customT('home.whoCreatesEvents') }}</div>
                <div class="text-body1 q-gutter-y-sm">
                  <div>{{ $customT('home.whoCreatesEvents1') }}</div>
                  <div>{{ $customT('home.whoCreatesEvents2') }}</div>
                  <div>{{ $customT('home.whoCreatesEvents3') }}</div>
                  <div>{{ $customT('home.whoCreatesEvents4') }}</div>
                  <div>{{ $customT('home.whoCreatesEvents5') }}</div>
                  <div class="text-weight-medium q-mt-md">
                    {{ $customT('home.whoCreatesEvents6') }}
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              :label="$customT('common.close')"
              color="primary"
              @click="showInfoDialog = false"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Herbruikbare dialog voor oefenronde aanmaken (alleen voor ingelogde gebruikers) -->
      <PracticeRoundDialog
        v-if="authStore.isAuthenticated"
        v-model="showPracticeDialog"
        :courses="filteredCourses"
        :defaultCourseId="defaultCourseId"
        @round-created="onPracticeRoundCreated"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from 'stores/auth';
import PracticeRoundDialog from 'src/components/PracticeRoundDialog.vue';
import { debug } from 'src/utils/debug';
import { useLocationStore } from 'stores/location';
import { useRoundsStore } from 'stores/rounds';
import { usePracticeRoundDialog } from 'src/composables/usePracticeRoundDialog';

const $q = useQuasar();
const router = useRouter();
const pb = usePocketbase();
const authStore = useAuthStore();
const locationStore = useLocationStore();
const roundsStore = useRoundsStore();
const { t: $customT } = useI18n(); // Centrale store voor rondes

// Gebruik de centrale composable voor oefenronde-dialog
const {
  showPracticeDialog,
  filteredCourses,
  defaultCourseId,
  openPracticeRoundDialog,
  onPracticeRoundCreated,
} = usePracticeRoundDialog();

const showInfoDialog = ref(false);
const allEvents = ref([]);
const loading = ref(false);

// Computed property voor events in de buurt
const nearbyEvents = computed(() => {
  if (!locationStore.userLocation || allEvents.value.length === 0) return [];

  const now = new Date();
  const thirtyMinutes = 30 * 60 * 1000; // 30 minuten in milliseconden

  return allEvents.value
    .filter((event) => {
      // Filter op afstand (300m = 0.3km)
      if (event.expand?.course?.[0]?.gps) {
        const distance = getDistance(
          locationStore.userLocation.latitude,
          locationStore.userLocation.longitude,
          event.expand.course[0].gps.latitude,
          event.expand.course[0].gps.longitude,
        );
        if (distance > 0.3) return false; // Meer dan 300m
      }

      // Filter op datum (vandaag)
      if (event.startdate) {
        const eventDate = new Date(event.startdate);
        const today = new Date();
        if (eventDate.toDateString() !== today.toDateString()) return false;
      }

      // Filter op tijd (30 minuten marge voor en na)
      if (event.starttime) {
        const eventTime = new Date(event.starttime);
        const timeDiff = Math.abs(eventTime.getTime() - now.getTime());
        if (timeDiff > thirtyMinutes) return false;
      } else {
        // Als er geen specifieke tijd is, toon het event alleen op de datum
        // (geen tijdfiltering)
      }

      return true;
    })
    .sort((a, b) => {
      // Sorteer op tijd van aanvang
      if (a.starttime && b.starttime) {
        return new Date(a.starttime).getTime() - new Date(b.starttime).getTime();
      }
      return 0;
    });
});

// Computed property: alleen events tonen waarvoor de knop zichtbaar mag zijn
const visibleNearbyEvents = computed(() =>
  nearbyEvents.value.filter(
    (event) => !hasReachedMaxRounds(event.id) || hasActiveRoundForEvent(event.id),
  ),
);

// Functie om afstand tussen twee GPS-punten te berekenen (Haversine-formule)
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

// Functie om tijd te formatteren
function formatTime(timeString: string): string {
  if (!timeString) return '';
  const time = new Date(timeString);
  return time.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Functie om een event ronde te starten
async function startEventRound(event: Record<string, unknown>) {
  try {
    // Controleer of gebruiker al een actieve ronde heeft of het maximaal aantal ronden heeft bereikt
    if (hasActiveRoundForEvent(event.id as string) || hasReachedMaxRounds(event.id as string)) {
      const message = $customT('home.activeRoundWarning', { rounds: event.rounds });
      $q.notify({
        color: 'warning',
        message,
        icon: 'warning',
        timeout: 5000,
      });
      return;
    }
    // Maak een nieuwe ronde aan met event_id en juiste statusvelden
    const roundData = {
      course: event.course[0],
      created_by: authStore.user?.id,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toISOString(),
      event: event.id,
      player: authStore.user?.id,
      public: false,
      notes: `Event: ${event.name && typeof event.name === 'string' ? event.name : 'Unknown Event'}`,
      is_active: true, // Nieuwe eventronde is actief
      is_finalized: false, // Nog niet afgerond
    };
    const newRound = await pb.collection('rounds').create(roundData);
    roundsStore.addRound(newRound);

    // Toon melding over telefoon op stil zetten
    $q.notify({
      color: 'info',
      message: $customT('common.silencePhoneMessage'),
      icon: 'volume_off',
      timeout: 8000,
      position: 'top',
    });

    $q.notify({
      color: 'positive',
      message: $customT('home.eventRoundStarted', { eventName: event.name }),
      icon: 'check',
    });
    void router.push({ name: 'ronde-scores', params: { id: newRound.id } });
  } catch (error) {
    debug('Fout bij starten event ronde:', error);
    $q.notify({
      color: 'negative',
      message: $customT('home.eventRoundError'),
      icon: 'error',
    });
  }
}

// Functie om gebruikerslocatie op te halen (voor ingelogde gebruikers)
function getUserLocation(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocatie niet beschikbaar'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        locationStore.setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        resolve();
      },
      (error) => {
        debug.warn('Kon locatie niet ophalen:', error);
        locationStore.setLocation(null);
        resolve(); // Resolve zonder locatie
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minuten cache
      },
    );
  });
}

// Functie om alle events op te halen
async function loadEvents() {
  try {
    loading.value = true;

    const result = await pb.collection('events').getList(1, 50, {
      sort: 'startdate',
      expand: 'course,status',
      filter: 'is_open = true', // Alleen open events
    });

    allEvents.value = result.items;
  } catch (error) {
    debug('Fout bij laden events:', error);
  } finally {
    loading.value = false;
  }
}

// Helpers vervangen door store-getters
function hasActiveRoundForEvent(eventId: string): boolean {
  return roundsStore.hasActiveRoundForEvent(eventId);
}

function getActiveRoundForEvent(eventId: string) {
  return roundsStore.getActiveRoundForEvent(eventId);
}

// Functie om te controleren of gebruiker het maximaal aantal ronden heeft bereikt
function hasReachedMaxRounds(eventId: string): boolean {
  const event = allEvents.value.find((e) => e.id === eventId);
  if (!event || !event.rounds) return false;

  // Tel alle rondes (actief en afgerond) voor dit event
  const userRoundsForEvent = roundsStore.rounds.filter((round) => round.event === eventId);
  return userRoundsForEvent.length >= event.rounds;
}

// Nieuwe click handler voor eventknoppen
async function handleEventButtonClick(event: Record<string, unknown>) {
  if (hasActiveRoundForEvent(event.id as string)) {
    const activeRound = getActiveRoundForEvent(event.id as string);
    // Debug: toon de gevonden actieve ronde in de console
    console.log('DEBUG: activeRound', activeRound);
    if (activeRound) {
      void router.push({ name: 'ronde-scores', params: { id: activeRound.id } });
    }
    return;
  }
  if (hasReachedMaxRounds(event.id as string)) {
    // Doe niets, knop is disabled
    return;
  }
  // Start een nieuwe eventronde
  await startEventRound(event);
}

// Helper voor knopkleur
function getEventBtnColor(event: Record<string, unknown>): string {
  if (hasActiveRoundForEvent(event.id as string)) return 'positive';
  if (hasReachedMaxRounds(event.id as string)) return 'grey';
  return 'secondary';
}

// Helper voor knoplabel
function getEventBtnLabel(event: Record<string, unknown>): string {
  if (hasActiveRoundForEvent(event.id as string)) return $customT('home.goToActiveRound');
  if (hasReachedMaxRounds(event.id as string)) return $customT('home.maxRoundsReached');
  return event.name as string;
}

// Helper voor knopicoon
function getEventIcon(event: Record<string, unknown>): string {
  if (hasActiveRoundForEvent(event.id as string)) return 'play_arrow';
  if (hasReachedMaxRounds(event.id as string)) return 'block';
  return 'event';
}

onMounted(async () => {
  // Haal events en alle rondes parallel op via de store
  await Promise.all([loadEvents(), roundsStore.fetchRounds()]);

  // Automatische locatie refresh bij het openen van de app
  try {
    console.log('DEBUG: Automatically refreshing location on app start');
    await locationStore.refreshLocation();
    if (locationStore.userLocation) {
      console.log('DEBUG: Location refreshed successfully:', locationStore.userLocation);
    } else {
      console.log('DEBUG: Location refresh failed or not available');
    }
  } catch (error) {
    console.error('DEBUG: Error refreshing location:', error);
  }

  // Voeg event listener toe voor handmatig locatie ophalen
  window.addEventListener('get-user-location', () => {
    void (async () => {
      try {
        await getUserLocation();
        if (locationStore.userLocation) {
          $q.notify({
            color: 'positive',
            message: $customT('location.locationSuccess'),
            icon: 'my_location',
          });
        } else {
          $q.notify({
            color: 'warning',
            message: $customT('location.locationUnavailable'),
            icon: 'warning',
          });
        }
      } catch {
        $q.notify({
          color: 'negative',
          message: $customT('location.locationError'),
          icon: 'error',
        });
      }
    })();
  });
});
</script>

<style>
.custom-gutter > .col-12 {
  padding-left: 0 !important;
}

.info-content {
  max-height: 70vh;
  overflow-y: auto;
}

.info-content ul {
  margin: 0;
  padding-left: 20px;
}

.info-content li {
  margin-bottom: 8px;
}
</style>
