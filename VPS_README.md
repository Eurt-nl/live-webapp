# VPS Deployment - Pitch & Putt Live

## 🚀 Snelle Start

Voor VPS gebruikers is dit de beste manier om de Rafi AI server te deployen:

### 1. Automatische Deployment

```bash
# Deploy naar je VPS (vervang user@your-vps.com)
npm run deploy:vps user@your-vps.com
```

### 2. Handmatige Setup

Zie de uitgebreide guide: [`src-pwa/express/VPS_DEPLOYMENT.md`](src-pwa/express/VPS_DEPLOYMENT.md)

## 📋 Vereisten

- VPS met Ubuntu/Debian
- Node.js 18+
- Caddy (als reverse proxy)
- Domain naam
- SSH toegang

## 🔧 Wat wordt geïnstalleerd

### Rafi Server

- Express.js server op poort 3000
- PM2 process manager
- Automatische restarts
- Logging en monitoring

### Caddy Configuratie

- Reverse proxy naar Rafi server
- SSL certificaten (Let's Encrypt)
- Security headers
- Gzip compressie

### Firewall

- UFW configuratie
- Alleen noodzakelijke poorten open
- Lokale toegang voor Rafi server

## 📁 Directory Structuur

```
/opt/rafi-server/          # Rafi server code
/var/log/rafi-server/      # Server logs
/var/www/pitch-putt-live/  # Frontend PWA bestanden
/etc/caddy/Caddyfile       # Caddy configuratie
```

## 🔍 Monitoring

### PM2 Commando's

```bash
# Status bekijken
pm2 status

# Logs bekijken
pm2 logs rafi-server

# Resources monitoren
pm2 monit

# Server herstarten
pm2 restart rafi-server
```

### Caddy Commando's

```bash
# Status bekijken
sudo systemctl status caddy

# Logs bekijken
sudo journalctl -u caddy -f

# Configuratie testen
sudo caddy validate --config /etc/caddy/Caddyfile

# Herladen
sudo systemctl reload caddy
```

## 🔒 Security

### Firewall Status

```bash
sudo ufw status
```

### SSL Certificaten

Caddy regelt automatisch SSL certificaten. Controleer status:

```bash
sudo caddy reload --config /etc/caddy/Caddyfile
```

## 📊 Performance

### Resource Monitoring

```bash
# PM2 monitoring
pm2 monit

# Systeem resources
htop

# Disk gebruik
df -h

# Memory gebruik
free -h
```

### Log Rotatie

Logs worden automatisch geroteerd via logrotate:

```bash
# Logrotate status
sudo logrotate -d /etc/logrotate.d/rafi-server
```

## 🔄 Updates

### Server Updates

```bash
# Ga naar server directory
cd /opt/rafi-server

# Pull updates
git pull origin main

# Installeer dependencies
npm install --production

# Herstart server
pm2 restart rafi-server
```

### Frontend Updates

```bash
# Upload nieuwe PWA bestanden
scp -r dist/pwa/* user@your-vps:/var/www/pitch-putt-live/

# Herlaad Caddy
sudo systemctl reload caddy
```

## 🛠️ Troubleshooting

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

Controleer de `ALLOWED_ORIGIN` in `/opt/rafi-server/.env`:

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

# Herstart als nodig
pm2 restart rafi-server
```

## 📞 Support

Voor vragen over VPS deployment:

1. Controleer de logs: `pm2 logs rafi-server`
2. Test endpoints handmatig
3. Controleer Caddy status: `sudo systemctl status caddy`
4. Controleer firewall: `sudo ufw status`

## 🎯 Voordelen van VPS Deployment

- ✅ **Volledige controle** over je server
- ✅ **Geen externe afhankelijkheden** van derden
- ✅ **Lagere kosten** op lange termijn
- ✅ **Betere privacy** en beveiliging
- ✅ **Geen rate limiting** van externe diensten
- ✅ **Custom configuratie** mogelijk
- ✅ **Betere performance** en uptime
- ✅ **Eenvoudige backups** en monitoring
