<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <!-- Hamburger menu knop voor het openen van het AppMenu (linker drawer) -->
        <q-btn flat round dense icon="menu" class="q-mr-md" @click="toggleLeftDrawer" />

        <q-toolbar-title>{{ $customT('app.title') }}</q-toolbar-title>

        <!-- Gebruikersavatar als knop voor het openen van het UserMenu (rechter drawer) - alleen voor ingelogde gebruikers -->
        <q-avatar
          v-if="authStore.isAuthenticated"
          size="40px"
          class="q-ml-md cursor-pointer bg-white relative-position"
          @click="toggleRightDrawer"
        >
          <template v-if="userAvatarUrl">
            <img :src="userAvatarUrl" alt="Avatar" />
          </template>
          <template v-else>
            <q-icon name="person" color="primary" size="28px" />
          </template>
          <q-badge v-if="notificationsStore.hasUnread" color="negative" floating rounded />
        </q-avatar>
      </q-toolbar>
    </q-header>

    <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered>
      <q-list>
        <q-item to="/" exact>
          <q-item-section avatar>
            <q-icon name="home" />
          </q-item-section>
          <q-item-section>{{ $customT('navigation.home') }}</q-item-section>
        </q-item>

        <q-item to="/banen">
          <q-item-section avatar>
            <q-icon name="golf_course" />
          </q-item-section>
          <q-item-section>{{ $customT('navigation.courses') }}</q-item-section>
        </q-item>

        <q-item v-if="authStore.isAuthenticated" to="/spelers">
          <q-item-section avatar>
            <q-icon name="people" />
          </q-item-section>
          <q-item-section>{{ $customT('navigation.players') }}</q-item-section>
        </q-item>

        <!-- Events knop verborgen voor nieuwe pop-up aanpak -->
        <!-- <q-item to="/events">
          <q-item-section avatar>
            <q-icon name="event" />
          </q-item-section>
          <q-item-section>Events</q-item-section>
        </q-item> -->
      </q-list>

      <!-- Rafi AI Assistant -->
      <q-separator />
      <q-item to="/rafi" clickable>
        <q-item-section avatar>
          <q-avatar size="40px">
            <img src="/rafi-avatar.png" alt="Rafi" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $customT('rafi.title') }}</q-item-label>
          <q-item-label caption>{{ $customT('navigation.comingSoon') }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-drawer>

    <q-drawer
      v-if="authStore.isAuthenticated"
      show-if-above
      v-model="rightDrawerOpen"
      side="right"
      bordered
    >
      <UserMenu />
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer elevated class="bg-grey-8 text-secondary">
      <q-toolbar>
        <q-btn
          flat
          round
          dense
          icon="arrow_back"
          @click="goBack"
          :disable="!canGoBack"
          style="min-width: 48px; min-height: 48px; touch-action: manipulation"
          :aria-label="$customT('navigation.back')"
        />

        <!-- Dynamische buttons links van home -->
        <template v-for="button in leftFooterButtons" :key="button.order">
          <q-btn
            v-if="button.icon"
            flat
            round
            dense
            :icon="button.icon"
            @click="button.onClick"
            :class="{ 'q-ml-sm': true }"
            style="position: relative"
          >
            <q-badge v-if="button.badge" :color="button.badgeColor || 'red'" floating rounded>
              {{ button.badge }}
            </q-badge>
            <q-badge
              v-else-if="button.label"
              :color="button.badgeColor || 'yellow'"
              text-color="black"
              floating
              style="
                position: absolute;
                top: -8px;
                right: -8px;
                min-width: 20px;
                text-align: center;
              "
            >
              {{ button.label }}
            </q-badge>
          </q-btn>
          <q-btn
            v-else
            flat
            round
            dense
            @click="button.onClick"
            :class="{ 'q-ml-sm': true }"
            style="position: relative; min-width: 40px; min-height: 40px"
          >
            <q-badge
              v-if="button.label"
              :color="button.badgeColor || 'yellow'"
              text-color="black"
              style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                min-width: 20px;
                text-align: center;
              "
            >
              {{ button.label }}
            </q-badge>
          </q-btn>
        </template>

        <q-space />

        <!-- Dynamische buttons in het midden -->
        <template v-for="button in middleFooterButtons" :key="button.order">
          <q-btn
            v-if="button.icon"
            flat
            round
            dense
            :icon="button.icon"
            @click="button.onClick"
            style="position: relative"
          >
            <q-badge v-if="button.badge" :color="button.badgeColor || 'red'" floating rounded>
              {{ button.badge }}
            </q-badge>
            <q-badge
              v-else-if="button.label"
              :color="button.badgeColor || 'yellow'"
              text-color="black"
              floating
              style="
                position: absolute;
                top: -8px;
                right: -8px;
                min-width: 20px;
                text-align: center;
              "
            >
              {{ button.label }}
            </q-badge>
          </q-btn>
          <q-btn
            v-else
            flat
            round
            dense
            @click="button.onClick"
            style="position: relative; min-width: 40px; min-height: 40px"
          >
            <q-badge
              v-if="button.label"
              :color="button.badgeColor || 'yellow'"
              text-color="black"
              style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                min-width: 20px;
                text-align: center;
              "
            >
              {{ button.label }}
            </q-badge>
          </q-btn>
        </template>

        <q-space />

        <!-- Locatie knop: altijd zichtbaar voor ingelogde gebruikers. Rood als geen locatie, secondary als wel locatie. -->
        <q-btn
          v-if="authStore.isAuthenticated"
          flat
          round
          dense
          icon="my_location"
          :color="locationStore.userLocation ? 'secondary' : 'negative'"
          @click="requestUserLocation"
          :aria-label="$customT('location.getLocation')"
          class="q-mr-sm"
        />
        <!-- Feedback knop in het midden van de footer -->
        <FeedbackFooterBtn />

        <!-- Dynamische buttons rechts van home -->
        <template v-for="button in rightFooterButtons" :key="button.order">
          <q-btn
            v-if="button.icon"
            flat
            round
            dense
            :icon="button.icon"
            @click="button.onClick"
            :class="{ 'q-mr-sm': true }"
            style="position: relative"
          >
            <q-badge v-if="button.badge" :color="button.badgeColor || 'red'" floating rounded>
              {{ button.badge }}
            </q-badge>
            <q-badge
              v-else-if="button.label"
              :color="button.badgeColor || 'yellow'"
              text-color="black"
              floating
              style="
                position: absolute;
                top: -8px;
                right: -8px;
                min-width: 20px;
                text-align: center;
              "
            >
              {{ button.label }}
            </q-badge>
          </q-btn>
          <q-btn
            v-else
            flat
            round
            dense
            @click="button.onClick"
            :class="{ 'q-mr-sm': true }"
            style="position: relative; min-width: 40px; min-height: 40px"
          >
            <q-badge
              v-if="button.label"
              :color="button.badgeColor || 'yellow'"
              text-color="black"
              style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                min-width: 20px;
                text-align: center;
              "
            >
              {{ button.label }}
            </q-badge>
          </q-btn>
        </template>

        <q-btn flat round dense icon="home" to="/" />
      </q-toolbar>
    </q-footer>

    <!-- PWA Installatie instructie dialog -->
    <q-dialog v-model="showPwaDialog" persistent>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <q-icon name="info" color="primary" size="md" class="q-mr-sm" />
          <div class="text-h6">{{ $customT('pwa.installTitle') }}</div>
        </q-card-section>
        <q-card-section>
          <div v-if="isIos">
            <p>
              {{ $customT('pwa.installMessage') }}<br />
              <q-icon name="ios_share" size="sm" /> {{ $customT('pwa.iosInstructions') }}
            </p>
          </div>
          <div v-else-if="isAndroid">
            <p>
              {{ $customT('pwa.installMessage') }}<br />
              <q-icon name="more_vert" size="sm" /> {{ $customT('pwa.androidInstructions') }}
            </p>
          </div>
          <div v-else>
            <p>
              {{ $customT('pwa.installMessage') }}<br />{{ $customT('pwa.desktopInstructions') }}
            </p>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            :label="$customT('navigation.close')"
            color="primary"
            v-close-popup
            @click="showPwaDialog = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Update beschikbaar dialog -->
    <q-dialog v-model="showUpdateDialog" persistent>
      <q-card style="min-width: 400px; max-width: 600px">
        <q-card-section class="row items-center q-pb-none">
          <q-icon name="system_update" color="primary" size="md" class="q-mr-sm" />
          <div class="text-h6">{{ $customT('updates.newVersionTitle') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div v-if="latestChangelog" class="q-mb-md">
            <div class="row items-center q-mb-sm">
              <q-chip
                :color="getVersionColor(latestChangelog.type)"
                text-color="white"
                :label="`v${latestChangelog.version}`"
                size="sm"
              />
              <span class="text-caption text-grey-6 q-ml-sm">{{ latestChangelog.date }}</span>
            </div>

            <div class="text-subtitle2 q-mb-sm">{{ $customT('updates.whatsNew') }}</div>
            <q-list dense>
              <q-item v-for="(change, index) in latestChangelog.changes" :key="index">
                <q-item-section avatar>
                  <q-icon name="check_circle" color="positive" size="sm" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2">{{ change }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <q-separator class="q-my-md" />

          <p class="text-body2">
            {{ $customT('updates.updateMessage') }}
          </p>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$customT('updates.later')"
            color="grey"
            v-close-popup
            @click="showUpdateDialog = false"
          />
          <q-btn
            unelevated
            :label="$customT('updates.update')"
            color="primary"
            @click="handleUpdateApp"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, provide } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import UserMenu from 'components/UserMenu.vue';
import { useNotificationsStore } from 'stores/notifications';
import { useAuthStore } from 'stores/auth';
import { getAvatarUrl } from 'src/utils/avatar-utils';
import FeedbackFooterBtn from 'components/FeedbackFooterBtn.vue';
import { onMounted } from 'vue';
import { getLatestChangelog, type ChangelogEntry } from 'src/utils/changelog';
import { useLocationStore } from 'stores/location';

interface FooterButton {
  icon: string;
  label?: string;
  onClick: () => void;
  order: number;
  badge?: number | string;
  badgeColor?: string;
}

const router = useRouter();
const route = useRoute();
const leftDrawerOpen = ref(false);
const rightDrawerOpen = ref(false);
const currentPageName = ref('');
const notificationsStore = useNotificationsStore();
const authStore = useAuthStore();
const locationStore = useLocationStore();

// Footer buttons state
const footerButtons = ref<FooterButton[]>([]);

// Computed properties voor gesorteerde buttons
const leftFooterButtons = computed(() => {
  return footerButtons.value.filter((btn) => btn.order < 0).sort((a, b) => b.order - a.order);
});

const middleFooterButtons = computed(() => {
  return footerButtons.value.filter((btn) => btn.order === 0).sort((a, b) => a.order - b.order);
});

const rightFooterButtons = computed(() => {
  return footerButtons.value.filter((btn) => btn.order > 0).sort((a, b) => a.order - b.order);
});

// Provide footer buttons voor child components
provide('footerButtons', footerButtons);

const canGoBack = computed(() => {
  // Check of we niet op de home pagina zijn
  if (route.path === '/') return false;

  // Check of er een history entry is
  if (window.history.length > 1) return true;

  // Als er geen history is maar we zijn niet op home, toon de back knop toch
  // (gebruiker kan altijd naar home gaan)
  return true;
});

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value;
};

const toggleRightDrawer = () => {
  rightDrawerOpen.value = !rightDrawerOpen.value;
};

const goBack = () => {
  // Als we op de home pagina zijn, doe niets
  if (route.path === '/') return;

  // Als er geen history is, ga naar home
  if (window.history.length <= 1) {
    void router.push('/');
    return;
  }

  // Probeer eerst router.back()
  try {
    router.back();
  } catch (error) {
    // Als router.back() faalt, ga naar home
    console.warn('Router.back() failed, navigating to home:', error);
    void router.push('/');
  }
};

watch(
  () => route.matched[route.matched.length - 1]?.components?.default,
  (component) => {
    if (component) {
      // Gebruik route meta of route name als paginanaam (altijd string)
      const metaTitle = typeof route.meta?.title === 'string' ? route.meta.title : '';
      const routeName = typeof route.name === 'string' ? route.name : '';
      currentPageName.value = metaTitle || routeName;
    }
  },
  { immediate: true },
);

// Computed property voor de avatar-url van de gebruiker
const userAvatarUrl = computed(() => {
  return getAvatarUrl(authStore.user);
});

// PWA detectie en platform check
const showPwaDialog = ref(false);
const showUpdateDialog = ref(false);
const isIos = ref(false);
const isAndroid = ref(false);

// Changelog state
const latestChangelog = ref<ChangelogEntry | null>(null);

function checkPwa() {
  // Controleer of de app als PWA draait
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  // Platform detectie
  const ua = window.navigator.userAgent.toLowerCase();
  isIos.value = /iphone|ipad|ipod/.test(ua);
  isAndroid.value = /android/.test(ua);

  // Toon popup alleen als niet standalone EN gebruiker is ingelogd
  if (!isStandalone && authStore.isAuthenticated) {
    showPwaDialog.value = true;
  }
}

// Service worker update handler
function handleUpdateApp() {
  showUpdateDialog.value = false;

  // Stuur bericht naar service worker om update uit te voeren
  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.ready.then((registration) => {
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    });
  }

  // Refresh de app na een korte delay
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Luister naar service worker berichten
function setupServiceWorkerListener() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        latestChangelog.value = getLatestChangelog();
        showUpdateDialog.value = true;
      }
    });
  }
}

// Helper functie voor versie kleuren
function getVersionColor(type: 'major' | 'minor' | 'patch'): string {
  switch (type) {
    case 'major':
      return 'negative'; // Rood voor grote wijzigingen
    case 'minor':
      return 'warning'; // Oranje voor middelgrote wijzigingen
    case 'patch':
      return 'positive'; // Groen voor kleine fixes
    default:
      return 'primary';
  }
}

function requestUserLocation() {
  window.dispatchEvent(new CustomEvent('get-user-location'));
}

// Watch voor authenticatie status om PWA dialog te tonen na login
watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      // Wacht even zodat de gebruiker eerst de login success melding ziet
      setTimeout(() => {
        checkPwa();
      }, 2000);
    }
  },
);

onMounted(() => {
  setupServiceWorkerListener();
});
</script>
