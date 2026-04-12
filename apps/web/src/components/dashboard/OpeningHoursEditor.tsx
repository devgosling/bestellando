import { Button, Input, Switch } from "@heroui/react";
import type { OpeningHoursEntity } from "@repo/interfaces";
import { useState, useEffect, useCallback } from "react";

const DAY_NAMES = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

// Display order: Mon-Sun (1,2,3,4,5,6,0)
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

interface DayRow {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
  entityId?: string;
}

interface OpeningHoursEditorProps {
  hours: OpeningHoursEntity[];
  restaurantId: string;
  onSave: (rows: DayRow[]) => void;
  isLoading?: boolean;
}

function buildRows(hours: OpeningHoursEntity[]): DayRow[] {
  return DISPLAY_ORDER.map((day) => {
    const existing = hours.find((h) => h.dayOfWeek === day);
    return {
      dayOfWeek: day,
      openTime: existing?.openTime ?? "09:00",
      closeTime: existing?.closeTime ?? "22:00",
      isClosed: existing ? false : true,
      entityId: existing?.$id,
    };
  });
}

export function OpeningHoursEditor({
  hours,
  restaurantId: _restaurantId,
  onSave,
  isLoading,
}: OpeningHoursEditorProps) {
  const [rows, setRows] = useState<DayRow[]>(() => buildRows(hours));

  useEffect(() => {
    setRows(buildRows(hours));
  }, [hours]);

  const updateRow = useCallback(
    (dayOfWeek: number, update: Partial<DayRow>) => {
      setRows((prev) =>
        prev.map((r) => (r.dayOfWeek === dayOfWeek ? { ...r, ...update } : r)),
      );
    },
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => (
        <div
          key={row.dayOfWeek}
          className="flex flex-col gap-2 rounded-lg border border-divider p-4 sm:flex-row sm:items-center sm:gap-4"
        >
          <span className="w-28 shrink-0 font-medium">
            {DAY_NAMES[row.dayOfWeek]}
          </span>

          <Switch
            size="sm"
            isSelected={!row.isClosed}
            onValueChange={(open) =>
              updateRow(row.dayOfWeek, { isClosed: !open })
            }
            aria-label={`${DAY_NAMES[row.dayOfWeek]} geoeffnet`}
          >
            <span className="text-sm">
              {row.isClosed ? "Geschlossen" : "Geoeffnet"}
            </span>
          </Switch>

          {!row.isClosed && (
            <div className="flex items-center gap-2">
              <Input
                type="time"
                size="sm"
                value={row.openTime}
                onValueChange={(v) =>
                  updateRow(row.dayOfWeek, { openTime: v })
                }
                aria-label="Oeffnungszeit"
                className="w-32"
              />
              <span className="text-default-400">-</span>
              <Input
                type="time"
                size="sm"
                value={row.closeTime}
                onValueChange={(v) =>
                  updateRow(row.dayOfWeek, { closeTime: v })
                }
                aria-label="Schliesszeit"
                className="w-32"
              />
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-end">
        <Button
          color="primary"
          onPress={() => onSave(rows)}
          isLoading={isLoading}
        >
          Speichern
        </Button>
      </div>
    </div>
  );
}

export type { DayRow };
