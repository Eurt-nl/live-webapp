import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useLocationStore = defineStore('location', () => {
  // Reactieve locatie (null als niet bekend)
  // Probeer locatie uit localStorage te laden bij initialisatie
  const stored = localStorage.getItem('userLocation');
  const userLocation = ref<{ latitude: number; longitude: number } | null>(
    stored ? JSON.parse(stored) : null,
  );

  // Sla locatie op in localStorage bij elke wijziging
  watch(
    userLocation,
    (val) => {
      if (val) {
        localStorage.setItem('userLocation', JSON.stringify(val));
      } else {
        localStorage.removeItem('userLocation');
      }
    },
    { deep: true },
  );

  function setLocation(loc: { latitude: number; longitude: number } | null) {
    userLocation.value = loc;
  }

  // Haal de locatie op als deze nog niet bekend is, anders gebruik de bestaande waarde
  async function getOrFetchLocation(): Promise<{ latitude: number; longitude: number } | null> {
    if (userLocation.value) return userLocation.value;
    return await refreshLocation();
  }

  // Forceer het ophalen van de locatie (bijvoorbeeld via GPS-knop)
  async function refreshLocation(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        userLocation.value = null;
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          userLocation.value = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          resolve(userLocation.value);
        },
        () => {
          userLocation.value = null;
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
      );
    });
  }

  return { userLocation, setLocation, getOrFetchLocation, refreshLocation };
});
