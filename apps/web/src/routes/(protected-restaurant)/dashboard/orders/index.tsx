import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import type { OrderStatus } from "@repo/interfaces";
import { ListCheck } from "@gravity-ui/icons";
import { AnimatedPage } from "../../../../components/shared/AnimatedPage";
import { EmptyState } from "../../../../components/shared/EmptyState";

type FilterTab = "ALL" | OrderStatus;

const tabs: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "Alle" },
  { key: "PENDING", label: "Ausstehend" },
  { key: "CONFIRMED", label: "Bestaetigt" },
  { key: "PREPARING", label: "In Zubereitung" },
  { key: "READY", label: "Bereit" },
];

function OrdersPage() {
  const [_filter, setFilter] = useState<FilterTab>("ALL");

  return (
    <AnimatedPage className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Bestellungen</h1>
        <p className="text-sm text-default-500">
          Eingehende und aktive Bestellungen verwalten
        </p>
      </div>

      <Tabs
        selectedKey={_filter}
        onSelectionChange={(key) => setFilter(key as FilterTab)}
        variant="underlined"
      >
        {tabs.map((tab) => (
          <Tab key={tab.key} title={tab.label} />
        ))}
      </Tabs>

      <EmptyState
        title="Keine Bestellungen"
        description="Bestellungen werden ueber WebSocket empfangen. Echtzeitdaten werden in Phase 5 verfuegbar sein."
        icon={<ListCheck className="size-12" />}
      />
    </AnimatedPage>
  );
}

export const Route = createFileRoute(
  "/(protected-restaurant)/dashboard/orders/",
)({
  component: OrdersPage,
  staticData: { showHeader: true, showFooter: false },
});
