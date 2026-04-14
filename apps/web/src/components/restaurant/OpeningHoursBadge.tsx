import { Chip } from "@heroui/react";
import type { OpeningHoursEntity } from "@repo/interfaces";

interface OpeningHoursBadgeProps {
  hours?: OpeningHoursEntity[];
  now?: Date;
}

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function isOpenNow(hours: OpeningHoursEntity[], now = new Date()): boolean {
  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return hours.some((h) => {
    if (h.dayOfWeek !== day || h.isClosed) return false;
    const open = toMinutes(h.openTime);
    const close = toMinutes(h.closeTime);
    return open <= minutes && minutes < close;
  });
}

export function OpeningHoursBadge({ hours = [], now }: OpeningHoursBadgeProps) {
  const open = isOpenNow(hours, now);
  return (
    <Chip size="sm" variant="flat" color={open ? "success" : "danger"}>
      {open ? "Ge\u00f6ffnet" : "Geschlossen"}
    </Chip>
  );
}
