# Order-Modul

Pfad: `apps/api/src/order/`

**Kernlogik des Bestellsystems**: Erstellt Bestellungen, validiert State-Übergänge, koordiniert mit Payment + Delivery.

## Datei-Übersicht

```
order/
├── order.module.ts
├── controller/order.controller.ts
├── dto/
│   ├── create-order.dto.ts
│   └── update-order-status.dto.ts
└── service/
    ├── order.service.ts
    └── order-state-machine.ts
```

## Endpunkte

### `POST /v1/order`

`@RequireUserType(["CUSTOMER"])` — Bestellung erstellen.

Body (`CreateOrderDto`):

```ts
{
  restaurantId: string;
  deliveryAddressId: string;
  items: Array<{
    productId: string;
    quantity: number;
    modifierOptionIds?: string[];
    specialInstructions?: string;
  }>;
  specialInstructions?: string;
}
```

Vollständiger Service-Flow siehe unten.

### `GET /v1/order/mine?page=1&limit=25`

`@RequireUserType(["CUSTOMER"])` — Eigene Bestellungen, paginiert.

### `GET /v1/order/:id`

Auth-required — Detail einer Bestellung mit Eigentümer-Check.

> Für CUSTOMER: muss die Bestellung dem User gehören.
> Für RESTAURANT: muss zur eigenen Restaurant-Bestellung gehören.

Antwort enthält **expandiertes** Restaurant + Address + DeliveryAddress (eager-loading).

### `GET /v1/order/:id/items`

Listet `order_item`-Rows der Bestellung. Enthält `product`-Details (durch Appwrite-Beziehung).

### `GET /v1/order/:id/history`

Listet `order_status_history`-Rows in chronologischer Reihenfolge.

### `PATCH /v1/order/:id/status`

Body:

```ts
{ status: "CONFIRMED" | "PREPARING" | "READY" | "PICKED_UP" | "DELIVERED" | "CANCELLED" }
```

Validiert via `validateTransition(currentStatus, newStatus, userType)`. Bei Erfolg:
- Schreibt `order.currentStatus`
- Erzeugt `order_status_history`-Row
- Emittiert `order:status-changed` über Socket.io
- Bei `READY`: Triggert `DeliveryService.notifyOrderReady()`

### `GET /v1/order/restaurant/:restaurantId`

`@RequireUserType(["RESTAURANT"])` — Bestellungen eines Restaurants. Owner-Check.

## State-Machine

`apps/api/src/order/service/order-state-machine.ts`

Status:

```
PENDING ──┬─► CONFIRMED ──► PREPARING ──► READY ──► PICKED_UP ──► DELIVERED
          └─► CANCELLED        │              │
                               ▼              ▼
                          CANCELLED      CANCELLED
                                              ▲
                                              └────── (von hier auch)
```

Terminal: `DELIVERED`, `CANCELLED`.

### Actor-Restrictions

| Übergang | Erlaubter Actor |
|----------|-----------------|
| `PENDING → CONFIRMED` | (Webhook automatisch nach Stripe-Zahlung — `system`) |
| `PENDING → CANCELLED` | CUSTOMER, RESTAURANT, system |
| `CONFIRMED → PREPARING` | RESTAURANT |
| `PREPARING → READY` | RESTAURANT |
| `CONFIRMED|PREPARING → CANCELLED` | RESTAURANT |
| `READY → PICKED_UP` | DELIVERY_PERSON |
| `PICKED_UP → DELIVERED` | DELIVERY_PERSON |

```ts
export function validateTransition(
  current: OrderStatus,
  next: OrderStatus,
  userType: UserType,
): void {
  const transitions = ALLOWED_TRANSITIONS[current];
  if (!transitions || !transitions[next]) {
    throw new BadRequestException(`Cannot transition from ${current} to ${next}`);
  }
  const allowedActors = transitions[next];
  if (!allowedActors.includes(userType)) {
    throw new ForbiddenException(`${userType} cannot perform this transition`);
  }
}
```

## OrderService — `createOrder` Schritt-für-Schritt

