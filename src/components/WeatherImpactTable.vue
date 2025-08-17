<template>
  <div>
    <!-- Weer-invloed icoontje -->
    <q-btn
      round
      color="primary"
      icon="wb_sunny"
      size="sm"
      @click="showDialog = true"
      :loading="weatherLoading"
      :disable="!hasValidGPSData"
    >
      <q-tooltip>{{ $customT('weather.impactTable') }}</q-tooltip>
    </q-btn>

    <!-- Dialog met weer-invloed tabel -->
    <q-dialog v-model="showDialog" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ $customT('weather.impactTable') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <!-- Weer informatie -->
          <div v-if="weatherData" class="q-mb-md">
            <q-card flat bordered>
              <q-card-section class="q-pa-sm">
                <div class="row q-gutter-md">
                  <div class="col text-center">
                    <div class="text-caption">{{ $customT('weather.temperature') }}</div>
                    <div class="text-h6">{{ temperatureText }}</div>
                  </div>
                  <div class="col text-center">
                    <div class="text-caption">{{ $customT('weather.windSpeed') }}</div>
                    <div class="text-h6">{{ windSpeedText }}</div>
                  </div>
                  <div class="col text-center">
                    <div class="text-caption">{{ $customT('weather.windDirection') }}</div>
                    <div class="text-h6">{{ windDirectionText }}</div>
                  </div>
                </div>
                <div class="text-caption text-center q-mt-sm">
                  {{ $customT('weather.lastUpdated') }}: {{ formatTime(lastUpdated) }}
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Loading state -->
          <div v-if="weatherLoading" class="text-center q-pa-md">
            <q-spinner color="primary" size="2em" />
            <div class="q-mt-sm">{{ $customT('weather.loading') }}</div>
          </div>

          <!-- Error state -->
          <div v-else-if="weatherError" class="text-center q-pa-md">
            <q-icon name="error" color="negative" size="2em" />
            <div class="q-mt-sm text-negative">{{ weatherError }}</div>
            <q-btn
              :label="$customT('weather.retry')"
              color="primary"
              @click="loadWeatherData"
              class="q-mt-sm"
            />
          </div>

          <!-- Weer-invloed tabel -->
          <div v-if="weatherData && weatherImpactTable.length > 0">
            <!-- Korte uitleg -->
            <div class="q-mb-md">
              <div class="text-caption text-grey-7 text-center">
                {{ $customT('weather.explanation') }}
              </div>
            </div>

            <!-- Tabel -->
            <q-table
              :rows="weatherImpactTable"
              :columns="columns"
              row-key="hole"
              dense
              flat
              bordered
              :pagination="{ rowsPerPage: 0 }"
              hide-bottom
              class="weather-impact-table"
            >
              <!-- Custom cell voor correctie -->
              <template v-slot:body-cell-correction="props">
                <q-td :props="props">
                  {{ props.value }}
                </q-td>
              </template>

              <!-- Custom cell voor vandaag (met kleur voor verschil) -->
              <template v-slot:body-cell-today="props">
                <q-td :props="props">
                  <span :class="getTodayClass(props.row)"> {{ props.value }} </span>
                </q-td>
              </template>
            </q-table>
          </div>

          <!-- Geen GPS data -->
          <div v-else-if="!hasValidGPSData" class="text-center q-pa-md">
            <q-icon name="gps_off" color="grey" size="2em" />
            <div class="q-mt-sm text-grey">{{ $customT('weather.noGPSData') }}</div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$customT('common.close')" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWeather, type WeatherData } from 'src/composables/useWeather';
import { computeAdjustedTable, type HoleInput, type WeatherInput } from 'src/utils/ballflight';
import { calculateBearing, isValidGPSPoint, type GPSPoint } from 'src/utils/gps-utils';

interface Props {
  courseId: string;
  holes: Array<{
    id: string;
    hole: number;
    hole_length: number;
    gps_tee?: GPSPoint | null;
    gps_green?: GPSPoint | null;
  }>;
}

const props = defineProps<Props>();

