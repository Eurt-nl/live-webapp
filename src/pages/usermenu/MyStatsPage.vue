<template>
  <q-page padding>
    <!-- Alleen het handicap-blok blijft over -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="text-subtitle1 row items-center">
            {{ $customT('stats.myHandicap') }}:
            <!-- Info-icoon met tooltip en dialog -->
            <q-btn
              flat
              dense
              round
              icon="info"
              size="sm"
              class="q-ml-xs"
              @click="showInfoDialog = true"
            >
              <q-tooltip> {{ $customT('stats.handicapExplanation') }} </q-tooltip>
            </q-btn>
          </div>
          <div class="text-h4 text-right" v-if="handicap !== null">
            {{ handicap > 0 ? '+' : '' }}{{ handicap.toFixed(1) }}
          </div>
          <div class="text-grey text-right" v-else>-</div>
        </div>
        <div v-if="loading" class="q-mt-md"><q-spinner size="md" color="primary" /></div>
        <!-- Tabel met handicap-ontwikkeling -->
        <div v-else>
          <div v-if="handicapTableData.length > 0">
            <q-table
              :rows="handicapTableData"
              :columns="handicapTableColumns"
              row-key="id"
              dense
              flat
              hide-bottom
              class="q-mb-md"
            >
              <template v-slot:body-cell-verschil="props">
                <q-td :props="props">
                  <span
                    :class="{ 'text-negative': props.value > 0, 'text-positive': props.value < 0 }"
                  >
                    {{ props.value > 0 ? '+' : '' }}{{ props.value }}
                  </span>
                </q-td>
              </template>
            </q-table>
          </div>
          <div v-if="handicap === null" class="text-grey q-mt-md">
            {{ $customT('stats.notEnoughRounds') }}
          </div>
          <div v-else>
            <div class="text-subtitle2 q-mb-sm">{{ $customT('stats.handicapDevelopment') }}</div>
            <!-- Line chart van vue-chartjs, altijd up-to-date -->
            <Line
              :key="lineChartKey"
              :data="lineChartData"
              :options="lineChartOptions"
              style="max-width: 100%; min-height: 120px; height: 140px"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Dialog met uitleg over de handicapberekening -->
    <q-dialog v-model="showInfoDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ $customT('stats.handicapExplanationTitle') }}</div>
        </q-card-section>
        <q-card-section>
          <div>
            {{ $customT('stats.handicapExplanationText') }}
            <ul>
              <li>{{ $customT('stats.handicapRule1') }}</li>
              <li>{{ $customT('stats.handicapRule2') }}</li>
              <li>
                {{ $customT('stats.handicapRule3') }}
              </li>
              <li>
                {{ $customT('stats.handicapRule4') }}
              </li>
              <li>{{ $customT('stats.handicapRule5') }}</li>
            </ul>
            {{ $customT('stats.handicapChartExplanation') }}
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$customT('stats.close')" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';

import { useAuthStore } from 'stores/auth';
import { usePocketbase } from 'src/composables/usePocketbase';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
// import type { Course } from 'src/components/models';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Filler,
  ChartDataLabels,
);

const $q = useQuasar();

const authStore = useAuthStore();
const pb = usePocketbase();

// Definieer een type voor een ronde-statistiek
interface RoundStat {
  id: string;
  date: string;
  verschil: number;
  totaalScore: number;
  aantalHoles: number;
  par: number;
  round: Record<string, unknown>;
  status: string;
  courseId: string;
}

const loading = ref(true);
const handicap = ref<number | null>(null);
const handicapRondes = ref<RoundStat[]>([]);
const handicapHistory = ref<{ date: string; handicap: number; roundStat: RoundStat }[]>([]);
const showInfoDialog = ref(false);
const selectedIndex = ref<number | null>(null);
const handicapRoundsCount = ref(0);

// Verzamel alle rondes voor statistieken (ook als <5 rondes)
const allStatsRounds = ref<RoundStat[]>([]);

// Maak allScores een ref zodat deze overal beschikbaar is
const allScores = ref<
  { round: string; score_player: number; hole?: string; score_marker?: number; note?: string }[]
>([]);

// Laatste 10 afgeronde rondes (op datum, oud -> nieuw)
const last10Rounds = computed(() => {
  const rounds = allStatsRounds.value.filter((r) => r.round?.is_finalized === true);
  // Sorteer op datum (oud -> nieuw)
  return rounds.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-10);
});

// Computed property voor de data-array van de grafiek (altijd alleen getallen)
const handicapData = computed(() => {
  // Map naar array van getallen (verschil t.o.v. par)
  return last10Rounds.value.map((r) => {
    const diff = Number(r.verschil);
    return isNaN(diff) ? 0 : diff;
  });
});

// Unieke key voor de Line chart, zodat deze altijd forced re-rendered bij filter-wijzigingen
const lineChartKey = computed(() => {
  return `handicap-${handicapData.value.length}-${handicapData.value.join(',')}`;
});

// Opties voor de grafiek (minimalistisch, modern)
const lineChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (ctx) => `Handicap: ${ctx.parsed.y > 0 ? '+' : ''}${ctx.parsed.y}`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        callback: (v) => (v > 0 ? '+' : '') + v,
      },
    },
  },
};

// Formatteer datum als dd-mm-yyyy
function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('nl-NL');
}

