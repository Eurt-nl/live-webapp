<template>
  <div class="q-pa-md">
    <div class="row justify-between items-center q-mb-lg">
      <div class="text-h5">
        {{ showArchived ? $customT('rounds.archivedRounds') : $customT('rounds.myRounds') }}
      </div>
      <q-btn
        v-if="!showArchived"
        color="secondary"
        icon="add"
        :label="$customT('rounds.practiceRound')"
        @click="openPracticeRoundDialog"
      />
    </div>

    <!-- Rondes lijst -->
    <q-pull-to-refresh @refresh="onRefresh">
      <div class="row q-col-gutter-md">
        <div v-for="round in rounds" :key="round.id" class="col-12 col-sm-6 col-md-4">
          <!-- Swipe-to-delete voor oefenrondes van de huidige gebruiker -->
          <q-slide-item
            v-if="canDeleteRound(round)"
            @right="confirmDeleteRound(round)"
            right-color="negative"
            class="q-mb-sm"
          >
            <template v-slot:right>
              <div class="row items-center q-px-md">
                <q-icon name="delete" />
              </div>
            </template>
            <q-card
              class="round-card cursor-pointer"
              @click="handleRoundClick(round)"
              :class="[
                'round-card cursor-pointer',
                round.is_finalized
                  ? 'bg-grey-3'
                  : round.player === authStore.user?.id && round.marker === authStore.user?.id
                    ? 'bg-green-1'
                    : round.player === authStore.user?.id
                      ? 'bg-yellow-1'
                      : round.marker === authStore.user?.id
                        ? 'bg-orange-1'
                        : '',
              ]"
              style="position: relative"
            >
              <q-card-section class="q-pa-sm">
                <div class="row items-center justify-between q-mb-xs">
                  <div class="row items-center no-wrap">
                    <div class="text-subtitle1 text-weight-medium">
                      {{ round.expand?.category?.name }}
                    </div>
                    <q-chip
                      v-if="round.marker === authStore.user?.id"
                      color="orange"
                      text-color="white"
                      size="xs"
                      class="q-ml-xs"
                      style="font-weight: bold"
                    >
                      {{ $customT('rounds.marker') }}
                    </q-chip>
                  </div>
                </div>

                <div class="text-caption text-grey-8">{{ round.expand?.course?.name }}</div>
                <!-- Event naam tonen voor alle rondes met een event -->
                <div
                  v-if="round.expand?.event?.name || round.expand?.event_round?.expand?.event?.name"
                  class="text-body2 text-weight-medium q-mt-xs"
                >
                  {{ round.expand?.event?.name || round.expand?.event_round?.expand?.event?.name }}
                </div>
                <!-- Datum tonen voor gearchiveerde rondes -->
                <div v-if="showArchived" class="text-body2 q-mt-xs">
                  {{ formatDate(round.date) }}
                  <span v-if="round.expand?.event_round">
                    |
                    {{
                      $customT('rounds.roundNumber', {
                        number: round.expand.event_round.round_number,
                      })
                    }}
                  </span>
                </div>
                <div
                  v-if="
                    round.player === authStore.user?.id &&
                    (!round.marker || round.marker === '') &&
                    (round.expand?.category?.name === 'Toernooi' ||
                      round.expand?.category?.name === 'Competitie' ||
                      round.expand?.category?.name === 'Skins') &&
                    round.qr_token
                  "
                  class="q-mt-md"
                >
                  <!-- QR-code tonen als de speler nog geen marker heeft, voor Toernooi, Competitie én Skins -->
                  <div class="row items-center no-wrap">
                    <div>
                      <!-- QR-code component met unieke token -->
                      <QrcodeVue :value="getQrUrl(round.qr_token)" :size="96" />
                    </div>
                    <div class="q-ml-md" style="min-width: 180px">
                      <div class="text-body2">{{ $customT('rounds.scanQr') }}</div>
                      <div class="text-h6 text-left text-weight-bold q-mt-xs">
                        {{ round.qr_token }}
                      </div>
                    </div>
                  </div>
                </div>
              </q-card-section>
              <q-btn
                v-if="
                  !round.is_finalized &&
                  !(
                    round.player === authStore.user?.id &&
                    (round.expand?.category?.name === 'Toernooi' ||
                      round.expand?.category?.name === 'Competitie' ||
                      round.expand?.category?.name === 'Skins')
                  ) &&
                  round.player !== authStore.user?.id
                "
                fab-mini
                color="primary"
                icon="edit"
                @click.stop="viewScores(round.id)"
                style="
                  position: absolute;
                  bottom: 12px;
                  right: 12px;
                  z-index: 2;
                  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                "
                :aria-label="'Score invoeren voor ronde ' + (round.expand?.category?.name || '')"
                size="sm"
              />
            </q-card>
          </q-slide-item>

          <!-- Normale card voor rondes die niet verwijderd kunnen worden -->
          <q-card
            v-else
            class="round-card cursor-pointer"
            @click="handleRoundClick(round)"
            :class="[
              'round-card cursor-pointer',
              round.is_finalized
                ? 'bg-grey-3'
                : round.player === authStore.user?.id && round.marker === authStore.user?.id
                  ? 'bg-green-1'
                  : round.player === authStore.user?.id
                    ? 'bg-yellow-1'
                    : round.marker === authStore.user?.id
                      ? 'bg-orange-1'
                      : '',
            ]"
            style="position: relative"
          >
            <q-card-section class="q-pa-sm">
              <div class="row items-center justify-between q-mb-xs">
                <div class="row items-center no-wrap">
                  <div class="text-subtitle1 text-weight-medium">
                    {{ round.expand?.category?.name }}
                  </div>
                  <q-chip
                    v-if="round.marker === authStore.user?.id"
                    color="orange"
                    text-color="white"
                    size="xs"
                    class="q-ml-xs"
                    style="font-weight: bold"
                  >
                    {{ $customT('rounds.marker') }}
                  </q-chip>
                </div>
              </div>

              <div class="text-caption text-grey-8">{{ round.expand?.course?.name }}</div>
              <!-- Event naam tonen voor alle rondes met een event -->
              <div
                v-if="round.expand?.event?.name || round.expand?.event_round?.expand?.event?.name"
                class="text-body2 text-weight-medium q-mt-xs"
              >
                {{ round.expand?.event?.name || round.expand?.event_round?.expand?.event?.name }}
              </div>
              <!-- Datum tonen voor gearchiveerde rondes -->
              <div v-if="showArchived" class="text-body2 q-mt-xs">
                {{ formatDate(round.date) }}
                <span v-if="round.expand?.event_round">
                  |
                  {{
                    $customT('rounds.roundNumber', {
                      number: round.expand.event_round.round_number,
                    })
                  }}
                </span>
              </div>
              <div
                v-if="
                  round.player === authStore.user?.id &&
                  (!round.marker || round.marker === '') &&
                  (round.expand?.category?.name === 'Toernooi' ||
                    round.expand?.category?.name === 'Competitie' ||
                    round.expand?.category?.name === 'Skins') &&
                  round.qr_token
                "
                class="q-mt-md"
              >
                <!-- QR-code tonen als de speler nog geen marker heeft, voor Toernooi, Competitie én Skins -->
                <div class="row items-center no-wrap">
                  <div>
                    <!-- QR-code component met unieke token -->
                    <QrcodeVue :value="getQrUrl(round.qr_token)" :size="96" />
                  </div>
                  <div class="q-ml-md" style="min-width: 180px">
                    <div class="text-body2">{{ $customT('rounds.scanQr') }}</div>
                    <div class="text-h6 text-left text-weight-bold q-mt-xs">
                      {{ round.qr_token }}
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
            <q-btn
              v-if="
                !round.is_finalized &&
                !(
                  round.player === authStore.user?.id &&
                  (round.expand?.category?.name === 'Toernooi' ||
                    round.expand?.category?.name === 'Competitie' ||
                    round.expand?.category?.name === 'Skins')
                ) &&
                round.player !== authStore.user?.id
              "
              fab-mini
              color="primary"
              icon="edit"
              @click.stop="viewScores(round.id)"
              style="
                position: absolute;
                bottom: 12px;
                right: 12px;
                z-index: 2;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
              "
              :aria-label="'Score invoeren voor ronde ' + (round.expand?.category?.name || '')"
              size="sm"
            />
          </q-card>
        </div>
      </div>

      <!-- Bericht als er geen rondes zijn -->
      <div v-if="rounds.length === 0" class="text-center q-mt-lg text-grey">
        {{ showArchived ? $customT('rounds.noArchivedRounds') : $customT('rounds.noRounds') }}
      </div>
    </q-pull-to-refresh>

    <!-- Nieuwe ronde dialog vervangen door herbruikbaar component -->
    <PracticeRoundDialog
      v-model="showPracticeDialog"
      :courses="filteredCourses"
      :defaultCourseId="defaultCourseId"
      @round-created="onPracticeRoundCreated"
    />

    <!-- Verwijder bevestiging dialog -->
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">{{ $customT('rounds.deleteRound') }}</div>
        </q-card-section>
        <q-card-section>
          <p>
            {{
              $customT('rounds.deleteRoundConfirm', {
                roundName: selectedRound?.expand?.category?.name || 'Oefenronde',
                courseName: selectedRound?.expand?.course?.name || '',
              })
            }}
          </p>
          <p class="text-caption">{{ $customT('rounds.deleteRoundWarning') }}</p>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$customT('rounds.cancel')" color="primary" v-close-popup />
          <q-btn
            flat
            :label="$customT('rounds.delete')"
            color="negative"
            @click="deleteRound"
            :loading="deleting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue';
