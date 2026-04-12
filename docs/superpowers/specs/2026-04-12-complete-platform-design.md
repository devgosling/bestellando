# Bestellando Complete Platform Design

**Date:** 2026-04-12
**Status:** Draft
**Scope:** Full food ordering platform (customer, restaurant, delivery, payments, real-time)

---

## 1. Context

Bestellando is a food ordering platform with a Turborepo monorepo (NestJS API + React/Vite frontend + Appwrite BaaS). The foundation exists: auth system (JWT via Appwrite), landing page, registration flows, role-based route guards, API client with JWT auto-refresh, and basic CRUD services for all entities. However, the core application functionality is missing -- no restaurant browsing, no ordering flow, no real-time updates, no payment processing, no delivery tracking. This spec defines the complete platform.

---

## 2. Foundation Fixes

These must be completed before any feature work.

### 2.1 Orphaned Module Registration

`apps/api/src/app.module.ts` is missing imports for 5 existing modules:

- `ProductModule`
- `OrderModule`
- `OrderItemModule`
- `OrderStatusHistoryModule`
- `OpeningHoursModule`

Each of these modules also needs `DatabaseModule`, `ConfigModule` added to its own `imports` array for DI to resolve.

### 2.2 Role Enum Unification

Backend `user.interface.ts` defines `DELIVER_PERSON`. Frontend `__root.tsx` defines `DELIVERY_PERSON`. Unify to `DELIVERY_PERSON` everywhere.

### 2.3 Controller Version Prefixes

These controllers lack the `version: "1"` property and serve on unprefixed paths:

- `ProductController` (`/product` -> `/v1/product`)
- `OrderController` (`/order` -> `/v1/order`)
- `OrderItemController` (`/order-item` -> remove controller, internalize)
- `OrderStatusHistoryController` (`/order-status-history` -> remove controller, internalize)
- `OpeningHoursController` (`/opening-hours` -> `/v1/opening-hours`)

### 2.4 Auth & Ownership Validation

All CRUD endpoints except user/restaurant currently have no auth guards or ownership checks. Fix:

- **Product**: `@Public()` on reads, `@RequireUserType(["RESTAURANT"])` on mutations, verify product belongs to requester's restaurant
- **Order**: Auth required on all endpoints, scope queries to current user's orders (customer) or restaurant's orders (restaurant owner)
- **OpeningHours**: `@Public()` on reads, `@RequireUserType(["RESTAURANT"])` on mutations

### 2.5 Remove Standalone Controllers

`OrderItemController` and `OrderStatusHistoryController` should be removed. Their services are internalized into `OrderService` -- order items are created as part of order creation, and status history entries are created automatically on status transitions.

### 2.6 Address Controller

`AddressModule` currently has no controller. Add `AddressController` with:

- `POST /v1/address` -- create address for current user
- `GET /v1/address` -- list current user's addresses
- `PATCH /v1/address/:id` -- update (ownership check)
- `DELETE /v1/address/:id` -- delete (ownership check)
- `PATCH /v1/address/:id/default` -- set as default

### 2.7 Pagination Utilities

Create shared DTOs in `apps/api/src/common/`:

```typescript
// dto/pagination.dto.ts
class PaginationDto {
  page?: number = 1;       // @IsOptional @IsInt @Min(1)
  limit?: number = 25;     // @IsOptional @IsInt @Min(1) @Max(100)
  sortBy?: string;         // @IsOptional @IsString
  sortOrder?: "asc" | "desc" = "desc";
}

// interface/paginated-result.interface.ts
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### 2.8 Restaurant Listing

Replace the `ImATeapotException` in `RestaurantController.listRestaurants()` with actual implementation. Filters:

```typescript
// dto/restaurant-filter.dto.ts
class RestaurantFilterDto extends PaginationDto {
  search?: string;         // name text search
  type?: RestaurantType;   // cuisine type filter
  isActive?: boolean;      // only active restaurants
}
```

---

## 3. New Shared Interfaces

All in `packages/interfaces/src/`:

### 3.1 New Files

**`delivery-person.interface.ts`**
```typescript
type VehicleType = "BICYCLE" | "SCOOTER" | "CAR";

