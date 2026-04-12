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
      description="Füge Gerichte von einem Restaurant hinzu."
      action={
        <Button
          className="bg-accent text-accent-foreground"
          onPress={() => navigate({ to: "/restaurants" })}
        >
          Restaurants entdecken
        </Button>
      }
    />
  );
}
