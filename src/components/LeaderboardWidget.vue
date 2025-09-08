<template>
  <!-- Compacte leaderboard widget voor score-invoer pagina -->
  <div class="leaderboard-widget">
    <!-- Titel met toggle en status badge -->
    <div
      class="leaderboard-title"
      @click="toggleExpanded"
      role="button"
      :aria-expanded="store.state.ui.expanded"
      :aria-controls="'leaderboard-table'"
      tabindex="0"
      @keydown.enter="toggleExpanded"
      @keydown.space.prevent="toggleExpanded"
    >
      <div class="title-content">
        <span class="title-text">{{ $customT('leaderboard.title') }}</span>
        <q-badge
          :color="store.state.isLive ? 'positive' : 'grey-5'"
          :label="
            store.state.isLive ? $customT('leaderboard.live') : $customT('leaderboard.notLive')
          "
          class="status-badge"
        />
      </div>
      <q-icon :name="store.state.ui.expanded ? 'expand_less' : 'expand_more'" class="expand-icon" />
    </div>

    <!-- Tabel container (alleen zichtbaar wanneer uitgeklapt) -->
    <div v-if="store.state.ui.expanded" class="leaderboard-table-container" id="leaderboard-table">
      <!-- Toggles boven de tabel -->
      <div class="leaderboard-toggles">
        <div class="toggle-row">
          <!-- Scope toggle: Category vs All -->
          <div class="custom-toggle">
            <q-btn
              :color="store.state.ui.scope === 'category' ? 'primary' : 'grey-5'"
              :text-color="store.state.ui.scope === 'category' ? 'white' : 'dark'"
              :label="$customT('leaderboard.scopeCategory')"
              @click="store.setScope('category')"
              dense
              size="sm"
              class="toggle-btn"
            />
            <q-btn
              :color="store.state.ui.scope === 'event' ? 'primary' : 'grey-5'"
              :text-color="store.state.ui.scope === 'event' ? 'white' : 'dark'"
              :label="$customT('leaderboard.viewAll')"
              @click="store.setScope('event')"
              dense
              size="sm"
              class="toggle-btn"
            />
          </div>

          <!-- View toggle: Compact vs Alles -->
          <div class="custom-toggle">
            <q-btn
              :color="store.state.ui.view === 'compact' ? 'primary' : 'grey-5'"
              :text-color="store.state.ui.view === 'compact' ? 'white' : 'dark'"
              :label="$customT('leaderboard.viewCompact')"
              @click="store.setView('compact')"
              dense
              size="sm"
              class="toggle-btn"
            />
            <q-btn
              :color="store.state.ui.view === 'all' ? 'primary' : 'grey-5'"
              :text-color="store.state.ui.view === 'all' ? 'white' : 'dark'"
              :label="$customT('leaderboard.viewAll')"
              @click="store.setView('all')"
              dense
              size="sm"
              class="toggle-btn"
            />
          </div>
        </div>
      </div>

      <!-- Sticky header -->
      <div class="table-header">
        <div class="header-row">
          <div class="col-position">{{ $customT('leaderboard.position') }}</div>
          <div class="col-category">{{ $customT('leaderboard.category') }}</div>
          <div class="col-name">{{ $customT('leaderboard.name') }}</div>
          <div class="col-thru">{{ $customT('leaderboard.thru') }}</div>
          <div class="col-vspar">{{ $customT('leaderboard.vsPar') }}</div>
        </div>
      </div>

      <!-- Tabel body -->
      <div class="table-body">
        <div
          v-for="player in displayList"
          :key="player.userId"
          class="table-row"
          :class="{ 'current-player': player.userId === store.state.current.currentUserId }"
          :aria-current="player.userId === store.state.current.currentUserId ? 'row' : undefined"
        >
          <!-- Positie -->
          <div class="col-position">
            <span class="position-text">{{ getPosition(player.userId) }}</span>
          </div>

          <!-- Categorie -->
          <div class="col-category">
            <span class="category-letter">{{ player.categoryLetter }}</span>
          </div>

          <!-- Naam -->
          <div class="col-name">
            <span class="player-name">{{ player.name }}</span>
          </div>

          <!-- Thru -->
          <div class="col-thru">
            <span class="thru-number">{{ player.thru }}</span>
          </div>

          <!-- vsPar -->
          <div class="col-vspar">
            <span class="vspar-number">{{ formatVsPar(player.vsPar) }}</span>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading || !displayList" class="loading-state">
        <q-spinner color="primary" size="1.5em" />
        <span class="loading-text">{{ $customT('leaderboard.loading') }}</span>
      </div>

      <!-- Empty state -->
      <div v-else-if="displayList.length === 0" class="empty-state">
        <q-icon name="leaderboard" size="2em" color="grey-5" />
        <span class="empty-text">{{ $customT('leaderboard.noData') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLeaderboardStore, type LeaderboardPlayer } from 'src/stores/leaderboard';
import { debug } from 'src/utils/debug';

// Props
interface Props {
  eventId: string;
  currentUserId: string;
}

const props = defineProps<Props>();

// Composables
const { t: $customT } = useI18n();
const store = useLeaderboardStore();

// Local state
const loading = ref(false);

// Computed properties
const displayList = computed(() => {
  console.log('displayList computed - view:', store.state.ui.view);

  if (store.state.ui.view === 'compact') {
    const compact = store.compactList;
    console.log('displayList - compactList:', compact ? compact.length : 0);
    return compact || [];
  } else {
    const full = store.fullList;
    console.log('displayList - fullList:', full ? full.length : 0);
    return full || [];
  }
});

// Methods
const toggleExpanded = async () => {
  if (store.state.ui.expanded) {
    store.collapse();
  } else {
    loading.value = true;
    try {
      await store.expand();
    } catch (error) {
      debug('Leaderboard: Error expanding', error);
    } finally {
      loading.value = false;
    }
  }
};

const getPosition = (userId: string): string => {
  // Gebruik de store getters direct in plaats van .value
  const positionMap = store.positionMap;
  const fullList = store.fullList;

  console.log('getPosition debug:', {
    userId,
    positionMap: positionMap ? Object.keys(positionMap).length : 0,
    fullList: fullList ? fullList.length : 0,
    expanded: store.state.ui.expanded,
    storeState: {
      rowsByUserId: Object.keys(store.state.rowsByUserId).length,
      sortedUserIds: store.state.sortedUserIds.length,
    },
  });

  // Check of fullList bestaat voordat we erop proberen te itereren
  if (!fullList || !Array.isArray(fullList)) {
    console.log('No fullList available yet - component still initializing');
    return '-';
  }

  // Probeer eerst positionMap te gebruiken (meest accuraat)
  if (positionMap && Object.keys(positionMap).length > 0) {
    const position = positionMap[userId];
    console.log('Position from positionMap for user:', userId, '=', position);
    return position || '-';
  }

  // Fallback: bereken positie uit fullList
  console.log('No positionMap, calculating position from fullList');
  const playerIndex = fullList.findIndex((p) => p.userId === userId);
  if (playerIndex !== -1) {
    const position = (playerIndex + 1).toString();
    console.log('Calculated position for user:', userId, '=', position);
    return position;
  }

  console.log('User not found in fullList:', userId);
  return '-';
};

const formatVsPar = (vsPar: number): string => {
  if (vsPar === 0) return 'E';
  if (vsPar > 0) return `+${vsPar}`;
  return vsPar.toString();
};

// Lifecycle
onMounted(async () => {
  debug('Leaderboard: Component mounted, initializing for event', props.eventId);
  loading.value = true;

  try {
    await store.init(props.eventId, props.currentUserId);
  } catch (error) {
    debug('Leaderboard: Error during initialization', error);
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  debug('Leaderboard: Component unmounted, resetting store');
  try {
    store.reset();
  } catch (error) {
    debug('Leaderboard: Error during reset on unmount', error);
  }
});

// Watch voor prop changes
watch(
  () => props.eventId,
  async (newEventId) => {
    if (newEventId && newEventId !== store.state.current.eventId) {
      debug('Leaderboard: Event ID changed, reinitializing', newEventId);
      loading.value = true;

      try {
        await store.init(newEventId, props.currentUserId);
      } catch (error) {
        debug('Leaderboard: Error reinitializing for new event', error);
      } finally {
        loading.value = false;
      }
    }
  },
);

watch(
  () => props.currentUserId,
  async (newUserId) => {
    if (newUserId && newUserId !== store.state.current.currentUserId) {
      debug('Leaderboard: Current user changed, updating', newUserId);
      store.state.current.currentUserId = newUserId;
    }
  },
);
</script>

<style scoped>
/* Container styling */
.leaderboard-widget {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 16px;
}

/* Titel styling */
.leaderboard-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #e0e0e0;
}

.leaderboard-title:hover {
  background: #eeeeee;
}

.leaderboard-title:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: -2px;
}

