import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Badge } from "@heroui/react";
import {
  House,
  Magnifier,
  ListUl,
  ShoppingCart,
  Person,
} from "@gravity-ui/icons";
import { useCartStore } from "../../stores/cart-store";
import { useUserContext } from "../../providers/useUserContext";

const TABS = [
  { icon: House, label: "Home", path: "/" },
  { icon: Magnifier, label: "Suche", path: "/restaurants" },
  { icon: ListUl, label: "Bestellungen", path: "/orders" },
  { icon: ShoppingCart, label: "Warenkorb", path: "/cart", showBadge: true },
  { icon: Person, label: "Profil", path: "/profile" },
] as const;

export function BottomTabBar() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const totalItems = useCartStore((s) => s.getTotalItems());
  const { userContext } = useUserContext();

  if (!userContext) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center h-14 bg-surface border-t border-border lg:hidden">
      {TABS.map((tab) => {
        const isActive =
          tab.path === "/"
            ? currentPath === "/"
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
            <Badge
              key={tab.path}
              content={totalItems}
              color="danger"
              size="sm"
              placement="top-right"
            >
              {button}
            </Badge>
          );
        }

        return button;
      })}
    </nav>
  );
}
