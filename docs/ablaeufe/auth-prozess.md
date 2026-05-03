# Authentifizierungsprozess

## Beteiligte Komponenten

```
┌──────────────────┐
│    Browser       │ ─── 1. Login E-Mail/Passwort ──► ┌──────────────┐
│ (apps/web)       │                                    │   Appwrite   │
│                  │ ◄── 2. Session-Cookie + Account ── │              │
│                  │                                    └──────────────┘
│                  │
│                  │ ─── 3. createJWT() ─────────────►
│                  │ ◄── 4. JWT (15 Min Lebensdauer)──
│                  │
│                  │ ─── 5. GET /v1/* + Bearer JWT ──► ┌──────────────┐
│                  │                                    │   API        │
│                  │                                    │ (apps/api)   │
└──────────────────┘                                    └──────┬───────┘
                                                                │ 6. validate JWT
                                                                ▼
                                                       ┌──────────────┐
                                                       │   Appwrite   │
                                                       │ account.get()│
                                                       └──────────────┘
```

## Phasen

### 1. Registrierung

Drei separate Flows je nach Rolle:

#### Customer

`POST /v1/user/register` → Backend ruft Appwrite an:

```ts
await appwriteService.getAdminClient().users.create(
  ID.unique(),
  email,
  undefined,
  password,
  name,
);
```

→ Appwrite-User existiert. **Kein** Team-Mitgliedschaft → `getUserType()` returns `CUSTOMER`.

#### Restaurant

`POST /v1/restaurant/register` macht in einem Flow:
1. Appwrite-User
2. Address mit Geocoding
3. Team `restaurant_<id>` erstellen
4. Membership mit Rollen `["owner", "restaurant"]`
5. Restaurant-Row mit `ownerId`

→ User gilt als `RESTAURANT`.

#### Delivery

`POST /v1/delivery-person/register`:
1. Appwrite-User
2. Membership im globalen Team `delivery_person` mit Rolle `["delivery_person"]`
3. `delivery_person`-Row

→ User gilt als `DELIVERY_PERSON`.

### 2. Login

Client-seitig:

```ts
import { account } from "@repo/lib";

await account.createEmailPasswordSession(email, password);
```

Appwrite setzt automatisch ein **HttpOnly-Session-Cookie**. Damit ist der Browser bei Appwrite eingeloggt.

### 3. JWT für API

Wenn das Frontend einen API-Request macht:

```ts
const { jwt } = await account.createJWT();
```

JWT lebt ~15 Minuten. Wird im Modul-Memory gecached:

```ts
let cachedJwt: string | null = null;
let jwtExpiry: number = 0;

async function getOrCreateJwt() {
  if (cachedJwt && Date.now() < jwtExpiry) return cachedJwt;
  const { jwt } = await account.createJWT();
  cachedJwt = jwt;
  jwtExpiry = Date.now() + 14 * 60 * 1000;
  return jwt;
}
```

### 4. API-Request

```ts
fetch("/v1/order/mine", {
  headers: { Authorization: `Bearer ${jwt}` },
});
```

### 5. JwtStrategy validiert

NestJS-Backend, `apps/api/src/auth/strategy/jwt.service.ts`:

```ts
async validate(jwt: string) {
  const client = this.appwriteService.createClientWithJwt(jwt);
  const account = await client.account.get();   // verifiziert bei Appwrite
  return { id: account.$id, appwrite: account, jwt, client };
}
```

Wenn JWT ungültig → 401.

### 6. AccessInterceptor + Decorators

`AccessInterceptor` läuft pro Request:
1. `ActorContextService.set({ user: ..., meta: ... })`
2. `@Public` ? → durchlassen
3. `@Cooldown(...)`? → Rate-Limit prüfen
4. `@RequireUserType([...])`? → `userService.getUserType()` aufrufen + abgleichen

### 7. Service nutzt User-Kontext

```ts
const userId = this.actorContextService.get().user.id;
```

### 8. Frontend Auto-Logout

Wenn API trotz frischem JWT 401 zurückgibt → `authenticatedFetch` löst Logout aus:
- `account.deleteSession("current")` — Cookie löschen
- `cachedJwt = null`
- Redirect zu `/auth/login`

### 9. Logout

```ts
await account.deleteSession("current");
queryClient.clear();
cartStore.clear();
window.location.href = "/auth/login";
```

## Route-Guards (Frontend)

Pro geschützter Route-Gruppe:

```tsx
// (protected-customer)/route.tsx
beforeLoad: async ({ location }) => {
  await ensureAuthenticated(location, "CUSTOMER");
}
```

`ensureAuthenticated()`:
1. `account.get()` — Session vorhanden?
2. Wenn nein → redirect to `/auth/login`
3. Wenn ja → Rolle holen (cached)
4. Bei Rollen-Mismatch → redirect to `/`

```ts
let cachedRole: UserType | null = null;

async function getCachedRole() {
  if (cachedRole) return cachedRole;
  const data = await authenticatedFetch("/v1/user/data");
  cachedRole = data.type;
  return cachedRole;
}
```

> Beim Logout muss `cachedRole = null` gesetzt werden, sonst sieht der nächste User die alte Rolle.

## Sicherheits-Aspekte

| Aspekt | Lösung |
|--------|--------|
| XSS-Resistenz JWT | JWT nur in Memory, nicht in localStorage |
| XSS-Resistenz Session | Appwrite-Cookie ist HttpOnly |
| CSRF | API checkt `Authorization`-Header (kein Cookie-Auth → CSRF nicht möglich) |
| MITM | HTTPS in Production zwingend |
| Brute-Force Login | Appwrite hat Rate-Limits + `@Cooldown(2000)` auf Register |
| Token-Diebstahl | 15-Min-Lebensdauer minimiert Schaden |
| Privilege-Escalation | Server-side `@RequireUserType` + Owner-Checks |

## Sonderfälle

### JWT erneuert sich, während User offline

Wenn Frontend nach 15+ Min den ersten Request macht → 401 → Auto-Refresh → neuer JWT → erneuter Request → klappt.

### Multi-Tab

Jeder Tab hat seinen eigenen `cachedJwt`. Beim Logout in einem Tab bleibt der andere noch eingeloggt (bis sein JWT abläuft).

Lösung: `BroadcastChannel` o. ä. → aktuell nicht implementiert.

### Restaurant-User soll als Customer agieren?

Aktuell **nicht möglich** — die Rolle ist global. Falls gewünscht, müsste man "Switch Account"-Flow bauen oder Multi-Role-Support ermöglichen.
