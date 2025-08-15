#!/bin/bash

# Frontend Deployment Script
# Gebruik: ./scripts/deploy-frontend.sh user@your-vps.com

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
    print_error "Geef de VPS SSH connectie op: ./scripts/deploy-frontend.sh user@your-vps.com"
    exit 1
fi

VPS_HOST=$1
BUILD_DIR="dist/spa"
REMOTE_DIR="/var/www/pitch-putt-live"

print_status "🚀 Start Frontend Deployment"
print_status "VPS: $VPS_HOST"
print_status "Build directory: $BUILD_DIR"
print_status "Remote directory: $REMOTE_DIR"

# Controleer of build directory bestaat
if [ ! -d "$BUILD_DIR" ]; then
    print_error "Build directory niet gevonden: $BUILD_DIR"
    print_status "Voer eerst 'npm run build' uit"
    exit 1
fi

# Controleer of er bestanden zijn in de build directory
if [ -z "$(ls -A $BUILD_DIR)" ]; then
    print_error "Build directory is leeg: $BUILD_DIR"
    print_status "Voer eerst 'npm run build' uit"
    exit 1
fi

print_status "📦 Voorbereiden van deployment..."

# Maak backup van huidige bestanden op server
print_status "💾 Backup maken van huidige bestanden..."
ssh "$VPS_HOST" "sudo mkdir -p $REMOTE_DIR.backup && sudo cp -r $REMOTE_DIR/* $REMOTE_DIR.backup/ 2>/dev/null || true"

print_status "📤 Uploaden van nieuwe bestanden..."

# Upload nieuwe bestanden naar VPS
ssh "$VPS_HOST" "sudo mkdir -p $REMOTE_DIR && sudo chown \$(whoami):\$(whoami) $REMOTE_DIR"
scp -r "$BUILD_DIR"/* "$VPS_HOST:$REMOTE_DIR/"

print_status "🔧 Instellen van juiste permissies..."

# Stel juiste permissies in
ssh "$VPS_HOST" "sudo chown -R www-data:www-data $REMOTE_DIR && sudo chmod -R 755 $REMOTE_DIR"

print_status "🔄 Herladen van Caddy..."

# Herlaad Caddy om de nieuwe bestanden te serveren
ssh "$VPS_HOST" "sudo systemctl reload caddy"

print_status "🔍 Testen van deployment..."

# Test of de hoofdpagina correct wordt geladen
if ssh "$VPS_HOST" "curl -s -o /dev/null -w '%{http_code}' http://localhost" | grep -q "200"; then
    print_success "Deployment succesvol!"
else
    print_warning "Deployment test gefaald, controleer de logs"
fi

print_status "📊 Caddy status:"
ssh "$VPS_HOST" "sudo systemctl status caddy --no-pager -l"

print_status "📋 Volgende stappen:"
echo ""
echo "1. Test de applicatie in je browser:"
echo "   https://your-domain.com"
echo ""
echo "2. Controleer of er geen JavaScript fouten zijn in de console"
echo ""
echo "3. Als er problemen zijn, herstel de backup:"
echo "   ssh $VPS_HOST 'sudo cp -r $REMOTE_DIR.backup/* $REMOTE_DIR/'"
echo ""

print_success "✅ Frontend deployment voltooid!"
