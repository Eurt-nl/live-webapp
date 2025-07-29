import { defineStore } from 'pinia';
import { ref } from 'vue';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from './auth';
import { ClientResponseError } from 'pocketbase';

export const useNotificationsStore = defineStore('notifications', () => {
  const pb = usePocketbase();
  const authStore = useAuthStore();
  const hasUnread = ref(false);
  let isUnmounted = false;
  let abortController: AbortController | null = null;
  let checkInterval: NodeJS.Timeout | null = null;

  const checkUnreadMessages = async () => {
    if (!authStore.user?.id || isUnmounted) return;

    try {
      // Cancel any existing request
      if (abortController) {
        abortController.abort();
      }

      // Create new abort controller for this request
      abortController = new AbortController();

      const result = await pb.collection('notifications').getList(1, 1, {
        filter: `to_user ~ "${authStore.user.id}" && archived_by !~ "${authStore.user.id}" && seen_by !~ "${authStore.user.id}"`,
        sort: '-created',
      });

      if (!isUnmounted) {
        hasUnread.value = result.totalItems > 0;
      }
    } catch (error) {
      // Alleen loggen als het geen cancelled request is
      if (!isUnmounted && !(error instanceof ClientResponseError && error.isAbort)) {
        console.error('Error checking unread messages:', error);
      }
    } finally {
      if (abortController) {
        abortController = null;
      }
    }
  };

  const cleanup = () => {
    isUnmounted = true;
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  };

  const init = () => {
    isUnmounted = false;
    // Direct checken
    void checkUnreadMessages();

    // Start periodieke check (elke 30 seconden)
    if (!checkInterval) {
      checkInterval = setInterval(() => {
        void checkUnreadMessages();
      }, 30000);
    }
  };

  return {
    hasUnread,
    checkUnreadMessages,
    cleanup,
    init,
  };
});