import { ref, onMounted, watch, onUnmounted, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'stores/auth';
import { usePocketbase } from 'src/composables/usePocketbase';
import QrcodeVue from 'qrcode.vue';
import PracticeRoundDialog from 'src/components/PracticeRoundDialog.vue';
import { debug } from 'src/utils/debug';
import { formatDateForPocketBase } from 'src/utils/dateUtils';
import { usePracticeRoundDialog } from 'src/composables/usePracticeRoundDialog';

const $q = useQuasar();
const { t: $customT } = useI18n();
const router = useRouter();

const authStore = useAuthStore();
const { pb } = usePocketbase();

const rounds = ref([]);
const courses = ref([]);
const roundTypes = ref([]);
const statusTypes = ref([]);
const loading = ref(false);

const showArchived = ref(false);
const showDeleteDialog = ref(false);
const selectedRound = ref(null);
const deleting = ref(false);

type FooterButton = {
  icon: string;
  label: string;
  badge?: number | undefined;
  badgeColor?: string;
  order?: number;
  onClick: () => void;
};

const footerButtons = inject<Ref<FooterButton[]> | undefined>('footerButtons');

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  // De database heeft formaat "2025-07-17 14:11:33"
  return new Date(dateString).toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Functie om te bepalen of een ronde ouder is dan 2 dagen
const isRoundOlderThanTwoDays = (round) => {
  // De database heeft formaat "2025-07-17 14:11:33"
  const roundDate = new Date(round.date);
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  debug('Debug - Ronde datum:', round.date, 'Parsed:', roundDate);
  debug('Debug - Twee dagen geleden:', twoDaysAgo);
  debug('Debug - Is ouder dan 2 dagen:', roundDate < twoDaysAgo);

  return roundDate < twoDaysAgo;
};

const isRoundInPast = (round) => {
  // De database heeft formaat "2025-07-17 14:11:33"
  const roundDate = new Date(round.date);
  return roundDate < new Date();
};

const updatePastRoundStatus = async (round) => {
  try {
    if (isRoundInPast(round) && round.expand?.status?.name.toLowerCase() !== 'geannuleerd') {
      // Zoek de "Geannuleerd" status
      const statusResult = await pb.collection('categories').getList(1, 1, {
        filter: 'cat_type = "status" && name = "Geannuleerd"',
      });

      if (statusResult.items.length > 0) {
        await pb.collection('rounds').update(round.id, {
          status: statusResult.items[0].id,
        });

        $q.notify({
          color: 'warning',
          message: $customT('rounds.roundAutoCancelled'),
          icon: 'warning',
        });
      }
    }
  } catch (error) {
    console.error('Error updating past round status:', error);
  }
};

const loadData = async () => {
  try {
    // Debug: controleer PocketBase instantie
    console.log('Debug - PocketBase instantie:', pb);
    console.log('Debug - PocketBase collection methode:', typeof pb.collection);

    loading.value = true;

    // Haal eerst de basis data op
    const coursesResult = await pb.collection('courses').getList(1, 50, {
      sort: 'name',
    });
    courses.value = coursesResult.items;

    const roundTypesResult = await pb.collection('categories').getList(1, 50, {
      filter: 'cat_type = "round"',
      sort: 'name',
    });
    roundTypes.value = roundTypesResult.items;

    const statusTypesResult = await pb.collection('categories').getList(1, 50, {
      filter: 'cat_type = "status"',
      sort: 'name',
    });
    statusTypes.value = statusTypesResult.items;

    // Filter op player of marker
    const userId = authStore.user?.id;
    const baseFilter = `(player = "${userId}" || marker = "${userId}")`;

    // OPTIMALISATIE: Paginering en recente ronde filtering
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Haal alle rondes op met recente filter
    const roundsResult = await pb.collection('rounds').getList(1, 50, {
      filter: `${baseFilter} && created >= "${formatDateForPocketBase(sixMonthsAgo)}"`,
      sort: '-date,-time',
      expand: 'course,category,status,event_round,event_round.event,event',
    });

    // Filter client-side op basis van datum
    debug('Debug - Totaal aantal rondes:', roundsResult.items.length);
    debug('Debug - ShowArchived:', showArchived.value);

    if (showArchived.value) {
      // Toon alleen rondes ouder dan 2 dagen, gesorteerd op datum van nieuw naar oud
      rounds.value = roundsResult.items
        .filter(isRoundOlderThanTwoDays)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      debug('Debug - Gearchiveerde rondes:', rounds.value.length);
    } else {
      // Toon alleen rondes van de laatste 2 dagen
      rounds.value = roundsResult.items.filter((round) => !isRoundOlderThanTwoDays(round));
      debug('Debug - Actieve rondes:', rounds.value.length);
    }

    // Debug: log de eerste ronde om te zien wat er in de data zit
    if (rounds.value.length > 0) {
      debug('Debug - Eerste ronde:', rounds.value[0]);
      debug('Debug - Expand object:', rounds.value[0].expand);
      debug('Debug - Event round expand:', rounds.value[0].expand?.event_round);
      debug('Debug - Event round expand:', rounds.value[0].expand?.event_round?.expand?.event);
      debug('Debug - Event field:', rounds.value[0].event);
      debug('Debug - Event round field:', rounds.value[0].event_round);
    }

    // Check en update status voor rondes in het verleden
    if (!showArchived.value) {
      for (const round of rounds.value) {
        await updatePastRoundStatus(round);
      }
    }
  } catch (error) {
    console.error('Error loading data:', error);
    if (!error.isAbort) {
      $q.notify({
        color: 'negative',
        message: $customT('rounds.errorLoad'),
        icon: 'error',
      });
    }
  } finally {
    loading.value = false;
  }
};

const viewRound = (id: string) => {
  void router.push(`/rondes/${id}`);
};

const viewScores = (id: string) => {
  void router.push(`/rondes/${id}/scores`);
};

const handleRoundClick = (round: {
  player: string;
  expand?: { status?: { name?: string } };
  id: string;
  is_finalized?: boolean;
}) => {
  // Als de gebruiker de speler is en de ronde is nog niet afgerond, ga naar score invoer
  if (round.player === authStore.user?.id && !round.is_finalized) {
    viewScores(round.id);
  } else {
    // Anders ga naar de ronde detail pagina
    viewRound(round.id);
  }
};

const updateExpiredRounds = async () => {
  try {
    debug('Start updateExpiredRounds');
    console.log('Debug - PocketBase instantie in updateExpiredRounds:', pb);
    console.log(
      'Debug - PocketBase collection methode in updateExpiredRounds:',
      typeof pb.collection,
    );

    // Haal alle benodigde statussen op
    const [activeStatus, cancelledStatus, completedStatus] = await Promise.all([
      pb.collection('categories').getFirstListItem(`cat_type="status" && name="Actief"`),
      pb.collection('categories').getFirstListItem(`cat_type="status" && name="Geannuleerd"`),
      pb.collection('categories').getFirstListItem(`cat_type="status" && name="Afgerond"`),
    ]);

    if (!activeStatus || !cancelledStatus || !completedStatus) {
      debug('Kon niet alle benodigde statussen vinden');
      return;
    }

    // Format huidige datum als 'YYYY-MM-DD'
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    debug('Huidige datum:', today);

    // Zoek actieve rondes die verlopen zijn
    const filter = `status="${activeStatus.id}" && date < "${today}"`;
    debug('Filter voor verlopen rondes:', filter);

    const expiredRounds = await pb.collection('rounds').getFullList({
      filter,
      expand: 'status,course',
    });

    debug(`${expiredRounds.length} verlopen actieve rondes gevonden`);

    let cancelledCount = 0;
    let completedCount = 0;

    for (const round of expiredRounds) {
      try {
        // Haal alle holes op voor deze ronde
        const scores = await pb.collection('round_scores').getFullList({
          filter: `round="${round.id}"`,
        });

        // Haal het aantal holes op van de baan
        const holes = await pb.collection('course_detail').getFullList({
          filter: `course="${round.expand?.course?.id}"`,
        });

        // Controleer of alle holes een score hebben
        const isComplete = holes.length > 0 && scores.length === holes.length;

        // Update de status op basis van volledigheid
        const newStatus = isComplete ? completedStatus.id : cancelledStatus.id;
        const statusName = isComplete ? 'Afgerond' : 'Geannuleerd';

        debug(`Update status van ronde ${round.id} naar ${statusName}`);
        await pb.collection('rounds').update(round.id, {
          status: newStatus,
        });

        if (isComplete) {
          completedCount++;
        } else {
          cancelledCount++;
        }
      } catch (updateError) {
        debug(`Fout bij het updaten van ronde ${round.id}:`, updateError);
      }
    }

    // Toon meldingen voor beide types updates
    if (completedCount > 0) {
      $q.notify({
        color: 'positive',
        message: $customT('rounds.completedAuto', { count: completedCount }),
        icon: 'check',
      });
    }

    if (cancelledCount > 0) {
      $q.notify({
        color: 'warning',
        message: $customT('rounds.cancelledAuto', { count: cancelledCount }),
        icon: 'update',
      });
    }

    if (completedCount > 0 || cancelledCount > 0) {
      await loadData();
    }
  } catch (error) {
    debug('Fout bij het updaten van verlopen rondes:', error);
  }
};

const onRefresh = async (done: () => void) => {
  try {
    await loadData();
    $q.notify({
      color: 'positive',
      message: $customT('rounds.refresh'),
      icon: 'refresh',
    });
  } catch (error) {
    debug('Error refreshing data:', error);
    $q.notify({
      color: 'negative',
      message: $customT('rounds.errorRefresh'),
      icon: 'error',
    });
  } finally {
    done();
  }
};

const updateFooterButtons = () => {
  if (footerButtons) {
    footerButtons.value = [
      {
        icon: '',
        label: showArchived.value ? $customT('rounds.active') : $customT('rounds.archive'),
        badgeColor: 'secondary',
        order: 0, // In het midden van de footer
        onClick: () => {
          showArchived.value = !showArchived.value;
          void loadData();
        },
      },
    ];
  }
};

// Voeg een watch toe voor showArchived en archivedCount
watch([showArchived], updateFooterButtons, { immediate: true });

const getQrUrl = (qrToken: string) => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/marker-scan?token=${qrToken}`;
  }
  return '';
};

// Functie om te bepalen of een ronde verwijderd kan worden
const canDeleteRound = (round) => {
  // Alleen oefenrondes van de huidige gebruiker kunnen verwijderd worden
  return (
    round.player === authStore.user?.id &&
    round.expand?.category?.name === 'Oefenronde' &&
    !round.is_finalized
  );
};

// Functie om de delete dialog te openen
const confirmDeleteRound = (round) => {
  selectedRound.value = round;
  showDeleteDialog.value = true;
};

// Functie om de ronde daadwerkelijk te verwijderen
const deleteRound = async () => {
  if (!selectedRound.value) return;

  try {
    deleting.value = true;

    // Verwijder eerst alle scores van deze ronde
    const scores = await pb.collection('round_scores').getFullList({
      filter: `round="${selectedRound.value.id}"`,
    });

    for (const score of scores) {
      await pb.collection('round_scores').delete(score.id);
    }

    // Verwijder de ronde zelf
    await pb.collection('rounds').delete(selectedRound.value.id);

    $q.notify({
      color: 'positive',
      message: $customT('rounds.roundDeleted'),
      icon: 'check',
    });

    showDeleteDialog.value = false;
    selectedRound.value = null;

    // Herlaad de data
    await loadData();
  } catch (error) {
    debug('Error deleting round:', error);
    $q.notify({
      color: 'negative',
      message: $customT('rounds.deleteError'),
      icon: 'error',
    });
  } finally {
    deleting.value = false;
  }
};

// Gebruik de centrale composable voor oefenronde-dialog
const {
  showPracticeDialog,
  filteredCourses,
  defaultCourseId,
  openPracticeRoundDialog,
  onPracticeRoundCreated,
} = usePracticeRoundDialog();

onMounted(async () => {
  await loadData();
  await updateExpiredRounds();
  updateFooterButtons();
});

onUnmounted(() => {
  if (footerButtons) {
    footerButtons.value = []; // Reset de footer buttons
  }
});
</script>

<style lang="scss">
.round-card {
  transition: all 0.2s ease-in-out;
  border: 1px solid rgba(0, 0, 0, 0.12);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
}

// Verminder de spacing tussen de cards
.q-col-gutter-md > .col-12 {
  padding-top: 4px;
  padding-bottom: 4px;
}

.status-chip {
  font-size: 11px;
  padding: 2px 6px;
  height: 20px;
  min-height: unset;
}
</style>
