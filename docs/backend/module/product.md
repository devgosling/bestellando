# Product-Modul

Pfad: `apps/api/src/product/`

Verantwortlich für die Produkte (Menü-Items) eines Restaurants.

## Datei-Übersicht

```
product/
├── product.module.ts
├── controller/product.controller.ts
└── service/product.service.ts
```

## Endpunkte

### `GET /v1/product?restaurantId=...`

@Public — Listet alle Produkte eines Restaurants.

Optional `?categoryId=...` für Filter.

### `GET /v1/product/:id`

@Public — Einzelnes Produkt.

### `POST /v1/product`

`@RequireUserType(["RESTAURANT"])` — Erstellt ein neues Produkt.

Body:

```ts
{
  restaurantId: string;
  name: string;
  description?: string;
  basePrice: number;        // EUR
  imageUrl?: string;
  categoryName?: string;     // z. B. "Pizza", "Pasta"
  isAvailable?: boolean;     // default true
  isFeatured?: boolean;
}
```

Owner-Check: `restaurant.ownerId === userId`.

### `PATCH /v1/product/:id`

`@RequireUserType(["RESTAURANT"])` — Aktualisiert. Owner-Check über das verknüpfte Restaurant.

### `DELETE /v1/product/:id`

`@RequireUserType(["RESTAURANT"])` — Löscht.

> **Soft-Delete-Strategie**: Statt zu löschen kann man `isAvailable: false` setzen — das verhindert neue Bestellungen, behält aber historische Order-Items konsistent.

## Product-Schema

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `$id` | string | |
| `restaurant` | string (FK → restaurant) | |
| `name` | string | |
| `description` | string? | |
| `basePrice` | number | EUR |
| `imageUrl` | string? | |
| `categoryName` | string? | Frei-Text-Kategorie pro Restaurant |
| `isAvailable` | bool | Verfügbar für Bestellungen? |
| `isFeatured` | bool | Auf Restaurant-Seite hervorheben? |

## Beziehung zu ModifierOptions

Ein Produkt kann mehrere Modifier-Optionen haben (Extras, Größen, etc.). Die `ModifierOption`-Rows referenzieren das Produkt über die Spalte `Product` (großes P!).

Mehr in [ModifierOption-Modul](./modifier-option.md).

## Beziehung zu Order Items

Wenn eine Bestellung erfolgt, wird der `basePrice` zum Bestellzeitpunkt **als Snapshot** in `order_item.unitPrice` gespeichert. Spätere Preisänderungen am Produkt ändern bestehende Bestellungen nicht.

## Bilder (imageUrl)

Aktuell speichern wir nur eine URL. Optionen:

- Externe URL (z. B. CDN)
- Appwrite Storage (URL-Format `https://cloud.appwrite.io/v1/storage/buckets/.../files/.../view?...`)

Es gibt keinen dedicated Image-Upload-Endpoint — Frontend lädt direkt zu Appwrite Storage und schickt die URL ans Backend.

## Service-Code

```ts
@Injectable()
export class ProductService {
  async createProduct(dto: CreateProductDto) {
    const userId = this.actorContextService.get().user.id;

    // Owner-Check
    const restaurant = await this.dataBase.getRow({
      databaseId,
      tableId: "restaurant",
      rowId: dto.restaurantId,
    });
    if (restaurant.ownerId !== userId) {
      throw new ForbiddenException("Not your restaurant");
    }

    return this.dataBase.createRow({
      databaseId,
      tableId: "product",
      rowId: ID.unique(),
      data: {
        restaurant: dto.restaurantId,
        ...dto,
      },
    });
  }
}
```
