# Delivery-Modul

Pfad: `apps/api/src/delivery/`

Verwaltet **Lieferungen** und **Lieferpersonen**.

## Datei-Übersicht

```
delivery/
├── delivery.module.ts
├── controller/
│   ├── delivery.controller.ts          # /v1/delivery/*
│   └── delivery-person.controller.ts   # /v1/delivery-person/*
└── service/
    ├── delivery.service.ts
    └── delivery-person.service.ts
```

## Konzept

### Delivery
Eine `delivery`-Row entsteht, sobald eine Bestellung in den Status `READY` übergeht. Sie verbindet:
- Eine Bestellung (`order`)
- Eine Lieferperson (`deliveryPerson`)
- Status-Tracking (`status`: `PENDING_ASSIGNMENT` → `ASSIGNED` → `PICKED_UP` → `DELIVERED`)
- Beweisfoto (`proofImageId`) bei DELIVERED

### Delivery-Person
Eine `delivery_person`-Row gehört zu einem Appwrite-User mit Team-Mitgliedschaft `delivery_person`. Hat:
- Name, Telefon
- Vehicle-Type (`BICYCLE` / `SCOOTER` / `CAR`)
- Aktuelle GPS-Position (in-memory via `GpsStoreService`, nicht in DB)

## Delivery-Endpunkte

### `GET /v1/delivery/order/:orderId`

Auth-required — Liefert die Lieferung zu einer Bestellung. Wird sowohl vom Customer (für Driver-Info) als auch vom Restaurant (für Lieferstatus) und Driver selbst genutzt.

> Aktuell **kein** strenger UserType-Check — der Endpoint gibt allen authentifizierten Usern Daten. Sollte verschärft werden auf "Order-Beteiligte" (Customer der Order, Restaurant-Owner, zugeordnete Lieferperson).

Response:

```ts
{
  $id: string;
  order: string;
  deliveryPerson: { $id, name, phone, vehicleType };
  status: "PENDING_ASSIGNMENT" | "ASSIGNED" | "PICKED_UP" | "DELIVERED";
  proofImageId?: string;
  estimatedMinutes?: number;
}
```

### `GET /v1/delivery/active`

`@RequireUserType(["DELIVERY_PERSON"])` — Aktive Lieferungen der eigenen Person (alle, die nicht `DELIVERED` sind).

### `PATCH /v1/delivery/:id/status`

`@RequireUserType(["DELIVERY_PERSON"])` — Statuswechsel der Lieferung. Triggert automatisch entsprechenden Order-Statuswechsel:

- Delivery `ASSIGNED → PICKED_UP` → Order `READY → PICKED_UP`
- Delivery `PICKED_UP → DELIVERED` → Order `PICKED_UP → DELIVERED`

### `POST /v1/delivery/:id/proof`

`@RequireUserType(["DELIVERY_PERSON"])` — Lädt ein Beweisfoto hoch (multer-File).

Speichert die Datei in Appwrite Storage (Bucket `delivery-proof`) und schreibt die `fileId` in `delivery.proofImageId`.

## Delivery-Person-Endpunkte

### `POST /v1/delivery-person/register`

@Public — Registriert eine neue Lieferperson.

Body:

```ts
{
  email: string;
  password: string;
  name: string;
  phone: string;
  vehicleType: "BICYCLE" | "SCOOTER" | "CAR";
}
```

Schritte:
1. Appwrite-User erstellen
2. User dem Team `delivery_person` hinzufügen (Rolle `delivery_person`)
3. `delivery_person`-Row mit Profil-Daten anlegen

### `GET /v1/delivery-person/me`

`@RequireUserType(["DELIVERY_PERSON"])` — Eigenes Profil.

## Delivery-Service — wichtige Methoden

### `notifyOrderReady(orderId)`

Wird von `OrderService.transitionStatus()` aufgerufen, sobald Order in `READY` geht.

1. Bestimmt verfügbare Lieferpersonen in der Nähe des Restaurants
2. Wählt eine aus (aktuell First-Available)
3. Erstellt `delivery`-Row mit `status: ASSIGNED`, `deliveryPerson: ...`
4. Emittiert `delivery:assigned` an:
   - Restaurant-Room (zur Anzeige des Driver-Namens im Dashboard)
   - Customer-Order-Room
   - Driver direkt

### `assignDelivery(deliveryId, driverId)`

Manuelles Zuweisen (Admin/Future).

### `markPickedUp(deliveryId)`

Setzt `delivery.status = "PICKED_UP"`, triggert Order-Statuswechsel.

### `markDelivered(deliveryId, proofImageId?)`

Setzt `delivery.status = "DELIVERED"`, optional Beweisfoto, triggert Order-Statuswechsel.

## Delivery-Schema

| Feld | Typ |
|------|-----|
| `$id` | string |
| `order` | string (FK → order) |
| `deliveryPerson` | string (FK → delivery_person) |
| `status` | enum |
| `assignedAt` | timestamp |
| `pickedUpAt` | timestamp? |
| `deliveredAt` | timestamp? |
| `proofImageId` | string? (Appwrite-Storage-File-ID) |

## DeliveryPerson-Schema

| Feld | Typ |
|------|-----|
| `$id` | string |
| `userId` | string (Appwrite-User-ID) |
| `name` | string |
| `phone` | string |
| `vehicleType` | enum |
| `isActive` | bool |

## GPS-Tracking

GPS-Position wird **nicht in der DB** gespeichert (zu hochfrequent). Statt dessen:

- **In-Memory-Cache** via `GpsStoreService` (siehe [Gateway-Modul](./gateway.md))
- **TTL 60s** — Position gilt als veraltet, wenn länger keine Updates
- WebSocket-Events `delivery:gps-position` werden direkt vom Driver an interessierte Listeners (Customer + Restaurant) weitergeleitet

## Beweisbilder (Proof Images)

Workflow:

1. Driver markiert die Lieferung als `DELIVERED` und lädt ein Foto hoch
2. `POST /v1/delivery/:id/proof` (multipart/form-data)
3. Backend lädt zu Appwrite Storage Bucket `delivery-proof`
4. `fileId` wird in `delivery.proofImageId` gespeichert
5. Frontend (Restaurant- und Customer-Seite) zeigt das Bild via `ProofImage`-Component an

`ProofImage`-Component:

```tsx
<ProofImage deliveryId={delivery.$id} />
// → lädt Bild via authenticatedFetch + Appwrite-Storage-View-URL
```
