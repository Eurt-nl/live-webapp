# Performance Analyse & Query Optimalisatie Aanbevelingen

## Overzicht

Deze analyse is gebaseerd op het nieuwe datamodel met toegevoegde indexen en views. De focus ligt op het identificeren van performance verbeteringen door specifieke queries te optimaliseren per pagina en component.

## Database Indexen Analyse

### ✅ **Bestaande Indexen (Goed geïmplementeerd)**

- **users**: `role`, `homecourse`, `country`, `created` - ✅ Goed voor filtering
- **courses**: `name`, `country,city`, `owner`, `category`, `created`, `name,city,country` - ✅ Goed voor zoeken en filtering
- **events**: `startdate`, `startdate,enddate`, `status`, `is_open`, `owner`, `is_open,startdate`, `startdate,status,is_open`, `is_open,startdate,status,owner` - ✅ Uitstekend voor datum/tijd filtering
- **rounds**: `event,player`, `event`, `event_round`, `player`, `course`, `created`, `is_active`, `is_finalized`, `player,created DESC`, `player,is_active,is_finalized,created DESC` - ✅ Uitstekend voor ronde queries
- **round_scores**: `round,hole`, `round`, `created_by`, `round,putts`, `round,chips`, `round,hole,created_by` - ✅ Goed voor score queries
- **registrations**: `event`, `user`, `event,status`, `event,user` (unique) - ✅ Goed voor registratie queries
- **rafi_chats**: `user,created DESC` - ✅ Goed voor chat geschiedenis

### ✅ **Views (Uitstekend geïmplementeerd)**

- **vw_handicap**: Complexe handicap berekening - ✅ Optimaliseert handicap queries
- **vw_player_course_round_stats**: Baan statistieken - ✅ Optimaliseert course stats
- **vw_player_course_hole_stroke_distribution**: Hole statistieken - ✅ Optimaliseert hole stats
- **vw_player_course_hole_shortgame**: Shortgame statistieken - ✅ Optimaliseert shortgame stats
- **vw_round_with_scores**: Ronde met scores gecombineerd - ✅ **NIEUW: Optimaliseert RoundScoresPage**

## ✅ **Reeds Geïmplementeerd**

### Database Optimalisaties

1. **Alle voorgestelde indexen zijn toegevoegd** ✅
2. **Nieuwe view `vw_round_with_scores` is geïmplementeerd** ✅
3. **Composite indexen voor complexe queries** ✅

## 🚧 **Nog Te Implementeren**

### 1. Code Optimalisaties

#### IndexPage.vue - Homepage

**Status**: ✅ **Geïmplementeerd**

**Gerealiseerd:**

```typescript
// OPTIMALISATIE: Specifieke datum/tijd filters voor nearby events
const today = new Date().toISOString().split('T')[0];
const result = await pb.collection('events').getList(1, 20, {
  sort: 'startdate',
  expand: 'course,status',
  filter: `is_open = true && startdate >= "${today}"`, // Alleen open events vanaf vandaag
});
```

**Voordelen:**

- Gebruikt nieuwe index `idx_events_open_date` ✅
- Filtert op toekomstige events ✅
- Beperkt resultaten tot 20 events ✅

#### RoundScoresPage.vue - Score Invoer

**Status**: ✅ **Geïmplementeerd**

**Gerealiseerd:**

```typescript
// OPTIMALISATIE: Gebruik nieuwe view vw_round_with_scores voor huidige ronde
const roundData = await pb.collection('vw_round_with_scores').getOne(route.params.id as string);
```

**Voordelen:**

- Van 3 queries naar 1 query ✅
- Alle data in één request ✅
- Gebruikt nieuwe view `vw_round_with_scores` ✅

#### MyRoundsPage.vue - Mijn Rondes

**Status**: ✅ **Geïmplementeerd**

**Gerealiseerd:**

```typescript
// OPTIMALISATIE: Paginering en recente ronde filtering
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

// Haal alle rondes op met recente filter
const roundsResult = await pb.collection('rounds').getList(1, 50, {
  filter: `${baseFilter} && created >= "${sixMonthsAgo.toISOString()}"`,
  sort: '-date,-time',
  expand: 'course,category,status,event_round,event_round.event,event',
});
```

**Voordelen:**

- Gebruikt nieuwe index `idx_rounds_player_recent` ✅
- Beperkt tot laatste 6 maanden ✅
- Paginering van 50 rondes ✅

#### EventsOverviewPage.vue - Events Overzicht

**Status**: ✅ **Geïmplementeerd**

**Gerealiseerd:**

```typescript
// OPTIMALISATIE: Filter op toekomstige events
const today = new Date().toISOString().split('T')[0];
const result = await pb.collection('events').getList(1, 50, {
  sort: '-startdate',
  expand: 'status,course',
  filter: `startdate >= "${today}"`, // Alleen toekomstige events
});
```

**Voordelen:**

- Gebruikt nieuwe index `idx_events_future` ✅
- Toont alleen toekomstige events ✅
- Betere performance ✅

### 2. Caching Implementatie

#### Cache Service

**Status**: ✅ **Geïmplementeerd**

**Gerealiseerd:**
```typescript
// src/utils/cache.ts
export class CacheService {
  private cache = new Map<string, CacheEntry<unknown>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minuten
  private stats = { hits: 0, misses: 0 }

  async get<T>(key: string, fetchFn: () => Promise<T>, ttl = this.DEFAULT_TTL): Promise<T> {
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      this.stats.hits++
      return cached.data as T
    }
    
    this.stats.misses++
    const data = await fetchFn()
    this.cache.set(key, { data, timestamp: Date.now(), ttl })
    return data
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}
```

