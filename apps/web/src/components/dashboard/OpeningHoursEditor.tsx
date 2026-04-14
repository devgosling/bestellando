import { Button, Input, TextField } from "@heroui/react";
import { ToggleSwitch } from "../shared/ToggleSwitch";
import { Plus, TrashBin } from "@gravity-ui/icons";
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

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

interface SlotRow {
  openTime: string;
  closeTime: string;
  entityId?: string;
}

interface DayRow {
  dayOfWeek: number;
  isClosed: boolean;
  slots: SlotRow[];
}

interface OpeningHoursEditorProps {
  hours: OpeningHoursEntity[];
  restaurantId: string;
  onSave: (rows: DayRow[]) => void;
  isLoading?: boolean;
}

function buildRows(hours: OpeningHoursEntity[]): DayRow[] {
  return DISPLAY_ORDER.map((day) => {
    const forDay = hours
      .filter((h) => h.dayOfWeek === day)
      .sort((a, b) => a.openTime.localeCompare(b.openTime));
    return {
      dayOfWeek: day,
      isClosed: forDay.length === 0,
      slots: forDay.length
        ? forDay.map((h) => ({
            openTime: h.openTime,
            closeTime: h.closeTime,
            entityId: h.$id,
          }))
        : [{ openTime: "09:00", closeTime: "22:00" }],
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

  const updateSlot = useCallback(
    (dayOfWeek: number, slotIndex: number, update: Partial<SlotRow>) => {
      setRows((prev) =>
        prev.map((r) =>
          r.dayOfWeek !== dayOfWeek
            ? r
            : {
                ...r,
                slots: r.slots.map((s, i) =>
                  i === slotIndex ? { ...s, ...update } : s,
                ),
              },
        ),
      );
    },
    [],
  );

  const addSlot = useCallback((dayOfWeek: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.dayOfWeek !== dayOfWeek
          ? r
          : {
              ...r,
              slots: [...r.slots, { openTime: "12:00", closeTime: "14:00" }],
            },
      ),
    );
  }, []);

  const removeSlot = useCallback((dayOfWeek: number, slotIndex: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.dayOfWeek !== dayOfWeek
          ? r
          : {
              ...r,
              slots:
                r.slots.length === 1
                  ? r.slots
                  : r.slots.filter((_, i) => i !== slotIndex),
            },
      ),
    );
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => (
        <div
          key={row.dayOfWeek}
          className="flex flex-col gap-3 rounded-lg border border-border p-4"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="w-28 shrink-0 font-medium">
              {DAY_NAMES[row.dayOfWeek]}
            </span>

            <ToggleSwitch
              size="sm"
              isSelected={!row.isClosed}
              onChange={(open) => updateRow(row.dayOfWeek, { isClosed: !open })}
              aria-label={`${DAY_NAMES[row.dayOfWeek]} geöffnet`}
            >
              <span className="text-sm">
                {row.isClosed ? "Geschlossen" : "Geöffnet"}
              </span>
            </ToggleSwitch>
          </div>

          {!row.isClosed && (
            <div className="flex flex-col gap-2 pl-0 sm:pl-32">
              {row.slots.map((slot, idx) => (
                <div
                  key={idx}
                  className="flex flex-wrap items-center gap-2"
                >
                  <TextField
                    value={slot.openTime}
                    onChange={(v) =>
                      updateSlot(row.dayOfWeek, idx, { openTime: v })
                    }
                    aria-label="Öffnungszeit"
                  >
                    <Input type="time" size="sm" className="w-32" />
                  </TextField>
                  <span className="text-muted">-</span>
                  <TextField
                    value={slot.closeTime}
                    onChange={(v) =>
                      updateSlot(row.dayOfWeek, idx, { closeTime: v })
                    }
                    aria-label="Schließzeit"
                  >
                    <Input type="time" size="sm" className="w-32" />
                  </TextField>
                  <Button
                    size="sm"
                    variant="light"
                    isIconOnly
                    aria-label="Zeitfenster entfernen"
                    isDisabled={row.slots.length === 1}
                    onPress={() => removeSlot(row.dayOfWeek, idx)}
                  >
                    <TrashBin className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="flat"
                startContent={<Plus className="size-4" />}
                onPress={() => addSlot(row.dayOfWeek)}
                className="self-start"
              >
                Zeitfenster hinzufügen
              </Button>
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-end">
        <Button
          className="bg-accent text-accent-foreground font-semibold"
          onPress={() => onSave(rows)}
          isLoading={isLoading}
        >
          Speichern
        </Button>
      </div>
    </div>
  );
}

export type { DayRow, SlotRow };
