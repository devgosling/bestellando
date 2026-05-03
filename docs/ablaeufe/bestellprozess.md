# Bestellprozess

End-to-end Beschreibung, was passiert, wenn ein Customer bestellt — vom "Add to Cart" bis zur ausgelieferten Bestellung.

## Sequenz-Diagramm

```
Customer       Frontend             API                Appwrite          Stripe
   │              │                  │                    │                │
   │ 1. Add Cart  │                  │                    │                │
   │─────────────►│ (Zustand-Store)  │                    │                │
   │              │                  │                    │                │
   │ 2. Checkout  │                  │                    │                │
   │─────────────►│                  │                    │                │
   │              │ 3. POST /v1/order│                    │                │
   │              │─────────────────►│                    │                │
   │              │                  │ 4. validate items  │                │
   │              │                  │───────────────────►│                │
   │              │                  │ 5. create rows     │                │
   │              │                  │───────────────────►│                │
   │              │                  │ 6. emit("order:new")              │
   │              │                  ├──► Restaurant-Room                │
   │              │ 7. order returned │                                   │
   │              │◄─────────────────│                    │                │
   │              │ 8. POST /v1/payment/checkout/:id      │                │
   │              │─────────────────►│ 9. create session  │                │
   │              │                  │───────────────────────────────────►│
   │              │                  │◄──────── sessionUrl ────────────────│
   │              │ 10. sessionUrl   │                                   │
   │              │◄─────────────────│                                   │
   │ 11. redirect │                  │                                   │
   │◄─────────────│                  │                                   │
   │ 12. pay      │                  │                                   │
   │──────────────────────────────────────────────────────────────────────►│
   │              │                  │                                   │
   │              │                  │ 13. webhook ◄───────────────────────│
   │              │                  │ 14. flip status to CONFIRMED      │
   │              │                  │───────────────────►│                │
   │              │                  │ 15. emit("order:status-changed")  │
   │              │                  ├──► Customer-Room                  │
   │              │                  ├──► Restaurant-Room                │
   │              │                  │                                   │
   │ 16. redirect to /orders/:id     │                                   │
   │              │ /orders/:id      │                                   │
   │              │ subscribed       │                                   │
   │              │ shows "CONFIRMED"│                                   │
```

## Detaillierter Ablauf

### 1. In den Cart legen

User auf der Restaurant-Detail-Seite klickt auf ein Produkt → `<ProductModal>` öffnet sich.

User wählt Modifier, gibt evtl. Spezialanweisungen ein, klickt "In Cart".

```ts
cartStore.addItem(restaurantId, {
  productId, productName, basePrice, ...,
  quantity: 1,
  modifierOptionIds: ["m1", "m2"],
  modifierOptionsSnapshot: [...],
});
```

### 2. Zur Kasse

User klickt "Zur Kasse" in der `<CartBottomBar>` oder `<CartSidebar>`.

Navigation: `/checkout`.

`<CheckoutForm>` startet bei `step: "address"`.

### 3. Adresse wählen

User wählt eine bestehende Adresse oder legt eine neue an.

Bei "Neue Adresse":
- `POST /v1/address` mit street/city/zipCode/country
- Backend führt Forward-Geocoding aus
- Neue Address-Row mit `coordinates: [lng, lat]`

### 4. Review

User sieht Zusammenfassung. TextArea für `notes` (Spezialanweisungen für die gesamte Bestellung).

### 5. Bezahlen

User klickt "Bezahlen" in `<PaymentStep>`.

```ts
// 5a. Order erstellen
const order = await authenticatedFetch("/v1/order", {
  method: "POST",
  body: JSON.stringify({
    restaurantId,
    deliveryAddressId,
    items: cartItems.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      modifierOptionIds: i.modifierOptionIds,
      ...(i.specialInstructions ? { specialInstructions: i.specialInstructions } : {}),
    })),
    ...(notes ? { specialInstructions: notes } : {}),
  }),
});

// 5b. Stripe-Session
const checkout = await authenticatedFetch(`/v1/payment/checkout/${order.$id}`, {
  method: "POST",
});

// 5c. Cart leeren + Redirect zu Stripe
cartStore.clear();
window.location.href = checkout.sessionUrl;
```

### 6. Backend: `OrderService.createOrder()`

(siehe [Backend → Order-Modul](../backend/module/order.md) für Details)

