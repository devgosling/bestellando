# Restaurant-Modul

Pfad: `apps/api/src/restaurant/`

Verantwortlich für:
- Restaurant-CRUD
- Restaurant-Registrierung (User + Team + Address + Restaurant in einem Flow)
- Eigentümer-Lookup (`getRestaurantFromUser`)

## Datei-Übersicht

```
restaurant/
├── restaurant.module.ts
├── controller/restaurant.controller.ts
├── dto/restaurant-filter.dto.ts
└── service/restaurant.service.ts
```

## Endpunkte

### `GET /v1/restaurant`

@Public — listet alle aktiven Restaurants mit optionalen Filtern.

Query-Params (`RestaurantFilterDto`):

```ts
{
  search?: string;       // Volltext-Suche im Namen
  category?: string;     // z. B. "ITALIAN", "PIZZA"
  minRating?: number;
  page?: number = 1;
  limit?: number = 25;
}
```

### `GET /v1/restaurant/:id`

@Public — Einzelnes Restaurant inkl. Address.

### `GET /v1/restaurant/mine`

`@RequireUserType(["RESTAURANT"])` — Liefert das Restaurant des aktuellen Owners (es kann nur eines pro User geben).

Service:

```ts
async getRestaurantFromUser(userId: string) {
  const result = await this.dataBase.listRows({
    databaseId,
    tableId: "restaurant",
    queries: [Query.equal("ownerId", userId), Query.limit(1)],
  });
  return result.rows[0] ?? null;
}
```

### `POST /v1/restaurant/register`

@Public — Komplett-Registrierung in einem Flow:

```ts
{
  email: string;          // Restaurant-Owner-Email
  password: string;
  name: string;           // Owner-Name
  restaurant: {
    name: string;
    description?: string;
    category: string;
    deliveryFee: number;
    minOrderValue: number;
    address: {
      street: string;
      city: string;
      zipCode: string;
      country: string;
    };
  };
}
```

Schritte im Service:

1. Appwrite-User erstellen
2. Address-Row erzeugen (mit Geocoding)
3. Team `restaurant_<newId>` erstellen
4. User der Team-Mitgliedschaft mit Rolle `"owner"` + `"restaurant"` hinzufügen
5. Restaurant-Row erstellen mit `ownerId: user.$id` und `address: address.$id`

> **Wichtig**: Die übermittelten Email/Password gehören dem **neuen** Restaurant-Account, nicht dem aktuellen User (der den Aufruf macht). Da die Route `@Public` ist, ist meistens niemand eingeloggt.

### `PATCH /v1/restaurant/:id`

`@RequireUserType(["RESTAURANT"])` — Aktualisiert Restaurant-Daten. Prüft `ownerId === userId`.

### `POST /v1/restaurant`

`@RequireUserType(["RESTAURANT", "ADMIN"])` — Restaurant erstellen ohne User-Setup (für Admins, die ein bestehendes Konto upgraden).

## Restaurant-Schema

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `$id` | string | Auto-ID |
| `name` | string | Restaurant-Name |
| `description` | string? | Beschreibung |
| `category` | string | z. B. "PIZZA", "BURGER" |
| `isActive` | bool | Aktiv? |
| `isFeatured` | bool | Hervorgehoben auf der Startseite? |
| `ownerId` | string | Appwrite-User-ID des Eigentümers |
| `address` | string (1:1 → address) | FK |
| `deliveryFee` | number | EUR |
| `minOrderValue` | number | EUR |
| `rating` | number? | Durchschnittliche Bewertung |
| `phone` | string? | Telefon |
| `imageUrl` | string? | Logo/Banner-URL |

## RestaurantService — wichtige Methoden

### `listAll(filters)`
Listet aktive Restaurants mit Filtern.

### `getById(id)`
Lädt Restaurant + expandierte Address.

### `getRestaurantFromUser(userId)`
Findet das Restaurant zu einem User. Genutzt vom Dashboard.

### `register(dto)`
Multi-Step-Registrierung (siehe oben).

### `update(id, dto)`
Aktualisiert; checkt Owner.

### `setActive(id, isActive)`
Schaltet Restaurant online/offline (z. B. für Pause).

## Wichtige Überlegungen

### Owner-Check
Jede Mutation muss `restaurant.ownerId === actorContextService.get().user.id` prüfen. Sonst könnten Restaurants wechselseitig editiert werden.

### Address als 1:1-Beziehung
Jedes Restaurant hat genau eine Address. Beim Update der Address (Umzug) wird die bestehende Row aktualisiert (Geocoding läuft erneut), nicht eine neue erzeugt.

### Cascade
Aktuell **kein** Cascading-Delete: Wenn ein Restaurant gelöscht wird, bleiben Products, Orders etc. hängen. Soll vermieden werden — nur deaktivieren (`isActive: false`).
