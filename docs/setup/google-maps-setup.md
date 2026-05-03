# Google Maps API einrichten

Bestellando nutzt die Google Maps Geocoding API, um aus Adress-Strings (z. B. `"Friedrichstraße 200, 10117 Berlin"`) Koordinaten (`lng`, `lat`) zu machen — und umgekehrt (Reverse Geocoding).

> Für die Karten-Darstellung selbst nutzen wir **OpenStreetMap via Leaflet**, kein Google-Maps-Embed.

## 1. Google-Cloud-Projekt anlegen

1. https://console.cloud.google.com → "Neues Projekt"
2. Projektname: `bestellando`
3. Projekt auswählen

## 2. Geocoding API aktivieren

1. Im linken Menü: APIs & Dienste → Bibliothek
2. Suchen nach "Geocoding API"
3. Aktivieren

> Die Geocoding API ist **gebührenpflichtig**, hat aber ein monatliches Gratis-Kontingent (Stand 2026: $200/Monat).

## 3. API-Key erstellen

1. APIs & Dienste → Anmeldedaten → "Anmeldedaten erstellen" → API-Schlüssel
2. Den generierten Key kopieren → `GOOGLE_MAPS_API_KEY` (in `apps/api/.env`)

## 4. API-Key einschränken (Empfohlen!)

Damit der Key nicht missbraucht werden kann:

1. Auf den Key klicken
2. **API-Einschränkungen**: Nur "Geocoding API" erlauben
3. **Anwendungseinschränkungen**:
   - Für lokale Entwicklung: keine
   - Für Produktion: IP-Adresse(n) des API-Servers eintragen

## 5. Wie wird die API genutzt?

### Forward Geocoding (Adresse → Koordinaten)

Im Service [GeocodingService](../../apps/api/src/address/service/geocoding.service.ts):

```http
GET https://maps.googleapis.com/maps/api/geocode/json
    ?address=Friedrichstraße+200,+10117+Berlin
    &key=YOUR_KEY
```

Wird automatisch aufgerufen, wenn:
- Eine `Address` neu erstellt wird (`POST /v1/address`)
- Eine `Address` aktualisiert wird (`PATCH /v1/address/:id`)
- Bei der Restaurant-Registrierung (Address-Erstellung)

Resultat:

```json
{
  "results": [
    {
      "geometry": {
        "location": { "lat": 52.5200, "lng": 13.4050 }
      }
    }
  ]
}
```

Wird im Code zu Appwrite-Point-Format konvertiert: `[lng, lat]` (also `[13.4050, 52.5200]`).

### Reverse Geocoding (Koordinaten → Adresse)

```http
GET /v1/address/reverse?lat=52.5200&lng=13.4050
```

Backend ruft:

```http
GET https://maps.googleapis.com/maps/api/geocode/json
    ?latlng=52.5200,13.4050
    &key=YOUR_KEY
```

Genutzt z. B. wenn der Nutzer auf einer Karte eine Position auswählt.

## 6. Fehlerszenarien

| Status | Bedeutung |
|--------|-----------|
| `OK` | Erfolg |
| `ZERO_RESULTS` | Adresse nicht gefunden — `BadRequestException` |
| `OVER_QUERY_LIMIT` | Quote überschritten — Backend sollte 429 zurückgeben |
| `REQUEST_DENIED` | API-Key falsch / API nicht aktiviert |
| `INVALID_REQUEST` | Adress-String leer / unsinnig |

## 7. Datenschutz

Die Geocoding-Anfragen gehen an Google und enthalten ggf. die Anschrift der/s Kund:in. Stelle sicher, dass das in der Datenschutzerklärung dokumentiert ist.

Weitere Infos: https://developers.google.com/maps/documentation/geocoding/policies
