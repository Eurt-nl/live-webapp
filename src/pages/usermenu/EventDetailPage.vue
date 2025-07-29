<template>
  <!-- Hoofdpagina voor het tonen van eventdetails en inschrijvingen -->
  <div class="q-pa-md">
    <!-- Titelbalk -->
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">Evenement details</div>
    </div>
    <!-- Laadspinner als data wordt opgehaald -->
    <div v-if="loading" class="row justify-center">
      <q-spinner color="primary" size="3em" />
    </div>

    <!-- Eventdetails en inschrijvingen -->
    <div v-else-if="event" class="q-gutter-md">
      <div class="row justify-between items-center">
        <div class="text-h4">{{ event.name }}</div>
        <!-- Statuschip met kleur afhankelijk van status -->
        <q-chip :color="getStatusColor(event.expand?.status?.name)" text-color="white">
          {{ event.expand?.status?.name }}
        </q-chip>
      </div>

      <q-card>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <!-- Baaninformatie -->
            <div class="col-12 col-md-6">
              <div class="text-subtitle2">Baan</div>
              <div class="text-body1">
                {{ event.expand?.course?.[0]?.name || 'Geen baan geselecteerd' }}
              </div>
            </div>
            <!-- Datum -->
            <div class="col-12 col-md-6">
              <div class="text-subtitle2">Datum</div>
              <div class="text-body1">{{ formatDateRange(event.startdate, event.enddate) }}</div>
            </div>
            <!-- Aantal rondes -->
            <div class="col-12 col-md-6">
              <div class="text-subtitle2">Aantal rondes</div>
              <div class="text-body1">{{ event.rounds }}</div>
            </div>
            <!-- Maximaal aantal spelers -->
            <div class="col-12 col-md-6">
              <div class="text-subtitle2">Maximaal aantal spelers</div>
              <div class="text-body1">{{ event.max_players || 'Geen limiet' }}</div>
            </div>
            <!-- Aantal deelnemers -->
            <div class="col-12 col-md-6">
              <div class="text-subtitle2">Aantal deelnemers</div>
              <div class="text-body1">{{ registrationsCount }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Actieknoppen voor inschrijven/uitschrijven/bericht sturen -->
      <div class="row q-mt-md justify-end q-gutter-sm">
        <q-btn
          v-if="canEnroll"
          color="primary"
          label="Inschrijven"
          @click="enrollInEvent"
          :loading="enrolling"
        />
        <q-btn
          v-else-if="!isEventOpen && !isEnrolled"
          color="grey"
          flat
          label="Inschrijven niet mogelijk"
          disable
        >
          <q-tooltip>Dit evenement is momenteel niet open voor inschrijvingen</q-tooltip>
        </q-btn>
        <q-btn
          v-else-if="isEnrolled && canUnenroll"
          color="negative"
          label="Uitschrijven"
          @click="unenrollFromEvent"
          :loading="unenrolling"
        />
        <q-btn
          v-else-if="isEnrolled && !canUnenroll"
          color="grey"
          flat
          label="Uitschrijven niet mogelijk"
          disable
        >
          <q-tooltip>Uitschrijven is alleen mogelijk als het evenement open is</q-tooltip>
        </q-btn>
        <q-btn
          v-else-if="isEnrolled"
          color="primary"
          label="Stuur bericht aan organisatie"
          @click="openNotificationDialog"
        />
        <q-btn flat color="grey" label="Terug" @click="router.back()" />
      </div>

      <!-- Overzicht van inschrijvingen -->
      <div class="q-mt-lg">
        <div class="text-h6 q-mb-md">Inschrijvingen</div>
        <!-- Sorteringsknoppen -->
        <div class="row q-mb-xs q-gutter-sm">
          <div class="col text-center">
            <q-btn
              flat
              dense
              :color="sortBy === 'name' ? 'primary' : 'grey'"
              @click="setSor$customT('name')"
              style="width: 100%"
              >Naam
              <q-icon
                v-if="sortBy === 'name'"
                :name="sortDesc ? 'arrow_downward' : 'arrow_upward'"
                size="16px"
              />
            </q-btn>
          </div>
          <div class="col-auto text-center" style="width: 32px">
            <q-btn
              flat
              dense
              :color="sortBy === 'category' ? 'primary' : 'grey'"
              @click="setSor$customT('category')"
              style="width: 100%"
              >CAT
              <q-icon
                v-if="sortBy === 'category'"
                :name="sortDesc ? 'arrow_downward' : 'arrow_upward'"
                size="16px"
              />
            </q-btn>
          </div>
          <div class="col-auto text-center" style="width: 36px">
            <q-btn
              flat
              dense
              :color="sortBy === 'status' ? 'primary' : 'grey'"
              @click="setSor$customT('status')"
              style="width: 100%"
              >Status
              <q-icon
                v-if="sortBy === 'status'"
                :name="sortDesc ? 'arrow_downward' : 'arrow_upward'"
                size="16px"
              />
            </q-btn>
          </div>
        </div>
        <!-- Lijst van inschrijvingen -->
        <div>
          <div v-for="reg in sortedRows" :key="reg.id" class="q-mb-xs">
            <div class="row items-center q-gutter-md q-pl-sm q-pr-sm" style="min-height: 36px">
              <div
                class="col text-body2 ellipsis"
                style="min-width: 0; max-width: 100vw; flex: 2 1 0"
              >
                {{ reg.expand?.user?.name }}
              </div>
              <div class="col-auto text-body2 text-grey-8 text-center" style="width: 32px">
                {{
                  reg.expand?.category?.name
                    ? reg.expand.category.name.charA$customT(0).toUpperCase()
                    : '-'
                }}
              </div>
              <div class="col-auto text-center" style="width: 36px">
                <q-icon
                  :name="statusIcon(reg.expand?.status?.name)"
                  :color="statusColor(reg.expand?.status?.name)"
                  size="22px"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fallback als event niet gevonden is -->
    <div v-else class="text-center">
      <div class="text-h6">Event niet gevonden</div>
      <q-btn flat color="primary" label="Terug" @click="router.back()" />
    </div>

    <!-- Dialog voor het versturen van een melding aan de organisatie -->
    <q-dialog v-model="notificationDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Melding versturen</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            v-model="notificationTitle"
            label="Onderwerp"
            :rules="[(val) => !!val || 'Onderwerp is verplicht']"
          />
          <q-input
            v-model="notificationBody"
            label="Melding"
            type="textarea"
            :rules="[(val) => !!val || 'Melding is verplicht']"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Annuleren" color="grey" v-close-popup />
          <q-btn
            flat
            label="Versturen"
            color="primary"
            @click="sendNotification"
            :loading="sendingNotification"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
// -----------------------------
// Imports en initialisatie
// -----------------------------
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from 'stores/auth';
import { useRegistrations } from 'src/components/events/registrations';
import { debug } from 'src/utils/debug';
import { inject } from 'vue'

const $customT = inject('$customT') as (key: string, params?: Record<string, any>) => string

// Initialiseer router, Quasar, PocketBase en authenticatie-store
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const pb = usePocketbase();
const authStore = useAuthStore();

// Registratie-composable voor inschrijvingen ophalen en muteren
const { registrations, fetchRegistrationsByEvent, addRegistration, removeRegistration } =
  useRegistrations();

// -----------------------------
// Reactieve variabelen en state
// -----------------------------
const event = ref(null); // Huidig event
const loading = ref(true); // Laadstatus voor spinner
const enrolling = ref(false); // Status voor inschrijven
const unenrolling = ref(false); // Status voor uitschrijven
const notificationDialog = ref(false); // Dialog voor melding sturen
const notificationTitle = ref(''); // Onderwerp van melding
const notificationBody = ref(''); // Inhoud van melding
const sendingNotification = ref(false); // Status voor melding versturen

// -----------------------------
// Computed properties
// -----------------------------
// Controleer of gebruiker is ingeschreven
const isEnrolled = computed(() => {
  return registrations.value.some((r) => r.user === authStore.user?.id);
});

// Aantal inschrijvingen
const registrationsCount = computed(() => registrations.value.length);

// Sorteerinstellingen
const sortBy = ref('name');
const sortDesc = ref(false);

// Controleer of event open is voor inschrijving
const isEventOpen = computed(() => {
  return event.value?.expand?.status?.name?.toLowerCase() === 'open';
});

// Kan gebruiker zich inschrijven?
const canEnroll = computed(() => {
  if (!event.value) return false;
  if (!isEventOpen.value) return false;
  if (isEnrolled.value) return false;
  if (event.value.max_players && registrations.value.length >= event.value.max_players)
    return false;
  return true;
});

// Kan gebruiker zich uitschrijven?
const canUnenroll = computed(() => {
  return isEnrolled.value && isEventOpen.value;
});

// -----------------------------
// Sorteer- en statushelpers
// -----------------------------
function setSor$customT(col) {
  if (sortBy.value === col) {
    sortDesc.value = !sortDesc.value;
  } else {
    sortBy.value = col;
    sortDesc.value = false;
  }
}

function statusIcon(status) {
  if (!status) return 'help_outline';
  const s = status.toLowerCase();
  if (s.includes('reserve')) return 'hourglass_empty';
  if (s.includes('bevestigd')) return 'check_circle';
  if (s.includes('aangevraagd')) return 'help_outline';
  return 'help_outline';
}

function statusColor(status) {
  if (!status) return 'grey';
  const s = status.toLowerCase();
  if (s.includes('reserve')) return 'orange';
  if (s.includes('bevestigd')) return 'positive';
  if (s.includes('aangevraagd')) return 'blue';
  return 'grey';
}

// Sorteerfunctie voor inschrijvingen
const sortMethod = (rows, sortBy, descending) => {
  return [...rows].sort((a, b) => {
    let aVal, bVal;
    if (sortBy === 'name') {
      aVal = a.expand?.user?.name || '';
      bVal = b.expand?.user?.name || '';
    } else if (sortBy === 'category') {
      aVal = a.expand?.category?.name || '';
      bVal = b.expand?.category?.name || '';
    } else if (sortBy === 'status') {
      aVal = a.expand?.status?.name || '';
      bVal = b.expand?.status?.name || '';
    }
    if (aVal < bVal) return descending ? 1 : -1;
    if (aVal > bVal) return descending ? -1 : 1;
    return 0;
  });
};

// Gesorteerde inschrijvingen voor weergave
const sortedRows = computed(() => sortMethod(registrations.value, sortBy.value, sortDesc.value));

// -----------------------------
// Layout helpers
// -----------------------------
// Datumrange mooi weergeven
const formatDateRange = (startDate: string, endDate: string) => {
  const formattedStartDate = new Date(startDate).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (!endDate) {
    return formattedStartDate;
  }

  const formattedEndDate = new Date(endDate).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `${formattedStartDate} t/m ${formattedEndDate}`;
};

// Statuskleur bepalen voor chip
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'concept':
      return 'grey';
    case 'actief':
      return 'primary';
    case 'afgerond':
      return 'positive';
    case 'geannuleerd':
      return 'negative';
    default:
      return 'grey';
  }
};

