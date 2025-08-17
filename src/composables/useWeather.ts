// src/composables/useWeather.ts
// Composable voor het ophalen van weerdata van MET Norway API

import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

export interface WeatherData {
  temperature: number; // °C
  windSpeed: number; // m/s
  windDirection: number; // graden (0=N, 90=E, etc.)
  humidity?: number; // %
  pressure?: number; // hPa
}

export interface WeatherLocation {
  latitude: number;
  longitude: number;
}

export function useWeather() {
  const { t: $customT } = useI18n();

  const weatherData = ref<WeatherData | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastUpdated = ref<Date | null>(null);

  // Haal weerdata op voor een specifieke locatie
  const fetchWeather = async (location: WeatherLocation) => {
    try {
      loading.value = true;
      error.value = null;

      // Debug logging voor iOS PWA troubleshooting
      console.log('Weather fetch started:', {
        latitude: location.latitude,
        longitude: location.longitude,
        userAgent: navigator.userAgent,
        isStandalone: window.navigator.standalone,
      });

      // Direct naar MET Norway API (CORS-vriendelijk voor iOS PWA)
      const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${location.latitude}&lon=${location.longitude}`;

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
        // CORS-vriendelijke configuratie voor iOS PWA
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        console.error(`Weather API error: ${response.status} ${response.statusText}`);
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Haal de eerste (huidige) weerdata op
      const currentWeather = data.properties.timeseries[0];
      const details = currentWeather.data.instant.details;

      weatherData.value = {
        temperature: details.air_temperature,
        windSpeed: details.wind_speed_of_gust || details.wind_speed,
        windDirection: details.wind_from_direction,
        humidity: details.relative_humidity,
        pressure: details.air_pressure_at_sea_level,
      };

      lastUpdated.value = new Date();
      console.log('Weather fetch successful:', weatherData.value);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Onbekende fout';
      console.error('Error fetching weather:', err);
      console.error('Weather fetch failed details:', {
        error: err,
        location,
        userAgent: navigator.userAgent,
        isStandalone: window.navigator.standalone,
      });
    } finally {
      loading.value = false;
    }
  };

  // Computed voor het formatteren van windrichting
  const windDirectionText = computed(() => {
    if (!weatherData.value) return '';

    const dir = weatherData.value.windDirection;
    const directions = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW'];
    const index = Math.round(dir / 45) % 8;
    return directions[index];
  });

  // Computed voor het formatteren van temperatuur
  const temperatureText = computed(() => {
    if (!weatherData.value) return '';
    return `${Math.round(weatherData.value.temperature)}°C`;
  });

  // Computed voor het formatteren van windsnelheid
  const windSpeedText = computed(() => {
    if (!weatherData.value) return '';
    return `${Math.round(weatherData.value.windSpeed)} m/s`;
  });

  return {
    weatherData,
    loading,
    error,
    lastUpdated,
    fetchWeather,
    windDirectionText,
    temperatureText,
    windSpeedText,
  };
}
