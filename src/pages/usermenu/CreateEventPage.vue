<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">
        {{ isEditing ? $customT('eventForm.editEvent') : $customT('eventForm.createNewEvent') }}
      </div>
    </div>

    <q-card class="q-pa-md">
      <q-form @submit="onSubmit" class="q-gutter-md">
        <!-- Event naam -->
        <q-input
          v-model="form.name"
          :label="$customT('eventForm.eventName')"
          :rules="[(val) => !!val || $customT('eventForm.eventNameRequired')]"
          outlined
        />

        <!-- Baan selectie -->
        <q-select
          v-model="form.course"
          :options="courses"
          :label="$customT('eventForm.course')"
          option-label="name"
          option-value="id"
          emit-value
          map-options
          :rules="[(val) => !!val || $customT('eventForm.courseRequired')]"
          outlined
        />

        <!-- Maximaal aantal ronden -->
        <q-input
          v-model.number="form.rounds"
          :label="$customT('eventForm.maxRoundsPerPlayer')"
          type="number"
          min="1"
          max="10"
          :rules="[(val) => (val && val > 0) || $customT('eventForm.roundsMinRequired')]"
          outlined
        />

        <!-- Datum -->
        <q-input
          v-model="form.startdate"
          :label="$customT('eventForm.date')"
          type="date"
          :rules="[(val) => !!val || $customT('eventForm.dateRequired')]"
          outlined
        />

        <!-- Tijd -->
        <q-input
          v-model="form.starttime"
          :label="$customT('eventForm.time')"
          type="time"
          outlined
        />

        <!-- Recurring toggle -->
        <div v-if="!isEditing" class="q-mt-md">
          <div class="row items-center justify-between">
            <div class="text-subtitle1">{{ $customT('eventForm.recurringEvents') }}</div>
            <q-toggle v-model="isRecurring" color="primary" size="lg" />
          </div>
        </div>

        <!-- Recurring opties -->
        <div v-if="isRecurring" class="q-mt-md">
          <div class="text-subtitle2 q-mb-sm">{{ $customT('eventForm.howOftenRepeat') }}</div>
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-select
                v-model="form.recurringInterval"
                :options="recurringIntervals"
                :label="$customT('eventForm.whichInterval')"
                outlined
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12">
              <q-input
                v-model.number="form.recurringCount"
                :label="$customT('eventForm.howManyTimes')"
                type="number"
                min="2"
                max="52"
                :rules="[(val) => (val && val >= 2) || $customT('eventForm.minEventsRequired')]"
                outlined
              />
            </div>
          </div>
        </div>

        <!-- Beschrijving (optioneel) -->
        <q-input
          v-model="form.description"
          :label="$customT('eventForm.descriptionOptional')"
          type="textarea"
          outlined
          rows="3"
        />

        <!-- Moderators -->
        <div class="q-mt-md">
          <div class="text-subtitle2 q-mb-sm">{{ $customT('eventForm.moderators') }}</div>
          <q-select
            v-model="form.moderators"
            :options="availableModerators"
            :label="$customT('eventForm.addModerators')"
            option-label="name"
            option-value="id"
            emit-value
            map-options
            multiple
            outlined
            use-chips
            use-counter
            :hint="$customT('eventForm.moderatorsHint')"
          />
        </div>

        <!-- Submit knoppen -->
        <div class="row justify-end q-gutter-sm">
          <q-btn :label="$customT('eventForm.cancel')" color="grey" @click="router.back()" flat />
          <q-btn
            :label="
              isEditing
                ? $customT('eventForm.updateEvent')
                : isRecurring
                  ? $customT('eventForm.createEvents')
                  : $customT('eventForm.createEvent')
            "
            type="submit"
            color="primary"
            :loading="saving"
          />
        </div>
      </q-form>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from 'stores/auth';
import { debug } from 'src/utils/debug';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const { pb } = usePocketbase();
const authStore = useAuthStore();
const { t: $customT } = useI18n();

