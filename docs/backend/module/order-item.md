# OrderItem-Modul

Pfad: `apps/api/src/orderItem/`

Verwaltet **`order_item`-Rows** — Snapshots der Bestellzeilen.

## Datei-Übersicht

```
orderItem/
├── order-item.module.ts
└── service/order-item.service.ts
```

## Konzept

Jede Bestellung besteht aus mehreren Items (Produkt + Menge + Modifier). Beim Erstellen werden die aktuellen **Preise als Snapshots** in `order_item.unitPrice` und `order_item.totalPrice` gespeichert.

Damit:
- Preise bleiben historisch konsistent (selbst wenn das Produkt später teurer wird)
- Auswertungen / Rechnungen sind reproduzierbar

## Schema

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `$id` | string | |
| `order` | string (FK → order) | |
| `product` | string (FK → product) | |
| `quantity` | integer | |
| `unitPrice` | number | Snapshot des Einzelpreises (basePrice + ΣpriceDelta) |
| `totalPrice` | number | unitPrice × quantity |
| `specialInstructions` | string? | Pro-Item-Notiz, z. B. "ohne Zwiebeln" |

## Service-Methoden

### `createOrderItem(data)`

Wird intern von `OrderService.createOrder()` aufgerufen — pro Item ein Aufruf.

```ts
async createOrderItem(data: {
  order: string;
  product: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions?: string;
}) {
  return this.dataBase.createRow({
    databaseId,
    tableId: "order_item",
    rowId: ID.unique(),
    data,
  });
}
```

### `listByOrder(orderId)`

Listet alle Items einer Bestellung. Kombiniert mit Appwrite-Beziehungen, expandiert `product` automatisch.

> Im Code wird das durch `OrderService.getOrderItems(orderId)` abgerufen, der intern `dataBase.listRows` aufruft.

## Beziehung zu `order_item_modifier`

Pro Item gibt es 0..n `order_item_modifier`-Rows mit:

```ts
{
  $id: string,
  orderItem: string,         // FK
  modifierOption: string,    // FK
  deltaPrice: number,        // Snapshot
}
```

Diese werden in `OrderService.createOrder()` direkt mit `dataBase.createRow` angelegt — kein eigener Service.

## Frontend-Anzeige

Auf der Customer-Order-Detail-Seite ([orders/$orderId.tsx](../../apps/web/src/routes/(protected-customer)/orders/$orderId.tsx)) werden die Items so dargestellt:

```tsx
{items.map(item => (
  <div key={item.$id} className="flex items-center justify-between">
    <div>
      <span>{item.quantity}x</span>
      <span>{item.product?.name ?? "Produkt"}</span>
    </div>
    <PriceDisplay amount={item.totalPrice} />
  </div>
))}
```

## Validierung

`OrderItemService` führt **keine** eigene Validierung durch — die Korrektheit der Daten wird vorher in `OrderService.createOrder()` sichergestellt.
