import { ref, computed } from 'vue';
import { usePocketbase } from './usePocketbase';
import { useI18n } from 'vue-i18n';
import type { CompactLocalRule } from './useLocalRules';
import { getApiUrl, isLoggingEnabled } from '../config/rafi';

export interface RafiRequest {
  question: string;
  courseId: string;
  courseName?: string;
  localRules: CompactLocalRule[];
  lang?: string;
}

export interface RafiResponse {
  answer: string;
  usedRules?: string[];
}

export interface ChatLogData {
  userId?: string;
  courseId: string;
  question: string;
  answer: string;
  usedRules?: string[];
  distance?: number;
  clientMeta?: Record<string, any>;
}

export function useRafi() {
  const { t: $customT } = useI18n();
  const { pb } = usePocketbase();

  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Rafi API aanroepen
  const askRafi = async (request: RafiRequest): Promise<RafiResponse | null> => {
    isLoading.value = true;
    error.value = null;

    try {
      // Echte API call naar server-proxy
      const response = await fetch(getApiUrl('/rafi'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        // Als de server niet beschikbaar is (404/405/500), toon een vriendelijke melding
        if (response.status === 404 || response.status === 405 || response.status === 500) {
          error.value = $customT('rafi.api.serviceUnavailable');
          isLoading.value = false;
          return null;
        }

        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      isLoading.value = false;
      return data;
    } catch (err) {
      console.error('Rafi API error:', err);
      // Check of het een network error is of een server error
      if (err instanceof TypeError && err.message.includes('fetch')) {
        error.value = $customT('rafi.api.serviceUnavailable');
      } else {
        error.value = $customT('rafi.api.error');
      }
      isLoading.value = false;
      return null;
    }
  };

  // Chat logging service
  const rafiLogger = {
    logChat: async (data: ChatLogData): Promise<void> => {
      // Alleen loggen als logging aan staat
      if (!isLoggingEnabled()) {
        return;
      }

      try {
        const logData = {
          user: data.userId || null,
          course: data.courseId,
          question: data.question,
          answer: data.answer,
          used_rules: data.usedRules || [],
          distance: data.distance || null,
          client_meta: {
            ...data.clientMeta,
            userAgent: navigator.userAgent,
            language: navigator.language,
            timestamp: new Date().toISOString(),
          },
        };

        await pb.collection('rafi_chats').create(logData);
      } catch (err) {
        // Fout tolerant: geen crash bij falen
        console.warn('Failed to log chat:', err);
      }
    },
  };

  // Helper functie voor client metadata
  const getClientMeta = (): Record<string, any> => {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      timestamp: new Date().toISOString(),
    };
  };

  // Reset state
  const reset = () => {
    isLoading.value = false;
    error.value = null;
  };

  return {
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    askRafi,
    rafiLogger,
    getClientMeta,
    reset,
  };
}
