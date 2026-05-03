# Ordnerstruktur

Vollständige Auflistung der wichtigen Ordner und Dateien.

## Root

```
bestellando/
├── apps/
├── packages/
├── docs/
├── node_modules/        (von pnpm)
├── package.json         (Root-Scripts)
├── pnpm-workspace.yaml
├── turbo.json
├── CLAUDE.md
└── README.md
```

## `apps/api/` — NestJS-Backend

```
apps/api/
├── src/
│   ├── main.ts                          # Bootstrap (NestFactory.create)
│   ├── app.module.ts                    # Root-Modul (importiert alle Sub-Module)
│   │
│   ├── auth/                            # Authentifizierung
│   │   ├── auth.module.ts
│   │   ├── decorator/
│   │   │   ├── public.decorator.ts        # @Public()
│   │   │   ├── user-type.decorator.ts     # @RequireUserType([...])
│   │   │   └── cooldown.decorator.ts      # @Cooldown(...)
│   │   ├── guard/
│   │   │   └── jwt.guard.ts               # JWT-Bearer-Guard (Passport)
│   │   ├── interceptor/
│   │   │   └── access.interceptor.ts      # Setzt ActorContext + erzwingt Decorators
│   │   ├── interface/
│   │   │   └── user-request.interface.ts  # Request-Type-Erweiterung
│   │   ├── service/
│   │   │   ├── actor-context.service.ts   # Request-scoped Actor-Daten
│   │   │   ├── appwrite.service.ts        # Admin- + per-User-Clients
│   │   │   └── cooldown.service.ts        # Rate-Limit-Logik
│   │   └── strategy/
│   │       └── jwt.service.ts             # JwtStrategy (Passport)
│   │
│   ├── database/                        # DatabaseService (Wrapper um Appwrite-TablesDB)
│   │   ├── database.module.ts
│   │   └── service/
│   │       └── database.service.ts
│   │
│   ├── user/                            # User-Daten & Rollen-Auflösung
│   │   ├── user.module.ts
│   │   ├── controller/
│   │   │   └── user.controller.ts         # /v1/user (Registrierung, /data)
│   │   ├── interface/
│   │   │   └── user.interface.ts
│   │   └── service/
│   │       └── user.service.ts            # getUserType() etc.
│   │
│   ├── restaurant/                      # Restaurant-CRUD
│   │   ├── restaurant.module.ts
│   │   ├── controller/restaurant.controller.ts
│   │   ├── dto/restaurant-filter.dto.ts
│   │   └── service/restaurant.service.ts
│   │
│   ├── address/                         # Adressen + Geocoding
│   │   ├── address.module.ts
│   │   ├── controller/address.controller.ts
│   │   └── service/
│   │       ├── address.service.ts
│   │       └── geocoding.service.ts
│   │
│   ├── product/                         # Produkte (Menü-Items)
│   │   ├── product.module.ts
│   │   ├── controller/product.controller.ts
│   │   └── service/product.service.ts
│   │
│   ├── modifierOption/                  # Produkt-Modifier (Extras)
│   │   ├── modifier-option.module.ts
│   │   ├── controller/modifier-option.controller.ts
│   │   ├── dto/modifier-option.dto.ts
│   │   └── service/modifier-option.service.ts
│   │
│   ├── openingHours/                    # Öffnungszeiten
│   │   ├── opening-hours.module.ts
│   │   ├── controller/opening-hours.controller.ts
│   │   └── service/opening-hours.service.ts
│   │
│   ├── order/                           # Kernlogik der Bestellungen
│   │   ├── order.module.ts
│   │   ├── controller/order.controller.ts
│   │   ├── dto/
│   │   │   ├── create-order.dto.ts
│   │   │   └── update-order-status.dto.ts
│   │   └── service/
│   │       ├── order.service.ts
│   │       └── order-state-machine.ts     # Statusübergänge validieren
│   │
│   ├── orderItem/                       # Zeilen-Snapshots
│   │   ├── order-item.module.ts
│   │   └── service/order-item.service.ts
│   │
│   ├── orderStatusHistory/              # Audit-Trail
│   │   ├── order-status-history.module.ts
│   │   └── service/order-status-history.service.ts
│   │
│   ├── payment/                         # Stripe-Integration
│   │   ├── payment.module.ts
│   │   ├── controller/
│   │   │   ├── payment.controller.ts      # Checkout-Session
│   │   │   └── webhook.controller.ts      # Stripe-Webhook
│   │   └── service/stripe.service.ts
│   │
│   ├── delivery/                        # Lieferungen
│   │   ├── delivery.module.ts
│   │   ├── controller/
│   │   │   ├── delivery.controller.ts
│   │   │   └── delivery-person.controller.ts
│   │   └── service/
│   │       ├── delivery.service.ts
│   │       └── delivery-person.service.ts
│   │
│   ├── delivery-zone/                   # Liefergebiete (Polygone)
│   │   ├── delivery-zone.module.ts
│   │   ├── controller/delivery-zone.controller.ts
│   │   └── service/delivery-zone.service.ts
│   │
│   ├── gateway/                         # WebSocket-Gateways
│   │   ├── gateway.module.ts
│   │   ├── orders/order.gateway.ts        # /orders Namespace
│   │   └── delivery/
│   │       ├── delivery.gateway.ts        # /delivery Namespace
│   │       └── gps-store.service.ts       # In-Memory-GPS-Cache
│   │
│   └── common/
│       ├── dto/pagination.dto.ts
│       └── interface/paginated-result.interface.ts
│
├── test/                                 # E2E-Tests
├── package.json
├── nest-cli.json
└── tsconfig.json
```

