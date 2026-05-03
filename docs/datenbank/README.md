# Datenbank (Appwrite)

Bestellando nutzt **Appwrites TablesDB** als Datenbank.

## Inhalt

- [Appwrite-Schema (Übersicht)](./appwrite-schema.md)
- [Tabellen (Detail)](./tabellen.md)
- [Beziehungen](./beziehungen.md)
- [Berechtigungen (Permissions & Teams)](./permissions.md)

## Wichtige Konzepte (Quick-Reference)

### Tabellennamen

In Appwrite **snake_case**, im Code **lowerCamel** (über `tableId: "order_item"` als String).

| Appwrite-Tabelle | Code-Referenz |
|-------------------|---------------|
| `address` | `tableId: "address"` |
| `restaurant` | `tableId: "restaurant"` |
| `product` | `tableId: "product"` |
| `modifier_option` | `tableId: "modifier_option"` |
| `order` | `tableId: "order"` |
| `order_item` | `tableId: "order_item"` |
| `order_item_modifier` | `tableId: "order_item_modifier"` |
| `order_status_history` | `tableId: "order_status_history"` |
| `opening_hours` | `tableId: "opening_hours"` |
| `delivery` | `tableId: "delivery"` |
| `delivery_person` | `tableId: "delivery_person"` |
| `delivery_zone` | `tableId: "delivery_zone"` |

### Auto-Felder

Jede Row hat:
- `$id` — Primary Key
- `$createdAt`, `$updatedAt` — Timestamps
- `$permissions` — Permission-Strings
- `$databaseId`, `$tableId` — Meta

### Capitalization-Falle

Die Spalte `modifier_option.Product` ist mit **großem P** geschrieben! Beim Lesen aus dem Code:

```ts
const productField = (option as { Product?: unknown }).Product;
```

Mehr in [Tabellen → modifier_option](./tabellen.md#modifier_option).

### Coordinates-Format

Die Spalte `address.coordinates` ist Appwrites Point-Type. Format: **`[lng, lat]`** als rohes Tupel — nicht GeoJSON.
