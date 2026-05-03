# Checkout Components

Pfad: `apps/web/src/components/checkout/`

Mehrstufiger Checkout-Prozess.

## Übersicht

| Komponente | Datei | Zweck |
|------------|-------|-------|
| `CheckoutForm` | `CheckoutForm.tsx` | Haupt-Container mit den Schritten |
| `CheckoutStepper` | `CheckoutStepper.tsx` | Visueller Stepper "Adresse → Review → Zahlung" |
| `AddressStep` | `AddressStep.tsx` | Adress-Auswahl |
| `AddressSelector` | `AddressSelector.tsx` | Dropdown mit existierenden Adressen + "Neue hinzufügen" |
| `ReviewStep` | `ReviewStep.tsx` | Zusammenfassung der Bestellung |
| `PaymentStep` | `PaymentStep.tsx` | Zahlung auslösen → Stripe-Redirect |
| `OrderConfirmation` | `OrderConfirmation.tsx` | Erfolgsanzeige nach Stripe-Rückkehr |

## CheckoutForm — Hauptlogik

```tsx
<CheckoutForm restaurantId={restaurantId} />
```

State:

```ts
const [step, setStep] = useState<"address" | "review" | "payment">("address");
const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
const [notes, setNotes] = useState("");
```

Render:

```tsx
<>
  <CheckoutStepper currentStep={step} />

  {step === "address" && (
    <AddressStep
      selectedId={selectedAddressId}
      onSelect={setSelectedAddressId}
      onNext={() => setStep("review")}
    />
  )}

  {step === "review" && (
    <ReviewStep
      addressId={selectedAddressId!}
      notes={notes}
      onNotesChange={setNotes}
      onBack={() => setStep("address")}
      onNext={() => setStep("payment")}
    />
  )}

  {step === "payment" && (
    <PaymentStep
      restaurantId={restaurantId}
      addressId={selectedAddressId!}
      notes={notes}
    />
  )}
</>
```

## AddressStep

Zeigt eine Liste vorhandener Adressen + "Neue Adresse hinzufügen".

```tsx
<AddressSelector
  selectedId={selectedAddressId}
  onSelect={setSelectedAddressId}
/>
<Button onPress={onNext} isDisabled={!selectedAddressId}>
  Weiter
</Button>
```

`AddressSelector` ruft `GET /v1/address/mine`.

## ReviewStep

Zeigt:
- Liste aller Cart-Items mit Modifier
- Address-Display
- Subtotal / Liefergebühr / Total
- TextArea für `notes`
- "Zurück" + "Bezahlen" Buttons

## PaymentStep

**Wichtigster Step** — löst die eigentliche Bestellung + Stripe-Checkout aus.

```tsx
async function handlePay() {
  setIsLoading(true);
  try {
    // 1. Order erstellen
    const order = await authenticatedFetch("/v1/order", {
      method: "POST",
      body: JSON.stringify({
        restaurantId,
        deliveryAddressId: addressId,
        items: cartItems.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          modifierOptionIds: i.modifierOptionIds,
          ...(i.specialInstructions ? { specialInstructions: i.specialInstructions } : {}),
        })),
        ...(notes ? { specialInstructions: notes } : {}),
      }),
    });

    // 2. Stripe-Checkout-Session
    const checkout = await authenticatedFetch(`/v1/payment/checkout/${order.$id}`, {
      method: "POST",
    });

    // 3. Cart leeren + zu Stripe
    cartStore.clear();
    window.location.href = checkout.sessionUrl;
  } catch (e) {
    setIsLoading(false);
    setError(e.message);
  }
}
```

> **Wichtig**: Der Feldname war einmal ein Bug — das Frontend sendete `notes`, das Backend-DTO hieß `specialInstructions`. Wegen `whitelist: true` der ValidationPipe wurde `notes` silent verworfen. Korrekt ist:
>
> ```ts
> ...(notes ? { specialInstructions: notes } : {})
> ```

## OrderConfirmation

Wird angezeigt, wenn der User von Stripe zurückkehrt mit `?paid=true` im Query-String.

```tsx
const { paid, cancelled } = Route.useSearch();

if (paid) return <OrderConfirmation orderId={orderId} />;
if (cancelled) return <OrderCancelled orderId={orderId} />;
```

Inhalt von `OrderConfirmation`:
- Success-Icon + "Bestellung erfolgreich!"
- "Bestellnummer: #ABC123"
- Link "Zur Bestellung"

## CheckoutStepper

Visueller 3-Schritt-Stepper:

```tsx
<CheckoutStepper currentStep={step} />
```

Zeigt:
- ① Adresse
- ② Review
- ③ Zahlung

Mit Highlight für den aktuellen Schritt.
