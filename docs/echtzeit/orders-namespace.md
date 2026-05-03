# Orders-Namespace (`/orders`)

Verantwortliches Gateway: `apps/api/src/gateway/orders/order.gateway.ts`.

## Subscribe-Events (Client → Server)

### `subscribe:order`

Client tritt Room `order:<orderId>` bei.

```ts
orderSocket.emit("subscribe:order", { orderId: "abc123" });
```

Wird von:
- Customer auf `/orders/:orderId` (Detail-Seite)
- ggf. Driver / Restaurant für gezielte Updates

### `subscribe:restaurant`

Restaurant-Owner tritt Room `restaurant:<id>:orders` bei.

```ts
orderSocket.emit("subscribe:restaurant", { restaurantId: "xyz" });
```

> Idealerweise Owner-Check: nur erlauben, wenn `client.data.userId === restaurant.ownerId`.

## Emit-Events (Server → Client)

### `order:new`

**An**: `restaurant:<restaurantId>:orders`
**Trigger**: Neue Bestellung (`OrderService.createOrder()`)

Payload:

```ts
{
  order: OrderEntity;
  items: Array<{ productId: string; quantity: number }>;
}
```

Verwendung im Frontend:

```tsx
useSocketEvent(orderSocket, "order:new", () => {
  queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
});
```

### `order:status-changed`

**An**: `order:<orderId>` + `restaurant:<restaurantId>:orders`
**Trigger**: Status-Wechsel (`OrderService.transitionStatus()`, Stripe-Webhook)

Payload (`OrderStatusChangedEvent`):

```ts
{
  orderId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  timestamp: string;   // ISO
}
```

Verwendung:

```tsx
useSocketEvent<OrderStatusChangedEvent>(orderSocket, "order:status-changed", (data) => {
  if (data.orderId === currentOrderId) {
    queryClient.invalidateQueries({ queryKey: ["order", data.orderId] });
  }
});
```

### `delivery:assigned`

**An**: `order:<orderId>` + `restaurant:<restaurantId>:orders` + (optional) Driver-Socket
**Trigger**: Driver wird der Bestellung zugewiesen (`DeliveryService.notifyOrderReady()`)

Payload (`DeliveryAssignedEvent`):

```ts
{
  orderId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicleType: "BICYCLE" | "SCOOTER" | "CAR";
  estimatedMinutes: number;
}
```

Verwendung:

```tsx
useSocketEvent<DeliveryAssignedEvent>(orderSocket, "delivery:assigned", (data) => {
  setDriverInfo(data);
  queryClient.invalidateQueries({ queryKey: ["delivery", "order", data.orderId] });
});
```

## Server-Helper (im Code aufrufen)

```ts
this.orderGateway.notifyRestaurant(restaurantId, "order:new", { order, items });
this.orderGateway.notifyOrderUpdate(orderId, "order:status-changed", { ... });
```

## Berechtigungen

Aktuell **kein** Permission-Check beim Subscribe. Idealerweise:

- `subscribe:order`: prüfen, dass der User zum Customer/Restaurant/Driver der Order gehört
- `subscribe:restaurant`: prüfen, dass `client.data.userId === restaurant.ownerId`

Implementierung möglich z. B. so:

```ts
@SubscribeMessage("subscribe:restaurant")
async handleSubscribeRestaurant(client: Socket, payload: { restaurantId: string }) {
  const userId = client.data.userId;
  const restaurant = await this.dataBase.getRow({ ... });
  if (restaurant.ownerId !== userId) {
    return client.emit("error", { message: "Forbidden" });
  }
  client.join(`restaurant:${payload.restaurantId}:orders`);
}
```
