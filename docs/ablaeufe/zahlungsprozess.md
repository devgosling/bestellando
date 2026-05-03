# Zahlungsprozess (Stripe)

## Phasen

```
1. Order erstellen (PENDING)
        ▼
2. Checkout-Session erstellen
        ▼
3. Customer zahlt bei Stripe
        ▼
4. Stripe-Webhook ──► Backend
        ▼
5. Order confirmed / cancelled
```

## Detail

### 1. Order erstellen

Vor jedem Zahlungsversuch existiert eine Order mit:
- `currentStatus: "PENDING"`
- `paymentStatus: "UNPAID"`

```http
POST /v1/order
```

(Siehe [Bestellprozess](./bestellprozess.md))

### 2. Checkout-Session erstellen

Frontend ruft:

```http
POST /v1/payment/checkout/:orderId
```

Im Backend (`payment.controller.ts`):

```ts
const session = await this.stripeService.createCheckoutSession({
  orderId,
  restaurantId,
  amount: Math.round(order.totalAmount * 100),  // EUR → Cent
  lineItems,
});
return { sessionUrl: session.url };
```

`stripeService.createCheckoutSession()` erstellt eine Stripe Checkout-Session mit:
- Mode: `payment` (one-time)
- Line-Items mit `price_data.unit_amount` in Cent
- `metadata: { orderId, restaurantId }` — landet später im Webhook
- `success_url` und `cancel_url` aus Env-Variablen

### 3. Customer zahlt

Frontend redirected per `window.location.href = sessionUrl` zu Stripe.

User gibt Kreditkartendaten ein. Stripe verarbeitet die Zahlung.

Bei Erfolg: Stripe redirected zu `STRIPE_SUCCESS_URL` (z. B. `/orders/:orderId?paid=true`).

Bei Abbruch / Klick auf "Zurück": Stripe redirected zu `STRIPE_CANCEL_URL` (z. B. `/orders/:orderId?cancelled=true`).

### 4. Stripe-Webhook

**Wichtig**: Der Frontend-Redirect ist **nicht** die zuverlässige Quelle für Zahlungserfolg — Stripe ruft separat den Webhook auf:

```http
POST /v1/payment/webhook
```

Body: signiertes JSON mit dem Event.

Im Backend (`webhook.controller.ts`):

```ts
@Post("webhook")
async handleWebhook(@Headers("stripe-signature") sig: string, @Req() req: Request) {
  const event = this.stripeService.verifyWebhookSignature(req.body, sig);

  switch (event.type) {
    case "checkout.session.completed": {
      const orderId = event.data.object.metadata.orderId;
      await this.orderService.confirmPayment(orderId);
      break;
    }
    case "payment_intent.payment_failed": {
      const orderId = event.data.object.metadata.orderId;
      await this.orderService.cancelOrder(orderId, "Payment failed");
      break;
    }
  }

  return { received: true };
}
```

### 5. Order confirmen

`OrderService.confirmPayment(orderId)`:

```ts
async confirmPayment(orderId: string) {
  await this.dataBase.updateRow({
    databaseId,
    tableId: "order",
    rowId: orderId,
    data: {
      paymentStatus: "PAID",
      currentStatus: "CONFIRMED",
    },
  });

  await this.orderStatusHistoryService.createOrderStatusHistory({
    order: orderId,
    status: "CONFIRMED",
  });

  this.orderGateway.notifyOrderUpdate(orderId, "order:status-changed", {
    orderId,
    previousStatus: "PENDING",
    newStatus: "CONFIRMED",
    timestamp: new Date().toISOString(),
  });
}
```

## Sicherheits-Architektur

### Webhook-Verifikation

```ts
verifyWebhookSignature(rawBody: Buffer, signature: string): Stripe.Event {
  return this.stripe.webhooks.constructEvent(
    rawBody,
    signature,
    this.configService.get("STRIPE_WEBHOOK_SECRET")!,
  );
}
```

Stripe signiert jeden Webhook-Body mit einem Geheimnis. Wenn die Signatur nicht passt → `Stripe.errors.StripeSignatureVerificationError`. So wehren wir gefälschte Webhook-Requests ab.

### Raw-Body

Express muss den Body als **raw Buffer** ausliefern für die Webhook-Route:

```ts
// main.ts
app.use("/v1/payment/webhook", express.raw({ type: "application/json" }));
```

Sonst parsiert Express das JSON, und die Signatur passt nicht mehr (Whitespace-Unterschiede).

### Idempotenz

Stripe kann Webhooks mehrfach senden (z. B. wenn unsere Antwort verloren geht). Beim Confirmen sollten wir prüfen, ob der Status schon `CONFIRMED` ist:

```ts
if (order.currentStatus === "CONFIRMED") return;  // bereits bestätigt
```

Aktuell **nicht** explizit gecheckt — aber `updateRow({ ... currentStatus: "CONFIRMED" })` ist idempotent (das Schreiben des gleichen Wertes ist ok).

## Cent vs. Euro

| Wo | Format |
|----|--------|
| Bestellando-DB | EUR als Float (`12.50`) |
| Stripe-API | Cent als Integer (`1250`) |

Konvertierung immer mit `Math.round(amount * 100)`, um Float-Rundungen zu vermeiden.

## Retry-Logik

Wenn Customer auf der Order-Detail-Seite landet und `currentStatus === "PENDING"`, wird ein "Bezahlen"-Button gezeigt. Klick → erneut `POST /v1/payment/checkout/:id` → neue Stripe-Session.

```tsx
{order.currentStatus === "PENDING" && (
  <Button onPress={handleRetryPayment}>Bezahlen</Button>
)}
```

Mehrere Sessions pro Order sind erlaubt — Stripe verfolgt das via `metadata.orderId`.
