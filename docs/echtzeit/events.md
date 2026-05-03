# Event-Referenz

Vollständige Auflistung aller WebSocket-Events.

## Namespace `/orders`

### Client → Server

| Event | Payload | Beschreibung |
|-------|---------|--------------|
| `subscribe:order` | `{ orderId: string }` | Tritt Room `order:<orderId>` bei |
| `subscribe:restaurant` | `{ restaurantId: string }` | Tritt Room `restaurant:<id>:orders` bei |

### Server → Client

| Event | Empfänger | Payload |
|-------|-----------|---------|
| `order:new` | Restaurant-Room | `{ order: OrderEntity, items: { productId, quantity }[] }` |
| `order:status-changed` | Order-Room + Restaurant-Room | `OrderStatusChangedEvent` |
| `delivery:assigned` | Order-Room + Restaurant-Room | `DeliveryAssignedEvent` |

## Namespace `/delivery`

### Client → Server

| Event | Payload | Beschreibung |
|-------|---------|--------------|
| `subscribe:delivery` | `{ orderId: string }` | Tritt Room `order:<orderId>` bei (für GPS-Tracking) |
| `driver:location` | `DriverLocationEvent` | GPS-Update vom Driver |

### Server → Client

| Event | Empfänger | Payload |
|-------|-----------|---------|
| `delivery:gps-position` | Order-Room | `DriverLocationEvent` |

## Payload-Typen

Aus `@repo/interfaces/src/ws-events.ts`:

### `OrderStatusChangedEvent`

```ts
interface OrderStatusChangedEvent {
  orderId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  timestamp: string;     // ISO-Datum
}
```

### `DeliveryAssignedEvent`

```ts
interface DeliveryAssignedEvent {
  orderId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicleType: "BICYCLE" | "SCOOTER" | "CAR";
  estimatedMinutes: number;
}
```

### `DriverLocationEvent`

```ts
interface DriverLocationEvent {
  orderId: string;
  lat: number;
  lng: number;
  heading?: number;
  timestamp?: number;     // unix-ms
}
```

## Event-Flow-Beispiele

### Neue Bestellung

```
Customer ──POST /v1/order──► API
                              │
                              ├─ DB: order, order_item, ...
                              │
                              └─ emit("order:new") ──► restaurant:<id>:orders
                                                       (Restaurant-Dashboard)
```

### Status-Wechsel "Bereit"

```
Restaurant ──PATCH /v1/order/:id/status──► API
                                            │
                                            ├─ DB: order.currentStatus = "READY"
                                            │
                                            ├─ emit("order:status-changed")
                                            │   └─► order:<orderId> (Customer)
                                            │   └─► restaurant:<id>:orders
                                            │
                                            └─ DeliveryService.notifyOrderReady(orderId)
                                               │
                                               ├─ DB: delivery row erstellt
                                               │
                                               └─ emit("delivery:assigned")
                                                   └─► order:<orderId>
                                                   └─► restaurant:<id>:orders
```

### Live-Tracking

```
Driver ──navigator.geolocation.watchPosition──► (Browser)
   │
   └─ emit("driver:location") ──► /delivery namespace
                                    │
                                    ├─ gpsStore.set(orderId, position)
                                    │
                                    └─ emit("delivery:gps-position")
                                        └─► order:<orderId>
                                            (Customer's DeliveryMap)
```

## Best Practices

1. **Events einmal definieren** im `@repo/interfaces/src/ws-events.ts`
2. **Im Frontend `useSocketEvent` benutzen** — kümmert sich um Cleanup
3. **Bei Reconnect re-subscriben** — Server-Rooms gehen verloren bei Disconnect
4. **Idempotente Handler** — Events können doppelt ankommen
5. **Permission-Checks** — beim Subscribe und beim Emitten von sensiblen Daten
