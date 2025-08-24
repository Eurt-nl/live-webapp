<template>
  <q-card class="weather-widget" flat bordered>
    <q-card-section class="q-pa-md">
      <div class="row items-center justify-between">
        <div class="text-h6">{{ $customT('weather.title') }}</div>
      </div>

      <!-- Locatie niet beschikbaar -->
      <div v-if="!userLocation" class="text-center q-pa-md">
        <q-icon name="location_off" size="48px" color="grey" />
        <div class="text-body2 text-grey q-mt-sm">
          {{ $customT('weather.locationRequired') }}
        </div>
      </div>

      <!-- Weer data -->
      <div v-else-if="weatherData" class="weather-content">
        <div class="weather-main">
          <div class="weather-info">
            <div class="text-h4">{{ weatherData.temperature }}°C</div>
            <div class="text-body1">{{ weatherData.description }}</div>
            <div class="text-caption text-grey">
              {{ $customT('weather.feelsLike') }} {{ weatherData.feelsLike }}°C
            </div>
          </div>
          <div class="weather-icon">
            <q-icon :name="getWeatherIcon(weatherData.symbol)" size="48px" color="primary" />
          </div>
        </div>

        <!-- Weer details -->
        <div class="weather-details">
          <div class="detail-item">
            <q-icon name="opacity" size="20px" color="blue" />
            <div class="text-body2">{{ weatherData.humidity }}%</div>
          </div>
          <div class="detail-item">
            <q-icon name="air" size="20px" color="grey" />
            <div class="text-body2">{{ weatherData.windSpeed }} m/s</div>
          </div>
          <div class="detail-item">
            <q-icon name="visibility" size="20px" color="orange" />
            <div class="text-body2">{{ weatherData.pressure }} hPa</div>
          </div>
          <div class="detail-item">
            <q-icon name="cloud" size="20px" color="blue-grey" />
            <div class="text-body2">{{ weatherData.cloudCover }}%</div>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-else-if="isLoading" class="text-center q-pa-md">
        <q-spinner size="48px" color="primary" />
        <div class="text-body2 q-mt-sm">{{ $customT('weather.loading') }}</div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center q-pa-md">
        <q-icon name="error" size="48px" color="negative" />
        <div class="text-body2 text-negative q-mt-sm">{{ error }}</div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useLocationStore } from 'stores/location';
import { useLocationFocus } from 'src/composables/useLocationFocus';

const { t: $customT } = useI18n();
const locationStore = useLocationStore();

// Setup focus-based locatie ophaling
useLocationFocus();

// Reactive data
const weatherData = ref<WeatherData | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Types
interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  cloudCover: number;
  description: string;
  symbol: string;
  lastUpdated: string;
}

// Computed properties
const userLocation = computed(() => locationStore.userLocation);

const fetchWeather = async () => {
  if (!userLocation.value) {
    error.value = $customT('weather.locationRequired');
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    // Format coordinates to max 4 decimal places as per API requirement
    const lat = Number(userLocation.value.latitude.toFixed(4));
    const lon = Number(userLocation.value.longitude.toFixed(4));

    const response = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`,
      {
        headers: {
          Accept: 'application/json',
        },
        // CORS-vriendelijke configuratie voor iOS PWA
        mode: 'cors',
        credentials: 'omit',
      },
    );

    if (!response.ok) {
      console.error(`Weather API error: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Extract current weather from the first timeseries entry
    const currentWeather = data.properties.timeseries[0];
    const details = currentWeather.data.instant.details;

    weatherData.value = {
      temperature: Math.round(details.air_temperature),
      feelsLike: Math.round(details.air_temperature), // Gebruik gewone temperatuur als fallback
      humidity: Math.round(details.relative_humidity),
      windSpeed: Math.round(details.wind_speed * 10) / 10, // 1 decimal
      pressure: Math.round(details.air_pressure_at_sea_level),
      cloudCover: Math.round(details.cloud_area_fraction),
      description: getWeatherDescription(
        data.properties.timeseries[0].data.next_1_hours?.summary?.symbol_code || 'fair_day',
      ),
      symbol: data.properties.timeseries[0].data.next_1_hours?.summary?.symbol_code || 'fair_day',
      lastUpdated: currentWeather.time,
    };
  } catch (err) {
    console.error('Error fetching weather:', err);
    error.value = $customT('weather.fetchError');
  } finally {
    isLoading.value = false;
  }
};

