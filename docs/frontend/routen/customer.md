# Customer-Routen

Routen unter `(protected-customer)/`. Schutz: `ensureAuthenticated(loc, "CUSTOMER")`.

## Layout

Die `(protected-customer)/route.tsx` enthält ein einfaches `<Outlet />`. Header / Footer werden über `staticData` der jeweiligen Routen geregelt.

## `/restaurants` — Restaurant-Übersicht

Datei: `apps/web/src/routes/(protected-customer)/restaurants/index.tsx`

Zeigt eine Liste aller aktiven Restaurants mit Filtern.

```tsx
const { data: restaurants } = useApiQuery({
  request: { url: `/v1/restaurant?${qs.stringify(filters)}` },
  queryKey: ["restaurants", filters],
});
```

Components:
- `<RestaurantFilters />`
- `<RestaurantCard />` pro Restaurant

## `/restaurants/:restaurantId` — Restaurant-Detail

Datei: `apps/web/src/routes/(protected-customer)/restaurants/$restaurantId.tsx`

Zeigt:
- `<RestaurantHero />`
- `<MenuSection />` pro Kategorie
- `<CartSidebar />` (Desktop) oder `<CartBottomBar />` (Mobile)
- `<ProductModal />` beim Klick auf ein Produkt

API-Calls:
- `GET /v1/restaurant/:id`
- `GET /v1/product?restaurantId=:id`
- `GET /v1/opening-hours?restaurantId=:id`

## `/cart` — Warenkorb

Datei: `apps/web/src/routes/(protected-customer)/cart.tsx`

Vollansicht des Warenkorbs:
- Liste aller Items mit `<CartItem />`
- `<CartSummary />`
- "Zur Kasse"-Button → `/checkout`

Bei leerem Cart: `<CartEmpty />`.

## `/checkout` — Kassenprozess

Datei: `apps/web/src/routes/(protected-customer)/checkout.tsx`

Wrapper, der `<CheckoutForm />` rendert. Liest `restaurantId` aus dem Cart-Store.

Bei leerem Cart: Redirect zurück zu `/restaurants`.

## `/orders` — Bestellübersicht

Datei: `apps/web/src/routes/(protected-customer)/orders/index.tsx`

Liste aller eigenen Bestellungen, neueste zuerst.

```tsx
const { data } = useApiQuery({
  request: { url: "/v1/order/mine?limit=25" },
  queryKey: ["my-orders"],
});

return (
  <>
    {data.data.map(order => (
      <OrderCard key={order.$id} order={order} />
    ))}
  </>
);
```

## `/orders/:orderId` — Bestelldetail

Datei: `apps/web/src/routes/(protected-customer)/orders/$orderId.tsx`

Zentrale Ansicht für eine Bestellung. Inhalt:

1. **Header** mit Restaurant-Name + Datum + StatusBadge
2. **Artikel-Card** mit Items + Subtotal/Liefergebühr/Total
3. **Statusverlauf** (`<OrderTimeline />`)
4. **Live-Tracking-Karte** (`<DeliveryMap />`) — nur wenn `delivery.status === "PICKED_UP"`
5. **"Bezahlen"-Button** (`<Button />`) — nur bei `currentStatus === "PENDING"` (Retry)

WebSocket-Subscriptions:
- `order:status-changed` → invalidiert `["order", orderId]`
- `delivery:assigned` → invalidiert `["delivery", "order", orderId]`

```tsx
useEffect(() => {
  if (orderSocket) orderSocket.emit("subscribe:order", { orderId });
}, [orderSocket, orderId]);

useSocketEvent(orderSocket, "order:status-changed", (data) => {
  if (data.orderId === orderId) {
    queryClient.invalidateQueries({ queryKey: ["order", orderId] });
    queryClient.invalidateQueries({ queryKey: ["order-history", orderId] });
    queryClient.invalidateQueries({ queryKey: ["delivery", "order", orderId] });
  }
});
```

Coordinate-Extraktion für die Karte:

```tsx
// Appwrite Point: [lng, lat]
const restCoords = restAddr?.coordinates as [number, number] | undefined;
const delivCoords = delivAddr?.coordinates as [number, number] | undefined;

// Leaflet erwartet [lat, lng]
<DeliveryMap
  restaurantPosition={[restCoords[1], restCoords[0]]}
  customerPosition={[delivCoords[1], delivCoords[0]]}
/>
```

## `/profile` — Profil

Datei: `apps/web/src/routes/(protected-customer)/profile/index.tsx`

Zeigt:
- User-Daten (Name, Email)
- Liste eigener Adressen (mit Edit/Delete)
- Logout-Button
- ggf. Theme-Toggle

API-Calls:
- `GET /v1/user/data`
- `GET /v1/address/mine`
