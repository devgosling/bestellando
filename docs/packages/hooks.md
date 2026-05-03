# `@repo/hooks`

Pfad: `packages/hooks/`

React-Hooks, die quer über das Frontend genutzt werden.

## Datei-Struktur

```
packages/hooks/src/
├── index.ts
├── useApiQuery.ts          # Wrapper um useQuery
├── useApiMutation.ts        # Wrapper um useMutation
├── useApiSideEffects.ts     # internal helper
├── useAuth.ts               # liest aus auth-store
├── useTheme.ts              # Dark/Light/System
├── useNotification.ts       # Toast-Helper
└── useUserLocation.ts       # GPS-Position
```

## `useApiQuery`

```ts
const { data, isLoading, error, refetch } = useApiQuery<T>({
  request: { url: string; init?: RequestInit };
  queryKey: QueryKey;
  enabled?: boolean;
  retry?: boolean | number;
  staleTime?: number;
});
```

Implementation (vereinfacht):

```ts
export function useApiQuery<T>({ request, queryKey, ...options }) {
  return useQuery({
    queryKey,
    queryFn: () => authenticatedFetch<T>(request.url, request.init),
    ...options,
  });
}
```

### Beispiele

```tsx
// Liste laden
const { data: restaurants } = useApiQuery<RestaurantEntity[]>({
  request: { url: "/v1/restaurant" },
  queryKey: ["restaurants"],
});

// Conditional fetching
const { data: orders } = useApiQuery({
  request: { url: `/v1/order/restaurant/${restaurantId}` },
  queryKey: ["restaurant-orders", restaurantId],
  enabled: !!restaurantId,
});

// Ohne Retry (z.B. Delivery-Fetch der ggf. 404 zurückgibt)
const { data: delivery } = useApiQuery({
  request: { url: `/v1/delivery/order/${orderId}` },
  queryKey: ["delivery", "order", orderId],
  retry: false,
});
```

## `useApiMutation`

```ts
const mutation = useApiMutation<TData, TError, TVariables>({
  mutationFn: async (vars) => Promise<TData>,
  onSuccess?: (data, vars) => void,
  onError?: (error, vars) => void,
});

mutation.mutate(vars);                 // fire-and-forget
const result = await mutation.mutateAsync(vars);  // mit await
```

### Beispiel

```tsx
const updateStatus = useApiMutation<
  { success: boolean },
  Error,
  { orderId: string; status: OrderStatus }
>({
  mutationFn: async (vars) => {
    return authenticatedFetch(`/v1/order/${vars.orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: vars.status }),
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
  },
});

<Button onPress={() => updateStatus.mutate({ orderId, status: "CONFIRMED" })}>
  Annehmen
</Button>
```

## `useAuth`

```ts
const { user, userType, isLoading, isAuthenticated } = useAuth();
```

| Feld | Typ |
|------|-----|
| `user` | `AppwriteAccount \| null` |
| `userType` | `"CUSTOMER" \| "RESTAURANT" \| "DELIVERY_PERSON" \| "ADMIN" \| null` |
| `isLoading` | `boolean` |
| `isAuthenticated` | `boolean` |

Liest aus dem `auth-store` (Zustand). Wird vom `<AuthProvider>` befüllt.

## `useTheme`

```ts
const { theme, setTheme } = useTheme();
// theme: "light" | "dark" | "system"

setTheme("dark");
```

## `useNotification`

```ts
const { notify } = useNotification();

notify({ type: "success", message: "Bestellung erfolgreich" });
notify({ type: "error", message: "Etwas ist schief gelaufen" });
notify({ type: "info", message: "Lade..." });
```

Implementation kann auf einer Toast-Library wie `sonner`, `react-hot-toast` o. ä. basieren.

## `useUserLocation`

```ts
const { position, error, isLoading } = useUserLocation();
// position: { lat: number; lng: number } | null
```

Ruft `navigator.geolocation.getCurrentPosition` einmal beim Mount.

Verwendet auf `/map` für initiale Karten-Center-Position.

## `useApiSideEffects`

Internal Helper, der gemeinsame Behandlung für Mutations bietet (z. B. Toast bei Error). Wird typischerweise nicht direkt im App-Code verwendet, sondern in den anderen Hooks dieses Pakets.
