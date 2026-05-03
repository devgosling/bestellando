# Delivery-Routen

Routen unter `(protected-delivery)/`. Schutz: `ensureAuthenticated(loc, "DELIVERY_PERSON")`.

## `/deliveries` — Aktive Lieferungen

Datei: `apps/web/src/routes/(protected-delivery)/deliveries/index.tsx`

Liste aller aktiven Lieferungen der eingeloggten Lieferperson.

```tsx
const { data: deliveries } = useApiQuery({
  request: { url: "/v1/delivery/active" },
  queryKey: ["my-deliveries"],
});
```

Pro Eintrag: `DeliveryCard` mit Order-Status + Pickup-/Delivery-Adresse.

WebSocket: subscribed auf `delivery:assigned`, um neue Aufträge live zu sehen.

## `/deliveries/:deliveryId` — Aktive Lieferung

Datei: `apps/web/src/routes/(protected-delivery)/deliveries/$deliveryId.tsx`

Hauptansicht für eine aktive Lieferung. Zeigt `<ActiveDeliveryView />`.

Layout:

```tsx
<div className="flex flex-col h-screen">
  {/* Karte oben */}
  <div className="flex-1">
    <NavigationMap delivery={delivery} />
  </div>

  {/* Order-Details */}
  <Card>
    <CardContent>
      <RestaurantInfo />
      <CustomerInfo />
      <OrderItems />
    </CardContent>
  </Card>

  {/* Action-Bar unten */}
  <DeliveryActionBar
    delivery={delivery}
    onPickedUp={...}
    onDelivered={...}
  />
</div>
```

## GPS-Position senden

Sobald die Page mountet und `delivery.status` aktiv ist, startet `watchPosition`:

```tsx
useEffect(() => {
  if (!navigator.geolocation) return;
  if (delivery.status === "DELIVERED") return;

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      deliverySocket.emit("driver:location", {
        orderId: delivery.order,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        heading: pos.coords.heading ?? undefined,
      });
    },
    (err) => console.error("GPS error", err),
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
  );

  return () => navigator.geolocation.clearWatch(watchId);
}, [delivery]);
```

Der Customer sieht das daraufhin in seiner DeliveryMap.

## Lieferung markieren

### "Abgeholt"

```tsx
async function markPickedUp() {
  await authenticatedFetch(`/v1/delivery/${deliveryId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "PICKED_UP" }),
  });
  queryClient.invalidateQueries({ queryKey: ["delivery", deliveryId] });
}
```

### "Geliefert" (mit Foto)

```tsx
async function markDelivered() {
  // 1. Foto aufnehmen / wählen
  const file = await pickPhoto();    // Camera oder Datei

  // 2. Hochladen
  const formData = new FormData();
  formData.append("file", file);
  await authenticatedFetch(`/v1/delivery/${deliveryId}/proof`, {
    method: "POST",
    body: formData,
    headers: { /* kein Content-Type, Browser setzt multipart/form-data */ },
  });

  // 3. Status setzen
  await authenticatedFetch(`/v1/delivery/${deliveryId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "DELIVERED" }),
  });

  navigate({ to: "/deliveries" });
}
```

Backend setzt automatisch `order.currentStatus = "DELIVERED"`.

## Mobile-Optimierungen

- Page nutzt `<meta name="viewport" content="..., user-scalable=no" />`
- Bottom-Action-Bar ist sticky
- Karten-Container hat `touch-action: pan-x pan-y` damit Pinch-Zoom funktioniert
- "In Maps öffnen"-Button (deep-link zu Google/Apple Maps)
