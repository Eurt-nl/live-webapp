<template>
  <!-- Feedback knop in footer, alleen zichtbaar in PWA modus -->
  <q-btn v-if="isPwaMode" flat round dense icon="feedback" color="info" @click="handleFabClick" />

  <!-- Dialog voor feedbackmelding -->
  <q-dialog v-model="dialogOpen">
    <q-card style="min-width: 320px">
      <q-card-section>
        <div class="text-h6">{{ $customT('feedback.sendFeedback') }}</div>
      </q-card-section>
      <q-card-section>
        <q-input
          v-model="feedbackText"
          :label="$customT('feedback.whatToReport')"
          type="textarea"
          autogrow
          :rules="[(val) => !!val || $customT('notifications.fillMessage')]"
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat :label="$customT('feedback.cancel')" color="grey" v-close-popup />
        <q-btn
          flat
          :label="$customT('feedback.send')"
          color="primary"
          :loading="sending"
          @click="sendFeedback"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useI18n } from 'vue-i18n';
import html2canvas from 'html2canvas';

const $q = useQuasar();
const authStore = useAuthStore();
const pb = usePocketbase();
const { t: $customT } = useI18n();

// PWA detectie
const isPwaMode = computed(() => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
});

// Dialog en feedback
const dialogOpen = ref(false);
const feedbackText = ref('');
const sending = ref(false);

// Ref voor het screenshot-bestand
const screenshotFile = ref<File | null>(null);

// Helper: wacht tot alle <img> elementen geladen zijn
async function waitForImagesLoaded() {
  const images = Array.from(document.images);
  await Promise.all(
    images.map((img) =>
      img.complete && img.naturalHeight !== 0
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          }),
    ),
  );
}

// Eerst screenshot maken, dan dialog openen
async function handleFabClick() {
  try {
    // Wacht tot alle afbeeldingen geladen zijn
    await waitForImagesLoaded();
    // Screenshot maken van het hele scherm vóór de dialog, met CORS support
    const canvas = await html2canvas(document.body, { useCORS: true });
    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png'),
    );
    screenshotFile.value = new File([blob], 'screenshot.png', { type: 'image/png' });
    dialogOpen.value = true;
  } catch {
    $q.notify({ color: 'negative', message: $customT('notifications.screenshotError'), icon: 'error' });
  }
}

async function sendFeedback() {
  if (!feedbackText.value) return;
  sending.value = true;
  try {
    // FormData opbouwen voor PocketBase
    const formData = new FormData();
    formData.append('title', $customT('feedback.sendFeedback'));
    formData.append('body', feedbackText.value);
    // Gebruik altijd de id van de ingelogde gebruiker
    formData.append('from_user', authStore.user?.id || '');
    formData.append('to_user', JSON.stringify(['632w8yen5h58gw0']));
    if (screenshotFile.value) {
      formData.append('image', screenshotFile.value);
    }
    formData.append('link', window.location.href);

    await pb.collection('notifications').create(formData);
    $q.notify({ color: 'positive', message: $customT('notifications.feedbackSent'), icon: 'check' });
    dialogOpen.value = false;
    feedbackText.value = '';
    screenshotFile.value = null;
  } catch {
    $q.notify({ color: 'negative', message: $customT('notifications.feedbackError'), icon: 'error' });
  } finally {
    sending.value = false;
  }
}
</script>