const getWeatherDescription = (symbolCode: string): string => {
  // Map MET Norway symbol codes to readable descriptions
  const descriptions: Record<string, string> = {
    clearsky_day: $customT('weather.clearsky'),
    clearsky_night: $customT('weather.clearsky'),
    clearsky_polartwilight: $customT('weather.clearsky'),
    fair_day: $customT('weather.fair'),
    fair_night: $customT('weather.fair'),
    fair_polartwilight: $customT('weather.fair'),
    partlycloudy_day: $customT('weather.partlycloudy'),
    partlycloudy_night: $customT('weather.partlycloudy'),
    partlycloudy_polartwilight: $customT('weather.partlycloudy'),
    cloudy: $customT('weather.cloudy'),
    rainshowers_day: $customT('weather.rainshowers'),
    rainshowers_night: $customT('weather.rainshowers'),
    rainshowers_polartwilight: $customT('weather.rainshowers'),
    lightrainshowers_day: $customT('weather.rainshowers'),
    lightrainshowers_night: $customT('weather.rainshowers'),
    lightrainshowers_polartwilight: $customT('weather.rainshowers'),
    rain: $customT('weather.rain'),
    lightrain: $customT('weather.rain'),
    heavyrain: $customT('weather.heavyrain'),
    snow: $customT('weather.snow'),
    sleet: $customT('weather.sleet'),
    fog: $customT('weather.fog'),
  };

  return descriptions[symbolCode] || $customT('weather.unknown');
};

const getWeatherIcon = (symbolCode: string): string => {
  // Map MET Norway symbol codes to Material Design icons
  const icons: Record<string, string> = {
    clearsky_day: 'wb_sunny',
    clearsky_night: 'nightlight',
    clearsky_polartwilight: 'wb_sunny',
    fair_day: 'wb_sunny',
    fair_night: 'nightlight',
    fair_polartwilight: 'wb_sunny',
    partlycloudy_day: 'partly_cloudy_day',
    partlycloudy_night: 'partly_cloudy_night',
    partlycloudy_polartwilight: 'partly_cloudy_day',
    cloudy: 'cloud',
    rainshowers_day: 'rainy',
    rainshowers_night: 'rainy',
    rainshowers_polartwilight: 'rainy',
    lightrainshowers_day: 'rainy',
    lightrainshowers_night: 'rainy',
    lightrainshowers_polartwilight: 'rainy',
    rain: 'rainy',
    lightrain: 'rainy',
    heavyrain: 'thunderstorm',
    snow: 'ac_unit',
    sleet: 'ac_unit',
    fog: 'foggy',
  };

  return icons[symbolCode] || 'wb_sunny';
};

// Watch for location changes
watch(userLocation, (newLocation) => {
  if (newLocation) {
    void fetchWeather();
  }
});

// Lifecycle
onMounted(() => {
  if (userLocation.value) {
    void fetchWeather();
  }
});
</script>

<style lang="scss" scoped>
.weather-widget {
  background: white;
  color: #333;

  .weather-content {
    color: #333;
  }

  .weather-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .weather-info {
    flex: 1;
  }

  .weather-icon {
    flex-shrink: 0;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .weather-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: #f5f5f5;
    border-radius: 8px;
  }

  .q-card__section {
    color: #333;
  }

  .text-h6,
  .text-h4,
  .text-body1,
  .text-body2,
  .text-caption {
    color: #333;
  }

  .text-grey {
    color: #666 !important;
  }
}
</style>
