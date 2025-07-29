<template>
  <div class="map-container">
    <div ref="mapRef" class="map"></div>
    <div class="map-controls">
      <q-btn
        flat
        round
        color="primary"
        icon="my_location"
        @click="centerOnCurrentLocation"
        class="location-button"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { debug } from 'src/utils/debug';

const props = defineProps<{
  center?: { lat: number; lng: number };
  marker?: { lat: number; lng: number };
  markerColor?: string;
  latitude?: number;
  longitude?: number;
}>();

const emit = defineEmits<{
  (e: 'marker-click', position: { lat: number; lng: number }): void;
  (e: 'map-click', position: { lat: number; lng: number }): void;
  (e: 'update:latitude', value: number): void;
  (e: 'update:longitude', value: number): void;
}>();

const mapRef = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let mapMarker: L.Marker | null = null;
let currentLocationMarker: L.Marker | null = null;
const selectedLocation = ref<{ lat: number; lng: number } | null>(null);

const createIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const initMap = () => {
  if (!mapRef.value) return;

  map = L.map(mapRef.value, {
    zoomControl: true,
    maxZoom: 20,
    minZoom: 10,
  }).setView(props.center || [52.3676, 4.9041], 16); // Verhoog standaard zoom level

  // Voeg satellietweergave toe als standaard laag
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      attribution: '© Esri',
      maxZoom: 20,
    },
  ).addTo(map);

  // Verplaats de zoom control naar de linkerkant
  map.zoomControl.setPosition('topleft');

  // Voeg een marker toe als er een initiële positie is
  if (props.marker) {
    mapMarker = L.marker([props.marker.lat, props.marker.lng], {
      icon: createIcon(props.markerColor || '#FF0000'),
    }).addTo(map);
  }

  // Voeg click event toe aan de kaart
  map.on('click', (e: L.LeafletMouseEvent) => {
    const position = {
      lat: e.latlng.lat,
      lng: e.latlng.lng,
    };

    // Verwijder oude marker als die er is
    if (mapMarker) {
      map?.removeLayer(mapMarker);
    }

    // Maak nieuwe marker
    mapMarker = L.marker([position.lat, position.lng], {
      icon: createIcon(props.markerColor || '#FF0000'),
    }).addTo(map);

    selectedLocation.value = position;
    emit('map-click', position);
    emit('update:latitude', position.lat);
    emit('update:longitude', position.lng);
  });

  // Voeg click event toe aan de marker
  if (mapMarker) {
    mapMarker.on('click', () => {
      if (mapMarker) {
        const position = {
          lat: mapMarker.getLatLng().lat,
          lng: mapMarker.getLatLng().lng,
        };
        selectedLocation.value = position;
        emit('marker-click', position);
      }
    });
  }

  // Centreer alleen op huidige locatie als er geen specifieke center locatie is opgegeven
  if (!props.center) {
    centerOnCurrentLocation();
  }
};

const centerOnCurrentLocation = () => {
  if (!map) return;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Verwijder oude locatiemarker als die er is
        if (currentLocationMarker) {
          map?.removeLayer(currentLocationMarker);
        }

        // Voeg nieuwe locatiemarker toe
        currentLocationMarker = L.marker([currentPos.lat, currentPos.lng], {
          icon: L.divIcon({
            className: 'current-location-marker',
            html: `<div style="background-color: #4285F4; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          }),
        }).addTo(map);

        // Centreer de kaart op de huidige locatie
        map.setView([currentPos.lat, currentPos.lng], 16);
      },
      (error) => {
        debug.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    );
  }
};

// Watch voor veranderingen in center
watch(
  () => props.center,
  (newCenter) => {
    if (map && newCenter) {
      // Gebruik een hogere zoom level (16) voor specifieke locaties
      // Dit geeft een betere weergave van de baan locatie
      map.setView([newCenter.lat, newCenter.lng], 16);
    }
  },
);

// Watch voor veranderingen in marker
watch(
  () => props.marker,
  (newMarker) => {
    if (map && newMarker) {
      if (mapMarker) {
        map.removeLayer(mapMarker);
      }
      mapMarker = L.marker([newMarker.lat, newMarker.lng], {
        icon: createIcon(props.markerColor || '#FF0000'),
      }).addTo(map);
    }
  },
);

onMounted(() => {
  initMap();
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.map {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.map-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
}

.location-button {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
}
</style>
