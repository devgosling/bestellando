import { Link, useMatchRoute } from "@tanstack/react-router";
import { Button } from "@heroui/react";
import {
  House,
  ListCheck,
  Book,
  Clock,
  Gear,
  Bars,
  GeoPin,
} from "@gravity-ui/icons";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", label: "Übersicht", icon: House, exact: true },
  { to: "/dashboard/orders", label: "Bestellungen", icon: ListCheck },
  { to: "/dashboard/menu", label: "Speisekarte", icon: Book },
  { to: "/dashboard/opening-hours", label: "Öffnungszeiten", icon: Clock },
  { to: "/dashboard/delivery-zones", label: "Lieferzonen", icon: GeoPin },
  { to: "/dashboard/settings", label: "Einstellungen", icon: Gear },
] as const;

export function DashboardSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const matchRoute = useMatchRoute();

  const isActive = (to: string, exact?: boolean) => {
    return matchRoute({ to, fuzzy: !exact });
  };

  const navContent = (
    <nav className="flex flex-col gap-1 p-3">
      {navItems.map((item) => {
        const active = isActive(item.to, "exact" in item && item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-accent/10 text-accent font-semibold"
                : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            <Icon className="size-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="sticky top-0 z-30 flex items-center border-b border-border bg-background p-2 md:hidden">
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onPress={() => setMobileOpen((o) => !o)}
          aria-label="Menü öffnen"
        >
          <Bars className="size-5" />
        </Button>
        <span className="ml-2 text-sm font-semibold">Dashboard</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-dvh w-60 shrink-0 border-r border-border bg-background transition-transform md:sticky md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center border-b border-border px-4">
          <span className="text-lg font-bold">Dashboard</span>
        </div>
        {navContent}
      </aside>
    </>
  );
}
