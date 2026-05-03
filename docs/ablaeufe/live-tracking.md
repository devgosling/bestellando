# Live-Tracking

Tiefer Tauchgang in das Live-Tracking-Feature: Driver-Position auf der Karte des Customers.

## Trigger

Live-Tracking ist aktiv, wenn:

```ts
delivery.status === "PICKED_UP"
```

Solange `delivery.status === "ASSIGNED"` (Driver ist auf dem Weg zum Restaurant), zeigen wir das **nicht** dem Customer — sonst sieht er den Driver beim Restaurant herumstehen, was verwirrend wäre.

## Komponenten-Architektur

```
Customer Browser:
  /orders/:orderId
    └─ <DeliveryMap orderId restaurantPosition customerPosition restaurantName />
         │
         ├─ useDriverPosition()  ← lokaler State
         ├─ useDeliverySocket({ orderId, onGpsUpdate })
         │   └─ socket.on("delivery:gps-position") ─► onGpsUpdate(data)
         │       └─ updatePosition + setLastUpdateAt + setIsStale(false)
         │
         ├─ useRoute(driverLatLng, customerPosition)
         │   └─ fetch OSRM ─► route = [[lat,lng], ...]
         │
         └─ Stale-Detection (setInterval 5s)
             └─ Date.now() - lastUpdateAt > 25_000 ─► isStale = true
```

## Driver-seitig

In `<ActiveDeliveryView>` (oder ähnlich):

```tsx
useEffect(() => {
  if (delivery.status === "DELIVERED") return;
  if (!navigator.geolocation) return;

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      deliverySocket.emit("driver:location", {
        orderId: delivery.order,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        heading: pos.coords.heading ?? undefined,
      });
    },
    (err) => console.error("Geo error", err),
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    },
  );

  return () => navigator.geolocation.clearWatch(watchId);
}, [delivery]);
```

`maximumAge: 5000` — der Browser darf maximal 5s alte Positionen zurückgeben (Caching).

## Backend-Verarbeitung

Im `DeliveryGateway`:

```ts
@SubscribeMessage("driver:location")
handleDriverLocation(client: Socket, payload: DriverLocationEvent) {
  // 1. Cache speichern (für späteres Polling, falls jemand spät joined)
  this.gpsStore.set(payload.orderId, {
    lat: payload.lat,
    lng: payload.lng,
    heading: payload.heading,
    timestamp: Date.now(),
  });

  // 2. An alle Listeners im order-Room weiterleiten
  this.server
    .to(`order:${payload.orderId}`)
    .emit("delivery:gps-position", {
      ...payload,
      timestamp: Date.now(),
    });
}
```

## Customer-seitige Subscription

Customer landet auf `/orders/:orderId`. Der `<DeliveryMap>` mounted und ruft:

```tsx
useDeliverySocket({
  orderId,
  onGpsUpdate: (data) => {
    updatePosition({ lat: data.lat, lng: data.lng, heading: data.heading });
    setLastUpdateAt(Date.now());
    setIsStale(false);
  },
});
```

`useDeliverySocket`:

```ts
export function useDeliverySocket({ orderId, onGpsUpdate }) {
  useEffect(() => {
    const socket = getDeliverySocket();
    if (!socket) return;

    socket.emit("subscribe:delivery", { orderId });

    const handler = (data: DriverLocationEvent) => {
      if (data.orderId === orderId) onGpsUpdate(data);
    };
    socket.on("delivery:gps-position", handler);

    return () => {
      socket.off("delivery:gps-position", handler);
    };
  }, [orderId, onGpsUpdate]);
}
```

## Stale-Detection

Bei verschiedenen Failure-Modi soll die Karte das Tracking **gracefully** ausblenden:

| Szenario | Wirkung |
|----------|---------|
| Driver verweigert GPS | Frontend bekommt nie eine Position → Stale beim Mount |
| Driver schließt App | watchPosition stoppt → keine Updates → Stale nach 25s |
| Driver verliert Connection | WS disconnects, keine Events → Stale |
| Driver-Browser im Hintergrund | watchPosition kann pausieren → Stale möglich |

Implementation:

```tsx
const [lastUpdateAt, setLastUpdateAt] = useState<number | null>(null);
const [isStale, setIsStale] = useState(true);
const mountedAtRef = useRef<number>(Date.now());

useEffect(() => {
  const tick = () => {
    const reference = lastUpdateAt ?? mountedAtRef.current;
    setIsStale(Date.now() - reference > trackingTimeoutMs);
  };
  tick();
  const id = setInterval(tick, 5000);
  return () => clearInterval(id);
}, [lastUpdateAt, trackingTimeoutMs]);
```

Bei `isStale = true`:

```tsx
{isStale && (
  <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-4">
    <div className="rounded-lg bg-background/90 px-4 py-2 shadow-lg backdrop-blur-sm border border-border max-w-[90%] text-center">
      <p className="font-medium text-foreground">
        Standortübertragung nicht verfügbar
      </p>
      <p className="text-xs text-muted mt-0.5">
        Der Fahrer teilt seinen Standort gerade nicht. Restaurant und
        Lieferadresse werden trotzdem angezeigt.
      </p>
    </div>
  </div>
)}
```

## Routen-Berechnung

`useRoute(driverPos, customerPos)`:

```ts
const { route } = useRoute(driverLatLng, customerPosition);

// Returns: { route: [[lat, lng], [lat, lng], ...] | [] }
```

Implementation typischerweise:

```ts
async function fetchRoute(from: [lat, lng], to: [lat, lng]) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?geometries=geojson&overview=full`;
  const res = await fetch(url);
  const data = await res.json();
  return data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}
```

Wird mit `useEffect` getriggert, wenn sich `driverLatLng` ändert. Throttling empfohlen, um nicht bei jedem GPS-Update einen neuen OSRM-Call zu machen — z. B. nur jede 30s neu berechnen.

## Marker-Icons

Inline-SVG via `divIcon`, weil Default-Marker-Bilder oft nicht laden:

```ts
function pinIcon(color: string, glyph: string) {
  const html = `
    <div style="position:relative;width:32px;height:40px;...">
      <svg viewBox="0 0 32 40" ...>
        <path d="..." fill="${color}"/>
        <circle cx="16" cy="16" r="9" fill="white"/>
      </svg>
      <span style="position:absolute;...">${glyph}</span>
    </div>
  `;
  return L.divIcon({ html, className: "", iconSize: [32, 40], iconAnchor: [16, 40] });
}

const restaurantIcon = pinIcon("#f97316", "🍴");
const customerIcon = pinIcon("#0ea5e9", "🏠");
const driverIcon = pinIcon("#22c55e", "🚴");
```

Vorteil: keine externen Image-Requests, sofortige Sichtbarkeit.

## Auto-Fit

Damit alle Pins immer im Viewport bleiben:

```tsx
function FitBounds({ points }: { points: LatLng[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length >= 2) {
      const bounds = L.latLngBounds(points.map((p) => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, points]);

  return null;
}
```

`points` enthält Restaurant + Customer + (falls vorhanden) Driver.

## Datenschutz

- GPS-Daten sind **nicht** in der Datenbank persistiert
- In-Memory-Cache mit 60s-TTL
- Nach `delivery.status === "DELIVERED"` werden keine Updates mehr akzeptiert (sollte serverseitig validiert werden)
- Keine Logs der GPS-Position
