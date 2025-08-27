import { ref, computed } from 'vue';
import { useAuthStore } from 'stores/auth';
import { usePocketbase } from 'src/composables/usePocketbase';

// Interface voor shortgame statistieken uit de view
interface ShortgameStatsData {
  id: string;
  player_id: string;
  player_name: string;
  course_id: string;
  course_name: string;
  hole: number;
  gir_pct: number | null; // percentage
  scramble_pct: number | null; // percentage
  putts_avg_gir: number | null; // decimaal getal
  chipin: number; // geheel getal
}

export function useShortgameStats() {
  const authStore = useAuthStore();
  const { pb } = usePocketbase();

  // Reactieve variabelen
  const loading = ref(false);
  const error = ref<string | null>(null);
  const shortgameStatsData = ref<ShortgameStatsData[]>([]);

  // Haal shortgame statistieken op uit de vw_player_course_hole_shortgame view
  const fetchShortgameStats = async (courseId: string) => {
    try {
      loading.value = true;
      error.value = null;

      const userId = authStore.user?.id;
      if (!userId) {
        throw new Error('Geen gebruiker gevonden');
      }

      // Haal data op uit de vw_player_course_hole_shortgame view
      const result = await pb.collection('vw_player_course_hole_shortgame').getList(1, 100, {
        filter: `player_id = "${userId}" && course_id = "${courseId}"`,
        sort: 'hole',
      });

      shortgameStatsData.value = result.items as ShortgameStatsData[];
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Onbekende fout';
      console.error('Fout bij ophalen shortgame statistieken:', err);
    } finally {
      loading.value = false;
    }
  };

  // Gesorteerde data voor de tabel (hole 1-18)
  const sortedShortgameStats = computed(() => {
    return shortgameStatsData.value.sort((a, b) => a.hole - b.hole);
  });

  return {
    // Data
    loading,
    error,
    shortgameStatsData,
    sortedShortgameStats,

    // Methods
    fetchShortgameStats,
  };
}
