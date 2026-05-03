# Restaurant-Dashboard

Routen unter `(protected-restaurant)/dashboard/`. Schutz: `ensureAuthenticated(loc, "RESTAURANT")`.

## Layout

`(protected-restaurant)/dashboard/route.tsx`:

```tsx
<div className="flex">
  <DashboardSidebar />
  <main className="flex-1">
    <Outlet />
  </main>
</div>
```

## `/dashboard` — Übersicht

Datei: `apps/web/src/routes/(protected-restaurant)/dashboard/index.tsx`

Zeigt KPI-Cards:
- Bestellungen heute
- Umsatz heute
- Aktive Bestellungen
- Beliebteste Produkte

Listet aktuelle eingehende Bestellungen mit `IncomingOrderCard`.

WebSocket-Subscriptions:
```tsx
useEffect(() => {
  if (orderSocket && restaurantId) {
    orderSocket.emit("subscribe:restaurant", { restaurantId });
  }
}, [orderSocket, restaurantId]);

useSocketEvent(orderSocket, "order:new", () => {
  queryClient.invalidateQueries({ queryKey: ["restaurant-orders"] });
});
```

## `/dashboard/orders` — Bestellungen

Datei: `apps/web/src/routes/(protected-restaurant)/dashboard/orders/index.tsx`

Tab-basiert:
- Alle / Ausstehend / Bestätigt / In Zubereitung / Bereit

Pro Bestellung eine Card mit:
- Order-ID + Total + Notizen
- Driver-Info (sobald zugewiesen) + ProofImage (nach Lieferung)
- Status-Chip
- Action-Buttons je nach Status:
  - PENDING: "Annehmen" → CONFIRMED
  - CONFIRMED: "Zubereiten" → PREPARING
  - PREPARING: "Bereit" → READY

Hydratisierung der Driver-Info beim ersten Laden:

```tsx
useEffect(() => {
  orders.forEach(async (order) => {
    if (deliveries[order.$id]?.driver) return;
    if (!ORDERS_WITH_DRIVER.includes(order.currentStatus)) return;
    const delivery = await authenticatedFetch(`/v1/delivery/order/${order.$id}`);
    if (delivery) {
      setDeliveries(prev => ({
        ...prev,
        [order.$id]: { ... },
      }));
    }
  });
}, [orders]);
```

WebSocket-Events:
- `order:new` → invalidate
- `order:status-changed` → invalidate
- `delivery:assigned` → setze Driver-Info im lokalen State

## `/dashboard/menu` — Menü-Verwaltung

Datei: `apps/web/src/routes/(protected-restaurant)/dashboard/menu/index.tsx`

Liste aller Produkte:
- `MenuProductRow` pro Produkt
- "Produkt hinzufügen"-Button (oben rechts) → `ProductFormModal`
- Edit-Klick → `ProductFormModal` mit dem Produkt vorausgefüllt

API-Calls:
- `GET /v1/product?restaurantId=...`
- `POST /v1/product` (Create)
- `PATCH /v1/product/:id` (Update)
- `DELETE /v1/product/:id`

## `/dashboard/opening-hours` — Öffnungszeiten

Datei: `apps/web/src/routes/(protected-restaurant)/dashboard/opening-hours/index.tsx`

Pro Wochentag (Mo–So):
- Liste der Slots ("08:00 - 12:00", "18:00 - 22:00")
- "+ Slot"-Button
- Trash-Icon zum Entfernen

Component: `<OpeningHoursEditor />`.

## `/dashboard/delivery-zones` — Liefergebiete

Datei: `apps/web/src/routes/(protected-restaurant)/dashboard/delivery-zones/index.tsx`

Karten-Editor:
- Liste der vorhandenen Polygone (Sidebar)
- Karte mit allen Polygonen + Möglichkeit, ein neues zu zeichnen
- Pro Zone: Name + (optional) eigene Liefergebühr

Speichern → `POST /v1/delivery-zone`.

## `/dashboard/settings` — Einstellungen

Datei: `apps/web/src/routes/(protected-restaurant)/dashboard/settings/index.tsx`

Stammdaten + Adresse + Aktiv-Toggle. Component: `<RestaurantSettingsForm />`.

API-Calls:
- `GET /v1/restaurant/mine`
- `PATCH /v1/restaurant/:id`
- `PATCH /v1/address/:id` (für Adresse-Update)
