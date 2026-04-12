# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bestellando is a food ordering platform built as a **Turborepo monorepo** with a NestJS API backend and a React (Vite) frontend. It uses **Appwrite** as its Backend-as-a-Service for database, authentication, and permissions.

## Commands

### Development

```bash
pnpm dev              # Start all apps/packages in dev mode (API + Web)
pnpm dev --filter=api # Start only the API (NestJS, port 3000)
pnpm dev --filter=web # Start only the Web app (Vite, port 5173)
```

### Build & Type Checking

```bash
pnpm build            # Build all packages/apps
pnpm check-types      # Type check everything
pnpm format           # Prettier format all .ts/.tsx/.md files
```

### API Tests (apps/api)

```bash
cd apps/api
npm run test          # Run Jest unit tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report
npm run test:e2e      # End-to-end tests
```

## Architecture

### Monorepo Structure

- **`apps/api`** - NestJS 11 backend (REST API with URI versioning `/v1/...`)
- **`apps/web`** - React 19 + Vite 7 frontend with TanStack Router (file-based routing)
- **`packages/@repo/interfaces`** - Shared TypeScript DTOs and entity interfaces (used by both apps)
- **`packages/@repo/lib`** - Shared libraries: Appwrite client config, API client (`authenticatedFetch`/`unauthenticatedFetch`), TanStack Query option factories
- **`packages/@repo/hooks`** - Shared React hooks: `useAuth`, `useTheme`, `useNotification`, `useApiQuery`, `useApiMutation`
- **`packages/@repo/contexts`** - Shared React contexts (ThemeProvider)
- **`packages/@repo/ui`** - Shared React component library
- **`packages/@repo/typescript-config`** - Base tsconfig presets

### Backend (apps/api)

**Authentication flow:** Passport.js JWT Bearer strategy. The frontend obtains a JWT from Appwrite and sends it as a Bearer token. The API validates it via Appwrite's `Account.get()`. Use `@Public()` decorator to skip auth on a route.

**Request context:** `ActorContextService` (REQUEST-scoped) stores the authenticated user per request. `AppwriteService` manages Appwrite SDK clients (admin client via API key, user client via JWT). The `nestjs-cls` module provides distributed context with trace IDs.

**Key NestJS patterns:**
- Global `ValidationPipe` with `class-validator`/`class-transformer` (whitelist enabled)
- `@Cooldown()` decorator for rate limiting
- Modules: `auth`, `database`, `restaurant`, `user`, `order`, `orderItem`, `orderStatusHistory`, `product`, `address`, `openingHours`

**Database:** No traditional ORM. All data access goes through Appwrite's SDK (`TablesDB` wrapper in `database/` module). Collections are managed in Appwrite console, not via code migrations.

### Frontend (apps/web)

**Routing:** TanStack Router with file-based routes. Protected route groups use parenthesized directories: `(protected-customer)/`, `(protected-restaurant)/`.

**UI:** HeroUI (3.0.0-beta) component library + Tailwind CSS 4 + Framer Motion for animations.

**API client:** `@repo/lib` provides `authenticatedFetch()` which auto-manages JWT lifecycle (obtains from Appwrite, caches, refreshes on expiry). Query/mutation helpers wrap TanStack React Query.

**Forms:** TanStack Form + Zod for validation.

### Shared Interfaces

All DTOs and entity types live in `packages/interfaces/src/`. Both API and web import from `@repo/interfaces`. When adding a new entity or DTO, add it here so both apps stay in sync.

## Code Style

- Double quotes, no tabs (2-space indent), trailing commas (`"all"`) - enforced by Prettier
- TypeScript strict mode with experimental decorators enabled (API)
- Package manager: **pnpm 9** (do not use npm/yarn at root level)
