# Auth-Flow (Frontend)

## Überblick

```
┌─────────────────┐
│  Login/Register │
└────────┬────────┘
         │ Appwrite-SDK (account.createSession)
         ▼
┌─────────────────┐
│  Appwrite       │  ← Session-Cookie wird gesetzt
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AuthProvider   │  ← lädt account + UserType
└────────┬────────┘
         │
         ▼
┌─────────────────┐    JWT (kurzlebig)
│ authenticatedFetch├──────► API
└─────────────────┘
```

## 1. Login / Registrierung

[src/routes/auth/login.tsx](../../apps/web/src/routes/auth/login.tsx):

```tsx
import { account } from "@repo/lib";

await account.createEmailPasswordSession(email, password);
// Appwrite setzt automatisch ein HttpOnly-Cookie für die Session
```

Registrierung — separate Routen:
- `/auth/register/user` (Customer)
- `/auth/register/restaurant`
- `/auth/register/delivery`

Customer-Registrierung geht direkt an Appwrite. Restaurant- und Delivery-Registrierung gehen über die API (`POST /v1/restaurant/register` / `POST /v1/delivery-person/register`), weil dort zusätzlich Teams angelegt werden.

## 2. AuthProvider

[src/providers/AuthProvider.tsx](../../apps/web/src/providers/AuthProvider.tsx)

Beim App-Start prüft der Provider:
1. Existiert eine Appwrite-Session?
2. Wenn ja: Account-Daten + UserType laden

Speichert beides im Zustand-Store [auth-store.ts](../../apps/web/src/providers/auth-store.ts):

```ts
type AuthState = {
  user: AppwriteAccount | null;
  userType: UserType | null;
  isLoading: boolean;
  isAuthenticated: boolean;
};
```

Hooks:

```ts
import { useAuth } from "@repo/hooks";

const { user, userType, isLoading } = useAuth();
```

## 3. JWT-Holen für API-Calls

API-Anfragen brauchen einen JWT im `Authorization: Bearer ...`-Header.

`authenticatedFetch()` aus `@repo/lib` macht das automatisch:

```ts
async function authenticatedFetch(url, options = {}, autoLogout = true) {
  const jwt = await getOrCreateJwt();           // 1. JWT aus Cache oder neu erzeugen
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...options.headers,
    },
  });

  if (res.status === 401 && autoLogout) {
    invalidateJwt();                             // 2. Bei 401: Cache clearen
    const newJwt = await getOrCreateJwt();       // 3. Frisches JWT
    return fetch(url, { ...options, headers: { Authorization: `Bearer ${newJwt}` } });
  }

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

`getOrCreateJwt()` cached den JWT in einem Modul-Level-Variable mit ~14 Min Lebensdauer (Appwrite-JWTs leben 15 Min).

## 4. Logout

```ts
import { account } from "@repo/lib";

await account.deleteSession("current");
// Cookie weg, AuthProvider lädt neu, User wird zur Login-Seite redirected
```

## 5. Route-Guards

[src/providers/route-guard.ts](../../apps/web/src/providers/route-guard.ts):

```ts
let cachedRole: UserType | null = null;
let cachePromise: Promise<UserType> | null = null;

export async function ensureAuthenticated(location, expectedRole?) {
  const account = await appwriteAccount.get().catch(() => null);
  if (!account) {
    throw redirect({ to: "/auth/login" });
  }

  if (expectedRole) {
    const role = await getCachedRole();
    if (role !== expectedRole) {
      throw redirect({ to: "/" });
    }
  }
}

async function getCachedRole(): Promise<UserType> {
  if (cachedRole) return cachedRole;
  if (cachePromise) return cachePromise;

  cachePromise = authenticatedFetch("/v1/user/data")
    .then((data) => {
      cachedRole = data.type;
      return data.type;
    });
  return cachePromise;
}
```

> **Wichtig**: Die Cache-Strategie verhindert Doppel-Calls bei jedem `beforeLoad`. Beim Logout muss der Cache invalidiert werden.

## 6. Schutz auf Route-Gruppen-Ebene

Drei separate Gruppen:

| Pfad | Erforderliche Rolle |
|------|---------------------|
| `(protected-customer)/` | CUSTOMER |
| `(protected-restaurant)/` | RESTAURANT |
| `(protected-delivery)/` | DELIVERY_PERSON |

Jede hat eine eigene `route.tsx` mit `beforeLoad: () => ensureAuthenticated(loc, "<ROLE>")`.

## 7. Public Routes

Routen unter `/`, `/map`, `/restaurants/:id` sind teils public, teils customer-only:

- `/` — public (Restaurant-Listing für alle)
- `/map` — public
- `/restaurants/:id` — public (Menü ansehen)
- `/restaurants/:id` (Bestellen-Button) — leitet zu `/cart` weiter, das ist customer-only

## 8. Frontend-Auto-Logout

`authenticatedFetch` löst Logout aus, wenn:
- Erst-Request: 401 + Retry mit frischem JWT auch 401 → User als ausgeloggt behandeln
- Logout via `account.deleteSession()`
- AuthStore leeren
- Redirect zu `/auth/login`

Netzwerkfehler / 5xx Servern lösen **kein** Logout aus — nur 401-spezifische "Token-invalid"-Antworten.

## 9. Sicherheit

- **JWT lokal**: in JS-Memory, nicht localStorage (XSS-Resistenz)
- **Appwrite-Session**: HttpOnly-Cookie (XSS-sicher)
- **JWT-Lebensdauer**: ~15 Min (Appwrite-Default), automatisch erneuert
- **HTTPS in Produktion**: zwingend nötig
