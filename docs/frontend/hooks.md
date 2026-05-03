# Hooks

Bestellando nutzt sowohl App-eigene Hooks als auch Hooks aus dem `@repo/hooks`-Paket.

## App-eigene Hooks

Pfad: `apps/web/src/hooks/`

### `useSocketEvent`

[apps/web/src/hooks/useSocketEvent.ts](../../apps/web/src/hooks/useSocketEvent.ts)

```ts
useSocketEvent<TPayload>(
  socket: Socket | null,
  event: string,
  handler: (payload: TPayload) => void,
);
```

Kapselt Socket.io-Listener-Lifecycle (`socket.on` + `socket.off`) als React-Hook.

```tsx
useSocketEvent<{ orderId: string }>(
  orderSocket,
  "order:status-changed",
  (data) => {
    if (data.orderId === orderId) {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    }
  },
);
```

Re-attached den Listener, wenn sich `socket` oder `event` ändern.

## Hooks aus `@repo/hooks`

Pfad: `packages/hooks/src/`

### `useApiQuery`

```ts
const { data, isLoading, error } = useApiQuery<T>({
  request: { url: "/v1/order/mine" },
  queryKey: ["my-orders"],
  enabled: true,                  // optional
  retry: false,                   // optional
});
```

Wrapper um `useQuery` mit `authenticatedFetch`.

### `useApiMutation`

```ts
const updateStatus = useApiMutation<TResult, Error, TVars>({
  mutationFn: async (vars) => {
    return authenticatedFetch(`/v1/order/${vars.orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: vars.status }),
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["my-orders"] });
  },
});

updateStatus.mutate({ orderId, status: "CONFIRMED" });
```

Wrapper um `useMutation`.

### `useAuth`

```ts
const { user, userType, isLoading, isAuthenticated } = useAuth();
```

Liest aus dem `auth-store` (Zustand). Wird vom `<AuthProvider>` befüllt.

### `useTheme`

```ts
const { theme, setTheme } = useTheme();
// theme: "light" | "dark" | "system"
```

Schreibt eine CSS-Klasse `dark` auf `<html>`, persistiert in `localStorage`.

### `useNotification`

Zeigt einen Toast/Notification. Implementation kann je nach UI-Library variieren.

```ts
const { notify } = useNotification();

notify({ type: "success", message: "Bestellung erfolgreich" });
notify({ type: "error", message: "Fehler aufgetreten" });
```

### `useUserLocation`

Liest die aktuelle GPS-Position des Users über die Browser-API.

```ts
const { position, error, isLoading } = useUserLocation();
// position: { lat, lng } | null
```

Wird auf der `/map`-Route genutzt, um die Karte initial auf den User zu zentrieren.

### `useApiSideEffects`

Internal-Helper für `useApiQuery` / `useApiMutation` zur einheitlichen Error/Success-Behandlung.

## Hook-Konventionen

1. **Immer mit `use`-Prefix benennen**
2. **Cleanup nicht vergessen** (Socket-Listener, Geolocation-Watch, Timer)
3. **Dependencies-Array korrekt** — ESLint-React-Plugin warnt
4. **Custom Hooks für wiederholte Logik** — z. B. `useDriverPosition` aus `components/order/hooks/`
