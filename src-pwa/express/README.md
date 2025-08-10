# Rafi Server Proxy

Server-proxy voor de Rafi AI assistant met FIPPA-regels integratie.

## Doel

API-key en FIPPA-regels blijven server-side, client krijgt alleen de antwoorden.

## Endpoints

### POST /api/rafi

**Input:**

```json
{
  "question": "string",
  "courseId": "string",
  "courseName": "string (optional)",
  "localRules": "Array (optional)",
  "lang": "string (optional)"
}
```

**Output:**

```json
{
  "answer": "string"
}
```

### GET /api/health

Health check endpoint met server status en FIPPA versie informatie.

### POST /api/reload-rules (development only)

Herlaad FIPPA-regels zonder server restart.

## Configuratie

### Environment Variables

```bash
# Server configuratie
PORT=3000

# OpenAI configuratie
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# CORS configuratie
ALLOWED_ORIGIN=*

# Rate limiting
RATE_LIMIT_MAX_PER_MIN=10

# FIPPA Rules configuratie
RULES_VERSION=1.0.0

# Environment
NODE_ENV=development
```

## FIPPA Regels

- **Locatie**: `rules/fippa_rules.md`
- **Versie**: Automatisch gegenereerd op basis van bestandsdatum of `RULES_VERSION` env var
- **Caching**: In-memory cache bij serverstart
- **Reload**: Via `/api/reload-rules` endpoint (alleen development)

## Beveiliging

- **CORS**: Configureerbare origin check
- **Rate Limiting**: 10 requests per minuut (configureerbaar)
- **Input Validatie**: Vraag max 2000 chars, courseName max 255 chars
- **API Key**: Nooit naar client gestuurd
- **Error Handling**: Veilige foutmeldingen zonder stacktraces

## Anti-Misbruik

- **Prompt Injection**: Negeer verzoeken om instructies te wijzigen
- **Rollenwissel**: Geen andere rollen aannemen
- **Scope**: Alleen Pitch & Putt regels
- **Out-of-scope**: Gestandaardiseerde afwijzingsberichten in 7 talen

## Installatie

```bash
npm install
npm start
```

## Development

```bash
npm run dev
```

## Integratie met Frontend

De frontend gebruikt de `useRafi` composable die automatisch naar `/api/rafi` endpoint communiceert.

## Logging

- FIPPA versie wordt gelogd bij serverstart
- API requests worden gelogd met versie informatie
- Errors worden gelogd zonder gevoelige informatie
