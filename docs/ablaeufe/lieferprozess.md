# Lieferprozess

End-to-end Beschreibung der Lieferung — vom "Bestellung READY" bis "Geliefert".

## Akteure

- **Restaurant**: setzt Order auf `READY`
- **Driver** (DELIVERY_PERSON): nimmt Lieferung an, transportiert
- **Customer**: sieht Live-Tracking
- **Backend**: koordiniert + speichert

## Phasen

```
Order: READY        Restaurant ─PATCH /v1/order/:id/status {READY}─► API
                                                                     │
                                  ┌─────────────────────────────────┘
                                  │
                                  ▼
Delivery: ASSIGNED   API ─DeliveryService.notifyOrderReady─► creates delivery row
                                                                  │
                                                                  ├─► WS event: delivery:assigned
                                                                  │
Order: PICKED_UP     Driver ─PATCH /v1/delivery/:id/status {PICKED_UP}─► API
                                                                  │
                                                                  ├─► Order.currentStatus = PICKED_UP
                                                                  ├─► WS: order:status-changed
                                                                  │
[Live-Tracking]      Driver browser ─emit("driver:location")─► API ─emit("delivery:gps-position")─► Customer
                                                                  │
Order: DELIVERED     Driver ─POST /proof + PATCH /status {DELIVERED}─► API
                                                                  │
                                                                  ├─► proofImageId
                                                                  ├─► delivery.status = DELIVERED
                                                                  ├─► order.currentStatus = DELIVERED
                                                                  └─► WS-Events
```

## 1. Order wird READY

Restaurant klickt im Dashboard "Bereit":

```http
PATCH /v1/order/:id/status
{ "status": "READY" }
```

Backend (`OrderService.transitionStatus()`):
1. Statuswechsel validieren (RESTAURANT darf PREPARING → READY)
2. Order aktualisieren
3. `order_status_history` Row
4. WS-Event `order:status-changed`
5. **Wichtig**: `DeliveryService.notifyOrderReady(orderId)` triggern

## 2. Driver-Zuweisung

`DeliveryService.notifyOrderReady(orderId)`:

```ts
async notifyOrderReady(orderId: string) {
  const order = await this.orderService.getOrderById(orderId, false);

  // 1. Verfügbare Driver finden
  const drivers = await this.dataBase.listRows({
    tableId: "delivery_person",
    queries: [Query.equal("isActive", true)],
  });

  // (TODO: hier könnte Distanz-/Polygon-Logic mit DeliveryZone laufen)
  const driver = drivers.rows[0];
  if (!driver) {
    // Kein Driver verfügbar — Retry-Logic könnte hier ansetzen
    return;
  }

  // 2. Delivery-Row erzeugen
  const delivery = await this.dataBase.createRow({
    tableId: "delivery",
    rowId: ID.unique(),
    data: {
      order: orderId,
      deliveryPerson: driver.$id,
      status: "ASSIGNED",
      assignedAt: new Date().toISOString(),
    },
  });

  // 3. WS-Event an alle Beteiligten
  const event: DeliveryAssignedEvent = {
    orderId,
    driverId: driver.$id,
    driverName: driver.name,
    driverPhone: driver.phone,
    vehicleType: driver.vehicleType,
    estimatedMinutes: 15,    // TODO: real distance/route
  };
  this.orderGateway.notifyOrderUpdate(orderId, "delivery:assigned", event);
  this.orderGateway.notifyRestaurant(restaurantId, "delivery:assigned", event);
}
```

## 3. Driver erhält Auftrag

Im `/deliveries`-Index sieht der Driver die neue Lieferung. Tap → Detail-Seite (`/deliveries/:deliveryId`).

`<ActiveDeliveryView>` zeigt:
- Karte mit Route zum Restaurant
- Order-Details + Restaurant-Adresse
- "Abgeholt"-Button

## 4. Driver fährt zum Restaurant

Sobald die Page geladen ist, startet GPS-Tracking:

