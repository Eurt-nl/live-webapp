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
            <div class="text-subtitle2 q-mb-sm">{{ $customT('stats.handicapDevelopment') }}</div>
            <v-chart
              :option="getHandicapChartOption"
              style="width: 100%; height: 300px"
              autoresize
            />
          </div>

          <!-- Geen handicap beschikbaar -->
          <div v-else class="text-grey q-mt-md">
            {{ $customT('stats.notEnoughRounds') }}
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
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import VChart from 'vue-echarts';
import { useHandicapStats } from 'src/composables/useHandicapStats';

const { t: $customT } = useI18n();

// Gebruik de nieuwe handicap composable
const {
  loading,
  error,
  currentHandicap,
  fetchHandicapData,
  getHandicapChartOption,
} = useHandicapStats();

// Reactieve variabelen
const showInfoDialog = ref(false);

// Laad handicap data bij mount
onMounted(async () => {
  await fetchHandicapData();
});
</script>

<style scoped>
.text-right {
  text-align: right;
}
</style>
