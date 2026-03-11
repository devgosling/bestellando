import { Button } from "@heroui/react";
import { useUserContext } from "../providers/useUserContext";
import { useTheme } from "@repo/hooks";
import { Moon, Sun } from "@gravity-ui/icons";

const Header = () => {
  const { userContext } = useUserContext();
  const loggedIn = userContext !== undefined;
  const { theme, updateTheme } = useTheme();

  const prefersDark = globalThis.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const isDark = theme === "DARK" || (theme === "SYSTEM" && prefersDark);

  return (
    <header className="flex items-center justify-between px-4 py-3 shadow-md w-full bg-[#FF6D00]">
      <a href="/" className="flex items-center">
        <img className="h-8" src="/logo_text.png" alt="Bestellando" />
      </a>
      <nav className="hidden md:flex gap-4 items-center">
        <a
          href="#categories"
          className="text-white no-underline font-medium hover:text-orange-100"
        >
          Kategorien
        </a>
        <a
          href="#restaurants"
          className="text-white no-underline font-medium hover:text-orange-100"
        >
          Restaurants
        </a>
        <a
          href="#how"
          className="text-white no-underline font-medium hover:text-orange-100"
        >
          So funktioniert's
        </a>
        <button
          type="button"
          aria-label="Toggle theme"
          className="p-2 rounded-full text-white hover:bg-white/20 transition-colors"
          onClick={() => updateTheme(isDark ? "LIGHT" : "DARK")}
        >
          {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
        </button>
        <Button variant="bordered" className="text-white border-white">
          {loggedIn ? "Mein Konto" : "Anmelden"}
        </Button>
      </nav>
    </header>
  );
};

export default Header;
