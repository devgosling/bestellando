import { Button } from "@heroui/react";
import { ShoppingCart } from "@gravity-ui/icons";
import { useNavigate } from "@tanstack/react-router";
import { EmptyState } from "../shared/EmptyState";

export function CartEmpty() {
  const navigate = useNavigate();

  return (
    <EmptyState
      icon={<ShoppingCart className="size-12" />}
      title="Dein Warenkorb ist leer"
      description="Entdecke unsere Restaurants und fuege leckere Gerichte hinzu."
      action={
        <Button
          color="primary"
          onPress={() => navigate({ to: "/restaurants" })}
        >
          Restaurants entdecken
        </Button>
      }
    />
  );
}
