# Address-Modul

Pfad: `apps/api/src/address/`

Verantwortlich für:
- Adress-CRUD
- **Geocoding** (Adresse → Koordinaten via Google Maps)
- **Reverse Geocoding** (Koordinaten → Adresse)

## Datei-Übersicht

```
address/
├── address.module.ts
├── controller/address.controller.ts
└── service/
    ├── address.service.ts
    └── geocoding.service.ts
```

## Endpunkte

### `POST /v1/address`

Erstellt eine neue Adresse für den aktuellen User.

Body:

```ts
{
  street: string;
  city: string;
  zipCode: string;
  country: string;
  label?: string;       // z. B. "Zuhause", "Büro"
}
```

Im Service:
1. Adress-String zusammenbauen
2. `GeocodingService.forward(...)` aufrufen → `{ lat, lng }`
3. `coordinates: [lng, lat]` als Appwrite-Point speichern
4. `userId` aus `ActorContextService` setzen

### `PATCH /v1/address/:id`

Aktualisiert eine Adresse. Geocoding läuft erneut, wenn `street/city/zipCode/country` geändert wurden.

### `GET /v1/address/mine`

Listet alle Adressen des aktuellen Users (für Adress-Dropdown im Checkout).

### `GET /v1/address/reverse?lat=..&lng=..`

@Public — Reverse Geocoding. Genutzt z. B. bei Karten-Auswahl.

Response:

```ts
{
  street: string;
  city: string;
  zipCode: string;
  country: string;
  formatted: string;
}
```

### `DELETE /v1/address/:id`

Löscht eine Adresse (Owner-Check).

## AddressService

```ts
@Injectable()
export class AddressService {
  async create(dto: CreateAddressDto) {
    const userId = this.actorContextService.get().user.id;
    const fullAddress = `${dto.street}, ${dto.zipCode} ${dto.city}, ${dto.country}`;
    const { lat, lng } = await this.geocodingService.forward(fullAddress);

    return this.dataBase.createRow({
      databaseId,
      tableId: "address",
      rowId: ID.unique(),
      data: {
        ...dto,
        userId,
        coordinates: [lng, lat],   // wichtig: lng zuerst (Appwrite-Point-Format)
      },
    });
  }
}
```

## GeocodingService

`apps/api/src/address/service/geocoding.service.ts`

### `forward(addressString): Promise<{ lat, lng }>`

Ruft Google Maps Geocoding API:

```http
GET https://maps.googleapis.com/maps/api/geocode/json
    ?address=Friedrichstraße+200,+10117+Berlin,+DE
    &key=YOUR_KEY
```

Returns `{ lat, lng }` aus dem ersten Resultat. Wirft `BadRequestException` bei `ZERO_RESULTS`.

### `reverse(lat, lng): Promise<AddressDto>`

Ruft:

```http
GET https://maps.googleapis.com/maps/api/geocode/json
    ?latlng=52.5200,13.4050
    &key=YOUR_KEY
```

Parst die `address_components`:

| Google-Type | Bestellando-Feld |
|-------------|------------------|
| `route` + `street_number` | `street` |
| `locality` | `city` |
| `postal_code` | `zipCode` |
| `country` | `country` |

## Wichtige Punkte

### Coordinates-Format

Die `coordinates`-Spalte ist Appwrites Point-Type — gespeichert als `[longitude, latitude]`-Tupel:

```ts
// ✅ Korrekt
coordinates: [13.4050, 52.5200]   // [lng, lat]

// ❌ Falsch (GeoJSON-Format)
coordinates: { type: "Point", coordinates: [13.4050, 52.5200] }
```

**Im Frontend** — bei der Anzeige auf Leaflet-Karten — wird umgekehrt: `[lat, lng]`:

```tsx
const restCoords = restAddr.coordinates as [number, number]; // [lng, lat]
<Marker position={[restCoords[1], restCoords[0]]} />          // [lat, lng]
```

### Modul-Export

`AddressModule` exportiert sowohl `AddressService` als auch `GeocodingService`, weil das Restaurant-Modul beim Registrieren ebenfalls Geocoding braucht.

```ts
@Module({
  controllers: [AddressController],
  providers: [AddressService, GeocodingService],
  exports: [AddressService, GeocodingService],
})
export class AddressModule {}
```
