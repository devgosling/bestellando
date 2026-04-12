import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Label,
  Separator,
  TextArea,
  TextField,
} from "@heroui/react";
import { ArrowLeft, ArrowRight } from "@gravity-ui/icons";
import { useCartStore } from "../../stores/cart-store";
import { PriceDisplay } from "../shared/PriceDisplay";

interface ReviewStepProps {
  onBack: () => void;
  onNext: (notes?: string) => void;
}

export function ReviewStep({ onBack, onNext }: ReviewStepProps) {
  const items = useCartStore((s) => s.items);
  const restaurantName = useCartStore((s) => s.restaurantName);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const [notes, setNotes] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-foreground">
              Bestellübersicht
            </h2>
            {restaurantName && (
              <span className="text-sm text-muted">{restaurantName}</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.product.$id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted">{item.quantity}x</span>
                <span className="text-sm text-foreground">
                  {item.product.name}
                </span>
              </div>
              <PriceDisplay
                amount={item.product.basePrice * item.quantity}
                className="text-sm font-medium text-foreground"
              />
            </div>
          ))}

          <Separator />

          <div className="flex justify-between text-sm">
            <span className="text-muted">Zwischensumme</span>
            <PriceDisplay amount={subtotal} className="font-medium" />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Liefergebühr</span>
            <span className="text-xs text-muted">wird berechnet</span>
          </div>

          <Separator />

          <div className="flex justify-between text-base font-bold">
            <span className="text-foreground">Gesamt</span>
            <PriceDisplay amount={subtotal} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <TextField
            value={notes}
            onChange={setNotes}
          >
            <Label>Anmerkungen zur Bestellung</Label>
            <TextArea
              placeholder="Besondere Wünsche oder Hinweise (optional)"
              rows={2}
            />
          </TextField>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="flat"
          size="lg"
          className="flex-1"
          onPress={onBack}
          startContent={<ArrowLeft className="size-4" />}
        >
          Zurück
        </Button>
        <Button
          size="lg"
          className="flex-1 bg-accent text-accent-foreground font-semibold"
          onPress={() => onNext(notes || undefined)}
          endContent={<ArrowRight className="size-4" />}
        >
          Weiter zur Zahlung
        </Button>
      </div>
    </div>
  );
}
