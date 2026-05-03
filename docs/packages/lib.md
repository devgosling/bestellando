# `@repo/lib`

Pfad: `packages/lib/`

Sammelt:
- **Appwrite-Client-Initialisierung** (Browser-seitig)
- **`authenticatedFetch`** — JWT-Bearer-Helper
- **Socket.io-Client** — `connectSockets()`, `getOrderSocket()`, `getDeliverySocket()`

## Datei-Struktur

```
packages/lib/
├── consts/properties.ts          # Constants (z.B. API-URL)
├── src/
│   ├── index.ts                  # Re-exports
│   ├── appwrite.ts               # Appwrite-Client + Account
│   ├── socket.ts                 # Socket-Verbindungen
│   └── api/
│       ├── api.ts                # authenticatedFetch
│       └── interfaces/
│           └── Paginate.ts
└── package.json
```

## Appwrite-Client

`packages/lib/src/appwrite.ts`:

```ts
import { Client, Account } from "appwrite";

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT!)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID!);

export const appwriteClient = client;
export const account = new Account(client);
```

`account` wird vom Frontend genutzt für:
- `account.createEmailPasswordSession(email, password)` — Login
- `account.deleteSession("current")` — Logout
- `account.get()` — aktuellen User holen
- `account.createJWT()` — JWT für API-Requests

## `authenticatedFetch`

`packages/lib/src/api/api.ts`:

```ts
let cachedJwt: string | null = null;
let jwtExpiry: number = 0;

async function getOrCreateJwt(): Promise<string> {
  if (cachedJwt && Date.now() < jwtExpiry) return cachedJwt;
  const { jwt } = await account.createJWT();
  cachedJwt = jwt;
  jwtExpiry = Date.now() + 14 * 60 * 1000;   // 14min cache (JWT lebt ~15min)
  return jwt;
}

function invalidateJwt() {
  cachedJwt = null;
  jwtExpiry = 0;
}

export async function authenticatedFetch<T>(
  url: string,
  options: RequestInit = {},
  autoLogout = true,
): Promise<T> {
  const fullUrl = url.startsWith("http") ? url : `${import.meta.env.VITE_API_URL}${url}`;

  let jwt = await getOrCreateJwt();
  let res = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      ...options.headers,
    },
  });

  // 401 → frischen JWT versuchen
  if (res.status === 401 && autoLogout) {
    invalidateJwt();
    jwt = await getOrCreateJwt();
    res = await fetch(fullUrl, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
        ...options.headers,
      },
    });
  }

  if (res.status === 401 && autoLogout) {
    await account.deleteSession("current").catch(() => {});
    window.location.href = "/auth/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json();
}
```

### Verwendung

```ts
import { authenticatedFetch } from "@repo/lib";

// GET
const orders = await authenticatedFetch<{ data: OrderEntity[] }>("/v1/order/mine");

// POST
const order = await authenticatedFetch<OrderEntity>("/v1/order", {
  method: "POST",
  body: JSON.stringify({ restaurantId, items: [...] }),
});

// File-Upload
const formData = new FormData();
formData.append("file", file);
await authenticatedFetch("/v1/delivery/abc/proof", {
  method: "POST",
  body: formData,
  headers: {},   // Browser setzt multipart/form-data
});
```

> Bei FormData: **kein** `Content-Type`-Header setzen, der Browser erledigt das mit Boundary.

## Sockets

`packages/lib/src/socket.ts`:

```ts
import { io, type Socket } from "socket.io-client";

let orderSocket: Socket | null = null;
let deliverySocket: Socket | null = null;

export async function connectSockets(): Promise<void> {
  const jwt = await getOrCreateJwt();
  const apiUrl = import.meta.env.VITE_API_URL;

  orderSocket = io(`${apiUrl}/orders`, { auth: { token: jwt } });
  deliverySocket = io(`${apiUrl}/delivery`, { auth: { token: jwt } });

  await new Promise((resolve, reject) => {
    let connected = 0;
    const onConnect = () => { if (++connected === 2) resolve(undefined); };
    orderSocket!.on("connect", onConnect);
    deliverySocket!.on("connect", onConnect);
    setTimeout(() => reject(new Error("Socket-Timeout")), 5000);
  });
}

export function getOrderSocket(): Socket | null {
  return orderSocket;
}

export function getDeliverySocket(): Socket | null {
  return deliverySocket;
}

export function disconnectSockets() {
  orderSocket?.disconnect();
  deliverySocket?.disconnect();
  orderSocket = null;
  deliverySocket = null;
}
```

### Verwendung

```ts
import { connectSockets, getOrderSocket } from "@repo/lib";

// Beim App-Start (oder nach Login):
await connectSockets();

// In Components:
const socket = getOrderSocket();
socket?.emit("subscribe:order", { orderId });
```

> Wenn `getOrderSocket()` `null` zurückgibt, wurden die Sockets noch nicht initialisiert. Components sollten das robust behandeln (Fallback-Effect, der `connectSockets()` aufruft).

## index.ts

Re-exportiert alle Public-APIs:

```ts
export { account, appwriteClient } from "./appwrite";
export { authenticatedFetch } from "./api/api";
export { connectSockets, getOrderSocket, getDeliverySocket, disconnectSockets } from "./socket";
```
