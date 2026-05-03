# Öffentliche Routen

Routen, die ohne Login erreichbar sind.

## `/` — Startseite

Datei: `apps/web/src/routes/index.tsx`

Zeigt:
- Hero-Banner mit Suchleiste
- Featured Restaurants (`isFeatured: true`)
- Kategorien-Schnellzugriff
- "Restaurant?-Werde Partner" CTA

Nutzt `GET /v1/restaurant?isFeatured=true` über `useApiQuery`.

## `/map` — Restaurant-Karte

Datei: `apps/web/src/routes/map.tsx`

Vollbildkarte mit allen aktiven Restaurants als Pins. Klick auf Pin → Tooltip mit Name + Link zur Detail-Seite.

Nutzt:
- `GET /v1/restaurant?isActive=true` für Restaurants
- `useUserLocation` (aus `@repo/hooks`) für die initiale Center-Position der Karte

## `/auth/login` — Anmeldung

Datei: `apps/web/src/routes/auth/login.tsx`

E-Mail + Passwort. Nach erfolgreichem Login:
- Redirect zur ursprünglich angefragten Seite (über `?redirect=` Search-Param)
- Oder zur passenden Default-Seite je nach Rolle (`/`, `/dashboard`, `/deliveries`)

Implementation:

```tsx
const form = useForm({
  defaultValues: { email: "", password: "" },
  onSubmit: async ({ value }) => {
    await account.createEmailPasswordSession(value.email, value.password);
    queryClient.invalidateQueries({ queryKey: ["user-data"] });
    navigate({ to: redirect ?? "/" });
  },
  validatorAdapter: zodValidator(),
});
```

## `/auth/register/user` — Customer-Registrierung

Datei: `apps/web/src/routes/auth/register/user.tsx`

Form-Felder:
- E-Mail
- Passwort (min. 8 Zeichen)
- Name

Nach Submit:
1. `POST /v1/user/register` (oder direkt Appwrite-SDK)
2. Auto-Login (`account.createEmailPasswordSession`)
3. Redirect zu `/`

## `/auth/register/restaurant` — Restaurant-Registrierung

Datei: `apps/web/src/routes/auth/register/restaurant.tsx`

Multi-Step-Form:
1. **Owner-Daten**: Email, Passwort, Name
2. **Restaurant-Daten**: Name, Kategorie, Liefergebühr, Mindestbestellwert
3. **Adresse**: Straße, PLZ, Stadt, Land

Nach Submit:
1. `POST /v1/restaurant/register` (Backend macht alles in einem Flow)
2. Auto-Login
3. Redirect zu `/dashboard`

## `/auth/register/delivery` — Delivery-Person-Registrierung

Datei: `apps/web/src/routes/auth/register/delivery.tsx`

Form-Felder:
- E-Mail, Passwort, Name
- Telefon
- Vehicle-Type (`BICYCLE` / `SCOOTER` / `CAR`)

Nach Submit:
1. `POST /v1/delivery-person/register`
2. Auto-Login
3. Redirect zu `/deliveries`
