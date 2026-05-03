# Restaurant Components

Pfad: `apps/web/src/components/restaurant/`

Komponenten für die öffentliche Restaurant-Anzeige.

## Übersicht

| Komponente | Datei | Zweck |
|------------|-------|-------|
| `MenuSection` | `MenuSection.tsx` | Gruppierte Produktliste |
| `OpeningHoursBadge` | `OpeningHoursBadge.tsx` | "Geöffnet bis 22:00" Badge |
| `ProductCard` | `ProductCard.tsx` | Produkt-Karte (Bild + Name + Preis) |
| `ProductModal` | `ProductModal.tsx` | Modal mit Modifier-Auswahl + "In Cart" |
| `RestaurantCard` | `RestaurantCard.tsx` | Listen-Item für Restaurant-Übersicht |
| `RestaurantFilters` | `RestaurantFilters.tsx` | Suchfilter (Kategorie, Name, ...) |
| `RestaurantHero` | `RestaurantHero.tsx` | Banner-Bereich auf der Restaurant-Detail-Seite |

## RestaurantCard

```tsx
<RestaurantCard restaurant={restaurant} />
```

Zeigt:
- Logo / Banner-Bild
- Name + Kategorie
- `OpeningHoursBadge`
- Liefergebühr + Mindestbestellwert
- Rating (falls vorhanden)

Klick → Navigation zu `/restaurants/:id`.

## RestaurantFilters

```tsx
<RestaurantFilters
  filters={filters}
  onChange={setFilters}
/>
```

Inputs:
- Suche (Name)
- Kategorie-Dropdown
- Min-Rating-Slider
- "Nur Liefernde anzeigen" Toggle

Wird auf `/restaurants` und `/` (Startseite) genutzt.

## RestaurantHero

Banner auf der Restaurant-Detail-Seite:

```tsx
<RestaurantHero restaurant={restaurant} />
```

Inhalt:
- Großes Banner-Bild
- Restaurant-Name
- Beschreibung
- Telefon / Address
- `OpeningHoursBadge`

## OpeningHoursBadge

```tsx
<OpeningHoursBadge restaurantId={restaurant.$id} />
```

Lädt `opening_hours` für das Restaurant und zeigt:
- "Geöffnet bis 22:00" (grün) — wenn aktuell offen
- "Geschlossen, öffnet morgen um 8:00" (grau) — wenn zu

Logik im Frontend: aktueller Wochentag/Zeit gegen Slots.

## MenuSection

Gruppiert Produkte nach `categoryName`:

```tsx
<MenuSection
  category="Pizza"
  products={pizzaProducts}
  onProductClick={(product) => setSelectedProduct(product)}
/>
```

## ProductCard

```tsx
<ProductCard
  product={product}
  onClick={() => setSelectedProduct(product)}
/>
```

Card-Layout:
- Bild (16:9)
- Name + Beschreibung (truncate)
- Basispreis

Wird per Klick → `ProductModal` geöffnet.

## ProductModal

**Wichtigste** Restaurant-Komponente — der Auswahl-Editor für ein Produkt.

```tsx
<ProductModal
  isOpen={!!selectedProduct}
  product={selectedProduct}
  onClose={() => setSelectedProduct(null)}
  onAdd={(item) => cartStore.addItem(restaurantId, item)}
/>
```

Features:
- Bild oben
- Beschreibung
- **Modifier-Auswahl** gruppiert nach `groupName`:
  - `isMultiple: false` → Radio
  - `isMultiple: true` → Checkbox
  - `isRequired: true` → muss ausgewählt sein
- TextArea für `specialInstructions`
- Quantity-Picker
- Preisberechnung in Echtzeit
- "In Cart" Button

```tsx
const total = (basePrice + selectedModifiers.reduce((s, m) => s + m.priceDelta, 0)) * quantity;
```

Beim Add:
```ts
cartStore.addItem(restaurantId, {
  productId: product.$id,
  productName: product.name,
  basePrice: product.basePrice,
  imageUrl: product.imageUrl,
  quantity,
  modifierOptionIds: selectedModifiers.map(m => m.$id),
  modifierOptionsSnapshot: selectedModifiers,
  specialInstructions,
});
```
