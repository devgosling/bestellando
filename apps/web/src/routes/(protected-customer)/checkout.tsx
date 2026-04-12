import { useEffect, useState } from "react";
import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { AnimatedPage } from "../../components/shared/AnimatedPage";
import { CheckoutStepper } from "../../components/checkout/CheckoutStepper";
import { AddressStep } from "../../components/checkout/AddressStep";
import { ReviewStep } from "../../components/checkout/ReviewStep";
import { PaymentStep } from "../../components/checkout/PaymentStep";
import { OrderConfirmation } from "../../components/checkout/OrderConfirmation";
import { useCartStore } from "../../stores/cart-store";

interface CheckoutSearch {
  payment?: string;
  orderId?: string;
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { payment, orderId } = useSearch({
    from: "/(protected-customer)/checkout",
  });
  const items = useCartStore((s) => s.items);

  const isSuccess = payment === "success";
  const cartEmpty = items.length === 0;

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [orderNotes, setOrderNotes] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (cartEmpty && !isSuccess) {
      navigate({ to: "/restaurants" });
    }
  }, [cartEmpty, isSuccess, navigate]);

  if (cartEmpty && !isSuccess) {
    return null;
  }

  if (isSuccess) {
    return (
      <AnimatedPage className="mx-auto max-w-2xl px-4 py-8">
        <OrderConfirmation orderId={orderId} />
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-2 text-foreground">Kasse</h1>
      <CheckoutStepper currentStep={currentStep} />

      <div className="mt-6">
        {currentStep === 1 && (
          <AddressStep
            selectedAddressId={selectedAddressId}
            onAddressChange={setSelectedAddressId}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <ReviewStep
            onBack={() => setCurrentStep(1)}
            onNext={(notes) => {
              setOrderNotes(notes);
              setCurrentStep(3);
            }}
          />
        )}

        {currentStep === 3 && selectedAddressId && (
          <PaymentStep
            selectedAddressId={selectedAddressId}
            notes={orderNotes}
            onBack={() => setCurrentStep(2)}
            onSuccess={(id) => {
              navigate({
                to: "/checkout",
                search: { payment: "success", orderId: id },
              });
            }}
            onError={() => {}}
          />
        )}
      </div>
    </AnimatedPage>
  );
}

export const Route = createFileRoute("/(protected-customer)/checkout")({
  component: CheckoutPage,
  validateSearch: (search: Record<string, unknown>): CheckoutSearch => ({
    payment: (search.payment as string) || undefined,
    orderId: (search.orderId as string) || undefined,
  }),
  staticData: { showHeader: true, showFooter: true },
});
