# Echtzeit (WebSockets)

Bestellando nutzt **Socket.io** für Echtzeit-Kommunikation zwischen API und Browser.

## Inhalt

- [WebSocket-Architektur](./websocket-architektur.md)
- [Orders-Namespace](./orders-namespace.md)
- [Delivery-Namespace](./delivery-namespace.md)
- [Event-Referenz](./events.md)

## Übersicht

Es gibt **zwei** Socket.io-Namespaces:

- **`/orders`** — Bestellung-bezogene Events
- **`/delivery`** — Lieferung-bezogene Events (inkl. GPS-Position)

Beide laufen über dieselbe HTTP-Server-Instanz, aber als separate Namespaces, damit Subscriptions und Authentifizierung getrennt sind.

## Schnellzugriff

| Event | Namespace | Wer sendet | Wer empfängt |
|-------|-----------|------------|--------------|
| `order:new` | `/orders` | API | Restaurant-Dashboard |
| `order:status-changed` | `/orders` | API | Customer + Restaurant |
| `delivery:assigned` | `/orders` | API | Customer + Restaurant + Driver |
| `subscribe:order` | `/orders` | Customer | API |
| `subscribe:restaurant` | `/orders` | Restaurant | API |
| `driver:location` | `/delivery` | Driver | API |
| `delivery:gps-position` | `/delivery` | API | Customer |
| `subscribe:delivery` | `/delivery` | Customer | API |
