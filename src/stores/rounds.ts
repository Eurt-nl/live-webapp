import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from './auth';

// Store voor alle rondes van de ingelogde gebruiker
// Houdt actieve en afgeronde rondes bij, en biedt helpers voor event-logica
export const useRoundsStore = defineStore('rounds', () => {
  // State: lijst met alle rondes van de gebruiker
  const rounds = ref([]);
  const loading = ref(false);
  const pb = usePocketbase();
  const authStore = useAuthStore();

  // Haal alle rondes van de gebruiker op uit PocketBase
  async function fetchRounds() {
    if (!authStore.user) return;
    loading.value = true;
    try {
      // Haal alle rondes op waar de speler de huidige gebruiker is
      const result = await pb.collection('rounds').getFullList({
        filter: `player = "${authStore.user.id}"`,
        expand: 'event,course,status,event_round',
        sort: '-created',
      });
      rounds.value = result;
    } catch {
      // Foutmelding kan hier gelogd worden
      rounds.value = [];
    } finally {
      loading.value = false;
    }
  }

  // Getter: actieve rondes (is_active true én niet finalized)
  const activeRounds = computed(() => {
    return rounds.value.filter((r) => r.is_active === true && r.is_finalized === false);
  });

  // Helper: vind actieve ronde voor een event
  function getActiveRoundForEvent(eventId) {
    return activeRounds.value.find((r) => r.event === eventId);
  }

  // Helper: heeft gebruiker een actieve ronde voor event
  function hasActiveRoundForEvent(eventId) {
    return !!getActiveRoundForEvent(eventId);
  }

  // Action: voeg een nieuwe ronde toe aan de store (na create)
  function addRound(round) {
    rounds.value.unshift(round);
  }

  // Action: update een bestaande ronde in de store
  function updateRound(updated) {
    const idx = rounds.value.findIndex((r) => r.id === updated.id);
    if (idx !== -1) rounds.value[idx] = updated;
  }

  // Action: reset de store (bij logout)
  function reset() {
    rounds.value = [];
  }

  return {
    rounds,
    loading,
    fetchRounds,
    activeRounds,
    getActiveRoundForEvent,
    hasActiveRoundForEvent,
    addRound,
    updateRound,
    reset,
  };
});
