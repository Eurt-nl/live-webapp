# VPS Deployment Guide - Rafi Server met Caddy

## Overzicht

Deze guide beschrijft hoe je de Rafi AI server kunt installeren op je eigen VPS met Caddy als reverse proxy.

## Vereisten

- VPS met Ubuntu/Debian
- Node.js 18+ geïnstalleerd
- Caddy geïnstalleerd
- Domain naam geconfigureerd
- SSH toegang tot je VPS

## Stap 1: VPS Voorbereiding

### 1.1 Update je systeem

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Installeer Node.js 18+

```bash
# Voeg NodeSource repository toe
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Installeer Node.js
sudo apt install -y nodejs

# Controleer versie
node --version
npm --version
```

### 1.3 Installeer PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 1.4 Installeer Caddy (als nog niet geïnstalleerd)

```bash
# Voeg Caddy repository toe
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list

# Installeer Caddy
sudo apt update
sudo apt install caddy

# Start en enable Caddy
sudo systemctl enable caddy
sudo systemctl start caddy
```

## Stap 2: Rafi Server Installatie

### 2.1 Maak directory aan

```bash
# Maak directory voor de app
sudo mkdir -p /opt/rafi-server
sudo chown $USER:$USER /opt/rafi-server
cd /opt/rafi-server
```

### 2.2 Upload server bestanden

Je hebt twee opties:

#### Optie A: Via Git (Aanbevolen)

```bash
# Clone je repository
git clone https://github.com/your-username/your-repo.git .
# Of als je een private repo hebt:
git clone https://username:token@github.com/your-username/your-repo.git .

# Ga naar de express directory
cd src-pwa/express
```

#### Optie B: Via SCP

```bash
# Van je lokale machine naar VPS
scp -r src-pwa/express/* user@your-vps:/opt/rafi-server/
```

### 2.3 Installeer dependencies

```bash
# Installeer dependencies
npm install --production
```

### 2.4 Maak environment file aan

```bash
# Maak .env bestand aan
nano .env
```

Voeg de volgende inhoud toe:

```bash
# Server configuratie
PORT=3000
NODE_ENV=production

# OpenAI configuratie
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# CORS configuratie
ALLOWED_ORIGIN=https://your-domain.com

# Rate limiting
RATE_LIMIT_MAX_PER_MIN=10

# FIPPA Rules configuratie
RULES_VERSION=1.0.0
```

### 2.5 Test de server

```bash
# Test de server lokaal
npm start

# In een andere terminal, test de health endpoint
curl http://localhost:3000/api/health
```

Als alles werkt, stop de server met `Ctrl+C`.

## Stap 3: PM2 Configuratie

### 3.1 Maak PM2 configuratie bestand

```bash
nano ecosystem.config.js
```

Voeg de volgende inhoud toe:

```javascript
module.exports = {
  apps: [
    {
      name: 'rafi-server',
      script: 'index.js',
      cwd: '/opt/rafi-server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_file: '.env',
      log_file: '/var/log/rafi-server/combined.log',
      out_file: '/var/log/rafi-server/out.log',
      error_file: '/var/log/rafi-server/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

### 3.2 Maak log directory

```bash
sudo mkdir -p /var/log/rafi-server
sudo chown $USER:$USER /var/log/rafi-server
```

### 3.3 Start de server met PM2

```bash
# Start de server
pm2 start ecosystem.config.js

# Sla de configuratie op
pm2 save

# Configureer PM2 om automatisch te starten bij boot
pm2 startup

# Volg de instructies die PM2 geeft
# Meestal moet je een commando uitvoeren zoals:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 3.4 Controleer status

```bash
# Bekijk status
pm2 status

# Bekijk logs
pm2 logs rafi-server

# Test de server
curl http://localhost:3000/api/health
```

## Stap 4: Caddy Configuratie

### 4.1 Maak Caddyfile aan

```bash
sudo nano /etc/caddy/Caddyfile
```

Voeg de volgende configuratie toe:

```caddy
# Vervang 'your-domain.com' met je eigen domain
your-domain.com {
    # Reverse proxy naar Rafi server
    handle /api/* {
        reverse_proxy localhost:3000
    }

    # Serveer de frontend PWA bestanden
    handle /* {
        root * /var/www/pitch-putt-live
        try_files {path} /index.html
        file_server
    }

    # Security headers
    header {
        # HSTS
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        # XSS Protection
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        X-XSS-Protection "1; mode=block"
        # Referrer Policy
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Gzip compressie
    encode gzip

    # Logs
    log {
        output file /var/log/caddy/your-domain.com.log
        format json
    }
}

# Optioneel: www subdomain redirect
www.your-domain.com {
    redir https://your-domain.com{uri} permanent
}
```

### 4.2 Test Caddy configuratie

```bash
# Test de configuratie
sudo caddy validate --config /etc/caddy/Caddyfile

# Herlaad Caddy
sudo systemctl reload caddy
```

### 4.3 Controleer Caddy status

```bash
# Controleer status
sudo systemctl status caddy

# Bekijk logs
sudo journalctl -u caddy -f
```

