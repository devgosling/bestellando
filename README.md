# Bestellando

Eine Food-Ordering-Plattform für Restaurants, Kunden und Lieferpersonen — gebaut als **Turborepo-Monorepo** mit **NestJS-API**, **React-Vite-Frontend**, **Appwrite** als Backend-as-a-Service, **Stripe** für Zahlungen und Live-GPS-Tracking via **Socket.io**.

## 📚 Vollständige Dokumentation

Eine umfangreiche, deutsche Dokumentation liegt in [`docs/`](./docs/). Inkl. Setup-Anleitungen, End-to-End-Flows, Backend-Module, Frontend-Komponenten, Datenbank-Schema und mehr.

Lokal lesbar als interaktive Single-Page-App über den [`docs-viewer/`](./docs-viewer/):

```bash
pnpm dev --filter=bestellando-docs-viewer
# → http://localhost:5180
```

## ⚡ Quickstart

### 1. pnpm installieren (falls noch nicht vorhanden)

```sh
npm install -g pnpm@9
```

### 2. Dependencies installieren

```sh
pnpm install
```

### 3. Umgebungsvariablen anlegen

`.env` in `apps/api/` und `apps/web/` — siehe [docs/setup/umgebungsvariablen.md](./docs/setup/umgebungsvariablen.md).

### 4. Alles starten

```sh
pnpm dev
```

Das startet parallel:
- API auf http://localhost:3000
- Web-Frontend auf http://localhost:5173
- Docs-Viewer auf http://localhost:5180

## 🏗️ Was ist enthalten?

### Apps

| App | Pfad | Tech |
|-----|------|------|
| **API** | `apps/api` | NestJS 11, Passport, Socket.io, Stripe, Appwrite |
| **Web-Frontend** | `apps/web` | React 19, Vite 7, TanStack Router, HeroUI v3, Tailwind v4 |
| **Docs-Viewer** | `docs-viewer` | React 19, Vite, Framer Motion, react-markdown |

### Shared Packages

| Package | Zweck |
|---------|-------|
| `@repo/interfaces` | TypeScript-Typen (DTOs, Entities, WS-Events) |
| `@repo/lib` | Appwrite-SDK-Init, `authenticatedFetch`, Socket.io-Client |
| `@repo/hooks` | React-Hooks (`useApiQuery`, `useApiMutation`, `useAuth`, …) |
| `@repo/contexts` | React-Contexts (z. B. `ThemeProvider`) |
| `@repo/ui` | Wrapper-Komponenten |
| `@repo/typescript-config` | tsconfig-Presets |

## 🛠️ Befehle

### Entwicklung

```sh
pnpm dev                                           # alles parallel
pnpm dev --filter=api                              # nur API
pnpm dev --filter=web                              # nur Web
pnpm dev --filter=bestellando-docs-viewer          # nur Docs-Viewer
```

### Build

```sh
pnpm build                          # alles bauen
pnpm build --filter=web             # nur Web
pnpm --filter @repo/interfaces build  # Pflicht nach Änderung an Interfaces!
```

### Type-Checking & Formatting

```sh
pnpm check-types        # TypeScript-Typeprüfung über alle Workspaces
pnpm format             # Prettier-Format
```

### API-Tests

```sh
cd apps/api
pnpm test               # Jest Unit-Tests
pnpm test:watch         # Watch-Mode
pnpm test:cov           # Coverage
pnpm test:e2e           # End-to-End
```

## 🧱 Tech-Stack-Highlights

- **Monorepo**: Turborepo + pnpm-Workspaces
- **Backend**: NestJS, URI-versionierte REST-API (`/v1/...`), JWT-Bearer via Passport
- **Frontend**: React 19, file-basiertes Routing, TanStack Query für Server-State, Zustand für Cart
- **BaaS**: Appwrite (Auth, DB, Teams, Storage)
- **Echtzeit**: Socket.io mit zwei Namespaces (`/orders`, `/delivery`)
- **Zahlungen**: Stripe Checkout + signaturverifizierte Webhooks
- **Karten**: Leaflet (OSM-Tiles) + Google Maps Geocoding
- **Lieferung**: Live-GPS-Tracking, Beweisfoto-Upload zu Appwrite-Storage

## 📖 Wichtige Dokumente

| Was suche ich? | Pfad |
|----------------|------|
| Erste Schritte | [docs/setup/installation.md](./docs/setup/installation.md) |
| Architektur-Überblick | [docs/architektur/ueberblick.md](./docs/architektur/ueberblick.md) |
| Bestellprozess (E2E) | [docs/ablaeufe/bestellprozess.md](./docs/ablaeufe/bestellprozess.md) |
| Datenbank-Schema | [docs/datenbank/tabellen.md](./docs/datenbank/tabellen.md) |
| WebSocket-Events | [docs/echtzeit/events.md](./docs/echtzeit/events.md) |
| AI-Anweisungen | [CLAUDE.md](./CLAUDE.md) |

## ⚠️ Wichtige Regeln

- **Nie `npm` oder `yarn`** auf Root-Ebene — pnpm 9 ist Pflicht
- **Nach Änderungen an `@repo/interfaces`** unbedingt `pnpm --filter @repo/interfaces build` ausführen, sonst sehen andere Pakete die Änderungen nicht
- **HeroUI v3 Compound-Pattern** unbedingt einhalten — naive v2-Style-Usage bricht silently. Siehe [docs/frontend/theming.md](./docs/frontend/theming.md)
- **Coordinates als `[lng, lat]`** in Appwrite-Point-Spalten speichern — nicht als GeoJSON
- **`modifier_option.Product`** mit großem P! — kleines `option.product` gibt `undefined`

## 🔧 Werkzeuge

- **TypeScript** — Strict-Mode, app-übergreifend
- **Prettier** — Formatierung (doppelte Anführungszeichen, 2-Space, trailing commas)
- **Turborepo** — Task-Orchestrierung
- **Jest** — API-Tests

## 🚀 Remote Caching

Turborepo unterstützt [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching) zum Teilen von Build-Artefakten zwischen Maschinen / CI.

```sh
pnpm exec turbo login         # mit Vercel-Account verknüpfen
pnpm exec turbo link          # Remote-Cache aktivieren
```

## 📄 Lizenz

Privat / proprietär. Nicht zur Wiederverwendung freigegeben.