// Haal alle afgeronde rondes van de gebruiker op en bereken de handicap + geschiedenis
onMounted(async () => {
  try {
    loading.value = true;
    const userId = authStore.user?.id;
    if (!userId) throw new Error('Geen gebruiker gevonden');
    // Haal maximaal de laatste 30 afgeronde rondes op (is_finalized === true)
    const roundsResult = await pb.collection('rounds').getList(1, 30, {
      filter: `player = "${userId}" && is_finalized = true`,
      sort: '-date',
      expand: 'course,category',
    });
    const rounds = roundsResult.items;
    if (!rounds.length || rounds.length < 5) {
      handicap.value = null;
      handicapRondes.value = [];
      handicapHistory.value = [];
      return;
    }
    // Haal alle scores op voor deze rondes
    const roundIds = rounds.map((r) => r.id);
    let allScoresArr: { round: string; score_player: number }[] = [];
    for (let i = 0; i < roundIds.length; i += 10) {
      const batchIds = roundIds.slice(i, i + 10);
      const filter = batchIds.map((id) => `round = "${id}"`).join(' || ');
      const scoresResult = await pb.collection('round_scores').getList(1, 200, { filter });
      allScoresArr = allScoresArr.concat(
        (scoresResult.items as unknown[]).map((s) => {
          if (typeof s === 'object' && s !== null && 'round' in s && 'score_player' in s) {
            return {
              round: (s as { round: string }).round,
              score_player: (s as { score_player: number }).score_player,
            };
          }
          return { round: '', score_player: 0 };
        }),
      );
    }
    allScores.value = allScoresArr;
    // Bereken per ronde het verschil t.o.v. par
    const roundStats = rounds
      .map((round) => {
        const scores = allScoresArr.filter(
          (s) => s.round === round.id && typeof s.score_player === 'number',
        );
        const totaalScore = scores.reduce((sum, s) => sum + s.score_player, 0);
        const aantalHoles = scores.length;
        const par = aantalHoles * 3;
        const verschil = aantalHoles > 0 ? totaalScore - par : null;
        return {
          id: round.id,
          date: round.date,
          totaalScore,
          aantalHoles,
          par,
          verschil,
          round,
          status: round.status,
          courseId: round.course,
        };
      })
      .filter((r) => r.verschil !== null);
    // Sorteer op datum (nieuwste eerst)
    roundStats.sort((a, b) => (b.date > a.date ? 1 : -1));
    // Selecteer de laatste 10 rondes (of minder)
    const laatste10 = roundStats.slice(0, 10);
    // Sorteer deze op verschil (beste eerst, dus laagste verschil)
    const beste5 = [...laatste10].sort((a, b) => a.verschil - b.verschil).slice(0, 5);
    if (beste5.length < 5) {
      handicap.value = null;
      handicapRondes.value = [];
      handicapHistory.value = [];
      return;
    }
    handicap.value = beste5.reduce((sum, r) => sum + r.verschil, 0) / 5;
    handicapRondes.value = beste5;
    // Handicap-ontwikkeling berekenen: voor elke ronde vanaf de 5e, bereken het gemiddelde van de beste 5 van de laatste 10 tot dat moment
    const history: { date: string; handicap: number; roundStat: RoundStat }[] = [];
    for (let i = roundStats.length - 1; i >= 4; i--) {
      const slice = roundStats.slice(Math.max(0, i - 9), i + 1);
      const beste5hist = [...slice].sort((a, b) => a.verschil - b.verschil).slice(0, 5);
      if (beste5hist.length === 5) {
        const avg = beste5hist.reduce((sum, r) => sum + r.verschil, 0) / 5;
        // Koppel de ronde van het laatst toegevoegde punt (laatste in slice)
        history.push({
          date: slice[slice.length - 1].date,
          handicap: avg,
          roundStat: slice[slice.length - 1],
        });
      }
    }
    handicapHistory.value = [...history.reverse()];
    handicapRoundsCount.value = rounds.length;
    selectedIndex.value = maxIndexDisplay.value;
  } catch (error: unknown) {
    handicap.value = null;
    handicapRondes.value = [];
    handicapHistory.value = [];
    handicapRoundsCount.value = 0;
    $q.notify({
      color: 'negative',
      message:
        'Fout bij berekenen handicap: ' +
        (error instanceof Error ? error.message : JSON.stringify(error)),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
});

// Computed property voor de tabeldata: laatste 10 afgeronde rondes, gesorteerd op datum (oud -> nieuw)
const handicapTableData = computed(() => {
  return last10Rounds.value.map((r) => ({
    id: r.id,
    date: formatDate(r.date),
    totaalScore: r.totaalScore,
    par: r.par,
    verschil: r.verschil,
  }));
});

// Kolommen voor de q-table
const handicapTableColumns = [
  { name: 'date', label: 'Datum', field: 'date', align: 'left' as const, sortable: true },
  {
    name: 'totaalScore',
    label: 'Score',
    field: 'totaalScore',
    align: 'right' as const,
    sortable: true,
  },
  { name: 'par', label: 'Par', field: 'par', align: 'right' as const, sortable: true },
  {
    name: 'verschil',
    label: 'Verschil',
    field: 'verschil',
    align: 'right' as const,
    sortable: true,
  },
];

// Definitieve grafiekdata: gebruikt exact de tabel als bron
const lineChartData = computed(() => ({
  labels: handicapTableData.value.map((r) => r.date),
  datasets: [
    {
      label: 'Handicap (verschil t.o.v. par)',
      data: handicapTableData.value.map((r) => r.verschil),
      borderColor: '#1976d2',
      backgroundColor: 'rgba(25, 118, 210, 0.15)',
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#1976d2',
      fill: true,
    },
  ],
}));

const maxIndexDisplay = computed(() => {
  // Dummy, alleen voor compatibiliteit
  return 0;
});
</script>

<style scoped>
.text-right {
  text-align: right;
}
</style>