interface DeliveryPersonEntity {
  $id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleType: VehicleType;
  isAvailable: boolean;
  currentLocation?: Point;
  rating?: number;
}
```

**`delivery.interface.ts`**
```typescript
type DeliveryStatus = "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED";

interface DeliveryEntity {
  $id: string;
  order: string;
  deliveryPerson: string;
  status: DeliveryStatus;
  assignedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  currentLocation?: Point;
  estimatedArrivalMinutes?: number;
}
```

**`ws-events.ts`** -- All WebSocket event payload types shared between frontend and backend:
```typescript
// Server -> Client events
interface OrderStatusChangedEvent { orderId: string; previousStatus: OrderStatus; newStatus: OrderStatus; timestamp: string; }
interface NewOrderEvent { order: OrderEntity; items: OrderItemEntity[]; }
interface DriverLocationEvent { lat: number; lng: number; heading: number; speed: number; timestamp: number; }
interface DeliveryAvailableEvent { orderId: string; restaurantName: string; pickupAddress: AddressEntity; deliveryAddress: AddressEntity; }
interface DeliveryAssignedEvent { driverId: string; driverName: string; estimatedMinutes: number; }
interface RestaurantAvailabilityEvent { restaurantId: string; isActive: boolean; }
interface ProductAvailabilityEvent { productId: string; isAvailable: boolean; }
```

### 3.2 Updated Files

**`order.interface.ts`** -- Add fields:
```typescript
customerId: string;
paymentStatus: "UNPAID" | "PAID" | "FAILED" | "REFUNDED";
stripeSessionId?: string;
deliveryPersonId?: string;
createdAt?: string;
```

**`order-status-history.interface.ts`** -- Add fields:
```typescript
changedBy: string;   // userId who triggered
changedAt: string;   // ISO timestamp
```

---

## 4. Backend: New Modules

### 4.1 Gateway Module (`apps/api/src/gateway/`)

**Structure:**
```
gateway/
  gateway.module.ts
  guards/ws-jwt.guard.ts
  orders/order.gateway.ts
  delivery/delivery.gateway.ts
  delivery/gps-store.service.ts
  delivery/pending-delivery-tracker.service.ts
  dto/gps-update.dto.ts
```

**Two WebSocket gateways** on separate Socket.IO namespaces:

| Gateway | Namespace | Purpose |
|---|---|---|
| `OrderGateway` | `/orders` | Order lifecycle, new order notifications, restaurant availability |
| `DeliveryGateway` | `/delivery` | GPS streaming, delivery assignment, driver status |

**Authentication**: JWT passed in `handshake.auth.token`, validated in `handleConnection` using `AppwriteService.createUserClient()` + `Account.get()`. Unauthenticated sockets are disconnected immediately.

**Room architecture:**

| Room | Who joins | Events |
|---|---|---|
| `order:{orderId}` | Customer, restaurant, assigned driver | `order:status-changed`, `delivery:assigned` |
| `restaurant:{restaurantId}:orders` | Restaurant dashboard | `order:new`, `order:cancelled` |
| `restaurant:{restaurantId}:availability` | Customers browsing | `restaurant:availability-changed`, `product:availability-changed` |
| `delivery:available` | All online drivers | `delivery:available-order`, `delivery:order-taken` |
| `delivery:{orderId}:gps` | Customer tracking delivery | `delivery:gps-position`, `delivery:driver-disconnected` |
| `user:{userId}` | Auto-joined on connect | Direct notifications |

**GPS store**: In-memory `Map<orderId, GpsPosition>` -- NOT Appwrite. GPS is high-frequency (every 5s) and ephemeral. Stale cleanup via `@nestjs/schedule` cron every 30s (positions older than 60s emit `driver-disconnected` and are removed).

### 4.2 Payment Module (`apps/api/src/payment/`)

**Structure:**
```
payment/
  payment.module.ts
  service/stripe.service.ts
  controller/payment.controller.ts
  controller/webhook.controller.ts
