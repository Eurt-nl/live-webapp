# Rafi Server Setup

## Overzicht

De Rafi AI assistant bestaat uit twee delen:

1. **Frontend**: Quasar PWA op poort 9000 (HTTPS)
2. **Backend**: Express server op poort 3000 (HTTP)

De frontend communiceert met de backend via een proxy configuratie.

## Quick Start

### Optie 1: Alles in één keer starten (Aanbevolen)

```bash
npm run dev:full
```

Dit start zowel de Rafi server als de frontend automatisch.

### Optie 2: Apart starten

#### 1. Start de Rafi Server

```bash
npm run start:rafi
```

#### 2. Start de Frontend (in een andere terminal)

```bash
npm run dev
```

### 3. Test de Setup

Open https://localhost:9000 in je browser en ga naar de Rafi pagina.

## Configuratie

### Environment Variables

Zorg ervoor dat je `.env` file de volgende variabelen bevat:

```bash
# OpenAI configuratie
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# FIPPA Rules configuratie
RULES_VERSION=1.0.0
```

### Proxy Configuratie

De Quasar development server is geconfigureerd om `/api` requests door te sturen naar de Express server:

- Frontend: https://localhost:9000
- Backend: http://localhost:3000
- Proxy: `/api/*` → `http://localhost:3000/api/*`

## API Endpoints

### POST /api/rafi

Stel een vraag aan Rafi over Pitch & Putt regels.

**Request:**

```json
{
  "question": "Wat zijn de regels voor water hazards?",
  "courseId": "course-id",
  "courseName": "Baan naam (optioneel)",
  "localRules": [],
  "lang": "nl"
}
```

**Response:**

```json
{
  "answer": "Antwoord van Rafi..."
}
```

### GET /api/health

Health check endpoint.

### POST /api/reload-rules (development only)

Herlaad FIPPA regels zonder server restart.

## Troubleshooting

### 404 Error bij API calls

1. Controleer of de Express server draait: `curl http://localhost:3000/api/health`
2. Controleer of de Quasar server draait: `curl https://localhost:9000/api/health -k`
3. Herstart beide servers als nodig

### Passive Event Listener Warning

Dit is een Vue/Quasar waarschuwing die de functionaliteit niet beïnvloedt. De waarschuwing is opgelost in de devServer configuratie.

### CORS Errors

De proxy configuratie zou CORS problemen moeten voorkomen. Als je nog steeds CORS errors krijgt, controleer de `ALLOWED_ORIGIN` setting in de Express server.

## Development

### Express Server Logs

De Express server logt:

- FIPPA regels versie bij startup
- API requests met versie informatie
- Errors zonder gevoelige informatie

### FIPPA Regels

- Locatie: `src-pwa/express/rules/fippa_rules.md`
- Versie: Automatisch gegenereerd of via `RULES_VERSION` env var
- Reload: Via `/api/reload-rules` endpoint

## Production

Voor productie deployment:

1. Configureer de Express server voor productie
2. Stel de juiste environment variables in
3. Configureer een reverse proxy (nginx/apache)
4. Stel SSL certificaten in
5. Configureer monitoring en logging
