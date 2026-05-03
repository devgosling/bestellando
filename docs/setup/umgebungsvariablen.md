# Umgebungsvariablen

Die Konfiguration erfolgt über `.env`-Dateien. Es gibt zwei separate Sets — eines für die API und eines für das Web-Frontend.

## API: `apps/api/.env`

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `PORT` | Port, auf dem der NestJS-Server läuft | `3000` |
| `APPWRITE_ENDPOINT` | URL des Appwrite-Servers | `https://cloud.appwrite.io/v1` |
| `APPWRITE_PROJECT_ID` | Projekt-ID aus dem Appwrite-Dashboard | `66abc...` |
| `APPWRITE_API_KEY` | Server-API-Key (Server-Side Admin) | `standard_...` |
| `DATABASE_ID` | ID der Datenbank in Appwrite | `66def...` |
| `JWT_SECRET` | Secret für Server-seitige JWT-Validierung (Passport) | `eine-lange-zufaellige-zeichenkette` |
| `STRIPE_SECRET_KEY` | Stripe Secret Key (Test oder Live) | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook-Signatur-Secret aus Stripe | `whsec_...` |
| `STRIPE_SUCCESS_URL` | Redirect-URL nach erfolgreicher Zahlung | `http://localhost:5173/orders/{ORDER_ID}?paid=true` |
| `STRIPE_CANCEL_URL` | Redirect-URL bei Abbruch | `http://localhost:5173/orders/{ORDER_ID}?cancelled=true` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API-Key (Geocoding & Maps) | `AIza...` |
| `CORS_ORIGIN` | Erlaubte CORS-Origin für Web | `http://localhost:5173` |

### Appwrite-API-Key Berechtigungen

Der `APPWRITE_API_KEY` benötigt mindestens folgende Scopes:

- `users.read`, `users.write`
- `teams.read`, `teams.write`
- `databases.read`, `databases.write`
- `tables.read`, `tables.write`
- `rows.read`, `rows.write`
- `files.read`, `files.write` (für Proof-Bilder bei Lieferung)

## Web: `apps/web/.env`

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `VITE_API_URL` | URL des API-Backends | `http://localhost:3000` |
| `VITE_APPWRITE_ENDPOINT` | URL des Appwrite-Servers | `https://cloud.appwrite.io/v1` |
| `VITE_APPWRITE_PROJECT_ID` | Identisch zur API-Konfiguration | `66abc...` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key | `pk_test_...` |
| `VITE_GOOGLE_MAPS_API_KEY` | Optional, falls direkt vom Frontend genutzt | `AIza...` |

> **Wichtig:** Vite erkennt nur Variablen mit dem Prefix `VITE_`. Alle anderen werden zur Buildzeit nicht ins Bundle eingebunden.

## Sicherheit

- ✅ `.env` gehört in `.gitignore` und darf **niemals** committed werden
- ✅ `STRIPE_SECRET_KEY`, `APPWRITE_API_KEY` und `GOOGLE_MAPS_API_KEY` sind serverseitige Geheimnisse
- ❌ **Nie** Secret-Keys ins Frontend übertragen — Vite kompiliert `VITE_*` ins Browser-Bundle, wo sie für jeden lesbar sind
- ✅ Stripe-Webhook-Secret prüfen, um gefälschte Webhook-Requests abzuwehren

## Beispiel `.env` für die API (vollständig)

```env
PORT=3000

# Appwrite
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=66abc1234567890abcdef
APPWRITE_API_KEY=standard_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_ID=66def1234567890abcdef

# JWT (Passport-Strategie)
JWT_SECRET=ein-extrem-langes-zufaelliges-secret-mit-mindestens-32-zeichen

# Stripe
STRIPE_SECRET_KEY=sk_test_51A...
STRIPE_WEBHOOK_SECRET=whsec_a1b2c3d4...
STRIPE_SUCCESS_URL=http://localhost:5173/orders/{ORDER_ID}?paid=true
STRIPE_CANCEL_URL=http://localhost:5173/orders/{ORDER_ID}?cancelled=true

# Google Maps Geocoding
GOOGLE_MAPS_API_KEY=AIzaSyB1234567890abcdef

# CORS
CORS_ORIGIN=http://localhost:5173
```

## Beispiel `.env` für das Web-Frontend (vollständig)

```env
VITE_API_URL=http://localhost:3000
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=66abc1234567890abcdef
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51A...
```
