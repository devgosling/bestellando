# Monorepo-Struktur

Bestellando ist als **Turborepo-Monorepo** organisiert. Das bedeutet:
- Mehrere Apps und geteilte Pakete in einem einzigen Repository
- Gemeinsame Abhängigkeiten werden via pnpm-Workspaces deduppliziert
- Turbo orchestriert Build/Dev/Test-Tasks parallel über Workspaces hinweg

## Top-Level-Struktur

```
bestellando/
├── apps/
│   ├── api/         # NestJS-Backend
│   └── web/         # React-Vite-Frontend
├── packages/
│   ├── interfaces/      # @repo/interfaces — Shared TypeScript-Typen
│   ├── lib/             # @repo/lib — Appwrite-SDK, Fetch-Helper, Sockets
│   ├── hooks/           # @repo/hooks — React-Hooks (useApiQuery etc.)
│   ├── contexts/        # @repo/contexts — ThemeProvider
│   ├── ui/              # @repo/ui — Minimal-Wrapper für Shared Components
│   └── typescript-config/ # Basis-tsconfig
├── docs/                # Diese Dokumentation
├── package.json         # Root-Scripts (turbo, prettier)
├── pnpm-workspace.yaml  # Workspace-Definition
├── turbo.json           # Turbo-Pipeline
└── CLAUDE.md            # Anweisungen für AI-Assistenten
```

## Workspace-Konfiguration

Datei `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Damit werden alle Unterordner in `apps/` und `packages/` als pnpm-Workspaces erkannt.

## Turbo-Pipeline

Datei `turbo.json` definiert die Tasks:

| Task | Bedeutung |
|------|-----------|
| `build` | Baut alle Pakete + Apps. Reihenfolge: Pakete vor Apps. |
| `dev` | Startet alles im Watch-Mode parallel. |
| `check-types` | TypeScript-Typeprüfung |

Beispiel-Aufrufe:

```bash
pnpm dev                        # alles parallel
pnpm dev --filter=api           # nur API
pnpm build --filter=web...      # web und alle Dependencies
```

## Pakete und ihre Abhängigkeiten

```
@repo/interfaces  ──── (kein interner Dep)
       ▲
       │ wird importiert von
       │
       ├── apps/api
       ├── apps/web
       └── @repo/lib

@repo/lib ──── nutzt @repo/interfaces
       ▲
       │
       └── apps/web
       └── @repo/hooks

@repo/hooks ──── nutzt @repo/lib + @repo/interfaces
       ▲
       │
       └── apps/web

@repo/contexts ──── (eigenständig)
       ▲
       │
       └── apps/web

@repo/ui ──── (Wrapper, eigenständig)
       ▲
       │
       └── apps/web (ggf.)
```

## Warum diese Struktur?

### `@repo/interfaces`
Ein eigenes Paket für Typen, weil:
- API und Web brauchen **identische** DTOs / Entity-Typen
- Vermeidet Drift zwischen Frontend-Erwartung und Backend-Realität
- Gebaut zu `dist/` (CommonJS + ESM), beide Apps importieren Typen daraus

### `@repo/lib`
Bündelt:
- Appwrite-Client-Initialisierung (`apps/web/...` importiert daraus)
- `authenticatedFetch()` — JWT-Bearer-Helper mit Auto-Logout
- Socket.io-Client (`getOrderSocket()`, `getDeliverySocket()`)
- Stripe-Helper (z. B. PublishableKey-Konfiguration)

### `@repo/hooks`
React-spezifische Hooks, die mehrere App-Bereiche teilen:
- `useApiQuery`, `useApiMutation` — Wrapper um TanStack Query mit `authenticatedFetch`
- `useAuth` — Aktuelle Auth-Daten
- `useTheme`, `useNotification`, `useUserLocation`

### `@repo/contexts`
React-Contexts, die Apps-übergreifend nutzbar wären (aktuell hauptsächlich `ThemeProvider`).

### `@repo/ui`
Minimal — kann aktuell verzichtbar sein. Enthält dünne Wrapper-Komponenten, die wir bei Bedarf erweitern.

### `packages/typescript-config`
Geteilte `tsconfig.json`-Presets:
- `base.json` — Standard-Settings (strict, ES2022, etc.)
- `nestjs.json` — Erweitert base, fügt experimentelle Decorators hinzu
- `react.json` — React/JSX-Konfiguration für `apps/web`

## Wichtige Regeln

1. **Nie `npm` oder `yarn` auf Root-Ebene benutzen** — pnpm ist Pflicht
2. **Nach Interface-Änderungen `pnpm --filter @repo/interfaces build`** — sonst sehen andere Pakete die Änderungen nicht
3. **Keine zirkulären Abhängigkeiten** zwischen Paketen
4. **Cross-package imports** nutzen den Alias `@repo/<paket>`, nie relative Pfade über Workspace-Grenzen hinweg
