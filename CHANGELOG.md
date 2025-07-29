# Changelog Systeem

Dit project heeft een automatisch changelog systeem dat bijhoudt welke wijzigingen er zijn gemaakt in elke versie.

## 🚀 Hoe het werkt

1. **Automatische detectie**: Wanneer er een nieuwe versie beschikbaar is, detecteert de service worker dit automatisch
2. **Update popup**: Gebruikers krijgen een mooie popup te zien met de changelog van de nieuwe versie
3. **Versie kleuren**: Verschillende types updates hebben verschillende kleuren:
   - 🔴 **Major** (rood): Grote wijzigingen, breaking changes
   - 🟠 **Minor** (oranje): Nieuwe features, verbeteringen
   - 🟢 **Patch** (groen): Bug fixes, kleine verbeteringen

## 📝 Changelog bijwerken

### Automatisch (aanbevolen)

Gebruik het script om automatisch de changelog bij te werken:

```bash
# Nieuwe minor versie met features
node scripts/update-changelog.js 1.2.0 minor "Nieuwe feature toegevoegd" "Bug fix opgelost"

# Nieuwe major versie
node scripts/update-changelog.js 2.0.0 major "Complete redesign" "Nieuwe API"

# Nieuwe patch versie
node scripts/update-changelog.js 1.1.1 patch "Kleine bug fix"
```

### Handmatig

Je kunt ook handmatig de changelog bijwerken in `src/utils/changelog.ts`:

```typescript
export const changelog: ChangelogEntry[] = [
  {
    version: '1.2.0',
    date: '2024-01-16',
    type: 'minor',
    changes: ['Nieuwe feature toegevoegd', 'Bug fix opgelost', 'Performance verbeteringen'],
  },
  // ... bestaande entries
];
```

## 🎨 Update Popup

De update popup toont:

- **Versie nummer** met kleurgecodeerde chip
- **Datum** van de release
- **Lijst van wijzigingen** met checkmark iconen
- **Vernieuwen knop** om de app bij te werken

## 🔧 Technische Details

- **Service Worker**: Detecteert automatisch nieuwe versies
- **Changelog Utility**: Beheert versie-informatie en vergelijkingen
- **Update Script**: Automatiseert het bijwerken van changelog entries
- **Package.json**: Wordt automatisch bijgewerkt met nieuwe versie

## 📋 Best Practices

1. **Gebruik semantische versies**: `major.minor.patch`
2. **Beschrijf wijzigingen duidelijk**: Wat is er toegevoegd/veranderd/opgelost
3. **Update regelmatig**: Bij elke significante wijziging
4. **Test de popup**: Zorg dat de update flow werkt

## 🧪 Testen

Om het changelog systeem te testen:

1. **Voeg een nieuwe changelog entry toe**:

   ```bash
   node scripts/update-changelog.js 1.2.0 minor "Test feature"
   ```

2. **Build de app**:

   ```bash
   quasar build -m pwa
   ```

3. **Start de server**:

   ```bash
   quasar serve -m pwa
   ```

4. **Open de app** en je zou de update popup moeten zien met de nieuwe changelog!
