# OrderStatusHistory-Modul

Pfad: `apps/api/src/orderStatusHistory/`

**Audit-Trail** für jeden Statuswechsel einer Bestellung.

## Datei-Übersicht

```
orderStatusHistory/
├── order-status-history.module.ts
└── service/order-status-history.service.ts
```

## Konzept

Jeder Statuswechsel einer Bestellung erzeugt einen neuen `order_status_history`-Row:

| Feld | Typ |
|------|-----|
| `$id` | string |
| `order` | string (FK → order) |
| `status` | string |
| `$createdAt` | ISO-Timestamp (System) |

Der erste Eintrag ist immer `PENDING` (vom `OrderService.createOrder()` angelegt).

## Service-Methoden

### `createOrderStatusHistory({ order, status })`

Wird aufgerufen:
- In `OrderService.createOrder()` — initial `PENDING`
- In `OrderService.transitionStatus()` — bei jedem Wechsel
- Vom Stripe-Webhook (`PaymentService`) — bei `CONFIRMED`/`CANCELLED`

```ts
async createOrderStatusHistory(data: { order: string; status: OrderStatus }) {
  return this.dataBase.createRow({
    databaseId,
    tableId: "order_status_history",
    rowId: ID.unique(),
    data,
  });
}
```

## Frontend-Nutzung

Im Customer-Order-Detail wird die History als Timeline dargestellt:

```tsx
<OrderTimeline history={history} currentStatus={order.currentStatus} />
```

Component: [components/order/OrderTimeline.tsx](../../apps/web/src/components/order/OrderTimeline.tsx).

Zeigt für jeden History-Eintrag:
- Symbol/Icon entsprechend dem Status
- Bezeichnung auf Deutsch (z. B. "Bestätigt", "In Zubereitung", "Bereit", "Abgeholt", "Geliefert")
- Zeitstempel

## Datenabruf

```ts
// im Backend
async getStatusHistory(orderId: string) {
  return this.dataBase.listRows({
    databaseId,
    tableId: "order_status_history",
    queries: [
      Query.equal("order", orderId),
      Query.orderAsc("$createdAt"),
    ],
  });
}
```

Endpoint: `GET /v1/order/:id/history`.

## Warum keine zusätzlichen Felder?

Wir speichern aktuell **nicht**:
- Wer den Wechsel ausgelöst hat (User-ID)
- Notizen zum Wechsel

Falls das später benötigt wird:
- `actorId: string` ergänzen
- `note?: string` ergänzen

Migration: neue Felder in Appwrite-Schema, dann in `createOrderStatusHistory()` befüllen.
