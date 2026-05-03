# Tech-Stack

## Backend (`apps/api`)

| Technologie | Version | Zweck |
|-------------|---------|-------|
| **NestJS** | 11.x | Framework |
| **Express** | 5.x | HTTP-Adapter |
| **TypeScript** | 5.7+ | Sprache |
| **Passport** | — | Auth-Middleware |
| **passport-http-bearer** | 1.x | Bearer-Token-Strategie |
| **node-appwrite** | 22.x | Appwrite-SDK (server-seitig) |
| **socket.io** | 4.x | WebSocket-Server |
| **stripe** | 22.x | Stripe-SDK |
| **class-validator** | 0.15.x | DTO-Validierung |
| **class-transformer** | 0.5.x | DTO-Transformation |
| **nestjs-cls** | 6.x | Request-scoped Context (für ActorContextService) |
| **morgan** | 1.x | HTTP-Logging |
| **multer** | 2.x | File-Uploads (Proof-Bilder) |
| **@nestjs/schedule** | 6.x | Cron-Jobs |

## Frontend (`apps/web`)

| Technologie | Version | Zweck |
|-------------|---------|-------|
| **React** | 19.x | UI-Bibliothek |
| **Vite** | 7.x | Build-Tool / Dev-Server |
| **TypeScript** | 5.9+ | Sprache |
| **TanStack Router** | 1.x | File-basiertes Routing |
| **TanStack Query** | 5.x | Server-State / Caching |
| **TanStack Form** | 1.x | Formulare (Auth-Seiten) |
| **Zod** | 4.x | Schema-Validierung |
| **Zustand** | 5.x | Client-State (Cart) |
| **HeroUI** | 3.0.0-beta.8 | UI-Komponentenbibliothek |
| **react-aria-components** | — | Basis von HeroUI v3 |
| **Tailwind CSS** | 4.x | Styling |
| **framer-motion** | 12.x | Animationen |
| **leaflet** + **react-leaflet** | 1.9 / 5.x | Karten |
| **socket.io-client** | 4.x | WebSocket-Client |
| **appwrite** | 22.x | Appwrite-SDK (browser-seitig) |
| **@gravity-ui/icons** | 2.18 | Icon-Set |

## Geteilte Pakete (`packages/*`)

| Paket | Zweck |
|-------|-------|
| `@repo/interfaces` | TypeScript-Typen (DTOs, Entities, WS-Events) |
| `@repo/lib` | Appwrite-Init, Fetch-Helper, Socket-Helper |
| `@repo/hooks` | React-Hooks (useApiQuery, useAuth, useTheme, ...) |
| `@repo/contexts` | React-Contexts (ThemeProvider) |
| `@repo/ui` | Wrapper-Komponenten |
| `@repo/typescript-config` | tsconfig-Presets |

## Externe Services

| Service | Zweck |
|---------|-------|
| **Appwrite** | Auth + DB + Teams + Storage |
| **Stripe** | Zahlungen (Checkout + Webhooks) |
| **Google Maps Geocoding** | Adress-zu-Koordinaten und vice versa |
| **OpenStreetMap (via Leaflet)** | Karten-Tiles |

## Tooling

| Tool | Zweck |
|------|-------|
| **pnpm 9** | Paketmanager mit Workspaces |
| **Turborepo** | Task-Orchestrierung |
| **Prettier** | Code-Formatierung |
| **ESLint** | Code-Linting (App-spezifisch) |
| **Jest** | Unit-Tests (API) |
| **TypeScript Strict** | Typprüfung |

## Versionsmatrix

```
Node.js: ≥ 18 (empfohlen: 20.x oder 22.x)
pnpm:    9.x
Browser: moderne Browser (ES2022)
```
