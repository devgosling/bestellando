# Order Components

Pfad: `apps/web/src/components/order/`

Komponenten für Bestelldetail + Live-Tracking.

## Übersicht

| Komponente | Datei | Zweck |
|------------|-------|-------|
| `DeliveryMap` | `DeliveryMap.tsx` | Live-Tracking-Karte mit Restaurant/Customer/Driver-Pins |
| `OrderCard` | `OrderCard.tsx` | Liste-Item für Bestellübersicht |
| `OrderStatusBadge` | `OrderStatusBadge.tsx` | Farbiger Status-Chip |
| `OrderTimeline` | `OrderTimeline.tsx` | Vertikale Status-Timeline mit Zeitstempel |

## Hooks (in `hooks/`)

| Hook | Datei | Zweck |
|------|-------|-------|
| `useDriverPosition` | `hooks/useDriverPosition.ts` | Lokaler State für aktuelle GPS-Position |
| `useDeliverySocket` | `hooks/useDeliverySocket.ts` | Subscribed `delivery:gps-position` und ruft `onGpsUpdate` |
| `useRoute` | `hooks/useRoute.ts` | Holt Route-Polyline (z. B. via OSRM) zwischen 2 Punkten |

---

## OrderCard

```tsx
<OrderCard order={order} />
```

Zeigt:
- Restaurant-Name
- Bestelldatum
- Total
- `OrderStatusBadge`

Klick → `/orders/:orderId`.

---

## OrderStatusBadge

```tsx
<OrderStatusBadge status={order.currentStatus} />
```

Farbig je nach Status:

| Status | Farbe |
|--------|-------|
| PENDING | warning (gelb) |
| CONFIRMED | primary (blau) |
| PREPARING | secondary (lila) |
| READY | success (grün) |
| PICKED_UP | accent (orange) |
| DELIVERED | default (grau) |
| CANCELLED | danger (rot) |

Mit Deutsch-Label: "Ausstehend", "Bestätigt", "In Zubereitung", "Bereit", "Abgeholt", "Geliefert", "Storniert".

---

## OrderTimeline

```tsx
<OrderTimeline
  history={historyArray}
  currentStatus={order.currentStatus}
/>
```

Vertikale Liste:

```
✓ Ausgeführt um 14:23   ────  PENDING
✓ Ausgeführt um 14:24   ────  CONFIRMED
✓ Ausgeführt um 14:30   ────  PREPARING
● Aktuell               ────  READY
○                        ────  PICKED_UP
○                        ────  DELIVERED
```

- Erfolgte Schritte: gefüllter Punkt + Zeitstempel
- Aktueller Schritt: hervorgehoben
- Künftige Schritte: leerer Punkt, grau

---

## DeliveryMap (zentral!)

[apps/web/src/components/order/DeliveryMap.tsx](../../apps/web/src/components/order/DeliveryMap.tsx)

Live-Tracking-Karte. Wird auf der Customer-Order-Detail-Seite gezeigt, sobald `delivery.status === "PICKED_UP"`.

### Props

```ts
interface DeliveryMapProps {
  orderId: string;
  restaurantPosition: [number, number];   // [lat, lng]
  customerPosition: [number, number];     // [lat, lng]
  restaurantName?: string;
  trackingTimeoutMs?: number;             // default 25000
}
```

### Features

1. **Drei Pins**:
   - Restaurant (orange, 🍴)
   - Lieferadresse (blau, 🏠)
   - Driver (grün, 🚴) — nur wenn aktuelle GPS-Position vorhanden

2. **Routenlinie** (Polyline, blau) zwischen Driver-Position und Lieferadresse

3. **Auto-Fit-Bounds** auf alle sichtbaren Punkte

4. **Stale-Detection**: Wenn länger als `trackingTimeoutMs` (25s) keine GPS-Updates kommen:
   - Driver-Pin wird ausgeblendet
   - Overlay erscheint: "Standortübertragung nicht verfügbar"

### Custom-Marker (Inline-SVG)

Statt Default-Leaflet-Marker (deren Bilder oft nicht laden) verwenden wir `divIcon` mit Inline-SVG:

```ts
function pinIcon(color: string, glyph: string) {
  const html = `
    <div style="position:relative;width:32px;height:40px;...">
      <svg viewBox="0 0 32 40" ...>
        <path d="M16 0C7.16 0 0 7.16 0 16..." fill="${color}"/>
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

Vorteil: keine externen Bild-Requests, immer sichtbar.

### Stale-Logic

```tsx
const [lastUpdateAt, setLastUpdateAt] = useState<number | null>(null);
const [isStale, setIsStale] = useState(true);
const mountedAtRef = useRef<number>(Date.now());

const handleGpsUpdate = useCallback((data: DriverLocationEvent) => {
  updatePosition({ lat: data.lat, lng: data.lng, heading: data.heading });
  setLastUpdateAt(Date.now());
  setIsStale(false);
}, [updatePosition]);

useDeliverySocket({ orderId, onGpsUpdate: handleGpsUpdate });

useEffect(() => {
  const tick = () => {
    const ref = lastUpdateAt ?? mountedAtRef.current;
    setIsStale(Date.now() - ref > trackingTimeoutMs);
  };
  tick();
  const id = setInterval(tick, 5000);
  return () => clearInterval(id);
}, [lastUpdateAt, trackingTimeoutMs]);
```

Bei `isStale = true` wird das Overlay gezeigt:

```tsx
{isStale && (
  <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-4">
    <div className="rounded-lg bg-background/90 px-4 py-2 ...">
      <p className="font-medium">Standortübertragung nicht verfügbar</p>
      <p className="text-xs text-muted">
        Der Fahrer teilt seinen Standort gerade nicht...
      </p>
    </div>
  </div>
)}
```

---

## useDriverPosition

```ts
const { position, updatePosition } = useDriverPosition();
```

Lokaler State (Hook-Wrapping).

---

## useDeliverySocket

```ts
useDeliverySocket({
  orderId,
  onGpsUpdate: (data: DriverLocationEvent) => { ... },
});
```

Intern:
- Holt den Delivery-Socket via `getDeliverySocket()`
- Emit `subscribe:delivery` mit `orderId`
- Listen auf `delivery:gps-position`
- Cleanup: Off-Listener beim Unmount

---

## useRoute

```ts
const { route } = useRoute(driverPos, customerPos);
```

Holt eine Route-Polyline zwischen 2 Punkten — typischerweise via OSRM (OpenStreetMap Routing Machine):

```http
GET https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?geometries=geojson
```

Returns Array von `[lat, lng]`-Punkten, das in `<Polyline />` gerendert wird.

> **Datenschutz**: Public OSRM ist okay für Demos, in Production eigenen Server hosten oder kommerziellen Anbieter nutzen.
