# Shared Packages

Pfad: `packages/`

| Paket | Verzeichnis | Zweck |
|-------|-------------|-------|
| [`@repo/interfaces`](./interfaces.md) | `packages/interfaces` | TypeScript-Typen (DTOs, Entities, WS-Events) |
| [`@repo/lib`](./lib.md) | `packages/lib` | Appwrite-Client, `authenticatedFetch`, Sockets |
| [`@repo/hooks`](./hooks.md) | `packages/hooks` | React-Hooks (Query, Mutation, Auth, ...) |
| [`@repo/contexts`](./contexts.md) | `packages/contexts` | React-Contexts (ThemeProvider) |
| [`@repo/ui`](./ui.md) | `packages/ui` | Wrapper-Komponenten |
| `@repo/typescript-config` | `packages/typescript-config` | tsconfig-Presets |

## Workspace-Setup

Alle Pakete werden in `pnpm-workspace.yaml` als Workspaces deklariert:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Verlinkung im Code via `@repo/<paket>`. Workspaces lösen das automatisch zum lokalen Pfad auf (kein Publish nötig).

## Build-Status

| Paket | Build nötig? |
|-------|--------------|
| `@repo/interfaces` | **Ja** — andere Pakete importieren aus `dist/` |
| `@repo/lib` | Nein — direkter TS-Import |
| `@repo/hooks` | Nein — direkter TS-Import |
| `@repo/contexts` | Nein — direkter TS-Import |
| `@repo/ui` | Nein — direkter TS-Import |

> Wenn du `@repo/interfaces` änderst, **immer** `pnpm --filter @repo/interfaces build` ausführen, sonst sehen API/Web die Änderung nicht.