```

**Endpoints:**
- `POST /v1/payment/checkout/:orderId` -- Creates Stripe Checkout Session, returns `{ sessionUrl }`. Validates order belongs to user, status is PENDING, payment is UNPAID. Calculates amount server-side from order items.
- `POST /v1/webhook/stripe` -- `@Public()`, validates Stripe signature. On `checkout.session.completed`: updates order paymentStatus to PAID, transitions order to CONFIRMED, emits `order:status-changed` WebSocket event. On `payment_intent.payment_failed`: updates paymentStatus to FAILED.

**Config:** NestJS `rawBody: true` for Stripe webhook signature verification.

**New env vars:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`

### 4.3 Delivery Module (`apps/api/src/delivery/`)

**Structure:**
```
delivery/
  delivery.module.ts
  service/delivery.service.ts
  service/delivery-person.service.ts
  controller/delivery.controller.ts
  controller/delivery-person.controller.ts
  dto/
```

**DeliveryPerson endpoints:**
- `POST /v1/delivery-person/register` -- `@RequireUserType(["DELIVERY_PERSON"])`
- `GET /v1/delivery-person/profile`
- `PATCH /v1/delivery-person/availability` -- Toggle online/offline

**Delivery endpoints:**
- `GET /v1/delivery/available` -- Orders with status READY, no active delivery assignment
- `POST /v1/delivery/accept/:orderId` -- Atomic first-accept (in-memory Map, Node.js single-thread guarantees atomicity)
- `PATCH /v1/delivery/:deliveryId/pickup` -- Mark picked up, transition order READY -> PICKED_UP
- `PATCH /v1/delivery/:deliveryId/delivered` -- Mark delivered, transition order PICKED_UP -> DELIVERED
- `GET /v1/delivery/:deliveryId/track` -- REST fallback for current driver location

**New Appwrite collections needed:** `deliveryPerson`, `delivery`

### 4.4 Order Flow Redesign

**CreateOrderDto:**
```typescript
class CreateOrderDto {
  restaurantId: string;
  deliveryAddressId: string;
  specialInstructions?: string;
  items: { productId: string; quantity: number; }[];
}
```

**Order creation flow (OrderService.createOrder):**
1. Validate restaurant exists and `isActive`
2. Validate all products belong to restaurant and `isAvailable`
3. Calculate subtotal server-side: `sum(product.basePrice * quantity)`
4. Validate `subtotal >= restaurant.minOrderValue`
5. Calculate `totalAmount = subtotal + restaurant.deliveryFee`
6. Create order document (status: PENDING, paymentStatus: UNPAID)
7. Create order items with price snapshots
8. Create initial status history entry
9. Emit `order:new` to restaurant WebSocket room

**Order status state machine:**
```
VALID_TRANSITIONS:
  PENDING    -> CONFIRMED, CANCELLED
  CONFIRMED  -> PREPARING, CANCELLED
  PREPARING  -> READY, CANCELLED
  READY      -> PICKED_UP
  PICKED_UP  -> DELIVERED
  DELIVERED  -> (terminal)
  CANCELLED  -> (terminal)

TRANSITION_ACTORS:
  PENDING->CONFIRMED:    RESTAURANT (auto on payment success)
  PENDING->CANCELLED:    CUSTOMER, RESTAURANT
  CONFIRMED->PREPARING:  RESTAURANT
  CONFIRMED->CANCELLED:  RESTAURANT
  PREPARING->READY:      RESTAURANT
  PREPARING->CANCELLED:  RESTAURANT
  READY->PICKED_UP:      DELIVERY_PERSON
  PICKED_UP->DELIVERED:  DELIVERY_PERSON
```

**Delivery assignment flow:**
1. Order hits READY -> broadcast `delivery:available-order` to `delivery:available` room
2. All online drivers see available delivery with restaurant name, distance, addresses
3. First driver to call `POST /v1/delivery/accept/:orderId` wins (atomic in-memory check-then-set)
4. Server emits `delivery:order-taken` to remove from other drivers' lists
5. Server emits `delivery:assigned` to `order:{orderId}` room (customer + restaurant see driver info)
6. Timeout: 5 min -> re-broadcast as urgent; 10 min -> notify restaurant + admin

