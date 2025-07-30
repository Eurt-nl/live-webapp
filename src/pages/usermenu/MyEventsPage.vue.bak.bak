<template>
  <div class="q-pa-md">
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">
        {{ showArchived ? $customT('events.archivedEvents') : $customT('events.myEvents') }}
      </div>
      <div v-if="!showArchived" class="row q-gutter-sm">
        <q-btn
          color="secondary"
          icon="add"
          :label="$customT('events.newEvent')"
          :to="{ name: 'create-event' }"
        />
        <!-- Uitgebreid event knop verborgen voor later gebruik -->
        <!--
        <q-btn
          color="secondary"
          icon="settings"
          label="Uitgebreid event"
          :to="{ name: 'event-form', params: { id: 'new' } }"
        />
        -->
      </div>
    </div>

    <!-- Events lijst -->
    <div class="row q-col-gutter-md">
      <div v-for="event in events" :key="event.id" class="col-12 col-sm-6 col-md-4">
        <!-- Event kaart met nieuwe layout -->
        <q-card flat bordered>
          <q-card-section class="q-pa-sm">
            <!-- Rij met naam, subtitel en menu -->
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-h6">{{ event.name }}</div>
                <div class="text-subtitle2">
                  {{ event.expand?.course?.[0]?.name || $customT('events.noCourse') }}
                </div>
              </div>
              <div class="col-auto">
                <!-- Drie-stippen menu voor acties -->
                <q-btn color="primary" round flat icon="more_vert">
                  <q-menu cover auto-close>
                    <q-list>
                      <q-item
                        clickable
                        @click="() => editEven$customT(event.id)"
                        :disable="isEventStarted(event)"
                      >
                        <q-item-section>
                          {{ $customT('events.editEvent') }}
                          <q-item-label caption v-if="isEventStarted(event)">
                            {{ $customT('events.eventStarted') }}
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
            </div>
            <!-- Twee regels met relevante info -->
            <div class="q-mt-sm">
              <div class="text-body2">
                {{ $customT('events.startDate') }}: {{ formatDate(event.startdate) }}
                <span v-if="event.starttime">/ {{ event.starttime }}</span>
              </div>
              <div class="text-body2">
                {{ $customT('events.maxRounds') }}: {{ event.rounds || '-' }}
              </div>
              <!-- Datum tonen voor gearchiveerde events -->
              <div v-if="showArchived" class="text-body2 q-mt-xs">
                {{ formatDate(event.startdate) }}
              </div>
            </div>
            <!-- Chips met status, eigenaar, moderator, deelnemer (max 4 op 1 regel, rechts uitgelijnd) -->
            <div
              class="q-mt-sm row items-center no-wrap justify-end"
              style="gap: 4px; flex-wrap: nowrap; overflow-x: auto"
            >
              <q-chip
                :color="getStatusColor(event.expand?.status?.name)"
                text-color="white"
                size="sm"
                v-if="event.expand?.status?.name"
                outline
                square
              >
                {{ event.expand?.status?.name }}
              </q-chip>
              <q-chip
                v-if="isOwner(event)"
                color="primary"
                text-color="white"
                size="sm"
                outline
                square
              >
                {{ $customT('events.owner') }}
              </q-chip>
              <q-chip
                v-if="isModerator(event)"
                color="secondary"
                text-color="white"
                size="sm"
                outline
                square
              >
                {{ $customT('events.moderator') }}
              </q-chip>
              <q-chip
                v-if="isEnrolled(event)"
                color="positive"
                text-color="white"
                size="sm"
                outline
                square
              >
                {{ $customT('events.participant') }}
              </q-chip>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div v-if="events.length === 0" class="text-center q-mt-lg">
      <div class="text-h6">{{ $customT('events.noEventsFound') }}</div>
    </div>

    <!-- Verwijder bevestiging dialog -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">{{ $customT('eventRounds.deleteRound') }}</div>
        </q-card-section>
        <q-card-section>
          <p>
            {{ $customT('eventRounds.deleteRoundConfirm', { eventName: selectedEvent?.name }) }}
          </p>
          <p class="text-caption">{{ $customT('eventRounds.deleteRoundWarning') }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$customT('eventRounds.cancel')" color="primary" v-close-popup />
          <q-btn
            flat
            :label="$customT('eventRounds.delete')"
            color="negative"
            @click="deleteEvent"
            :loading="deleting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import { usePocketbase } from 'src/composables/usePocketbase';
import { debug } from 'src/utils/debug';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const pb = usePocketbase();
const $customT = inject('$customT') as (key: string, params?: Record<string, any>) => string;

const events = ref([]);
const loading = ref(false);
const showDeleteDialog = ref(false);
const selectedEvent = ref(null);
const deleting = ref(false);
const showArchived = ref(false);
const footerButtons = inject('footerButtons');

// Verwijderd: deze variabelen zijn niet meer nodig
// const roundsCount = ref({});
// const registrationsCount = ref({});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

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

const isOwner = (event) => {
  return event.owner === authStore.user?.id;
};

const isModerator = (event) => {
  return event.moderators?.includes(authStore.user?.id);
};

const isEnrolled = (event) => {
  return event.enrolled?.includes(authStore.user?.id);
};

// Controleer of een event gestart is (datum/tijd is voorbij)
const isEventStarted = (event) => {
  if (!event.startdate) return false;
  const eventDate = new Date(event.startdate);
  const now = new Date();
  return eventDate < now;
};

// Functie om te bepalen of een event ouder is dan 2 dagen
const isEventOlderThanTwoDays = (event) => {
  if (!event.startdate) return false;
  // De database heeft formaat "2025-07-17 14:11:33"
  const eventDate = new Date(event.startdate);
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  return eventDate < twoDaysAgo;
};

const loadEvents = async () => {
  try {
    loading.value = true;
    const baseFilter = `owner = "${authStore.user?.id}" || moderators ?~ "${authStore.user?.id}" || enrolled ?~ "${authStore.user?.id}"`;

    // Haal alle events op
    const eventsResult = await pb.collection('events').getList(1, 50, {
      filter: baseFilter,
      sort: 'startdate',
      expand: 'course,status',
    });

    // Filter client-side op basis van datum
    debug('Debug - Totaal aantal events:', eventsResult.items.length);
    debug('Debug - ShowArchived:', showArchived.value);

    if (showArchived.value) {
      // Toon alleen events ouder dan 2 dagen, gesorteerd van nieuw naar oud
      events.value = eventsResult.items
        .filter(isEventOlderThanTwoDays)
        .sort((a, b) => new Date(b.startdate) - new Date(a.startdate));
      debug('Debug - Gearchiveerde events:', events.value.length);
    } else {
      // Toon alleen events van de laatste 2 dagen
      events.value = eventsResult.items.filter((event) => !isEventOlderThanTwoDays(event));
      debug('Debug - Actieve events:', events.value.length);
    }

    updateFooterButtons();

    debug('Loaded events:', eventsResult.items);
    debug('First event course data:', eventsResult.items[0]?.expand?.course);
  } catch (error) {
    debug('Error loading events:', error);
    $q.notify({
      color: 'negative',
      message: $customT('events.loadError', { error: error.message }),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

// Verwijderd: niet meer gebruikt
// const manageParticipants = (id: string) => {
//   void router.push(`/events/${id}/deelnemers`);
// };

const confirmDelete = (event) => {
  selectedEvent.value = event;
  showDeleteDialog.value = true;
};

const deleteEvent = async () => {
  try {
    deleting.value = true;
    await pb.collection('events').delete(selectedEvent.value.id);

    // Verwijder het event uit de lokale lijst
    events.value = events.value.filter((e) => e.id !== selectedEvent.value.id);

    showDeleteDialog.value = false;
    selectedEvent.value = null;

    $q.notify({
      color: 'positive',
      message: $customT('events.deleteSuccess'),
      icon: 'check',
    });
  } catch (error) {
    debug('Error deleting event:', error);
    $q.notify({
      color: 'negative',
      message: $customT('events.deleteError'),
      icon: 'error',
    });
  } finally {
    deleting.value = false;
  }
};

const updateFooterButtons = () => {
  if (footerButtons) {
    footerButtons.value = [
      {
        icon: '',
        label: showArchived.value ? $customT('events.active') : $customT('events.archived'),
        badgeColor: 'secondary',
        order: 0, // In het midden van de footer
        onClick: () => {
          showArchived.value = !showArchived.value;
          void loadEvents();
        },
      },
    ];
  }
};

// Verwijderd: niet meer gebruikt
// const manageRounds = (eventId: string) => {
//   router.push({ name: 'event-rounds', params: { id: eventId } });
// };

const editEvent = (id: string) => {
  const event = events.value.find((e) => e.id === id);
  if (event && isEventStarted(event)) {
    $q.notify({
      color: 'warning',
      message: $customT('notifications.eventStartedError'),
      icon: 'warning',
    });
    return;
  }

  // Controleer of gebruiker eigenaar of moderator is
  if (!isOwner(event) && !isModerator(event)) {
    $q.notify({
      color: 'warning',
      message: $customT('notifications.noEditRights'),
      icon: 'warning',
    });
    return;
  }

  void router.push({ name: 'create-event', query: { edit: id } });
};

watch(showArchived, updateFooterButtons, { immediate: true });

onMounted(() => {
  void loadEvents();
  updateFooterButtons();
});

onUnmounted(() => {
  if (footerButtons) {
    footerButtons.value = [];
  }
});
</script>
