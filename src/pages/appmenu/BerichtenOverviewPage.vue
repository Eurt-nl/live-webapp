<template>
  <q-page padding>
    <div class="text-h4 q-mb-md">{{ $customT('messages.title') }}</div>

    <q-list bordered separator v-if="berichten.length > 0">
      <q-slide-item
        v-for="bericht in berichten"
        :key="bericht.id"
        @left="({ reset }) => archiveBericht(bericht, reset)"
        left-color="primary"
      >
        <template v-slot:left>
          <div class="row items-center">
            <q-icon left name="archive" />
            <div class="text-subtitle1 q-ml-sm">{{ $customT('messages.archive') }}</div>
          </div>
        </template>

        <q-item
          clickable
          @click="openBericht(bericht)"
          :class="{ 'bg-grey-2': !isBerichtSeen(bericht) }"
        >
          <q-item-section side>
            <q-icon
              :name="isBerichtSeen(bericht) ? 'mail' : 'mark_email_unread'"
              :color="isBerichtSeen(bericht) ? 'grey' : 'primary'"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ getTranslatedTitle(bericht) }}</q-item-label>
            <q-item-label caption>
              {{ $customT('messages.from') }} {{ bericht.expand?.from_user?.name }}
            </q-item-label>
            <q-item-label caption>
              {{ formatDate(bericht.created) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-slide-item>
    </q-list>

    <div v-else class="text-center q-pa-md text-grey">
      {{ $customT('messages.noMessagesFound') }}
    </div>

    <!-- Bericht detail dialoog -->
    <q-dialog v-model="berichtDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ translatedTitle || selectedBericht?.title }}</div>
          <div class="text-caption">
            {{ $customT('messages.from') }} {{ selectedBericht?.expand?.from_user?.name }}
            {{ $customT('messages.on') }}
            {{ formatDate(selectedBericht?.created) }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <!-- Toon template-based bericht als beschikbaar, anders originele body -->
          <div v-if="selectedBericht?.template && selectedBericht?.data" class="template-message">
            <div class="text-body1 q-mb-md">{{ translatedMessage }}</div>
            <div class="text-caption text-grey-6">
              <div v-if="selectedBericht.template === 'course_request'">
                <strong>Website:</strong> {{ JSON.parse(selectedBericht.data).website }}<br />
                <strong>Locatie:</strong> {{ JSON.parse(selectedBericht.data).latitude }},
                {{ JSON.parse(selectedBericht.data).longitude }}
              </div>
              <div v-else-if="selectedBericht.template === 'moderator_request'">
                <strong>Motivatie:</strong> {{ JSON.parse(selectedBericht.data).motivation }}<br />
                <strong>Locatie:</strong> {{ JSON.parse(selectedBericht.data).city }},
                {{ JSON.parse(selectedBericht.data).country }}
              </div>
            </div>
          </div>
          <div v-else v-html="selectedBericht?.body"></div>

          <div v-if="selectedBericht?.image" class="q-mt-md">
            <img
              :src="getFileUrl('notifications', selectedBericht.id, selectedBericht.image)"
              alt="Screenshot"
              style="max-width: 100%; border: 1px solid #ccc; border-radius: 4px"
            />
          </div>

          <!-- Moderator aanvraag knoppen -->
          <div v-if="isModeratorRequest(selectedBericht)" class="q-mt-md">
            <q-separator class="q-my-md" />
            <div class="text-subtitle2 q-mb-sm">
              {{ $customT('messages.moderatorRequestActions') }}
            </div>
            <div class="row q-gutter-sm">
              <q-btn
                unelevated
                color="positive"
                icon="check"
                :label="$customT('messages.approve')"
                @click="approveModerator(selectedBericht)"
                :loading="processing"
              />
              <q-btn
                outline
                color="negative"
                icon="close"
                :label="$customT('messages.reject')"
                @click="rejectModerator(selectedBericht)"
                :loading="processing"
              />
            </div>
          </div>

          <!-- Course request knoppen -->
          <div v-if="isCourseRequest(selectedBericht)" class="q-mt-md">
            <q-separator class="q-my-md" />
            <div class="text-subtitle2 q-mb-sm">
              {{ $customT('messages.courseRequestActions') }}
            </div>
            <div class="row q-gutter-sm">
              <q-btn
                unelevated
                color="positive"
                icon="add_location"
                :label="$customT('messages.createCourse')"
                @click="createCourseFromRequest(selectedBericht)"
                :loading="processing"
              />
              <q-btn
                outline
                color="negative"
                icon="close"
                :label="$customT('messages.reject')"
                @click="rejectCourseRequest(selectedBericht)"
                :loading="processing"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$customT('messages.close')"
            color="primary"
            v-close-popup
            @click="markAsSeen"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore, type User } from 'stores/auth';
import { useNotificationsStore } from 'stores/notifications';
import { debug } from 'src/utils/debug';
import { getFileUrl } from 'src/utils/pocketbase-helpers';

const $q = useQuasar();
const { t: $customT } = useI18n();
const { pb } = usePocketbase();
const authStore = useAuthStore();
const notificationsStore = useNotificationsStore();

const berichten = ref([]);
const berichtDialog = ref(false);
const selectedBericht = ref(null);
const loading = ref(false);
const processing = ref(false);
const isUnmounted = ref(false);
const translatedMessage = ref('');
const translatedTitle = ref('');

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isBerichtSeen = (bericht) => {
  return bericht.seen_by?.includes(authStore.user?.id);
};

const isModeratorRequest = (bericht) => {
  return (
    bericht?.title?.includes('Moderator aanvraag') && bericht?.link?.includes('moderator-approval')
  );
};

const isCourseRequest = (bericht) => {
  return bericht?.title?.includes('Nieuw baan verzoek');
};

// Functie om vertaalde title te krijgen voor de lijst
const getTranslatedTitle = (bericht) => {
  if (!bericht?.template || !bericht?.data) {
    return bericht?.title || '';
  }

  try {
    const data = JSON.parse(bericht.data);

    if (bericht.template === 'course_request') {
      const translatedTitle = $customT('messages.templates.course_request_title', {
        courseName: data.courseName,
      });
      debug('List title for course request:', translatedTitle);
      return translatedTitle;
    } else if (bericht.template === 'moderator_request') {
      const translatedTitle = $customT('messages.templates.moderator_request_title', {
        courseName: data.courseName,
      });
      debug('List title for moderator request:', translatedTitle);
      return translatedTitle;
    } else {
      return bericht?.title || '';
    }
  } catch (error) {
    debug('Error translating title:', error);
    return bericht?.title || '';
  }
};

// Functie om template-based berichten te vertalen
const loadTranslatedMessage = (bericht) => {
  if (!bericht?.template || !bericht?.data) {
    debug('No template or data found, using body');
    translatedMessage.value = bericht?.body || '';
    translatedTitle.value = bericht?.title || '';
    return;
  }

  try {
    const data = JSON.parse(bericht.data);
    debug('Parsed template data:', data);

    // Gebruik direct de i18n template zonder complexe vertaling voor nu
    if (bericht.template === 'course_request') {
      const message = $customT('messages.templates.course_request', {
        courseName: data.courseName,
        userName: data.userName,
      });
      const title = $customT('messages.templates.course_request_title', {
        courseName: data.courseName,
      });
      debug('Generated course request message:', message);
      debug('Generated course request title:', title);
      translatedMessage.value = message;
      translatedTitle.value = title;
    } else if (bericht.template === 'moderator_request') {
      const message = $customT('messages.templates.moderator_request', {
        courseName: data.courseName,
        userName: data.userName,
      });
      const title = $customT('messages.templates.moderator_request_title', {
        courseName: data.courseName,
      });
      debug('Generated moderator request message:', message);
      debug('Generated moderator request title:', title);
      translatedMessage.value = message;
      translatedTitle.value = title;
    } else {
      debug('Unknown template, using body');
      translatedMessage.value = bericht?.body || '';
      translatedTitle.value = bericht?.title || '';
    }
  } catch (error) {
    debug('Error translating message:', error);
    translatedMessage.value = bericht?.body || '';
    translatedTitle.value = bericht?.title || '';
  }
};

const loadBerichten = async () => {
  if (isUnmounted.value) return;

  try {
    loading.value = true;
    const result = await pb.collection('notifications').getList(1, 50, {
      filter: `to_user ~ "${authStore.user?.id}" && archived_by !~ "${authStore.user?.id}" && (handeld_by = "" || handeld_by = null)`,
      sort: '-created',
      expand: 'from_user',
    });
    if (!isUnmounted.value) {
      berichten.value = result.items;
    }
  } catch (error) {
    if (!isUnmounted.value) {
      debug('Error loading berichten:', error);
      $q.notify({
        color: 'negative',
        message: $customT('messages.loadError'),
        icon: 'error',
      });
    }
  } finally {
    if (!isUnmounted.value) {
      loading.value = false;
    }
  }
};

// Update de auth store user met role expand
const updateAuthUserWithRole = async () => {
  if (authStore.user?.id) {
    try {
      const userWithRole = await pb.collection('users').getOne(authStore.user.id, {
        expand: 'role',
      });
      // Cast de PocketBase record naar User type
      authStore.user = userWithRole as unknown as User;
    } catch (error) {
      debug.warn('Kon user role niet ophalen:', error);
    }
  }
};

const openBericht = (bericht) => {
  selectedBericht.value = bericht;
  berichtDialog.value = true;

  // Debug: toon bericht data
  debug('Opening bericht:', {
    id: bericht.id,
    template: bericht.template,
    data: bericht.data,
    original_language: bericht.original_language,
    body: bericht.body,
  });

  // Laad vertaalde bericht als het een template-based bericht is
  if (bericht?.template && bericht?.data) {
    debug('Loading template-based message');
    loadTranslatedMessage(bericht);
  } else {
    debug('Loading regular message');
    translatedMessage.value = bericht?.body || '';
    translatedTitle.value = bericht?.title || '';
  }
};

const markAsSeen = async () => {
  if (!isBerichtSeen(selectedBericht.value)) {
    try {
      await pb.collection('notifications').update(selectedBericht.value.id, {
        'seen_by+': authStore.user?.id,
      });
      await loadBerichten();
      await notificationsStore.checkUnreadMessages();
    } catch (error) {
      debug('Error marking as seen:', error);
      $q.notify({
        color: 'negative',
        message: $customT('messages.markAsReadError'),
        icon: 'error',
      });
    }
  }
};

const archiveBericht = async (bericht, reset) => {
  try {
    await pb.collection('notifications').update(bericht.id, {
      'archived_by+': authStore.user?.id,
    });

    // Verwijder het bericht uit de lokale lijst
    berichten.value = berichten.value.filter((b) => b.id !== bericht.id);

    $q.notify({
      color: 'positive',
      message: $customT('messages.archiveSuccess'),
      icon: 'archive',
    });
  } catch (error) {
    debug('Error archiving bericht:', error);
    $q.notify({
      color: 'negative',
      message: $customT('messages.archiveError'),
      icon: 'error',
    });
    // Reset de swipe als er een fout optreedt
    if (reset) reset();
  }
};

const approveModerator = async (bericht) => {
  try {
    processing.value = true;

    // Optimistic locking: check of bericht al is afgehandeld
    const currentBericht = await pb.collection('notifications').getOne(bericht.id);
    if (
      currentBericht.handeld_by &&
      Array.isArray(currentBericht.handeld_by) &&
      currentBericht.handeld_by.length > 0
    ) {
      $q.notify({
        color: 'warning',
        message: 'Dit bericht is al afgehandeld door een andere superuser',
        icon: 'warning',
      });
      // Herlaad berichten om de lijst bij te werken
      await loadBerichten();
      return;
    }

    // Parse moderator request data - gebruik template data als beschikbaar, anders link parsing
    let userId, courseId;

    if (bericht.template === 'moderator_request' && bericht.data) {
      try {
        const templateData = JSON.parse(bericht.data);
        userId = templateData.userId;
        courseId = templateData.courseId;
        debug('Using template data for moderator request:', { userId, courseId });
      } catch (parseError) {
        debug('Error parsing template data, falling back to link parsing:', parseError);
        // Fallback naar link parsing
        userId = null;
        courseId = null;
      }
    }

    // Fallback naar link parsing als template data niet beschikbaar is
    if (!userId || !courseId) {
      const url = new URL(bericht.link);
      userId = url.searchParams.get('userId');
      courseId = url.searchParams.get('courseId');
      debug('Using link parsed data for moderator request:', { userId, courseId });
    }

    debug('Debug moderator approval:', {
      link: bericht.link,
      userId,
      courseId,
      currentUser: authStore.user?.id,
    });

    if (!userId || !courseId || userId === 'undefined' || courseId === 'undefined') {
      // Probeer user ID uit de body te halen als fallback
      const bodyMatch = bericht.body?.match(/Gebruiker ID: ([^\n]+)/);
      const fallbackUserId = bodyMatch ? bodyMatch[1] : null;

      if (fallbackUserId && fallbackUserId !== 'undefined') {
        userId = fallbackUserId;
        debug('Using fallback userId from body:', userId);
      } else {
        // Markeer de notificatie als ongeldig en geef een duidelijke error
        await pb.collection('notifications').update(bericht.id, {
          body:
            bericht.body +
            '\n\n[ONGELDIG: Deze notificatie is fout aangemaakt zonder geldige user ID]',
          seen: true,
        });

        throw new Error(
          'Ongeldige moderator aanvraag parameters - userId is undefined. Deze notificatie is fout aangemaakt en is gemarkeerd als ongeldig.',
        );
      }
    }

    // Haal huidige moderators op
    const course = await pb.collection('courses').getOne(courseId);
    debug('Course data:', course);

    const currentModerators = course.moderators || [];
    debug('Current moderators:', currentModerators);

    // Voeg nieuwe moderator toe (voorkom duplicaten)
    const newModerators = currentModerators.includes(userId)
      ? currentModerators
      : [...currentModerators, userId];

    debug('New moderators:', newModerators);

    // Controleer of huidige gebruiker rechten heeft om moderator toe te voegen
    const currentUser = authStore.user;
    const isOwner = course.owner === currentUser?.id;
    const isModerator = course.moderators?.includes(currentUser?.id);

    debug('Permission check:', {
      currentUser: currentUser?.id,
      courseOwner: course.owner,
      isOwner,
      isModerator,
      userRole: currentUser?.role,
    });

    // Debug: toon de role informatie
    const userRecord = currentUser as User;
    debug('Role debug:', {
      role: userRecord?.role,
      roleType: typeof userRecord?.role,
      expandRole: userRecord?.expand?.role,
      roleName: userRecord?.expand?.role?.name,
      roleCatType: userRecord?.expand?.role?.cat_type,
    });

    // Alleen eigenaar, moderators of superusers kunnen moderators toevoegen
    const isSuperuser =
      userRecord?.expand?.role?.cat_type === 'role' &&
      userRecord?.expand?.role?.name === 'superuser';

    if (!isOwner && !isModerator && !isSuperuser) {
      throw new Error('Geen rechten om moderator toe te voegen');
    }

    // Update de baan met nieuwe moderator
    await pb.collection('courses').update(courseId, {
      moderators: newModerators,
    });

    // Markeer notificatie als afgehandeld door superuser
    await pb.collection('notifications').update(bericht.id, {
      'seen_by+': authStore.user?.id,
      'handeld_by+': authStore.user?.id,
    });

    // Herlaad berichten om de lijst bij te werken (database-gebaseerde filtering)
    await loadBerichten();

    $q.notify({
      color: 'positive',
      message: $customT('messages.moderatorApprovalSuccess'),
      icon: 'check',
    });

    berichtDialog.value = false;
  } catch (error) {
    debug('Error approving moderator:', error);
    $q.notify({
      color: 'negative',
      message: $customT('notifications.moderatorApprovalError') + error.message,
      icon: 'error',
    });
  } finally {
    processing.value = false;
  }
};

const rejectModerator = async (bericht) => {
  try {
    processing.value = true;

    // Optimistic locking: check of bericht al is afgehandeld
    const currentBericht = await pb.collection('notifications').getOne(bericht.id);
    if (
      currentBericht.handeld_by &&
      Array.isArray(currentBericht.handeld_by) &&
      currentBericht.handeld_by.length > 0
    ) {
      $q.notify({
        color: 'warning',
        message: 'Dit bericht is al afgehandeld door een andere superuser',
        icon: 'warning',
      });
      // Herlaad berichten om de lijst bij te werken
      await loadBerichten();
      return;
    }

    // Markeer notificatie als afgehandeld door superuser
    await pb.collection('notifications').update(bericht.id, {
      'seen_by+': authStore.user?.id,
      'handeld_by+': authStore.user?.id,
    });

    // Herlaad berichten om de lijst bij te werken (database-gebaseerde filtering)
    await loadBerichten();

    $q.notify({
      color: 'warning',
      message: $customT('messages.moderatorRejectionSuccess'),
      icon: 'close',
    });

    berichtDialog.value = false;
  } catch (error) {
    debug('Error rejecting moderator:', error);
    $q.notify({
      color: 'negative',
      message: $customT('messages.moderatorRejectionError') + error.message,
      icon: 'error',
    });
  } finally {
    processing.value = false;
  }
};

const createCourseFromRequest = async (bericht) => {
  try {
    processing.value = true;

    debug('Creating course from request, bericht data:', bericht);

    // Optimistic locking: check of bericht al is afgehandeld
    const currentBericht = await pb.collection('notifications').getOne(bericht.id);
    if (
      currentBericht.handeld_by &&
      Array.isArray(currentBericht.handeld_by) &&
      currentBericht.handeld_by.length > 0
    ) {
      $q.notify({
        color: 'warning',
        message: 'Dit bericht is al afgehandeld door een andere superuser',
        icon: 'warning',
      });
      // Herlaad berichten om de lijst bij te werken
      await loadBerichten();
      return;
    }

    // Parse course request data - gebruik template data als beschikbaar, anders regex parsing
    let courseRequestData;

    if (bericht.template === 'course_request' && bericht.data) {
      try {
        const templateData = JSON.parse(bericht.data);
        courseRequestData = {
          name: templateData.courseName,
          website: templateData.website,
          latitude: templateData.latitude,
          longitude: templateData.longitude,
          requested_by: templateData.requested_by || bericht.from_user,
        };
        debug('Using template data for course request:', courseRequestData);
      } catch (parseError) {
        debug('Error parsing template data, falling back to regex:', parseError);
        // Fallback naar regex parsing
        courseRequestData = null;
      }
    }

    // Fallback naar regex parsing als template data niet beschikbaar is
    if (!courseRequestData) {
      const messageBody = bericht.body || '';
      debug('Message body:', messageBody);

      // Extract data from the message body using regex
      const nameMatch = messageBody.match(/Naam:\s*(.+)/);
      const websiteMatch = messageBody.match(/Website:\s*(.+)/);
      const locationMatch = messageBody.match(/Locatie:\s*([\d.-]+),\s*([\d.-]+)/);

      if (!nameMatch || !locationMatch) {
        $q.notify({
          color: 'negative',
          message: 'Kon course request data niet extraheren uit het bericht.',
          icon: 'error',
        });
        return;
      }

      courseRequestData = {
        name: nameMatch[1].trim(),
        website: websiteMatch ? websiteMatch[1].trim() : '',
        latitude: parseFloat(locationMatch[1]),
        longitude: parseFloat(locationMatch[2]),
        requested_by: bericht.from_user,
      };
      debug('Using regex parsed data for course request:', courseRequestData);
    }

    debug('Extracted course request data:', courseRequestData);

    // Haal de "Pitch & Putt" categorie op
    const categoryResult = await pb.collection('categories').getList(1, 10, {
      filter: 'cat_type = "course"',
    });

    debug('Available categories:', categoryResult.items);

    // Zoek naar Pitch & Putt categorie of gebruik de eerste beschikbare
    let categoryId = null;
    const pitchPuttCategory = categoryResult.items.find(
      (cat) =>
        cat.name === 'Pitch & Putt' ||
        cat.name.toLowerCase().includes('pitch') ||
        cat.name.toLowerCase().includes('putt'),
    );

    if (pitchPuttCategory) {
      categoryId = pitchPuttCategory.id;
      debug('Found Pitch & Putt category:', pitchPuttCategory);
    } else if (categoryResult.items.length > 0) {
      categoryId = categoryResult.items[0].id;
      debug('Using first available category:', categoryResult.items[0]);
    } else {
      throw new Error('Geen course categorieën gevonden');
    }

    // Maak de nieuwe baan aan
    const courseData = {
      name: courseRequestData.name,
      city: '', // Leeg laten in plaats van 'Onbekend'
      country: '', // Leeg laten in plaats van default Nederland
      gps: JSON.stringify({
        latitude: courseRequestData.latitude,
        longitude: courseRequestData.longitude,
      }),
      email: '',
      website: courseRequestData.website,
      owner: '', // Leeg laten in plaats van superuser
      moderators: [courseRequestData.requested_by], // Aanvrager wordt moderator
      category: categoryId,
    };

    debug('Creating course with data:', courseData);

    let createdCourse;
    try {
      createdCourse = await pb.collection('courses').create(courseData);
      debug('Course created:', createdCourse);
    } catch (createError) {
      debug('Course creation error details:', {
        error: createError,
        data: createError.data,
        message: createError.message,
        status: createError.status,
      });
      throw createError;
    }

    // Maak automatisch 18 holes aan
    debug('Creating 18 holes for course:', createdCourse.id);
    for (let holeNumber = 1; holeNumber <= 18; holeNumber++) {
      const holeData = {
        course: createdCourse.id,
        hole: holeNumber,
        par: 3,
        hole_length: null, // Kan later aangepast worden
        hole_index: null, // Kan later aangepast worden
        gps_tee: JSON.stringify({ latitude: null, longitude: null }),
        gps_green: JSON.stringify({ latitude: null, longitude: null }),
      };

      try {
        await pb.collection('course_detail').create(holeData);
        debug(`Hole ${holeNumber} created`);
      } catch (holeError) {
        debug(`Error creating hole ${holeNumber}:`, holeError);
        // Ga door met de volgende hole, niet stoppen bij één fout
      }
    }

    // Markeer notificatie als afgehandeld door superuser
    await pb.collection('notifications').update(bericht.id, {
      'seen_by+': authStore.user?.id,
      'handeld_by+': authStore.user?.id,
    });

    // Herlaad berichten om de lijst bij te werken (database-gebaseerde filtering)
    await loadBerichten();

    $q.notify({
      color: 'positive',
      message: `Baan "${courseRequestData.name}" succesvol aangemaakt met 18 holes (par 3) en ${bericht.expand?.from_user?.name} toegevoegd als moderator`,
      icon: 'check',
    });

    berichtDialog.value = false;
  } catch (error) {
    debug('Error creating course from request:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij aanmaken baan: ' + error.message,
      icon: 'error',
    });
  } finally {
    processing.value = false;
  }
};

const rejectCourseRequest = async (bericht) => {
  try {
    processing.value = true;

    // Optimistic locking: check of bericht al is afgehandeld
    const currentBericht = await pb.collection('notifications').getOne(bericht.id);
    if (
      currentBericht.handeld_by &&
      Array.isArray(currentBericht.handeld_by) &&
      currentBericht.handeld_by.length > 0
    ) {
      $q.notify({
        color: 'warning',
        message: 'Dit bericht is al afgehandeld door een andere superuser',
        icon: 'warning',
      });
      // Herlaad berichten om de lijst bij te werken
      await loadBerichten();
      return;
    }

    // Markeer notificatie als afgehandeld door superuser
    await pb.collection('notifications').update(bericht.id, {
      'seen_by+': authStore.user?.id,
      'handeld_by+': authStore.user?.id,
    });

    // Herlaad berichten om de lijst bij te werken (database-gebaseerde filtering)
    await loadBerichten();

    $q.notify({
      color: 'warning',
      message: 'Baan aanvraag afgewezen',
      icon: 'close',
    });

    berichtDialog.value = false;
  } catch (error) {
    debug('Error rejecting course request:', error);
    $q.notify({
      color: 'negative',
      message: 'Fout bij afwijzen baan aanvraag: ' + error.message,
      icon: 'error',
    });
  } finally {
    processing.value = false;
  }
};

onMounted(async () => {
  notificationsStore.init();
  await updateAuthUserWithRole();
  // Promise van loadBerichten wordt genegeerd met 'void' voor linter
  void loadBerichten();
});

onBeforeUnmount(() => {
  isUnmounted.value = true;
  notificationsStore.cleanup();
});
</script>
