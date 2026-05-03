# OpeningHours-Modul

Pfad: `apps/api/src/openingHours/`

Verwaltet die Öffnungszeiten eines Restaurants.

## Datei-Übersicht

```
openingHours/
├── opening-hours.module.ts
├── controller/opening-hours.controller.ts
└── service/opening-hours.service.ts
```

## Konzept

Pro `(restaurant, dayOfWeek)` können **mehrere** Zeitslots existieren — z. B. ein Restaurant öffnet 8–12 Uhr (Frühstück) und 18–22 Uhr (Abend).

> **Kein Unique-Index auf `(restaurant, dayOfWeek)` setzen** — wir wollen explizit mehrere Slots pro Tag.

## Endpunkte

### `GET /v1/opening-hours?restaurantId=...`

@Public — Listet alle Öffnungszeiten eines Restaurants.

Response:

```ts
[
  {
    $id: "...",
    restaurant: "...",
    dayOfWeek: 1,        // 0 = Sonntag, 1 = Montag, ..., 6 = Samstag
    openTime: "08:00",   // "HH:mm"
    closeTime: "12:00",
  },
  {
    $id: "...",
    restaurant: "...",
    dayOfWeek: 1,
    openTime: "18:00",
    closeTime: "22:00",
  },
  ...
]
```

### `POST /v1/opening-hours`

`@RequireUserType(["RESTAURANT"])` — Fügt einen Slot hinzu.

Body:

```ts
{
  restaurantId: string;
  dayOfWeek: 0..6;
  openTime: string;       // "HH:mm"
  closeTime: string;
}
```

Owner-Check.

### `PATCH /v1/opening-hours/:id`

Aktualisiert einen Slot.

### `DELETE /v1/opening-hours/:id`

Löscht einen Slot. Wird vom Frontend genutzt, um einen Tag-Slot komplett zu entfernen.

## Schema

| Feld | Typ |
|------|-----|
| `$id` | string |
| `restaurant` | string (FK → restaurant) |
| `dayOfWeek` | integer (0–6) |
| `openTime` | string ("HH:mm") |
| `closeTime` | string ("HH:mm") |

## Frontend-Nutzung

Im Restaurant-Dashboard ([opening-hours/index.tsx](../../apps/web/src/routes/(protected-restaurant)/dashboard/opening-hours/index.tsx)) gibt es einen `OpeningHoursEditor`, der pro Wochentag eine Liste von Slots zeigt und das Hinzufügen/Entfernen erlaubt.

Auf der öffentlichen Restaurant-Seite ([restaurants/$restaurantId.tsx](../../apps/web/src/routes/(protected-customer)/restaurants/$restaurantId.tsx)) gibt es ein `OpeningHoursBadge`, das anzeigt:

- "Geöffnet bis 22:00"
- "Geschlossen, öffnet morgen um 8:00"

## "Ist jetzt offen?"-Logik

Diese Logik läuft **rein im Frontend**:

```ts
function isOpenNow(slots: OpeningHoursEntity[], now: Date): boolean {
  const dayOfWeek = now.getDay();
  const todaySlots = slots.filter(s => s.dayOfWeek === dayOfWeek);
  const minutes = now.getHours() * 60 + now.getMinutes();
  return todaySlots.some(s => {
    const open = parseTime(s.openTime);
    const close = parseTime(s.closeTime);
    return minutes >= open && minutes < close;
  });
}
```

Backend macht aktuell **keine** Validierung "Restaurant geschlossen → Bestellung verweigern" — könnte als zukünftige Verbesserung in `OrderService.createOrder()` ergänzt werden.
