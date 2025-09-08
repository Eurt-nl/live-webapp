<template>
  <div class="q-pa-md">
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">{{ $customT('stats.roundDetails') }}</div>
    </div>
    <div v-if="loading" class="row justify-center">
      <q-spinner color="primary" size="3em" />
    </div>

    <div v-else-if="round" class="q-gutter-md">
      <div class="row justify-between items-center">
        <div class="text-h4">{{ round.expand?.category?.name }}</div>
        <!-- Toon alleen status chip als de status niet 'geannuleerd' is -->
        <q-chip
          v-if="round.expand?.status?.name?.toLowerCase() !== 'geannuleerd'"
          :color="getStatusColor(round.expand?.status?.name)"
          text-color="white"
        >
          {{ round.expand?.status?.name }}
        </q-chip>
      </div>

      <q-card>
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <div class="text-subtitle2">{{ $customT('stats.course') }}</div>
              <div>{{ round.expand?.course?.name }}</div>
              <div class="text-caption text-grey-8">
                {{ round.expand?.course?.city
                }}{{
                  round.expand?.course?.expand?.country?.name
                    ? ', ' + round.expand?.course?.expand?.country?.name
                    : ''
                }}
              </div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-subtitle2">{{ $customT('practiceRound.dateTime') }}</div>
              <div>{{ formatDate(round.date) }}</div>
            </div>
            <div
              class="col-12 col-sm-6"
              v-if="round.flight && round.flight !== $customT('scores.flightNotSpecified')"
            >
              <div class="text-subtitle2">{{ $customT('scores.flight') }}</div>
              <div>{{ round.flight }}</div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-subtitle2">{{ $customT('practiceRound.notes') }}</div>
              <div>{{ round.notes || $customT('scores.noNotes') }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Ronde statistieken -->
      <q-card v-if="roundStats">
        <q-card-section>
          <div class="text-h6">{{ $customT('stats.roundStats') }}</div>
          <div class="row q-col-gutter-sm q-mt-md">
            <div class="col-3">
              <div class="text-center">
                <div class="text-h6 text-primary">{{ formatPercentage(roundStats.gir_pct) }}</div>
                <div class="text-caption">{{ $customT('stats.gir') }}</div>
              </div>
            </div>
            <div class="col-3">
              <div class="text-center">
                <div class="text-h6 text-positive">
                  {{ formatPercentage(roundStats.scramble_pct) }}
                </div>
                <div class="text-caption">{{ $customT('stats.scramble') }}</div>
              </div>
            </div>
            <div class="col-3">
              <div class="text-center">
                <div class="text-h6 text-warning">{{ formatPutts(roundStats.putts_avg_gir) }}</div>
                <div class="text-caption">{{ $customT('stats.putts') }}</div>
              </div>
            </div>
            <div class="col-3">
              <div class="text-center">
                <div class="text-h6 text-info">{{ roundStats.chipin_total || 0 }}</div>
                <div class="text-caption">{{ $customT('stats.chipIn') }}</div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Scores overzicht -->
      <q-card v-if="holes.length > 0">
        <q-card-section>
          <div class="row justify-between items-center">
            <div class="text-h6">{{ $customT('scores.scoreOverview') }}</div>
            <div class="text-h6">{{ calculateTotalScore() }}</div>
          </div>
          <div class="row q-col-gutter-md q-mt-md">
            <div class="col-12">
              <!-- Front 9 holes met totaal -->
              <div class="row q-col-gutter-xs">
                <div v-for="hole in holes.slice(0, 9)" :key="hole.id" class="col-1">
                  <div class="text-center">
                    <div class="text-caption text-weight-bold">{{ String(hole.hole || '') }}</div>
                    <div
                      class="text-body2"
                      :style="{
                        backgroundColor: getScoreColor(getScore(hole.id)?.score_player),
                      }"
                    >
                      {{ getScore(hole.id)?.score_player || '-' }}
                    </div>
                  </div>
                </div>
                <div class="col-3">
                  <div class="text-center">
                    <div class="text-caption text-weight-bold">{{ $customT('stats.front9') }}</div>
                    <div class="text-body2 text-weight-bold">
                      {{ calculateScoreForHoles(0, 9) }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Back 9 holes met totaal -->
              <div class="row q-col-gutter-xs q-mt-sm">
                <div v-for="hole in holes.slice(9)" :key="hole.id" class="col-1">
                  <div class="text-center">
                    <div class="text-caption text-weight-bold">{{ String(hole.hole || '') }}</div>
                    <div
                      class="text-body2"
                      :style="{
                        backgroundColor: getScoreColor(getScore(hole.id)?.score_player),
                      }"
                    >
                      {{ getScore(hole.id)?.score_player || '-' }}
                    </div>
                  </div>
                </div>
                <div class="col-3">
                  <div class="text-center">
                    <div class="text-caption text-weight-bold">{{ $customT('stats.back9') }}</div>
                    <div class="text-body2 text-weight-bold">
                      {{ calculateScoreForHoles(9, 18) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Leaderboard widget voor event rondes -->
      <LeaderboardWidget
        v-if="round?.event"
        :event-id="String(round.event)"
        :current-user-id="round?.player || ''"
      />

      <div class="row justify-end">
        <q-btn flat color="primary" :label="$customT('scores.back')" @click="router.back()" />
      </div>
    </div>

    <div v-else class="text-center">
      <div class="text-h6">{{ $customT('scores.roundNotFound') }}</div>
      <q-btn flat color="primary" :label="$customT('scores.back')" @click="router.back()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { usePocketbase } from 'src/composables/usePocketbase';
import { debug } from 'src/utils/debug';
import { getScoreColor } from 'src/constants/scoreColors';
import LeaderboardWidget from 'src/components/LeaderboardWidget.vue';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const { t: $customT } = useI18n();
const { pb } = usePocketbase();

interface Score {
  id?: string;
  score_player?: number;
  score_marker?: number;
  note?: string;
}

interface Hole {
  id: string;
  hole: number;
  par: number;
  hole_length: number;
}

const round = ref(null);
const holes = ref<Hole[]>([]);
const scores = ref<Record<string, Score>>({});
const roundStats = ref(null);
const loading = ref(true);

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

const getScore = (holeId: string) => {
  if (!scores.value[holeId]) {
    scores.value[holeId] = {};
  }
  return scores.value[holeId];
};

const loadData = async () => {
  try {
    loading.value = true;

    // Haal ronde op
    const roundResult = await pb.collection('rounds').getOne(route.params.id as string, {
      expand: 'course,category,status,course.country',
    });
    round.value = roundResult;

    // Haal holes op
    const holesResult = await pb.collection('course_detail').getList(1, 50, {
      filter: `course = "${roundResult.course}"`,
      sort: 'hole',
    });
    holes.value = holesResult.items as unknown as Hole[];

    // Haal scores op
    const roundId = String(route.params.id ?? '');
    const scoresResult = await pb.collection('round_scores').getList(1, 50, {
      filter: `round = "${roundId}"`,
      expand: 'hole',
    });

    // Reset scores ref
    scores.value = {};

    // Zet scores in de juiste vorm
    scoresResult.items.forEach((score) => {
      if (!scores.value[score.hole]) {
        scores.value[score.hole] = {};
      }
      scores.value[score.hole] = {
        id: score.id,
        score_player: score.score_player,
        score_marker: score.score_marker,
        note: score.note,
      };
    });

    // Haal ronde statistieken op
    try {
      const statsResult = await pb.collection('vw_round_stats').getList(1, 1, {
        filter: `round_id = "${roundId}"`,
      });

      if (statsResult.items.length > 0) {
        roundStats.value = statsResult.items[0];
      }
    } catch (error) {
      debug('Error loading round stats:', error);
      // Statistieken zijn optioneel, dus geen error notificatie
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

const calculateTotalScore = () => {
  let totalDiff = 0;

  // Loop door alle scores en bereken het verschil met par
  Object.entries(scores.value).forEach(([holeId, score]) => {
    if (score.score_player) {
      // Vind de bijbehorende hole voor de par
      const hole = holes.value.find((h) => h.id === holeId);
      if (hole) {
        // Bereken het verschil tussen score en par
        const diff = score.score_player - hole.par;
        totalDiff += diff;
      }
    }
  });

  return `${totalDiff > 0 ? '+' : ''}${totalDiff}`;
};

// Formatteren van percentage waarden voor statistieken
const formatPercentage = (value: number | null) => {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(1)}%`;
};

// Formatteren van putts gemiddelde
const formatPutts = (value: number | null) => {
  if (value === null || value === undefined) return '-';
  return value.toFixed(1);
};

// Bereken score voor specifieke holes (bijv. front 9 of back 9)
const calculateScoreForHoles = (startIndex: number, endIndex: number) => {
  let totalDiff = 0;
  const holesToCalculate = holes.value.slice(startIndex, endIndex);

  holesToCalculate.forEach((hole) => {
    const score = getScore(hole.id);
    if (score.score_player) {
      const diff = score.score_player - hole.par;
      totalDiff += diff;
    }
  });

  return `${totalDiff > 0 ? '+' : ''}${totalDiff}`;
};

onMounted(() => {
  void loadData();
});
</script>