const { t: $customT } = useI18n();
const {
  weatherData,
  loading: weatherLoading,
  error: weatherError,
  lastUpdated,
  fetchWeather,
  windDirectionText,
  temperatureText,
  windSpeedText,
} = useWeather();

const showDialog = ref(false);
const weatherImpactTable = ref<
  Array<{
    hole: number;
    length: number;
    today: number;
    correction: string;
  }>
>([]);

// Controleer of er geldige GPS data is
const hasValidGPSData = computed(() => {
  return props.holes.some(
    (hole) =>
      hole.gps_tee &&
      hole.gps_green &&
      isValidGPSPoint(hole.gps_tee) &&
      isValidGPSPoint(hole.gps_green),
  );
});

// Tabel kolommen
const columns = [
  {
    name: 'hole',
    label: $customT('weather.hole'),
    field: 'hole',
    align: 'center' as const,
    sortable: true,
  },
  {
    name: 'length',
    label: $customT('weather.length'),
    field: 'length',
    align: 'center' as const,
    format: (val: number) => `${val}m`,
  },
  {
    name: 'today',
    label: $customT('weather.today'),
    field: 'today',
    align: 'center' as const,
    format: (val: number) => `${val}m`,
  },
  {
    name: 'correction',
    label: $customT('weather.correction'),
    field: 'correction',
    align: 'center' as const,
  },
];

// Laad weerdata wanneer dialog opent
watch(showDialog, (newValue) => {
  if (newValue && hasValidGPSData.value) {
    loadWeatherData();
  }
});

// Laad weerdata voor de baan
const loadWeatherData = async () => {
  if (!hasValidGPSData.value) return;

  // Gebruik de eerste hole met geldige GPS data als locatie
  const firstValidHole = props.holes.find(
    (hole) =>
      hole.gps_tee &&
      hole.gps_green &&
      isValidGPSPoint(hole.gps_tee) &&
      isValidGPSPoint(hole.gps_green),
  );

  if (firstValidHole && firstValidHole.gps_tee) {
    await fetchWeather({
      latitude: firstValidHole.gps_tee.latitude,
      longitude: firstValidHole.gps_tee.longitude,
    });
  }
};

// Bereken weer-invloed tabel wanneer weerdata beschikbaar is
watch(
  weatherData,
  (newWeatherData) => {
    if (newWeatherData && hasValidGPSData.value) {
      calculateWeatherImpact(newWeatherData);
    }
  },
  { immediate: true },
);

// Bereken de weer-invloed voor alle holes
const calculateWeatherImpact = (weather: WeatherData) => {
  // Converteer holes naar het formaat dat ballflight verwacht
  const holeInputs: HoleInput[] = props.holes
    .filter(
      (hole) =>
        hole.gps_tee &&
        hole.gps_green &&
        isValidGPSPoint(hole.gps_tee) &&
        isValidGPSPoint(hole.gps_green),
    )
    .map((hole) => {
      const bearing = calculateBearing(hole.gps_tee!, hole.gps_green!);
      return {
        hole: hole.hole,
        length_m: hole.hole_length || 0,
        bearing_deg: bearing,
      };
    });

  // Weer input voor ballflight berekening
  const weatherInput: WeatherInput = {
    T_c: weather.temperature,
    wind_speed_10m: weather.windSpeed,
    wind_dir_from_deg: weather.windDirection,
  };

  // Bereken aangepaste tabel
  const adjustedTable = computeAdjustedTable(holeInputs, weatherInput);

  // Converteer naar ons tabel formaat
  weatherImpactTable.value = adjustedTable.map((row) => ({
    hole: row.hole,
    length: row.normaal,
    today: row.aangepast,
    correction: row.richt,
  }));
};

// Helper functies voor styling
const getTodayClass = (row: { length: number; today: number }) => {
  const diff = row.today - row.length;
  if (diff > 0) return 'text-positive';
  if (diff < 0) return 'text-negative';
  return 'text-grey';
};

const formatTime = (date: Date | null) => {
  if (!date) return '';
  return date.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<style lang="scss" scoped>
.weather-impact-table {
  .q-table__top {
    padding: 8px 16px;
  }

  .q-table__container {
    border-radius: 8px;
  }
}
</style>