.title-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
}

.status-badge {
  font-size: 0.75rem;
  padding: 2px 6px;
}

.expand-icon {
  color: #666;
  transition: transform 0.2s ease;
}

/* Toggles styling */
.leaderboard-toggles {
  padding: 8px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.toggle-row {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

/* Custom toggle styling voor perfecte 50/50 verdeling */
.custom-toggle {
  flex: 1;
  display: flex;
  width: 100%;
}

.toggle-btn {
  flex: 1;
  width: 50%;
  text-align: center;
  justify-content: center;
  border-radius: 0;
}

.toggle-btn:first-child {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

.toggle-btn:last-child {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

/* Tabel styling */
.leaderboard-table-container {
  max-height: 400px;
  overflow-y: auto;
  background: white;
}

.table-header {
  position: sticky;
  top: 0;
  background: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
  z-index: 10;
}

.header-row {
  display: grid;
  grid-template-columns: 4ch 2ch 1fr 3ch 6ch;
  gap: 8px;
  padding: 8px 16px;
  font-weight: 400;
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  align-items: center;
  min-height: 40px;
}

.header-row .col-position {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.header-row .col-category {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.header-row .col-name {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
}

.header-row .col-thru {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  text-align: right;
}

.header-row .col-vspar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  text-align: right;
}

.table-body {
  /* Geen extra styling nodig */
}

.table-row {
  display: grid;
  grid-template-columns: 4ch 2ch 1fr 3ch 6ch;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
  min-height: 40px;
  align-items: center;
  font-size: 0.875rem;
}

.table-row:hover {
  background: #f8f9fa;
}

.table-row.current-player {
  background: var(--q-primary);
  color: white;
}

.table-row.current-player:hover {
  background: #002a5c;
}

/* Kolom styling - exact overeenkomstig met header */
.col-position {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.col-category {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.col-name {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
  min-width: 0; /* Voor text overflow */
}

.col-thru {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  text-align: right;
}

.col-vspar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  text-align: right;
}

/* Text styling */
.position-text,
.thru-number,
.vspar-number {
  font-family: 'Roboto Mono', monospace;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.category-letter {
  font-weight: 600;
  text-transform: lowercase;
}

.player-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-height: 1.2em;
  line-height: 1.2em;
}

/* Loading en empty states */
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  gap: 12px;
  color: #666;
}

.loading-text,
.empty-text {
  font-size: 0.875rem;
}

/* Responsive aanpassingen */
@media (max-width: 480px) {
  .leaderboard-title {
    padding: 10px 12px;
  }

  .title-text {
    font-size: 0.9rem;
  }

  .leaderboard-toggles {
    padding: 6px 12px;
  }

  .toggle-row {
    flex-direction: row;
    gap: 6px;
  }

  .custom-toggle {
    flex: 1;
    width: 100%;
  }

  .toggle-btn {
    width: 50%;
  }

  .header-row,
  .table-row {
    padding: 6px 12px;
    gap: 6px;
  }

  .header-row {
    min-height: 36px;
    font-size: 0.7rem;
  }

  .table-row {
    min-height: 36px;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .leaderboard-title,
  .table-row,
  .expand-icon {
    transition: none;
  }
}

/* Focus styling voor keyboard navigation */
.leaderboard-title:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: -2px;
}
</style>
