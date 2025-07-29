# Pagina Structuur

## Belangrijke Richtlijnen

1. **ALTIJD aparte pagina's voor AppMenu en UserMenu**

   - NOOIT dezelfde pagina gebruiken voor beide menu's
   - AppMenu: alleen-lezen functionaliteit
   - UserMenu: beheerfunctionaliteit

2. **Naamgeving**

   - AppMenu pagina's: `[naam]OverviewPage.vue`
     - Bijvoorbeeld: `EventsOverviewPage.vue`
   - UserMenu pagina's: `[naam]Page.vue`
     - Bijvoorbeeld: `EventsPage.vue`

3. **Locatie**
   - AppMenu pagina's: `src/pages/appmenu/`
   - UserMenu pagina's: `src/pages/usermenu/`
   - Authenticatie pagina's: `src/pages/auth/`

## Voorbeelden

### AppMenu (alleen-lezen)

- `EventsOverviewPage.vue` - Overzicht van alle events
- `BanenOverviewPage.vue` - Overzicht van alle banen
- `SpelersOverviewPage.vue` - Overzicht van alle spelers

### UserMenu (beheer)

- `EventsPage.vue` - Beheren van eigen events
- `MyBanenPage.vue` - Beheren van eigen banen
- `MyRoundsPage.vue` - Beheren van eigen rondes

## Template voor nieuwe pagina's

```vue
<!-- 
  Type: AppMenu/UserMenu
  Functionaliteit: [alleen-lezen/beheer]
  Gerelateerde pagina: [naam van pagina in ander menu]
-->
<template>
  <!-- Pagina inhoud -->
</template>
```

## Waarschuwing

Het is CRUCIAAL om altijd aparte pagina's te maken voor AppMenu en UserMenu, zelfs als de functionaliteit vergelijkbaar lijkt. Dit zorgt voor:

- Betere scheiding van verantwoordelijkheden
- Makkelijker onderhoud
- Duidelijkere code-structuur
- Minder kans op verwarring