```ts
async createOrder(dto: CreateOrderDto) {
  const userId = this.actorContextService.get().user.id;
  const databaseId = this.configService.get("DATABASE_ID")!;

  // 1. Restaurant-Validation
  const restaurant = await this.dataBase.getRow({ databaseId, tableId: "restaurant", rowId: dto.restaurantId });
  if (!restaurant || !restaurant.isActive) throw new BadRequestException("Restaurant not found or inactive");

  // 2. Items validieren + Modifier auflösen + Preise snapshotten
  const products = [];
  for (const item of dto.items) {
    const product = await this.dataBase.getRow({ databaseId, tableId: "product", rowId: item.productId });
    if (!product || !product.isAvailable) throw new BadRequestException(...);

    const resolvedModifiers = [];
    for (const modifierOptionId of item.modifierOptionIds ?? []) {
      const option = await this.modifierOptionService.getById(modifierOptionId);
      // 🔑 Capitalization! "Product" mit großem P
      const productField = (option as { Product?: unknown }).Product;
      const optionProductId = typeof productField === "string"
        ? productField
        : (productField as { $id?: string })?.$id;
      if (optionProductId !== item.productId) {
        throw new BadRequestException("Modifier does not belong to product");
      }
      if (option.isAvailable === false) {
        throw new BadRequestException(`Modifier "${option.name}" not available`);
      }
      resolvedModifiers.push({ $id: option.$id, priceDelta: option.priceDelta });
    }

    const modifierTotal = resolvedModifiers.reduce((s, m) => s + m.priceDelta, 0);
    const unitPrice = product.basePrice + modifierTotal;
    products.push({ product, quantity: item.quantity, resolvedModifiers, unitPrice });
  }

  // 3. Subtotal
  const subtotal = products.reduce((s, p) => s + p.unitPrice * p.quantity, 0);

  // 4. MinOrderValue
  if (subtotal < restaurant.minOrderValue) {
    throw new BadRequestException(`Minimum order value is ${restaurant.minOrderValue}`);
  }

  // 5. Total
  const deliveryFee = restaurant.deliveryFee || 0;
  const totalAmount = subtotal + deliveryFee;

  // 6. Order-Row erstellen
  const order = await this.dataBase.createRow({
    databaseId,
    tableId: "order",
    rowId: ID.unique(),
    data: {
      customer: userId,
      restaurant: dto.restaurantId,
      deliveryAddress: dto.deliveryAddressId,
      currentStatus: "PENDING",
      paymentStatus: "UNPAID",
      subtotal,
      deliveryFee,
      totalAmount,
      specialInstructions: dto.specialInstructions || "",
    },
  });

  // 7. order_item + order_item_modifier
  for (const { product, quantity, unitPrice, resolvedModifiers, specialInstructions } of products) {
    const orderItem = await this.orderItemService.createOrderItem({
      order: order.$id,
      product: product.$id,
      quantity,
      unitPrice,
      totalPrice: unitPrice * quantity,
      specialInstructions,
    });
    for (const mod of resolvedModifiers) {
      await this.dataBase.createRow({
        databaseId,
        tableId: "order_item_modifier",
        rowId: ID.unique(),
        data: {
          orderItem: orderItem.$id,
          modifierOption: mod.$id,
          deltaPrice: mod.priceDelta,
        },
      });
    }
  }

  // 8. Initial-Status-Log
  await this.orderStatusHistoryService.createOrderStatusHistory({
    order: order.$id,
    status: "PENDING",
  });

  // 9. WebSocket-Notify
  this.orderGateway.notifyRestaurant(dto.restaurantId, "order:new", {
    order,
    items: products.map(({ product, quantity }) => ({ productId: product.$id, quantity })),
  });

  return order;
}
```

## `getOrderById` mit eager-loading

Damit das Frontend Live-Tracking-Karten rendern kann, expandiert dieser Service nested addresses:

```ts
async getOrderById(orderId: string, enforceOwnership = true) {
  const order = await this.dataBase.getRow({ databaseId, tableId: "order", rowId: orderId });

  // ... Ownership-Check ...

  // Restaurant-Objekt holen
  let restaurantObj = null;
  if (typeof order.restaurant === "string") {
    restaurantObj = await this.dataBase.getRow({ databaseId, tableId: "restaurant", rowId: order.restaurant });
  } else if (typeof order.restaurant === "object") {
    restaurantObj = order.restaurant;
  }

  // Restaurant.address expandieren
  if (restaurantObj && typeof restaurantObj.address === "string") {
    const addr = await this.dataBase.getRow({ databaseId, tableId: "address", rowId: restaurantObj.address });
    if (addr) restaurantObj.address = addr;
  }
  if (restaurantObj) order.restaurant = restaurantObj;

  // deliveryAddress expandieren
  if (typeof order.deliveryAddress === "string") {
    const addr = await this.dataBase.getRow({ databaseId, tableId: "address", rowId: order.deliveryAddress });
    if (addr) order.deliveryAddress = addr;
  }

  return order;
}
```

## Order-Schema

| Feld | Typ |
|------|-----|
| `$id` | string |
| `customer` | string (FK → users) |
| `restaurant` | string (FK → restaurant) |
| `deliveryAddress` | string (FK → address) |
| `currentStatus` | enum |
| `paymentStatus` | "UNPAID" / "PAID" / "REFUNDED" |
| `subtotal` | number |
| `deliveryFee` | number |
| `totalAmount` | number |
| `specialInstructions` | string |

## Konstruktor-Inject

`order.service.ts` injectet via `forwardRef()`:

- `OrderGateway` (für WS-Emits)
- `DeliveryService` (für `notifyOrderReady`)

Grund: zirkuläre Abhängigkeiten, weil `DeliveryService` und `OrderGateway` ihrerseits `OrderService` brauchen.
