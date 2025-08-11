#!/bin/bash

# VPS Deployment Script voor Rafi Server
# Gebruik: ./scripts/deploy-vps.sh user@your-vps.com

set -e

# Kleuren voor output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functie voor gekleurde output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Controleer argumenten
if [ $# -eq 0 ]; then
    print_error "Geef de VPS SSH connectie op: ./scripts/deploy-vps.sh user@your-vps.com"
    exit 1
fi

VPS_HOST=$1
EXPRESS_DIR="src-pwa/express"

print_status "🚀 Start VPS deployment voor Rafi Server"
print_status "VPS: $VPS_HOST"

# Controleer of express directory bestaat
if [ ! -d "$EXPRESS_DIR" ]; then
    print_error "Express directory niet gevonden: $EXPRESS_DIR"
    exit 1
fi

# Controleer of ecosystem.config.js bestaat
if [ ! -f "$EXPRESS_DIR/ecosystem.config.js" ]; then
    print_error "ecosystem.config.js niet gevonden in $EXPRESS_DIR"
    exit 1
fi

print_status "📦 Voorbereiden van bestanden..."

# Maak een tijdelijke directory voor deployment
TEMP_DIR=$(mktemp -d)
DEPLOY_DIR="$TEMP_DIR/rafi-server"

# Kopieer express bestanden
cp -r "$EXPRESS_DIR" "$DEPLOY_DIR"

# Verwijder node_modules als die bestaat (wordt opnieuw geïnstalleerd)
if [ -d "$DEPLOY_DIR/node_modules" ]; then
    rm -rf "$DEPLOY_DIR/node_modules"
fi

print_status "📤 Uploaden naar VPS..."

# Upload bestanden naar VPS
ssh "$VPS_HOST" "sudo mkdir -p /opt/rafi-server && sudo chown \$(whoami):\$(whoami) /opt/rafi-server"
scp -r "$DEPLOY_DIR"/* "$VPS_HOST:/opt/rafi-server/"

print_status "🔧 Installeren van dependencies..."

# Installeer dependencies op VPS
ssh "$VPS_HOST" "cd /opt/rafi-server && npm install --production"

print_status "📝 Controleer environment configuratie..."

# Controleer of .env bestand bestaat op VPS
if ! ssh "$VPS_HOST" "test -f /opt/rafi-server/.env"; then
    print_warning ".env bestand niet gevonden op VPS"
    print_status "Maak een .env bestand aan op de VPS met de volgende variabelen:"
    echo ""
    echo "PORT=3000"
    echo "NODE_ENV=production"
    echo "OPENAI_API_KEY=your_openai_api_key_here"
    echo "OPENAI_MODEL=gpt-4o-mini"
    echo "ALLOWED_ORIGIN=https://your-domain.com"
    echo "RATE_LIMIT_MAX_PER_MIN=10"
    echo "RULES_VERSION=1.0.0"
    echo ""
    print_status "Voer uit op de VPS: nano /opt/rafi-server/.env"
fi

print_status "📁 Maken van log directory..."

# Maak log directory
ssh "$VPS_HOST" "sudo mkdir -p /var/log/rafi-server && sudo chown \$(whoami):\$(whoami) /var/log/rafi-server"

print_status "🚀 Starten van server met PM2..."

# Start server met PM2
ssh "$VPS_HOST" "cd /opt/rafi-server && pm2 start ecosystem.config.js"

print_status "💾 Opslaan van PM2 configuratie..."

# Sla PM2 configuratie op
ssh "$VPS_HOST" "pm2 save"

print_status "🔍 Testen van server..."

# Test de server
if ssh "$VPS_HOST" "curl -s http://localhost:3000/api/health"; then
    print_success "Server draait succesvol!"
else
    print_warning "Server test gefaald, controleer de logs"
fi

print_status "📊 PM2 status:"
ssh "$VPS_HOST" "pm2 status"

print_status "📋 Volgende stappen:"
echo ""
echo "1. Configureer Caddy als reverse proxy:"
echo "   sudo nano /etc/caddy/Caddyfile"
echo ""
echo "2. Voeg toe aan Caddyfile:"
echo "   your-domain.com {"
echo "       handle /api/* {"
echo "           reverse_proxy localhost:3000"
echo "       }"
echo "       # ... rest van je configuratie"
echo "   }"
echo ""
echo "3. Herlaad Caddy:"
echo "   sudo systemctl reload caddy"
echo ""
echo "4. Test de API:"
echo "   curl https://your-domain.com/api/health"
echo ""
echo "5. Update je frontend .env:"
echo "   VITE_API_BASE_URL=https://your-domain.com/api"
echo ""

print_status "🔧 Handige commando's:"
echo ""
echo "Bekijk logs:"
echo "  ssh $VPS_HOST 'pm2 logs rafi-server'"
echo ""
echo "Restart server:"
echo "  ssh $VPS_HOST 'pm2 restart rafi-server'"
echo ""
echo "Bekijk status:"
echo "  ssh $VPS_HOST 'pm2 status'"
echo ""
echo "Monitor resources:"
echo "  ssh $VPS_HOST 'pm2 monit'"
echo ""

# Cleanup
rm -rf "$TEMP_DIR"

print_success "✅ VPS deployment voltooid!" 