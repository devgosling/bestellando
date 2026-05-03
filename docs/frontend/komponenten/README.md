# Komponenten — Übersicht

Alle wiederverwendbaren React-Komponenten unter `apps/web/src/components/`.

## Kategorien

- [Shared Components](./shared.md) — App-weit nutzbare Bausteine
- [Cart Components](./cart.md) — Warenkorb-Anzeige und Editor
- [Checkout Components](./checkout.md) — Kassenprozess (mehrstufig)
- [Restaurant Components](./restaurant.md) — Restaurant-Anzeige + Menü
- [Order Components](./order.md) — Bestelldetails + Live-Tracking
- [Delivery Components](./delivery.md) — Lieferpersonen-Komponenten
- [Dashboard Components](./dashboard.md) — Restaurant-Dashboard

## Konventionen

### Namensgebung

- **PascalCase** für Komponenten-Namen (`OrderCard.tsx`)
- **camelCase** für Hooks und Funktionen
- **Verbose und beschreibend** — `ProductFormModal` statt `Modal`

### Datei-Struktur einer Komponente

```tsx
// imports
import type { ProductEntity } from "@repo/interfaces";

// types
interface ProductCardProps {
  product: ProductEntity;
  onAdd?: (product: ProductEntity) => void;
}

// component
export function ProductCard({ product, onAdd }: ProductCardProps) {
  // hooks
  // handlers
  // jsx
  return <div>...</div>;
}

// optionally: helper functions
```

### State

- **Server-State** → `useApiQuery` / `useApiMutation` (TanStack Query)
- **Client-State (UI-only)** → `useState`
- **Cross-component-Client-State** → Zustand-Store (aktuell nur Cart)

### Event-Handler

- **`onClick`, `onChange`** für native Patterns
- **`onPress`** bei HeroUI-Buttons (react-aria)
- **`onAction`** bei react-aria Listbox-Items

### HeroUI v3 Compound-Pattern

❌ **Falsch** (v2-Style, bricht):
```tsx
<Switch isSelected={open} onValueChange={setOpen} label="Auf" />
```

✅ **Richtig** (v3 Compound):
```tsx
<Switch isSelected={open} onChange={setOpen}>
  <SwitchControl><SwitchThumb /></SwitchControl>
  <Label>Auf</Label>
</Switch>
```

> Mehr Details unter [Theming + HeroUI](../theming.md).
