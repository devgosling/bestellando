# Entwicklungsumgebung starten

Bestellando nutzt **Turborepo** für die parallele Ausführung von Tasks über den Monorepo hinweg.

## Befehle

### Alles parallel starten (Dev-Mode)

```bash
pnpm dev
```

Das startet:
- `apps/api` (NestJS Watch-Mode auf Port 3000)
- `apps/web` (Vite Dev-Server auf Port 5173)
- Alle Pakete im Watch-Mode (z. B. `@repo/interfaces`)

### Nur einen Teil starten

```bash
pnpm dev --filter=api    # nur API
pnpm dev --filter=web    # nur Web
```

### Build

```bash
pnpm build               # alles bauen
pnpm build --filter=api  # nur API bauen
```

### TypeScript-Typeprüfung

```bash
pnpm check-types
```

### Code formatieren

```bash
pnpm format
```

## API-Tests (Jest)

Wechsle ins API-Verzeichnis:

```bash
cd apps/api
npm run test          # Unit-Tests
npm run test:watch    # Watch-Mode
npm run test:cov      # Mit Coverage
npm run test:e2e      # End-to-End-Tests
```

## TanStack Router automatisch generieren

Das `routeTree.gen.ts` wird vom `@tanstack/router-vite-plugin` automatisch generiert, wenn Vite läuft. Falls du Routen änderst und das Update nicht greift, neu starten oder manuell triggern:

```bash
cd apps/web
npx @tanstack/router-cli generate
```

## Interfaces neu bauen

Wenn du `packages/interfaces/src/*.ts` änderst:

```bash
pnpm --filter @repo/interfaces build
```

Andere Pakete importieren aus `dist/`, deshalb ist der Rebuild nötig.

## Hot Reload

- **API (NestJS)**: Watch-Mode lädt Module automatisch neu
- **Web (Vite)**: HMR (Hot Module Replacement) ist standardmäßig aktiv

## Empfohlene VSCode-Erweiterungen

| Erweiterung | Zweck |
|-------------|-------|
| ESLint | Linting |
| Prettier | Formatting on Save |
| Tailwind CSS IntelliSense | Klassen-Autovervollständigung |
| TypeScript Importer | Auto-Imports |
| GitLens | Git-Inline-Annotations |

## Häufige Probleme

### Port bereits belegt
- API: Setze `PORT=3001` in `apps/api/.env`
- Web: Vite nimmt automatisch den nächsten freien Port (z. B. 5174)

### TypeScript-Fehler nach Interface-Änderung
→ `pnpm --filter @repo/interfaces build` ausführen.

### CORS-Fehler im Browser
→ `CORS_ORIGIN` in `apps/api/.env` korrekt setzen.

### Stripe-Webhooks lokal testen
→ Stripe CLI installieren:
```bash
stripe listen --forward-to localhost:3000/v1/payment/webhook
```
Das gibt ein Webhook-Secret aus, das du in `STRIPE_WEBHOOK_SECRET` setzt.
