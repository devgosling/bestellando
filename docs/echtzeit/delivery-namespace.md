# Delivery-Namespace (`/delivery`)

Verantwortliches Gateway: `apps/api/src/gateway/delivery/delivery.gateway.ts`.

## Subscribe-Events (Client → Server)

### `subscribe:delivery`

Customer subscribed Live-Tracking-Updates für eine Bestellung.

```ts
deliverySocket.emit("subscribe:delivery", { orderId });
```

Server: `client.join(`order:${orderId}`)`.

### `driver:location`

Driver schickt eine GPS-Position.

```ts
deliverySocket.emit("driver:location", {
  orderId,
  lat: 52.5200,
  lng: 13.4050,
  heading: 90,        // optional
});
```

Server-Logik:

```ts
@SubscribeMessage("driver:location")
handleDriverLocation(client: Socket, payload: DriverLocationEvent) {
  // 1. In-Memory-Cache aktualisieren
  this.gpsStore.set(payload.orderId, {
    lat: payload.lat,
    lng: payload.lng,
    heading: payload.heading,
    timestamp: Date.now(),
  });

  // 2. An interessierte Listeners weiterleiten
  this.server
    .to(`order:${payload.orderId}`)
    .emit("delivery:gps-position", {
      ...payload,
      timestamp: Date.now(),
    });
}
```

## Emit-Events (Server → Client)

### `delivery:gps-position`

**An**: alle Listeners im Room `order:<orderId>`
**Trigger**: Driver schickt `driver:location`

Payload (`DriverLocationEvent`):

```ts
{
  orderId: string;
  lat: number;
  lng: number;
  heading?: number;
  timestamp: number;
}
```

Verwendung im DeliveryMap:

```tsx
useDeliverySocket({
  orderId,
  onGpsUpdate: (data: DriverLocationEvent) => {
    updatePosition({ lat: data.lat, lng: data.lng, heading: data.heading });
    setLastUpdateAt(Date.now());
  },
});
```

## GpsStoreService

`apps/api/src/gateway/delivery/gps-store.service.ts`

In-Memory-Map mit TTL.

```ts
@Injectable()
export class GpsStoreService {
  private store = new Map<string, GpsEntry>();
  private readonly TTL = 60_000; // 60s

  set(orderId: string, position: GpsEntry) {
    this.store.set(orderId, { ...position, timestamp: Date.now() });
  }

  get(orderId: string): GpsEntry | null {
    const entry = this.store.get(orderId);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.TTL) {
      this.store.delete(orderId);
      return null;
    }
    return entry;
  }

  // Optional: Cron entfernt veraltete Einträge alle 5 Minuten
  @Cron("*/5 * * * *")
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > this.TTL) this.store.delete(key);
    }
  }
}
```

## Stale-Detection im Frontend

Wenn länger als 25s (default) kein `delivery:gps-position` empfangen wird, betrachtet die DeliveryMap die Position als stale:

```tsx
const [lastUpdateAt, setLastUpdateAt] = useState<number | null>(null);
const [isStale, setIsStale] = useState(true);

useEffect(() => {
  const tick = () => {
    const reference = lastUpdateAt ?? mountedAt;
    setIsStale(Date.now() - reference > trackingTimeoutMs);
  };
  tick();
  const id = setInterval(tick, 5000);
  return () => clearInterval(id);
}, [lastUpdateAt, trackingTimeoutMs]);
```

Bei `isStale = true`:
- Driver-Marker auf der Karte ausgeblendet
- Overlay erscheint: "Standortübertragung nicht verfügbar"

## Sicherheit

- **Driver darf nur für Lieferungen senden, die ihm zugewiesen sind** — Server sollte das prüfen, indem er `client.data.userId` mit dem zugewiesenen Driver vergleicht
- **Frequenz limitieren** — z. B. max. 1 Update / 2s pro Driver, um Spam abzufangen
- **GPS-Daten sind sensibel** — sollten **nicht** in einem zugänglichen Log persistiert werden
