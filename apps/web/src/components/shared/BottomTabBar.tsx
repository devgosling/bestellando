import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Badge, BadgeAnchor } from "@heroui/react";
import {
  House,
  Magnifier,
  ListUl,
  ShoppingCart,
  Person,
  ListCheck,
  Book,
  Gear,
} from "@gravity-ui/icons";
import { useCartStore } from "../../stores/cart-store";
import { useUserContext } from "../../providers/useUserContext";
import type { ComponentType, SVGProps } from "react";

interface Tab {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  path: string;
  showBadge?: boolean;
}

const CUSTOMER_TABS: Tab[] = [
  { icon: House, label: "Home", path: "/" },
  { icon: Magnifier, label: "Suche", path: "/restaurants" },
  { icon: ListUl, label: "Bestellungen", path: "/orders" },
  { icon: ShoppingCart, label: "Warenkorb", path: "/cart", showBadge: true },
  { icon: Person, label: "Profil", path: "/profile" },
];

const RESTAURANT_TABS: Tab[] = [
  { icon: House, label: "Übersicht", path: "/dashboard" },
  { icon: ListCheck, label: "Bestellungen", path: "/dashboard/orders" },
  { icon: Book, label: "Speisekarte", path: "/dashboard/menu" },
  { icon: Gear, label: "Einstellungen", path: "/dashboard/settings" },
];

export function BottomTabBar() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const totalItems = useCartStore((s) => s.getTotalItems());
  const { userContext } = useUserContext();

  if (!userContext) return null;

  const isRestaurant = userContext.userRole === "RESTAURANT";
  const tabs = isRestaurant ? RESTAURANT_TABS : CUSTOMER_TABS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-14 bg-surface border-t border-border lg:hidden">
      {tabs.map((tab) => {
        const isActive =
          tab.path === "/"
            ? currentPath === "/"
            : tab.path === "/dashboard"
              ? currentPath === "/dashboard" || currentPath === "/dashboard/"
              : currentPath.startsWith(tab.path);
        const Icon = tab.icon;

        const button = (
          <button
            key={tab.path}
            type="button"
            onClick={() => navigate({ to: tab.path })}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 transition-colors ${
              isActive ? "text-accent" : "text-muted"
            }`}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );

        if (tab.showBadge && totalItems > 0) {
          return (
            <BadgeAnchor key={tab.path}>
              {button}
              <Badge color="danger" size="sm" placement="top-right">
                {totalItems}
              </Badge>
            </BadgeAnchor>
          );
        }

        return button;
      })}
    </nav>
  );
}
