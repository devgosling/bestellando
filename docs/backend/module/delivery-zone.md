# DeliveryZone-Modul

Pfad: `apps/api/src/delivery-zone/`

Verwaltet die **Liefergebiete** eines Restaurants (Polygone auf der Karte).

## Datei-Übersicht

```
delivery-zone/
├── delivery-zone.module.ts
├── controller/delivery-zone.controller.ts
└── service/delivery-zone.service.ts
```

## Konzept

Ein Restaurant kann mehrere Liefergebiete definieren — als geschlossene Polygone (Liste von `[lng, lat]`-Punkten). Bei einer Bestellung kann das Backend prüfen, ob die Lieferadresse innerhalb mindestens eines Polygons liegt.

## Endpunkte

### `GET /v1/delivery-zone?restaurantId=...`

@Public — Listet die Liefergebiete eines Restaurants.

Response:

```ts
[
  {
    $id: "...",
    restaurant: "...",
    name: "Innenstadt",
    coordinates: [[lng, lat], [lng, lat], ...],   // Polygon
    deliveryFee?: number,                          // Optional pro Zone überschreiben
  },
]
```

### `POST /v1/delivery-zone`

`@RequireUserType(["RESTAURANT"])` — Erstellt ein neues Polygon. Owner-Check.

Body:

```ts
{
  restaurantId: string;
  name: string;
  coordinates: [number, number][];   // mindestens 3 Punkte, geschlossen
  deliveryFee?: number;
}
```

### `PATCH /v1/delivery-zone/:id`

`@RequireUserType(["RESTAURANT"])` — Aktualisiert.

### `DELETE /v1/delivery-zone/:id`

`@RequireUserType(["RESTAURANT"])` — Löscht.

## Schema

| Feld | Typ |
|------|-----|
| `$id` | string |
| `restaurant` | string (FK → restaurant) |
| `name` | string |
| `coordinates` | array of [lng, lat] tuples |
| `deliveryFee` | number? — falls gesetzt, überschreibt restaurant.deliveryFee für diese Zone |

## Point-in-Polygon-Logik

Das Backend kann prüfen, ob eine Adresse in einer Zone liegt — typischerweise mit dem Ray-Casting-Algorithmus:

```ts
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
```

Der `delivery-zone.service.ts` exportiert:

```ts
findZoneForAddress(restaurantId: string, addressCoords: [lng, lat]): Promise<DeliveryZone | null>
```

## Frontend

Im Restaurant-Dashboard ([dashboard/delivery-zones/index.tsx](../../apps/web/src/routes/(protected-restaurant)/dashboard/delivery-zones/index.tsx)) gibt es eine Leaflet-Karte mit Polygon-Editor:

- Punkte per Klick setzen
- Polygon schließen (Doppelklick / Enter)
- Pro Zone Name + Liefergebühr eintragen
- Speichern

Library: meist eingebauter Leaflet-Drawing oder selbst geschriebene Click-Handler.

## Validierung beim Bestellen (Future)

Aktuell wird die Zone-Validierung **nicht** in `OrderService.createOrder()` gemacht. Möglicher Ausbau:

```ts
const zone = await this.deliveryZoneService.findZoneForAddress(
  dto.restaurantId,
  deliveryAddress.coordinates,
);
if (!zone) throw new BadRequestException("Lieferadresse nicht im Liefergebiet");
const fee = zone.deliveryFee ?? restaurant.deliveryFee;
```
