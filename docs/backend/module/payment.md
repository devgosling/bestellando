# Payment-Modul

Pfad: `apps/api/src/payment/`

Stripe-Integration: Checkout-Session erstellen + Webhook verarbeiten.

## Datei-Übersicht

```
payment/
├── payment.module.ts
├── controller/
│   ├── payment.controller.ts       # POST /checkout/:orderId
│   └── webhook.controller.ts       # POST /webhook
└── service/stripe.service.ts
```

## Endpunkte

### `POST /v1/payment/checkout/:orderId`

`@RequireUserType(["CUSTOMER"])` — Erstellt eine Stripe Checkout-Session für eine Bestellung.

**Validierung**:
- Order existiert
- Order gehört dem aktuellen Customer
- Order-Status ist `PENDING`

**Code** (`payment.controller.ts`):

```ts
@Post("checkout/:orderId")
async createCheckoutSession(@Param("orderId") orderId: string) {
  const userId = this.actorContextService.get().user.id;
  const order = await this.orderService.getOrderById(orderId);

  if (!order) throw new BadRequestException("Order not found");

  const orderCustomer = typeof order.customer === "object"
    ? order.customer.$id
    : order.customer;
  if (orderCustomer !== userId) throw new BadRequestException("Order does not belong to you");
  if (order.currentStatus !== "PENDING") throw new BadRequestException("Order is not in PENDING status");

  // Line-Items aus order_items bauen
  const items = (await this.orderService.getOrderItems(orderId)).rows || [];
  const lineItems = items.map(item => ({
    name: `Product ${item.product}`,        // TODO: ggf. Produkt-Name laden
    quantity: item.quantity,
    unitAmount: Math.round(item.unitPrice * 100),  // EUR → Cent
  }));

  // Liefergebühr
  const deliveryFee = order.deliveryFee as number;
  if (deliveryFee > 0) {
    lineItems.push({
      name: "Liefergebühr",
      quantity: 1,
      unitAmount: Math.round(deliveryFee * 100),
    });
  }

  const session = await this.stripeService.createCheckoutSession({
    orderId,
    restaurantId: typeof order.restaurant === "object" ? order.restaurant.$id : order.restaurant,
    amount: Math.round(order.totalAmount * 100),
    lineItems,
  });

  return { sessionUrl: session.url };
}
```

**Response**:

```ts
{ sessionUrl: "https://checkout.stripe.com/c/pay/cs_test_..." }
```

Frontend redirected per `window.location.href = sessionUrl`.

### `POST /v1/payment/webhook`

@Public — Stripe ruft diesen Endpoint mit signiertem Body auf.

**Wichtig**: Express muss den Body als **Raw-Buffer** ausliefern, damit die Signatur verifiziert werden kann. In `main.ts`:

```ts
app.use("/v1/payment/webhook", express.raw({ type: "application/json" }));
```

**Verarbeitung**:

```ts
@Post("webhook")
async handleWebhook(@Headers("stripe-signature") sig: string, @Req() req: Request) {
  const event = this.stripeService.verifyWebhookSignature(req.body, sig);

  switch (event.type) {
    case "checkout.session.completed": {
      const orderId = event.data.object.metadata.orderId;
      // paymentStatus = PAID, currentStatus = CONFIRMED
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

> Stripe erwartet HTTP `200` ohne Verzögerung. Lange Operationen (z. B. E-Mail senden) sollten async/queued laufen, nicht blockierend.

## StripeService

`apps/api/src/payment/service/stripe.service.ts`:

```ts
@Injectable()
export class StripeService {
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    this.stripe = new Stripe(configService.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-...",
    });
  }

  async createCheckoutSession(params: {
    orderId: string;
    restaurantId: string;
    amount: number;        // in Cent
    lineItems: Array<{ name: string; quantity: number; unitAmount: number }>;
  }) {
    return this.stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: params.lineItems.map(li => ({
        price_data: {
          currency: "eur",
          product_data: { name: li.name },
          unit_amount: li.unitAmount,
        },
        quantity: li.quantity,
      })),
      success_url: this.configService.get("STRIPE_SUCCESS_URL").replace("{ORDER_ID}", params.orderId),
      cancel_url: this.configService.get("STRIPE_CANCEL_URL").replace("{ORDER_ID}", params.orderId),
      metadata: {
        orderId: params.orderId,
        restaurantId: params.restaurantId,
      },
    });
  }

  verifyWebhookSignature(rawBody: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.configService.get("STRIPE_WEBHOOK_SECRET")!,
    );
  }
}
```

## Cent vs. Euro

- **Bestellando-DB**: EUR als `number` (z. B. `12.50`)
- **Stripe-API**: Cent als `integer` (z. B. `1250`)

Konvertierung:

```ts
unitAmount: Math.round(item.unitPrice * 100)
```

Immer `Math.round()` — sonst Float-Rundungsfehler.

## Sicherheits-Hinweise

1. **Webhook-Signatur immer prüfen** — `verifyWebhookSignature` in jedem Handler
2. **Idempotenz**: Stripe kann Events mehrfach senden. Im Handler vor jedem Statuswechsel prüfen, ob er schon erfolgt ist
3. **Logging**: Webhook-Events sollten geloggt werden (z. B. mit Stripe-Event-ID), um bei Disputes nachvollziehen zu können
4. **Test- vs. Live-Modus**: `STRIPE_SECRET_KEY` und `STRIPE_WEBHOOK_SECRET` sind getrennt — sicherstellen, dass Test mit Test und Live mit Live spricht

## OrderService-Hooks

`OrderService.confirmPayment(orderId)`:
1. `paymentStatus = "PAID"`
2. `currentStatus = "CONFIRMED"`
3. `order_status_history` row anlegen
4. WS-Event `order:status-changed` emitten

`OrderService.cancelOrder(orderId, reason)`:
1. `currentStatus = "CANCELLED"`
2. History-Row mit `reason`
3. WS-Event emitten
