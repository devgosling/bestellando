import {
  Label,
  ListBox,
  ListBoxItem,
  Select,
  SelectPopover,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useApiQuery } from "@repo/hooks";
import type { AddressEntity } from "@repo/interfaces";

interface AddressSelectorProps {
  selectedId: string | null;
  onChange: (id: string) => void;
}

export function AddressSelector({
  selectedId,
  onChange,
}: AddressSelectorProps) {
  const navigate = useNavigate();

  const { data: addresses = [], isLoading } = useApiQuery<AddressEntity[]>({
    request: { url: "/v1/address" },
    queryKey: ["addresses"],
  });

  if (isLoading) {
    return <Skeleton className="h-14 w-full rounded-lg" />;
  }

  const handleSelectionChange = (key: string) => {
    if (key === "__add_new__") {
      navigate({ to: "/profile" });
      return;
    }
    onChange(key);
  };

  return (
    <Select
      placeholder="Adresse auswählen"
      selectedKey={selectedId ?? undefined}
      onSelectionChange={(key) => {
        if (key) handleSelectionChange(String(key));
      }}
      isRequired
    >
      <Label>Lieferadresse</Label>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectPopover>
        <ListBox>
          {addresses.map((address) => (
            <ListBoxItem key={address.$id} id={address.$id}>
              {address.street} {address.streetNumber}, {address.city}
            </ListBoxItem>
          ))}
          <ListBoxItem
            key="__add_new__"
            id="__add_new__"
            className="text-accent"
          >
            Neue Adresse hinzufügen
          </ListBoxItem>
        </ListBox>
      </SelectPopover>
    </Select>
  );
}
