# Cart Components

Pfad: `apps/web/src/components/cart/`

Komponenten rund um den Warenkorb.

## Übersicht

| Komponente | Datei | Zweck |
|------------|-------|-------|
| `CartBottomBar` | `CartBottomBar.tsx` | Sticky Bottom-Bar mit Cart-Summary + "Zur Kasse" |
| `CartDrawer` | `CartDrawer.tsx` | Mobile-Drawer mit Cart-Inhalt |
| `CartEmpty` | `CartEmpty.tsx` | Leerer-Warenkorb-Anzeige |
| `CartItem` | `CartItem.tsx` | Einzelne Cart-Zeile (Produkt + Modifier + Quantity-Controls) |
| `CartSidebar` | `CartSidebar.tsx` | Desktop-Sidebar mit Cart |
| `CartSummary` | `CartSummary.tsx` | Subtotal / Liefergebühr / Total-Anzeige |

## Cart-Store

Aller Zustand wird in einem Zustand-Store gehalten:

[src/stores/cart-store.ts](../../apps/web/src/stores/cart-store.ts)

### Store-Struktur

```ts
type CartItem = {
  key: string;             // hash aus productId + sortierten modifierIds
  productId: string;
  productName: string;
  basePrice: number;
  imageUrl?: string;
  quantity: number;
  modifierOptionIds: string[];
  modifierOptionsSnapshot: Array<{ $id, name, priceDelta }>;
  specialInstructions?: string;
};

type CartStore = {
  restaurantId: string | null;
  items: CartItem[];
  pendingItem: CartItem | null;       // bei Restaurant-Wechsel: bevor leeren

  addItem: (restaurantId, item) => void;
  removeItem: (key) => void;
  updateQuantity: (key, quantity) => void;
  clear: () => void;
  confirmPendingItem: () => void;
  cancelPendingItem: () => void;
};
```

### Item-Key

Damit "Pizza Margherita" und "Pizza Margherita mit extra Käse" als **separate** Cart-Zeilen erscheinen:

```ts
const key = `${productId}|${modifierOptionIds.slice().sort().join(",")}`;
```

Wird derselbe Key erneut hinzugefügt, wird die `quantity` erhöht.

### Restaurant-Wechsel

Wenn der User Items aus Restaurant A im Cart hat und ein Item aus Restaurant B hinzufügen will:

1. Store setzt `pendingItem`
2. UI zeigt `ConfirmDialog`: "Cart leeren und Item aus B hinzufügen?"
3. `confirmPendingItem()` → `clear()` + `addItem(B, pendingItem)`
4. `cancelPendingItem()` → setzt `pendingItem = null`

---

## CartItem

```tsx
<CartItem
  item={item}
  onIncrement={() => updateQuantity(item.key, item.quantity + 1)}
  onDecrement={() => updateQuantity(item.key, item.quantity - 1)}
  onRemove={() => removeItem(item.key)}
/>
```

Zeigt:
- Produktbild (Thumbnail)
- Name + ausgewählte Modifier
- Quantity-Controls (+/-)
- Preis (unitPrice × quantity)
- Trash-Icon für Remove

---

## CartSummary

```tsx
<CartSummary
  subtotal={subtotal}
  deliveryFee={deliveryFee}
  total={total}
  minOrderValue={restaurant.minOrderValue}
/>
```

Zeigt:
- Zwischensumme
- Liefergebühr
- Gesamt
- Hinweis bei Unterschreitung des Mindestbestellwerts

---

## CartBottomBar

Mobile-Sticky-Bar am unteren Bildschirmrand:

```tsx
<CartBottomBar />
```

Inhalt:
- "X Artikel — €Y" (links)
- "Zur Kasse" (rechts, primary button)

Sichtbar auf:
- `/restaurants/:id` (Menü-Seite, beim Bestellen)
- `/cart` (zeigt nur Total + Continue-Button)

---

## CartSidebar

Desktop-Pendant. Wird auf der Restaurant-Detail-Seite rechts angezeigt:

```tsx
<CartSidebar restaurantId={restaurantId} />
```

Inhalt:
- Liste aller Cart-Items
- CartSummary
- "Zur Kasse"-Button

---

## CartDrawer

Slide-In von rechts, getriggert vom Cart-Icon im Header. Mobile-only.

```tsx
<CartDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
```

---

## CartEmpty

```tsx
<CartEmpty />
```

Zeigt eine leere-Warenkorb-Illustration + "Restaurants ansehen"-Button.

---

## Beziehung zum Checkout

Beim Klick auf "Zur Kasse":
1. `navigate({ to: "/checkout" })`
2. `/checkout`-Route liest aus dem Cart-Store
3. Nach erfolgreicher Bestellung: `cartStore.clear()`
