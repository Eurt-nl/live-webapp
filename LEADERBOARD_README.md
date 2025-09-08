# Leaderboard Widget - Implementatie Documentatie

## Overzicht

De Leaderboard Widget is een compacte, herbruikbare component die realtime tussenstanden toont tijdens het invoeren van scores in een event. De component is geïntegreerd in de RoundScoresPage en toont live updates van alle spelers in het event.

## Architectuur

### Pinia Store (`src/stores/leaderboard.ts`)

De store beheert alle leaderboard state en logica:

- **State**: Event ID, huidige gebruiker, speler data, UI toggles, realtime subscriptions
- **Getters**: Volledige lijst, compacte lijst (max 10), positie mapping, huidige speler
- **Actions**: Initialisatie, expand/collapse, scope/view toggles, realtime subscriptions

### Component (`src/components/LeaderboardWidget.vue`)

De Vue component die de UI rendert:

- **Props**: `eventId`, `currentUserId`
- **Features**: Inklapbare titel, scope toggles, view toggles, realtime status badge
- **Styling**: Responsive design met vaste kolombreedtes en sticky header

## Functionaliteit

### Sortering Algoritme

Spelers worden gesorteerd volgens deze prioriteit:

1. **Thru** (desc): Meeste holes eerst
2. **vsPar** (asc): Laagste score eerst
3. **Naam** (asc): Voor stabiele volgorde

### Positie Mapping

- Normale posities: `1`, `2`, `3`, etc.
- Ties: `T1`, `T2`, etc. (alleen als Thru én vsPar gelijk zijn)
- Maximum: `T71` voor posities > 71

### Compacte Lijst (Max 10 regels)

Prioriteit algoritme:

1. **Huidige speler** (altijd zichtbaar)
2. **Top 3** spelers
3. **3 boven** de huidige speler
4. **3 onder** de huidige speler
5. **Extra spelers** symmetrisch toegevoegd

### Scope Filtering

- **Event**: Alle spelers in het event
- **Categorie**: Alleen spelers met dezelfde categorie als de huidige speler

### View Modes

- **Compact**: Max 10 regels met prioriteit algoritme
- **Alles**: Volledige lijst binnen gekozen scope

## Realtime Functionaliteit

### PocketBase Subscriptions

- **round_scores**: Live updates van score wijzigingen
- **rounds**: Live updates van ronde status wijzigingen
- **Filtering**: Alleen updates voor het huidige event

### Status Badge

- **LIVE**: WebSocket verbinding actief
- **niet live**: Geen verbinding of fout

### Lifecycle

- **Zichtbaar**: Snapshot + realtime subscription
- **Ingeklapt**: Unsubscribe + cleanup
- **Geen auto-reconnect**: Werkt of werkt niet

## Data Model

### LeaderboardPlayer Interface

```typescript
interface LeaderboardPlayer {
  userId: string;
  name: string;
  categoryLetter: string; // 1e letter van categorie (lowercase)
  thru: number; // Aantal gespeelde holes
  vsPar: number; // Totaal vs par (par = 3)
  status: 'active' | 'finished';
  lastUpdate: string; // PocketBase datum format
}
```

### Aggregaties

- **Thru**: Aantal `round_scores` met geldige `score_player`
- **vsPar**: `Σ(score_player) - 3 × aantal holes` (par = 3)
- **Categorie**: Eerste letter van `users.category` (lowercase)

## UI Specificaties

### Kolommen (volgorde)

1. **Positie** (4ch): Rechts uitgelijnd, tabular-nums
2. **Categorie** (2ch): Gecentreerd, 1 letter lowercase
3. **Naam** (flex): Links uitgelijnd, min 20ch, verticale scroll
4. **Thru** (3ch): Rechts uitgelijnd, 0-54, tabular-nums
5. **vsPar** (6ch): Rechts uitgelijnd, -100...+500, tabular-nums

### Styling

- **Huidige speler**: `bg-primary` over hele rij
- **Sticky header**: Eigen achtergrond, correcte z-index
- **Responsive**: Mobile-first design met aanpassingen
- **Accessibility**: ARIA labels, keyboard navigation

## Integratie

### RoundScoresPage

```vue
<LeaderboardWidget
  v-if="isEventRound && round?.event"
  :event-id="String(round.event)"
  :current-user-id="authStore.user?.id || ''"
/>
```

### Voorwaarden

- Alleen zichtbaar voor **event rondes** (niet voor oefenrondes)
- Vereist geldige `eventId` en `currentUserId`
- Automatische cleanup bij component unmount

## Performance

### Optimalisaties

- **Client-side filtering**: Geen server-side LIMIT/pagination
- **O(1) updates**: Realtime score deltas
- **Debouncing**: Optioneel voor frequent updates
- **Memory management**: Cleanup bij unmount

### Indexen (Aanbevolen)

- `round_scores`: `(round)`, `(round, hole)`
- `rounds`: `(event)`, `(player, event)`
- `users`: `(id)` (voldoende)

## Testing

### Test Script

```bash
node scripts/test-leaderboard.js
```

Test alle algoritmes:

- Sortering
- Positie mapping
- Compacte lijst
- Scope filtering
- Edge cases

### Test Coverage

- ✅ Sortering algoritme
- ✅ Tie detection
- ✅ Compact list prioriteit
- ✅ Scope filtering
- ✅ vsPar formatting
- ✅ Edge cases (lege lijst, speler niet gevonden)

## Internationalisatie

### i18n Keys

```json
{
  "leaderboard": {
    "title": "Tussenstand",
    "live": "LIVE",
    "notLive": "niet live",
    "scopeEvent": "Event",
    "scopeCategory": "Categorie",
    "viewCompact": "Compact",
    "viewAll": "Alles",
    "position": "Pos",
    "category": "Cat",
    "name": "Naam",
    "thru": "Thru",
    "vsPar": "vs Par",
    "loading": "Laden...",
    "noData": "Geen data beschikbaar"
  }
}
```

## Herbruikbaarheid

### Standalone Gebruik

De component kan buiten de app gebruikt worden:

```vue
<LeaderboardWidget :event-id="eventId" :current-user-id="userId" />
```

### Theming

- Primaire kleur via CSS variabelen
- Geen hardcoded kleuren
- Responsive breakpoints

## Troubleshooting

### Veelvoorkomende Problemen

1. **Geen data**: Controleer event ID en PocketBase verbinding
2. **Niet live**: WebSocket verbinding gefaald
3. **Performance**: Te veel spelers (>100), overweeg paginering
4. **Memory leaks**: Zorg voor proper cleanup bij unmount

### Debug Logging

Alle store acties loggen naar console met `debug()` functie:

- Initialisatie
- Data building
- Realtime updates
- Errors

## Toekomstige Uitbreidingen

### Mogelijke Features

- **Paginering**: Voor events met >100 spelers
- **Auto-refresh**: Polling fallback voor WebSocket
- **Export**: CSV/PDF export van tussenstand
- **Historie**: Tussenstand op specifiek tijdstip
- **Notificaties**: Push notificaties bij positie wijziging

### Performance Verbeteringen

- **Virtual scrolling**: Voor grote lijsten
- **Debounced updates**: Voor frequent score wijzigingen
- **Caching**: Lokale cache van speler data
- **WebSocket pooling**: Gedeelde verbindingen