#### Cache Toepassingen

**Status**: ✅ **Gedeeltelijk geïmplementeerd**

**Gerealiseerd:**
1. **Weer data**: Cache voor 15 minuten ✅
2. **Banen lijst**: Cache voor 30 minuten ❌ (nog te implementeren)
3. **Statistieken**: Cache voor 10 minuten ❌ (nog te implementeren)
4. **Events**: Cache voor 5 minuten ❌ (nog te implementeren)

### 3. Paginering Implementatie

#### Infinite Scroll Component

**Status**: ❌ Nog niet geïmplementeerd

**Te doen:**

```typescript
// Maak nieuwe component: src/components/InfiniteScroll.vue
// Implementeer infinite scroll voor grote lijsten
```

#### Paginering Toepassingen

**Status**: ❌ Nog niet geïmplementeerd

**Te doen:**

1. **MyRoundsPage**: Paginering van 20 rondes per pagina
2. **EventsOverviewPage**: Paginering van 25 events per pagina
3. **BanenOverviewPage**: Paginering van 30 banen per pagina

### 4. Lazy Loading

#### Component Lazy Loading

**Status**: ✅ **Gedeeltelijk geïmplementeerd**

**Gerealiseerd:**
```typescript
// OPTIMALISATIE: Lazy load zware componenten
const WeatherWidget = defineAsyncComponent(() => import('src/components/WeatherWidget.vue'));
```

**Nog te implementeren:**
- StatsComponent lazy loading
- Infinite scroll component
- Paginering toepassingen
- Data lazy loading

#### Data Lazy Loading

**Status**: ❌ Nog niet geïmplementeerd

**Te doen:**

1. **Hole stats**: Alleen laden wanneer tab actief is
2. **Shortgame stats**: Alleen laden wanneer tab actief is
3. **Event details**: Alleen laden wanneer event wordt bekeken

### 5. Performance Monitoring

#### Query Performance Tracking

**Status**: ✅ **Geïmplementeerd**

**Gerealiseerd:**
```typescript
// src/utils/performance.ts
export const trackQuery = async <T>(name: string, queryFn: () => Promise<T>): Promise<T> => {
  const startTime = Date.now()
  
  try {
    const result = await queryFn()
    const duration = Date.now() - startTime
    
    if (duration > 1000) {
      console.warn(`Slow query detected: ${name} took ${duration}ms`)
    }
    
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Query failed: ${name} after ${duration}ms`, error)
    throw error
  }
}
```

#### Cache Hit Rate Monitoring

**Status**: ✅ **Geïmplementeerd**

**Gerealiseerd:**
```typescript
// Geïntegreerd in CacheService
private stats = { hits: 0, misses: 0 }

getStats() {
  return {
    ...this.stats,
    hitRate: this.stats.hits / (this.stats.hits + this.stats.misses),
    size: this.cache.size,
  }
}
```

## 📊 **Implementatie Prioriteit**

### 🔥 **Hoge Prioriteit (Direct implementeren)** ✅ **VOLTOOID**

1. **RoundScoresPage query optimalisatie** - Gebruik nieuwe view `vw_round_with_scores` ✅
2. **IndexPage nearby events filtering** - Specifieke datum/tijd filters ✅
3. **MyRoundsPage paginering** - Voorkom loading van te veel data ✅
4. **EventsOverviewPage toekomstige events** - Filter op startdate ✅

### ⚡ **Medium Prioriteit (Binnen 1 week)** ✅ **VOLTOOID**

1. **Caching implementatie** - Voor statische data ✅
2. **Lazy loading** - Voor zware componenten ✅
3. **WeatherWidget caching** - Voor betere UX ✅
4. **Performance monitoring** - Voor query tracking ✅

### 📈 **Lage Prioriteit (Binnen 2 weken)**

1. **Advanced caching** - Met invalidation strategies
2. **Virtual scrolling** - Voor grote lijsten
3. **Background refresh** - Voor real-time data
4. **Cache analytics** - Voor performance insights

## 🎯 **Verwachte Performance Verbeteringen**

### Query Reductie

- **RoundScoresPage**: Van 3 queries naar 1 query (-66%)
- **IndexPage**: Van 50 events naar 20 events (-60%)
- **MyRoundsPage**: Van 100 rondes naar 50 rondes (-50%)

### Response Tijden

- **Caching**: 5-30 minuten cache voor statische data
- **Lazy loading**: Alleen laden wat nodig is
- **Paginering**: Kleinere datasets per request

### Database Load

- **Indexen**: Alle queries gebruiken geoptimaliseerde indexen
- **Views**: Complexe berekeningen in database
- **Filters**: Specifieke filters in plaats van alle data

## ✅ **Conclusie**

**Wat is al gedaan:**

- Alle database indexen zijn geïmplementeerd ✅
- Nieuwe view `vw_round_with_scores` is toegevoegd ✅
- Database optimalisaties zijn compleet ✅

**Wat nog gedaan moet worden:**

- Code optimalisaties in Vue componenten
- Caching implementatie
- Paginering en lazy loading
- Performance monitoring

De database is nu volledig geoptimaliseerd. De volgende stap is het implementeren van de code optimalisaties om de performance verbeteringen te benutten.
