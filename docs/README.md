# Bestellando — Vollständige Dokumentation

Willkommen zur offiziellen Dokumentation von **Bestellando** — einer Food-Ordering-Plattform, die als Turborepo-Monorepo mit NestJS-API-Backend und React-Vite-Frontend entwickelt wurde.

Diese Dokumentation ist die zentrale Anlaufstelle für Entwickler:innen, die am Bestellando-Projekt arbeiten oder es verstehen wollen.

## Übersicht

Bestellando ist eine vollständige End-to-End-Plattform für die Bestellung von Speisen, bestehend aus:

- **Drei Benutzerrollen**: Kunden (Customer), Restaurants und Lieferpersonen (Delivery Person)
- **Echtzeit-Funktionalität** über WebSockets (Bestellstatus, Live-Tracking)
- **Stripe-Integration** für die sichere Zahlungsabwicklung
- **Appwrite Backend-as-a-Service** für Datenbank, Authentifizierung und Berechtigungen
- **Google Maps Geocoding** für Adress-zu-Koordinaten-Auflösung
- **Live-GPS-Tracking** der Lieferpersonen über die Karte

## Inhaltsverzeichnis

### 📦 [Setup & Installation](./setup/README.md)
- [Installation und erste Schritte](./setup/installation.md)
- [Umgebungsvariablen](./setup/umgebungsvariablen.md)
- [Entwicklungsumgebung starten](./setup/entwicklung.md)
- [Appwrite einrichten](./setup/appwrite-setup.md)
- [Stripe einrichten](./setup/stripe-setup.md)
- [Google Maps API einrichten](./setup/google-maps-setup.md)

### 🏗️ [Architektur](./architektur/README.md)
- [Architektur-Überblick](./architektur/ueberblick.md)
- [Monorepo-Struktur](./architektur/monorepo-struktur.md)
- [Tech-Stack](./architektur/tech-stack.md)
- [Ordnerstruktur](./architektur/ordnerstruktur.md)
- [Designentscheidungen](./architektur/design-entscheidungen.md)

### ⚙️ [Backend (apps/api)](./backend/README.md)
- [Übersicht](./backend/README.md)
- [Auth-Modul](./backend/module/auth.md)
- [User-Modul](./backend/module/user.md)
- [Restaurant-Modul](./backend/module/restaurant.md)
- [Address-Modul](./backend/module/address.md)
- [Product-Modul](./backend/module/product.md)
- [ModifierOption-Modul](./backend/module/modifier-option.md)
- [OpeningHours-Modul](./backend/module/opening-hours.md)
- [Order-Modul](./backend/module/order.md)
- [OrderItem-Modul](./backend/module/order-item.md)
- [OrderStatusHistory-Modul](./backend/module/order-status-history.md)
- [Payment-Modul](./backend/module/payment.md)
- [Delivery-Modul](./backend/module/delivery.md)
- [DeliveryZone-Modul](./backend/module/delivery-zone.md)
- [Gateway-Modul (WebSockets)](./backend/module/gateway.md)
- [Database-Modul](./backend/module/database.md)
- [Decorators](./backend/decorators.md)
- [Guards & Interceptors](./backend/guards-interceptors.md)
- [DTOs & Validierung](./backend/dto-validation.md)

### 🎨 [Frontend (apps/web)](./frontend/README.md)
- [Übersicht](./frontend/README.md)
- [Routing (TanStack Router)](./frontend/routing.md)
- [Auth-Flow](./frontend/auth-flow.md)
- [Komponenten](./frontend/komponenten/README.md)
  - [Shared Components](./frontend/komponenten/shared.md)
  - [Cart Components](./frontend/komponenten/cart.md)
  - [Checkout Components](./frontend/komponenten/checkout.md)
  - [Restaurant Components](./frontend/komponenten/restaurant.md)
  - [Order Components](./frontend/komponenten/order.md)
  - [Delivery Components](./frontend/komponenten/delivery.md)
  - [Dashboard Components](./frontend/komponenten/dashboard.md)
- [Routen](./frontend/routen/README.md)
  - [Öffentliche Routen](./frontend/routen/public.md)
  - [Customer-Routen](./frontend/routen/customer.md)
  - [Restaurant-Dashboard](./frontend/routen/restaurant-dashboard.md)
  - [Delivery-Routen](./frontend/routen/delivery.md)
- [Hooks](./frontend/hooks.md)
- [Stores (Zustand)](./frontend/stores.md)
- [Theming](./frontend/theming.md)

### 📚 [Shared Packages](./packages/README.md)
- [@repo/interfaces](./packages/interfaces.md)
- [@repo/lib](./packages/lib.md)
- [@repo/hooks](./packages/hooks.md)
- [@repo/contexts](./packages/contexts.md)
- [@repo/ui](./packages/ui.md)

### 💾 [Datenbank (Appwrite)](./datenbank/README.md)
- [Appwrite-Schema](./datenbank/appwrite-schema.md)
- [Tabellen](./datenbank/tabellen.md)
- [Beziehungen](./datenbank/beziehungen.md)
- [Berechtigungen (Permissions & Teams)](./datenbank/permissions.md)

### 🔌 [Echtzeit (WebSockets)](./echtzeit/README.md)
- [WebSocket-Architektur](./echtzeit/websocket-architektur.md)
- [Orders-Namespace](./echtzeit/orders-namespace.md)
- [Delivery-Namespace](./echtzeit/delivery-namespace.md)
- [Event-Referenz](./echtzeit/events.md)

### 🔄 [End-to-End Abläufe](./ablaeufe/README.md)
- [Bestellprozess](./ablaeufe/bestellprozess.md)
- [Zahlungsprozess (Stripe)](./ablaeufe/zahlungsprozess.md)
- [Lieferprozess](./ablaeufe/lieferprozess.md)
- [Authentifizierungsprozess](./ablaeufe/auth-prozess.md)
- [Live-Tracking](./ablaeufe/live-tracking.md)

## Schnellzugriff

| Was suche ich? | Dokument |
|----------------|----------|
| Wie starte ich das Projekt? | [Setup → Installation](./setup/installation.md) |
| Welche Tabellen gibt es? | [Datenbank → Tabellen](./datenbank/tabellen.md) |
| Wie funktioniert eine Bestellung? | [Abläufe → Bestellprozess](./ablaeufe/bestellprozess.md) |
| Welche WebSocket-Events gibt es? | [Echtzeit → Events](./echtzeit/events.md) |
| Wie ist die Auth implementiert? | [Backend → Auth](./backend/module/auth.md) |
| Wie funktionieren die Routen? | [Frontend → Routing](./frontend/routing.md) |

## Codestil

- **Doppelte Anführungszeichen**, 2-Space Einrückung, Trailing Commas
- TypeScript Strict Mode aktiviert
- Experimentelle Decorators (für die NestJS-API)
- **Paketmanager: pnpm 9** (kein npm/yarn auf Root-Ebene!)
- Bestehende Dateien bevorzugt bearbeiten, kein paralleler Code

---

**Stand:** Mai 2026
**Sprache:** Deutsch
**Maintainer:** developer@iboys.de
