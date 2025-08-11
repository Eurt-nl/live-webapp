# Rafi Server Deployment

## Snelle Deployment naar Vercel

### 1. Voorbereiding

Zorg ervoor dat je in de `src-pwa/express` directory bent:

```bash
cd src-pwa/express
```

### 2. Vercel CLI installeren

```bash
npm install -g vercel
```

### 3. Deploy

```bash
vercel
```

Volg de instructies:

- Link naar bestaand project of maak nieuw project
- Stel de project naam in (bijv. "rafi-server")
- Bevestig de instellingen

### 4. Environment Variables instellen

Ga naar de Vercel dashboard en voeg deze environment variables toe:

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
ALLOWED_ORIGIN=*
RATE_LIMIT_MAX_PER_MIN=10
RULES_VERSION=1.0.0
NODE_ENV=production
```

### 5. Test de deployment

```bash
# Health check
curl https://your-project.vercel.app/api/health

# Test Rafi API
curl -X POST https://your-project.vercel.app/api/rafi \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Wat is de maximale hole lengte?",
    "courseId": "test_course_id",
    "courseName": "Test Baan",
    "localRules": [],
    "lang": "nl"
  }'
```

## Frontend Configuratie

Na de deployment, update de frontend environment variables:

```bash
# In de root .env file
VITE_API_BASE_URL=https://your-project.vercel.app/api
```

## Alternatieve Deployment Opties

### Railway

1. Ga naar [Railway.app](https://railway.app)
2. Connect je GitHub repository
3. Stel de root directory in naar `src-pwa/express`
4. Voeg environment variables toe
5. Deploy

### Heroku

1. Maak een Heroku app aan
2. Stel de buildpack in naar Node.js
3. Voeg environment variables toe
4. Deploy met Git:

```bash
heroku git:remote -a your-app-name
git push heroku main
```

### VPS/Server

1. Upload de `src-pwa/express` directory naar je server
2. Installeer Node.js en dependencies
3. Stel environment variables in
4. Start met PM2:

```bash
npm install -g pm2
pm2 start index.js --name "rafi-server"
pm2 save
pm2 startup
```

## Troubleshooting

### HTTP 405 Method Not Allowed

**Oorzaak**: Server niet gedeployed of verkeerde configuratie.

**Oplossing**:

1. Controleer of de server draait
2. Test de health endpoint
3. Controleer environment variables
4. Bekijk de logs in Vercel dashboard

### CORS Errors

**Oorzaak**: Verkeerde ALLOWED_ORIGIN setting.

**Oplossing**:

1. Stel `ALLOWED_ORIGIN` in op je frontend domain
2. Of gebruik `*` voor development

### OpenAI API Errors

**Oorzaak**: Ongeldige API key of quota bereikt.

**Oplossing**:

1. Controleer de `OPENAI_API_KEY`
2. Controleer je OpenAI account quota
3. Test de API key handmatig

## Monitoring

### Vercel Logs

- Ga naar de Vercel dashboard
- Selecteer je project
- Ga naar "Functions" tab
- Bekijk de logs voor elke API call

### Health Check

De server heeft een health endpoint voor monitoring:

```bash
curl https://your-project.vercel.app/api/health
```

Response:

```json
{
  "status": "ok",
  "version": "1.0.0",
  "fippaRulesVersion": "1.0.0",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Kosten

### Vercel

- **Hobby tier**: Gratis (100GB bandwidth/maand)
- **Pro tier**: $20/maand (1TB bandwidth/maand)

### OpenAI API

- **gpt-4o-mini**: ~$0.15 per 1M input tokens
- **Rate limiting**: 10 requests per minuut per IP

## Security

### Best Practices

1. **API Key**: Nooit in code, alleen in environment variables
2. **Rate Limiting**: Voorkom misbruik
3. **CORS**: Beperk toegestane origins
4. **Input Validation**: Valideer alle input
5. **Error Handling**: Geen gevoelige info in errors

### Environment Variables

- Gebruik altijd environment variables voor gevoelige data
- Nooit hardcoded API keys
- Gebruik verschillende keys voor development/production

## Support

Voor vragen over deployment:

1. Controleer de Vercel logs
2. Test endpoints handmatig
3. Controleer environment variables
4. Raadpleeg de troubleshooting sectie
