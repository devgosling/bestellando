# Backend (`apps/api`) — Übersicht

Das Backend ist eine **NestJS-11**-Anwendung. Alle Endpunkte sind unter dem URI-Prefix `/v1/` versioniert.

## Bootstrap-Flow

1. `main.ts` — `NestFactory.create()`, globale Pipes (ValidationPipe), CORS, Listen auf Port `PORT` (Default 3000)
2. `app.module.ts` — Importiert alle Sub-Module
3. Jedes Sub-Modul wird mit `@Module({ imports, controllers, providers })` definiert
4. Globaler `AccessInterceptor` aus `auth/interceptor/access.interceptor.ts` wird als `APP_INTERCEPTOR` registriert

## Modul-Übersicht

| Modul | Pfad | Zweck |
|-------|------|-------|
| [Auth](./module/auth.md) | `auth/` | JWT-Bearer + Decorators + Interceptor |
| [Database](./module/database.md) | `database/` | Wrapper um Appwrite-`TablesDB` |
| [User](./module/user.md) | `user/` | Registrierung + `getUserType()` |
| [Restaurant](./module/restaurant.md) | `restaurant/` | Restaurant-CRUD + Registrierung |
| [Address](./module/address.md) | `address/` | Adressen + Geocoding |
| [Product](./module/product.md) | `product/` | Menü-Items |
| [ModifierOption](./module/modifier-option.md) | `modifierOption/` | Produkt-Extras |
| [OpeningHours](./module/opening-hours.md) | `openingHours/` | Öffnungszeiten |
| [Order](./module/order.md) | `order/` | Bestellungen + State-Machine |
| [OrderItem](./module/order-item.md) | `orderItem/` | Bestellzeilen-Snapshots |
| [OrderStatusHistory](./module/order-status-history.md) | `orderStatusHistory/` | Audit-Trail |
| [Payment](./module/payment.md) | `payment/` | Stripe-Integration |
| [Delivery](./module/delivery.md) | `delivery/` | Lieferungen + Lieferpersonen |
| [DeliveryZone](./module/delivery-zone.md) | `delivery-zone/` | Liefergebiet-Polygone |
| [Gateway](./module/gateway.md) | `gateway/` | WebSocket-Gateways (`/orders`, `/delivery`) |

## Querschnittsthemen

- [Decorators](./decorators.md) — `@Public`, `@RequireUserType`, `@Cooldown`
- [Guards & Interceptors](./guards-interceptors.md) — JwtGuard, AccessInterceptor
- [DTOs & Validierung](./dto-validation.md) — class-validator-Patterns

## Globale Configuration

### `main.ts`-Inhalt (vereinfacht)

```ts
const app = await NestFactory.create(AppModule);
app.enableCors({ origin: process.env.CORS_ORIGIN, credentials: true });
app.setGlobalPrefix("v1");
app.enableVersioning({ type: VersioningType.URI });
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
await app.listen(process.env.PORT ?? 3000);
```

### Wichtige globale Provider

| Provider | Scope | Zweck |
|----------|-------|-------|
| `ActorContextService` | REQUEST | Hält `{ user, meta, username }` für die aktuelle Anfrage |
| `AppwriteService` | DEFAULT | Liefert Admin- + per-User-Clients |
| `DatabaseService` | DEFAULT | Wrapper um `TablesDB` |

## REST-Endpoint-Übersicht

| Modul | Pfade |
|-------|-------|
| Auth/User | `POST /v1/user/register`, `GET /v1/user/data` |
| Restaurant | `GET /v1/restaurant`, `GET /v1/restaurant/:id`, `GET /v1/restaurant/mine`, `POST /v1/restaurant`, `PATCH /v1/restaurant/:id`, `POST /v1/restaurant/register` |
| Address | `POST /v1/address`, `PATCH /v1/address/:id`, `GET /v1/address/reverse?lat&lng`, `GET /v1/address/mine` |
| Product | `GET /v1/product?restaurantId=`, `POST /v1/product`, `PATCH /v1/product/:id`, `DELETE /v1/product/:id` |
| ModifierOption | `GET /v1/modifier-option?productId=`, `POST /v1/modifier-option`, `PATCH /v1/modifier-option/:id`, `DELETE /v1/modifier-option/:id` |
| OpeningHours | `GET /v1/opening-hours?restaurantId=`, `POST /v1/opening-hours`, `DELETE /v1/opening-hours/:id` |
| Order | `POST /v1/order`, `GET /v1/order/mine`, `GET /v1/order/:id`, `GET /v1/order/:id/items`, `GET /v1/order/:id/history`, `PATCH /v1/order/:id/status`, `GET /v1/order/restaurant/:restaurantId` |
| Payment | `POST /v1/payment/checkout/:orderId`, `POST /v1/payment/webhook` |
| Delivery | `GET /v1/delivery/order/:orderId`, `GET /v1/delivery/active`, `PATCH /v1/delivery/:id/status`, `POST /v1/delivery/:id/proof` |
| DeliveryPerson | `POST /v1/delivery-person/register`, `GET /v1/delivery-person/me` |
| DeliveryZone | `GET /v1/delivery-zone?restaurantId=`, `POST /v1/delivery-zone`, `DELETE /v1/delivery-zone/:id` |
