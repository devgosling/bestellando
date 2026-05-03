# Stores (Zustand)

Bestellando nutzt **Zustand** für Client-State, der **nicht** Server-State ist und über mehrere Components hinweg geteilt werden muss.

## Cart-Store

Datei: `apps/web/src/stores/cart-store.ts`

Der einzige App-weite Zustand-Store. Verwaltet den Warenkorb.

### Schema

```ts
type CartItem = {
  key: string;
  productId: string;
  productName: string;
  basePrice: number;
  imageUrl?: string;
  quantity: number;
  modifierOptionIds: string[];
  modifierOptionsSnapshot: Array<{
    $id: string;
    name: string;
    priceDelta: number;
  }>;
  specialInstructions?: string;
};

type CartStore = {
  restaurantId: string | null;
  items: CartItem[];
  pendingItem: { restaurantId: string; item: CartItem } | null;

  addItem: (restaurantId: string, item: Omit<CartItem, "key">) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  confirmPendingItem: () => void;
  cancelPendingItem: () => void;
};
```

### Persistence

Der Cart wird in `localStorage` persistiert über `zustand/middleware/persist`:

```ts
import { persist } from "zustand/middleware";

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // ... store implementation
    }),
    { name: "bestellando-cart" },
  ),
);
```

Nach Browser-Reload bleibt der Cart erhalten.

### Item-Key-Logik

Der `key` wird so generiert, dass identische Produkt-Modifier-Kombinationen zusammengefasst werden:

```ts
function generateKey(productId: string, modifierIds: string[]): string {
  return `${productId}|${modifierIds.slice().sort().join(",")}`;
}
```

So entstehen z. B.:
- `"pizza-1|"` — Pizza ohne Modifier
- `"pizza-1|modA,modB"` — Pizza mit Modifier A + B
- `"pizza-1|modA"` — Pizza mit nur Modifier A (separater Key!)

Bei `addItem(...)` mit identischem Key → `quantity` erhöhen, sonst neue Zeile.

### Restaurant-Wechsel

```ts
addItem: (restaurantId, item) => {
  const state = get();
  if (state.restaurantId && state.restaurantId !== restaurantId && state.items.length > 0) {
    // Anderes Restaurant — pendingItem setzen, UI muss bestätigen
    set({ pendingItem: { restaurantId, item } });
    return;
  }

  // Nahmen Restaurant erstmals oder identisches Restaurant — direkt hinzufügen
  // ...
}
```

Die UI (auf der Restaurant-Detail-Seite) zeigt einen `ConfirmDialog`:
- "Du hast bereits Items aus 'Pizzeria Roma' im Cart. Cart leeren und neue Items aus 'Burger King' hinzufügen?"
- Bestätigen → `confirmPendingItem()` → `clear()` + `addItem(B, pendingItem.item)`
- Abbrechen → `cancelPendingItem()`

### Hooks-Nutzung

```tsx
import { useCartStore } from "../../stores/cart-store";

function MyComponent() {
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);

  // ...
}
```

Selectors verhindern unnötiges Re-Rendering — nur wenn der jeweilige Slice sich ändert.

## Auth-Store

Datei: `apps/web/src/providers/auth-store.ts`

Kleiner Store mit Auth-State:

```ts
type AuthState = {
  user: AppwriteAccount | null;
  userType: UserType | null;
  isLoading: boolean;
  setAuth: (user, userType) => void;
  clear: () => void;
};
```

Wird vom `<AuthProvider>` befüllt und vom `useAuth()`-Hook gelesen.

> Nicht in `localStorage` persistiert — der Provider lädt den State immer aus Appwrite (Source of Truth).

## Warum nicht Redux?

- **Server-State** wird komplett von TanStack Query gehandhabt — kein Bedarf für Redux
- **Cart** ist der einzige nontriviale Client-State
- Zustand ist deutlich leichter (kein Action/Reducer-Boilerplate)

## Warum nicht React Context?

- Performance — Zustand re-rendert nur Components, deren Selector-Ausgabe sich ändert
- Easier sharing — kein Provider-Setup für jeden Store nötig
- DevTools-Support
