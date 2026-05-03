# Appwrite einrichten

Bestellando nutzt **Appwrite** als Backend-as-a-Service für:

- Authentifizierung (E-Mail/Passwort + JWT)
- Datenbank (Tabellen mit Beziehungen)
- Teams (Rollensystem)
- Storage (Proof-Bilder bei Lieferung)

## 1. Projekt erstellen

1. Konto auf https://cloud.appwrite.io anlegen (oder selbst gehostete Instanz)
2. Neues Projekt anlegen, Name z. B. `bestellando`
3. Projekt-ID notieren → `APPWRITE_PROJECT_ID`

## 2. API-Key erstellen

1. Settings → API Keys → "Create API Key"
2. Name: `bestellando-server`
3. Scopes auswählen:
   - `users.read`, `users.write`
   - `teams.read`, `teams.write`
   - `databases.read`, `databases.write`
   - `tables.read`, `tables.write`
   - `rows.read`, `rows.write`
   - `files.read`, `files.write`
4. Key kopieren → `APPWRITE_API_KEY`

## 3. Datenbank erstellen

1. Databases → "Create database", Name z. B. `bestellando`
2. Datenbank-ID notieren → `DATABASE_ID`

## 4. Tabellen anlegen

Eine vollständige Übersicht der Tabellen samt Spalten findest du unter [Datenbank → Tabellen](../datenbank/tabellen.md).

Wichtige Tabellen:

- `address`
- `restaurant`
- `product`
- `modifier_option`
- `order`
- `order_item`
- `order_item_modifier`
- `order_status_history`
- `opening_hours`
- `delivery`
- `delivery_person`
- `delivery_zone`

## 5. Teams für Rollen anlegen

Bestellando bestimmt die Rolle einer:s Nutzer:in über die Team-Mitgliedschaft. Lege folgende Teams an:

| Team-Name | Zweck |
|-----------|-------|
| `admin` | Admin-Zugriff |
| `restaurant` | Restaurant-Owner (zusätzlich gibt es ein Team pro Restaurant) |
| `delivery_person` | Lieferpersonen |

Customer-Konten haben **keine Team-Mitgliedschaft** — ohne Team gilt jemand automatisch als `CUSTOMER`.

> Mehr dazu unter [Datenbank → Permissions](../datenbank/permissions.md).

## 6. Auth-Methoden aktivieren

Auth → Settings → Auth Method:
- ✅ Email/Password aktivieren
- (Optional: OAuth-Provider wie Google, falls gewünscht)

## 7. Storage Bucket für Proof-Bilder anlegen

1. Storage → "Create Bucket"
2. Name: `delivery-proof`
3. Bucket-ID notieren (wird im Code als `delivery-proof` referenziert)
4. Permissions:
   - Read: für authentifizierte Nutzer:innen, die mit der Order verknüpft sind
   - Write: für DELIVERY_PERSON

## 8. Web-Projekt registrieren (für CORS)

Settings → Platforms → "Add Platform" → "Web App":
- Name: `bestellando-web`
- Hostname: `localhost` (für Dev), später `bestellando.example.com` (Prod)

Dadurch wird der Appwrite-SDK-Zugriff vom Browser erlaubt.

## 9. Erste Nutzer:innen anlegen

Du kannst entweder:
- Über die Bestellando-Web-App registrieren (Customer/Restaurant/Delivery)
- Oder manuell im Appwrite-Dashboard und dann der entsprechenden Team-Mitgliedschaft hinzufügen

## Wichtige Hinweise

### Appwrite-Datenmodell

- Tabellen heißen in Appwrite **snake_case** (`order_item`)
- Im Code referenzieren wir sie als **lowerCamel** in TypeScript-Code (`orderItem`)
- Spaltenamen folgen ebenfalls Konventionen — siehe [Datenbank → Tabellen](../datenbank/tabellen.md)

### Beziehungen sind one-level deep

Appwrite expandiert Beziehungen standardmäßig **nur eine Ebene tief**. Wenn du z. B. `order` lädst, bekommst du `order.restaurant` als Objekt — aber `order.restaurant.address` ist nur eine ID-String.

Im Code wird das in `OrderService.getOrderById()` mit eager-loading manuell aufgelöst — siehe [Backend → Order-Modul](../backend/module/order.md).

### Capitalization beachten!

Die Spalte `modifier_option.Product` ist mit **großem `P`** geschrieben (historisch gewachsen). Beim Lesen aus dem Code:

```ts
const productField = (option as { Product?: unknown }).Product;
```

Schreiben mit kleinem `product` würde `undefined` zurückgeben.

### Point-Type für Koordinaten

Die Spalte `address.coordinates` ist vom Typ "Point" und wird als **rohes `[lng, lat]`-Tupel** gespeichert — **nicht** als GeoJSON-Objekt:

```ts
// ✅ Richtig
{ coordinates: [13.4050, 52.5200] }

// ❌ Falsch
{ coordinates: { type: "Point", coordinates: [13.4050, 52.5200] } }
```
