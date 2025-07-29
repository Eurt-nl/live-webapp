# DEV_CHANGELOG.md

Dit bestand bevat een overzicht van belangrijke wijzigingen en toevoegingen aan de Pitch & Putt PWA.

## 2025-07-11

### Moderator Approval Systeem

- **Toegevoegd**: ModeratorApprovalPage voor het goedkeuren van moderator aanvragen
- **Toegevoegd**: Goedkeurings- en afwijzingsknoppen in de approval pagina
- **Toegevoegd**: Automatische toevoeging van gebruiker als moderator bij goedkeuring
- **Toegevoegd**: Notificatie links naar approval pagina met alle benodigde parameters
- **Toegevoegd**: Route voor moderator-approval pagina
- **Verbeterd**: Notificatie workflow met notificationId voor tracking

### Apply for Moderator Functionaliteit

- **Toegevoegd**: Conditionele knop logica in BanenDetailPage
- **Toegevoegd**: "Apply for moderator" knop wanneer baan geen eigenaar/moderators heeft
- **Toegevoegd**: Apply for moderator dialog met tekstarea voor motivatie
- **Toegevoegd**: In-app notificatie naar gebruiker rh.hasper@me.com via notificatie systeem
- **Toegevoegd**: Computed property hasOwnerOrModerators voor conditionele weergave
- **Verbeterd**: Gebruikerservaring voor banen zonder beheer
- **Verbeterd**: Directe notificatie in plaats van email workflow

### BanenDetailPage Icoontjes Interface

- **Toegevoegd**: Icoontjes rij voor categorie, route, website en email
- **Toegevoegd**: Categorie icoon uit database (48x48px)
- **Toegevoegd**: Route icoon dat Google Maps opent met GPS coördinaten
- **Toegevoegd**: Website icoon dat website opent in nieuw tabblad
- **Toegevoegd**: Email icoon dat email client opent met vooraf ingevulde gegevens
- **Verbeterd**: Visuele layout met gecentreerde icoontjes en labels
- **Verbeterd**: Conditionele weergave - alleen zichtbaar wanneer data beschikbaar is

### Categorie Iconen Ondersteuning

- **Toegevoegd**: Icon veld aan Category interface in models.ts
- **Toegevoegd**: Categorie iconen weergave in BanenOverviewPage
- **Toegevoegd**: Helper functie getCategoryIconUrl voor het ophalen van categorie icoon URLs
- **Verbeterd**: Course expand type om categorie iconen te ondersteunen
- **Verbeterd**: BanenOverviewPage haalt nu categorieën uit met expand parameter

### BanenOverviewPage Verbeteringen

- **Toegevoegd**: Afstandsindicator chip die toont wanneer banen gesorteerd zijn op afstand
- **Toegevoegd**: "Alle landen" optie met wereldbol icoon in de landenfilter
- **Toegevoegd**: Afstandsweergave per baan (in meters voor <1km, decimale km voor <10km, hele km voor grotere afstanden)
- **Toegevoegd**: Land vlag rechts in elke baan kaart voor snelle herkenning
- **Toegevoegd**: "Geen banen gevonden" bericht wanneer filter geen resultaten geeft
- **Verbeterd**: Visuele feedback voor actieve landenfilter
- **Verbeterd**: Layout van baan kaarten met betere spacing en flex-grow

### PWA Update Systeem

- **Toegevoegd**: Service worker update detectie
- **Toegevoegd**: Update popup dialog met changelog informatie
- **Toegevoegd**: Automatische app refresh na update
- **Toegevoegd**: Changelog utility voor het bijhouden van wijzigingen
- **Toegevoegd**: Update script voor het toevoegen van changelog entries

### PWA Installatie

- **Toegevoegd**: PWA installatie instructie dialog
- **Toegevoegd**: Platform-specifieke instructies (iOS, Android, Desktop)
- **Toegevoegd**: Automatische detectie van PWA mode

### App Refresh Functionaliteit

- **Toegevoegd**: Refresh knop in UserMenu
- **Verbeterd**: Refresh logica voor PWA mode
- **Toegevoegd**: Router refresh gecombineerd met window.location.reload()

### Capacitor Integratie

- **Toegevoegd**: Capacitor installatie en configuratie
- **Toegevoegd**: iOS en Android platforms
- **Toegevoegd**: Capacitor plugins voor PWA functionaliteit

### Push Notifications (Verwijderd)

- **Verwijderd**: Alle push notification gerelateerde code
- **Verwijderd**: VAPID key utilities
- **Verwijderd**: Service worker push handlers
- **Verwijderd**: Push notification registratie in App.vue

### Logo Asset Management

- **Toegevoegd**: Logo.png naar public directory voor PWA build
- **Verbeterd**: Asset referenties in de applicatie
- **Toegevoegd**: PWA-specifieke builds

### Code Kwaliteit

- **Verbeterd**: ESLint en Prettier configuratie
- **Toegevoegd**: Nederlandse commentaar in alle code
- **Verbeterd**: TypeScript type definities
- **Toegevoegd**: Consistente code formatting (geen semicolons, single quotes, 2 spaces)
