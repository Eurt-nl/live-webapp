<template>
  <!-- Dialog voor het aanmaken van een oefenronde -->
  <q-dialog v-model="dialogModel">
    <q-card style="min-width: 350px">
      <q-card-section>
        <div class="text-h6">{{ $t('practiceRound.newRound') }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-form @submit="createRound" class="q-gutter-md">
          <!-- Selecteer een baan -->
          <q-select
            v-model="newRound.course"
            :options="props.courses"
            :label="$t('practiceRound.course')"
            option-label="name"
            option-value="id"
            emit-value
            map-options
            :rules="[(val) => !!val || $t('practiceRound.courseRequired')]"
          />

          <!-- Melding als er geen banen binnen 300m zijn -->
          <div
            v-if="props.courses.length === 0 && !loading"
            class="text-caption text-warning q-mt-sm"
          >
            <q-icon name="warning" size="sm" class="q-mr-xs" />
            {{ $t('practiceRound.noNearbyCourses') }}
          </div>
          <!-- Datum en tijd -->
          <q-input
            v-model="newRound.date"
            :label="$t('practiceRound.dateTime')"
            type="datetime-local"
            :rules="[(val) => !!val || $t('practiceRound.dateTimeRequired')]"
          />
          <!-- Notities -->
          <q-input
            v-model="newRound.notes"
            :label="$t('practiceRound.notes')"
            type="textarea"
            autogrow
          />
          <!-- Knoppen -->
          <div class="row justify-end q-gutter-sm">
            <q-btn flat :label="$t('practiceRound.cancel')" color="primary" @click="closeDialog" />
            <q-btn
              type="submit"
              color="primary"
              :label="$t('practiceRound.startRound')"
              :loading="loading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
    <!-- Debug: dialog zichtbaar, loading = {{ loading }} -->
    <div style="font-size: 10px; color: #999">DEBUG: dialog zichtbaar, loading = {{ loading }}</div>
  </q-dialog>
</template>

<script setup lang="ts">
// -----------------------------
// Herbruikbare dialog voor oefenronde aanmaken
// -----------------------------
import { ref, watch, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useRouter } from 'vue-router';
import type { Course } from './models';

// Props voor openen/sluiten van de dialog en voor de banenlijst
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  courses: { type: Array, required: true },
  defaultCourseId: { type: String, required: false, default: '' },
});
const emit = defineEmits(['update:modelValue', 'round-created']);

// Computed property voor v-model op q-dialog (two-way binding)
const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const $q = useQuasar();
const { t } = useI18n();
const authStore = useAuthStore();
const pb = usePocketbase();
const router = useRouter();

const loading = ref(false);
const roundTypes = ref([]);
const statusTypes = ref([]);
const newRound = ref({
  course: '',
  date: '',
  notes: '',
});

// Dialog sluiten
function closeDialog() {
  loading.value = false; // Zorg dat loading altijd uit staat bij sluiten
  emit('update:modelValue', false);
}

// Reset loading als de dialog sluit (ook bij annuleren of na succes)
watch(
  () => props.modelValue,
  (val) => {
    if (!val) loading.value = false;
  },
);

// Functie om afstand tussen twee GPS-punten te berekenen (Haversine-formule)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
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

// Helper om huidige datum/tijd te formatteren voor datetime-local input (altijd lokale tijd, geen tijdzone)
function getNowForInput() {
  const now = new Date();
  now.setSeconds(0, 0);
  // Haal lokale tijdscomponenten op
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

// Bij openen dialog: zet default course en reset formulier
watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      loading.value = true;
      try {
        // Alleen roundTypes en statusTypes ophalen (banen komen nu via props)
        const roundTypesResult = await pb.collection('categories').getList(1, 50, {
          filter: 'cat_type = "round"',
          sort: 'name',
        });
        roundTypes.value = roundTypesResult.items;
        const statusTypesResult = await pb.collection('categories').getList(1, 50, {
          filter: 'cat_type = "status"',
          sort: 'name',
        });
        statusTypes.value = statusTypesResult.items;
        // Standaard: huidige datum/tijd invullen
        const defaultDate = getNowForInput();
        // Zet default course uit props
        newRound.value = { course: '', date: defaultDate, notes: '' };
      } catch {
        $q.notify({ color: 'negative', message: t('practiceRound.errorLoad'), icon: 'error' });
        loading.value = false;
      }
      loading.value = false;
    }
  },
  { immediate: false },
);

// Ronde aanmaken
async function createRound() {
  loading.value = true;
  try {
    // Controle: bestaat er al een actieve oefenronde voor deze gebruiker?
    const userId = authStore.user?.id;
    const activeRounds = await pb.collection('rounds').getFullList({
      filter: `player = "${userId}" && is_active = true && is_finalized = false && category != null`,
      sort: '-date',
      expand: 'category',
    });
    // Zoek naar actieve oefenronde (category naam = 'oefenronde')
    const activePractice = activeRounds.find(
      (r) => r.expand?.category?.name?.toLowerCase() === 'oefenronde',
    );
    if (activePractice) {
      // Sluit dialog en navigeer naar bestaande actieve oefenronde
      emit('update:modelValue', false);
      $q.notify({
        color: 'warning',
        message: t('home.activeRoundWarning', { rounds: 1 }),
        icon: 'warning',
      });
      router.push({ name: 'ronde-scores', params: { id: activePractice.id } });
      loading.value = false;
      return;
    }
    // Zoek de concept status en oefenronde type
    const conceptStatus = statusTypes.value.find((s) => s.name.toLowerCase() === 'concept');
    const practiceType = roundTypes.value.find((t) => t.name.toLowerCase() === 'oefenronde');
    if (!conceptStatus) throw new Error(t('practiceRound.errorConceptStatus'));
    if (!practiceType) throw new Error(t('practiceRound.errorPracticeType'));
    if (!newRound.value.course) throw new Error('Geen course geselecteerd!');
    const roundData = {
      course: newRound.value.course,
      player: userId,
      category: practiceType.id,
      status: conceptStatus.id,
      date: newRound.value.date ? new Date(newRound.value.date).toISOString() : '',
      notes: newRound.value.notes,
      created_by: userId,
      is_active: true, // Nieuwe oefenronde is actief
      is_finalized: false, // Nog niet afgerond
    };
    const created = await pb.collection('rounds').create(roundData);
    $q.notify({ color: 'positive', message: t('practiceRound.success'), icon: 'check' });
    emit('round-created');
    emit('update:modelValue', false);
    // Navigeer direct naar de score-invoerpagina van de nieuwe ronde
    router.push({ name: 'ronde-scores', params: { id: created.id } });
  } catch (e) {
    $q.notify({ color: 'negative', message: t('practiceRound.errorCreate'), icon: 'error' });
    console.error('createRound: error', e);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* Duidelijke layout voor dialog */
</style>