const saving = ref(false);
const courses = ref([]);
const availableModerators = ref([]);
const isEditing = computed(() => !!route.query.edit);
const eventId = computed(() => route.query.edit as string);

const form = ref({
  name: '',
  startdate: '',
  starttime: '',
  course: null,
  description: '',
  rounds: 1, // Standaard 1 ronde
  moderators: [], // Moderators array
  // Recurring opties
  recurringCount: 2,
  recurringInterval: 'weeks',
});

const isRecurring = ref(false);

const recurringIntervals = [
  { label: $customT('eventForm.everyDay'), value: 'days' },
  { label: $customT('eventForm.everyWeek'), value: 'weeks' },
  { label: $customT('eventForm.everyMonth'), value: 'months' },
];

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

// Laad een bestaand event voor bewerking
const loadEvent = async (id: string) => {
  try {
    const event = await pb.collection('events').getOne(id, {
      expand: 'course',
    });

    // Vul het formulier met de event gegevens
    form.value.name = event.name;

    // Verwerk datum/tijd
    if (event.startdate) {
      // Split de string op spatie om datum en tijd te scheiden

      const parts = event.startdate.split(' ');
      form.value.startdate = parts[0];
      form.value.starttime = parts[1] ? parts[1].slice(0, 5) : '00:00';
    }

    form.value.course = event.course?.[0] || null;
    form.value.description = event.description || '';
    form.value.rounds = event.rounds || 1;
    form.value.moderators = event.moderators || [];
  } catch (error) {
    debug('Fout bij laden event:', error);
    $q.notify({
      color: 'negative',
      message: $customT('events.loadError', { error: error.message }),
      icon: 'error',
    });
    router.back();
  }
};

// Laad beschikbare moderators
const loadModerators = async () => {
  try {
    const result = await pb.collection('users').getList(1, 100, {
      sort: 'name',
      fields: 'id,name,email',
    });

    availableModerators.value = result.items.map((user) => ({
      id: user.id,
      name: user.name || user.email,
      value: user.id,
      label: user.name || user.email,
    }));
  } catch (error) {
    debug('Fout bij laden moderators:', error);
    $q.notify({
      color: 'negative',
      message: $customT('events.loadError', { error: error.message }),
      icon: 'error',
    });
  }
};

// Laad banen waar de gebruiker eigenaar of moderator is
const loadCourses = async () => {
  try {
    const userId = authStore.user?.id;
    if (!userId) return;

    // Haal banen op waar de gebruiker eigenaar of moderator is
    const result = await pb.collection('courses').getList(1, 50, {
      filter: `owner = "${userId}" || moderators ?~ "${userId}"`,
      sort: 'name',
      expand: 'category',
    });

    // Sorteer op afstand tot gebruiker indien locatie beschikbaar
    let allCourses = result.items;
    if (navigator.geolocation) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            allCourses = [...allCourses].sort((a, b) => {
              if (!a.gps || !b.gps) return 0;
              const distA = getDistance(latitude, longitude, a.gps.latitude, a.gps.longitude);
              const distB = getDistance(latitude, longitude, b.gps.latitude, b.gps.longitude);
              return distA - distB;
            });
            resolve();
          },
          () => resolve(),
          { enableHighAccuracy: false, timeout: 3000 },
        );
      });
    }

    courses.value = allCourses.map((course) => ({
      id: course.id,
      name: course.name,
      value: course.id,
      label: course.name,
    }));
  } catch (error) {
    debug('Fout bij laden banen:', error);
    $q.notify({
      color: 'negative',
      message: $customT('events.loadError', { error: error.message }),
      icon: 'error',
    });
  }
};

// Verwijderd: niet meer nodig met q-toggle
// const toggleRecurring = () => {
//   isRecurring.value = !isRecurring.value;
// };