## `apps/web/` — React-Vite-Frontend

```
apps/web/
├── src/
│   ├── main.tsx                         # ReactDOM.createRoot, RouterProvider
│   ├── App.tsx                          # Provider-Composition
│   ├── routeTree.gen.ts                 # Generiert von TanStack Router
│   │
│   ├── components/                      # Wiederverwendbare Komponenten
│   │   ├── shared/
│   │   │   ├── AnimatedPage.tsx
│   │   │   ├── BottomTabBar.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   ├── MapBase.tsx                # Leaflet-Basiskarte
│   │   │   ├── PriceDisplay.tsx           # EUR-Formatierung
│   │   │   ├── SearchInput.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── ToggleSwitch.tsx           # HeroUI-v3-Switch-Wrapper
│   │   │
│   │   ├── cart/
│   │   │   ├── CartBottomBar.tsx
│   │   │   ├── CartDrawer.tsx
│   │   │   ├── CartEmpty.tsx
│   │   │   ├── CartItem.tsx
│   │   │   ├── CartSidebar.tsx
│   │   │   └── CartSummary.tsx
│   │   │
│   │   ├── checkout/
│   │   │   ├── AddressSelector.tsx
│   │   │   ├── AddressStep.tsx
│   │   │   ├── CheckoutForm.tsx
│   │   │   ├── CheckoutStepper.tsx
│   │   │   ├── OrderConfirmation.tsx
│   │   │   ├── PaymentStep.tsx
│   │   │   └── ReviewStep.tsx
│   │   │
│   │   ├── restaurant/
│   │   │   ├── MenuSection.tsx
│   │   │   ├── OpeningHoursBadge.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductModal.tsx
│   │   │   ├── RestaurantCard.tsx
│   │   │   ├── RestaurantFilters.tsx
│   │   │   └── RestaurantHero.tsx
│   │   │
│   │   ├── order/
│   │   │   ├── DeliveryMap.tsx            # Live-Tracking-Karte
│   │   │   ├── OrderCard.tsx
│   │   │   ├── OrderStatusBadge.tsx
│   │   │   ├── OrderTimeline.tsx
│   │   │   └── hooks/
│   │   │       ├── useDeliverySocket.ts
│   │   │       ├── useDriverPosition.ts
│   │   │       └── useRoute.ts
│   │   │
│   │   ├── delivery/
│   │   │   ├── ActiveDeliveryView.tsx
│   │   │   ├── DeliveryActionBar.tsx
│   │   │   ├── DeliveryCard.tsx
│   │   │   ├── NavigationMap.tsx
│   │   │   └── ProofImage.tsx
│   │   │
│   │   └── dashboard/                   # Restaurant-Dashboard
│   │       ├── DashboardSidebar.tsx
│   │       ├── IncomingOrderCard.tsx
│   │       ├── MenuProductRow.tsx
│   │       ├── OpeningHoursEditor.tsx
│   │       ├── ProductFormModal.tsx
│   │       ├── RestaurantSettingsForm.tsx
│   │       └── StatCard.tsx
│   │
│   ├── routes/                          # File-basiertes Routing
│   │   ├── __root.tsx                   # Wurzelroute
│   │   ├── index.tsx                    # Startseite
│   │   ├── map.tsx                      # Restaurant-Karte
│   │   │
│   │   ├── auth/
│   │   │   ├── route.tsx
│   │   │   ├── login.tsx
│   │   │   └── register/
│   │   │       ├── user.tsx
│   │   │       ├── restaurant.tsx
│   │   │       └── delivery.tsx
│   │   │
│   │   ├── (protected-customer)/        # Customer-only
│   │   │   ├── route.tsx                # ensureAuthenticated("CUSTOMER")
│   │   │   ├── cart.tsx
│   │   │   ├── checkout.tsx
│   │   │   ├── orders/
│   │   │   │   ├── index.tsx
│   │   │   │   └── $orderId.tsx
│   │   │   ├── profile/index.tsx
│   │   │   └── restaurants/
│   │   │       ├── index.tsx
│   │   │       └── $restaurantId.tsx
│   │   │
│   │   ├── (protected-restaurant)/      # Restaurant-only
│   │   │   ├── route.tsx
│   │   │   └── dashboard/
│   │   │       ├── route.tsx
│   │   │       ├── index.tsx                     # Stats-Übersicht
│   │   │       ├── orders/index.tsx
│   │   │       ├── menu/index.tsx
│   │   │       ├── opening-hours/index.tsx
│   │   │       ├── delivery-zones/index.tsx
│   │   │       └── settings/index.tsx
│   │   │
│   │   └── (protected-delivery)/        # Delivery-only
│   │       ├── route.tsx
│   │       └── deliveries/
│   │           ├── index.tsx
│   │           └── $deliveryId.tsx
│   │
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   ├── auth-store.ts
│   │   ├── route-guard.ts                # ensureAuthenticated()
│   │   └── useUserContext.ts
│   │
│   ├── stores/
│   │   └── cart-store.ts                 # Zustand-Store für Cart
│   │
│   ├── hooks/
│   │   └── useSocketEvent.ts             # Socket.io-Event-Hook
│   │
│   └── kit/                              # Page-Layout-Bausteine
│       ├── footer.tsx
│       ├── header.tsx
│       ├── router-context.ts
│       ├── subheading.tsx
│       └── twopart-page.tsx
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

## `packages/`

```
packages/
├── interfaces/
│   ├── src/
│   │   ├── index.ts
│   │   ├── address.interface.ts
│   │   ├── create-restaurant.dto.ts
│   │   ├── delivery.interface.ts
│   │   ├── delivery-person.interface.ts
│   │   ├── delivery-zone.interface.ts
│   │   ├── modifier-option.interface.ts
│   │   ├── opening-hours.interface.ts
│   │   ├── order.interface.ts
│   │   ├── order-item.interface.ts
│   │   ├── order-status-history.interface.ts
│   │   ├── product.interface.ts
│   │   ├── register.interface.ts
│   │   ├── restaurant.interface.ts
│   │   └── ws-events.ts
│   ├── dist/                             # build output
│   └── package.json
│
├── lib/
│   ├── src/
│   │   ├── index.ts
│   │   ├── appwrite.ts
│   │   ├── socket.ts
│   │   └── api/
│   │       ├── api.ts                    # authenticatedFetch
│   │       └── interfaces/Paginate.ts
│   ├── consts/properties.ts
│   └── package.json
│
├── hooks/
│   ├── src/
│   │   ├── index.ts
│   │   ├── useApiMutation.ts
│   │   ├── useApiQuery.ts
│   │   ├── useApiSideEffects.ts
│   │   ├── useAuth.ts
│   │   ├── useNotification.ts
│   │   ├── useTheme.ts
│   │   └── useUserLocation.ts
│   └── package.json
│
├── contexts/
│   ├── src/
│   │   ├── index.ts
│   │   └── theme.ts
│   └── package.json
│
├── ui/
│   └── package.json
│
└── typescript-config/
    ├── base.json
    ├── nestjs.json
    └── react.json
```
