import { useEffect } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { AnimatedPage } from "../../components/shared/AnimatedPage";
import { CheckoutForm } from "../../components/checkout/CheckoutForm";
import { OrderConfirmation } from "../../components/checkout/OrderConfirmation";
import { useCartStore } from "../../stores/cart-store";

interface CheckoutSearch {
  payment?: string;
  orderId?: string;
}

function CheckoutPage() {
  const navigate = useNavigate();
  const { payment, orderId } = useSearch({ from: "/(protected-customer)/checkout" });
  const items = useCartStore((s) => s.items);

  const isSuccess = payment === "success";
  const cartEmpty = items.length === 0;

  useEffect(() => {
    if (cartEmpty && !isSuccess) {
      navigate({ to: "/restaurants" });
    }
  }, [cartEmpty, isSuccess, navigate]);

  if (cartEmpty && !isSuccess) {
    return null;
  }

  return (
    <AnimatedPage className="mx-auto max-w-2xl px-4 py-8">
      {isSuccess ? (
        <OrderConfirmation orderId={orderId} />
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-6">Kasse</h1>
          <CheckoutForm />
        </>
      )}
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
