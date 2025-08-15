<template>
  <!-- Floating feedback knop, alleen zichtbaar op mobiel -->
  <div v-if="$q.platform.is.mobile" :style="fabStyle" class="feedback-fab" ref="fabRef">
    <q-btn round color="info" icon="feedback" @click.stop="handleFabClick" />
  </div>

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
// -----------------------------
// Imports
// -----------------------------
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useI18n } from 'vue-i18n';
import html2canvas from 'html2canvas';

const $q = useQuasar();
const authStore = useAuthStore();
const { pb } = usePocketbase();
const { t: $customT } = useI18n();

// -----------------------------
// State voor FAB-positie en drag
// -----------------------------
const position = reactive({
  x: window.innerWidth / 2 - 28, // Start in het midden onderaan
  y: window.innerHeight - 90,
});
const dragging = ref(false);
const dragOffset = reactive({ x: 0, y: 0 });
const fabRef = ref<HTMLElement>();

// Dynamische style voor de FAB
const fabStyle = computed(() => ({
  position: 'fixed' as const,
  left: position.x + 'px',
  top: position.y + 'px',
  zIndex: 9999,
  transition: dragging.value ? 'none' : 'box-shadow 0.2s',
}));

// -----------------------------
// Drag functionaliteit
// -----------------------------
function startDrag(e: MouseEvent | TouchEvent) {
  // Voorkom default scroll gedrag voor touch events
  if (e instanceof TouchEvent) {
    e.preventDefault();
  }

  dragging.value = true;
  let clientX, clientY;
  if (e instanceof TouchEvent) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  dragOffset.x = clientX - position.x;
  dragOffset.y = clientY - position.y;
  document.body.style.userSelect = 'none';
}

function onDrag(e: MouseEvent | TouchEvent) {
  if (!dragging.value) return;

  // Voorkom default scroll gedrag voor touch events
  if (e instanceof TouchEvent) {
    e.preventDefault();
  }

  let clientX, clientY;
  if (e instanceof TouchEvent) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }
  // Houd de knop binnen het scherm
  const minX = 8;
  const maxX = window.innerWidth - 56 - 8;
  const minY = 8;
  const maxY = window.innerHeight - 56 - 8;
  position.x = Math.min(Math.max(clientX - dragOffset.x, minX), maxX);
  position.y = Math.min(Math.max(clientY - dragOffset.y, minY), maxY);
}

function endDrag() {
  dragging.value = false;
  document.body.style.userSelect = '';
}

// -----------------------------
// Event listeners setup en cleanup
// -----------------------------
function setupEventListeners() {
  if (!fabRef.value) return;

  const element = fabRef.value;

  // Mouse events
  element.addEventListener('mousedown', startDrag);
  element.addEventListener('mousemove', onDrag);
  element.addEventListener('mouseup', endDrag);
  element.addEventListener('mouseleave', endDrag);

  // Touch events met passive optie voor betere performance
  element.addEventListener('touchstart', startDrag, { passive: false });
  element.addEventListener('touchmove', onDrag, { passive: false });
  element.addEventListener('touchend', endDrag, { passive: true });
}

function cleanupEventListeners() {
  if (!fabRef.value) return;

  const element = fabRef.value;

  // Mouse events
  element.removeEventListener('mousedown', startDrag);
  element.removeEventListener('mousemove', onDrag);
  element.removeEventListener('mouseup', endDrag);
  element.removeEventListener('mouseleave', endDrag);

  // Touch events
  element.removeEventListener('touchstart', startDrag);
  element.removeEventListener('touchmove', onDrag);
  element.removeEventListener('touchend', endDrag);
}

// Lifecycle hooks
onMounted(() => {
  // Setup event listeners na DOM mount
  setupEventListeners();
});

onUnmounted(() => {
  // Cleanup event listeners
  cleanupEventListeners();
});

// -----------------------------
// Dialog en feedback
// -----------------------------
const dialogOpen = ref(false);
const feedbackText = ref('');
const sending = ref(false);

// Ref voor het screenshot-bestand
const screenshotFile = ref<File | null>(null);

// Reset de positie van de knop als de dialog sluit (versturen of annuleren)
watch(
  () => dialogOpen.value,
  (open) => {
    if (!open) {
      position.x = window.innerWidth / 2 - 28;
      position.y = window.innerHeight - 90;
    }
  },
);

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
    $q.notify({
      color: 'negative',
      message: $customT('notifications.screenshotError'),
      icon: 'error',
    });
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
    $q.notify({
      color: 'positive',
      message: $customT('notifications.feedbackSent'),
      icon: 'check',
    });
    dialogOpen.value = false;
    feedbackText.value = '';
    screenshotFile.value = null;
  } catch {
    $q.notify({
      color: 'negative',
      message: $customT('notifications.feedbackError'),
      icon: 'error',
    });
  } finally {
    sending.value = false;
  }
}
</script>

<style scoped>
.feedback-fab {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  border-radius: 50%;
  background: transparent;
  user-select: none;
}
</style>