---

## 5. Frontend: Route Structure

```
src/routes/
  __root.tsx                              (exists)
  index.tsx                               (exists - landing page)
  auth/
    login.tsx                             (exists)
    register/
      user.tsx                            (exists)
      restaurant.tsx                      (exists)
      delivery.tsx                        (NEW)
  (protected-customer)/
    route.tsx                             (exists - auth guard)
    restaurants/
      index.tsx                           (NEW - browse with filters)
      $restaurantId.tsx                   (NEW - detail + menu)
    cart.tsx                              (NEW - full cart page)
    checkout.tsx                          (NEW - Stripe redirect)
    orders/
      index.tsx                           (NEW - order history)
      $orderId.tsx                        (NEW - tracking + live map)
    profile/
      index.tsx                           (NEW - profile + addresses)
  (protected-restaurant)/
    route.tsx                             (exists - auth guard)
    dashboard/
      route.tsx                           (NEW - sidebar layout)
      index.tsx                           (NEW - overview/stats)
      menu/index.tsx                      (NEW - product CRUD)
      orders/index.tsx                    (NEW - real-time order management)
      settings/index.tsx                  (NEW - restaurant profile)
      opening-hours/index.tsx             (NEW - hours editor)
  (protected-delivery)/                   (NEW route group)
    route.tsx                             (NEW - DELIVERY_PERSON guard)
    deliveries/
      index.tsx                           (NEW - available deliveries)
      $deliveryId.tsx                     (NEW - active delivery + nav map)
```

**Delete placeholders:** `list-restaurants.tsx`, `protected.tsx`, `manage-restaurant.tsx`

---

## 6. Frontend: Components

### 6.1 Restaurant Browsing

```
components/restaurant/
  RestaurantCard.tsx          - Card with image, name, cuisine chip, delivery time, fee, rating
  RestaurantFilters.tsx       - Filter bar: cuisine type chips, delivery time, min order, search input
  MenuSection.tsx             - Category heading + grid of product cards
  ProductCard.tsx             - Menu item: name, description, price, "Add" button
  ProductModal.tsx            - Expanded product: image, quantity picker, special instructions, add to cart
  OpeningHoursBadge.tsx       - Open/closed indicator with next open time
  RestaurantHero.tsx          - Banner + name + key info overlay
```

### 6.2 Cart

```
components/cart/
  CartDrawer.tsx              - Slide-over drawer from header cart icon (AnimatePresence)
  CartItem.tsx                - Line item: product name, qty controls, subtotal, remove
  CartSummary.tsx             - Subtotal, delivery fee, total, checkout button
  CartEmpty.tsx               - Empty state illustration
```

### 6.3 Checkout

```
components/checkout/
  CheckoutForm.tsx            - Address selection + order summary + pay button (redirects to Stripe)
  AddressSelector.tsx         - Dropdown of saved addresses + inline add-new
  OrderConfirmation.tsx       - Success page after Stripe redirect
```

### 6.4 Order Tracking

```
components/order/
  OrderCard.tsx               - Order summary for history list
  OrderTimeline.tsx           - Vertical stepper: status progression with timestamps
  OrderStatusBadge.tsx        - Colored status chip
  DeliveryMap.tsx             - Leaflet map: restaurant marker, customer marker, animated driver marker, route polyline
```

### 6.5 Restaurant Dashboard

```
components/dashboard/
  DashboardSidebar.tsx        - Sidebar nav for restaurant portal
  StatCard.tsx                - Metric card (orders today, revenue)
  IncomingOrderCard.tsx       - Order card with accept/reject actions
  MenuProductRow.tsx          - Product table row with edit/toggle actions
  ProductFormModal.tsx        - Create/edit product modal
  OpeningHoursEditor.tsx      - Day-of-week time range editor
  RestaurantSettingsForm.tsx  - Restaurant profile edit form
```

### 6.6 Delivery Person

```
components/delivery/
  DeliveryCard.tsx            - Available delivery: restaurant, distance, addresses
  ActiveDeliveryView.tsx      - Current delivery with map and action buttons
  DeliveryActionBar.tsx       - "Picked up" / "Delivered" action buttons
  NavigationMap.tsx           - Map with route to destination
```

