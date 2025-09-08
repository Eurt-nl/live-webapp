<template>
  <q-list style="min-width: 150px">
    <!-- Profiel -->
    <q-item clickable v-close-popup to="/profile">
      <q-item-section avatar>
        <q-icon name="person" />
      </q-item-section>
      <q-item-section>{{ $customT('menu.profile') }}</q-item-section>
    </q-item>

    <!-- Mijn Rondes -->
    <q-item clickable v-close-popup to="/mijn-rondes">
      <q-item-section avatar>
        <q-icon name="sports_golf" />
      </q-item-section>
      <q-item-section>{{ $customT('menu.myRounds') }}</q-item-section>
    </q-item>

    <!-- Mijn Statistieken -->
    <q-item clickable v-close-popup to="/mijn-statistieken">
      <q-item-section avatar>
        <q-icon name="bar_chart" />
      </q-item-section>
      <q-item-section>{{ $customT('menu.myStats') }}</q-item-section>
    </q-item>

    <!-- Events functionaliteit verplaatst naar pop-up systeem -->

    <!-- Berichten -->
    <q-item clickable v-close-popup to="/berichten">
      <q-item-section avatar>
        <q-icon name="mail" class="relative-position">
          <q-badge v-if="notificationsStore.hasUnread" color="negative" floating rounded />
        </q-icon>
      </q-item-section>
      <q-item-section>{{ $customT('menu.messages') }}</q-item-section>
    </q-item>

    <q-separator />

    <!-- Beheer kopje, niet klikbaar -->
    <q-item>
      <q-item-section>
        <div class="text-subtitle2 text-grey-7 q-ml-sm">{{ $customT('menu.management') }}</div>
      </q-item-section>
    </q-item>

    <!-- Banen -->
    <q-item clickable v-close-popup to="/my-banen">
      <q-item-section avatar>
        <q-icon name="golf_course" />
      </q-item-section>
      <q-item-section>{{ $customT('menu.courses') }}</q-item-section>
    </q-item>

    <!-- Events (alleen zichtbaar voor gebruikers met banen) -->
    <q-item v-if="hasCourses" clickable v-close-popup to="/mijn-events">
      <q-item-section avatar>
        <q-icon name="event" />
      </q-item-section>
      <q-item-section>{{ $customT('menu.events') }}</q-item-section>
    </q-item>

    <!-- Snel event aanmaken (verborgen voor later gebruik) -->
    <!--
    <q-item v-if="isOwnerOrModerator" clickable v-close-popup to="/events/create">
      <q-item-section avatar>
        <q-icon name="add_circle" />
      </q-item-section>
      <q-item-section>Snel event</q-item-section>
    </q-item>
    -->

    <!-- Uitloggen -->
    <q-item clickable v-close-popup @click="handleLogout">
      <q-item-section avatar>
        <q-icon name="logout" />
      </q-item-section>
      <q-item-section>{{ $customT('menu.logout') }}</q-item-section>
    </q-item>

    <q-separator />

    <!-- Versie informatie -->
    <q-item>
      <q-item-section>
        <div class="text-caption text-grey-7 q-ml-sm">
          <div>{{ $customT('menu.currentVersion') }}: {{ currentVersion }}</div>
          <div v-if="latestVersion">{{ $customT('menu.newVersion') }}: {{ latestVersion }}</div>
          <div v-if="updateStatus" class="q-mt-xs">
            <span v-if="updateAvailable" class="text-warning"
              >⚠️ {{ $customT('menu.updateAvailable') }}</span
            >
            <span v-else class="text-positive">✅ {{ $customT('menu.upToDate') }}</span>
          </div>
          <!-- Update knop (alleen zichtbaar als versies niet gelijk zijn) -->
          <div v-if="updateAvailable" class="q-mt-sm">
            <q-btn
              flat
              dense
              color="primary"
              icon="system_update"
              :label="$customT('menu.updateApp')"
              @click="handleUpdate"
              :loading="updating"
              size="sm"
            />
          </div>
        </div>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth';
import { useNotificationsStore } from 'stores/notifications';

import { onMounted, computed, ref } from 'vue';

import { useCoursesStore } from 'stores/courses';
import { getCurrentVersion } from 'src/utils/changelog';

const router = useRouter();
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();
const $q = useQuasar();
const { t: $customT } = useI18n();

const coursesStore = useCoursesStore();

// Computed: heeft de gebruiker banen?
const hasCourses = computed(() => coursesStore.courses.length > 0);

// Versie management
const currentVersion = ref(getCurrentVersion());
const latestVersion = ref<string | null>(null);
const updateAvailable = ref(false);
const updateStatus = ref(false);
const updating = ref(false);

// Functie om versies te vergelijken
const compareVersions = (current: string, latest: string): boolean => {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (latestPart > currentPart) return true;
    if (latestPart < currentPart) return false;
  }

  return false; // Versies zijn gelijk
};

const handleLogout = () => {
  try {
    authStore.logout();
    $q.notify({
      color: 'positive',
      message: $customT('notifications.logoutSuccess'),
      icon: 'check',
    });
    void router.push('/auth/login');
  } catch {
    $q.notify({
      color: 'negative',
      message: $customT('notifications.logoutFailed'),
      icon: 'error',
    });
  }
};

const handleUpdate = async () => {
  if (updating.value) return;

  updating.value = true;

  try {
    // Controleer of we in PWA modus zijn
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;

      // Forceer service worker update
      await registration.update();

      // Wacht even om de update te laten verwerken
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (isStandalone) {
        // In PWA modus: toon update melding en herlaad
        $q.notify({
          color: 'positive',
          message: $customT('notifications.appUpdating'),
          icon: 'system_update',
          timeout: 2000,
        });

        // Herlaad de app na een korte vertraging
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        // In browser modus: standaard reload
        $q.notify({
          color: 'positive',
          message: $customT('notifications.pageUpdating'),
          icon: 'system_update',
          timeout: 2000,
        });

        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } else {
      // Fallback voor browsers zonder service worker
      $q.notify({
        color: 'info',
        message: $customT('notifications.pageUpdating'),
        icon: 'system_update',
        timeout: 2000,
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  } catch (error) {
    console.error('Error updating app:', error);
    $q.notify({
      color: 'negative',
      message: $customT('notifications.updateError'),
      icon: 'error',
    });
  } finally {
    updating.value = false;
  }
};

onMounted(() => {
  void notificationsStore.checkUnreadMessages();

  // Initialiseer huidige versie en forceer refresh
  currentVersion.value = getCurrentVersion();

  // Check voor updates
  void checkForUpdates();
});

// Functie om te controleren op updates
const checkForUpdates = async () => {
  try {
    // Voeg cache-busting parameter toe om browser cache te omzeilen
    const response = await fetch(`/version.json?v=${Date.now()}`);
    if (response.ok) {
      const versionData = await response.json();
      latestVersion.value = versionData.version;

      // Debug: log versies
      console.log('Version check:', {
        current: currentVersion.value,
        latest: latestVersion.value,
        fromChangelog: getCurrentVersion(),
      });

      // Vergelijk versies
      if (latestVersion.value && latestVersion.value !== currentVersion.value) {
        updateAvailable.value = compareVersions(currentVersion.value, latestVersion.value);
      } else {
        updateAvailable.value = false;
      }

      updateStatus.value = true;
    }
  } catch {
    console.log('Could not fetch version.json, using current version as fallback');
    // Fallback: gebruik huidige versie als latest
    latestVersion.value = currentVersion.value;
    updateAvailable.value = false;
    updateStatus.value = true;
  }
};
</script>
