# Deployment & PWA Build Handleiding

## 📋 Snelle Commando's

### 1. **GitHub bijwerken**

```bash
# Voeg alle wijzigingen toe
git add .

# Commit met beschrijvende boodschap
git commit -m "feat: slide-in score invoer met +/- knoppen voor putts/chips"

# Push naar GitHub
git push origin main
```

### 2. **PWA Build maken**

```bash
# PWA build genereren
quasar build -m pwa

# Build testen (optioneel)
quasar serve
```

### 3. **Deploy naar server**

```bash
# Kopieer build bestanden naar server
# (Vervang 'server-path' met je eigen server pad)
scp -r dist/pwa/* user@server:/path/to/webapp/
```

---

## 🔄 Volledige Workflow

### **Stap 1: Code controleren**

```bash
# Controleer status
git status

# Bekijk wijzigingen
git diff
```

### **Stap 2: Testen**

```bash
# Start development server
quasar dev

# Test in browser op https://localhost:9001/
```

### **Stap 3: Commit & Push**

```bash
# Voeg wijzigingen toe
git add .

# Commit met conventional commit format
git commit -m "feat: slide-in score invoer met +/- knoppen voor putts/chips"

# Push naar GitHub
git push origin main
```

### **Stap 4: PWA Build**

```bash
# Maak productie build
quasar build -m pwa

# Build wordt opgeslagen in: dist/pwa/
```

### **Stap 5: Deploy**

```bash
# Kopieer bestanden naar server
# (Pas server details aan)
scp -r dist/pwa/* user@your-server.com:/var/www/html/
```

---

## 📝 Conventional Commits

Gebruik deze format voor commit berichten:

- `feat:` - Nieuwe functionaliteit
- `fix:` - Bug fix
- `docs:` - Documentatie wijzigingen
- `style:` - Code formatting
- `refactor:` - Code refactoring
- `test:` - Test toevoegingen
- `chore:` - Build/tool wijzigingen

**Voorbeelden:**

```bash
git commit -m "feat: slide-in score invoer met +/- knoppen"
git commit -m "fix: score validatie in slide-in paneel"
git commit -m "style: compactere layout voor score invoer"
```

---

## 🚀 PWA Build Details

### **Build output:**

- **Locatie:** `dist/pwa/`
- **Bestanden:** HTML, CSS, JS, assets, manifest.json, service worker
- **Grootte:** ~2-5MB (afhankelijk van assets)

### **PWA features:**

- ✅ Offline functionaliteit
- ✅ App installatie mogelijk
- ✅ Service worker caching
- ✅ Manifest voor app-achtige ervaring

### **Build optimalisaties:**

- Code splitting
- Asset minificatie
- Tree shaking
- Service worker caching

---

## 🔧 Troubleshooting

### **Build errors:**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Rebuild
quasar build -m pwa
```

### **Git issues:**

```bash
# Reset laatste commit (voorzichtig!)
git reset --soft HEAD~1

# Force push (alleen als nodig)
git push --force-with-lease origin main
```

### **Server deployment:**

```bash
# Check server status
ssh user@server "systemctl status nginx"

# Restart webserver
ssh user@server "sudo systemctl restart nginx"
```

---

## 📱 PWA Testing

### **Lokaal testen:**

```bash
# Start preview server
quasar serve

# Open: http://localhost:4173/
```

### **PWA checklist:**

- [ ] App kan geïnstalleerd worden
- [ ] Werkt offline
- [ ] Service worker actief
- [ ] Manifest correct geladen
- [ ] Icons zichtbaar

---

## 🎯 Snelle Commando's (Copy/Paste)

```bash
# Volledige deployment in één keer
git add . && git commit -m "feat: slide-in score invoer met +/- knoppen" && git push origin main && quasar build -m pwa
```

**Resultaat:** Code gepusht naar GitHub + PWA build klaar in `dist/pwa/`
