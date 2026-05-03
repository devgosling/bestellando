# Delivery Components

Pfad: `apps/web/src/components/delivery/`

Komponenten für die Lieferpersonen-App (`(protected-delivery)`-Routen).

## Übersicht

| Komponente | Datei | Zweck |
|------------|-------|-------|
| `ActiveDeliveryView` | `ActiveDeliveryView.tsx` | Hauptansicht für aktive Lieferung |
| `DeliveryActionBar` | `DeliveryActionBar.tsx` | Action-Bar mit "Abgeholt" / "Geliefert" |
| `DeliveryCard` | `DeliveryCard.tsx` | Listen-Item in der Übersicht |
| `NavigationMap` | `NavigationMap.tsx` | Karte mit Route + GPS-Tracking-Sender |
| `ProofImage` | `ProofImage.tsx` | Beweisfoto-Anzeige |

---

## DeliveryCard

```tsx
<DeliveryCard delivery={delivery} />
```

Auf der Übersichtsseite (`/deliveries`):
- Order-ID
- Restaurant-Name + Adresse
- Customer-Adresse
- Status-Badge
- Klick → `/deliveries/:deliveryId`

---

## ActiveDeliveryView

Hauptansicht im Detail-Screen einer aktiven Lieferung.

```tsx
<ActiveDeliveryView deliveryId={deliveryId} />
```

Layout:
- Oben: NavigationMap (Karte mit Route)
- Mitte: Order-Details (Restaurant, Customer, Items)
- Unten: DeliveryActionBar (Status-Buttons)

Außerdem: **Sendet GPS-Position** automatisch an das Backend.

```tsx
useEffect(() => {
  if (!navigator.geolocation) return;
  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      deliverySocket.emit("driver:location", {
        orderId: delivery.order,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        heading: pos.coords.heading ?? undefined,
      });
    },
    null,
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
  );
  return () => navigator.geolocation.clearWatch(watchId);
}, [delivery]);
```

---

## DeliveryActionBar

```tsx
<DeliveryActionBar
  delivery={delivery}
  onPickedUp={() => updateStatus("PICKED_UP")}
  onDelivered={() => uploadProofAndComplete(...)}
/>
```

Button-States:

| Delivery-Status | Sichtbarer Button |
|-----------------|-------------------|
| `ASSIGNED` | "Abgeholt" → setzt PICKED_UP |
| `PICKED_UP` | "Geliefert (mit Foto)" → öffnet Camera/File-Picker |
| `DELIVERED` | (nichts mehr) |

---

## NavigationMap

Karte mit:
- Aktueller GPS-Position des Drivers (live)
- Ziel-Pin (Restaurant bei `ASSIGNED`, Customer bei `PICKED_UP`)
- Routen-Linie

Zusätzlich: Button "In Maps öffnen" — öffnet:
- iOS/Android: Default-Maps-App via geo-URI
- Desktop: Google Maps Web

---

## ProofImage

Anzeige des hochgeladenen Beweisfotos.

```tsx
<ProofImage deliveryId={deliveryId} />
```

Lädt das Bild via:

```ts
const url = `${VITE_APPWRITE_ENDPOINT}/storage/buckets/delivery-proof/files/${proofImageId}/view?project=${VITE_APPWRITE_PROJECT_ID}`;
```

> Da das Bild öffentliche View-Permission haben sollte, ist kein JWT nötig. Sonst muss `authenticatedFetch` mit `responseType: "blob"` genutzt werden.

Anzeige:
- Daumennagel (max 200×200)
- Klick → Lightbox/Modal mit Vollansicht

---

## GPS-Permission-Handling

Wichtig: Browsers fragen erst bei der ersten `navigator.geolocation.getCurrentPosition`/`watchPosition`-Anfrage nach Erlaubnis.

Best Practice:
1. Beim Betreten der `ActiveDeliveryView`: `navigator.permissions.query({ name: "geolocation" })`
2. Wenn `denied`: Hinweis-Banner anzeigen ("GPS-Berechtigung erteilen, um die Lieferung zu tracken")
3. Wenn `prompt`: `getCurrentPosition` einmal aufrufen, um den Browser-Prompt zu triggern
