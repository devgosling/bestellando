# Stripe einrichten

Bestellando nutzt **Stripe Checkout** für die Zahlungsabwicklung. Im Test-Modus ist alles kostenlos und mit Test-Karten möglich.

## 1. Konto anlegen

https://dashboard.stripe.com/register

## 2. API-Keys

Im Stripe-Dashboard → Developers → API Keys:

- **Publishable Key** (`pk_test_...`) → `VITE_STRIPE_PUBLISHABLE_KEY` (Frontend)
- **Secret Key** (`sk_test_...`) → `STRIPE_SECRET_KEY` (Backend)

## 3. Webhook einrichten

### Production / Staging

Dashboard → Developers → Webhooks → "Add endpoint":

- URL: `https://api.bestellando.com/v1/payment/webhook`
- Events:
  - `checkout.session.completed`
  - `payment_intent.payment_failed`
- Webhook-Secret kopieren → `STRIPE_WEBHOOK_SECRET`

### Lokale Entwicklung

Stripe CLI installieren:

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (Scoop)
scoop install stripe

# oder direkt
# https://docs.stripe.com/stripe-cli
```

Login:

```bash
stripe login
```

Webhook-Forwarding starten:

```bash
stripe listen --forward-to localhost:3000/v1/payment/webhook
```

Die CLI gibt ein Secret aus, das du in `STRIPE_WEBHOOK_SECRET` einträgst:

```
> Ready! Your webhook signing secret is whsec_abc123...
```

## 4. Test-Karten

| Karte | Verhalten |
|-------|-----------|
| `4242 4242 4242 4242` | Erfolgreiche Zahlung |
| `4000 0000 0000 9995` | Karte abgelehnt (insufficient funds) |
| `4000 0025 0000 3155` | 3D-Secure-Authentifizierung erforderlich |

Beliebiges zukünftiges Datum, beliebige CVC.

Vollständige Liste: https://docs.stripe.com/testing#cards

## 5. Wie nutzt Bestellando Stripe?

### Checkout-Session erstellen

[apps/api/src/payment/controller/payment.controller.ts](../../apps/api/src/payment/controller/payment.controller.ts):

```http
POST /v1/payment/checkout/:orderId
```

Erstellt eine Stripe Checkout-Session mit:
- Line-Items aus den `order_item`-Rows (Produktname + Menge + Einzelpreis in Cent)
- Liefergebühr als zusätzliches Line-Item (falls > 0)
- Success/Cancel URLs aus den Umgebungsvariablen

Response:

```json
{ "sessionUrl": "https://checkout.stripe.com/c/pay/cs_test_..." }
```

Das Frontend redirected dann zur `sessionUrl`.

### Webhook-Handler

[apps/api/src/payment/controller/webhook.controller.ts](../../apps/api/src/payment/controller/webhook.controller.ts):

```http
POST /v1/payment/webhook
```

Stripe ruft diesen Endpoint auf, sobald der Zahlungsstatus sich ändert.

Behandelte Events:

| Event | Aktion |
|-------|--------|
| `checkout.session.completed` | `order.paymentStatus = "PAID"`, `order.currentStatus = "CONFIRMED"`, WebSocket-Event emittieren |
| `payment_intent.payment_failed` | `order.currentStatus = "CANCELLED"` |

Die Signatur des Webhooks wird **unbedingt** mittels `STRIPE_WEBHOOK_SECRET` verifiziert, um gefälschte Requests abzuwehren.

## 6. Beträge: Cent vs. Euro

- **Bestellando intern**: Beträge sind in **Euro als `number`** gespeichert (z. B. `12.50`)
- **Stripe API**: Erwartet Beträge in **Cent als Integer** (z. B. `1250`)

Konvertierung im Code:

```ts
unitAmount: Math.round(item.unitPrice * 100)  // EUR → Cent
```

> **Wichtig:** Immer `Math.round()` benutzen, um Float-Rundungsfehler zu vermeiden.

## 7. Production-Checklist

Bevor du live gehst:

- [ ] Test-Keys gegen Live-Keys tauschen (`sk_live_...`, `pk_live_...`)
- [ ] Production-Webhook in Stripe registrieren
- [ ] Domain im Stripe-Dashboard verifizieren
- [ ] AGBs / Datenschutz / Impressum hinterlegen
- [ ] Tax-Settings konfigurieren (USt./MwSt.)
- [ ] Branding (Logo, Farben) im Stripe-Dashboard setzen
