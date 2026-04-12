import { Button } from "@heroui/react";
import { CircleCheck } from "@gravity-ui/icons";
import { useNavigate } from "@tanstack/react-router";

interface OrderConfirmationProps {
  orderId?: string;
}

export function OrderConfirmation({ orderId }: OrderConfirmationProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <CircleCheck className="size-16 text-success" />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Bestellung erfolgreich!</h1>
        <p className="text-default-500">
          Deine Bestellung wurde aufgegeben und wird bearbeitet.
        </p>
        {orderId && (
          <p className="text-sm text-default-400">
            Bestellnummer: {orderId}
          </p>
        )}
      </div>
      {orderId && (
        <Button
          color="primary"
          size="lg"
          onPress={() =>
            navigate({ to: "/orders/$orderId", params: { orderId } })
          }
        >
          Bestellung verfolgen
        </Button>
      )}
      <Button
        variant="flat"
        onPress={() => navigate({ to: "/restaurants" })}
      >
        Weiter bestellen
      </Button>
    </div>
  );
}
