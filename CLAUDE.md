# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bestellando is a food ordering platform built as a **Turborepo monorepo** with a NestJS API backend and a React (Vite) frontend. It uses **Appwrite** as its Backend-as-a-Service for database, authentication, and team-based permissions, **Stripe** for payments, and **Google Maps Geocoding** for address-to-coordinate resolution.

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
pnpm check-types      # Type check everything (Turbo task)
pnpm format           # Prettier format all .ts/.tsx/.md files
```

### API Tests (apps/api)

```bash
cd apps/api
npm run test          # Jest unit tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage
npm run test:e2e      # End-to-end
```

## Architecture

### Monorepo Structure

- **`apps/api`** — NestJS 11 backend (REST API with URI versioning `/v1/...`)
- **`apps/web`** — React 19 + Vite 7 frontend with TanStack Router (file-based routing)
- **`packages/interfaces`** (`@repo/interfaces`) — Shared TS DTOs and entity interfaces
- **`packages/lib`** (`@repo/lib`) — Appwrite SDK init, JWT-managed `authenticatedFetch`, Stripe helpers, socket.io client (`connectSockets` / `getOrderSocket` / `getDeliverySocket`)
- **`packages/hooks`** (`@repo/hooks`) — `useApiQuery`, `useApiMutation`, `useAuth`, `useTheme`, `useNotification`, `useUserLocation`
- **`packages/contexts`** (`@repo/contexts`) — `ThemeProvider`
- **`packages/ui`** (`@repo/ui`) — minimal shared component wrappers
- **`packages/typescript-config`** — base tsconfig presets

### Backend (apps/api)

#### Modules

- `auth` — JWT (Passport bearer) + Appwrite session validation, decorators (`@Public`, `@RequireUserType`, `@Cooldown`), `AccessInterceptor`, `ActorContextService`, `AppwriteService` (admin + per-user clients).
- `database` — Wraps `node-appwrite` `TablesDB`.
- `user` — Registration + role resolution. `getUserType()` walks the user's Appwrite team memberships and returns `"ADMIN" | "RESTAURANT" | "DELIVERY_PERSON" | "CUSTOMER"`.
- `restaurant` — Restaurant CRUD. Registration creates user + team + `Address` row (with geocoded coords) + restaurant row in one flow; `ownerId` is stored on the restaurant row for `getRestaurantFromUser()` lookups.
- `address` — CRUD with auto-geocoding (forward on create/update, reverse via `GET /v1/address/reverse?lat&lng`). `GeocodingService` exported from `AddressModule`.
- `product` — Menu item CRUD.
- `modifierOption` — Per-product modifier CRUD (`POST/PATCH/DELETE /v1/modifier-option`, public list `GET ?productId=…`).
- `openingHours` — Multiple time slots per day per restaurant. `GET /v1/opening-hours?restaurantId=…`.
- `order` — Order creation, state-machine status transitions, fetch by user/restaurant.
- `orderItem` — Per-line snapshots (price + special instructions).
- `orderStatusHistory` — Audit trail of every status change.
- `payment` — Stripe checkout session + webhook handler. Confirms payment + flips order to `CONFIRMED` + emits WebSocket events.
- `gateway` — `OrderGateway` (`/orders` namespace), `DeliveryGateway` (`/delivery` namespace).
- `delivery` / `delivery-zone` — Delivery person registration, zone polygon checks, driver location.

#### Authentication & Authorization

- Frontend obtains a JWT via `appwriteAccount.createJWT()`, sends it as `Authorization: Bearer …`.
- `JwtStrategy.validate()` calls Appwrite `account.get()` to confirm the JWT, returns `{ id, appwrite, jwt, client }`.
- `AccessInterceptor` (request-scoped):
  1. Sets `ActorContextService` with `{ user, meta, username }` (must happen *before* any role check).
  2. Enforces `@Public` / `@Cooldown` / `@RequireUserType`.
- `RequireUserType(["RESTAURANT"])` calls `userService.getUserType()` which reads the user's Appwrite team memberships. Restaurant users have a team membership with role `"owner"` and/or `"restaurant"`. Delivery has `"delivery_person"`.

#### Database

No ORM. All access goes through Appwrite's `TablesDB`. Tables (snake_case in Appwrite, lowerCamel in code references):

`address`, `restaurant`, `product`, `modifier_option`, `order`, `order_item`, `order_item_modifier`, `order_status_history`, `opening_hours`, `delivery`, `delivery_person`, `delivery_zone`.

**Schema notes:**
- `restaurant.ownerId` (string, required) — set at creation, used by `Query.equal("ownerId", userId)`.
- `restaurant.address` is a one-to-one relationship to `address`.
- `modifier_option.Product` (capital `P`) is a many-to-one relationship to `product`. **The capitalization matters** — the schema uses uppercase `Product`. When reading the field in code, use `option.Product`, not `option.product`.
- `order_item_modifier` is a junction with `orderItem`, `modifierOption`, and a snapshotted `deltaPrice`.
- `address.coordinates` is Appwrite's Point type — store as `[longitude, latitude]` (raw tuple, **not** GeoJSON `{type, coordinates}`).
- `opening_hours` allows multiple rows per `(restaurant, dayOfWeek)` for split shifts (e.g. 8–12 + 15–21). Don't add a unique index on `(restaurant, dayOfWeek)`.

### Frontend (apps/web)

#### Routing

TanStack Router file-based routes. Protected route groups:
- `(protected-customer)/` — gated by `ensureAuthenticated(..., "CUSTOMER")`
- `(protected-restaurant)/` — `"RESTAURANT"`
- `(protected-delivery)/` — `"DELIVERY_PERSON"`

`apps/web/src/providers/route-guard.ts` caches the role across `beforeLoad` re-runs to avoid duplicate `/v1/user/data` calls.

`AuthProvider` ([providers/AuthProvider.tsx](apps/web/src/providers/AuthProvider.tsx)) eagerly fetches both the Appwrite user and the role on mount, so the UI knows it's a restaurant account even on public pages.

#### UI

HeroUI v3 (`3.0.0-beta.8`) on top of `react-aria-components` + Tailwind v4. **HeroUI v3 is heavily compound** — naive v2-style usage breaks silently. Patterns to remember:

- **`<Modal>`** must be `<Modal><ModalBackdrop><ModalContainer><ModalDialog>…</ModalDialog></ModalContainer></ModalBackdrop></Modal>`.
- **`<Input>` / `<TextArea>`** are bare elements with no `label` prop. Use `<TextField value onChange={(v) => …}><Label>…</Label><Input /></TextField>`.
- **`<Select>`** needs `<Select><Label>…</Label><SelectTrigger><SelectValue /></SelectTrigger><SelectPopover><ListBox><ListBoxItem id="x">…</ListBoxItem></ListBox></SelectPopover></Select>`. Use `selectedKey` (single) or `selectedKeys` (multi) and pass `id={…}` on each item.
- **`<Tabs>`** needs `<Tabs selectedKey onSelectionChange><TabList><Tab id="x">Label</Tab></TabList></Tabs>`. `Tab` takes children, not `title`.
- **`<Switch>`** needs `<SwitchControl><SwitchThumb /></SwitchControl>` for the dot to render. Use the wrapper [components/shared/ToggleSwitch.tsx](apps/web/src/components/shared/ToggleSwitch.tsx) for everything.
- **`<Badge>`** is absolutely positioned and escapes its parent. Wrap in `<BadgeAnchor>` (which is `position: relative`) and put the `<Badge>` next to the actual content.
- **Event handlers**: `<Switch>` and `<Input>` use `onChange` (boolean / string), **not** v2's `onValueChange`. The HeroUI Input passed standalone will silently drop `onValueChange`.

#### API client

`@repo/lib`'s `authenticatedFetch(url, options, autoLogout = true)` lazily mints a JWT, caches it in memory, retries once on 401 (with a fresh JWT) before signing the user out. Network errors and 5xx don't trigger logout.

#### Forms

TanStack Form + Zod for validation on auth pages; everywhere else uses controlled `useState`.

#### Real-time

- `connectSockets()` opens `/orders` and `/delivery` namespaces with the user's JWT in the handshake.
- The restaurant dashboard ([dashboard/index.tsx](apps/web/src/routes/(protected-restaurant)/dashboard/index.tsx)) emits `subscribe:restaurant` and listens for `order:new` + `order:status-changed`. Today's stats are computed live from the order list.
- The orders page ([dashboard/orders/index.tsx](apps/web/src/routes/(protected-restaurant)/dashboard/orders/index.tsx)) does the same and invalidates the React Query cache on each event.

### Shared Interfaces

All DTOs and entity types live in `packages/interfaces/src/`. The package builds to `dist/` (`pnpm --filter @repo/interfaces build`); after editing an interface, rebuild before relying on the new types from other packages.

## Order Flow (end-to-end)

1. **Customer adds product to cart** ([cart-store.ts](apps/web/src/stores/cart-store.ts)) — items keyed by `product.$id + sorted modifier IDs` so the same product with different extras is a separate line. Adding from a different restaurant triggers a `pendingItem` confirm dialog.
2. **Checkout** ([CheckoutForm](apps/web/src/components/checkout/CheckoutForm.tsx) / [PaymentStep](apps/web/src/components/checkout/PaymentStep.tsx)) — POSTs `{ restaurantId, deliveryAddressId, items: [{ productId, quantity, modifierOptionIds, specialInstructions }] }` to `/v1/order`.
3. **Order service `createOrder`** ([order.service.ts](apps/api/src/order/service/order.service.ts)):
   - Validate restaurant exists + `isActive`.
   - For each item: fetch the product, validate `isAvailable`. For each modifier ID, fetch the option, **verify `option.Product` matches the line's `productId`**, snapshot `priceDelta`.
   - Compute `unitPrice = basePrice + Σ priceDelta`, then subtotal, then enforce `minOrderValue`.
   - Create the `order` row (status `PENDING`, `paymentStatus: "UNPAID"`).
   - Create one `order_item` per line with the snapshotted unit/total price + optional `specialInstructions`.
   - Create `order_item_modifier` junction rows with `deltaPrice` snapshots.
   - Insert initial `order_status_history` row.
   - Emit `order:new` to the restaurant room (`restaurant:{restaurantId}:orders`).
4. **Stripe checkout** — Frontend calls `POST /v1/payment/checkout/:orderId`, gets a session URL, redirects.
5. **Webhook** ([payment.service / webhook.controller](apps/api/src/payment/)) — On `checkout.session.completed`, flips `paymentStatus` to `PAID`, transitions order to `CONFIRMED`, emits `order:status-changed`. On `payment_intent.payment_failed`, transitions to `CANCELLED`.
6. **Restaurant dashboard** subscribes to `restaurant:{restaurantId}:orders`, receives `order:new` (or `order:status-changed`), refetches list.
7. **Status transitions** — `order-state-machine.ts` validates each transition. State graph:
   - `PENDING → CONFIRMED | CANCELLED`
   - `CONFIRMED → PREPARING | CANCELLED`
   - `PREPARING → READY | CANCELLED`
   - `READY → PICKED_UP`
   - `PICKED_UP → DELIVERED`
   - `DELIVERED` / `CANCELLED` are terminal.
   Actor allow-list: the restaurant drives `PENDING→READY`, the delivery person drives `READY→PICKED_UP→DELIVERED`, customers can only cancel from `PENDING`.

## Code Style

- Double quotes, 2-space indent, trailing commas (`"all"`) — Prettier-enforced.
- TypeScript strict mode; experimental decorators on the API.
- Package manager: **pnpm 9** (don't use npm/yarn at root level).
- Prefer editing existing files. New code goes through the existing module/service/controller layout — don't create parallel structures.

## Common gotchas

- **Don't reach for `onValueChange`** on HeroUI v3 `<Switch>` or bare `<Input>` — both ignore it. Use `onChange` (booleans / strings respectively), or wrap in `<TextField>`.
- **Don't store coordinates as GeoJSON** — Appwrite's Point type wants `[lng, lat]`.
- **`modifier_option.Product`** is capitalized in the Appwrite schema. Reading it as `option.product` returns `undefined`.
- **Run `actorContextService.set()` before any auth check** — `getUserType()` reads from it. The `AccessInterceptor` already does this in the right order; keep it that way.
- **Rebuild `@repo/interfaces` after editing it** — other packages import from `dist/`, not source.
- **`createRestaurant` creates a NEW Appwrite user** — the email/password in the registration form belongs to the restaurant account, not the customer who fills out the form.
