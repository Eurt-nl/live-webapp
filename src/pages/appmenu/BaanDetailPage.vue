<template>
  <q-page padding>
    <div v-if="baan" class="row q-col-gutter-md">
      <!-- Baan informatie -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="row items-center">
              <q-avatar size="48px" class="q-mr-md">
                <img :src="getLogoUrl(baan)" />
              </q-avatar>
              <div>
                <div class="text-h5">{{ baan.name }}</div>
                <div class="text-caption text-grey">
                  {{ baan.city }}<span v-if="country">, {{ country.name }}</span>
                </div>
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <!-- Icoontjes rij -->
            <div class="row justify-center q-gutter-md q-mb-lg">
              <!-- Categorie icoon -->
              <div v-if="getCategoryIconUrl(baan)" class="text-center">
                <div class="icon-square bg-grey-2 flex items-center justify-center">
                  <img
                    :src="getCategoryIconUrl(baan)"
                    :alt="baan.expand?.category?.name"
                    width="32"
                    height="32"
                  />
                </div>
                <div class="text-caption text-grey-6 q-mt-xs">
                  {{ baan.expand?.category?.name }}
                </div>
              </div>

              <!-- Route icoon (Google Maps) -->
              <div v-if="baan.gps" class="text-center cursor-pointer" @click="openGoogleMaps">
                <div class="icon-square bg-primary flex items-center justify-center">
                  <q-icon name="directions" color="white" size="32px" />
                </div>
                <div class="text-caption text-grey-6 q-mt-xs">Route</div>
              </div>

              <!-- Website icoon -->
              <div v-if="baan.website" class="text-center cursor-pointer" @click="openWebsite">
                <div class="icon-square bg-secondary flex items-center justify-center">
                  <q-icon name="language" color="white" size="32px" />
                </div>
                <div class="text-caption text-grey-6 q-mt-xs">Website</div>
              </div>

              <!-- Email icoon -->
              <div v-if="baan.email" class="text-center cursor-pointer" @click="openEmail">
                <div class="icon-square bg-accent flex items-center justify-center">
                  <q-icon name="email" color="white" size="32px" />
                </div>
                <div class="text-caption text-grey-6 q-mt-xs">Email</div>
              </div>
            </div>

            <!-- Melding of Apply for moderator knop -->
            <div class="row">
              <div class="col-12">
                <q-btn
                  v-if="hasOwnerOrModerators"
                  color="primary"
                  icon="mail"
                  :label="$customT('notifications.sendNotification')"
                  @click="openNotificationDialog"
                  class="full-width"
                />
                <q-btn
                  v-else
                  color="secondary"
                  icon="admin_panel_settings"
                  :label="$customT('notifications.applyForModerator')"
                  @click="openApplyModeratorDialog"
                  class="full-width"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Kaart -->
      <div class="col-12">
        <course-map
          :course-id="baan.id"
          :baan-gps="baan.gps"
          @update:holes="(newHoles) => (holes = newHoles)"
        />
      </div>
    </div>

    <div v-else class="text-center q-mt-lg">
      <q-spinner size="xl" />
      <div class="text-h6 q-mt-md">Baan laden...</div>
    </div>

    <!-- Hole foto dialoog -->
    <q-dialog v-model="holeImageDialog">
      <q-card style="min-width: 80vw">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Hole {{ selectedHole?.hole }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-img
            v-if="selectedHole?.image"
            :src="getHoleImageUrl(selectedHole)"
            style="max-height: 70vh"
            class="rounded-borders"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Melding dialoog -->
    <q-dialog v-model="notificationDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ $customT('notifications.sendNotification') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="notificationTitle"
            :label="$customT('notifications.subject')"
            :rules="[(val) => !!val || $customT('notifications.subject') + ' is verplicht']"
          />
          <q-input
            v-model="notificationBody"
            :label="$customT('notifications.notification')"
            type="textarea"
            :rules="[(val) => !!val || $customT('notifications.notification') + ' is verplicht']"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$customT('common.cancel')" color="grey" v-close-popup />
          <q-btn
            flat
            :label="$customT('notifications.send')"
            color="primary"
            @click="sendNotification"
            :loading="sendingNotification"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Apply for moderator dialoog -->
    <q-dialog v-model="applyModeratorDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ $customT('notifications.applyForModerator') }}</div>
          <div class="text-caption text-grey q-mt-sm">
            {{ $customT('notifications.applyForModeratorDescription', { courseName: baan?.name }) }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="applyModeratorMessage"
            :label="$customT('notifications.whyModerator')"
            type="textarea"
            :rules="[(val) => !!val || $customT('notifications.fillMessage')]"
            autogrow
            rows="4"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$customT('common.cancel')" color="grey" v-close-popup />
          <q-btn
            flat
            :label="$customT('notifications.send')"
            color="secondary"
            @click="sendApplyModerator"
            :loading="sendingApplyModerator"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<style scoped>
.icon-square {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.icon-square:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.cursor-pointer .icon-square:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { usePocketbase } from 'src/composables/usePocketbase';
import { getFileUrl } from 'src/utils/pocketbase-helpers';
import type { Course, Hole, Country } from 'src/components/models';
import CourseMap from 'components/CourseMap.vue';
import { useAuthStore } from 'stores/auth';
import { debug } from 'src/utils/debug';

const route = useRoute();
const $q = useQuasar();
const { t: $customT } = useI18n();
const { pb } = usePocketbase();
const authStore = useAuthStore();

const baan = ref<Course | null>(null);
const holes = ref<Hole[]>([]);
const notificationDialog = ref(false);
const notificationTitle = ref('');
const notificationBody = ref('');
const sendingNotification = ref(false);
const applyModeratorDialog = ref(false);
const applyModeratorMessage = ref('');
const sendingApplyModerator = ref(false);
const holeImageDialog = ref(false);
const selectedHole = ref<Hole | null>(null);
const country = ref<Country | null>(null);

// Computed property om te controleren of er een eigenaar of moderators zijn
const hasOwnerOrModerators = computed(() => {
  if (!baan.value) return false;
  return !!(baan.value.owner || (baan.value.moderators && baan.value.moderators.length > 0));
});

const getLogoUrl = (baan: Course) => {
  if (baan.logo) {
    return getFileUrl('courses', baan.id, baan.logo);
  }
  return 'https://cdn.quasar.dev/img/parallax2.jpg';
};

// Helper functie om categorie icoon URL op te halen
const getCategoryIconUrl = (baan: Course) => {
  if (baan.expand?.category?.icon) {
    return getFileUrl('categories', baan.expand.category.id, baan.expand.category.icon);
  }
  return null;
};

// Open Google Maps met GPS coördinaten
const openGoogleMaps = () => {
  if (baan.value?.gps) {
    const { latitude, longitude } = baan.value.gps;
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  }
};

// Open website in nieuw tabblad
const openWebsite = () => {
  if (baan.value?.website) {
    window.open(baan.value.website, '_blank');
  }
};

// Open email client
const openEmail = () => {
  if (baan.value?.email) {
    const subject = `Vraag over ${baan.value.name}`;
    const body = `Hallo,\n\nIk heb een vraag over ${baan.value.name}.\n\nMet vriendelijke groet,`;
    const mailtoUrl = `mailto:${baan.value.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  }
};

const getHoleImageUrl = (hole: Hole) => {
  if (hole.image) {
    return getFileUrl('course_detail', hole.id, hole.image);
  }
  return '';
};

const openNotificationDialog = () => {
  notificationTitle.value = '';
  notificationBody.value = '';
  notificationDialog.value = true;
};

const openApplyModeratorDialog = () => {
  applyModeratorMessage.value = '';
  applyModeratorDialog.value = true;
};

const sendApplyModerator = async () => {
  if (!applyModeratorMessage.value.trim()) {
    $q.notify({
      color: 'negative',
      message: $customT('notifications.fillMessage'),
      icon: 'error',
    });
    return;
  }

  // Controleer of user is ingelogd en user ID beschikbaar is
  if (!authStore.user?.id) {
    $q.notify({
      color: 'negative',
      message: 'Je moet ingelogd zijn om een moderator aanvraag te sturen',
      icon: 'error',
    });
    return;
  }

  try {
    sendingApplyModerator.value = true;

    // Debug: toon alle gebruikers om te zien welke roles er zijn
    debug('Zoeken naar superusers...');

    // Probeer eerst alle gebruikers op te halen om te debuggen
    const allUsers = await pb.collection('users').getList(1, 50);
    debug(
      'Alle gebruikers:',
      allUsers.items.map((u) => ({ id: u.id, name: u.name, role: u.role })),
    );

    // Zoek alle superusers (role naam = "superuser")
    const superusers = await pb.collection('users').getList(1, 100, {
      filter: 'role.name = "superuser"',
    });

    debug('Superusers gevonden:', superusers.items);

    if (!superusers.items || superusers.items.length === 0) {
      // Fallback: probeer de gebruiker met email rh.hasper@me.com
      try {
        const adminUser = await pb
          .collection('users')
          .getFirstListItem('email = "rh.hasper@me.com"');
        debug('Admin gebruiker gevonden via email:', adminUser);

        // Eerst de notificatie aanmaken om de ID te krijgen
        const notificationData = {
          to_user: [adminUser.id],
          from_user: authStore.user?.id,
          title: `[Betreft: ${baan.value?.name}] Moderator aanvraag`, // Originele title voor backward compatibility
          body: `Gebruiker ${authStore.user?.name} (${authStore.user?.email}) wil moderator worden van ${baan.value?.name} in ${baan.value?.city}, ${country.value?.name || 'Onbekend land'}.

Gebruiker ID: ${authStore.user?.id}
Baan ID: ${baan.value?.id}

Motivatie:
${applyModeratorMessage.value}`,
          link: '',
          seen: false,
          // Template en data voor Optie 3
          template: 'moderator_request',
          data: JSON.stringify({
            courseName: baan.value?.name,
            userName: authStore.user?.name,
            motivation: applyModeratorMessage.value,
            city: baan.value?.city,
            country: country.value?.name || 'Onbekend land',
            userId: authStore.user?.id,
            courseId: baan.value?.id,
          }),
          original_language: 'nl', // Nederlandse gebruiker
        };

        const createdNotification = await pb.collection('notifications').create(notificationData);

        // Update de notificatie met de juiste link inclusief notificationId
        await pb.collection('notifications').update(createdNotification.id, {
          link: `${window.location.origin}/moderator-approval?userId=${authStore.user?.id}&courseId=${baan.value?.id}&notificationId=${createdNotification.id}`,
        });

        $q.notify({
          color: 'positive',
          message: $customT('notifications.moderatorRequestSent'),
          icon: 'check',
        });
        applyModeratorDialog.value = false;
        return;
      } catch (emailError) {
        debug('Ook geen admin gebruiker gevonden via email:', emailError);
        throw new Error($customT('moderator.noSuperusersFound'));
      }
    }

    // Verzamel alle superuser IDs
    const superuserIds = superusers.items.map((user) => user.id);

    // Eerst de notificatie aanmaken om de ID te krijgen
    const notificationData = {
      to_user: superuserIds,
      from_user: authStore.user?.id,
      title: `[Betreft: ${baan.value?.name}] Moderator aanvraag`, // Originele title voor backward compatibility
      body: `Gebruiker ${authStore.user?.name} (${authStore.user?.email}) wil moderator worden van ${baan.value?.name} in ${baan.value?.city}, ${country.value?.name || 'Onbekend land'}.

Gebruiker ID: ${authStore.user?.id}
Baan ID: ${baan.value?.id}

Motivatie:
${applyModeratorMessage.value}`,
      link: '',
      seen: false,
      // Template en data voor Optie 3
      template: 'moderator_request',
      data: JSON.stringify({
        courseName: baan.value?.name,
        userName: authStore.user?.name,
        motivation: applyModeratorMessage.value,
        city: baan.value?.city,
        country: country.value?.name || 'Onbekend land',
        userId: authStore.user?.id,
        courseId: baan.value?.id,
      }),
      original_language: 'nl', // Nederlandse gebruiker
    };

    const createdNotification = await pb.collection('notifications').create(notificationData);

    // Update de notificatie met de juiste link inclusief notificationId
    await pb.collection('notifications').update(createdNotification.id, {
      link: `${window.location.origin}/moderator-approval?userId=${authStore.user?.id}&courseId=${baan.value?.id}&notificationId=${createdNotification.id}`,
    });

    $q.notify({
      color: 'positive',
      message: $customT('notifications.moderatorRequestSentSuperusers'),
      icon: 'check',
    });
    applyModeratorDialog.value = false;
  } catch (error) {
    debug('Error sending apply moderator:', error);
    $q.notify({
      color: 'negative',
      message: $customT('notifications.feedbackError') + ': ' + error.message,
      icon: 'error',
    });
  } finally {
    sendingApplyModerator.value = false;
  }
};

const sendNotification = async () => {
  if (!notificationTitle.value || !notificationBody.value) {
    $q.notify({
      color: 'negative',
      message: $customT('notifications.fillAllFields'),
      icon: 'error',
    });
    return;
  }

  try {
    sendingNotification.value = true;
    const ownerId = baan.value?.owner;

    if (!ownerId) {
      throw new Error('Geen eigenaar gevonden');
    }

    const notificationData = {
      to_user: [ownerId, ...(baan.value?.moderators || [])],
      from_user: authStore.user?.id,
      title: `[Betreft: ${baan.value?.name}] ${notificationTitle.value}`,
      body: notificationBody.value,
      link: '',
      seen: false,
    };

    await pb.collection('notifications').create(notificationData);

    $q.notify({
      color: 'positive',
      message: $customT('notifications.notificationSent'),
      icon: 'check',
    });
    notificationDialog.value = false;
  } catch (error) {
    debug('Error sending notification:', error);
    $q.notify({
      color: 'negative',
      message: $customT('notifications.notificationError') + ': ' + error.message,
      icon: 'error',
    });
  } finally {
    sendingNotification.value = false;
  }
};

onMounted(async () => {
  try {
    const result = await pb.collection('courses').getOne(route.params.id as string, {
      expand: 'owner,moderators,category',
    });
    baan.value = result as Course;
    if (baan.value?.country) {
      country.value = await pb.collection('countries').getOne(baan.value.country);
    }
  } catch (error) {
    debug('Error loading baan:', error);
    $q.notify({
      color: 'negative',
      message: $customT('notifications.loadCourseError'),
      icon: 'error',
    });
  }
});
</script>
