import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import { usePocketbase } from 'src/composables/usePocketbase';
import { debug } from 'src/utils/debug';

// Types voor leaderboard data
export interface LeaderboardPlayer {
  userId: string;
  name: string;
  categoryLetter: string;
  thru: number;
  vsPar: number;
  status: 'active' | 'finished';
  lastUpdate: string;
}

export interface LeaderboardState {
  current: {
    eventId: string | null;
    currentUserId: string | null;
  };
  rowsByUserId: Record<string, LeaderboardPlayer>;
  sortedUserIds: string[];
  ui: {
    scope: 'event' | 'category';
    view: 'compact' | 'all';
    expanded: boolean;
  };
  subscriptions: {
    scores?: () => void;
    rounds?: () => void;
  };
  isLive: boolean;
  eventRounds: string[]; // Lijst van round IDs voor dit event
}

export const useLeaderboardStore = defineStore('leaderboard', () => {
  // State
  const state = ref<LeaderboardState>({
    current: {
      eventId: null,
      currentUserId: null,
    },
    rowsByUserId: {},
    sortedUserIds: [],
    ui: {
      scope: 'category',
      view: 'compact',
      expanded: true, // Standaard uitgeklapt (live) bij aanmaken van ronde
    },
    subscriptions: {},
    isLive: false,
    eventRounds: [],
  });

  const { pb } = usePocketbase();

  // Getters
  const fullList = computed(() => {
    const scope = state.value.ui.scope;
    const currentUserId = state.value.current.currentUserId;

    console.log('fullList computed - scope:', scope, 'currentUserId:', currentUserId);
    console.log('sortedUserIds:', state.value.sortedUserIds);
    console.log('rowsByUserId:', state.value.rowsByUserId);
    console.log('fullList computed called at:', new Date().toISOString());

    // Return lege array als er geen data is
    if (!currentUserId || !state.value.sortedUserIds.length || !state.value.rowsByUserId) {
      console.log('fullList: no currentUserId, no sortedUserIds, or no rowsByUserId');
      return [];
    }

    // Filter op scope
    let filteredUserIds = state.value.sortedUserIds;
    if (scope === 'category') {
      const currentUserCategory = state.value.rowsByUserId[currentUserId]?.categoryLetter;
      console.log('Category filtering - currentUserCategory:', currentUserCategory);
      if (currentUserCategory) {
        filteredUserIds = state.value.sortedUserIds.filter(
          (userId) => state.value.rowsByUserId[userId]?.categoryLetter === currentUserCategory,
        );
        console.log('Filtered user IDs for category:', filteredUserIds);
      }
    }

    const result = filteredUserIds
      .map((userId) => state.value.rowsByUserId[userId])
      .filter(Boolean);
    console.log('fullList result:', result);
    return result;
  });

  const compactList = computed(() => {
    const L = fullList.value;
    if (L.length === 0) return [];

    // Als er 10 of minder spelers zijn, toon ze allemaal
    if (L.length <= 10) {
      console.log('compactList: showing all players (<=10)', L.length);
      return L;
    }

    const currentUserId = state.value.current.currentUserId;
    if (!currentUserId) return L.slice(0, 10);

    // Algoritme voor compacte slice (max 10 regels) - alleen als er meer dan 10 spelers zijn
    const top3 = L.slice(0, 3);
    const playerIndex = L.findIndex((player) => player.userId === currentUserId);

    if (playerIndex === -1) return top3.slice(0, 10);

    // Neem 3 boven en 3 onder de speler
    const above = L.slice(Math.max(0, playerIndex - 3), playerIndex);
    const below = L.slice(playerIndex + 1, playerIndex + 4);
    const currentPlayer = L[playerIndex];

    // Combineer met prioriteit: [speler] + top3 + 3 boven + 3 onder
    const priority = [currentPlayer, ...top3, ...above, ...below];

    // Verwijder duplicaten en behoud volgorde
    const unique = priority.filter(
      (player, index, arr) => arr.findIndex((p) => p.userId === player.userId) === index,
    );

    // Vul tot 10 met extra spelers
    if (unique.length < 10) {
      const remaining = L.filter((player) => !unique.some((u) => u.userId === player.userId));
      const needed = 10 - unique.length;

      // Voeg symmetrisch toe: eerst onderliggende, dan bovenliggende
      const belowExtra = remaining.slice(0, Math.ceil(needed / 2));
      const aboveExtra = remaining.slice(-Math.floor(needed / 2));

      unique.push(...belowExtra, ...aboveExtra);
    }

    console.log('compactList: showing compact view (>10 players)', unique.length);
    return unique.slice(0, 10);
  });

  const positionMap = computed(() => {
    const L = fullList.value;
    const positions: Record<string, string> = {};

    console.log('positionMap computed - fullList:', L);
    console.log('positionMap computed called at:', new Date().toISOString());

    // Return lege object als er geen data is
    if (!L || !Array.isArray(L) || L.length === 0) {
      console.log('positionMap: no valid list, returning empty positions');
      return positions;
    }

    let currentPosition = 1;
    let currentThru = -1;
    let currentVsPar = -1;

    for (let i = 0; i < L.length; i++) {
      const player = L[i];

      // Check voor tie (Thru én vsPar gelijk)
      if (i > 0 && player.thru === currentThru && player.vsPar === currentVsPar) {
        // Tie: gebruik T-prefix
        positions[player.userId] = `T${currentPosition}`;
        console.log(`Tie detected for ${player.name}: T${currentPosition}`);
      } else {
        // Geen tie: nieuwe positie
        currentPosition = i + 1;
        positions[player.userId] = currentPosition > 71 ? 'T71' : currentPosition.toString();
        console.log(`Position for ${player.name}: ${positions[player.userId]}`);
      }

      currentThru = player.thru;
      currentVsPar = player.vsPar;
    }

    console.log('Final positions:', positions);
    return positions;
  });

  const currentPlayerRow = computed(() => {
    const currentUserId = state.value.current.currentUserId;
    if (!currentUserId) return null;
    return state.value.rowsByUserId[currentUserId] || null;
  });

  // Actions
  const init = async (eventId: string, currentUserId: string) => {
    debug('Leaderboard: Initializing for event', eventId, 'user', currentUserId);

    state.value.current.eventId = eventId;
    state.value.current.currentUserId = currentUserId;

    // Zet leaderboard standaard op uitgeklapt (live)
    state.value.ui.expanded = true;

    try {
      // Haal alle rondes van dit event op
      const roundsResult = await pb.collection('rounds').getList(1, 200, {
        filter: `event = "${eventId}"`,
        expand: 'player,player.category',
      });

      state.value.eventRounds = roundsResult.items.map((round) => round.id);
      debug('Leaderboard: Found rounds for event', state.value.eventRounds);

      // Preload users en rondes voor dit event
      await buildLeaderboardData();

      // Start realtime subscription omdat leaderboard standaard live is
      await startRealtimeSubscription();
    } catch (error) {
      debug('Leaderboard: Error during init', error);
      throw error;
    }
  };

  const buildLeaderboardData = async () => {
    if (!state.value.current.eventId || state.value.eventRounds.length === 0) {
      debug('Leaderboard: No event or rounds to build data from');
      return;
    }

    try {
      // Haal alle scores op voor alle rondes van dit event
      const scoresResult = await pb.collection('round_scores').getList(1, 1000, {
        filter: state.value.eventRounds.map((roundId) => `round = "${roundId}"`).join(' || '),
        expand: 'round,round.player,round.player.category',
      });

      debug('Leaderboard: Loaded scores', scoresResult.items.length);

      // Groepeer scores per speler
      const playerStats: Record<
        string,
        {
          name: string;
          categoryLetter: string;
          scores: number[];
          status: 'active' | 'finished';
          lastUpdate: string;
        }
      > = {};

      for (const score of scoresResult.items) {
        const round = score.expand?.round;
        if (!round || !round.expand?.player) continue;

        const player = round.expand.player;
        const userId = player.id;
        const playerName = player.name || 'Onbekend';
        const category = player.expand?.category?.name || player.category || 'A';
        const categoryLetter = category.charAt(0).toLowerCase();

        if (!playerStats[userId]) {
          playerStats[userId] = {
            name: playerName,
            categoryLetter,
            scores: [],
            status: round.status === 'finished' ? 'finished' : 'active',
            lastUpdate: score.updated || score.created,
          };
        }

        // Voeg score toe als het een geldige score is
        if (score.score_player && score.score_player > 0) {
          playerStats[userId].scores.push(score.score_player);
        }

        // Update lastUpdate als deze score nieuwer is
        const scoreTime = score.updated || score.created;
        if (scoreTime && scoreTime > playerStats[userId].lastUpdate) {
          playerStats[userId].lastUpdate = scoreTime;
        }
      }

      // Converteer naar LeaderboardPlayer format
      const newRowsByUserId: Record<string, LeaderboardPlayer> = {};

      for (const [userId, stats] of Object.entries(playerStats)) {
        const thru = stats.scores.length;
        const vsPar = stats.scores.reduce((sum, score) => sum + (score - 3), 0); // Par = 3

        newRowsByUserId[userId] = {
          userId,
          name: stats.name,
          categoryLetter: stats.categoryLetter,
          thru,
          vsPar,
          status: stats.status,
          lastUpdate: stats.lastUpdate,
        };
      }

      // Zorg ervoor dat de state correct wordt geïnitialiseerd
      state.value.rowsByUserId = newRowsByUserId;

      // Sorteer spelers: Thru (desc), vsPar (asc), naam (asc)
      state.value.sortedUserIds = Object.keys(newRowsByUserId).sort((a, b) => {
        const playerA = newRowsByUserId[a];
        const playerB = newRowsByUserId[b];

        // 1. Thru (desc: meeste holes eerst)
        if (playerA.thru !== playerB.thru) {
          return playerB.thru - playerA.thru;
        }

        // 2. vsPar (asc: laagste eerst)
        if (playerA.vsPar !== playerB.vsPar) {
          return playerA.vsPar - playerB.vsPar;
        }

        // 3. Naam (asc: voor stabiele volgorde)
        return playerA.name.localeCompare(playerB.name);
      });

      debug('Leaderboard: Built data for', Object.keys(newRowsByUserId).length, 'players');
      console.log('Built player data:', newRowsByUserId);
      console.log('Sorted user IDs:', state.value.sortedUserIds);
      console.log('State after build:', {
        rowsByUserId: Object.keys(state.value.rowsByUserId).length,
        sortedUserIds: state.value.sortedUserIds.length,
        currentUserId: state.value.current.currentUserId,
      });
    } catch (error) {
      debug('Leaderboard: Error building data', error);
      throw error;
    }
  };

  const expand = async () => {
    debug('Leaderboard: Expanding');
    state.value.ui.expanded = true;

    try {
      // Eerst één snapshot (frisse stand)
      await buildLeaderboardData();
      debug('Leaderboard: Data built successfully, fullList should now be available');

      // Start realtime subscription
      await startRealtimeSubscription();
    } catch (error) {
      debug('Leaderboard: Error during expand', error);
      throw error;
    }
  };

  const collapse = () => {
    debug('Leaderboard: Collapsing');
    state.value.ui.expanded = false;

    // Behoud realtime subscriptions voor live updates, ook als widget is ingeklapt
    // stopRealtimeSubscription(); // Verwijderd: live updates moeten blijven werken
  };

  const startRealtimeSubscription = async () => {
    if (!state.value.current.eventId || state.value.eventRounds.length === 0) {
      debug('Leaderboard: Cannot start subscription - no event or rounds');
      return;
    }

    try {
      // Subscribe op round_scores voor alle rondes van dit event
      const scoresUnsub = pb.collection('round_scores').subscribe('*', (e) => {
        debug('Leaderboard: Score update received', e);

        // Check of deze score bij een van onze event rondes hoort
        const roundId = e.record.round;
        if (state.value.eventRounds.includes(roundId)) {
          // Rebuild leaderboard data
          buildLeaderboardData().catch((error) => {
            debug('Leaderboard: Error rebuilding after score update', error);
          });
        }
      });

      // Optioneel: subscribe op rounds voor status updates
      const roundsUnsub = pb.collection('rounds').subscribe('*', (e) => {
        debug('Leaderboard: Round update received', e);

        // Check of deze ronde bij ons event hoort
        if (e.record.event === state.value.current.eventId) {
          // Rebuild leaderboard data
          buildLeaderboardData().catch((error) => {
            debug('Leaderboard: Error rebuilding after round update', error);
          });
        }
      });

      state.value.subscriptions.scores = scoresUnsub;
      state.value.subscriptions.rounds = roundsUnsub;
      state.value.isLive = true;

      debug('Leaderboard: Realtime subscriptions started');
    } catch (error) {
      debug('Leaderboard: Error starting subscriptions', error);
      state.value.isLive = false;
    }
  };

  const stopRealtimeSubscription = () => {
    debug('Leaderboard: Stopping subscriptions');

    if (
      state.value.subscriptions.scores &&
      typeof state.value.subscriptions.scores === 'function'
    ) {
      state.value.subscriptions.scores();
      state.value.subscriptions.scores = undefined;
    }

    if (
      state.value.subscriptions.rounds &&
      typeof state.value.subscriptions.rounds === 'function'
    ) {
      state.value.subscriptions.rounds();
      state.value.subscriptions.rounds = undefined;
    }

    state.value.isLive = false;
  };

  const setScope = (scope: 'event' | 'category') => {
    state.value.ui.scope = scope;
  };

  const setView = (view: 'compact' | 'all') => {
    state.value.ui.view = view;
  };

  const applyScoreDelta = (scoreRecord: any) => {
    // O(1) update voor realtime performance
    // Dit wordt aangeroepen bij score updates
    debug('Leaderboard: Applying score delta', scoreRecord);

    // Rebuild data (kan geoptimaliseerd worden met debouncing)
    buildLeaderboardData().catch((error) => {
      debug('Leaderboard: Error applying score delta', error);
    });
  };

  const reset = () => {
    debug('Leaderboard: Resetting store');

    try {
      stopRealtimeSubscription();
    } catch (error) {
      debug('Leaderboard: Error during stopRealtimeSubscription in reset', error);
    }

    state.value = {
      current: {
        eventId: null,
        currentUserId: null,
      },
      rowsByUserId: {},
      sortedUserIds: [],
      ui: {
        scope: 'category',
        view: 'compact',
        expanded: true, // Standaard uitgeklapt (live) bij reset
      },
      subscriptions: {},
      isLive: false,
      eventRounds: [],
    };
  };

  return {
    // State
    state: readonly(state),

    // Getters
    fullList,
    compactList,
    positionMap,
    currentPlayerRow,

    // Actions
    init,
    expand,
    collapse,
    setScope,
    setView,
    applyScoreDelta,
    reset,
  };
});
