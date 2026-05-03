# `@repo/ui`

Pfad: `packages/ui/`

Aktuell minimal — soll zukünftig **App-übergreifende** UI-Wrapper-Komponenten enthalten, die nicht spezifisch für `apps/web` sind.

## Stand

Aktuell sind die meisten UI-Komponenten direkt in `apps/web/src/components/` lokalisiert, weil die App das einzige Frontend ist.

`@repo/ui` ist als Platzhalter für den Fall, dass:
- Eine zweite Frontend-App (z. B. eine native Mobile-App über Capacitor / Expo) hinzukommt
- Komponenten extrahiert werden sollen, die wirklich App-übergreifend nutzbar sind (ohne Zustand, ohne Routing)

## Was hier hineingehört

✅ Geeignet:
- Reine Präsentations-Komponenten (`Logo`, `IconButton`, ...)
- Generische Form-Bausteine
- Layout-Primitives

❌ Ungeeignet:
- Komponenten, die TanStack Router nutzen (App-spezifisch)
- Komponenten, die HeroUI-Compounds wickeln (gehören in `apps/web/src/components/shared/`)
- Komponenten mit App-spezifischer Business-Logic

## Build

Aktuell kein eigener Build — direkt aus `src/` importiert.

## Erweiterung

Bei Bedarf:
1. Komponente in `packages/ui/src/` anlegen
2. In `packages/ui/src/index.ts` re-exportieren
3. In `apps/web` über `import { Foo } from "@repo/ui"` benutzen

## Beziehung zu `apps/web/src/components/`

| Wo? | Bedingung |
|-----|-----------|
| `apps/web/src/components/` | App-spezifisch, nutzt App-Stores/Hooks/Routing |
| `packages/ui/` | App-übergreifend, **stateless**, ohne externe Deps außer React |
