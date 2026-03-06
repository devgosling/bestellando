# Bestellando

Ein Turborepo Monorepo für die Bestellando Anwendung.

## Aufsetzen

### pnpm mit npm installieren

```sh
npm install -g pnpm
```

### Alle Packages installieren

```sh
pnpm install
```

## Was ist enthalten?

Dieses Turborepo beinhaltet folgende Packages und Apps:

### Apps und Packages

- `api`: eine [NestJS](https://nestjs.com/) Backend-Anwendung
- `web`: eine [Vite](https://vitejs.dev/) + [React](https://react.dev/) Frontend-Anwendung mit [TanStack Router](https://tanstack.com/router)
- `@repo/ui`: eine gemeinsam genutzte React-Komponentenbibliothek
- `@repo/contexts`: gemeinsam genutzte React Contexts (z.B. Theme)
- `@repo/hooks`: gemeinsam genutzte React Hooks (z.B. useAuth, useTheme)
- `@repo/lib`: gemeinsam genutzte Bibliotheken und Utilities (z.B. Appwrite-Konfiguration)
- `@repo/eslint-config`: `eslint` Konfigurationen für das gesamte Monorepo
- `@repo/typescript-config`: `tsconfig.json` Konfigurationen für das gesamte Monorepo

Alle Packages und Apps verwenden [TypeScript](https://www.typescriptlang.org/) zu 100%.

### Werkzeuge

Dieses Turborepo hat folgende Werkzeuge bereits konfiguriert:

- [TypeScript](https://www.typescriptlang.org/) für statische Typenprüfung
- [ESLint](https://eslint.org/) für Code-Linting
- [Prettier](https://prettier.io) für Code-Formatierung

### Build

Um alle Apps und Packages zu bauen, führe folgenden Befehl aus:

```sh
pnpm exec turbo build
```

Du kannst ein bestimmtes Package mit einem [Filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters) bauen:

```sh
# Nur die Web-App bauen
pnpm exec turbo build --filter=web

# Nur die API bauen
pnpm exec turbo build --filter=api
```

### Entwicklung

Um alle Apps und Packages im Entwicklungsmodus zu starten, führe folgenden Befehl aus:

```sh
pnpm exec turbo dev
```

Du kannst ein bestimmtes Package mit einem [Filter](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters) entwickeln:

```sh
# Nur die Web-App starten
pnpm exec turbo dev --filter=web

# Nur die API starten
pnpm exec turbo dev --filter=api
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache ist für alle Pläne kostenlos. Starte noch heute auf [vercel.com](https://vercel.com/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo kann eine Technik namens [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching) verwenden, um Cache-Artefakte zwischen Rechnern zu teilen. Dies ermöglicht das Teilen von Build-Caches mit deinem Team und CI/CD-Pipelines.

Standardmäßig cached Turborepo lokal. Um Remote Caching zu aktivieren, benötigst du einen Account bei Vercel. Falls du noch keinen Account hast, kannst du [einen erstellen](https://vercel.com/signup?utm_source=turborepo-examples), und dann folgende Befehle ausführen:

```sh
pnpm exec turbo login
```

Dies authentifiziert die Turborepo CLI mit deinem [Vercel Account](https://vercel.com/docs/concepts/personal-accounts/overview).

Als Nächstes kannst du dein Turborepo mit dem Remote Cache verknüpfen:

```sh
pnpm exec turbo link
```

## Nützliche Links

Erfahre mehr über Turborepo:

- [Tasks](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.dev/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.dev/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.dev/docs/crafting-your-repository/running-tasks#using-filters)
- [Konfigurationsoptionen](https://turborepo.dev/docs/reference/configuration)
- [CLI Verwendung](https://turborepo.dev/docs/reference/command-line-reference)
