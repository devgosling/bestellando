# User-Modul

Pfad: `apps/api/src/user/`

Verantwortlich für:
- Customer-Registrierung
- Auflösung der **Rolle** (Customer / Restaurant / Delivery / Admin) eines Nutzers
- Profil-Daten

## Datei-Übersicht

```
user/
├── user.module.ts
├── controller/user.controller.ts
├── interface/user.interface.ts
└── service/user.service.ts
```

## Endpunkte

### `POST /v1/user/register`

@Public — registriert einen neuen Customer-Account.

Body (`RegisterDto`):

```ts
{
  email: string;
  password: string;
  name: string;
}
```

Response:

```ts
{
  $id: string;       // Appwrite-User-ID
  email: string;
  name: string;
}
```

Im Service:

```ts
async register(dto: RegisterDto) {
  const account = await this.appwriteService
    .getAdminClient()
    .users.create(ID.unique(), dto.email, undefined, dto.password, dto.name);
  return account;
}
```

> **Wichtig**: Customer-Accounts haben **keine** Team-Mitgliedschaft. Restaurant- und Delivery-Accounts werden über separate Endpoints (`/v1/restaurant/register`, `/v1/delivery-person/register`) angelegt, die zusätzlich ein Team erzeugen oder beitreten.

### `GET /v1/user/data`

Liefert das aktuelle Profil + die Rolle.

Response:

```ts
{
  user: { $id, email, name, ... };  // Appwrite-User
  type: "ADMIN" | "RESTAURANT" | "DELIVERY_PERSON" | "CUSTOMER";
}
```

## UserService

`apps/api/src/user/service/user.service.ts`

### `getUserType(): Promise<UserType>`

Auflöser für die Rolle. Liest die Team-Mitgliedschaften des aktuellen Users:

```ts
async getUserType(): Promise<"ADMIN" | "RESTAURANT" | "DELIVERY_PERSON" | "CUSTOMER"> {
  const userId = this.actorContextService.get().user.id;
  const memberships = await this.appwriteService
    .getAdminClient()
    .teams.listMemberships(...);

  const teamIds = memberships.memberships.map(m => m.teamId);
  if (teamIds.includes("admin")) return "ADMIN";
  if (memberships.some(m => m.roles.includes("owner") || m.roles.includes("restaurant"))) return "RESTAURANT";
  if (memberships.some(m => m.roles.includes("delivery_person"))) return "DELIVERY_PERSON";
  return "CUSTOMER";  // Default
}
```

> Wird vom `AccessInterceptor` aufgerufen, wenn ein Endpoint `@RequireUserType([...])` hat.

### `getMyProfile()`

Liefert kombinierte User+Type-Daten für `/v1/user/data`.

## UserType-Definition

`apps/api/src/user/interface/user.interface.ts`:

```ts
export type UserType = "ADMIN" | "RESTAURANT" | "DELIVERY_PERSON" | "CUSTOMER";
```

## Wie wird die Rolle gesetzt?

### Restaurant
Wenn `POST /v1/restaurant/register` aufgerufen wird, erstellt das Backend:
1. Einen neuen Appwrite-User (mit den eingegebenen Email/Password)
2. Ein neues Team `restaurant_<restaurantId>`
3. Eine Team-Mitgliedschaft mit Rolle `"owner"` und `"restaurant"`

Daher gibt `getUserType()` für diesen User `"RESTAURANT"` zurück.

### Delivery Person
`POST /v1/delivery-person/register`:
1. Neuer User
2. Mitgliedschaft im globalen Team `delivery_person` mit Rolle `"delivery_person"`

### Customer
Bei `POST /v1/user/register` wird **kein** Team angelegt. Standardmäßig gilt der User als `CUSTOMER`.

### Admin
Manuell im Appwrite-Dashboard zu Team `admin` hinzufügen.

## Caching

Im Backend wird `getUserType()` aktuell **bei jedem Request** neu berechnet (mehrere Appwrite-Calls). Das Frontend cached die Rolle im `route-guard.ts` für die TanStack-Router-Lebensdauer, um doppelte `/v1/user/data`-Calls zu vermeiden.

Für Performance-Optimierungen könnte man:
- `getUserType()` per Request memoisieren (mit `nestjs-cls`)
- Oder die Rolle als Custom-Claim in den JWT packen (Appwrite-feature?)
