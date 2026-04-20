import type { OrderStatus } from "@repo/interfaces";

const statusLabelMap: Record<OrderStatus, string> = {
  PENDING: "Ausstehend",
  CONFIRMED: "Bestätigt",
  PREPARING: "In Zubereitung",
  READY: "Bereit",
  PICKED_UP: "Abgeholt",
  DELIVERED: "Zugestellt",
  CANCELLED: "Storniert",
};

const statusFlow: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "PICKED_UP",
  "DELIVERED",
];

interface HistoryEntry {
  status: OrderStatus;
  $createdAt: string;
}

interface OrderTimelineProps {
  history: HistoryEntry[];
  currentStatus: OrderStatus;
}

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  dateStyle: "short",
  timeStyle: "short",
});

export function OrderTimeline({ history, currentStatus }: OrderTimelineProps) {
  const historyMap = new Map(history.map((h) => [h.status, h]));

  const isCancelled = currentStatus === "CANCELLED";
  const steps = isCancelled ? [...statusFlow, "CANCELLED" as OrderStatus] : statusFlow;

  const currentIndex = steps.indexOf(currentStatus);

  return (
    <div className="flex flex-col gap-0">
      {steps.map((status, index) => {
        const entry = historyMap.get(status);
        const isPast = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={status} className="flex gap-3">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className={`size-3 rounded-full border-2 ${
                  isCurrent
                    ? "border-accent bg-accent"
                    : isPast
                      ? "border-success bg-success"
                      : "border-border bg-surface"
                }`}
              />
              {index < steps.length - 1 && (
                <div
                  className={`w-0.5 flex-1 min-h-8 ${
                    isPast && index < currentIndex
                      ? "bg-success"
                      : "bg-border"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className="pb-6">
              <p
                className={`text-sm font-medium ${
                  isPast ? "text-foreground" : "text-muted"
                }`}
              >
                {statusLabelMap[status]}
              </p>
              {entry && (
                <p className="text-xs text-muted mt-0.5">
                  {dateFormatter.format(new Date(entry.$createdAt))}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
