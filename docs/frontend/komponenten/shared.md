# Shared Components

Pfad: `apps/web/src/components/shared/`

App-weit nutzbare Basis-Komponenten.

## Übersicht

| Komponente | Datei | Zweck |
|------------|-------|-------|
| `AnimatedPage` | `AnimatedPage.tsx` | Page-Wrapper mit Framer-Motion-Fade-In |
| `BottomTabBar` | `BottomTabBar.tsx` | Mobile-Bottom-Navigation (Home/Cart/Profile) |
| `ConfirmDialog` | `ConfirmDialog.tsx` | Wiederverwendbarer Bestätigungsdialog |
| `EmptyState` | `EmptyState.tsx` | Leere-Liste-Anzeige (Icon + Text) |
| `LoadingSkeleton` | `LoadingSkeleton.tsx` | Skeleton-Placeholder (count + type) |
| `MapBase` | `MapBase.tsx` | Leaflet-Karten-Wrapper |
| `PriceDisplay` | `PriceDisplay.tsx` | EUR-Formatierung (`12,50 €`) |
| `SearchInput` | `SearchInput.tsx` | Such-Input mit Debounce |
| `ThemeToggle` | `ThemeToggle.tsx` | Dark/Light-Switch |
| `ToggleSwitch` | `ToggleSwitch.tsx` | Wrapper um HeroUI-Switch (mit korrektem Compound-Pattern) |

---

## AnimatedPage

```tsx
<AnimatedPage className="mx-auto max-w-2xl px-4 py-8">
  {children}
</AnimatedPage>
```

Wrapped Children in einen `motion.div` mit Fade-In-Animation. Wird auf jeder Page genutzt.

---

## BottomTabBar

Tab-Bar für mobile Endgeräte. Zeigt Tabs für:
- Home (`/`)
- Restaurants (`/restaurants`)
- Cart (`/cart`) mit Badge bei nicht-leerem Cart
- Profile (`/profile`)

Nur sichtbar bei `staticData.showFooter !== false`.

---

## ConfirmDialog

```tsx
<ConfirmDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={handleConfirm}
  title="Bestellung stornieren?"
  description="Diese Aktion kann nicht rückgängig gemacht werden."
  confirmText="Stornieren"
  cancelText="Abbrechen"
  variant="danger"
/>
```

---

## EmptyState

```tsx
<EmptyState
  title="Keine Bestellungen"
  description="Neue Bestellungen erscheinen hier automatisch."
  icon={<ListCheck className="size-12" />}
/>
```

---

## LoadingSkeleton

```tsx
<LoadingSkeleton count={3} type="row" />
<LoadingSkeleton count={5} type="card" />
```

`type` kann sein: `"row"`, `"card"`, `"avatar"`, `"text"`.

---

## MapBase

Wrapper um `react-leaflet`. Stellt sicher, dass Default-Marker-Icons funktionieren (via `L.Icon.Default.mergeOptions`) und sorgt für korrektes Cleanup beim Unmount.

```tsx
<MapBase
  center={[52.52, 13.405]}
  zoom={14}
  style={{ height: "300px", width: "100%", borderRadius: "12px" }}
>
  <Marker position={...} />
  <Polyline positions={...} />
</MapBase>
```

Children werden direkt an `<MapContainer>` weitergereicht.

---

## PriceDisplay

```tsx
<PriceDisplay amount={12.5} className="font-medium" />
// → "12,50 €"

<PriceDisplay amount={0} />
// → "Kostenlos" (oder "0,00 €", je nach Implementierung)
```

Nutzt `Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" })`.

---

## SearchInput

Such-Input mit Debounce. Nützlich für Restaurant-/Produktsuche.

```tsx
<SearchInput
  placeholder="Restaurant suchen..."
  value={query}
  onChange={setQuery}
  debounceMs={300}
/>
```

---

## ThemeToggle

Switch zwischen Dark / Light / System.

```tsx
<ThemeToggle />
```

Liest und schreibt aus dem `ThemeProvider` (`@repo/contexts`).

---

## ToggleSwitch

**Wichtigster Wrapper** für HeroUI-v3-Switch — verbirgt das Compound-Pattern.

```tsx
<ToggleSwitch
  isSelected={isOpen}
  onChange={setIsOpen}
  label="Geöffnet"
/>
```

Intern:

```tsx
<Switch isSelected={isSelected} onChange={onChange}>
  <SwitchControl><SwitchThumb /></SwitchControl>
  <Label>{label}</Label>
</Switch>
```

> **Immer diesen Wrapper benutzen** statt direkt `<Switch>`. Der nackte v3-Switch hat ohne `<SwitchControl>/<SwitchThumb>` einen unsichtbaren Toggle-Punkt!
