# Architektur-Überblick

## Hochlevel-Diagramm

```
┌────────────────────────────────────────────────────────────────────┐
│                           Browser (Web)                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │            React 19 + Vite + TanStack Router                 │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │  │
│  │  │ Customer │  │Restaurant│  │ Delivery │  │     Auth     │ │  │
│  │  │  Routes  │  │Dashboard │  │  Routes  │  │   (Login)    │ │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────┬──────────────────┬──────────────────┬─────────────────┬───────┘
     │HTTP (REST)       │WebSocket         │Stripe.js         │Appwrite
     │JWT Bearer        │/orders /delivery │Checkout          │SDK
     ▼                  ▼                  ▼                  │
┌────────────────────────────────────────────────────────────┐│
│                  NestJS API (apps/api)                     ││
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  ││
│  │   Auth   │ │  Order   │ │  Payment │ │   Delivery   │  ││
│  │ Module   │ │ Module   │ │  Module  │ │   Module     │  ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  ││
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  ││
│  │Restaurant│ │ Product  │ │ Address  │ │  Gateway     │  ││
│  │ Module   │ │ Module   │ │ Module   │ │ (WebSocket)  │  ││
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  ││
│         │            │              │            │         ││
└─────────┼────────────┼──────────────┼────────────┼─────────┘│
          │            │              │            │          │
          ▼            ▼              ▼            ▼          │
   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
   │ Appwrite │  │  Stripe  │  │  Google  │  │  In-Memory  │  │
   │ (DB+Auth)│◄─┤   API    │  │  Maps    │  │ GpsStore    │  │
   └──────────┘  └──────────┘  │ Geocoding│  └─────────────┘  │
                               └──────────┘                   │
                                                              │
                          ┌───────────────────────────────────┘
                          │
                          ▼
                  ┌─────────────────┐
                  │    Appwrite     │
                  │  (Auth + DB +   │
                  │  Teams + Files) │
                  └─────────────────┘
```

## Komponenten

### Frontend (apps/web)
- **React 19** mit Suspense
- **Vite 7** als Build-Tool
- **TanStack Router** für File-basiertes Routing
- **TanStack Query** für Server-State
- **Zustand** für Client-State (Cart)
- **HeroUI v3** als UI-Komponentenbibliothek (basiert auf react-aria-components)
- **Tailwind v4** für Styling
- **Leaflet** für Karten
- **socket.io-client** für Echtzeit-Events

### Backend (apps/api)
- **NestJS 11** als Framework
- **Express 5** als HTTP-Adapter
- **Passport (HTTP Bearer)** für JWT-Auth
- **Socket.io 4** für WebSockets
- **Stripe SDK** für Zahlungen
- **node-appwrite** für DB-Zugriffe
- **class-validator + class-transformer** für DTOs

### Backend-as-a-Service
- **Appwrite** als zentrale Plattform für:
  - Authentifizierung (Email/Password)
  - Datenbank (TablesDB)
  - Teams (Rollensystem)
  - Storage (Proof-Bilder)

### Externe Services
- **Stripe** — Checkout-Flow für Zahlungen, Webhooks zur Statusbenachrichtigung
- **Google Maps Geocoding API** — Adress-zu-Koordinaten und umgekehrt

## Datenfluss-Beispiel: Bestellung

1. **Kunde** legt Produkte in den Warenkorb (`cart-store.ts`, Zustand)
2. **Kunde** geht zu `/checkout`, wählt Adresse + Zahlung
3. Frontend sendet `POST /v1/order` (mit JWT)
4. **API** validiert Restaurant, Produkte, Modifier; berechnet Preise
5. **API** schreibt `order`, `order_item`, `order_item_modifier` in Appwrite
6. **API** emittiert `order:new` über Socket.io an Restaurant-Room
7. **API** antwortet mit `Order`-Objekt
8. Frontend ruft `POST /v1/payment/checkout/:orderId` → Stripe-URL
9. Frontend redirected zu Stripe-Checkout
10. Nach Zahlung: Stripe ruft `/v1/payment/webhook` → API setzt `paymentStatus=PAID`, `currentStatus=CONFIRMED`
11. **API** emittiert `order:status-changed` an Customer- und Restaurant-Rooms
12. Restaurant sieht neue Bestellung im Dashboard, Customer sieht "Bestätigt"

Vollständiger Ablauf in [Bestellprozess](../ablaeufe/bestellprozess.md).

## Authentifizierung & Rollen

- **JWT Bearer Auth**: Frontend holt JWT von Appwrite (`appwriteAccount.createJWT()`), schickt es im `Authorization: Bearer ...`-Header
- **Rollen**: `CUSTOMER`, `RESTAURANT`, `DELIVERY_PERSON`, `ADMIN` — abgeleitet aus Team-Mitgliedschaften in Appwrite
- **Frontend-Routen**: Eigene Route-Gruppen pro Rolle (`(protected-customer)`, `(protected-restaurant)`, `(protected-delivery)`)

Mehr in [Auth-Prozess](../ablaeufe/auth-prozess.md).

## Echtzeit (WebSockets)

Zwei separate Socket.io-Namespaces:

- **`/orders`** — Bestellstatus-Updates, neue Bestellungen
- **`/delivery`** — Lieferdetails, GPS-Position des Fahrers

Mehr in [WebSocket-Architektur](../echtzeit/websocket-architektur.md).
