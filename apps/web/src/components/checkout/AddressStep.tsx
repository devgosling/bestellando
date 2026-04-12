import { Button, Card, CardContent, CardHeader } from "@heroui/react";
import { AddressSelector } from "./AddressSelector";

interface AddressStepProps {
  selectedAddressId: string | null;
  onAddressChange: (id: string) => void;
  onNext: () => void;
}

export function AddressStep({
  selectedAddressId,
  onAddressChange,
  onNext,
}: AddressStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-foreground">
            Lieferadresse
          </h2>
        </CardHeader>
        <CardContent>
          <AddressSelector
            selectedId={selectedAddressId}
            onChange={onAddressChange}
          />
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full bg-accent text-accent-foreground font-semibold"
        isDisabled={!selectedAddressId}
        onPress={onNext}
      >
        Weiter
      </Button>
    </div>
  );
}
