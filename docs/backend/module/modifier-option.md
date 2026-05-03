# ModifierOption-Modul

Pfad: `apps/api/src/modifierOption/`

Verwaltet **Modifier-Optionen** für Produkte (z. B. "Mit extra Käse", "Größe XL", "Ohne Zwiebeln").

## Datei-Übersicht

```
modifierOption/
├── modifier-option.module.ts
├── controller/modifier-option.controller.ts
├── dto/modifier-option.dto.ts
└── service/modifier-option.service.ts
```

## Konzept

Jedes Produkt hat **0..n Modifier-Optionen**. Pro Option:

- `name` — z. B. "Extra Käse"
- `priceDelta` — Aufpreis (kann auch negativ sein, z. B. "Ohne Käse: -1€")
- `groupName` — gruppiert Optionen ("Größe", "Beläge", ...)
- `isRequired` — muss in Gruppe ausgewählt werden
- `isMultiple` — mehrere Auswahl in der Gruppe möglich
- `isAvailable` — kurzfristig sperrbar

## Endpunkte

### `GET /v1/modifier-option?productId=...`

@Public — Listet alle Modifier eines Produkts. Wird auf der Produkt-Detail-Seite (Modal) gebraucht.

Response:

```ts
[
  {
    $id: "...",
    Product: "...",       // FK zum Produkt (Achtung: Großes P!)
    name: "Extra Käse",
    priceDelta: 1.5,
    groupName: "Beläge",
    isRequired: false,
    isMultiple: true,
    isAvailable: true,
  },
  ...
]
```

### `POST /v1/modifier-option`

`@RequireUserType(["RESTAURANT"])` — Erstellt Modifier.

Body:

```ts
{
  productId: string;
  name: string;
  priceDelta: number;
  groupName?: string;
  isRequired?: boolean;
  isMultiple?: boolean;
}
```

Owner-Check über das verknüpfte Produkt → Restaurant.

### `PATCH /v1/modifier-option/:id`

`@RequireUserType(["RESTAURANT"])` — Aktualisiert.

### `DELETE /v1/modifier-option/:id`

`@RequireUserType(["RESTAURANT"])` — Löscht.

## ⚠️ Capitalization-Falle

In Appwrite ist die Spalte **`Product`** (mit großem P) — historisch so eingerichtet. Der Service schreibt:

```ts
{ Product: productId }  // ✅ richtig, kommt in DB
{ product: productId }  // ❌ wird als unbekanntes Feld ignoriert
```

Beim Lesen (z. B. in `OrderService.createOrder()`):

```ts
const productField = (option as { Product?: unknown }).Product;
const optionProductId =
  typeof productField === "string"
    ? productField
    : (productField as { $id?: string } | undefined)?.$id;
```

**Wenn man stattdessen `option.product` schreibt, bekommt man `undefined`** und die Validierung schlägt fehl ("Modifier option does not belong to product").

## ModifierOption-Schema

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `$id` | string | |
| `Product` | string (FK → product) | **Großes P!** |
| `name` | string | |
| `priceDelta` | number | Aufpreis (negativ erlaubt) |
| `groupName` | string? | Gruppen-Label |
| `isRequired` | bool | Pflicht in der Gruppe |
| `isMultiple` | bool | Mehrfachauswahl möglich |
| `isAvailable` | bool | Schaltbar |

## Order-Item-Modifier (Snapshot)

Wenn ein Kunde bestellt, wird für jedes ausgewählte Modifier ein `order_item_modifier`-Junction-Row erstellt:

| Feld | Typ |
|------|-----|
| `$id` | string |
| `orderItem` | string (FK → order_item) |
| `modifierOption` | string (FK → modifier_option) |
| `deltaPrice` | number (Snapshot zum Bestellzeitpunkt) |

Damit bleiben historische Bestellungen korrekt, auch wenn das Modifier später gelöscht oder umpreist wird.

## Service-Methoden

### `getById(id)`
Lädt einen Modifier.

### `listByProduct(productId)`
Lädt alle Modifier eines Produkts.

### `create(dto)`
Erzeugt Modifier (Owner-Check).

### `update(id, dto)`
Aktualisiert.

### `delete(id)`
Löscht.

> Pro Konvention werden Modifier-Optionen niemals direkt vom `OrderService` mutiert — sie sind read-only von dieser Seite.
