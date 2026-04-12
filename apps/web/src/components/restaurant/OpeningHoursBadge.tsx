import { Chip } from "@heroui/react";

interface OpeningHoursBadgeProps {
  isActive: boolean;
}

export function OpeningHoursBadge({ isActive }: OpeningHoursBadgeProps) {
  return (
    <Chip
      size="sm"
      variant="flat"
      color={isActive ? "success" : "danger"}
    >
      {isActive ? "Ge\u00f6ffnet" : "Geschlossen"}
    </Chip>
  );
}
