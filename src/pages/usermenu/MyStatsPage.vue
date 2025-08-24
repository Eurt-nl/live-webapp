<template>
  <q-page padding>
    <!-- Handicap statistieken -->
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
          <div class="text-h4 text-right" v-if="currentHandicap !== null">
            {{ currentHandicap > 0 ? '+' : '' }}{{ currentHandicap.toFixed(1) }}
          </div>
          <div class="text-grey text-right" v-else>-</div>
        </div>

        <div v-if="loading" class="q-mt-md">
          <q-spinner size="md" color="primary" />
        </div>

        <!-- Error melding -->
        <div v-else-if="error" class="q-mt-md">
          <q-banner class="text-white bg-negative">
            {{ error }}
          </q-banner>
        </div>

        <!-- Handicap grafiek -->
        <div v-else>
          <!-- Handicap grafiek met ECharts -->
          <div v-if="currentHandicap !== null" class="q-mt-md">
            <v-chart
              :option="getHandicapChartOption"
              style="width: 100%; height: 200px"
              autoresize
            />
          </div>

          <!-- Geen handicap beschikbaar -->
          <div v-else class="text-grey q-mt-md">
            {{ $customT('stats.notEnoughRounds') }}
          </div>
        </div>

        <!-- Baan selectie dropdown -->
        <div v-if="availableCourses.length > 0" class="q-mt-lg">
          <div class="text-subtitle1 q-mb-md">{{ $customT('stats.courseStats') }}</div>
          <q-select
            v-model="selectedCourse"
            :options="availableCourses"
            option-value="value"
            option-label="label"
            :label="$customT('stats.selectCourse')"
            filled
            @update:model-value="(course) => changeCourse(course?.value || '')"
          >
            <template v-slot:prepend>
              <q-icon name="golf_course" />
            </template>
          </q-select>
        </div>

        <!-- Baan statistieken -->
        <div v-if="currentCourseStats" class="q-mt-md">
          <q-card flat bordered>
            <q-card-section>
              <div class="row items-center justify-between">
                <div class="col text-center">
                  <div class="text-h6 text-primary">{{ currentCourseStats.rounds_count }}</div>
                  <div class="text-caption">Rounds</div>
                </div>
                <div class="col text-center">
                  <div class="text-h6 text-positive">{{ currentCourseStats.best_score }}</div>
                  <div class="text-caption">Best</div>
                </div>
                <div class="col text-center">
                  <div class="text-h6 text-warning">
                    {{ currentCourseStats.avg_score.toFixed(1) }}
                  </div>
                  <div class="text-caption">Average</div>
                </div>
                <div class="col text-center">
                  <div class="text-h6 text-negative">{{ currentCourseStats.worst_score }}</div>
                  <div class="text-caption">Worst</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Hole statistieken radial chart -->
        <div v-if="currentCourseStats" class="q-mt-lg">
          <q-card flat bordered>
            <q-card-section>
              <div v-if="holeLoading" class="text-center q-pa-md">
                <q-spinner size="md" color="primary" />
                <div class="q-mt-sm">Laden hole statistieken...</div>
              </div>

              <div v-else-if="holeError" class="q-pa-md">
                <q-banner class="text-white bg-negative">
                  {{ holeError }}
                </q-banner>
              </div>

              <div v-else>
                <v-chart
                  :option="getHoleRadialChartOption"
                  style="width: 100%; height: 400px"
                  autoresize
                />
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Shortgame statistieken tabel -->
        <div v-if="currentCourseStats" class="q-mt-lg">
          <q-card flat bordered>
            <q-card-section class="q-pa-none">
              <div class="text-subtitle1 q-pa-md q-pb-sm">Shortgame Statistieken</div>

              <div v-if="shortgameLoading" class="text-center q-pa-md">
                <q-spinner size="md" color="primary" />
                <div class="q-mt-sm">Laden shortgame statistieken...</div>
              </div>

              <div v-else-if="shortgameError" class="q-pa-md">
                <q-banner class="text-white bg-negative">
                  {{ shortgameError }}
                </q-banner>
              </div>

              <div v-else-if="sortedShortgameStats.length === 0" class="text-center q-pa-md">
                <div class="text-grey">Geen shortgame data beschikbaar</div>
              </div>

              <div v-else>
                <!-- Compacte tabel layout voor shortgame statistieken -->
                <div class="shortgame-table-container">
                  <div class="shortgame-table">
                    <!-- Header -->
                    <div class="shortgame-row shortgame-header">
                      <div class="shortgame-cell">Hole</div>
                      <div class="shortgame-cell">GIR</div>
                      <div class="shortgame-cell">Scramble</div>
                      <div class="shortgame-cell">Putts</div>
                      <div class="shortgame-cell">Chip-in</div>
                    </div>

                    <!-- Data rows -->
                    <div v-for="stat in sortedShortgameStats" :key="stat.id" class="shortgame-row">
                      <div class="shortgame-cell hole-number">{{ stat.hole }}</div>
                      <div class="shortgame-cell">
                        {{ stat.gir_pct ? stat.gir_pct.toFixed(1) + '%' : '-' }}
                      </div>
                      <div class="shortgame-cell">
                        {{ stat.scramble_pct ? stat.scramble_pct.toFixed(1) + '%' : '-' }}
                      </div>
                      <div class="shortgame-cell">
                        {{ stat.putts_avg_gir ? stat.putts_avg_gir.toFixed(1) : '-' }}
                      </div>
                      <div class="shortgame-cell">{{ stat.chipin > 0 ? stat.chipin : '-' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
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
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VChart from 'vue-echarts';
import { useHandicapStats } from 'src/composables/useHandicapStats';
import { useCourseStats } from 'src/composables/useCourseStats';
import { useHoleStats } from 'src/composables/useHoleStats';
import { useShortgameStats } from 'src/composables/useShortgameStats';

const { t: $customT } = useI18n();

// Gebruik de handicap composable
const { loading, error, currentHandicap, fetchHandicapData, getHandicapChartOption } =
  useHandicapStats();

// Gebruik de baan statistieken composable
const { availableCourses, currentCourseStats, selectedCourse, fetchCourseStats, changeCourse } =
  useCourseStats();

// Gebruik de hole statistieken composable
const {
  loading: holeLoading,
  error: holeError,
  fetchHoleStats,
  getHoleRadialChartOption,
} = useHoleStats();

// Gebruik de shortgame statistieken composable
const {
  loading: shortgameLoading,
  error: shortgameError,
  sortedShortgameStats,
  fetchShortgameStats,
} = useShortgameStats();

// Reactieve variabelen
const showInfoDialog = ref(false);

// Laad data bij mount
onMounted(async () => {
  await Promise.all([fetchHandicapData(), fetchCourseStats()]);
});

// Watch voor veranderingen in selectedCourse om hole stats en shortgame stats te laden
watch(
  selectedCourse,
  async (newCourse) => {
    if (newCourse?.value) {
      await Promise.all([fetchHoleStats(newCourse.value), fetchShortgameStats(newCourse.value)]);
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.text-right {
  text-align: right;
}

.shortgame-table-container {
  width: 100%;
  overflow-x: auto;
}

.shortgame-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 0; /* Geen border radius meer */
  overflow: hidden;
  box-shadow: none; /* Geen shadow meer */
}

.shortgame-row {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
}

.shortgame-row:last-child {
  border-bottom: none;
}

.shortgame-row:hover {
  background-color: #f5f5f5;
}

.shortgame-header {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.shortgame-cell {
  flex: 1;
  padding: 12px 8px;
  text-align: center;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.shortgame-header .shortgame-cell {
  font-weight: 600;
  color: #495057;
}

.hole-number {
  font-weight: 700;
  color: #1976d2;
}

/* Responsive voor kleine schermen */
@media (max-width: 600px) {
  .shortgame-cell {
    padding: 8px 4px;
    font-size: 12px;
  }
}
</style>