### 6.7 Shared

```
components/shared/
  EmptyState.tsx              - Reusable empty state with illustration
  LoadingSkeleton.tsx         - Shimmer skeletons for cards/lists
  ConfirmDialog.tsx           - Generic confirmation modal
  PriceDisplay.tsx            - Formatted EUR price (e.g., "12,50 EUR")
  MapBase.tsx                 - Shared Leaflet map wrapper (tile config, dark/light styles)
  InfiniteScrollList.tsx      - Intersection observer + useInfiniteQuery wrapper
  AnimatedPage.tsx            - Framer Motion page transition wrapper
  SearchInput.tsx             - Debounced search input
```

---

## 7. Frontend: State Management

### 7.1 Cart Store (Zustand)

File: `apps/web/src/stores/cart-store.ts`

```typescript
interface CartStore {
  items: CartItem[];           // { product: ProductEntity, quantity, specialInstructions? }
  restaurantId: string | null;
  restaurantName: string | null;

  addItem(product: ProductEntity, quantity: number, instructions?: string): void;
  removeItem(productId: string): void;
  updateQuantity(productId: string, quantity: number): void;
  clearCart(): void;

  // Computed
  totalItems: number;          // sum of quantities
  subtotal: number;            // sum of unitPrice * quantity
}
```

- Persist with `zustand/middleware/persist` + localStorage (key: `bestellando-cart`)
- Single-restaurant rule: adding from a different restaurant prompts to clear cart
- New dependency: `zustand` in `apps/web`

### 7.2 Socket Manager

File: `packages/lib/src/socket.ts`

```typescript
function createSocketConnection(namespace: string): Socket
  // Connects to {apiUrl}{namespace}
  // Auth via handshake.auth.token (Appwrite JWT)
  // Transport: websocket only (skip long-polling)
  // Manual reconnection with JWT refresh on each attempt
  // Exponential backoff: 500ms, 1s, 2s, 4s, 8s, 10s cap

// Singleton instances
export const orderSocket: Socket;    // /orders namespace
export const deliverySocket: Socket; // /delivery namespace
```

### 7.3 React Hook

File: `apps/web/src/hooks/useSocketEvent.ts`

```typescript
function useSocketEvent<T>(socket: Socket, event: string, handler: (data: T) => void): void
  // Subscribe on mount, unsubscribe on unmount
  // Uses useRef for handler to avoid re-subscribing on re-renders
```

### 7.4 Socket Lifecycle

- Connect both sockets after successful login (in `AuthProvider` after auth)
- Disconnect on logout
- Socket connection provides user context via JWT -- server auto-joins `user:{userId}` room

### 7.5 Query Cache Integration

WebSocket events invalidate TanStack Query caches:
- `order:status-changed` -> invalidate `["/v1/order", orderId]`
- `order:new` (restaurant) -> invalidate `["/v1/restaurant/orders"]` + play notification sound + toast
- `delivery:assigned` -> invalidate `["/v1/order", orderId]`
- `product:availability-changed` -> invalidate `["/v1/product", { restaurantId }]`

---

## 8. Map & Delivery Tracking

### 8.1 Library: Leaflet + react-leaflet

- Free, open-source, no API key costs
- OSM tiles (free) for development, Mapbox tiles for production
- Route geometry via OSRM public API
- New dependencies: `leaflet`, `react-leaflet`, `@types/leaflet`

### 8.2 Tracking Map Features

**Markers:**
- Restaurant: orange pin (static)
- Customer delivery address: green pin (static)
- Driver: car/scooter icon rotated by heading (animated)

**Route:** Polyline from restaurant to customer via OSRM

**Driver animation:** Client-side interpolation between 5-second GPS updates using `requestAnimationFrame` with ease-out cubic. Animation duration matches GPS interval (5000ms) so marker glides smoothly to next position.

### 8.3 GPS Flow

