<template>
  <!-- Hoofdpagina voor het invoeren van scores -->
  <div class="q-pa-md">
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">
        <!-- Statische titel voor alle ronde types -->
        {{ $customT('scores.enterScores') }}
      </div>
      <!-- Weer-invloed icoontje -->
      <WeatherImpactTable
        v-if="round && holes.length > 0"
        :course-id="String(round.course)"
        :holes="holes"
      />
    </div>
    <q-page padding>
      <!-- Pull-to-refresh voor handmatig verversen -->
      <q-pull-to-refresh @refresh="onRefresh">
        <div v-if="loading" class="row justify-center">
          <q-spinner color="primary" size="3em" />
        </div>
        <div v-else-if="round" class="q-gutter-md">
          <!-- Overzicht van speler en scores -->
          <div class="row items-center q-mb-md" v-if="round">
            <div class="col-12 text-center">
              <!-- Event naam of oefenronde naam -->
              <div class="text-h5" v-if="isEventRound">
                {{ round.event_name || 'Event' }}
              </div>
              <div class="text-h5" v-else-if="isPracticeRound">
                {{ $customT('scores.practiceRound') }}
              </div>
              <div class="text-h5" v-else>
                {{ $customT('scores.round') }}
              </div>
              <!-- Toon baan naam voor alle ronde types -->
              <div class="text-subtitle2 q-mt-xs">
                {{ round.expand?.course?.name || '-' }}
              </div>
              <div class="q-mt-md text-left">
                <!-- Speler scoreoverzicht blijft altijd zichtbaar -->
                <div class="q-mb-sm">
                  <div class="row items-center justify-between">
                    <div
                      class="text-h6 cursor-pointer"
                      @click="showPlayerScores = !showPlayerScores"
                      :aria-pressed="showPlayerScores"
                    >
                      {{ round.expand?.player?.name || '-' }}
                    </div>
                    <div class="text-h6 text-grey-8" v-if="totalScorePlayer !== null">
                      {{ totalScorePlayer >= 0 ? '+' : '' }}{{ totalScorePlayer }}
                    </div>
                  </div>
                  <!-- Compacte scoreweergave speler -->
                  <div v-if="holes.length > 0 && showPlayerScores" class="q-mt-sm">
                    <!-- Alle holes in één rij -->
                    <div class="row items-center no-wrap q-mb-xs">
                      <div
                        v-for="hole in holes"
                        :key="'hn-' + hole.id"
                        class="col text-center text-caption text-weight-medium"
                      >
                        {{ hole.hole }}
                      </div>
                    </div>
                    <!-- Alle scores in één rij -->
                    <div class="row items-center no-wrap q-mb-md">
                      <div
                        v-for="hole in holes"
                        :key="'sc-' + hole.id"
                        class="col text-center text-body1"
                        :style="getScoreColorStyle(getPlayerScoreForHole(hole.id))"
                      >
                        {{ getPlayerScoreForHole(hole.id) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Buttons voor score-invoer per hole -->
          <q-card>
            <q-card-section>
              <div class="row q-col-gutter-md">
                <div v-for="hole in holes" :key="hole.id" class="col-2">
                  <q-btn
                    :color="isHoleBlue(hole.id) ? 'primary' : 'grey'"
                    class="full-width"
                    @click="openScoreDialog(hole)"
                    style="height: 50px"
                    :disable="isReadOnly"
                  >
                    <div class="text-h6">{{ hole.hole }}</div>
                  </q-btn>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <div
            class="row q-mt-md score-overview-actions-row"
            style="width: 100%"
            v-if="
              (isPracticeRound && !isReadOnly && canFinishPracticeRound) ||
              (isEventRound && !isReadOnly && canFinishEventRound)
            "
          >
            <div class="row q-gutter-sm q-mt-none q-mb-none score-overview-actions-between">
              <div class="col-auto">
                <q-btn
                  flat
                  color="negative"
                  :label="$customT('scores.noReturn')"
                  @click="isPracticeRound ? (cancelDialog = true) : (cancelEventDialog = true)"
                />
              </div>
              <div class="col text-right">
                <q-btn
                  color="positive"
                  :label="$customT('scores.saveRound')"
                  @click="isPracticeRound ? finishPracticeRound() : finishEventRound()"
                  class="finalize-save-btn"
                />
              </div>
            </div>
          </div>

          <!-- Back knop onder de acties -->
          <div class="row q-mt-sm justify-end">
            <q-btn color="primary" :label="$customT('navigation.back')" @click="router.back()" />
          </div>

          <!-- Leaderboard widget voor event rondes - altijd live, ongeacht ronde status -->
          <LeaderboardWidget
            v-if="isEventRound && round?.event"
            :event-id="String(round.event)"
            :current-user-id="authStore.user?.id || ''"
          />

          <!-- Popup voor bevestiging annuleren oefenronde -->
          <q-dialog v-model="cancelDialog">
            <q-card style="min-width: 350px">
              <q-card-section>
                <div class="text-h6">{{ $customT('scores.cancelPracticeRound') }}</div>
              </q-card-section>
              <q-card-section>
                {{ $customT('scores.confirmCancelPracticeRound') }}<br />
                <b>{{ $customT('scores.note') }}:</b
                >{{ $customT('scores.roundAndScoresWillBeDeleted') }}
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat :label="$customT('scores.cancel')" color="grey" v-close-popup />
                <q-btn
                  flat
                  :label="$customT('scores.deleteRound')"
                  color="negative"
                  @click="handleCancelPracticeRound"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>

          <!-- Popup voor bevestiging annuleren event ronde -->
          <q-dialog v-model="cancelEventDialog">
            <q-card style="min-width: 350px">
              <q-card-section>
                <div class="text-h6">{{ $customT('scores.cancelEventRound') }}</div>
              </q-card-section>
              <q-card-section>
                {{ $customT('scores.confirmCancelEventRound') }}<br />
                <b>{{ $customT('scores.note') }}:</b
                >{{ $customT('scores.roundAndScoresWillBeDeleted') }}
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat :label="$customT('scores.cancel')" color="grey" v-close-popup />
                <q-btn
                  flat
                  :label="$customT('scores.deleteRound')"
                  color="negative"
                  @click="handleCancelEventRound"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>
        </div>
        <div v-else class="text-center">
          <div class="text-h6">{{ $customT('scores.roundNotFound') }}</div>
          <q-btn flat color="primary" :label="$customT('scores.back')" @click="router.back()" />
        </div>
      </q-pull-to-refresh>

      <!-- Nieuw: Slide-in paneel voor score-invoer -->
      <q-drawer
        v-model="scoreSlideIn"
        side="right"
        :width="320"
        :breakpoint="600"
        bordered
        :persistent="true"
        class="score-slide-in"
      >
        <q-card flat class="full-height">
          <q-card-section class="bg-primary text-white">
            <div class="row items-center justify-between">
              <div>
                <div class="text-h6">{{ $customT('scores.hole') }} {{ selectedHole?.hole }}</div>
                <div class="text-subtitle2">
                  {{ $customT('scores.par') }} {{ selectedHole?.par }}
                </div>
                <div class="text-caption">
                  {{ $customT('scores.distance') }}: {{ selectedHole?.hole_length }}m
                </div>
              </div>
              <q-btn flat round icon="close" @click="closeScoreSlideIn" class="text-white" />
            </div>
          </q-card-section>

          <q-card-section class="q-pa-md">
            <q-form @submit="saveScoreFromSlideIn" class="q-gutter-md">
              <!-- Score-invoer met +/- knoppen -->
              <div class="text-subtitle1 q-mb-sm">{{ $customT('scores.playerScore') }}</div>
              <div class="row items-center justify-center q-gutter-sm">
                <q-btn
                  round
                  color="primary"
                  icon="remove"
                  size="md"
                  @click="decreaseScore"
                  :disable="scoreForm.score_player <= 1"
                />
                <div class="text-h5 text-weight-bold q-px-md">
                  {{ scoreForm.score_player || 3 }}
                </div>
                <q-btn round color="primary" icon="add" size="md" @click="increaseScore" />
              </div>

              <!-- GIR toggle -->
              <div class="q-mt-md">
                <q-toggle
                  v-model="scoreForm.gir"
                  :label="$customT('scores.greenInRegulation')"
                  color="positive"
                  size="sm"
                  @update:model-value="onGirToggle"
                />
              </div>

              <!-- Statistieken -->
              <div class="q-mt-md">
                <div class="text-subtitle1 q-mb-sm">{{ $customT('scores.statistics') }}</div>

                <!-- Putts met +/- knoppen -->
                <div class="row items-center q-mb-sm">
                  <div class="col-4">{{ $customT('scores.putts') }}</div>
                  <div class="col-8">
                    <div class="row items-center justify-center q-gutter-xs">
                      <q-btn
                        round
                        color="grey-6"
                        icon="remove"
                        size="sm"
                        @click="decreasePutts"
                        :disable="scoreForm.putts <= 0"
                      />
                      <div class="text-h6 text-weight-bold q-px-sm">
                        {{ scoreForm.putts }}
                      </div>
                      <q-btn round color="grey-6" icon="add" size="sm" @click="increasePutts" />
                    </div>
                  </div>
                </div>

                <!-- Chips met +/- knoppen -->
                <div class="row items-center q-mb-sm">
                  <div class="col-4">{{ $customT('scores.chips') }}</div>
                  <div class="col-8">
                    <div class="row items-center justify-center q-gutter-xs">
                      <q-btn
                        round
                        color="grey-6"
                        icon="remove"
                        size="sm"
                        @click="decreaseChips"
                        :disable="scoreForm.chips <= 0"
                      />
                      <div class="text-h6 text-weight-bold q-px-sm">
                        {{ scoreForm.chips }}
                      </div>
                      <q-btn round color="grey-6" icon="add" size="sm" @click="increaseChips" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Notitie -->
              <div class="q-mt-md">
                <q-input
                  v-model="scoreForm.note"
                  :label="$customT('scores.note')"
                  type="textarea"
                  autogrow
                  outlined
                  dense
                />
              </div>

              <!-- Actie knoppen -->
              <div class="row q-gutter-sm q-mt-lg">
                <q-btn
                  flat
                  :label="$customT('scores.cancel')"
                  color="grey"
                  @click="closeScoreSlideIn"
                  class="col"
                />
                <q-btn
                  color="primary"
                  :label="isUpdate ? $customT('scores.update') : $customT('scores.save')"
                  @click="saveScoreFromSlideIn"
                  :loading="saving[selectedHole?.id]"
                  class="col"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-drawer>
    </q-page>
  </div>

  <!-- Finalize dialog -->
  <q-dialog v-model="finalizeDialog">
    <q-card style="min-width: 400px" class="q-pa-lg">
      <q-card-section>
        <div class="text-h6">{{ $customT('scores.finalizeTitle') }}</div>
      </q-card-section>
      <q-card-section>
        <div class="q-mb-md">{{ $customT('scores.finalizeCheck') }}</div>
        <div class="row items-center no-wrap q-mb-xs">
          <div
            v-for="hole in holes"
            :key="'sum-hn-' + hole.id"
            class="col text-center text-caption text-weight-medium"
          >
            {{ hole.hole }}
          </div>
        </div>
        <div class="row items-center no-wrap q-mb-md">
          <div
            v-for="hole in holes"
            :key="'sum-sc-' + hole.id"
            class="col text-center text-body1"
            :style="getScoreColorStyle(getPlayerScoreForHole(hole.id))"
          >
            {{ getPlayerScoreForHole(hole.id) }}
          </div>
        </div>
        <div class="text-h6 q-mt-md">
          {{ $customT('scores.finalizeTotal') }} {{ totalScorePlayer >= 0 ? '+' : ''
          }}{{ totalScorePlayer }}
        </div>
      </q-card-section>
      <q-card-actions class="q-gutter-sm finalize-actions-row" align="between">
        <q-btn
          flat
          color="negative"
          :label="$customT('scores.noReturn')"
          @click="finalizeDialog = false"
        />
        <q-btn
          flat
          color="primary"
          :label="$customT('scores.adjustScore')"
          @click="finalizeDialog = false"
        />
        <q-btn
          color="positive"
          :label="$customT('scores.saveRound')"
          @click="finalizeRound"
          class="finalize-save-btn"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// -----------------------------
// Imports en initialisatie
// -----------------------------
// Importeer Vue, Quasar, router, PocketBase en eigen stores/composables
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from 'stores/auth';
import { useRoundsStore } from 'stores/rounds';
import { getScoreColor } from 'src/constants/scoreColors';
import { debug } from 'src/utils/debug';
import { useI18n } from 'vue-i18n';
import WeatherImpactTable from 'src/components/WeatherImpactTable.vue';
import LeaderboardWidget from 'src/components/LeaderboardWidget.vue';

// Initialiseer router, Quasar, PocketBase en authenticatie-store
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { pb } = usePocketbase();
const authStore = useAuthStore();
const roundsStore = useRoundsStore();
const { t: $customT } = useI18n();

// -----------------------------
// Type-definities
// -----------------------------
type User = {
  id: string;
  name: string;
  category?: string;
  expand?: {
    category?: { name: string };
  };
};

type Round = {
  id: string;
  player: string;
  marker: string;
  event?: string;
  event_name?: string;
  expand?: {
    player?: User;
    marker?: User;
    event?: { id: string; name: string };
    category?: { name: string };
    status?: { id: string; name: string };
    course?: { name?: string };
  };
  [key: string]: unknown;
};

type Hole = {
  id: string;
  hole: number;
  par: number;
  hole_length: number;
  gps_tee?: { latitude: number; longitude: number } | null;
  gps_green?: { latitude: number; longitude: number } | null;
};

type RoundScore = {
  id: string;
  round: string;
  hole: string;
  score_player?: number;
  score_marker?: number;
  note?: string;
  gir?: boolean;
  putts?: number;
  chips?: number;
};

// -----------------------------
// Reactieve variabelen en state
// -----------------------------
const round = ref<Round | null>(null);
const holes = ref<Hole[]>([]);
const loading = ref(true);
const scoreSlideIn = ref(false);
const selectedHole = ref<Hole | null>(null);
const saving = ref<{ [holeId: string]: boolean }>({});
const scoreForm = ref({
  score_player: 3,
  score_marker: null,
  note: '',
  gir: false,
  putts: 0,
  chips: 0,
});

const allScores = ref<RoundScore[]>([]);
const allRounds = ref<Round[]>([]);

// UI-state voor toggles en dialogs
const showPlayerScores = ref(false);
const cancelDialog = ref(false);
const cancelEventDialog = ref(false);
const finalizeDialog = ref(false);

// Bepalen of het een oefenronde is (geen marker nodig)
const isPracticeRound = computed(() => {
  if (!round.value) return false;

  // BELANGRIJK: Als er een event is, is het NOOIT een oefenronde
  if (round.value.event) {
    console.log('isPracticeRound: Event found, cannot be practice round');
    return false;
  }

  // Controleer of de ronde-categorie 'oefenronde' is (via expand of direct)
  const categoryName = round.value.expand?.category?.name || round.value.category;
  const isPractice =
    typeof categoryName === 'string' && categoryName.toLowerCase() === 'oefenronde';

  // Extra check: als er geen marker is, is het waarschijnlijk een oefenronde
  const hasNoMarker = !round.value.marker;

  console.log('isPracticeRound debug:', {
    categoryName,
    isPractice,
    hasNoMarker,
    event: round.value.event,
    marker: round.value.marker,
  });

  return isPractice || hasNoMarker;
});

// Bepalen of het een event ronde is (heeft event_id)
const isEventRound = computed(() => {
  if (!round.value) return false;

  // Als het een oefenronde is, is het geen event ronde
  if (isPracticeRound.value) return false;

  // Check of er een event is (direct)
  const hasDirectEvent = !!round.value.event;

  // Check of er een event naam is om te tonen
  const hasEventName = !!round.value.event_name;

  console.log('isEventRound debug:', {
    hasDirectEvent,
    hasEventName,
    event: round.value.event,
    event_name: round.value.event_name,
  });

  return hasDirectEvent || hasEventName;
});

// Automatisch score overzicht tonen voor oefenrondes
watch(
  isPracticeRound,
  (newValue) => {
    if (newValue) {
      showPlayerScores.value = true;
    }
  },
  { immediate: true },
);

// -----------------------------
// Computed properties en helpers
// -----------------------------

// Open het score-invoerscherm voor een specifieke hole
const openScoreDialog = (hole: Hole) => {
  selectedHole.value = hole;

  // Zoek de juiste score record
  let myRecord: RoundScore | undefined;

  if (isEventRound.value) {
    // Voor event rondes: zoek direct in de huidige ronde
    myRecord = allScores.value.find(
      (s) => s.round === route.params.id && s.hole === String(hole.id),
    );
  } else {
    // Voor andere rondes: zoek zoals voorheen
    myRecord = allScores.value.find(
      (s) => s.round === route.params.id && s.hole === String(hole.id),
    );
  }

  scoreForm.value = {
    score_player: myRecord?.score_player ?? 3,
    score_marker: myRecord?.score_marker ?? null,
    note: myRecord?.note ?? '',
    gir: myRecord?.gir ?? false,
    putts: myRecord?.putts ?? 0,
    chips: myRecord?.chips ?? 0,
  };
  scoreSlideIn.value = true;
};

// Sluit het slide-in paneel
const closeScoreSlideIn = () => {
  scoreSlideIn.value = false;
};

// Verhoog score met 1
const increaseScore = () => {
  scoreForm.value.score_player++;
};

// Verlaag score met 1
const decreaseScore = () => {
  if (scoreForm.value.score_player > 1) {
    scoreForm.value.score_player--;
  }
};

// GIR toggle handler
const onGirToggle = (value: boolean) => {
  if (value) {
    // Als GIR true is, stel putts automatisch in op score_player - 1
    scoreForm.value.putts = scoreForm.value.score_player - 1;
  }
};

// Putts functies
const increasePutts = () => {
  scoreForm.value.putts++;
};

const decreasePutts = () => {
  if (scoreForm.value.putts > 0) {
    scoreForm.value.putts--;
  }
};

// Chips functies
const increaseChips = () => {
  scoreForm.value.chips++;
};

const decreaseChips = () => {
  if (scoreForm.value.chips > 0) {
    scoreForm.value.chips--;
  }
};

// Sla score op vanuit slide-in paneel
const saveScoreFromSlideIn = async () => {
  await saveScore();
  closeScoreSlideIn();
};

// Bepaal of het een update of create is voor de score
const isUpdate = computed(() => {
  if (!selectedHole.value) return false;
  const holeId = selectedHole.value.id;
  const existingScore = allScores.value.find(
    (s) => s.round === route.params.id && s.hole === String(holeId),
  );
  return !!(existingScore && existingScore.id && !existingScore.id.startsWith('temp_'));
});

// Totale score van speler berekenen (t.o.v. par)
const totalScorePlayer = computed(() => {
  if (!round.value?.id || holes.value.length === 0) {
    return null;
  }

  // Zoek alle scores voor de huidige ronde
  const scores = allScores.value.filter(
    (s) => s.round === round.value.id && s.score_player != null,
  );

  // Als er geen scores zijn, return null
  if (scores.length === 0) {
    return null;
  }

  // Bereken totale score vs par (gebruik echte par waarden per hole)
  const total = scores.reduce((sum, s) => {
    const score = typeof s.score_player === 'number' ? s.score_player : 0;
    if (score === 0) return sum; // Skip holes zonder score

    // Zoek de par voor deze hole
    const hole = holes.value.find((h) => String(h.id) === s.hole);
    const par = hole?.par || 3; // Fallback naar par 3 als hole niet gevonden

    return sum + (score - par);
  }, 0);

  return total;
});

// Haal de score van de speler op voor een specifieke hole
const getPlayerScoreForHole = (holeId: string) => {
  if (!round.value?.id) return '-';

  // Zoek score voor deze specifieke hole in deze specifieke ronde
  const scoreRec = allScores.value.find(
    (s) => s.round === round.value.id && s.hole === String(holeId),
  );
  return scoreRec?.score_player ?? '-';
};

// Bepaal de kleur van een score (voor visuele feedback)
const getScoreColorStyle = (score: string | number) => {
  const num = parseInt(score as string);
  if (!score || isNaN(num)) return {};
  const color = getScoreColor(num);
  return color ? { backgroundColor: color } : {};
};

// -----------------------------
// Data ophalen en opslaan
// -----------------------------
// Laad alle benodigde data voor deze pagina (rondes, holes, scores)
const loadData = async () => {
  try {
    loading.value = true;

    // Haal ronde data op
    const roundData = await pb.collection('vw_round_with_scores').getOne(route.params.id as string);

    console.log('Round data from view:', roundData);

    // Converteer view data naar Round interface
    const roundResult = {
      ...roundData,
      event_name: roundData.event_name,
      expand: {
        course: { name: roundData.course_name },
        player: { name: roundData.player_name },
        marker: roundData.marker ? { name: roundData.marker_name } : null,
        category: roundData.category ? { name: roundData.category_name } : null,
        event: roundData.event ? { name: roundData.event_name } : null,
      },
    };

    round.value = roundResult as unknown as Round;

    // Bepaal het eventId voor filtering
    const directEventId = roundData.event;

    let roundsFilter = '';
    // Speciaal filter voor oefenrondes: alle rondes van deze speler op deze baan en datum
    if (isPracticeRound.value) {
      roundsFilter = `player = "${roundData.player}" && course = "${roundData.course}" && date = "${roundData.date}" && category = "${roundData.category}"`;
    } else if (directEventId) {
      // Voor directe event rondes (nieuwe systeem)
      roundsFilter = `event = "${String(directEventId)}"`;
    } else {
      roundsFilter = `id = "${String(route.params.id)}"`;
    }

    // Haal alle rondes van het event op
    const roundsResult = await pb.collection('rounds').getList(1, 200, {
      filter: roundsFilter,
      expand: 'player,player.category,category,event',
    });
    allRounds.value = roundsResult.items as unknown as Round[];

    // Zorg ervoor dat de huidige ronde altijd wordt meegenomen
    const currentRoundInAllRounds = allRounds.value.find((r) => r.id === round.value?.id);
    if (!currentRoundInAllRounds) {
      allRounds.value.push(round.value as Round);
    }

    // Haal alle scores op van deze ronde
    try {
      const scoresResult = await pb.collection('round_scores').getList(1, 50, {
        filter: `round = "${roundData.id}"`,
        sort: 'hole',
      });

      allScores.value = scoresResult.items as unknown as RoundScore[];
      console.log('Scores loaded from round_scores:', allScores.value);
    } catch (error) {
      console.error('Error loading scores:', error);
      allScores.value = [];
    }

    // Haal alle holes op van deze baan
    try {
      const holesResult = await pb.collection('course_detail').getList(1, 50, {
        filter: `course = "${roundData.course}"`,
        sort: 'hole',
      });

      holes.value = holesResult.items as unknown as Hole[];
      console.log('Holes loaded from course_detail:', holes.value);
    } catch (error) {
      console.error('Error loading holes:', error);
      holes.value = [];
    }
  } catch (error) {
    debug('Error loading data:', error);
    $q.notify({
      color: 'negative',
      message: $customT('notifications.loadDataError'),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

// Sla een score op (nieuw of update), zet status op 'Actief'
const saveScore = async () => {
  if (!selectedHole.value) return;
  const holeId = selectedHole.value.id;
  if (isReadOnly.value) {
    $q.notify({
      color: 'negative',
      message: $customT('notifications.roundFinalizedError'),
      icon: 'lock',
    });
    saving.value[String(holeId)] = false;
    return;
  }
  saving.value[String(holeId)] = true;

  // Optimistische update: update UI direct
  const optimisticScoreData = {
    round: route.params.id,
    hole: String(holeId),
    score_player: scoreForm.value.score_player,
    score_marker: isPracticeRound.value ? null : scoreForm.value.score_marker,
    note: scoreForm.value.note,
    gir: scoreForm.value.gir,
    putts: scoreForm.value.putts,
    chips: scoreForm.value.chips,
    created_by: authStore.user?.id,
  };

  // Bepaal of we een update of create moeten doen (buiten try block voor scope)
  const myRecord = allScores.value.find(
    (s) => s.round === route.params.id && s.hole === String(holeId),
  );
  const shouldUpdate = myRecord && myRecord.id && !myRecord.id.startsWith('temp_');
  const originalRecord = shouldUpdate ? { ...myRecord } : null;

  try {
    if (isEventRound.value) {
      // Voor event rondes: alleen speler score verplicht
      if (scoreForm.value.score_player == null || scoreForm.value.score_player === 0) {
        $q.notify({
          color: 'negative',
          message: $customT('notifications.fillPlayerScore'),
          icon: 'error',
        });
        saving.value[String(holeId)] = false;
        return;
      }
    }

    // Optimistische update: voeg toe aan lokale data
    if (shouldUpdate) {
      // Update bestaande score optimistisch
      const existingIndex = allScores.value.findIndex((s) => s.id === myRecord.id);
      if (existingIndex >= 0) {
        allScores.value[existingIndex] = {
          ...allScores.value[existingIndex],
          ...optimisticScoreData,
        } as RoundScore;
      }
    } else {
      // Voeg nieuwe score optimistisch toe
      const newScore = {
        id: `temp_${Date.now()}`, // Tijdelijke ID
        ...optimisticScoreData,
      } as RoundScore;
      allScores.value.push(newScore);
    }

    // Sla op naar server
    let result;
    try {
      if (shouldUpdate) {
        // Update bestaande score
        result = await pb.collection('round_scores').update(myRecord.id, optimisticScoreData);
        debug('Score update (gebruiker):', result);
      } else {
        // Create nieuwe score
        result = await pb.collection('round_scores').create(optimisticScoreData);
        debug('Score create (gebruiker):', result);

        // Vervang tijdelijke ID met echte ID
        const tempIndex = allScores.value.findIndex((s) => s.id.startsWith('temp_'));
        if (tempIndex >= 0) {
          allScores.value[tempIndex] = {
            ...allScores.value[tempIndex],
            id: result.id,
          } as RoundScore;
        }
      }

      // Update ronde status
      await pb.collection('rounds').update(String(route.params.id), { status: '0n8l4fpvwt05y6k' });
    } catch (serverError) {
      debug('Server error during save:', serverError);
      throw serverError;
    }

    $q.notify({
      color: 'positive',
      message: $customT('notifications.scoreSaved'),
      icon: 'check',
    });

    // Check of alle scores nu ingevuld zijn
    if (allScoresEntered() && !isReadOnly.value) {
      finalizeDialog.value = true;
    }
  } catch (error) {
    debug('Error saving score:', error);

    // Rollback optimistische update bij error
    if (shouldUpdate && originalRecord) {
      // Herstel de originele data voor update
      const existingIndex = allScores.value.findIndex((s) => s.id === originalRecord.id);
      if (existingIndex >= 0) {
        allScores.value[existingIndex] = originalRecord;
      }
    } else {
      // Verwijder tijdelijke score bij create error
      const tempIndex = allScores.value.findIndex((s) => s.id.startsWith('temp_'));
      if (tempIndex >= 0) {
        allScores.value.splice(tempIndex, 1);
      }
    }

    $q.notify({
      color: 'negative',
      message: $customT('notifications.saveScoreError'),
      icon: 'error',
    });
  } finally {
    saving.value[String(holeId)] = false;
  }
};

// Pull-to-refresh functionaliteit
const onRefresh = (done: () => void) => {
  // Herlaad alle data en geef feedback
  loadData()
    .then(() => {
      $q.notify({
        color: 'positive',
        message: $customT('notifications.dataUpdated'),
        icon: 'refresh',
      });
    })
    .catch(() => {
      $q.notify({
        color: 'negative',
        message: $customT('notifications.refreshDataError'),
        icon: 'error',
      });
    })
    .finally(() => {
      done();
    });
};

// -----------------------------
// Lifecycle: bij laden van de pagina
// -----------------------------
onMounted(async () => {
  await loadData();
});

// Cleanup bij verlaten van de pagina
onUnmounted(() => {
  // Geen cleanup meer nodig
});

// -----------------------------
// Visuele helpers
// -----------------------------

// Bepaal of de knop voor een hole blauw moet zijn (score ingevuld)
const isHoleBlue = (holeId: string) => {
  // Controleer of er een score is ingevuld voor deze hole in deze ronde
  return allScores.value.some(
    (s) => s.hole === String(holeId) && s.round === round.value?.id && s.score_player != null,
  );
};

// Pagina is read-only als de ronde is afgerond (is_finalized === true)
const isReadOnly = computed(() => round.value?.is_finalized === true);

// --- Computed property: kan oefenronde worden afgesloten? ---
const canFinishPracticeRound = computed(() => {
  if (!isPracticeRound.value || !holes.value.length) return false;
  // Controleer of voor alle holes een score_player is ingevuld
  return holes.value.every((hole) =>
    allScores.value.some(
      (s) => s.round === round.value?.id && s.hole === String(hole.id) && s.score_player != null,
    ),
  );
});

// --- Computed property: kan event ronde worden afgesloten? ---
const canFinishEventRound = computed(() => {
  if (!isEventRound.value || !holes.value.length) return false;
  // Controleer of voor alle holes een score_player is ingevuld in de huidige ronde
  return holes.value.every((hole) =>
    allScores.value.some(
      (s) => s.round === round.value.id && s.hole === String(hole.id) && s.score_player != null,
    ),
  );
});

// --- Functie om oefenronde af te sluiten ---
const finishPracticeRound = async () => {
  try {
    // Haal de "Afgerond" status op
    const completedStatus = await pb
      .collection('categories')
      .getFirstListItem(`cat_type="status" && name="Afgerond"`);

    // Zet de ronde op afgerond: is_active = false, is_finalized = true, status = Afgerond
    const updated = await pb.collection('rounds').update(round.value.id, {
      is_active: false,
      is_finalized: true,
      status: completedStatus.id,
    });
    $q.notify({
      color: 'positive',
      message: $customT('notifications.roundFinalized'),
      icon: 'check',
    });
    roundsStore.updateRound(updated);
    await loadData();
  } catch {
    debug('Fout bij afsluiten ronde');
    $q.notify({
      color: 'negative',
      message: $customT('notifications.finalizeRoundError'),
      icon: 'error',
    });
  }
};

// --- Functie om event ronde af te sluiten ---
const finishEventRound = async () => {
  try {
    // Haal de "Afgerond" status op
    const completedStatus = await pb
      .collection('categories')
      .getFirstListItem(`cat_type="status" && name="Afgerond"`);

    // Zet de ronde op afgerond: is_active = false, is_finalized = true, status = Afgerond
    const updated = await pb.collection('rounds').update(round.value.id, {
      is_active: false,
      is_finalized: true,
      status: completedStatus.id,
    });
    $q.notify({
      color: 'positive',
      message: $customT('notifications.eventRoundFinalized'),
      icon: 'check',
    });
    roundsStore.updateRound(updated);
    await loadData();
  } catch {
    debug('Fout bij afsluiten event ronde');
    $q.notify({
      color: 'negative',
      message: $customT('notifications.finalizeEventRoundError'),
      icon: 'error',
    });
  }
};

// Functie om oefenronde en scores te verwijderen
async function handleCancelPracticeRound() {
  try {
    // Alleen de ronde verwijderen; PocketBase verwijdert automatisch alle gekoppelde scores (cascade delete)
    await pb.collection('rounds').delete(round.value.id);
    $q.notify({
      color: 'positive',
      message: $customT('notifications.practiceRoundDeleted'),
      icon: 'check',
    });
    void router.push('/mijn-rondes');
  } catch {
    $q.notify({ color: 'negative', message: $customT('notifications.deleteError'), icon: 'error' });
  } finally {
    cancelDialog.value = false;
  }
}

// Functie om event ronde en scores te verwijderen
async function handleCancelEventRound() {
  try {
    // Alleen de ronde verwijderen; PocketBase verwijdert automatisch alle gekoppelde scores (cascade delete)
    await pb.collection('rounds').delete(round.value.id);
    $q.notify({
      color: 'positive',
      message: $customT('notifications.eventRoundDeleted'),
      icon: 'check',
    });
    void router.push('/mijn-rondes');
  } catch {
    $q.notify({ color: 'negative', message: $customT('notifications.deleteError'), icon: 'error' });
  } finally {
    cancelEventDialog.value = false;
  }
}

// Helper: check of alle scores zijn ingevuld
function allScoresEntered() {
  if (!holes.value.length) return false;
  return holes.value.every((hole) => {
    const score = allScores.value.find(
      (s) => s.hole === String(hole.id) && s.round === round.value?.id,
    );
    return score && score.score_player != null;
  });
}

// Nieuw: functie om ronde te finaliseren
async function finalizeRound() {
  try {
    // Haal de "Afgerond" status op
    const completedStatus = await pb
      .collection('categories')
      .getFirstListItem(`cat_type="status" && name="Afgerond"`);

    const updated = await pb.collection('rounds').update(round.value.id, {
      is_active: false,
      is_finalized: true,
      status: completedStatus.id,
    });
    $q.notify({
      color: 'positive',
      message: $customT('notifications.roundFinalized'),
      icon: 'check',
    });
    roundsStore.updateRound(updated);
    finalizeDialog.value = false;
    await loadData();
  } catch {
    $q.notify({
      color: 'negative',
      message: $customT('notifications.finalizeRoundError'),
      icon: 'error',
    });
  }
}
</script>

<style scoped>
/* Responsive styling voor acties */
.score-overview-actions-row {
  width: 100%;
}

.finalize-actions-row {
  flex-wrap: wrap;
}

.finalize-save-btn {
  min-width: 80px;
  font-size: 0.95em;
  white-space: nowrap;
}

@media (max-width: 400px) {
  .finalize-actions-row {
    flex-direction: column;
    align-items: stretch;
  }

  .finalize-save-btn {
    width: 100%;
    margin-top: 8px;
  }
}

.score-overview-actions-between {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0;
  margin-bottom: 0;
}

/* Slide-in paneel styling */
.score-slide-in {
  z-index: 2000;
}

.score-slide-in .q-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.score-slide-in .q-card__section:last-child {
  flex: 1;
  overflow-y: auto;
}

/* Responsive styling voor slide-in */
@media (max-width: 600px) {
  .score-slide-in {
    width: 100% !important;
  }
}

/* Compacte styling voor slide-in */
.score-slide-in .q-card__section {
  padding: 16px;
}

.score-slide-in .text-h5 {
  font-size: 1.5rem;
}

.score-slide-in .text-h6 {
  font-size: 1.25rem;
}
</style>
