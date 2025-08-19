import { onMounted, onUnmounted } from 'vue';
import { useLocationStore } from 'stores/location';
import { debug } from 'src/utils/debug';

/**
 * Composable voor focus-based locatie ophaling
 * Haalt altijd eerst realtime locatie op bij focus, fallback naar cached locatie
 */
export function useLocationFocus() {
  const locationStore = useLocationStore();

  /**
   * Haal locatie op bij focus - altijd realtime eerst, dan fallback naar cache
   */
  const refreshLocationOnFocus = async (): Promise<{
    latitude: number;
    longitude: number;
  } | null> => {
    try {
      debug('Focus-based locatie ophaling gestart');

      // Probeer eerst realtime locatie op te halen
      const realtimeLocation = await locationStore.refreshLocation();

      if (realtimeLocation) {
        debug('Realtime locatie succesvol opgehaald:', realtimeLocation);
        return realtimeLocation;
      }

      // Fallback naar laatst bekende positie
      const cachedLocation = locationStore.userLocation;
      if (cachedLocation) {
        debug('Gebruik cached locatie als fallback:', cachedLocation);
        return cachedLocation;
      }

      debug('Geen locatie beschikbaar (realtime noch cached)');
      return null;
    } catch (error) {
      debug.error('Fout bij focus-based locatie ophaling:', error);

      // Fallback naar cached locatie bij fout
      const cachedLocation = locationStore.userLocation;
      if (cachedLocation) {
        debug('Gebruik cached locatie na fout:', cachedLocation);
        return cachedLocation;
      }

      return null;
    }
  };

  /**
   * Setup focus listener voor automatische locatie ophaling
   */
  const setupFocusListener = () => {
    const handleFocus = () => {
      debug('Page focus gedetecteerd - start locatie ophaling');
      void refreshLocationOnFocus();
    };

    // Luister naar visibility change (tab focus)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        handleFocus();
      }
    });

    // Luister naar window focus (voor PWA)
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  };

  /**
   * Composable lifecycle - automatisch setup en cleanup
   */
  let cleanup: (() => void) | null = null;

  onMounted(() => {
    // Direct locatie ophalen bij mount
    void refreshLocationOnFocus();

    // Setup focus listener
    cleanup = setupFocusListener();
  });

  onUnmounted(() => {
    if (cleanup) {
      cleanup();
    }
  });

  return {
    refreshLocationOnFocus,
    setupFocusListener,
  };
}
