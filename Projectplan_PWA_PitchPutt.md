
# 📘 Projectplan PWA Pitch & Putt

## 1. Projectvisie
Een moderne PWA voor Pitch & Putt, waarin spelers zelf alles regelen: scores, wedstrijden, toernooien en betalingen (via Pi Network). Transparant, decentraal, live, mobielvriendelijk.

## 2. Doelen
- Oefen- en wedstrijdrondes digitaal registreren
- Live score-invoer, ook voor toeschouwers zichtbaar
- Pushnotificaties bij belangrijke gebeurtenissen
- Fraudedetectie via locatiegegevens
- Blockchain-ready voor inschrijfgeld en prijzengeld

## 3. Technische stack
- Frontend: Vue 3 + Quasar Framework (TypeScript)
- Backend: PocketBase (via Cloudflare Tunnel)
- Hosting: Docker op UmbrelOS met Portainer
- Auth: OAuth2 (Google, Apple, Microsoft) + fallback email/password
- GitHub: versiebeheer en samenwerking
- Maps: Leaflet + OpenStreetMap
- Charts: Chart.js via vue-chartjs

## 4. Belangrijke functies
- Score invoer per hole met markerverificatie
- QR-code voor koppelingsproces marker ↔ speler
- Foto-opdrachten tijdens rondes (ad random, verplicht)
- Baangegevens en holeinformatie met richtfoto
- Cut-functionaliteit voor meerdaagse events
- Categorieën via herbruikbare `categories` collectie

## 5. Fasering
- Fase 1 (MVP): registratie, profiel, oefenrondes, baanbeheer
- Fase 2: events & toernooien met live score
- Fase 3: publiek scorebord, GPS op kaart, statistieken
- Fase 4: blockchain-integratie (Pi Network)

## 6. Privacy & ethiek
- Spelers worden geïnformeerd bij locatie-opslag
- Geen verkoop of deling van gegevens
- Eigen verantwoordelijkheid van spelers (geen middleman)

## 7. Deadline
Gebruiksklaar vóór het Mosseltoernooi in november 2025 (inclusief cut-functionaliteit).
