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

    <!-- Vernieuwen -->
    <q-item clickable v-close-popup @click="handleRefresh">
      <q-item-section avatar>
        <q-icon name="refresh" />
      </q-item-section>
      <q-item-section>{{ $customT('menu.refresh') }}</q-item-section>
    </q-item>

    <!-- Uitloggen -->
    <q-item clickable v-close-popup @click="handleLogout">
      <q-item-section avatar>
        <q-icon name="logout" />
      </q-item-section>
      <q-item-section>{{ $customT('menu.logout') }}</q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'stores/auth';
import { useNotificationsStore } from 'stores/notifications';

import { onMounted, computed, inject } from 'vue';

import { useCoursesStore } from 'stores/courses';

const router = useRouter();
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();
const $q = useQuasar();
const $customT = inject('$customT') as (key: string, params?: Record<string, any>) => string;

const coursesStore = useCoursesStore();

// Computed: heeft de gebruiker banen?
const hasCourses = computed(() => coursesStore.courses.length > 0);

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

const handleRefresh = async () => {
  try {
    // Controleer of we in PWA modus zijn
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;

      // Probeer service worker update
      await registration.update();

      if (isStandalone) {
        // In PWA modus: gebruik een meer betrouwbare refresh methode
        $q.notify({
          color: 'positive',
          message: $customT('notifications.appRefreshing'),
          icon: 'refresh',
          timeout: 1500,
        });

        // Gebruik een combinatie van methoden voor PWA
        setTimeout(() => {
          // Methode 1: Probeer location.reload()
          try {
            window.location.reload();
          } catch {
            // Methode 2: Fallback - ververs de pagina via router
            router.go(0);
          }
        }, 1500);
      } else {
        // In browser modus: standaard reload
        $q.notify({
          color: 'positive',
          message: $customT('notifications.pageRefreshing'),
          icon: 'refresh',
          timeout: 1500,
        });

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } else {
      // Fallback voor browsers zonder service worker
      $q.notify({
        color: 'info',
        message: $customT('notifications.pageRefreshing'),
        icon: 'refresh',
        timeout: 1500,
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  } catch (error) {
    console.error('Error refreshing app:', error);
    $q.notify({
      color: 'negative',
      message: $customT('notifications.refreshError'),
      icon: 'error',
    });
  }
};

onMounted(() => {
  void notificationsStore.checkUnreadMessages();
});
</script>