1. Restaurant validieren (`isActive`)
2. Pro Item:
   - Product validieren (`isAvailable`)
   - Modifier validieren (`Product` capital, `isAvailable`)
   - Snapshotten: `unitPrice = basePrice + ΣpriceDelta`
3. `subtotal` berechnen, `minOrderValue` prüfen
4. `totalAmount = subtotal + deliveryFee`
5. **Atomic Schreiben**:
   - `order` Row
   - `order_item` Rows
   - `order_item_modifier` Rows
   - `order_status_history` Row (PENDING)
6. WebSocket-Event `order:new` an `restaurant:<id>:orders`

### 7. Stripe-Checkout

User landet auf der Stripe-Checkout-Seite. Gibt Kreditkarte ein. Bei Erfolg → Stripe ruft `STRIPE_SUCCESS_URL` mit `?paid=true` und `?orderId=...`.

### 8. Stripe-Webhook

Stripe sendet `checkout.session.completed` an `POST /v1/payment/webhook`:

```ts
const orderId = event.data.object.metadata.orderId;
await this.orderService.confirmPayment(orderId);
// → paymentStatus = "PAID"
// → currentStatus = "CONFIRMED"
// → order_status_history Row
// → emit("order:status-changed")
```

### 9. Restaurant nimmt an

Im Restaurant-Dashboard sieht der Owner die Bestellung im "Ausstehend"-Tab. Klickt "Annehmen":

```ts
PATCH /v1/order/:id/status { status: "CONFIRMED" }
```

> Wenn Stripe das schon getan hat, ist der Status bereits CONFIRMED — der Restaurant-Klick auf "Zubereiten" macht dann den Schritt zu PREPARING.

### 10. Zubereitung

```
CONFIRMED ─► PREPARING ─► READY
```

Owner klickt "Zubereiten" und später "Bereit". Pro Klick: `PATCH /v1/order/:id/status`.

### 11. Auf READY: Driver wird zugewiesen

Sobald `READY`:
- `OrderService.transitionStatus()` ruft `DeliveryService.notifyOrderReady(orderId)`
- `delivery`-Row wird erstellt mit Status `ASSIGNED`
- WS-Event `delivery:assigned` an Customer + Restaurant

### 12. Driver holt ab

Driver in seiner App bei `/deliveries/:deliveryId` klickt "Abgeholt":

```
PATCH /v1/delivery/:id/status { status: "PICKED_UP" }
```

Backend setzt:
- `delivery.status = "PICKED_UP"`
- `order.currentStatus = "PICKED_UP"` (kaskadiert)
- WS-Events

### 13. Live-Tracking startet

Driver hat in seiner App bereits `navigator.geolocation.watchPosition`. Sendet `driver:location`-Events.

Customer auf `/orders/:orderId` sieht die `<DeliveryMap>` mit Live-Driver-Pin.

### 14. Auslieferung

Driver macht Foto + klickt "Geliefert":

```
POST /v1/delivery/:id/proof  (multipart/form-data)
PATCH /v1/delivery/:id/status { status: "DELIVERED" }
```

Backend:
- Foto in Appwrite Storage hochgeladen, `proofImageId` gesetzt
- `delivery.status = "DELIVERED"`
- `order.currentStatus = "DELIVERED"`
- WS-Events

### 15. Customer sieht "Geliefert"

DeliveryMap blendet die Karte aus (oder zeigt finale Position). OrderTimeline zeigt alle Schritte abgeschlossen.

## Failure-Szenarien

### Zahlung fehlschlägt

Stripe sendet `payment_intent.payment_failed`:
- `OrderService.cancelOrder(orderId, "Payment failed")`
- `order.currentStatus = "CANCELLED"`
- WS-Event

Customer sieht "Storniert" mit Retry-Button → `POST /v1/payment/checkout/:id` für neue Session (nur bei `currentStatus === "PENDING"`).

### Restaurant lehnt ab

Restaurant klickt "Ablehnen" auf einer PENDING-Bestellung:
- `PATCH /v1/order/:id/status { status: "CANCELLED" }`
- Stripe-Refund manuell?? — aktuell keine Auto-Refund-Logik, müsste manuell im Stripe-Dashboard erfolgen

### Driver nicht verfügbar

Wenn `notifyOrderReady` keinen Driver findet → Order bleibt `READY`, alle 5 Min Re-Try (Cron oder Queue) — aktuell **nicht** implementiert.