// Functie om datum te verhogen met interval
const addIntervalToDate = (date: Date, value: number, interval: string): Date => {
  const newDate = new Date(date);
  debug(`addIntervalToDate - Input: ${date.toISOString()}, value: ${value}, interval: ${interval}`);

  switch (interval) {
    case 'days':
      newDate.setDate(newDate.getDate() + value);
      debug(`addIntervalToDate - Dagen: ${newDate.toISOString()}`);
      break;
    case 'weeks':
      newDate.setDate(newDate.getDate() + value * 7);
      debug(`addIntervalToDate - Weken: ${newDate.toISOString()}`);
      break;
    case 'months': {
      // Voor maanden: behoud de dag van de maand, maar pas op voor maanden met minder dagen
      const currentDay = newDate.getDate();
      debug(`addIntervalToDate - Maanden - huidige dag: ${currentDay}`);
      newDate.setMonth(newDate.getMonth() + value);
      debug(`addIntervalToDate - Maanden - na setMonth: ${newDate.toISOString()}`);

      // Als de dag van de maand niet meer bestaat (bijv. 31e in februari),
      // zet dan naar de laatste dag van de nieuwe maand
      if (newDate.getDate() !== currentDay) {
        newDate.setDate(0); // Zet naar laatste dag van vorige maand
        debug(`addIntervalToDate - Maanden - aangepast naar laatste dag: ${newDate.toISOString()}`);
      }
      break;
    }
  }
  debug(`addIntervalToDate - Resultaat: ${newDate.toISOString()}`);
  return newDate;
};

// Test functie voor datum berekening
const testDateCalculation = () => {
  const testDate = new Date('2024-01-15T00:00:00');
  debug('Test datum berekening:');
  debug('Start datum:', testDate.toISOString());

  // Test dagen
  const nextDay = addIntervalToDate(testDate, 1, 'days');
  debug('Volgende dag:', nextDay.toISOString());

  // Test weken
  const nextWeek = addIntervalToDate(testDate, 1, 'weeks');
  debug('Volgende week:', nextWeek.toISOString());

  // Test maanden
  const nextMonth = addIntervalToDate(testDate, 1, 'months');
  debug('Volgende maand:', nextMonth.toISOString());

  // Test met string formaat (zoals in de form)
  const testDateStr = '2024-01-15';
  debug('Test met string formaat:');
  debug('Start datum string:', testDateStr);

  // Test alle intervallen met string formaat
  let currentDateStr = testDateStr;

  // Test dagen
  debug('--- Test DAGEN ---');
  for (let i = 0; i < 3; i++) {
    const [year, month, day] = currentDateStr.split('-').map(Number);
    const currentDate = new Date(Date.UTC(year, month - 1, day));
    const nextDate = addIntervalToDate(currentDate, 1, 'days');
    currentDateStr = nextDate.toISOString().split('T')[0];
    debug(`Dag ${i + 2}:`, currentDateStr);
  }

  // Test weken
  currentDateStr = testDateStr;
  debug('--- Test WEKEN ---');
  for (let i = 0; i < 3; i++) {
    const [year, month, day] = currentDateStr.split('-').map(Number);
    const currentDate = new Date(Date.UTC(year, month - 1, day));
    const nextDate = addIntervalToDate(currentDate, 1, 'weeks');
    currentDateStr = nextDate.toISOString().split('T')[0];
    debug(`Week ${i + 2}:`, currentDateStr);
  }

  // Test maanden
  currentDateStr = testDateStr;
  debug('--- Test MAANDEN ---');
  for (let i = 0; i < 3; i++) {
    const [year, month, day] = currentDateStr.split('-').map(Number);
    const currentDate = new Date(Date.UTC(year, month - 1, day));
    const nextDate = addIntervalToDate(currentDate, 1, 'months');
    currentDateStr = nextDate.toISOString().split('T')[0];
    debug(`Maand ${i + 2}:`, currentDateStr);
  }
};

