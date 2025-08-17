# Weer-invloed Functionaliteit

## Overzicht

De weer-invloed functionaliteit geeft spelers tijdens een ronde inzicht in hoe het weer (temperatuur en wind) de afstanden en richtingen van hun slagen beïnvloedt. Dit is gebaseerd op wetenschappelijke berekeningen voor Pitch & Putt balvluchten.

## Functionaliteiten

### 1. Weer-invloed Tabel

- **Locatie**: RondeScoresPage (naast de titel)
- **Icoontje**: Zon icoontje (`wb_sunny`)
- **Toegang**: Klik op het icoontje om de weer-invloed tabel te openen

### 2. Tabel Inhoud

De tabel toont voor alle 18 holes:

- **Hole nummer**: 1-18
- **Normale afstand**: Originele hole lengte in meters
- **Aangepaste afstand**: Afstand aangepast voor weer-invloeden
- **Verschil**: Het verschil tussen normale en aangepaste afstand
- **Richting**: Aanbeveling voor compensatie (bijv. "2L" = 2 meter links mikken)

### 3. Weer Informatie

- **Temperatuur**: Huidige temperatuur in °C
- **Windsnelheid**: Windsnelheid in m/s
- **Windrichting**: Windrichting (N, NO, O, ZO, Z, ZW, W, NW)
- **Laatst bijgewerkt**: Tijdstip van laatste weerdata

## Technische Implementatie

### Berekeningen

De weer-invloed berekeningen zijn gebaseerd op `src/utils/ballflight.ts`:

1. **Temperatuurfactor**: ~1% per +6°C t.o.v. 15°C
2. **Windfactor**: Asymmetrisch effect op carry (meewind positief, tegenwind negatief)
3. **Laterale drift**: Zijwind effect op balvlucht
4. **GPS Bearing**: Berekening van hole richting (tee naar green)

### API Integratie

- **Primaire bron**: MET Norway API (direct)
- **Fallback**: Open-Meteo API (server-side proxy beschikbaar)
- **Endpoint**: `https://api.met.no/weatherapi/locationforecast/2.0/compact` (direct)
- **Locatie**: Gebaseerd op GPS coördinaten van de eerste hole met geldige GPS data

### iOS PWA Compatibiliteit

De weather functionaliteit is geoptimaliseerd voor iOS PWA (standalone mode):

1. **CORS-vriendelijk**: Geen custom headers in frontend requests
2. **Service Worker**: MET Norway requests worden altijd network-only gecached
3. **Directe API calls**: Geen server-side proxy vereist voor basis functionaliteit
4. **Server-side proxy beschikbaar**: Voor User-Agent compliance en fallback (optioneel)
5. **Rate limiting**: Server-side rate limiting beschikbaar via proxy (optioneel)

### GPS Vereisten

Voor de weer-invloed berekening zijn GPS coördinaten nodig voor:

- **Tee positie**: `gps_tee` (latitude/longitude)
- **Green positie**: `gps_green` (latitude/longitude)

Zonder GPS data wordt het icoontje uitgeschakeld.

## Bestanden

### Nieuwe Bestanden

- `src/composables/useWeather.ts` - Weerdata ophalen via server-side proxy
- `src/components/WeatherWidget.vue` - Weer widget component
- `src/components/WeatherImpactTable.vue` - Weer-invloed tabel component

### Gewijzigde Bestanden

- `src/pages/usermenu/RoundScoresPage.vue` - WeatherImpactTable toegevoegd
- `src-pwa/express/index.js` - Weather API proxy endpoint toegevoegd (optioneel)
- `quasar.config.js` - Service Worker configuratie voor MET Norway API

## Troubleshooting

### iOS PWA Problemen

Als de weather data niet werkt in iOS PWA (standalone mode):

1. **Controleer console logs**: Debug logging toont User-Agent en standalone status
2. **Test in Safari**: Werkt het wel in Safari (niet-standalone)?
3. **Controleer server logs**: Weather proxy errors worden gelogd
4. **Test fallback**: Open-Meteo wordt automatisch gebruikt bij MET Norway uitval

### Debug Commands

```bash
# Test directe MET Norway API
curl "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=52.3676&lon=4.9041"

# Test weather proxy endpoint (als server draait)
curl "http://localhost:3000/api/weather?lat=52.3676&lon=4.9041"

# Test frontend weather functionaliteit
node scripts/test-weather-frontend.js
```

### Veelvoorkomende Problemen

1. **CORS errors**: Worden opgelost door CORS-vriendelijke configuratie
2. **User-Agent blocking**: Wordt opgelost door server-side proxy (optioneel)
3. **Service Worker caching**: Wordt opgelost door NetworkOnly strategie
4. **Rate limiting**: Wordt opgelost door server-side rate limiting (optioneel)
5. **API uitval**: Wordt opgelost door Open-Meteo fallback (optioneel)