// -----------------------------
// Data ophalen
// -----------------------------
// Haal het event op uit PocketBase
const loadEvent = async () => {
  try {
    loading.value = true;
    const result = await pb.collection('events').getOne(route.params.id as string, {
      expand: 'course,status,owner,moderators',
    });

    debug('Event data:', result);
    event.value = result;
  } catch (error) {
    // Foutmelding bij mislukken
    debug('Error loading event:', error);
    $q.notify({
      color: 'negative',
      message: $customT('notifications.loadEventError'),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

// -----------------------------
// Inschrijven en uitschrijven
// -----------------------------
// Inschrijven voor event
const enrollInEvent = async () => {
  try {
    enrolling.value = true;
    await addRegistration(event.value.id, authStore.user?.id);
    await fetchRegistrationsByEven$customT(event.value.id);
    $q.notify({
      color: 'positive',
      message: $customT('notifications.eventEnrolled'),
      icon: 'check',
    });
  } catch (error) {
    // Foutmelding bij mislukken
    debug('Error enrolling in event:', error);
    $q.notify({
      color: 'negative',
      message: $customT('notifications.eventEnrollError'),
      icon: 'error',
    });
  } finally {
    enrolling.value = false;
  }
};

// Uitschrijven van event
const unenrollFromEvent = async () => {
  try {
    unenrolling.value = true;
    const reg = registrations.value.find((r) => r.user === authStore.user?.id);

    if (reg) {
      await removeRegistration(reg.id);
      await fetchRegistrationsByEven$customT(event.value.id);
      $q.notify({
        color: 'positive',
        message: $customT('notifications.eventUnenrolled'),
        icon: 'check',
      });
    }
  } catch (error) {
    // Foutmelding bij mislukken
    debug('Error unenrolling from event:', error);
    $q.notify({
      color: 'negative',
      message: $customT('notifications.eventUnenrollError'),
      icon: 'error',
    });
  } finally {
    unenrolling.value = false;
  }
};

// -----------------------------
// Melding sturen aan organisatie
// -----------------------------
function openNotificationDialog() {
  notificationTitle.value = '';
  notificationBody.value = '';
  notificationDialog.value = true;
}

const sendNotification = async () => {
  if (!notificationTitle.value || !notificationBody.value) {
    $q.notify({ color: 'negative', message: $customT('notifications.fillAllFields'), icon: 'error' });
    return;
  }
  try {
    sendingNotification.value = true;
    // Owner en moderators ids verzamelen
    const toUsers = [];
    if (event.value?.owner) toUsers.push(event.value.owner);
    if (Array.isArray(event.value?.moderators)) toUsers.push(...event.value.moderators);
    if (toUsers.length === 0) throw new Error('Geen organisatie gevonden');
    await pb.collection('notifications').create({
      to_user: toUsers,
      from_user: authStore.user?.id,
      title: `[Event: ${event.value?.name}] ${notificationTitle.value}`,
      body: notificationBody.value,
      link: '',
      seen: false,
    });
    $q.notify({ color: 'positive', message: $customT('notifications.notificationSent'), icon: 'check' });
    notificationDialog.value = false;
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: $customT('notifications.notificationError') + ': ' + (error.message || error),
      icon: 'error',
    });
  } finally {
    sendingNotification.value = false;
  }
};

// -----------------------------
// Lifecycle: bij laden van de pagina
// -----------------------------
onMounted(async () => {
  await loadEven$customT();
  await fetchRegistrationsByEven$customT(route.params.id as string);
});
</script>
