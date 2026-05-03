# Gateway-Modul (WebSockets)

Pfad: `apps/api/src/gateway/`

Stellt zwei Socket.io-**Namespaces** bereit:

- `/orders` — Bestell-Events
- `/delivery` — Liefer-Events (inkl. GPS-Position)

## Datei-Übersicht

```
gateway/
├── gateway.module.ts
├── orders/
│   └── order.gateway.ts
└── delivery/
    ├── delivery.gateway.ts
    └── gps-store.service.ts        # In-Memory GPS-Cache
```

## Authentifizierung

Beim Verbindungsaufbau muss der Client den JWT mitsenden:

```ts
const socket = io(`${API_URL}/orders`, {
  auth: { token: jwt },
});
```

Im Gateway:

```ts
@WebSocketGateway({ namespace: "/orders", cors: { origin: "*" } })
export class OrderGateway implements OnGatewayConnection {
  async handleConnection(client: Socket) {
    const token = client.handshake.auth.token;
    if (!token) return client.disconnect();

    try {
      const account = await this.appwriteService.createClientWithJwt(token).account.get();
      client.data.userId = account.$id;
    } catch {
      client.disconnect();
    }
  }
}
```

## Order-Gateway (`/orders`)

### Subscribe-Events (Client → Server)

| Event | Payload | Effekt |
|-------|---------|--------|
| `subscribe:order` | `{ orderId: string }` | Client tritt Room `order:<orderId>` bei |
| `subscribe:restaurant` | `{ restaurantId: string }` | Client tritt Room `restaurant:<id>:orders` bei |

### Emit-Events (Server → Client)

| Event | An wen | Payload |
|-------|--------|---------|
| `order:new` | `restaurant:<id>:orders` | `{ order, items: [...] }` |
| `order:status-changed` | `order:<orderId>` + `restaurant:<id>:orders` | `{ orderId, previousStatus, newStatus, timestamp }` |
| `delivery:assigned` | `order:<orderId>` + `restaurant:<id>:orders` | `{ orderId, driverId, driverName, driverPhone, vehicleType, estimatedMinutes }` |

### Code-Beispiele

```ts
@WebSocketGateway({ namespace: "/orders" })
export class OrderGateway {
  @WebSocketServer() server: Server;

  notifyRestaurant(restaurantId: string, event: string, data: unknown) {
    this.server.to(`restaurant:${restaurantId}:orders`).emit(event, data);
  }

  notifyOrderUpdate(orderId: string, event: string, data: unknown) {
    this.server.to(`order:${orderId}`).emit(event, data);
  }

  @SubscribeMessage("subscribe:order")
  handleSubscribeOrder(client: Socket, payload: { orderId: string }) {
    client.join(`order:${payload.orderId}`);
  }

  @SubscribeMessage("subscribe:restaurant")
  handleSubscribeRestaurant(client: Socket, payload: { restaurantId: string }) {
    // TODO: Owner-Check
    client.join(`restaurant:${payload.restaurantId}:orders`);
  }
}
```

## Delivery-Gateway (`/delivery`)

### Subscribe-Events (Client → Server)

| Event | Payload | Effekt |
|-------|---------|--------|
| `subscribe:delivery` | `{ orderId: string }` | Customer subscribed Live-Tracking |
| `driver:location` | `{ orderId, lat, lng, heading? }` | Driver sendet GPS-Update |

### Emit-Events (Server → Client)

| Event | An wen | Payload |
|-------|--------|---------|
| `delivery:gps-position` | `order:<orderId>` | `DriverLocationEvent: { orderId, lat, lng, heading?, timestamp }` |

### Code-Beispiel — GPS-Update

```ts
@SubscribeMessage("driver:location")
handleDriverLocation(client: Socket, payload: DriverLocationEvent) {
  // Cache speichern
  this.gpsStore.set(payload.orderId, {
    lat: payload.lat,
    lng: payload.lng,
    heading: payload.heading,
    timestamp: Date.now(),
  });

  // An Customer-Listener weiterleiten
  this.server
    .to(`order:${payload.orderId}`)
    .emit("delivery:gps-position", {
      ...payload,
      timestamp: Date.now(),
    });
}
```

## GpsStoreService

`apps/api/src/gateway/delivery/gps-store.service.ts`

In-Memory-Cache für GPS-Positionen.

```ts
@Injectable()
export class GpsStoreService {
  private store = new Map<string, { lat: number; lng: number; heading?: number; timestamp: number }>();

  set(orderId: string, position: { lat, lng, heading?, timestamp }) {
    this.store.set(orderId, position);
  }

  get(orderId: string) {
    const pos = this.store.get(orderId);
    if (!pos) return null;
    if (Date.now() - pos.timestamp > 60_000) return null;  // 60s TTL
    return pos;
  }

  // Optional: Cron-Job, um veraltete Einträge zu entfernen
}
```

> **Hinweis**: Bei mehreren API-Instances wäre Redis/Pub-Sub nötig. Aktuell Single-Instance.

## Helper für andere Services

`OrderGateway` wird in andere Services injectet, damit sie Events emitten können:

```ts
@Injectable()
export class OrderService {
  constructor(
    @Inject(forwardRef(() => OrderGateway))
    private readonly orderGateway: OrderGateway,
  ) {}
}
```

`forwardRef()` ist nötig wegen zirkulärer Modul-Abhängigkeit.

## CORS

WebSocket-CORS muss separat konfiguriert sein:

```ts
@WebSocketGateway({
  namespace: "/orders",
  cors: { origin: process.env.CORS_ORIGIN, credentials: true },
})
```

## Vollständige Event-Referenz

Siehe [Echtzeit → Events](../../echtzeit/events.md).
