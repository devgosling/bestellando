import { useState } from "react";
import { Badge, Button } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useUserContext } from "../providers/useUserContext";
import { ShoppingCart, Bars } from "@gravity-ui/icons";
import { useCartStore } from "../stores/cart-store";
import { CartDrawer } from "../components/cart/CartDrawer";
import { ThemeToggle } from "../components/shared/ThemeToggle";

const Header = () => {
  const { userContext } = useUserContext();
  const loggedIn = userContext !== undefined;
  const isCustomer = userContext?.userRole === "CUSTOMER";
  const totalItems = useCartStore((s) => s.getTotalItems());
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8 py-3 bg-surface border-b border-border">
        {/* Logo */}
        <a
          href="/"
          className="text-xl font-extrabold tracking-tight no-underline"
          style={{ color: "var(--color-primary)" }}
        >
          bestellando
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6">
          <a
            href="/restaurants"
            className="text-sm font-medium text-foreground hover:text-accent transition-colors no-underline"
          >
            Restaurants
          </a>
          <a
            href="#how"
            className="text-sm font-medium text-foreground hover:text-accent transition-colors no-underline"
          >
            So funktioniert's
          </a>

          <ThemeToggle />

          {loggedIn && isCustomer && (
            <Badge
              content={totalItems}
              color="danger"
              size="sm"
              isInvisible={totalItems === 0}
            >
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                aria-label="Warenkorb"
                onPress={() => setCartOpen(true)}
              >
                <ShoppingCart className="size-4" />
              </Button>
            </Badge>
          )}

          {loggedIn ? (
            <Button
              variant="solid"
              size="sm"
              className="bg-accent text-accent-foreground font-semibold"
              onPress={() => navigate({ to: "/profile" })}
            >
              Mein Konto
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-accent text-accent font-semibold"
                onPress={() => navigate({ to: "/auth/login" })}
              >
                Anmelden
              </Button>
              <Button
                variant="solid"
                size="sm"
                className="bg-accent text-accent-foreground font-semibold"
                onPress={() => navigate({ to: "/auth/register/user" })}
              >
                Registrieren
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile controls */}
        <div className="flex lg:hidden items-center gap-2">
          <ThemeToggle />
          {!loggedIn && (
            <Button
              size="sm"
              variant="solid"
              className="bg-accent text-accent-foreground font-semibold"
              onPress={() => navigate({ to: "/auth/login" })}
            >
              Anmelden
            </Button>
          )}
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label="Menü"
            onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden"
          >
            <Bars className="size-5" />
          </Button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-surface border-b border-border px-4 py-3 flex flex-col gap-3">
          <a
            href="/restaurants"
            className="text-sm font-medium text-foreground no-underline"
            onClick={() => setMobileMenuOpen(false)}
          >
            Restaurants
          </a>
          <a
            href="#how"
            className="text-sm font-medium text-foreground no-underline"
            onClick={() => setMobileMenuOpen(false)}
          >
            So funktioniert's
          </a>
          {loggedIn && (
            <a
              href="/profile"
              className="text-sm font-medium text-foreground no-underline"
              onClick={() => setMobileMenuOpen(false)}
            >
              Mein Konto
            </a>
          )}
        </div>
      )}

      {loggedIn && isCustomer && (
        <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      )}
    </>
  );
};

export default Header;