```tsx
useEffect(() => {
  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      deliverySocket.emit("driver:location", {
        orderId: delivery.order,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        heading: pos.coords.heading ?? undefined,
      });
    },
    null,
    { enableHighAccuracy: true },
  );
  return () => navigator.geolocation.clearWatch(watchId);
}, []);
```

> Während `delivery.status === "ASSIGNED"` sieht der Customer die Driver-Position **noch nicht** in der Karte — das DeliveryMap-Component wird erst aktiv bei `PICKED_UP`.

## 5. Driver markiert "Abgeholt"

Beim Restaurant angekommen, klickt Driver "Abgeholt":

```http
PATCH /v1/delivery/:id/status
{ "status": "PICKED_UP" }
```

Backend:
- `delivery.status = "PICKED_UP"`
- `order.currentStatus = "PICKED_UP"` (Kaskade via `OrderService.transitionStatus`)
- WS-Events:
  - `order:status-changed` an Customer + Restaurant
  - (intern) Customer's DeliveryMap zeigt jetzt die Karte

## 6. Live-Tracking aktiv

Customer auf `/orders/:orderId`:
- Sieht jetzt `<DeliveryMap>` mit Restaurant-Pin (orange) + Customer-Pin (blau) + Driver-Pin (grün)
- Polyline zwischen Driver und Customer-Pin (von OSRM)
- GPS-Updates kommen alle ~5s rein → Driver-Pin bewegt sich

Wenn länger als 25s kein Update: Overlay "Standortübertragung nicht verfügbar" + Driver-Pin ausgeblendet.

## 7. Driver liefert aus

Beim Customer angekommen, klickt Driver "Geliefert":

1. Camera/File-Picker öffnet sich → Driver macht Foto vom Paket vor der Tür
2. Upload zu Storage:
   ```http
   POST /v1/delivery/:id/proof  (multipart/form-data)
   ```
3. Status setzen:
   ```http
   PATCH /v1/delivery/:id/status
   { "status": "DELIVERED" }
   ```

Backend:
- `delivery.proofImageId = <fileId>`
- `delivery.status = "DELIVERED"`
- `delivery.deliveredAt = now`
- `order.currentStatus = "DELIVERED"`
- WS-Events

## 8. Customer sieht "Geliefert"

OrderTimeline aktualisiert auf alle Schritte abgeschlossen. DeliveryMap blendet Live-Tracking aus.

(Optional: Notification an Customer "Deine Bestellung wurde geliefert").

## 9. Restaurant sieht Beweisfoto

Im Restaurant-Dashboard erscheint bei der Order-Card jetzt das `<ProofImage>`-Component, das das Beweisfoto anzeigt.

## Failure-Szenarien

### Kein Driver verfügbar

`DeliveryService.notifyOrderReady()` findet keinen Driver. Order bleibt READY.

**Aktuell nicht implementiert**: Re-Try alle X Minuten. Restaurant könnte manuell einen Driver zuweisen.

### Driver bricht ab

Aktuell **nicht** im UI vorgesehen. Möglich:
- Driver klickt "Auftrag stornieren"
- `delivery.status = "PENDING_ASSIGNMENT"` zurück
- `order.currentStatus = "READY"` zurück
- `notifyOrderReady()` wird erneut getriggert (anderer Driver)

### GPS-Tracking-Fehler

Wenn der Driver die GPS-Berechtigung verweigert, bekommt der Customer keine Live-Position. Die DeliveryMap zeigt "Standortübertragung nicht verfügbar" — Bestellung trotzdem ablieferbar.

### Customer nicht zu Hause

Driver klickt trotzdem "Geliefert" mit Foto vom Paket vor der Tür / im Briefkasten. Foto dient als Nachweis.

## Datensicherheit

- **GPS-Daten**: nicht persistiert in der DB, nur im RAM-Store mit TTL
- **Beweisfoto**: in Appwrite Storage mit eingeschränkten Permissions (Customer + Restaurant + Driver)
- **Driver-Telefon**: nur an Customer/Restaurant der jeweiligen Order übermittelt
