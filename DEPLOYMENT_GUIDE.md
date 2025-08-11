# Deployment Guide

## Overzicht

Deze guide beschrijft hoe je de Pitch & Putt Live app en de Rafi AI server kunt deployen. **Voor eigen VPS gebruikers wordt de VPS deployment sterk aanbevolen.**

## Frontend Deployment

### 1. Build de PWA

```bash
npm run build:pwa
```

### 2. Deploy naar hosting provider

De gebouwde PWA staat in `dist/pwa/` en kan worden gedeployed naar:

- Netlify
- Vercel
- GitHub Pages
- Of elke andere statische hosting provider

## Rafi Server Deployment

### Probleem: HTTP 405 Method Not Allowed

De Rafi server moet apart worden gedeployed om de AI functionaliteit te laten werken. Zonder de server krijg je een 405 fout bij het gebruik van de Rafi chat.

## 🏆 Aanbevolen: VPS Deployment (met Caddy)

**Voor gebruikers met een eigen VPS is dit de beste oplossing:**

### Snelle VPS Deployment

```bash
# Deploy naar je VPS (vervang user@your-vps.com)
npm run deploy:vps user@your-vps.com
```

### Handmatige VPS Setup

Zie de uitgebreide guide: [`src-pwa/express/VPS_DEPLOYMENT.md`](src-pwa/express/VPS_DEPLOYMENT.md)

**Voordelen van VPS deployment:**

- ✅ Volledige controle over je server
- ✅ Geen externe afhankelijkheden
- ✅ Lagere kosten op lange termijn
- ✅ Betere privacy en beveiliging
- ✅ Geen rate limiting van externe diensten

## 🔄 Alternatief: Externe Diensten

### Optie 1: Deploy naar Vercel

1. **Maak een nieuwe Vercel project aan**

```bash
# Ga naar de express server directory
cd src-pwa/express

# Maak een package.json aan als deze niet bestaat
npm init -y

# Installeer dependencies
npm install express cors dotenv express-rate-limit
```

2. **Maak een vercel.json configuratie**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

3. **Deploy naar Vercel**

```bash
# Installeer Vercel CLI
npm i -g vercel

# Deploy
vercel

# Volg de instructies en stel environment variables in
```

4. **Stel environment variables in**

In de Vercel dashboard:

- `OPENAI_API_KEY`: Je OpenAI API key
- `OPENAI_MODEL`: gpt-4o-mini (of gewenste model)
- `ALLOWED_ORIGIN`: \* (of specifieke domain)
- `RATE_LIMIT_MAX_PER_MIN`: 10

### Optie 2: Deploy naar Railway

1. Maak een Railway account aan
2. Connect je GitHub repository
3. Stel de root directory in naar `src-pwa/express`
4. Voeg environment variables toe
5. Deploy

### Optie 3: Deploy naar Heroku

1. Maak een Heroku app aan
2. Stel de buildpack in naar Node.js
3. Voeg environment variables toe
4. Deploy

## Environment Variables

### Frontend (.env)

```bash
VITE_PB_URL=https://pb.pitch-putt.live
VITE_API_BASE_URL=https://your-domain.com/api
VITE_RAFI_LOGGING=false
```

### Backend (Server Environment Variables)

```bash
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
ALLOWED_ORIGIN=*
RATE_LIMIT_MAX_PER_MIN=10
RULES_VERSION=1.0.0
NODE_ENV=production
```

## Testing na Deployment

### 1. Test de Rafi Server

```bash
# Health check
curl https://your-domain.com/api/health

# Test Rafi API
curl -X POST https://your-domain.com/api/rafi \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Wat is de maximale hole lengte?",
    "courseId": "test_course_id",
    "courseName": "Test Baan",
    "localRules": [],
    "lang": "nl"
  }'
```

### 2. Test de Frontend

1. Open de gedeployde app
2. Ga naar de Rafi pagina
3. Test de chat functionaliteit
4. Controleer of er geen 405 fouten zijn

## Troubleshooting

### HTTP 405 Method Not Allowed

**Oorzaak**: De Rafi server is niet gedeployed of niet bereikbaar.

**Oplossing**:

1. Controleer of de Rafi server draait
2. Controleer de `VITE_API_BASE_URL` in de frontend
3. Test de server endpoints handmatig
4. Controleer CORS configuratie

### CORS Errors

**Oorzaak**: De server staat geen requests toe van de frontend domain.

**Oplossing**:

1. Stel `ALLOWED_ORIGIN` in op het juiste domain
2. Of gebruik `*` voor development

### OpenAI API Errors

**Oorzaak**: Ongeldige API key of quota bereikt.

**Oplossing**:

1. Controleer de `OPENAI_API_KEY`
2. Controleer je OpenAI account quota
3. Test de API key handmatig

## Monitoring

### Logs

- **Vercel**: Automatische logging in dashboard
- **Railway**: Logs beschikbaar in dashboard
- **Heroku**: `heroku logs --tail`
- **VPS**: `pm2 logs` of `journalctl -u rafi-server`

### Health Checks

De server heeft een `/api/health` endpoint die je kunt gebruiken voor monitoring:

```bash
curl https://your-domain.com/api/health
```

## Security

### Best Practices

1. **API Key**: Nooit in frontend code
2. **Rate Limiting**: Voorkom misbruik
3. **CORS**: Beperk toegestane origins
4. **Input Validation**: Valideer alle input
5. **Error Handling**: Geen gevoelige info in errors

### Environment Variables

- Gebruik altijd environment variables voor gevoelige data
- Nooit hardcoded API keys
- Gebruik verschillende keys voor development/production

## Kosten

### OpenAI API

- **gpt-4o-mini**: ~$0.15 per 1M input tokens
- **gpt-4o**: ~$5 per 1M input tokens
- **Rate limiting**: 10 requests per minuut per IP

### Hosting

- **VPS**: Vanaf $5/maand (aanbevolen)
- **Vercel**: Gratis tier beschikbaar
- **Railway**: $5/maand voor hobby tier
- **Heroku**: $7/maand voor hobby tier

## Support

Voor vragen over deployment:

1. Controleer de logs
2. Test endpoints handmatig
3. Controleer environment variables
4. Raadpleeg de troubleshooting sectie
