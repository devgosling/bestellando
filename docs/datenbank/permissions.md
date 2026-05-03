# Berechtigungen (Permissions & Teams)

Bestellando nutzt **Appwrite-Teams** für Rollen und **Permissions auf Tabellen-Ebene** für Zugriff.

## Teams

| Team-ID | Zweck |
|---------|-------|
| `admin` | Admin-Zugriff (volle Rechte) |
| `delivery_person` | Globales Team aller Lieferpersonen |
| `restaurant_<restaurantId>` | Pro Restaurant ein eigenes Team mit dem Owner als Mitglied |

## Rollen-Auflösung im Code

`UserService.getUserType()` liest die Team-Memberships:

```ts
const memberships = await teams.listMemberships(userId);

if (memberships.some(m => m.teamId === "admin")) return "ADMIN";
if (memberships.some(m => m.roles.includes("owner") || m.roles.includes("restaurant"))) return "RESTAURANT";
if (memberships.some(m => m.roles.includes("delivery_person"))) return "DELIVERY_PERSON";

return "CUSTOMER";  // Default — keine Mitgliedschaft
```

## Tabellen-Permissions

Standard-Empfehlung pro Tabelle:

### `restaurant`
- **Read**: alle (öffentliche Restaurant-Liste)
- **Create**: nur über die API mit Admin-Key (Backend-Service)
- **Update**: nur Owner (über API mit Owner-Check)
- **Delete**: nur Admin

### `address`
- **Read**: nur Owner + Restaurant des Owners (oder API mit Admin-Key)
- **Create/Update/Delete**: nur Owner (via API)

### `product`, `modifier_option`, `opening_hours`, `delivery_zone`
- **Read**: alle
- **Create/Update/Delete**: nur Restaurant-Owner (via API)

### `order`
- **Read**: nur Customer + Restaurant + Delivery-Person (über API, kein direkter Client-Zugriff)
- **Create**: über API
- **Update**: über API

### `order_item`, `order_item_modifier`, `order_status_history`
- **Read**: gleiche Regeln wie `order`
- **Create/Update**: nur über API (System)

### `delivery`, `delivery_person`
- Eingeschränkt auf jeweilige Lieferperson + Order-Beteiligte

## Permissions-Strings

Appwrite verwendet folgende Permission-Format:

| Format | Bedeutung |
|--------|-----------|
| `read("any")` | Alle dürfen lesen |
| `read("users")` | Alle eingeloggten User |
| `read("user:<userId>")` | Spezifischer User |
| `read("team:<teamId>")` | Team-Mitglieder |
| `read("team:<teamId>/<role>")` | Team-Mitglieder mit bestimmter Rolle |

Analog: `write`, `update`, `delete`, `create`.

## Beispiel: order-Permissions

Beim Erstellen einer Order kann der Backend-Service explizit die Permissions setzen:

```ts
await dataBase.createRow({
  databaseId,
  tableId: "order",
  rowId: ID.unique(),
  data: { ... },
  permissions: [
    Permission.read(Role.user(customerId)),
    Permission.read(Role.team(`restaurant_${restaurantId}`)),
    Permission.update(Role.team(`restaurant_${restaurantId}`)),
    // Driver später: Permission.read(Role.user(driverId))
  ],
});
```

## Verzicht auf Permissions

Aktuell **vertrauen wir der API** — alle Permissions sind über den Admin-Key gesetzt, und der Zugriffschutz wird im NestJS-Service gemacht (Owner-Checks, `@RequireUserType`, etc.).

Vorteil: einfachere Logik.
Nachteil: weniger Defense-in-Depth — bei einem Auth-Bug im Service könnten User Daten anderer User sehen.

## Best Practice für Production

1. API bleibt **Single-Path** für CRUD — keine direkte Appwrite-Browser-DB-Aufrufe (außer für Auth)
2. Server-side Owner-Checks bei jeder Mutation
3. Zusätzlich Permissions auf Row-Ebene setzen (z. B. wenn Mobile-App in Zukunft direkten Appwrite-Zugriff bekommt)

## Storage-Bucket Permissions

Für `delivery-proof`-Bucket:

| Permission | Wer |
|------------|-----|
| Create | `team:delivery_person` |
| Read | `team:delivery_person/<role>` (für eigenen Upload) + `user:<customerId>` (für Order-Customer) |
| Update | – |
| Delete | – |

Im Code beim Upload:

```ts
await storage.createFile({
  bucketId: "delivery-proof",
  fileId: ID.unique(),
  file: ...,
  permissions: [
    Permission.read(Role.user(customerId)),
    Permission.read(Role.team(`restaurant_${restaurantId}`)),
  ],
});
```