1. **Driver** -> `navigator.geolocation.watchPosition({ enableHighAccuracy: true })`
2. **Driver frontend** -> throttled emit via WebSocket every 5s (15s when stationary, adaptive based on speed)
3. **Server GpsStoreService** -> stores in `Map<orderId, GpsPosition>`, broadcasts to `delivery:{orderId}:gps`
4. **Customer frontend** -> `useDriverPosition` hook receives events, interpolates between points

**GPS payload:** `{ orderId, lat, lng, heading, speed, accuracy, timestamp }`

**Stale detection:** Server cron every 30s. Positions older than 60s -> emit `delivery:driver-disconnected` with last known position, then remove from store.

### 8.4 Mobile

- Map: `height: calc(100dvh - 80px)` for mobile address bar
- Two-finger zoom on mobile (disable scroll-wheel zoom)
- Status bar collapses to bottom sheet on small screens
- Leaflet handles touch controls natively

---

## 9. Stripe Integration

### 9.1 Flow

```
Customer confirms cart
  -> POST /v1/order (create order, status: PENDING, paymentStatus: UNPAID)
  -> POST /v1/payment/checkout/:orderId (create Stripe Checkout Session)
  <- { sessionUrl }
  -> Redirect to Stripe hosted checkout
  -> Customer pays
  -> Stripe sends webhook to POST /v1/webhook/stripe
  -> Server: paymentStatus = PAID, order status PENDING -> CONFIRMED
  -> WebSocket: order:status-changed to restaurant
  -> Customer redirected back to /orders/:orderId (tracking page)
```

### 9.2 Backend

```typescript
// StripeService
createCheckoutSession(order: OrderEntity): Promise<Stripe.Checkout.Session>
constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event

// PaymentController
POST /v1/payment/checkout/:orderId -> { sessionUrl: string }

// WebhookController
@Public()
POST /v1/webhook/stripe -> void (HTTP 200)
```

### 9.3 Configuration

- `rawBody: true` in `NestFactory.create()` options
- Env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FRONTEND_URL`
- Frontend env: `VITE_STRIPE_PUBLISHABLE_KEY` (only needed if using Stripe.js client-side, not for redirect flow)

---

## 10. Animation Strategy

Consistent Framer Motion animations across the app:

| Element | Animation |
|---|---|
| Page transitions | `AnimatedPage` wrapper: fade-in + slide-up (0.25s, ease-out) |
| Cart drawer | Slide from right + backdrop fade (AnimatePresence) |
| Product modal | Scale-up from center with spring physics |
| Restaurant cards (browse) | Staggered fade-in (`staggerChildren: 0.04`) |
| Order status timeline | Layout animation on stepper progression |
| New order notification (restaurant) | Slide-down toast with pulse ring |
| Map driver marker | Interpolated position with ease-out cubic |
| Skeleton loaders | Shimmer animation (CSS keyframes) |

---

## 11. New Dependencies

### Backend (`apps/api`)

```
@nestjs/websockets
@nestjs/platform-socket.io
socket.io
@nestjs/schedule
stripe
```

### Frontend (`apps/web`)

```
socket.io-client
zustand
leaflet
react-leaflet
@types/leaflet
```

### Shared (`packages/lib`)

```
socket.io-client
```

---

## 12. New Appwrite Collections

Create in Appwrite console (no code migrations):

- `deliveryPerson` -- driver profiles
- `delivery` -- links driver to order with status tracking

---

## 13. New Environment Variables

### Backend (`apps/api/.env`)

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
FRONTEND_URL=http://localhost:5173
```

### Frontend (`apps/web/.env`)

```
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_MAPBOX_TOKEN=          # Only if using Mapbox tiles instead of OSM
```

---

## 14. Implementation Phases

### Phase 1: Foundation (prerequisite for all)
1. Fix orphaned module imports in AppModule
2. Fix module dependency injection (DatabaseModule, ConfigModule imports)
3. Unify `DELIVERY_PERSON` role enum
4. Add v1 version prefix to all controllers
5. Add auth + ownership to CRUD endpoints
6. Remove OrderItemController and OrderStatusHistoryController
7. Create AddressController
8. Create PaginationDto + PaginatedResult utilities
9. Implement restaurant listing with filters
10. Install all new dependencies (backend + frontend)

