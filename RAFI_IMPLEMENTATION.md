# Rafi - Pitch & Putt AI Assistant

## Overzicht

Rafi is een AI-assistent gespecialiseerd in Pitch & Putt regels die gebruikers helpt met vragen over officiële regels en lokale baanregels. De implementatie bestaat uit een frontend chat interface en een backend server-proxy voor OpenAI integratie.

## Architectuur

### Frontend (Vue 3 + Quasar)

- **RafiChat.vue**: Hoofdcomponent met chat interface
- **useCourseLocator.ts**: GPS-gebaseerde baanlocatie
- **useLocalRules.ts**: Lokale regels ophalen en verwerken
- **useRafi.ts**: API communicatie en chat logging

### Backend (Express.js)

- **src-pwa/express/index.js**: Server-proxy voor OpenAI API
- Rate limiting, CORS, input validatie
- Prompt engineering voor Rafi's gedrag

## Setup

### 1. Environment Variabelen

Maak een `.env` bestand aan in de root:

```bash
# Frontend variabelen
VITE_PB_URL=https://pb.pitch-putt.live
VITE_API_BASE_URL=/api
VITE_RAFI_LOGGING=false

# Server-side variabelen (niet in frontend gebundeld)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
ALLOWED_ORIGIN=*
RATE_LIMIT_MAX_PER_MIN=10
```

### 2. Dependencies Installeren

```bash
npm install
```

### 3. Server Starten

```bash
# Development server
npm run dev:server

# Productie server
npm run start:server
```

### 4. Frontend Starten

```bash
npm run dev
```

## Functionaliteiten

### GPS-gebaseerde Baanlocatie

- Automatische detectie van dichtstbijzijnde baan binnen 3km
- Haversine formule voor nauwkeurige afstandsberekening
- Foutafhandeling voor geolocatie permissies

### Lokale Regels Integratie

- Ophalen van actieve lokale regels per baan
- Compacteren voor prompt optimalisatie
- Hole-specifieke en algemene regels

### Chat Interface

- QChatMessage componenten voor berichten
- Real-time scroll naar laatste bericht
- Loading states en foutafhandeling
- Accessibility features (ARIA labels, focus management)

### Chat Logging

- Optioneel logging naar `rafi_chats` collectie
- Client metadata (browser, taal, timestamp)
- Fout-tolerant: geen crash bij logging fouten

## Prompt Engineering

### System Prompt

Rafi is geconfigureerd met:

- Scope: Alleen Pitch & Putt regels
- Anti-misbruik: Prompt injection bescherming
- Meertalige out-of-scope afwijzingen
- Instructies voor onzekerheid

### User Prompt

Bevat:

- Gebruikersvraag
- Baan informatie
- Compacte lokale regels
- Taal context

## Beveiliging

### Server-side

- API key nooit naar client
- Rate limiting per IP
- Input validatie en sanitization
- CORS configuratie

### Frontend

- Geen gevoelige data in gebouwde JS
- Fout-tolerant logging
- Gebruikersvriendelijke foutmeldingen

## Testing

### Acceptatiecriteria

1. ✅ Baan gevonden (< 3km): naam + afstand zichtbaar
2. ✅ Geen baan: duidelijke melding, geen OpenAI call
3. ✅ Geen local rules: prompt meldt dit
4. ✅ Out-of-scope vraag: exacte afwijzingszin
5. ✅ Prompt-injection: afwijzing
6. ✅ Logging aan/uit: records wel/niet aangemaakt
7. ✅ API key veilig: alleen via server-proxy
8. ✅ Rate limit/CORS: nette afwijzing

### Test Scenarios

```bash
# Test server health
curl http://localhost:3000/api/health

# Test Rafi API
curl -X POST http://localhost:3000/api/rafi \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Wat is de maximale hole lengte?",
    "courseId": "test_course_id",
    "courseName": "Test Baan",
    "localRules": [],
    "lang": "nl"
  }'
```

## Deployment

### Frontend

```bash
npm run build
```

### Backend

```bash
# Set environment variables
export OPENAI_API_KEY=your_key
export OPENAI_MODEL=gpt-4o-mini

# Start server
npm run start:server
```

## Troubleshooting

### Veelvoorkomende Problemen

1. **Geolocatie werkt niet**

   - Controleer browser permissies
   - Test op HTTPS (vereist voor geolocatie)

2. **Geen baan gevonden**

   - Controleer GPS coördinaten in PocketBase
   - Verhoog `maxDistanceMeters` in `useCourseLocator`

3. **OpenAI API fouten**

   - Controleer API key en model naam
   - Check rate limits en quota

4. **Chat logging werkt niet**
   - Controleer `VITE_RAFI_LOGGING=true`
   - Check PocketBase connectie

## Toekomstige Verbeteringen

- [ ] Handmatige baanselectie als GPS faalt
- [ ] Chat geschiedenis ophalen
- [ ] Voice input/output
- [ ] Regel-specifieke antwoorden met referenties
- [ ] Offline modus met cached regels
- [ ] Analytics dashboard voor chat gebruik
