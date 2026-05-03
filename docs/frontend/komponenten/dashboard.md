# Dashboard Components

Pfad: `apps/web/src/components/dashboard/`

Komponenten für das Restaurant-Dashboard (`(protected-restaurant)/dashboard/*`).

## Übersicht

| Komponente | Datei | Zweck |
|------------|-------|-------|
| `DashboardSidebar` | `DashboardSidebar.tsx` | Linke Navigation des Dashboards |
| `IncomingOrderCard` | `IncomingOrderCard.tsx` | Hervorgehobene Card für neue Bestellungen |
| `MenuProductRow` | `MenuProductRow.tsx` | Zeile in der Menü-Verwaltung |
| `OpeningHoursEditor` | `OpeningHoursEditor.tsx` | Editor für Wochentag-Slots |
| `ProductFormModal` | `ProductFormModal.tsx` | Modal für Produkt-Erstellung/Bearbeitung |
| `RestaurantSettingsForm` | `RestaurantSettingsForm.tsx` | Restaurant-Stammdaten |
| `StatCard` | `StatCard.tsx` | KPI-Card auf der Dashboard-Startseite |

---

## DashboardSidebar

Sidebar mit Navigation:
- Home (Dashboard)
- Bestellungen (`/dashboard/orders`)
- Menü (`/dashboard/menu`)
- Öffnungszeiten (`/dashboard/opening-hours`)
- Liefergebiete (`/dashboard/delivery-zones`)
- Einstellungen (`/dashboard/settings`)

Mobile: Sidebar wird zu Hamburger-Menü.

---

## StatCard

Auf der Dashboard-Startseite werden Live-KPIs angezeigt:

```tsx
<StatCard
  label="Bestellungen heute"
  value={ordersToday}
  delta={+5}            // optional: Veränderung zur Vorperiode
  icon={<ListCheck />}
/>
```

Berechnet aus `ordersData?.data` (TanStack Query) — kein eigener Backend-Call.

---

## IncomingOrderCard

Wenn eine **neue** Bestellung eingeht (Status PENDING) wird sie hervorgehoben:

```tsx
<IncomingOrderCard
  order={order}
  onAccept={() => updateStatus(order.$id, "CONFIRMED")}
  onReject={() => updateStatus(order.$id, "CANCELLED")}
/>
```

Visuell: Pulsierende Border, "Annehmen"/"Ablehnen"-Buttons.

---

## MenuProductRow

```tsx
<MenuProductRow
  product={product}
  onEdit={() => setEditing(product)}
  onDelete={() => deleteProduct(product.$id)}
  onToggleAvailable={() => toggleAvailability(product)}
/>
```

Zeile in `/dashboard/menu`:
- Bild + Name
- Preis
- Verfügbarkeits-Switch (`ToggleSwitch`)
- Edit-Icon
- Delete-Icon

---

## ProductFormModal

Modal mit Form für Produkt-Erstellung/-Bearbeitung.

```tsx
<ProductFormModal
  isOpen={!!editing || isCreating}
  product={editing}                    // undefined bei Neu
  onClose={() => { setEditing(null); setIsCreating(false); }}
  onSaved={() => queryClient.invalidateQueries(["products", restaurantId])}
/>
```

Felder:
- Name
- Beschreibung (TextArea)
- Basispreis
- Bild-URL (oder Upload)
- Kategorie (frei-Text)
- `isAvailable` (Toggle)
- `isFeatured` (Toggle)

Plus Modifier-Editor:
- Liste vorhandener Modifier mit Edit/Delete
- "Modifier hinzufügen"-Button

---

## OpeningHoursEditor

```tsx
<OpeningHoursEditor restaurantId={restaurantId} />
```

Pro Wochentag (Mo-So):
- Liste der existierenden Slots (z. B. "08:00 - 12:00", "18:00 - 22:00")
- "+ Slot hinzufügen"-Button → öffnet Time-Picker
- Trash-Icon pro Slot zum Entfernen

API-Calls:
- `GET /v1/opening-hours?restaurantId=...`
- `POST /v1/opening-hours`
- `DELETE /v1/opening-hours/:id`

---

## RestaurantSettingsForm

Form für die Restaurant-Stammdaten:

```tsx
<RestaurantSettingsForm
  restaurant={restaurant}
  onSaved={() => ...}
/>
```

Felder:
- Name
- Beschreibung
- Kategorie
- Telefon
- Liefergebühr
- Mindestbestellwert
- `isActive` (Switch zum Aktivieren/Deaktivieren)
- `isFeatured` (nur Admin)
- Adresse (eingebetteter Editor mit Geocoding)

`PATCH /v1/restaurant/:id` beim Speichern.

---

## Restaurant-Dashboard Echtzeit-Updates

Der Dashboard-Index ([routes/(protected-restaurant)/dashboard/index.tsx](../../apps/web/src/routes/(protected-restaurant)/dashboard/index.tsx)) lauscht auf:

- `order:new` — neue Bestellung → Query invalidieren
- `order:status-changed` — Status-Wechsel → Query invalidieren
- `delivery:assigned` — Driver zugewiesen → Driver-Info im UI ergänzen

Code-Beispiel:

```tsx
const orderSocket = getOrderSocket();

useEffect(() => {
  if (orderSocket && restaurantId) {
    orderSocket.emit("subscribe:restaurant", { restaurantId });
  }
}, [orderSocket, restaurantId]);

useSocketEvent(orderSocket, "order:new", () => {
  queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
});
```
