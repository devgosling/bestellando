# Beziehungen (Relationships)

Diagramm aller Beziehungen zwischen den Tabellen.

## ER-Diagramm

```
┌─────────────────┐
│  Appwrite User  │ (extern)
└──────┬──────────┘
       │ userId / customer / ownerId / deliveryPerson.userId
       │
┌──────▼──────────┐         ┌─────────────────┐
│    address      │◄────1:1─┤   restaurant    │
│                 │         │  ownerId        │
└─────────────────┘         └────────┬────────┘
       ▲                             │ 1:N
       │ N:1                         │
       │                    ┌────────▼────────┐         ┌─────────────────────┐
       │                    │     product     │◄───N:1──┤  modifier_option    │
       │                    └────────┬────────┘         │  Product (großes P) │
       │                             │ N:1              └─────────────────────┘
       │                             │                            ▲
┌──────┴──────────┐         ┌────────▼────────┐                   │
│     order       │◄───1:N──┤   order_item    │                   │
│  customer       │         └────────┬────────┘                   │
│  restaurant ────┼─────► restaurant │                            │
│  deliveryAddress│                  │ 1:N                        │ N:1
│                 │                  │                            │
└──┬──────────┬──┘         ┌────────▼─────────────┐              │
   │ 1:N      │ 1:1        │ order_item_modifier  │──N:1──────────┘
   │          │            └──────────────────────┘
   │          │
┌──▼─────┐ ┌──▼─────────┐
│ order_ │ │  delivery  │
│ status_│ │            │
│ history│ └──┬─────────┘
└────────┘    │ N:1
              │
       ┌──────▼──────────┐
       │ delivery_person │
       └─────────────────┘

┌─────────────────┐
│  opening_hours  │──N:1──► restaurant
└─────────────────┘

┌─────────────────┐
│  delivery_zone  │──N:1──► restaurant
└─────────────────┘
```

## Relationships im Detail

### 1:1

| Quelle | Ziel | Beschreibung |
|--------|------|--------------|
| `restaurant.address` | `address` | Jedes Restaurant hat genau eine Adresse |
| `delivery.order` | `order` | Jeder Lieferauftrag gehört zu genau einer Bestellung |

### 1:N

| Eltern | Kinder | Beschreibung |
|--------|--------|--------------|
| `restaurant` | `product` | Restaurant hat viele Produkte |
| `restaurant` | `opening_hours` | Mehrere Zeitslots pro Tag möglich |
| `restaurant` | `delivery_zone` | Mehrere Polygone |
| `restaurant` | `order` | Restaurant erhält viele Bestellungen |
| `product` | `modifier_option` | Produkt hat viele Modifier |
| `product` | `order_item` | (über order) Produkte erscheinen in vielen Bestellungen |
| `order` | `order_item` | Bestellung hat mehrere Items |
| `order` | `order_status_history` | Bestellung hat mehrere Status-Einträge |
| `order_item` | `order_item_modifier` | Item hat mehrere ausgewählte Modifier |
| `delivery_person` | `delivery` | Eine Person macht viele Lieferungen |

### N:1

Umkehrung der 1:N-Beziehungen — z. B. `order_item.order` ist N:1 zu `order`.

## Junctions

### `order_item_modifier`

Verbindet `order_item` mit `modifier_option`. Notwendig, weil pro Item beliebig viele Modifier ausgewählt werden können.

```
order_item ─────┐         ┌───── modifier_option
  $id           │         │  $id, name, priceDelta, ...
                ▼         ▼
       ┌─────────────────────────┐
       │  order_item_modifier    │
       │  - orderItem (FK)        │
       │  - modifierOption (FK)   │
       │  - deltaPrice (snapshot) │
       └─────────────────────────┘
```

## Foreign-Key-Constraints

Appwrite-TablesDB hat keine echten DB-Constraints. Die Integrität wird **im Code** sichergestellt:

- Bei Order-Erstellung wird geprüft, dass alle `productId` zum gleichen `restaurantId` gehören
- Modifier müssen zum jeweiligen Produkt gehören (`option.Product === item.productId`)
- Lieferadresse muss dem Customer gehören (oder zumindest valide sein)

## Cascade-Regeln

Aktuell **kein Cascading-Delete**. Wenn z. B. ein Produkt gelöscht wird:
- Bestehende `order_item`-Rows bleiben (intentional — historische Daten konsistent)
- `modifier_option`-Rows verwaisen → manuelle Bereinigung nötig

**Empfehlung**: Statt zu löschen, `isAvailable: false` setzen.

## Embedded Loading

Appwrite expandiert standardmäßig **eine Ebene tief**. Beispiele:

✅ Funktioniert: `order.restaurant` → Restaurant-Objekt
❌ Funktioniert nicht: `order.restaurant.address` → bleibt String-ID

Lösungen:
1. **Server-side Eager-Loading** in `OrderService.getOrderById()` (manuelles `getRow` für nested)
2. **Frontend-side Refetch** — separate `useApiQuery` für Address

Bestellando setzt aktuell auf Lösung 1 für die Order-Detail-Seite.