### Phase 2: Customer Browsing + Cart
1. Cart Zustand store
2. Restaurant browsing page with filters
3. Restaurant detail page with menu
4. CartDrawer component + header cart icon
5. Cart full page
6. Customer profile + address management
7. Shared components (EmptyState, LoadingSkeleton, AnimatedPage, etc.)

### Phase 3: Ordering + Payments
1. Order state machine
2. CreateOrderDto + transactional order creation
3. Order status transition endpoint with validation
4. Stripe module (StripeService, PaymentController, WebhookController)
5. Checkout page (order creation -> Stripe redirect -> confirmation)
6. Order history page
7. Order detail page (without live map yet)

### Phase 4: Restaurant Dashboard
1. Dashboard layout with sidebar navigation
2. Overview page with stats
3. Incoming orders view
4. Order management (accept/reject, update status)
5. Menu/product CRUD
6. Opening hours management
7. Restaurant settings (profile, images, delivery config)

### Phase 5: Real-time WebSocket System
1. GatewayModule with WsJwtGuard
2. OrderGateway (order lifecycle events, new order notifications)
3. DeliveryGateway (GPS, delivery assignment)
4. Frontend SocketManager + useSocketEvent hook
5. Connect sockets in AuthProvider
6. Wire order status changes through WebSocket
7. Wire new order notifications to restaurant dashboard
8. Restaurant availability broadcasting

### Phase 6: Delivery System + Map Tracking
1. DeliveryPerson + Delivery interfaces
2. DeliveryModule (endpoints for driver registration, availability, accept, pickup, delivered)
3. GPS streaming via WebSocket (driver -> server -> customer)
4. GpsStoreService with stale cleanup cron
5. Delivery assignment flow (broadcast, first-accept, timeout escalation)
6. Driver registration page
7. Driver dashboard (available deliveries list)
8. Active delivery view
9. Leaflet integration (MapBase, DeliveryTrackingMap)
10. Driver marker interpolation
11. OSRM route polyline
12. Customer tracking page with live map
13. `(protected-delivery)` route group

---

## 15. Final Module Dependency Graph

```
AppModule
  +-- AuthModule (global guard, exports ActorContextService, AppwriteService)
  +-- DatabaseModule (exports DatabaseService)
  +-- UserModule
  +-- RestaurantModule
  +-- ProductModule
  +-- OrderModule (absorbs OrderItemService, OrderStatusHistoryService)
  +-- OpeningHoursModule
  +-- AddressModule (now with controller)
  +-- GatewayModule (OrderGateway, DeliveryGateway, GpsStoreService)
  +-- PaymentModule (StripeService, WebhookController)
  +-- DeliveryModule (DeliveryService, DeliveryPersonService)
  +-- ConfigModule.forRoot()
  +-- ClsModule.forRoot()
  +-- ScheduleModule.forRoot()
```

---

## 16. Verification

### Backend
- `pnpm dev --filter=api` starts without errors
- All endpoints respond on `/v1/` prefix
- Protected endpoints return 401 without JWT
- Order creation validates restaurant active, products available, min order value
- Status transitions follow state machine (reject invalid transitions)
- Stripe webhook processes payment confirmation and transitions order
- WebSocket connects with valid JWT, disconnects without
- GPS updates broadcast to correct rooms

### Frontend
- `pnpm dev --filter=web` starts without errors
- `pnpm check-types` passes
- Restaurant browsing loads and filters work
- Cart persists across navigation and page refresh
- Checkout redirects to Stripe and handles return
- Order tracking shows live status updates via WebSocket
- Map renders with correct markers and route
- Driver marker animates smoothly between GPS updates
- Dark mode applies to all new pages including map tiles
- Mobile responsive on all pages

### Integration
- Full order lifecycle: browse -> add to cart -> checkout -> pay -> restaurant confirms -> prepares -> ready -> driver picks up (GPS visible on customer map) -> delivered
- WebSocket events trigger correct TanStack Query invalidations
- Multiple concurrent users on different roles see correct data
