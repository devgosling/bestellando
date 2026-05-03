# Designentscheidungen

Diese Sektion erklärt das **Warum** hinter den wichtigsten architektonischen Entscheidungen.

## 1. Warum Appwrite und kein traditionelles Backend mit eigener DB?

Appwrite bietet als BaaS:
- **Authentifizierung** (Email/Password + JWT) out-of-the-box
- **Datenbank** mit Beziehungen, ohne dass wir Migrations schreiben müssen
- **Teams** als natürliche Abbildung von Rollen
- **Storage** für Files (z. B. Lieferbestätigungs-Bilder)

Trade-off: Wir bekommen keine vollständige SQL-Power und müssen mit Appwrites Eigenheiten leben (z. B. Beziehungen werden nur eine Ebene tief expandiert).

## 2. Warum NestJS statt direkter Frontend↔Appwrite-Kommunikation?

Theoretisch könnte das React-Frontend direkt mit Appwrite reden. Wir nutzen aber einen NestJS-Layer dazwischen, weil:

- **Komplexe Validierungslogik** (z. B. Modifier müssen zum Produkt gehören, MinOrderValue) gehört serverseitig
- **State-Machine für Bestellstatus** muss zentralisiert sein
- **Stripe-Webhooks** brauchen eine HTTP-Endpunkt mit Signatur-Verifikation
- **WebSocket-Gateway** für Echtzeit-Events
- **Geocoding-Aufrufe** sollten den Google-API-Key nicht ans Frontend leaken
- **Rollen-spezifische Berechtigungschecks** über Decorators

Das Frontend nutzt Appwrite trotzdem direkt für:
- Login / Logout / Account-Erstellung (Appwrite-Auth)
- JWT-Generierung (`appwriteAccount.createJWT()`)

## 3. Warum JWT-Bearer statt Session-Cookies?

- **Stateless** auf API-Seite — kein Session-Storage nötig
- **Mehrere Clients** (Web, künftig Mobile-Apps) können dasselbe Auth-Schema nutzen
- **Appwrite generiert JWTs** sowieso, also Synergie-Effekt
- **15-Min-Lebensdauer** — Frontend cached und erneuert lazy

## 4. Warum eine separate `@repo/interfaces`?

- **Single Source of Truth** für DTOs/Entities
- Vermeidet Drift zwischen Frontend-Erwartung und Backend-Realität
- Erlaubt z. B. WebSocket-Event-Typen wie `DriverLocationEvent` an einem Ort zu definieren

## 5. Warum HeroUI v3 (Beta)?

- **react-aria-components** als Basis = ausgezeichnete Accessibility
- **Tailwind-First** — passt zu unserem Styling-Ansatz
- **Compound-Komponenten** — flexible UI-Anpassung

Trade-off: Beta-Status bedeutet Breaking-Changes möglich. **Wichtig:** Compound-Pattern unbedingt einhalten — naive v2-Style-Usage bricht silently (siehe CLAUDE.md "Common gotchas").

## 6. Warum Leaflet/OpenStreetMap statt Google Maps Embed?

- **Kostenlos** — keine API-Limits für Karten-Tiles
- **Datenschutz** — keine Google-Tracker im Frontend
- **Geocoding nutzen wir trotzdem** von Google (server-seitig, IP-beschränkt)

## 7. Warum Zustand und nicht Redux?

- **Cart-Store** ist der einzige nicht-server-state Bereich
- **TanStack Query** kümmert sich um den Server-State
- Zustand ist leichter, ohne Boilerplate

## 8. Warum eine eigene WebSocket-Implementierung statt Appwrite Realtime?

- **Granulare Events** wie GPS-Position des Fahrers passen nicht ins Appwrite-Realtime-Modell
- **Cross-Cutting Concerns** wie Order-Status-Übergänge mit Audit-Trail-Logik
- **Eigene Rooms** (`restaurant:X:orders`, `order:Y`, `delivery:Z`)
- Appwrite Realtime ist für DB-Änderungs-Subscriptions optimiert, nicht für Custom-Events

## 9. Warum URI-basiertes Versioning (`/v1/`)?

- Klar erkennbar im URL
- Einfaches Routing per Decorator (`@Controller({ path: "...", version: "1" })`)
- API kann zukünftig parallel `v2`-Endpoints anbieten ohne Breaking

## 10. Warum keine GraphQL?

- **Klar definierte Endpunkte** — wir wissen genau, welche Operationen es gibt
- **Stripe-Webhook braucht REST** sowieso
- **TanStack Query** funktioniert gut mit REST + JWT-Bearer
- GraphQL würde Komplexität ohne klaren Mehrwert hinzufügen

## 11. Warum eager-loading der nested Address im OrderService?

Appwrite-TablesDB expandiert Beziehungen nur eine Ebene tief. Beispiel:

```ts
order.restaurant         // → { $id, name, address: "addrId123" }  ✗ adressen sind ID
order.restaurant.address // → "addrId123" (string, NICHT das Objekt!)
```

Das Frontend braucht aber `restaurant.address.coordinates` für die Live-Tracking-Karte. Statt das Frontend zwei zusätzliche Requests machen zu lassen, machen wir das eager-loading server-seitig in `OrderService.getOrderById()`.

Trade-off: 2 zusätzliche DB-Reads pro `getOrderById`-Aufruf. Aber: nur für den Customer-Order-Detail-Endpoint genutzt, nicht für Listen.

## 12. Warum Server-Side Preisberechnung statt Client-Side-Vertrauen?

**Niemals** dem Client beim Preis vertrauen. `OrderService.createOrder()` berechnet:

```
unitPrice = product.basePrice + Σ modifier_option.priceDelta
subtotal  = Σ (unitPrice × quantity)
total     = subtotal + restaurant.deliveryFee
```

Selbst wenn der Client einen `unitPrice` schickt, wird er ignoriert. Die im `order_item` gespeicherten Preise sind **Snapshots zum Zeitpunkt der Bestellung** — Preisänderungen nach der Bestellung wirken nicht zurück.

## 13. Warum eine separate `order_status_history`-Tabelle?

- **Audit-Trail** — wer hat wann den Status geändert?
- **Timeline-UI** im Customer-Order-Detail (zeigt jeden Schritt mit Timestamp)
- **Compliance / Forensik** bei Disputes

## 14. Warum keine ORM/Migrations?

Appwrite-TablesDB bietet keine ORM. Wir verzichten bewusst auf eine eigene Migrations-Schicht:

- **Schema-Änderungen** via Appwrite-Dashboard
- **Code-Schema-Drift** ist tolerabel, weil nur ein Team arbeitet
- Würde komplexer werden, wenn Schema-as-Code wichtig wird → Tools wie [appwrite-cli](https://appwrite.io/docs/tooling/command-line) evaluieren