## Stap 5: SSL Certificaat

Caddy regelt automatisch SSL certificaten via Let's Encrypt. Als je problemen hebt:

```bash
# Controleer Caddy logs
sudo journalctl -u caddy -f

# Forceer SSL certificaat vernieuwing
sudo caddy reload --config /etc/caddy/Caddyfile
```

## Stap 6: Firewall Configuratie

### 6.1 Configureer UFW

```bash
# Sta SSH toe
sudo ufw allow ssh

# Sta HTTP en HTTPS toe
sudo ufw allow 80
sudo ufw allow 443

# Sta alleen lokale toegang toe voor de Rafi server
sudo ufw allow from 127.0.0.1 to any port 3000

# Enable firewall
sudo ufw enable

# Controleer status
sudo ufw status
```

## Stap 7: Frontend Deployment

### 7.1 Upload PWA bestanden

```bash
# Maak directory voor de frontend
sudo mkdir -p /var/www/pitch-putt-live
sudo chown $USER:$USER /var/www/pitch-putt-live

# Upload je PWA build bestanden
# Van je lokale machine:
scp -r dist/pwa/* user@your-vps:/var/www/pitch-putt-live/
```

### 7.2 Update frontend configuratie

Zorg ervoor dat je frontend de juiste API URL gebruikt. In je `.env` file:

```bash
VITE_API_BASE_URL=https://your-domain.com/api
```

## Stap 8: Testing

### 8.1 Test de Rafi server

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

### 8.2 Test de frontend

1. Open https://your-domain.com in je browser
2. Ga naar de Rafi pagina
3. Test de chat functionaliteit
4. Controleer of er geen 405 fouten zijn

## Stap 9: Monitoring en Onderhoud

### 9.1 PM2 Monitoring

```bash
# Bekijk status
pm2 status

# Bekijk logs
pm2 logs rafi-server

# Monitor resources
pm2 monit

# Restart server
pm2 restart rafi-server
```

### 9.2 Caddy Monitoring

```bash
# Bekijk Caddy status
sudo systemctl status caddy

# Bekijk logs
sudo journalctl -u caddy -f

# Test configuratie
sudo caddy validate --config /etc/caddy/Caddyfile
```

### 9.3 Log Rotatie

```bash
# Maak logrotate configuratie
sudo nano /etc/logrotate.d/rafi-server
```

Voeg toe:

```
/var/log/rafi-server/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

## Stap 10: Updates

### 10.1 Server Updates

```bash
# Ga naar server directory
cd /opt/rafi-server

# Pull updates
git pull origin main

# Installeer nieuwe dependencies
npm install --production

# Restart server
pm2 restart rafi-server
```

### 10.2 Frontend Updates

```bash
# Upload nieuwe PWA bestanden
scp -r dist/pwa/* user@your-vps:/var/www/pitch-putt-live/

# Herlaad Caddy
sudo systemctl reload caddy
```

## Troubleshooting

### Server start niet

```bash
# Bekijk PM2 logs
pm2 logs rafi-server

# Controleer environment variables
pm2 env rafi-server

# Test handmatig
cd /opt/rafi-server
npm start
```

### CORS Errors

Controleer de `ALLOWED_ORIGIN` in je `.env` file:

```bash
ALLOWED_ORIGIN=https://your-domain.com
```

### SSL Problemen

```bash
# Controleer Caddy logs
sudo journalctl -u caddy -f

# Forceer certificaat vernieuwing
sudo caddy reload --config /etc/caddy/Caddyfile
```

### Performance Issues

```bash
# Monitor resources
pm2 monit

# Bekijk memory gebruik
pm2 show rafi-server

# Restart als nodig
pm2 restart rafi-server
```

## Security Best Practices

1. **Firewall**: Alleen noodzakelijke poorten open
2. **Updates**: Regelmatig systeem updates
3. **Logs**: Monitor logs voor verdachte activiteit
4. **Backups**: Maak regelmatig backups
5. **SSL**: Gebruik altijd HTTPS
6. **Rate Limiting**: Voorkom misbruik

## Backup Strategie

```bash
# Maak backup script
nano /opt/backup-rafi.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/rafi-$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR

# Backup server code
cp -r /opt/rafi-server $BACKUP_DIR/

# Backup logs
cp -r /var/log/rafi-server $BACKUP_DIR/

# Backup Caddy config
cp /etc/caddy/Caddyfile $BACKUP_DIR/

# Compress backup
tar -czf $BACKUP_DIR.tar.gz $BACKUP_DIR
rm -rf $BACKUP_DIR

echo "Backup created: $BACKUP_DIR.tar.gz"
```

```bash
chmod +x /opt/backup-rafi.sh

# Voeg toe aan crontab voor dagelijkse backups
crontab -e
# Voeg toe: 0 2 * * * /opt/backup-rafi.sh
```

## Support

Voor vragen over VPS deployment:

1. Controleer de logs: `pm2 logs rafi-server`
2. Test endpoints handmatig
3. Controleer Caddy status: `sudo systemctl status caddy`
4. Controleer firewall: `sudo ufw status`
