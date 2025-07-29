import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { isProfileComplete } from 'src/utils/profile-utils';

/**
 * Composable voor het controleren en tonen van profiel compleetheid
 */
export function useProfileCheck() {
  const $q = useQuasar();
  const $router = useRouter();
  const authStore = useAuthStore();

  /**
   * Controleert of het profiel compleet is en toont een popup indien nodig
   * @returns true als profiel compleet is, false als niet compleet
   */
  const checkProfileCompleteness = (): boolean => {
    if (!authStore.user) return false;

    const profileComplete = isProfileComplete(authStore.user);

    if (!profileComplete) {
      $q.dialog({
        title: 'Profiel niet compleet',
        message: 'Je profiel is nog niet compleet, vul deze aan.',
        ok: {
          label: 'Naar profiel',
          color: 'primary',
          flat: false,
        },
        cancel: {
          label: 'Later',
          color: 'grey',
          flat: true,
        },
        persistent: true,
      }).onOk(() => {
        // Navigeer naar de profielpagina
        void $router.push('/profile');
      });
    }

    return profileComplete;
  };

  return {
    checkProfileCompleteness,
  };
}
