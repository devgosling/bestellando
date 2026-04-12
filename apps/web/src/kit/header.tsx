import { useState } from "react";
import { Badge, Button } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useUserContext } from "../providers/useUserContext";
import { ShoppingCart, Bars, Xmark } from "@gravity-ui/icons";
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
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 lg:px-8 h-14 bg-background/80 backdrop-blur-lg border-b border-border">
        {/* Logo */}
        <a
          href="/"
          className="text-lg font-bold tracking-tight no-underline text-accent"
        >
          bestellando
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          <a
            href="/restaurants"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors no-underline px-3 py-2 rounded-lg hover:bg-surface-secondary"
          >
            Restaurants
          </a>
          <a
            href="#how"
            className="text-sm font-medium text-muted hover:text-foreground transition-colors no-underline px-3 py-2 rounded-lg hover:bg-surface-secondary"
          >
            So funktioniert's
          </a>

          <div className="w-px h-5 bg-border mx-2" />

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
              className="bg-accent text-accent-foreground font-medium ml-2"
              onPress={() => navigate({ to: "/profile" })}
            >
              Mein Konto
            </Button>
          ) : (
            <div className="flex gap-2 ml-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground font-medium"
                onPress={() => navigate({ to: "/auth/login" })}
              >
                Anmelden
              </Button>
              <Button
                variant="solid"
                size="sm"
                className="bg-accent text-accent-foreground font-medium"
                onPress={() => navigate({ to: "/auth/register/user" })}
              >
                Registrieren
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile controls */}
        <div className="flex lg:hidden items-center gap-1">
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
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            aria-label="Menü"
            onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <Xmark className="size-5" />
            ) : (
              <Bars className="size-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-background border-b border-border px-4 py-3 flex flex-col gap-1 animate-in slide-in-from-top-2">
          <a
            href="/restaurants"
            className="text-sm font-medium text-foreground no-underline py-2 px-3 rounded-lg hover:bg-surface-secondary"
            onClick={() => setMobileMenuOpen(false)}
          >
            Restaurants
          </a>
          <a
            href="#how"
            className="text-sm font-medium text-foreground no-underline py-2 px-3 rounded-lg hover:bg-surface-secondary"
            onClick={() => setMobileMenuOpen(false)}
          >
            So funktioniert's
          </a>
          {loggedIn ? (
            <a
              href="/profile"
              className="text-sm font-medium text-foreground no-underline py-2 px-3 rounded-lg hover:bg-surface-secondary"
              onClick={() => setMobileMenuOpen(false)}
            >
              Mein Konto
            </a>
          ) : (
            <div className="flex gap-2 pt-2 border-t border-border mt-1">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 font-medium"
                onPress={() => {
                  setMobileMenuOpen(false);
                  navigate({ to: "/auth/login" });
                }}
              >
                Anmelden
              </Button>
              <Button
                variant="solid"
                size="sm"
                className="flex-1 bg-accent text-accent-foreground font-medium"
                onPress={() => {
                  setMobileMenuOpen(false);
                  navigate({ to: "/auth/register/user" });
                }}
              >
                Registrieren
              </Button>
            </div>
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
