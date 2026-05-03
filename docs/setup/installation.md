# Installation und erste Schritte

## 1. Repository klonen

```bash
git clone <repository-url> bestellando
cd bestellando
```

## 2. pnpm installieren (falls noch nicht vorhanden)

Bestellando verwendet **pnpm 9** als Paketmanager. Die Verwendung von `npm` oder `yarn` auf Root-Ebene ist **nicht erlaubt** und kann zu Inkonsistenzen führen.

```bash
npm install -g pnpm@9
```

Verifizieren:

```bash
pnpm --version  # sollte 9.x.x ausgeben
```

## 3. Abhängigkeiten installieren

Im Wurzelverzeichnis des Projekts:

```bash
pnpm install
```

Dieser Befehl installiert alle Abhängigkeiten für:
- Das Root-Projekt (Turborepo, Prettier, TypeScript)
- `apps/api` (NestJS-Backend)
- `apps/web` (React-Vite-Frontend)
- Alle `packages/*` (interfaces, lib, hooks, contexts, ui)

## 4. Umgebungsvariablen anlegen

Lege eine `.env`-Datei in `apps/api/` an. Die genauen Variablen findest du in [Umgebungsvariablen](./umgebungsvariablen.md).

Mindestens nötig:

```env
# Appwrite
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=...
APPWRITE_API_KEY=...
DATABASE_ID=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google Maps
GOOGLE_MAPS_API_KEY=AIza...

# Auth
JWT_SECRET=...
```

Für `apps/web/` ist eine `.env`-Datei mit `VITE_*`-Variablen nötig:

```env
VITE_API_URL=http://localhost:3000
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 5. Appwrite-Schema einrichten

Folge der Anleitung unter [Appwrite einrichten](./appwrite-setup.md), um:
- Ein Projekt anzulegen
- Eine Datenbank anzulegen
- Alle Tabellen mit den korrekten Spalten und Beziehungen zu erstellen
- Teams für Rollen anzulegen (`admin`, `restaurant`, `delivery_person`)

## 6. Interfaces-Paket bauen

Da das `@repo/interfaces`-Paket aus `dist/`-Dateien importiert wird, musst du es einmal bauen:

```bash
pnpm --filter @repo/interfaces build
```

> **Wichtig:** Wenn du Interfaces editierst, musst du dieses Paket **erneut bauen**, sonst sehen andere Pakete die Änderungen nicht.

## 7. Entwicklungsserver starten

```bash
pnpm dev
```

Das startet alle Apps und Pakete parallel im Watch-Mode:
- API: http://localhost:3000
- Web: http://localhost:5173

Mehr Details in [Entwicklung](./entwicklung.md).

## 8. Erste Verifikation

Öffne http://localhost:5173 — du solltest die Startseite sehen.

Im Terminal solltest du Logs vom NestJS-API sehen, wie:

```
[Nest] LOG [NestApplication] Nest application successfully started
```

## Troubleshooting

### "Cannot find module '@repo/interfaces'"
→ `pnpm --filter @repo/interfaces build` ausführen.

### "Pre-existing JWT" / Auth-Fehler beim Laden
→ Browser-LocalStorage leeren, Appwrite-Cookies löschen.

### "Restaurant not found or inactive"
→ Restaurant in Appwrite manuell als `isActive: true` markieren oder über das Restaurant-Dashboard registrieren.

### Map zeigt keine Marker
→ Prüfen, ob die Adressen `coordinates` als `[lng, lat]`-Tuple in Appwrite haben.
