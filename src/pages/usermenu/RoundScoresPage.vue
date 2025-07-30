<template>
  <!-- Hoofdpagina voor het invoeren en ondertekenen van scores -->
  <div class="q-pa-md">
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h5">
        <!-- Dynamische titel op basis van ronde type -->
        <template v-if="isEventRound">
          {{ $customT('scores.enterScoresFor', { eventName: getEventName(round) }) }}
        </template>
        <template v-else-if="isPracticeRound">
          {{ $customT('scores.practiceRoundScores') }}
        </template>
        <template v-else> {{ $customT('scores.enterScores') }} </template>
      </div>
    </div>
    <q-page padding>
      <!-- Pull-to-refresh voor handmatig verversen -->
      <q-pull-to-refresh @refresh="onRefresh">
        <div v-if="loading" class="row justify-center">
          <q-spinner color="primary" size="3em" />
        </div>
        <div v-else-if="round" class="q-gutter-md">
          <!-- QR-code tonen als marker nog niet gekoppeld is, maar NIET bij oefenrondes of event rondes -->
          <div
            v-if="!isPracticeRound && !isEventRound && !round.marker"
            class="q-mb-md flex flex-center column items-center"
          >
            <div class="text-h6 q-mb-sm">{{ $customT('scores.scanQrCode') }}</div>
            <canvas
              ref="qrCanvas"
              width="160"
              height="160"
              style="border-radius: 8px; background: white"
            />
            <div class="text-caption q-mt-sm">
              {{ $customT('scores.token') }}: {{ round.qr_token }}
            </div>
          </div>
          <!-- Overzicht van speler, marker en scores -->
          <div class="row items-center q-mb-md">
            <div class="col-12 text-center">
              <div class="text-h5" v-if="isPracticeRound">
                {{ $customT('scores.practiceRound') }}
              </div>
              <div class="text-subtitle2 q-mt-xs" v-if="isPracticeRound">
                {{ round.expand?.course?.name || '-' }}
              </div>
              <div class="text-subtitle2 q-mt-xs" v-if="!isPracticeRound && !isEventRound">
                {{ $customT('scores.round') }} {{ round.expand?.event_round?.round_number || '-' }}
              </div>
              <div class="q-mt-md text-left">
                <!-- Speler scoreoverzicht blijft altijd zichtbaar -->
                <div class="q-mb-sm">
                  <div class="row items-center justify-between">
                    <div>
                      <span
                        class="text-h6 cursor-pointer"
                        @click="showPlayerScores = !showPlayerScores"
                        :aria-pressed="showPlayerScores"
                      >
                        {{ round.expand?.player?.name || '-' }}
                      </span>
                    </div>
                    <div class="text-h6 text-grey-8" v-if="totalScorePlayer !== null">
                      {{ totalScorePlayer >= 0 ? '+' : '' }}{{ totalScorePlayer }}
                    </div>
                  </div>
                  <!-- Compacte scoreweergave speler -->
                  <div v-if="holes.length > 0 && showPlayerScores" class="q-mt-sm">
                    <!-- Holenummers 1 t/m 9 -->
                    <div class="row items-center no-wrap q-mb-xs">
                      <div
                        v-for="hole in holes.slice(0, 9)"
                        :key="'hn1-' + hole.id"
                        class="col text-center text-caption text-weight-medium"
                      >
                        {{ hole.hole }}
                      </div>
                    </div>
                    <!-- Scores 1 t/m 9 -->
                    <div class="row items-center no-wrap q-mb-md">
                      <div
                        v-for="hole in holes.slice(0, 9)"
                        :key="'sc1-' + hole.id"
                        class="col text-center text-body1"
                        :style="getScoreColorStyle(getPlayerScoreForHole(hole.id))"
                      >
                        {{ getPlayerScoreForHole(hole.id) }}
                      </div>
                    </div>
                    <!-- Scores 10 t/m 18 -->
                    <div class="row items-center no-wrap q-mb-xs">
                      <div
                        v-for="hole in holes.slice(9, 18)"
                        :key="'sc2-' + hole.id"
                        class="col text-center text-body1"
                        :style="getScoreColorStyle(getPlayerScoreForHole(hole.id))"
                      >
                        {{ getPlayerScoreForHole(hole.id) }}
                      </div>
                    </div>
                    <!-- Holenummers 10 t/m 18 -->
                    <div class="row items-center no-wrap">
                      <div
                        v-for="hole in holes.slice(9, 18)"
                        :key="'hn2-' + hole.id"
                        class="col text-center text-caption text-weight-medium"
                      >
                        {{ hole.hole }}
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Marker scoreoverzicht alleen tonen als het GEEN oefenronde is EN GEEN event ronde -->
                <div v-if="!isPracticeRound && !isEventRound">
                  <!-- BEGIN marker-overzicht (verborgen bij oefenronde) -->
                  <div class="row items-center justify-between">
                    <div>
                      <span
                        class="text-caption text-weight-medium cursor-pointer"
                        @click="showMarkerScores = !showMarkerScores"
                        :aria-pressed="showMarkerScores"
                      >
                        {{ $customT('rounds.marker') }}
                      </span>
                    </div>
                    <div class="text-h6 text-grey-8" v-if="totalScoreMarker !== null">
                      {{ totalScoreMarker >= 0 ? '+' : '' }}{{ totalScoreMarker }}
                    </div>
                  </div>
                  <!-- Compacte scoreweergave marker -->
                  <div v-if="holes.length > 0 && showMarkerScores" class="q-mt-sm">
                    <!-- Holenummers 1 t/m 9 marker -->
                    <div class="row items-center no-wrap q-mb-xs">
                      <div
                        v-for="hole in holes.slice(0, 9)"
                        :key="'mhn1-' + hole.id"
                        class="col text-center text-caption text-weight-medium"
                      >
                        {{ hole.hole }}
                      </div>
                    </div>
                    <!-- Scores 1 t/m 9 marker -->
                    <div class="row items-center no-wrap q-mb-md">
                      <div
                        v-for="hole in holes.slice(0, 9)"
                        :key="'msc1-' + hole.id"
                        class="col text-center text-body1"
                        :style="getScoreColorStyle(getMarkerScoreForHole(hole.id))"
                      >
                        {{ getMarkerScoreForHole(hole.id) }}
                      </div>
                    </div>
                    <!-- Scores 10 t/m 18 marker -->
                    <div class="row items-center no-wrap q-mb-xs">
                      <div
                        v-for="hole in holes.slice(9, 18)"
                        :key="'msc2-' + hole.id"
                        class="col text-center text-body1"
                        :style="getScoreColorStyle(getMarkerScoreForHole(hole.id))"
                      >
                        {{ getMarkerScoreForHole(hole.id) }}
                      </div>
                    </div>
                    <!-- Holenummers 10 t/m 18 marker -->
                    <div class="row items-center no-wrap">
                      <div
                        v-for="hole in holes.slice(9, 18)"
                        :key="'mhn2-' + hole.id"
                        class="col text-center text-caption text-weight-medium"
                      >
                        {{ hole.hole }}
                      </div>
                    </div>
                  </div>
                  <!-- EINDE marker-overzicht -->
                </div>
              </div>
            </div>
          </div>
          <!-- Buttons voor score-invoer per hole -->
          <q-card>
            <q-card-section>
              <div class="row q-col-gutter-md">
                <div v-for="hole in holes" :key="hole.id" class="col-2">
                  <q-btn
                    :color="
                      isScoreDisputed(hole.id)
                        ? 'negative'
                        : isHoleBlue(hole.id)
                          ? 'primary'
                          : 'grey'
                    "
                    class="full-width"
                    @click="openScoreDialog(hole)"
                    style="height: 50px"
                    :disable="isReadOnly"
                  >
                    <div class="text-h6">{{ hole.hole }}</div>
                  </q-btn>
                </div>
              </div>
            </q-card-section>
          </q-card>
          <div
            class="row q-mt-md score-overview-actions-row"
            style="width: 100%"
            v-if="
              (isPracticeRound && !isReadOnly && canFinishPracticeRound) ||
              (isEventRound && !isReadOnly && canFinishEventRound)
            "
          >
            <div class="row q-gutter-sm q-mt-none q-mb-none score-overview-actions-between">
              <div class="col-auto">
                <q-btn
                  flat
                  color="negative"
                  :label="$customT('scores.noReturn')"
                  @click="isPracticeRound ? (cancelDialog = true) : (cancelEventDialog = true)"
                />
              </div>
              <div class="col text-right">
                <q-btn
                  color="positive"
                  :label="$customT('scores.saveRound')"
                  @click="isPracticeRound ? finishPracticeRound() : finishEventRound()"
                  class="finalize-save-btn"
                />
              </div>
            </div>
          </div>
          <!-- Back knop onder de acties -->
          <div class="row q-mt-sm justify-end">
            <q-btn color="primary" :label="$customT('navigation.back')" @click="router.back()" />
          </div>
          <!-- Popup voor bevestiging annuleren oefenronde -->
          <q-dialog v-model="cancelDialog">
            <q-card style="min-width: 350px">
              <q-card-section>
                <div class="text-h6">{{ $customT('scores.cancelPracticeRound') }}</div>
              </q-card-section>
              <q-card-section>
                {{ $customT('scores.confirmCancelPracticeRound') }}<br />
                <b>{{ $customT('scores.note') }}:</b
                >{{ $customT('scores.roundAndScoresWillBeDeleted') }}
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat :label="$customT('scores.cancel')" color="grey" v-close-popup />
                <q-btn
                  flat
                  :label="$customT('scores.deleteRound')"
                  color="negative"
                  @click="handleCancelPracticeRound"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>

          <!-- Popup voor bevestiging annuleren event ronde -->
          <q-dialog v-model="cancelEventDialog">
            <q-card style="min-width: 350px">
              <q-card-section>
                <div class="text-h6">{{ $customT('scores.cancelEventRound') }}</div>
              </q-card-section>
              <q-card-section>
                {{ $customT('scores.confirmCancelEventRound') }}<br />
                <b>{{ $customT('scores.note') }}:</b
                >{{ $customT('scores.roundAndScoresWillBeDeleted') }}
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat :label="$customT('scores.cancel')" color="grey" v-close-popup />
                <q-btn
                  flat
                  :label="$customT('scores.deleteRound')"
                  color="negative"
                  @click="handleCancelEventRound"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>
          <!-- Ondertekenen knop, alleen zichtbaar als alles akkoord is en niet read-only -->
          <div class="row q-mt-md justify-end" v-if="!isReadOnly && canSignOff">
            <q-btn color="positive" :label="$customT('scores.sign')" @click="signDialog = true" />
          </div>
          <!-- Tussenstand event -->
          <div v-if="eventStandings.length > 0" class="q-mt-xl">
            <div class="text-h6 q-mb-sm cursor-pointer" @click="showStandings = !showStandings">
              {{ $customT('scores.standings') }}
              <q-icon :name="showStandings ? 'expand_less' : 'expand_more'" class="q-ml-xs" />
            </div>
            <div v-show="showStandings">
              <div
                class="q-table__container q-table--flat q-table--dense bg-grey-1"
                style="max-width: 500px"
              >
                <table class="q-table">
                  <thead>
                    <tr>
                      <th class="text-left">#</th>
                      <th class="text-left">Naam</th>
                      <th class="text-center">Na</th>
                      <th class="text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in markerStandingsSlice"
                      :key="row.id"
                      :class="{ 'bg-primary text-white': row.id === markerId }"
                    >
                      <td class="text-left">{{ row.rank }}</td>
                      <td class="text-left">{{ row.name }}</td>
                      <td class="text-center">{{ row.holesPlayed }}</td>
                      <td class="text-right">{{ row.score >= 0 ? '+' : '' }}{{ row.score }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <!-- Skins tussenstand, alleen zichtbaar bij Skins-rondes -->
          <div v-if="isSkinsRound && skinsStandings.length > 0" class="q-mt-xl">
            <!-- Skins tussenstand uitleg -->
            <div class="text-h6 q-mb-sm">{{ $customT('scores.skinsStandings') }}</div>
            <div
              class="q-table__container q-table--flat q-table--dense bg-grey-1"
              style="max-width: 500px"
            >
              <table class="q-table">
                <thead>
                  <tr>
                    <th class="text-left">Naam</th>
                    <th class="text-right">Saldo (€)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="row in skinsStandings"
                    :key="row.id"
                    :class="{ 'bg-primary text-white': row.id === markerId }"
                  >
                    <td class="text-left">{{ row.name }}</td>
                    <td class="text-right">
                      <span
                        :class="{
                          'text-negative': row.saldo < 0,
                          'text-positive': row.saldo > 0,
                        }"
                      >
                        {{ row.saldo.toFixed(2) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div v-else class="text-center">
          <div class="text-h6">{{ $customT('scores.roundNotFound') }}</div>
          <q-btn flat color="primary" :label="$customT('scores.back')" @click="router.back()" />
        </div>
      </q-pull-to-refresh>
      <!-- Score dialog, alleen als niet read-only -->
      <q-dialog v-model="scoreDialog" v-if="!isReadOnly">
        <q-card style="min-width: 350px">
          <q-card-section>
            <div class="text-h6">{{ $customT('scores.hole') }} {{ selectedHole?.hole }}</div>
            <div class="text-subtitle2">{{ $customT('scores.par') }} {{ selectedHole?.par }}</div>
            <div class="text-subtitle2">
              {{ $customT('scores.distance') }}: {{ selectedHole?.hole_length }}m
            </div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-form @submit="saveScore" class="q-gutter-md">
              <q-input
                v-model.number="scoreForm.score_player"
                type="number"
                inputmode="numeric"
                pattern="[0-9]*"
                :label="
                  $customT('scores.playerScore') +
                  (scorePlayerError ? $customT('scores.disputed') : '') +
                  ' (' +
                  (round.expand?.player?.name || '-') +
                  ')'
                "
                filled
                :color="scorePlayerError ? 'negative' : undefined"
                :class="scorePlayerError ? 'q-input--disputed' : ''"
              />
              <q-input
                v-if="!isPracticeRound && !isEventRound"
                v-model.number="scoreForm.score_marker"
                type="number"
                inputmode="numeric"
                pattern="[0-9]*"
                :label="
                  $customT('scores.markerScore') +
                  (scoreMarkerError ? $customT('scores.disputed') : '') +
                  ' (' +
                  (round.expand?.marker?.name || '-') +
                  ')'
                "
                filled
                :color="scoreMarkerError ? 'negative' : undefined"
                :class="scoreMarkerError ? 'q-input--disputed' : ''"
              />
              <q-input
                v-model="scoreForm.note"
                :label="$customT('scores.note')"
                type="textarea"
                autogrow
                filled
              />
              <div class="row justify-between q-mt-md">
                <q-btn flat :label="$customT('scores.cancel')" color="grey" v-close-popup />
                <q-btn
                  type="submit"
                  color="primary"
                  :label="isUpdate ? $customT('scores.update') : $customT('scores.save')"
                  :loading="saving[selectedHole?.id]"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>
      <!-- Ondertekenen dialog -->
      <q-dialog v-model="signDialog">
        <q-card style="min-width: 350px">
          <q-card-section>
            <div class="text-h6">{{ $customT('scores.signRound') }}</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div class="row items-center q-mb-md">
              <div class="col">{{ $customT('scores.signPlayerScore') }}</div>
              <div class="col-auto">
                <q-select
                  v-model="signPlayerOption"
                  :options="[$customT('scores.yes'), $customT('scores.no')]"
                  dense
                  outlined
                  style="min-width: 110px"
                />
              </div>
            </div>
            <div class="row items-center">
              <div class="col">{{ $customT('scores.signMarkerScore') }}</div>
              <div class="col-auto">
                <q-select
                  v-model="signMarkerOption"
                  :options="[
                    $customT('scores.yes'),
                    $customT('scores.noDQ'),
                    $customT('scores.noNR'),
                    $customT('scores.noDNF'),
                  ]"
                  dense
                  outlined
                  style="min-width: 140px"
                />
              </div>
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat :label="$customT('scores.cancel')" color="grey" v-close-popup />
            <q-btn color="positive" :label="$customT('scores.confirm')" @click="handleSignOff" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-page>
  </div>

  <!-- Nieuw: finalize dialog -->
  <q-dialog v-model="finalizeDialog">
    <q-card style="min-width: 400px" class="q-pa-lg">
      <q-card-section>
        <div class="text-h6">{{ $customT('scores.finalizeTitle') }}</div>
      </q-card-section>
      <q-card-section>
        <div class="q-mb-md">{{ $customT('scores.finalizeCheck') }}</div>
        <div class="row items-center no-wrap q-mb-xs">
          <div
            v-for="hole in holes"
            :key="'sum-hn-' + hole.id"
            class="col text-center text-caption text-weight-medium"
          >
            {{ hole.hole }}
          </div>
        </div>
        <div class="row items-center no-wrap q-mb-md">
          <div
            v-for="hole in holes"
            :key="'sum-sc-' + hole.id"
            class="col text-center text-body1"
            :style="getScoreColorStyle(getPlayerScoreForHole(hole.id))"
          >
            {{ getPlayerScoreForHole(hole.id) }}
          </div>
        </div>
        <div class="text-h6 q-mt-md">
          {{ $customT('scores.finalizeTotal') }} {{ totalScorePlayer >= 0 ? '+' : ''
          }}{{ totalScorePlayer }}
        </div>
      </q-card-section>
      <q-card-actions class="q-gutter-sm finalize-actions-row" align="between">
        <q-btn
          flat
          color="negative"
          :label="$customT('scores.noReturn')"
          @click="finalizeDialog = false"
        />
        <q-btn
          flat
          color="primary"
          :label="$customT('scores.adjustScore')"
          @click="finalizeDialog = false"
        />
        <q-btn
          color="positive"
          :label="$customT('scores.saveRound')"
          @click="finalizeRound"
          class="finalize-save-btn"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
// -----------------------------
// Imports en initialisatie
// -----------------------------
// Importeer Vue, Quasar, router, PocketBase en eigen stores/composables
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { usePocketbase } from 'src/composables/usePocketbase';
import { useAuthStore } from 'stores/auth';
import { useRoundsStore } from 'stores/rounds';
import { getScoreColor } from 'src/constants/scoreColors';
import { debug } from 'src/utils/debug';
import { useI18n } from 'vue-i18n';

// Initialiseer router, Quasar, PocketBase en authenticatie-store
const route = useRoute();
const router = useRouter();
const $q = useQuasar();
const pb = usePocketbase();
const authStore = useAuthStore();
const roundsStore = useRoundsStore();
const { t: $customT } = useI18n(); // Centrale store voor rondes

// -----------------------------
// Type-definities
// -----------------------------
// User: basisinformatie van een gebruiker
// Round: een ronde met expand-velden voor relaties
// Hole: een hole op de baan
// RoundScore: score per hole per ronde

type User = { id: string; name: string };
type Round = {
  id: string;
  player: string;
  marker: string;
  event?: string;
  expand?: {
    player?: User;
    marker?: User;
    event_round?: { expand?: { event?: { id: string } }; round_number?: number };
    event?: { id: string; name: string };
    category?: { name: string };
    status?: { id: string; name: string };
    course?: { name?: string };
  };
  [key: string]: unknown;
};
type Hole = { id: string; hole: number; par: number; hole_length: number };
type RoundScore = {
  id: string;
  round: string;
  hole: string;
  score_player?: number;
  score_marker?: number;
  note?: string;
};

// -----------------------------
// Reactieve variabelen en state
// -----------------------------
// Hoofddata voor de pagina
const round = ref<Round | null>(null); // De huidige ronde
const holes = ref<Hole[]>([]); // Alle holes van de baan
const loading = ref(true); // Laadstatus voor spinner
const scoreDialog = ref(false); // Of het score-invoerscherm open is
const selectedHole = ref<Hole | null>(null); // Geselecteerde hole voor invoer
const saving = ref<{ [holeId: string]: boolean }>({}); // Loading-status per hole
const scoreForm = ref({
  score_player: null, // Ingevoerde score speler
  score_marker: null, // Ingevoerde score marker
  note: '', // Eventuele notitie
});

// Bepalen of het een oefenronde is (geen marker nodig)
const isPracticeRound = computed(() => {
  // Controleer of de ronde-categorie 'oefenronde' is
  return round.value?.expand?.category?.name?.toLowerCase() === 'oefenronde';
});

// Bepalen of het een event ronde is (heeft event_id)
const isEventRound = computed(() => {
  return !!round.value?.event;
});

// Opslag voor scores van marker en speler per hole (voor snelle lookup)
const markerRecords = ref<Record<string, RoundScore>>({});
const playerRecords = ref<Record<string, RoundScore>>({});
const allScores = ref<RoundScore[]>([]); // Alle scores van alle rondes in het event
const allRounds = ref<Round[]>([]); // Alle rondes in het event

// UI-state voor toggles en dialogs
const showPlayerScores = ref(false); // Toggle voor speler-scoreoverzicht
const showMarkerScores = ref(false); // Toggle voor marker-scoreoverzicht
const showStandings = ref(false); // Toggle voor tussenstand
const signDialog = ref(false); // Of het onderteken-dialog open is
const signPlayerOption = ref('Ja'); // Keuze speler bij ondertekenen
const signMarkerOption = ref('Ja'); // Keuze marker bij ondertekenen
const cancelDialog = ref(false);
const cancelEventDialog = ref(false);
const finalizeDialog = ref(false); // Nieuw: dialog voor afronden

// -----------------------------
// Computed properties en helpers
// -----------------------------
// Huidige event_round-id bepalen voor filtering
const currentEventRoundId = computed(() => {
  // Haal het juiste event_round-id op uit expand of fallback
  const er = round.value?.expand?.event_round;
  return er && typeof er === 'object' && 'id' in er
    ? (er as { id: string }).id
    : round.value?.event_round || null;
});

// Zoek de ronde van een speler binnen het huidige event_round
function findPlayerRound(playerId: string) {
  if (isPracticeRound.value) {
    // Zoek oefenronde van deze speler op deze baan, datum en categorie
    return allRounds.value.find(
      (r) =>
        r.player === playerId &&
        r.course === round.value?.course &&
        r.date === round.value?.date &&
        r.category === round.value?.category,
    );
  } else if (isEventRound.value) {
    // Voor event rondes: zoek ronde van deze speler met hetzelfde event
    return allRounds.value.find((r) => r.player === playerId && r.event === round.value?.event);
  } else {
    // Zoek eventronde
    return allRounds.value.find(
      (r) => r.player === playerId && r.event_round === currentEventRoundId.value,
    );
  }
}
// Zoek de ronde van een marker binnen het huidige event_round of oefenronde
function findMarkerRound(markerId: string) {
  if (isPracticeRound.value) {
    // Zoek oefenronde van deze marker op deze baan, datum en categorie
    return allRounds.value.find(
      (r) =>
        r.marker === markerId &&
        r.course === round.value?.course &&
        r.date === round.value?.date &&
        r.category === round.value?.category,
    );
  } else {
    // Zoek eventronde
    return allRounds.value.find(
      (r) => r.marker === markerId && r.event_round === currentEventRoundId.value,
    );
  }
}

// Functies om scores van marker/speler te vergelijken tussen verschillende records
function getScoreMarkerForScorePlayerCheck(
  holeId: string,
  currentRound: Round,
  allRounds: Round[],
  allScores: RoundScore[],
): number | undefined {
  // Zoek de ronde waar de marker de speler is
  const sPlayer = currentRound.player;
  const markerRound = allRounds.find(
    (r) => r.marker === sPlayer && r.event_round === currentEventRoundId.value,
  );
  if (!markerRound) return undefined;
  const scoreRec = allScores.find((s) => s.round === markerRound.id && s.hole === String(holeId));
  return scoreRec?.score_marker;
}
function getScorePlayerForScoreMarkerCheck(
  holeId: string,
  userId: string,
  allRounds: Round[],
  allScores: RoundScore[],
): number | undefined {
  // Zoek de ronde waar de speler de user is
  const playerRound = allRounds.find(
    (r) => r.player === userId && r.event_round === currentEventRoundId.value,
  );
  if (!playerRound) return undefined;
  const scoreRec = allScores.find((s) => s.round === playerRound.id && s.hole === String(holeId));
  return scoreRec?.score_player;
}

// Controleer of er een afwijking is tussen speler- en markerscore voor een hole
const isScoreDisputed = (holeId: string) => {
  // Vergelijk scores van speler en marker uit verschillende records
  const myUserId = authStore.user?.id;
  const currentRound = allRounds.value.find((r) => r.marker === myUserId);
  if (!currentRound) return false;
  const myScoreRec = allScores.value.find(
    (s) => s.round === currentRound.id && s.hole === String(holeId),
  );
  if (!myScoreRec) return false;
  const scoreMarker = getScoreMarkerForScorePlayerCheck(
    holeId,
    currentRound,
    allRounds.value,
    allScores.value,
  );
  if (
    myScoreRec.score_player !== undefined &&
    scoreMarker !== undefined &&
    myScoreRec.score_player !== scoreMarker
  )
    return true;
  const scorePlayer = getScorePlayerForScoreMarkerCheck(
    holeId,
    myUserId,
    allRounds.value,
    allScores.value,
  );
  if (
    myScoreRec.score_marker !== undefined &&
    scorePlayer !== undefined &&
    myScoreRec.score_marker !== scorePlayer
  )
    return true;
  return false;
};

// Open het score-invoerscherm voor een specifieke hole
const openScoreDialog = (hole: Hole) => {
  // Vul het formulier met bestaande score (indien aanwezig)
  selectedHole.value = hole;
  const myRecord = allScores.value.find(
    (s) => s.round === route.params.id && s.hole === String(hole.id),
  );
  scoreForm.value = {
    score_player: myRecord?.score_player ?? null,
    score_marker: myRecord?.score_marker ?? null,
    note: myRecord?.note ?? '',
  };
  scoreDialog.value = true;
};

// Bepaal of het een update of create is voor de score
const isUpdate = computed(() => {
  if (!selectedHole.value) return false;
  const holeId = selectedHole.value.id;
  if (authStore.user?.id === round.value?.expand?.marker?.id) {
    return !!markerRecords.value[holeId]?.id;
  } else if (authStore.user?.id === round.value?.expand?.player?.id) {
    return !!playerRecords.value[holeId]?.id;
  }
  return false;
});

// Computed voor afwijkingen in score-invoer (voor visuele feedback)
const scorePlayerError = computed(() => {
  // Geeft true als de speler-score afwijkt van de marker-score
  const myUserId = authStore.user?.id;
  const currentRound = allRounds.value.find((r) => r.marker === myUserId);
  if (!currentRound || !selectedHole.value) return false;
  const myScoreRec = allScores.value.find(
    (s) => s.round === currentRound.id && s.hole === String(selectedHole.value.id),
  );
  if (!myScoreRec) return false;
  const scoreMarker = getScoreMarkerForScorePlayerCheck(
    String(selectedHole.value.id),
    currentRound,
    allRounds.value,
    allScores.value,
  );
  return (
    myScoreRec.score_player !== undefined &&
    scoreMarker !== undefined &&
    myScoreRec.score_player !== scoreMarker
  );
});

const scoreMarkerError = computed(() => {
  // Geeft true als de marker-score afwijkt van de speler-score
  const myUserId = authStore.user?.id;
  const currentRound = allRounds.value.find((r) => r.marker === myUserId);
  if (!currentRound || !selectedHole.value) return false;
  const myScoreRec = allScores.value.find(
    (s) => s.round === currentRound.id && s.hole === String(selectedHole.value.id),
  );
  if (!myScoreRec) return false;
  const scorePlayer = getScorePlayerForScoreMarkerCheck(
    String(selectedHole.value.id),
    myUserId,
    allRounds.value,
    allScores.value,
  );
  return (
    myScoreRec.score_marker !== undefined &&
    scorePlayer !== undefined &&
    myScoreRec.score_marker !== scorePlayer
  );
});

// Totale score van speler berekenen (t.o.v. par)
const totalScorePlayer = computed(() => {
  // Som van alle scores van de speler in deze ronde
  if (!round.value?.expand?.player?.id || holes.value.length === 0) return null;
  const spelerRound = findPlayerRound(round.value.expand.player.id);
  if (!spelerRound) return null;
  const scores = allScores.value.filter(
    (s) => s.round === spelerRound.id && s.score_player != null,
  );
  if (scores.length === 0) return null;
  return scores.reduce(
    (sum, s) => sum + ((typeof s.score_player === 'number' ? s.score_player : 3) - 3),
    0,
  );
});

// Totale score van marker berekenen (t.o.v. par)
const totalScoreMarker = computed(() => {
  // Som van alle scores van de marker in deze ronde
  if (!round.value?.expand?.marker?.id || holes.value.length === 0) return null;
  const markerRound = findMarkerRound(round.value.expand.marker.id);
  if (!markerRound) return null;
  const scores = allScores.value.filter(
    (s) => s.round === markerRound.id && s.score_marker != null,
  );
  if (scores.length === 0) return null;
  return scores.reduce(
    (sum, s) => sum + ((typeof s.score_marker === 'number' ? s.score_marker : 3) - 3),
    0,
  );
});

// Haal de score van de speler op voor een specifieke hole
const getPlayerScoreForHole = (holeId: string) => {
  if (!round.value?.expand?.player?.id) return '-';
  const spelerRound = findPlayerRound(round.value.expand.player.id);
  if (!spelerRound) return '-';
  const scoreRec = allScores.value.find((s) => s.round === spelerRound.id && s.hole === holeId);
  return scoreRec?.score_player ?? '-';
};

// Haal de score van de marker op voor een specifieke hole
const getMarkerScoreForHole = (holeId: string) => {
  if (!round.value?.expand?.marker?.id) return '-';
  const markerRound = findMarkerRound(round.value.expand.marker.id);
  if (!markerRound) return '-';
  const scoreRec = allScores.value.find((s) => s.round === markerRound.id && s.hole === holeId);
  return scoreRec?.score_marker ?? '-';
};

// Bepaal de kleur van een score (voor visuele feedback)
const getScoreColorStyle = (score: string | number) => {
  // Geeft een achtergrondkleur afhankelijk van de score

  const num = parseInt(score as string);
  if (!score || isNaN(num)) return {};
  const color = getScoreColor(num);
  return color ? { backgroundColor: color } : {};
};

// Detectie of het een Skins-ronde is
const isSkinsRound = computed(() => {
  return round.value?.expand?.category?.name?.toLowerCase() === 'skins';
});

// Skins tussenstand berekenen
const skinsStandings = computed(() => {
  if (!isSkinsRound.value || holes.value.length === 0 || allRounds.value.length === 0) return [];
  // Verzamel alle spelers in deze flight
  const playerIds = [...new Set(allRounds.value.map((r) => r.player))];
  // Initialiseer saldo en pot-tracking
  const saldo: Record<string, number> = {};
  playerIds.forEach((pid) => {
    saldo[pid] = 0;
  });
  let pot = 0;
  // Per hole de inleg en potverdeling verwerken
  holes.value.forEach((hole) => {
    // Verzamel scores van alle spelers voor deze hole
    const scores = playerIds.map((pid) => {
      const round = allRounds.value.find((r) => r.player === pid);
      const scoreRec = allScores.value.find(
        (s) => s.round === round?.id && s.hole === String(hole.id),
      );
      return {
        pid,
        score: typeof scoreRec?.score_player === 'number' ? scoreRec.score_player : null,
      };
    });
    // Bepaal inleg per speler
    scores.forEach(({ pid, score }) => {
      if (score !== null) {
        saldo[pid] -= 0.2; // standaard inleg
        if (score > 3) saldo[pid] -= 0.2; // extra inleg bij score > 3
        pot += 0.2;
        if (score > 3) pot += 0.2;
      }
    });
    // Bepaal laagste score (alleen als iedereen een score heeft)
    if (scores.every((s) => s.score !== null)) {
      const minScore = Math.min(...scores.map((s) => s.score));
      const winnaars = scores.filter((s) => s.score === minScore);
      if (winnaars.length === 1) {
        // Pot gaat naar de enige winnaar
        saldo[winnaars[0].pid] += pot;
        pot = 0;
      }
      // Bij meerdere winnaars blijft pot staan
    }
  });
  // Maak een array met naam en saldo
  const arr = playerIds.map((pid) => {
    const naam = allRounds.value.find((r) => r.player === pid)?.expand?.player?.name || '-';
    return { id: pid, name: naam, saldo: saldo[pid] };
  });
  // Sorteer van hoog naar laag saldo
  arr.sort((a, b) => b.saldo - a.saldo);
  return arr;
});

// -----------------------------
// Data ophalen en opslaan
// -----------------------------
// Laad alle benodigde data voor deze pagina (rondes, holes, scores)
const loadData = async () => {
  // Haal alle relevante data op uit PocketBase
  try {
    loading.value = true;
    // Haal de huidige ronde op
    const roundResult = await pb.collection('rounds').getOne(route.params.id as string, {
      expand: 'player,marker,course,status,category,event_round,event_round.event,event',
    });
    round.value = roundResult as unknown as Round;
    // Bepaal het eventId voor filtering
    let eventId = roundResult.expand?.event_round?.expand?.event?.id;
    if (!eventId && roundResult.expand?.event_round?.event) {
      eventId = roundResult.expand.event_round.event;
    }
    // Voor directe event rondes
    const directEventId = roundResult.event;

    let roundsFilter = '';
    // Speciaal filter voor oefenrondes: alle rondes van deze speler op deze baan en datum
    if (isPracticeRound.value) {
      // Filter nu ook op category (oefenronde)
      roundsFilter = `player = "${roundResult.player}" && course = "${roundResult.course}" && date = "${roundResult.date}" && category = "${roundResult.category}"`;
    } else if (eventId) {
      // Voor event_round rondes (oude systeem)
      roundsFilter = `event_round.event = "${String(eventId)}"`;
    } else if (directEventId) {
      // Voor directe event rondes (nieuwe systeem)
      roundsFilter = `event = "${String(directEventId)}"`;
    } else {
      roundsFilter = `id = "${String(route.params.id)}"`;
    }
    // Haal alle rondes van het event op
    const roundsResult = await pb.collection('rounds').getList(1, 200, {
      filter: roundsFilter,
      expand: 'player,event_round,event_round.event,event',
    });
    allRounds.value = roundsResult.items as unknown as Round[];
    // Haal alle holes van de baan op
    const holesResult = await pb.collection('course_detail').getList(1, 50, {
      filter: `course = "${roundResult.course}"`,
      sort: 'hole',
    });
    holes.value = holesResult.items as unknown as Hole[];
    // Haal alle scores op voor alle rondes
    const roundIds = allRounds.value.map((r) => r.id);
    let allScoresList: RoundScore[] = [];
    for (let i = 0; i < roundIds.length; i += 50) {
      const batchIds = roundIds.slice(i, i + 50);
      const filter = batchIds.map((id) => `round = "${id}"`).join(' || ');
      const scoresResult = await pb.collection('round_scores').getList(1, 200, {
        filter,
        expand: 'hole',
      });
      allScoresList = allScoresList.concat(scoresResult.items as unknown as RoundScore[]);
    }
    allScores.value = allScoresList;
    // Vul markerRecords en playerRecords voor snelle lookup
    markerRecords.value = {};
    playerRecords.value = {};
    holes.value.forEach((hole) => {
      const markerRec = allScores.value.find(
        (s) => s.hole === String(hole.id) && s.score_player != null,
      );
      if (markerRec) markerRecords.value[String(hole.id)] = markerRec;
      const playerRec = allScores.value.find(
        (s) => s.hole === String(hole.id) && s.score_marker != null,
      );
      if (playerRec) playerRecords.value[String(hole.id)] = playerRec;
    });
  } catch {
    $q.notify({
      color: 'negative',
      message: $customT('notifications.loadDataError'),
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
};

// Sla een score op (nieuw of update), zet status op 'Actief'
const saveScore = async () => {
  // Sla de score op voor de geselecteerde hole
  if (!selectedHole.value) return;
  const holeId = selectedHole.value.id;
  if (isReadOnly.value) {
    $q.notify({
      color: 'negative',
      message: $customT('notifications.roundFinalizedError'),
      icon: 'lock',
    });
    saving.value[String(holeId)] = false;
    return;
  }
  saving.value[String(holeId)] = true;
  try {
    if (!isPracticeRound.value && !isEventRound.value) {
      // Alleen voor event_round rondes: beide scores verplicht
      if (
        scoreForm.value.score_player == null ||
        scoreForm.value.score_marker == null ||
        scoreForm.value.score_player === '' ||
        scoreForm.value.score_marker === ''
      ) {
        $q.notify({
          color: 'negative',
          message: $customT('notifications.fillBothScores'),
          icon: 'error',
        });
        saving.value[String(holeId)] = false;
        return;
      }
    } else if (isEventRound.value) {
      // Voor event rondes: alleen speler score verplicht
      if (scoreForm.value.score_player == null || scoreForm.value.score_player === '') {
        $q.notify({
          color: 'negative',
          message: $customT('notifications.fillPlayerScore'),
          icon: 'error',
        });
        saving.value[String(holeId)] = false;
        return;
      }
    }
    const myRecord = allScores.value.find(
      (s) => s.round === route.params.id && s.hole === String(holeId),
    );
    const scoreData = {
      round: route.params.id,
      hole: String(holeId),
      score_player: scoreForm.value.score_player,
      score_marker: scoreForm.value.score_marker,
      note: scoreForm.value.note,
      created_by: authStore.user?.id,
    };
    let result;
    if (myRecord && myRecord.id) {
      result = await pb.collection('round_scores').update(myRecord.id, scoreData);
      await pb.collection('rounds').update(String(route.params.id), { status: '0n8l4fpvwt05y6k' });
      debug('Score update (gebruiker):', result);
    } else {
      result = await pb.collection('round_scores').create(scoreData);
      await pb.collection('rounds').update(String(route.params.id), { status: '0n8l4fpvwt05y6k' });
      debug('Score create (gebruiker):', result);
    }
    await loadData();
    $q.notify({
      color: 'positive',
      message: $customT('notifications.scoreSaved'),
      icon: 'check',
    });
    scoreDialog.value = false;
    // Nieuw: check of alle scores nu ingevuld zijn
    if (allScoresEntered() && !isReadOnly.value) {
      finalizeDialog.value = true;
    }
  } catch {
    $q.notify({
      color: 'negative',
      message: $customT('notifications.saveScoreError'),
      icon: 'error',
    });
  } finally {
    saving.value[String(holeId)] = false;
  }
};

// Pull-to-refresh functionaliteit
const onRefresh = async (done: () => void) => {
  // Herlaad alle data en geef feedback
  try {
    await loadData();
    $q.notify({
      color: 'positive',
      message: $customT('notifications.dataUpdated'),
      icon: 'refresh',
    });
  } catch {
    $q.notify({
      color: 'negative',
      message: $customT('notifications.refreshDataError'),
      icon: 'error',
    });
  } finally {
    done();
  }
};

// -----------------------------
// Lifecycle: bij laden van de pagina
// -----------------------------
onMounted(async () => {
  await loadData();
  // Debug: vergelijk scores voor de eerste 3 holes
  for (let i = 0; i < 3 && i < holes.value.length; i++) {
    const holeId = holes.value[i].id;
    const myUserId = authStore.user?.id;
    const myRound = allRounds.value.find((r) => r.player === myUserId);
    const markerRound = allRounds.value.find((r) => r.marker === myUserId);
    const markerId = round.value?.expand?.marker?.id;
    const scoreMarkerValue = markerId ? getScoreMarkerForPlayer(holeId, markerId) : undefined;
    const scorePlayerValue = markerRound
      ? allScores.value.find((s) => s.round === markerRound?.id && s.hole === String(holeId))
          ?.score_player
      : undefined;
    const checkScorePlayer = scoreMarkerValue !== scorePlayerValue;
    debug.log(`[DEBUG] Hole ${i + 1} check:`);
    debug.log('score_player (markerScoreRec.score_player):', scorePlayerValue);
    debug.log('score_marker (getScoreMarkerForPlayer):', scoreMarkerValue);
    debug.log('score_marker !== score_player:', checkScorePlayer);
    const scorePlayerValue2 = myRound
      ? allScores.value.find((s) => s.round === myRound?.id && s.hole === String(holeId))
          ?.score_player
      : undefined;
    const scoreMarkerValue2 = markerRound
      ? allScores.value.find((s) => s.round === markerRound?.id && s.hole === String(holeId))
          ?.score_marker
      : undefined;
    const checkScoreMarker = scorePlayerValue2 !== scoreMarkerValue2;
    debug.log('score_player (myScoreRec.score_player):', scorePlayerValue2);
    debug.log('score_marker (markerScoreRec.score_marker):', scoreMarkerValue2);
    debug.log('score_player !== score_marker:', checkScoreMarker);
    debug.log('getScoreMarkerForPlayer:', scoreMarkerValue);
  }
});

// -----------------------------
// Standings en visuele helpers
// -----------------------------
// Bepaal de tussenstand van het event (voor standings)
const eventStandings = computed(() => {
  // Genereer een array met de tussenstand van alle spelers in het event

  // Voor event_round rondes (oude systeem)
  const er = round.value?.expand?.event_round;
  const eventRoundId =
    er && typeof er === 'object' && 'id' in er ? (er as { id: string }).id : null;

  // Voor directe event rondes (nieuwe systeem)
  const directEventId = round.value?.event;

  let eventId: string | null = null;
  let eventRounds: Round[] = [];

  if (eventRoundId && round.value?.expand?.event_round?.expand?.event?.id) {
    // Oude systeem: via event_round
    eventId = round.value.expand.event_round.expand.event.id;
    eventRounds = allRounds.value.filter((r) => {
      const rEr = r.expand?.event_round;
      const rEventRoundId =
        rEr && typeof rEr === 'object' && 'id' in rEr ? (rEr as { id: string }).id : null;
      return rEventRoundId === eventRoundId && r.expand?.event_round?.expand?.event?.id === eventId;
    });
  } else if (directEventId) {
    // Nieuwe systeem: directe event rondes
    eventId = directEventId;
    eventRounds = allRounds.value.filter((r) => r.event === directEventId);
  }

  if (!eventId || !eventRounds.length) return [];

  // Gebruik een Set om unieke speler-IDs te krijgen uit de eventRounds
  const playerIds = [...new Set(eventRounds.map((r) => r.player))];
  const standings = playerIds.map((pid) => {
    const playerRounds = eventRounds.filter((r) => r.player === pid);
    const roundIds = playerRounds.map((r) => r.id);
    const scores = allScores.value.filter(
      (s) => roundIds.includes(s.round) && s.score_player != null,
    );
    const total = scores.reduce(
      (sum, s) => sum + ((typeof s.score_player === 'number' ? s.score_player : 3) - 3),
      0,
    );
    const name = playerRounds[0]?.expand?.player?.name || '-';
    return {
      id: pid,
      name,
      score: total,
      holesPlayed: scores.length,
    };
  });
  standings.sort((a, b) => a.score - b.score);
  return standings.map((row, idx) => ({ ...row, rank: idx + 1 }));
});

// Marker-id voor highlighten in standings (gebruik speler ID voor event rondes)
const markerId = computed(() => {
  if (isEventRound.value) {
    // Voor event rondes: gebruik de speler ID
    return round.value?.player || null;
  } else {
    // Voor andere rondes: gebruik de marker ID
    return round.value?.expand?.marker?.id || null;
  }
});

// Slice van standings rondom de marker/speler
const markerStandingsSlice = computed(() => {
  // Toon alleen de bovenste en relevante regels rondom de marker/speler
  if (!markerId.value) return eventStandings.value.slice(0, 5); // Toon top 5 als geen marker/speler
  const standings = eventStandings.value;
  const idx = standings.findIndex((row) => row.id === markerId.value);
  if (idx === -1) return standings.slice(0, 5); // Toon top 5 als speler niet gevonden
  const slice = [standings[0]];
  const start = Math.max(1, idx - 2);
  const end = Math.min(standings.length, idx + 3);
  for (let i = start; i < end; i++) {
    if (i !== 0) slice.push(standings[i]);
  }
  return slice;
});

// Bepaal of de knop voor een hole blauw moet zijn (score ingevuld)
const isHoleBlue = (holeId: string) => {
  // Controleer of er een score is ingevuld voor deze hole in deze ronde
  return allScores.value.some(
    (s) => s.hole === String(holeId) && s.round === round.value.id && s.score_player != null,
  );
};

// Haal de eventnaam op uit de expand van de ronde
function getEventName(round: Round | null): string {
  // Voor event rondes (met direct event_id)
  if (round?.event) {
    const eventObj = round?.expand?.event;
    if (eventObj && typeof (eventObj as { name?: unknown }).name === 'string') {
      return (eventObj as unknown as { name: string }).name;
    }
  }

  // Voor event_round rondes (via event_round relatie)
  const eventObj = round?.expand?.event_round?.expand?.event;
  if (eventObj && typeof (eventObj as { name?: unknown }).name === 'string') {
    return (eventObj as unknown as { name: string }).name;
  }

  return 'Event onbekend';
}

// Haal de markerscore op voor een speler (voor vergelijking)
function getScoreMarkerForPlayer(holeId: string, markerId: string): number | undefined {
  // Zoek de score_marker van een marker voor een bepaalde hole
  const roundWithMarker = allRounds.value.find((r) => r.marker === markerId);
  if (!roundWithMarker) return undefined;
  const scoreRec = allScores.value.find(
    (s) => s.round === roundWithMarker?.id && s.hole === String(holeId),
  );
  return scoreRec?.score_marker;
}

// -----------------------------
// Ondertekenen en statusbeheer
// -----------------------------
// Controle of ondertekenen mogelijk is (alle scores ingevuld, geen afwijkingen)
const canSignOff = computed(() => {
  // Alleen mogelijk als alle scores zijn ingevuld en geen afwijkingen zijn
  if (!holes.value.length) return false;
  for (const hole of holes.value) {
    const spelerScore = getPlayerScoreForHole(hole.id);
    const markerScore = getMarkerScoreForHole(hole.id);
    if (spelerScore === '-' || markerScore === '-') return false;
    if (isScoreDisputed(hole.id)) return false;
  }
  return true;
});

// --- Ondertekenlogica: status en signed_by bijwerken, evt. override-reden opslaan ---
const handleSignOff = async () => {
  // Verwerk ondertekening en update status/signed_by
  signDialog.value = false;
  const userId = authStore.user?.id;
  if (!userId) throw new Error('Geen gebruiker gevonden');
  const roundsToUpdate = allRounds.value.filter(
    (r) =>
      (r.player === userId || r.marker === userId) && r.event_round === currentEventRoundId.value,
  );
  if (!roundsToUpdate.length) {
    $q.notify({
      color: 'negative',
      message: $customT('notifications.noRelatedRounds'),
      icon: 'error',
    });
    return;
  }
  // Marker kiest "Nee - ...": reden opslaan in score_override, user toevoegen aan signed_by
  if (signMarkerOption.value.startsWith('Nee - ')) {
    const reden = signMarkerOption.value.replace('Nee - ', '').trim();
    const playerRound = roundsToUpdate.find((r) => r.player === userId);
    if (playerRound) {
      if (signPlayerOption.value === 'Ja' || signMarkerOption.value.startsWith('Nee - ')) {
        const currentSignedBy = Array.isArray(playerRound.signed_by) ? playerRound.signed_by : [];
        const newSignedBy = currentSignedBy.includes(userId)
          ? currentSignedBy
          : [...currentSignedBy, userId];
        const isAfgerond = newSignedBy.length >= 2;
        const updated = await pb.collection('rounds').update(playerRound.id, {
          score_override: reden,
          signed_by: newSignedBy,
          ...(isAfgerond ? { status: '9hi1lv607ibh7kz' } : {}),
        });
        // Update de ronde in de centrale store
        roundsStore.updateRound(updated);
      } else {
        const updated = await pb
          .collection('rounds')
          .update(playerRound.id, { score_override: reden });
        roundsStore.updateRound(updated);
      }
    }
    if (signPlayerOption.value === 'Ja') {
      const markerRound = roundsToUpdate.find((r) => r.marker === userId);
      if (markerRound) {
        const currentSignedBy = Array.isArray(markerRound.signed_by) ? markerRound.signed_by : [];
        const newSignedBy = currentSignedBy.includes(userId)
          ? currentSignedBy
          : [...currentSignedBy, userId];
        const isAfgerond = newSignedBy.length >= 2;
        const updated = await pb.collection('rounds').update(markerRound.id, {
          signed_by: newSignedBy,
          ...(isAfgerond ? { status: '9hi1lv607ibh7kz' } : {}),
        });
        roundsStore.updateRound(updated);
      }
    }
    $q.notify({
      color: 'info',
      message: $customT('notifications.scoreOverrideRegistered') + ': ' + reden,
      icon: 'info',
    });
    await loadData();
    void router.push('/mijn-rondes');
    return;
  }
  // Beide akkoord: beide rondes ondertekenen, status afronden indien beide ondertekend
  if (signPlayerOption.value === 'Ja' && signMarkerOption.value === 'Ja') {
    try {
      for (const r of roundsToUpdate) {
        const currentSignedBy = Array.isArray(r.signed_by) ? r.signed_by : [];
        const newSignedBy = currentSignedBy.includes(userId)
          ? currentSignedBy
          : [...currentSignedBy, userId];
        const isAfgerond = newSignedBy.length >= 2;
        const updated = await pb.collection('rounds').update(r.id, {
          signed_by: newSignedBy,
          ...(isAfgerond ? { status: '9hi1lv607ibh7kz' } : {}),
        });
        roundsStore.updateRound(updated);
      }
      $q.notify({
        color: 'positive',
        message: $customT('notifications.roundSigned'),
        icon: 'check',
      });
      await loadData();
      void router.push('/mijn-rondes');
    } catch (e) {
      $q.notify({
        color: 'negative',
        message: 'Fout bij ondertekenen: ' + (e?.message || e),
        icon: 'error',
      });
    }
  } else {
    $q.notify({
      color: 'info',
      message: $customT('notifications.signCancelled'),
      icon: 'info',
    });
  }
};

// Pagina is read-only als de ronde is afgerond (is_finalized === true)
const isReadOnly = computed(() => round.value?.is_finalized === true);

// --- Computed property: kan oefenronde worden afgesloten? ---
const canFinishPracticeRound = computed(() => {
  if (!isPracticeRound.value || !holes.value.length) return false;
  const playerRound = findPlayerRound(authStore.user?.id);
  if (!playerRound) return false;
  // Controleer of voor alle holes een score_player is ingevuld
  return holes.value.every((hole) =>
    allScores.value.some(
      (s) => s.round === playerRound.id && s.hole === String(hole.id) && s.score_player != null,
    ),
  );
});

// --- Computed property: kan event ronde worden afgesloten? ---
const canFinishEventRound = computed(() => {
  if (!isEventRound.value || !holes.value.length) return false;
  // Controleer of voor alle holes een score_player is ingevuld in de huidige ronde
  return holes.value.every((hole) =>
    allScores.value.some(
      (s) => s.round === round.value.id && s.hole === String(hole.id) && s.score_player != null,
    ),
  );
});

// --- Functie om oefenronde af te sluiten ---
const finishPracticeRound = async () => {
  try {
    // Zet de ronde op afgerond: is_active = false, is_finalized = true
    const updated = await pb
      .collection('rounds')
      .update(round.value.id, { is_active: false, is_finalized: true });
    $q.notify({
      color: 'positive',
      message: $customT('notifications.roundFinalized'),
      icon: 'check',
    });
    roundsStore.updateRound(updated);
    await loadData();
  } catch {
    debug('Fout bij afsluiten ronde');
    $q.notify({
      color: 'negative',
      message: $customT('notifications.finalizeRoundError'),
      icon: 'error',
    });
  }
};

// --- Functie om event ronde af te sluiten ---
const finishEventRound = async () => {
  try {
    // Zet de ronde op afgerond: is_active = false, is_finalized = true
    const updated = await pb
      .collection('rounds')
      .update(round.value.id, { is_active: false, is_finalized: true });
    $q.notify({
      color: 'positive',
      message: $customT('notifications.eventRoundFinalized'),
      icon: 'check',
    });
    roundsStore.updateRound(updated);
    await loadData();
  } catch {
    debug('Fout bij afsluiten event ronde');
    $q.notify({
      color: 'negative',
      message: $customT('notifications.finalizeEventRoundError'),
      icon: 'error',
    });
  }
};

// Functie om oefenronde en scores te verwijderen
async function handleCancelPracticeRound() {
  try {
    // Alleen de ronde verwijderen; PocketBase verwijdert automatisch alle gekoppelde scores (cascade delete)
    await pb.collection('rounds').delete(round.value.id);
    $q.notify({
      color: 'positive',
      message: $customT('notifications.practiceRoundDeleted'),
      icon: 'check',
    });
    void router.push('/mijn-rondes');
  } catch {
    $q.notify({ color: 'negative', message: $customT('notifications.deleteError'), icon: 'error' });
  } finally {
    cancelDialog.value = false;
  }
}

// Functie om event ronde en scores te verwijderen
async function handleCancelEventRound() {
  try {
    // Alleen de ronde verwijderen; PocketBase verwijdert automatisch alle gekoppelde scores (cascade delete)
    await pb.collection('rounds').delete(round.value.id);
    $q.notify({
      color: 'positive',
      message: $customT('notifications.eventRoundDeleted'),
      icon: 'check',
    });
    void router.push('/mijn-rondes');
  } catch {
    $q.notify({ color: 'negative', message: $customT('notifications.deleteError'), icon: 'error' });
  } finally {
    cancelEventDialog.value = false;
  }
}

// Helper: check of alle scores zijn ingevuld
function allScoresEntered() {
  if (!holes.value.length) return false;
  return holes.value.every((hole) => {
    const score = allScores.value.find(
      (s) => s.hole === String(hole.id) && s.round === round.value?.id,
    );
    return score && score.score_player != null;
  });
}

// Nieuw: functie om ronde te finaliseren
async function finalizeRound() {
  try {
    const updated = await pb
      .collection('rounds')
      .update(round.value.id, { is_active: false, is_finalized: true });
    $q.notify({
      color: 'positive',
      message: $customT('notifications.roundFinalized'),
      icon: 'check',
    });
    roundsStore.updateRound(updated);
    finalizeDialog.value = false;
    await loadData();
  } catch {
    $q.notify({
      color: 'negative',
      message: $customT('notifications.finalizeRoundError'),
      icon: 'error',
    });
  }
}

const qrCanvas = ref<HTMLCanvasElement | null>(null);

// Helper: eenvoudige QR-code generator (alleen hoofdletters/cijfers, geen externe lib)
function drawSimpleQrCode(canvas: HTMLCanvasElement, text: string) {
  // Placeholder: teken het token als grote tekst in het midden
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#222';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

// QR-code tekenen als marker nog niet gekoppeld is
watch(
  () => round.value?.qr_token,
  (token) => {
    if (qrCanvas.value && token && !round.value?.marker) {
      drawSimpleQrCode(
        qrCanvas.value,
        typeof token === 'string' || typeof token === 'number' ? String(token) : '',
      );
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.q-input--disputed .q-field__control {
  border: 2px solid #e53935 !important;
  background: #ffebee !important;
}
/* Zelfde responsive styling als finalize popup */
.score-overview-actions-row {
  width: 100%;
}
.finalize-actions-row {
  flex-wrap: wrap;
}
.finalize-save-btn {
  min-width: 80px;
  font-size: 0.95em;
  white-space: nowrap;
}
@media (max-width: 400px) {
  .finalize-actions-row {
    flex-direction: column;
    align-items: stretch;
  }
  .finalize-save-btn {
    width: 100%;
    margin-top: 8px;
  }
}
.no-return-link {
  color: #e53935;
  cursor: pointer;
  font-weight: 500;
  font-size: 1em;
  text-decoration: underline;
  margin-right: 16px;
  align-self: center;
}
@media (max-width: 400px) {
  .score-overview-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .no-return-link {
    margin-right: 0;
    margin-bottom: 8px;
    display: block;
    text-align: left;
  }
}
.score-overview-actions-between {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0;
  margin-bottom: 0;
}
</style>
