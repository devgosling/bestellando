import { Button } from "@heroui/react";
import { CircleCheck } from "@gravity-ui/icons";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";

interface OrderConfirmationProps {
  orderId?: string;
}

export function OrderConfirmation({ orderId }: OrderConfirmationProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-6 py-16 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        <CircleCheck className="size-16 text-success" />
      </motion.div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          Bestellung bestätigt!
        </h1>
        <p className="text-muted">
          Deine Bestellung wurde aufgegeben und wird bearbeitet.
        </p>
        {orderId && (
          <p className="text-sm text-muted">Bestellnummer: {orderId}</p>
        )}
      </div>
      {orderId && (
        <Button
          size="lg"
          className="bg-accent text-accent-foreground font-semibold"
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
        Zurück zur Startseite
      </Button>
    </div>
  );
}