// Submit functie
const onSubmit = async () => {
  try {
    saving.value = true;

    if (isEditing.value) {
      // Update bestaand event (geen recurring voor bewerken)
      const eventData = {
        name: form.value.name,
        course: [form.value.course],
        startdate: form.value.starttime
          ? `${form.value.startdate} ${form.value.starttime}:00`
          : `${form.value.startdate} 00:00:00`,
        description: form.value.description || '',
        rounds: form.value.rounds,
        moderators: form.value.moderators,
      };

      await pb.collection('events').update(eventId.value, eventData);

      $q.notify({
        color: 'positive',
        message: $customT('eventForm.eventUpdatedSuccess', { name: form.value.name }),
        icon: 'check',
      });
    } else if (isRecurring.value) {
      // Maak meerdere events aan
      const eventsToCreate = [];
      // Start met de eerste datum als string
      let currentDateStr = form.value.startdate;

      debug('Recurring events - Start datum:', currentDateStr);
      debug('Recurring events - Interval:', form.value.recurringInterval);
      debug('Recurring events - Aantal:', form.value.recurringCount);

      for (let i = 0; i < form.value.recurringCount; i++) {
        const eventTime = form.value.starttime || '00:00';

        debug(`Event ${i + 1} - Huidige datum string:`, currentDateStr);

        const eventData = {
          name: `${form.value.name} ${i + 1}`,
          course: [form.value.course],
          startdate: `${currentDateStr} ${eventTime}:00`,
          description: form.value.description || '',
          rounds: form.value.rounds,
          owner: authStore.user?.id,
          moderators: form.value.moderators,
          enrolled: [],
          is_open: true,
          max_players: 72,
        };

        debug(`Event ${i + 1} - Event data startdate:`, eventData.startdate);
        eventsToCreate.push(eventData);

        // Bereken volgende datum voor het volgende event
        debug(`Event ${i + 1} - Bereken volgende datum...`);
        // Gebruik UTC om timezone problemen te voorkomen
        const [year, month, day] = currentDateStr.split('-').map(Number);
        const currentDate = new Date(Date.UTC(year, month - 1, day));
        debug(`Event ${i + 1} - CurrentDate object:`, currentDate.toISOString());
        const nextDate = addIntervalToDate(currentDate, 1, form.value.recurringInterval);
        debug(`Event ${i + 1} - NextDate object:`, nextDate.toISOString());
        // Gebruik UTC om timezone problemen te voorkomen
        currentDateStr = nextDate.toISOString().split('T')[0];
        debug(`Event ${i + 1} - Nieuwe datum string:`, currentDateStr);
      }

      // Maak alle events aan
      for (const eventData of eventsToCreate) {
        await pb.collection('events').create(eventData);
      }

      $q.notify({
        color: 'positive',
        message: $customT('eventForm.eventsCreatedSuccess', { count: eventsToCreate.length }),
        icon: 'check',
      });
    } else {
      // Maak enkel event aan
      const eventData = {
        name: form.value.name,
        course: [form.value.course],
        startdate: form.value.starttime
          ? `${form.value.startdate} ${form.value.starttime}:00`
          : `${form.value.startdate} 00:00:00`,
        description: form.value.description || '',
        rounds: form.value.rounds,
        owner: authStore.user?.id,
        moderators: form.value.moderators,
        enrolled: [],
        is_open: true,
        max_players: 72,
      };

      await pb.collection('events').create(eventData);

      $q.notify({
        color: 'positive',
        message: $customT('eventForm.eventCreatedSuccess', { name: form.value.name }),
        icon: 'check',
      });
    }

    // Ga terug naar de vorige pagina
    router.back();
  } catch (error) {
    debug('Fout bij opslaan event:', error);
    $q.notify({
      color: 'negative',
      message: isEditing.value
        ? $customT('eventForm.errorUpdatingEvent')
        : $customT('eventForm.errorCreatingEvent'),
      icon: 'error',
    });
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadCourses(), loadModerators()]);

  if (isEditing.value && eventId.value) {
    // Laad bestaand event voor bewerking
    await loadEvent(eventId.value);
  } else {
    // Stel standaard datum in op vandaag voor nieuw event
    const today = new Date();
    form.value.startdate = today.toLocaleDateString('en-CA'); // YYYY-MM-DD formaat
  }

  // Test datum berekening
  testDateCalculation();
});
</script>
