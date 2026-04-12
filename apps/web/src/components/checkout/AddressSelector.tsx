import { Select, ListBoxItem, Skeleton } from "@heroui/react";
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
      label="Lieferadresse"
      placeholder="Adresse auswaehlen"
      selectedKeys={selectedId ? [selectedId] : []}
      onSelectionChange={(keys) => {
        const selected = Array.from(keys)[0] as string;
        if (selected) handleSelectionChange(selected);
      }}
      isRequired
    >
      {[
        ...addresses.map((address) => (
          <ListBoxItem key={address.$id}>
            {address.street} {address.streetNumber}, {address.city}
          </ListBoxItem>
        )),
        <ListBoxItem
          key="__add_new__"
          className="text-accent"
        >
          Neue Adresse hinzufuegen
        </ListBoxItem>,
      ]}
    </Select>
  );
}
