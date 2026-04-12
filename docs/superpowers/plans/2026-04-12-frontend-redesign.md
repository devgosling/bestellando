# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the entire Bestellando frontend with a Warm & Inviting design system, HeroUI v3 components, dark mode support, and polished UX across all screens.

**Architecture:** This is a visual redesign of an existing app — all routes, components, and stores already exist. The plan updates the design tokens in `index.css`, then rewrites each component/page to match the new design spec. New components (BottomTabBar, ThemeToggle, CartSidebar, CartBottomBar, CheckoutStepper) are added where the spec requires them.

**Tech Stack:** React 19, HeroUI v3 (3.0.0-beta.8), Tailwind CSS 4 (CSS-first), Framer Motion, TanStack Router, Zustand, Leaflet

**Spec:** `docs/superpowers/specs/2026-04-12-frontend-redesign.md`

**Important context for implementers:**
- HeroUI v3 component names differ from v2: `CardContent` (not CardBody), `ModalDialog` (not ModalContent), `TextArea` (not Textarea), `ListBoxItem` (not SelectItem), `Separator` (not Divider)
- Tailwind v4 uses CSS-first config — all customization is in `apps/web/src/index.css`, no `tailwind.config.*` file exists
- HeroUI v3 is CSS-first — theming is via CSS custom properties, no `HeroUIProvider` wrapper needed
- Icons come from `@gravity-ui/icons` (e.g., `Moon`, `Sun`, `ShoppingCart`, `Magnifier`)
- All UI strings are in German (de-DE)
- The existing `@repo/hooks/useTheme` returns `{ theme: "LIGHT"|"DARK"|"SYSTEM", updateTheme }`
- The existing `@repo/contexts/ThemeProvider` already handles `.dark`/`.light` class on `<html>` and `localStorage` persistence
- API calls use `authenticatedFetch`/`unauthenticatedFetch` from `@repo/lib`, NOT raw `fetch()`
- TanStack Query options via `getQueryOptions`/`getMutationOptions` from `@repo/lib`
- Cart store at `apps/web/src/stores/cart-store.ts` uses Zustand with persist middleware

---

### Task 1: Update Design Tokens

Update the CSS custom properties to match the Warm & Inviting color palette from the spec while keeping the OKLCH format that HeroUI v3 expects.

**Files:**
- Modify: `apps/web/src/index.css`

- [ ] **Step 1: Convert spec hex colors to OKLCH and update light mode tokens**

The spec defines colors in hex. HeroUI v3 themes use OKLCH. Convert and replace in `index.css`. The key change is the accent color from generic orange to the spec's deep orange-red `#E63E11`.

Replace the `:root, .light, .default, [data-theme="light"], [data-theme="default"]` block with:

```css
:root,
.light,
.default,
[data-theme="light"],
[data-theme="default"] {
  /* Warm & Inviting Theme — Light Mode */
  /* Primary: #E63E11 → oklch(52.5% 0.19 30) */
  --accent: oklch(52.5% 0.19 30);
  --accent-foreground: oklch(99.11% 0 0);
  /* Background: #FFF8F0 */
  --background: oklch(97.8% 0.008 60);
  /* Border: #F0E8E0 */
  --border: oklch(93% 0.008 60);
  /* Danger/Error: #D32F2F */
  --danger: oklch(52% 0.19 25);
  --danger-foreground: oklch(99.11% 0 0);
  --default: oklch(94.00% 0.008 60);
  /* Text: #2D2D2D */
  --default-foreground: oklch(25% 0.003 60);
  /* Surface: #FFFFFF */
  --field-background: oklch(100% 0.001 60);
  --field-foreground: oklch(25% 0.003 60);
  /* Muted: #7A7A7A */
  --field-placeholder: oklch(55% 0.004 60);
  --focus: oklch(52.5% 0.19 30);
  --foreground: oklch(25% 0.003 60);
  --muted: oklch(55% 0.004 60);
  --overlay: oklch(100% 0.001 60);
  --overlay-foreground: oklch(25% 0.003 60);
  --scrollbar: oklch(87% 0.004 60);
  --segment: oklch(100% 0.002 60);
  --segment-foreground: oklch(25% 0.003 60);
  --separator: oklch(93% 0.006 60);
  /* Success: #2E7D32 */
  --success: oklch(52% 0.14 145);
  --success-foreground: oklch(99% 0 0);
  --surface: oklch(100% 0.001 60);
  --surface-foreground: oklch(25% 0.003 60);
  /* Surface secondary: slightly warm off-white */
  --surface-secondary: oklch(96% 0.006 60);
  --surface-secondary-foreground: oklch(25% 0.003 60);
  --surface-tertiary: oklch(94.5% 0.006 60);
  --surface-tertiary-foreground: oklch(25% 0.003 60);
  /* Warning: #F9A825 */
  --warning: oklch(78% 0.16 80);
  --warning-foreground: oklch(25% 0.005 80);

  /* Border Radius */
  --radius: 0.75rem;
  --field-radius: 0.5rem;

  /* Font Family */
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;

  /* Custom tokens for the design spec */
  --color-primary: #E63E11;
  --color-secondary: #FF8B5A;
  --color-primary-hover: #CC3510;
}
```

- [ ] **Step 2: Update dark mode tokens**

Replace the `.dark, [data-theme="dark"]` block with:

```css
.dark,
[data-theme="dark"] {
  color-scheme: dark;
  /* Warm & Inviting Theme — Dark Mode */
  /* Primary: #FF6B3A (lighter for contrast on dark bg) */
  --accent: oklch(65% 0.18 35);
  --accent-foreground: oklch(99.11% 0 0);
  /* Background: #121212 */
  --background: oklch(14% 0.003 60);
  /* Border: #2A2A2A */
  --border: oklch(25% 0.003 60);
  /* Danger: #EF5350 */
  --danger: oklch(60% 0.19 20);
  --danger-foreground: oklch(99.11% 0 0);
  --default: oklch(27% 0.003 60);
  --default-foreground: oklch(99.11% 0 0);
  /* Surface: #1E1E1E */
  --field-background: oklch(22% 0.004 60);
  --field-foreground: oklch(96% 0.003 60);
  --field-placeholder: oklch(62% 0.004 60);
  --focus: oklch(65% 0.18 35);
  /* Text: #F5F0EB */
  --foreground: oklch(96% 0.006 60);
  --muted: oklch(62% 0.004 60);
  --overlay: oklch(22% 0.004 60);
  --overlay-foreground: oklch(96% 0.003 60);
  --scrollbar: oklch(50% 0.003 60);
  --segment: oklch(33% 0.003 60);
  --segment-foreground: oklch(96% 0.003 60);
  --separator: oklch(25% 0.003 60);
  /* Success: #4CAF50 */
  --success: oklch(62% 0.14 145);
  --success-foreground: oklch(99% 0 0);
  --surface: oklch(22% 0.004 60);
  --surface-foreground: oklch(96% 0.003 60);
  --surface-secondary: oklch(25% 0.004 60);
  --surface-secondary-foreground: oklch(96% 0.003 60);
  --surface-tertiary: oklch(27% 0.004 60);
  --surface-tertiary-foreground: oklch(96% 0.003 60);
  /* Warning: #FFD54F */
  --warning: oklch(85% 0.13 85);
  --warning-foreground: oklch(25% 0.005 85);

  /* Custom tokens for the design spec */
  --color-primary: #FF6B3A;
  --color-secondary: #FF9B6E;
  --color-primary-hover: #E65A2A;
}
```

- [ ] **Step 3: Verify the theme compiles**

Run: `pnpm dev --filter=web`
Expected: App starts without CSS errors. Colors should look warmer and more orange-red than before.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/index.css
git commit -m "style: update design tokens to Warm & Inviting palette with light/dark OKLCH values"
```

---

### Task 2: Create ThemeToggle Component

A sun/moon animated toggle button for the header and profile page.

**Files:**
- Create: `apps/web/src/components/shared/ThemeToggle.tsx`

- [ ] **Step 1: Create the ThemeToggle component**

```tsx
import { Button } from "@heroui/react";
import { Moon, Sun } from "@gravity-ui/icons";
import { useTheme } from "@repo/hooks";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, updateTheme } = useTheme();
  const prefersDark = globalThis.matchMedia(
    "(prefers-color-scheme: dark)",
  ).matches;
  const isDark = theme === "DARK" || (theme === "SYSTEM" && prefersDark);

  return (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      aria-label={isDark ? "Zum hellen Modus wechseln" : "Zum dunklen Modus wechseln"}
      className={className}
      onPress={() => updateTheme(isDark ? "LIGHT" : "DARK", true)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Moon className="size-4" />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Sun className="size-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
```

- [ ] **Step 2: Verify it renders**

Import and render `<ThemeToggle />` temporarily in any page, confirm the icon toggles between sun and moon with animation.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/shared/ThemeToggle.tsx
git commit -m "feat: add ThemeToggle component with animated sun/moon icon"
```

---

### Task 3: Create BottomTabBar Component

Mobile-only fixed bottom navigation bar with 5 tabs.

**Files:**
- Create: `apps/web/src/components/shared/BottomTabBar.tsx`

- [ ] **Step 1: Create the BottomTabBar component**

```tsx
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
```

- [ ] **Step 2: Verify it renders**

Temporarily import into `__root.tsx` to see it on mobile viewport. Confirm 5 icons, active state highlighting, cart badge.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/shared/BottomTabBar.tsx
git commit -m "feat: add BottomTabBar component for mobile navigation"
```

---

### Task 4: Redesign Header

Replace the current orange-bar header with the Warm & Inviting design: logo in brand color, clean nav, theme toggle, responsive behavior.

**Files:**
- Modify: `apps/web/src/kit/header.tsx`

- [ ] **Step 1: Rewrite the header component**

Replace the entire contents of `apps/web/src/kit/header.tsx` with:

```tsx
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
          className="text-xl font-extrabold tracking-tight"
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
```

- [ ] **Step 2: Check Bars icon exists in @gravity-ui/icons**

Run: `node -e "const g = require('@gravity-ui/icons'); console.log('Bars' in g, 'ListUl' in g, 'Bars3' in g)"` in `apps/web`.

If `Bars` doesn't exist, use `ListUl` or another hamburger-like icon and update the import.

- [ ] **Step 3: Verify visually**

Run `pnpm dev --filter=web`. Check:
- Logo renders in brand orange-red
- Nav links are visible on desktop
- Theme toggle works
- Cart badge shows when logged in as customer
- Mobile: hamburger menu opens/closes
- Background is `bg-surface` (warm cream light, dark surface dark)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/kit/header.tsx
git commit -m "style: redesign header with Warm & Inviting theme, theme toggle, mobile menu"
```

---

### Task 5: Integrate BottomTabBar into Root Layout

Add the bottom tab bar to the root layout and add padding to prevent content overlap.

**Files:**
- Modify: `apps/web/src/routes/__root.tsx`

- [ ] **Step 1: Read current __root.tsx**

Read `apps/web/src/routes/__root.tsx` to understand the current layout structure.

- [ ] **Step 2: Add BottomTabBar to the layout**

Import and render `<BottomTabBar />` after the `<Outlet />` in the root layout component. Also add `pb-14 lg:pb-0` to the main content wrapper to prevent the bottom tab bar from covering content on mobile.

The key changes to the layout component:
```tsx
import { BottomTabBar } from "../components/shared/BottomTabBar";

// In the layout JSX, after Outlet:
<main className="flex-1 pb-14 lg:pb-0">
  <Outlet />
</main>
<BottomTabBar />
```

- [ ] **Step 3: Verify**

Check that the bottom tab bar appears on mobile viewports (<1024px) and is hidden on desktop. Verify page content doesn't get hidden behind it.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/__root.tsx
git commit -m "feat: integrate BottomTabBar into root layout with mobile padding"
```

---

### Task 6: Redesign Landing Page

Replace the current full-screen hero landing with the compact header + immediate content layout.

**Files:**
- Modify: `apps/web/src/routes/index.tsx`

- [ ] **Step 1: Rewrite the landing page**

Replace the entire contents of `apps/web/src/routes/index.tsx` with:

```tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, Chip, Input } from "@heroui/react";
import { Magnifier, StarFill, Clock } from "@gravity-ui/icons";
import { AnimatedPage } from "../components/shared/AnimatedPage";

const CATEGORIES = [
  { emoji: "🍕", name: "Pizza" },
  { emoji: "🍔", name: "Burger" },
  { emoji: "🍣", name: "Sushi" },
  { emoji: "🥙", name: "Döner" },
  { emoji: "🍜", name: "Asiatisch" },
  { emoji: "🥗", name: "Salat" },
  { emoji: "🌮", name: "Mexikanisch" },
  { emoji: "🍛", name: "Indisch" },
];

const RESTAURANTS = [
  {
    name: "Pizza Napoli",
    emoji: "🍕",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    rating: 4.7,
    time: "25-35",
    min: "12,00",
    tag: "Italienisch",
  },
  {
    name: "Burger Meister",
    emoji: "🍔",
    bg: "bg-green-50 dark:bg-green-950/30",
    rating: 4.5,
    time: "20-30",
    min: "10,00",
    tag: "Amerikanisch",
  },
  {
    name: "Sushi Garden",
    emoji: "🍣",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    rating: 4.9,
    time: "30-45",
    min: "15,00",
    tag: "Japanisch",
  },
  {
    name: "Döner König",
    emoji: "🥙",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    rating: 4.4,
    time: "15-25",
    min: "8,00",
    tag: "Türkisch",
  },
  {
    name: "Wok Express",
    emoji: "🍜",
    bg: "bg-red-50 dark:bg-red-950/30",
    rating: 4.6,
    time: "25-35",
    min: "12,00",
    tag: "Asiatisch",
  },
  {
    name: "Pasta Palace",
    emoji: "🍝",
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    rating: 4.7,
    time: "25-35",
    min: "11,00",
    tag: "Italienisch",
  },
];

const STEPS = [
  {
    emoji: "📍",
    title: "Adresse eingeben",
    desc: "Finde Restaurants in deiner Nähe",
  },
  {
    emoji: "🍽️",
    title: "Gerichte wählen",
    desc: "Stöbere durch die Speisekarten",
  },
  {
    emoji: "🚀",
    title: "Liefern lassen",
    desc: "Frisch und schnell an deine Tür",
  },
];

const Page = () => {
  const navigate = useNavigate();

  return (
    <AnimatedPage>
      <div className="bg-background text-foreground min-h-screen">
        {/* Compact Hero */}
        <section className="px-4 lg:px-8 py-8 lg:py-12 max-w-[1280px] mx-auto">
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground mt-0 mb-2 leading-tight">
                Hunger? Bestell dir was Gutes.
              </h1>
              <p className="text-muted text-sm lg:text-base mt-0 mb-4">
                Entdecke die besten Restaurants in deiner Nähe
              </p>
              <div className="flex rounded-xl overflow-hidden shadow-md border border-border max-w-[480px]">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Deine Adresse eingeben..."
                    variant="flat"
                    radius="none"
                    classNames={{
                      inputWrapper: "bg-surface shadow-none border-none h-12",
                      input: "text-sm",
                    }}
                  />
                </div>
                <Button
                  radius="none"
                  className="h-12 px-6 bg-accent text-accent-foreground font-semibold shrink-0"
                  startContent={<Magnifier className="size-4" />}
                >
                  Suchen
                </Button>
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center w-28 h-28 rounded-2xl text-6xl"
              style={{ background: "linear-gradient(135deg, var(--color-secondary), var(--color-primary))" }}
            >
              🍕
            </div>
          </div>
        </section>

        {/* Category Chips */}
        <section className="px-4 lg:px-8 pb-6 max-w-[1280px] mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((c) => (
              <Chip
                key={c.name}
                variant="outline"
                className="cursor-pointer shrink-0 hover:bg-accent hover:text-accent-foreground transition-colors"
                onClose={undefined}
              >
                <span className="mr-1">{c.emoji}</span>
                {c.name}
              </Chip>
            ))}
          </div>
        </section>

        {/* Restaurant Grid */}
        <section className="px-4 lg:px-8 pb-12 max-w-[1280px] mx-auto">
          <h2 className="text-2xl font-bold mt-0 mb-4">Beliebt in deiner Nähe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESTAURANTS.map((r) => (
              <div
                key={r.name}
                className="rounded-xl overflow-hidden shadow-sm border border-border bg-surface cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg"
                onClick={() => navigate({ to: "/restaurants" })}
              >
                <div
                  className={`h-24 flex items-center justify-center text-4xl ${r.bg}`}
                >
                  {r.emoji}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-foreground mt-0 mb-1">
                    {r.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <span className="flex items-center gap-0.5 font-semibold text-accent">
                      <StarFill className="size-3" /> {r.rating}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="size-3" /> {r.time} min
                    </span>
                  </div>
                  <Chip size="sm" variant="flat" className="mt-2 text-[10px]">
                    Min. {r.min} €
                  </Chip>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="px-4 lg:px-8 py-12 bg-accent/5">
          <div className="max-w-[1280px] mx-auto">
            <h2 className="text-2xl font-bold text-center mt-0 mb-8">
              So funktioniert's
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] mx-auto">
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-3 p-6 rounded-xl bg-surface border border-border text-center"
                >
                  <div className="text-4xl">{s.emoji}</div>
                  <h3 className="text-base font-bold text-foreground m-0">
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted m-0">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AnimatedPage>
  );
};

export const Route = createFileRoute("/")({
  component: Page,
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});
```

- [ ] **Step 2: Verify visually**

Run `pnpm dev --filter=web`. Check:
- Compact hero (not full viewport)
- Search bar with "Suchen" button
- Category chips scroll horizontally
- Restaurant cards in 3-column grid on desktop
- Cards have hover lift effect
- "So funktioniert's" section at bottom
- Toggle dark mode — all elements should adapt
- On mobile: single column, bottom tab bar visible

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/index.tsx
git commit -m "style: redesign landing page — compact hero, category chips, warm restaurant cards"
```

---

### Task 7: Redesign Restaurant Card Component

Update the shared restaurant card used in browsing grids.

**Files:**
- Modify: `apps/web/src/components/restaurant/RestaurantCard.tsx`

- [ ] **Step 1: Read the current RestaurantCard**

Read `apps/web/src/components/restaurant/RestaurantCard.tsx` to understand its current props and usage.

- [ ] **Step 2: Rewrite RestaurantCard with new design**

Update the component to use the Warm & Inviting style:
- Rounded corners (`rounded-xl`)
- Surface background with border
- Hover lift effect (`hover:-translate-y-0.5 hover:shadow-lg transition-all duration-150`)
- Rating in accent color with `StarFill` icon
- Delivery time with `Clock` icon
- Minimum order as a small `Chip`
- Open/closed status via `OpeningHoursBadge`

Use these HeroUI components: `Card`, `CardContent`, `Chip`.

- [ ] **Step 3: Verify in the restaurants browsing page**

Navigate to `/restaurants`, confirm cards render with the new design in both light and dark mode.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/restaurant/RestaurantCard.tsx
git commit -m "style: redesign RestaurantCard with warm theme, hover lift, accent ratings"
```

---

### Task 8: Redesign Restaurant Browsing Page

Update the restaurants index page with filter bar and new card grid.

**Files:**
- Modify: `apps/web/src/routes/(protected-customer)/restaurants/index.tsx`
- Modify: `apps/web/src/components/restaurant/RestaurantFilters.tsx`

- [ ] **Step 1: Read current files**

Read both files to understand current structure.

- [ ] **Step 2: Update RestaurantFilters**

Redesign the filter bar:
- `SearchInput` for name search (already has debounce)
- `Select` with `ListBoxItem` for cuisine type
- `Chip` group for quick filters: "Geöffnet", "Kostenlose Lieferung", "Beste Bewertung"
- Sort `Select`: "Empfohlen", "Lieferzeit", "Bewertung", "Mindestbestellwert"
- Wrap in a flex row with gap-3, wrap on mobile

- [ ] **Step 3: Update restaurants/index.tsx**

Update the page layout:
- Wrap in `AnimatedPage`
- Section heading "Restaurants"
- `RestaurantFilters` at top
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`
- Use `RestaurantCard` for each restaurant
- Loading state: `LoadingSkeleton type="card" count={6}`
- Empty state: `EmptyState` with "Keine Restaurants gefunden"
- Max width: `max-w-[1280px] mx-auto`

- [ ] **Step 4: Verify and commit**

```bash
git add apps/web/src/routes/\(protected-customer\)/restaurants/index.tsx apps/web/src/components/restaurant/RestaurantFilters.tsx
git commit -m "style: redesign restaurant browsing page with filter bar and card grid"
```

---

### Task 9: Redesign Restaurant Detail Page (Split View)

The most complex page — split view with menu on left, cart on right (desktop), stacked on mobile.

**Files:**
- Modify: `apps/web/src/routes/(protected-customer)/restaurants/$restaurantId.tsx`
- Modify: `apps/web/src/components/restaurant/RestaurantHero.tsx`
- Modify: `apps/web/src/components/restaurant/MenuSection.tsx`
- Modify: `apps/web/src/components/restaurant/ProductCard.tsx`
- Modify: `apps/web/src/components/restaurant/ProductModal.tsx`
- Create: `apps/web/src/components/cart/CartSidebar.tsx`
- Create: `apps/web/src/components/cart/CartBottomBar.tsx`

- [ ] **Step 1: Read all current files**

Read the restaurant detail route and all restaurant/cart components listed above.

- [ ] **Step 2: Create CartSidebar (desktop)**

Create `apps/web/src/components/cart/CartSidebar.tsx`:

```tsx
import { Button, Separator } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useCartStore, type CartItem as CartItemType } from "../../stores/cart-store";
import { CartItem } from "./CartItem";
import { CartEmpty } from "./CartEmpty";
import { PriceDisplay } from "../shared/PriceDisplay";

export function CartSidebar({ deliveryFee = 2.5 }: { deliveryFee?: number }) {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-base font-bold text-foreground mb-3">🛒 Warenkorb</h3>
        <CartEmpty />
      </div>
    );
  }

  const total = subtotal + deliveryFee;

  return (
    <div className="p-4 flex flex-col h-full">
      <h3 className="text-base font-bold text-foreground mb-3">🛒 Warenkorb</h3>
      <div className="flex-1 overflow-y-auto space-y-1">
        {items.map((item) => (
          <CartItem key={item.product.$id} item={item} compact />
        ))}
      </div>
      <Separator className="my-3" />
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-muted">
          <span>Zwischensumme</span>
          <PriceDisplay amount={subtotal} />
        </div>
        <div className="flex justify-between text-muted">
          <span>Liefergebühr</span>
          <PriceDisplay amount={deliveryFee} />
        </div>
        <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t-2 border-foreground">
          <span>Gesamt</span>
          <PriceDisplay amount={total} />
        </div>
      </div>
      <Button
        className="mt-3 w-full bg-accent text-accent-foreground font-semibold"
        onPress={() => navigate({ to: "/checkout" })}
      >
        Zur Kasse →
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Create CartBottomBar (mobile)**

Create `apps/web/src/components/cart/CartBottomBar.tsx`:

```tsx
import { Badge, Button } from "@heroui/react";
import { useNavigate } from "@tanstack/react-router";
import { useCartStore } from "../../stores/cart-store";
import { PriceDisplay } from "../shared/PriceDisplay";
import { motion, AnimatePresence } from "framer-motion";

export function CartBottomBar() {
  const totalItems = useCartStore((s) => s.getTotalItems());
  const subtotal = useCartStore((s) => s.getSubtotal());
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-14 left-0 right-0 z-40 lg:hidden px-3 pb-2"
        >
          <div className="flex items-center justify-between bg-accent text-accent-foreground rounded-xl px-4 py-3 shadow-lg">
            <div className="flex items-center gap-2">
              <Badge content={totalItems} size="sm" color="default">
                <span className="text-lg">🛒</span>
              </Badge>
              <span className="font-semibold text-sm">
                <PriceDisplay amount={subtotal} />
              </span>
            </div>
            <Button
              size="sm"
              variant="solid"
              className="bg-white text-accent font-bold"
              onPress={() => navigate({ to: "/checkout" })}
            >
              Zur Kasse →
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Update RestaurantHero**

Rewrite `RestaurantHero.tsx` with gradient banner:
- Background: `linear-gradient(135deg, var(--color-secondary), var(--color-primary))`
- White text: restaurant name (h2, bold), rating with stars + count, delivery time, min order
- Open/closed `Chip` in top-right
- Collapsible height on mobile with the banner info

- [ ] **Step 5: Update ProductCard (menu item row)**

Rewrite `ProductCard.tsx`:
- Flex row layout
- Left: name (font-semibold, foreground), description (text-xs, text-muted, line-clamp-1)
- Right: price (font-bold, text-accent), "+" button (rounded-full, bg-accent, size 7, text-accent-foreground)
- Bottom border between items (`border-b border-border last:border-b-0`)

- [ ] **Step 6: Update ProductModal (item detail)**

Rewrite `ProductModal.tsx`:
- `Modal` + `ModalDialog` + `ModalHeader` + `ModalBody` + `ModalFooter`
- Product name, full description
- Quantity picker using `NumberField` or custom +/- buttons
- Special instructions `TextArea`
- "In den Warenkorb" primary `Button` with total price

- [ ] **Step 7: Update MenuSection**

Update `MenuSection.tsx`:
- Section heading (font-bold, text-foreground)
- List of `ProductCard` components
- No extra padding between cards (border handles separation)

- [ ] **Step 8: Rewrite the restaurant detail route**

Rewrite `apps/web/src/routes/(protected-customer)/restaurants/$restaurantId.tsx`:

The layout should be:
```tsx
<AnimatedPage>
  <div className="max-w-[1280px] mx-auto">
    <RestaurantHero restaurant={restaurant} />
    <div className="flex">
      {/* Menu area */}
      <div className="flex-1 lg:w-[60%]">
        {/* Category tabs - desktop */}
        <div className="sticky top-[57px] z-10 bg-surface border-b border-border hidden lg:block">
          <TabList>...</TabList>
        </div>
        {/* Category chips - mobile */}
        <div className="lg:hidden overflow-x-auto flex gap-2 p-3 sticky top-[57px] z-10 bg-surface border-b border-border">
          {categories.map(c => <Chip key={c} .../>)}
        </div>
        {/* Menu sections */}
        {sections.map(section => <MenuSection key={section.name} ... />)}
      </div>
      {/* Cart sidebar - desktop only */}
      <div className="hidden lg:block w-[40%] border-l border-border sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
        <CartSidebar deliveryFee={restaurant.deliveryFee} />
      </div>
    </div>
    {/* Cart bottom bar - mobile only */}
    <CartBottomBar />
  </div>
</AnimatedPage>
```

- [ ] **Step 9: Verify visually**

Check:
- Desktop: split view with menu left, cart right (sticky)
- Mobile: stacked menu, bottom cart bar appears when items added
- Category tabs/chips navigate menu sections
- Product modal opens on item tap
- Cart updates correctly
- Dark mode works throughout

- [ ] **Step 10: Commit**

```bash
git add apps/web/src/components/cart/CartSidebar.tsx apps/web/src/components/cart/CartBottomBar.tsx apps/web/src/components/restaurant/ apps/web/src/routes/\(protected-customer\)/restaurants/\$restaurantId.tsx
git commit -m "style: redesign restaurant detail with split view, cart sidebar, warm theme"
```

---

### Task 10: Update Cart Store with Confirmation Dialog

Replace silent cart clearing with an `AlertDialog` when switching restaurants.

**Files:**
- Modify: `apps/web/src/stores/cart-store.ts`
- Modify: `apps/web/src/components/restaurant/ProductModal.tsx` (or wherever addItem is called)

- [ ] **Step 1: Add a `pendingItem` state to the cart store**

Add to the cart store interface and implementation:

```ts
// New state
pendingItem: { product: ProductEntity; quantity: number; instructions?: string } | null;

// New actions
setPendingItem: (product: ProductEntity, quantity: number, instructions?: string) => void;
confirmPendingItem: () => void;
cancelPendingItem: () => void;
```

In `addItem`, instead of silently clearing, set `pendingItem` and return early. The calling component checks `pendingItem` and shows a confirmation dialog.

- [ ] **Step 2: Add ConfirmDialog to the product interaction**

In `ProductModal.tsx` (or a wrapper), when `pendingItem` is set, show `ConfirmDialog`:
- Title: "Restaurant wechseln?"
- Description: "Du hast bereits Artikel von {currentRestaurantName} im Warenkorb. Warenkorb leeren und bei {newRestaurantName} bestellen?"
- Confirm: "Leeren & hinzufügen" → calls `confirmPendingItem()`
- Cancel: "Abbrechen" → calls `cancelPendingItem()`

- [ ] **Step 3: Verify**

Add item from restaurant A, then try to add from restaurant B. Confirm dialog appears. Test both confirm and cancel flows.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/stores/cart-store.ts apps/web/src/components/restaurant/ProductModal.tsx
git commit -m "feat: add confirmation dialog when switching restaurants in cart"
```

---

### Task 11: Redesign Cart Components

Update CartDrawer, CartItem, CartSummary, CartEmpty with new design.

**Files:**
- Modify: `apps/web/src/components/cart/CartDrawer.tsx`
- Modify: `apps/web/src/components/cart/CartItem.tsx`
- Modify: `apps/web/src/components/cart/CartSummary.tsx`
- Modify: `apps/web/src/components/cart/CartEmpty.tsx`

- [ ] **Step 1: Read all current cart components**

Read all four files.

- [ ] **Step 2: Update CartEmpty**

Simple centered `EmptyState` with cart icon, "Dein Warenkorb ist leer", "Füge Gerichte von einem Restaurant hinzu" description.

- [ ] **Step 3: Update CartItem**

Redesign each cart item row:
- Quantity badge: `bg-accent/10 text-accent font-bold text-xs px-2 py-0.5 rounded`
- Product name (text-sm, foreground)
- Price (text-sm, font-semibold)
- +/- quantity buttons (small, ghost variant)
- Remove button (ghost, danger color, small X icon)
- Accept optional `compact` prop that hides +/- and remove for sidebar view

- [ ] **Step 4: Update CartSummary**

Redesign totals display:
- Subtotal row (text-sm, text-muted)
- Delivery fee row (text-sm, text-muted)
- `Separator`
- Total row (text-base, font-bold, text-foreground)
- All using `PriceDisplay` for EUR formatting

- [ ] **Step 5: Update CartDrawer**

Redesign the slide-over drawer:
- Use `Modal` with `ModalDialog` positioned right (or a custom slide-in panel with Framer Motion)
- Header: "Warenkorb" with close button
- Body: list of `CartItem` components
- Footer: `CartSummary` + "Zur Kasse →" `Button`
- When empty: `CartEmpty`

- [ ] **Step 6: Verify and commit**

```bash
git add apps/web/src/components/cart/
git commit -m "style: redesign cart components — drawer, items, summary with warm theme"
```

---

### Task 12: Redesign Checkout Page (Multi-Step Wizard)

Replace the current single-form checkout with a 3-step wizard.

**Files:**
- Create: `apps/web/src/components/checkout/CheckoutStepper.tsx`
- Create: `apps/web/src/components/checkout/AddressStep.tsx`
- Create: `apps/web/src/components/checkout/ReviewStep.tsx`
- Create: `apps/web/src/components/checkout/PaymentStep.tsx`
- Modify: `apps/web/src/routes/(protected-customer)/checkout.tsx`
- Modify: `apps/web/src/components/checkout/OrderConfirmation.tsx`
- Modify: `apps/web/src/components/checkout/AddressSelector.tsx`

- [ ] **Step 1: Create CheckoutStepper**

```tsx
import { Chip } from "@heroui/react";

const STEPS = [
  { number: 1, label: "Adresse" },
  { number: 2, label: "Überprüfen" },
  { number: 3, label: "Bezahlen" },
];

export function CheckoutStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {STEPS.map((step, i) => (
        <div key={step.number} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step.number < currentStep
                ? "bg-success text-success-foreground"
                : step.number === currentStep
                  ? "bg-accent text-accent-foreground"
                  : "bg-default text-muted"
            }`}
          >
            {step.number < currentStep ? "✓" : step.number}
          </div>
          <span
            className={`text-xs font-medium ${
              step.number === currentStep ? "text-accent" : step.number < currentStep ? "text-success" : "text-muted"
            }`}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`w-12 h-0.5 ${
                step.number < currentStep ? "bg-success" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create AddressStep**

Step 1 of checkout — saved address selection:
- List of saved addresses as selectable `Card` components
- Selected card: `border-2 border-accent`
- Unselected: `border border-border opacity-60`
- "Neue Adresse hinzufügen" outline button
- "Weiter" primary button (disabled until address selected)

- [ ] **Step 3: Create ReviewStep**

Step 2 — order review:
- Order summary in a `Card`: item list, separator, subtotal, delivery fee, total
- `TextArea` for "Anmerkungen"
- "← Zurück" outline button + "Weiter zur Zahlung →" primary button

- [ ] **Step 4: Create PaymentStep**

Step 3 — Stripe redirect:
- Show `Spinner` + "Weiterleitung zu Stripe..."
- Auto-trigger Stripe checkout session creation on mount
- On success: redirect to Stripe
- On error: show `Alert` with retry

- [ ] **Step 5: Update OrderConfirmation**

Redesign the success page:
- Green checkmark circle (large, animated scale-in)
- "Bestellung bestätigt!" heading
- Order number, estimated delivery time
- "Bestellung verfolgen" primary `Button`
- "Zurück zur Startseite" `Link`
- Optional: confetti animation (canvas-confetti package or simple CSS animation)

- [ ] **Step 6: Rewrite checkout route**

Update `apps/web/src/routes/(protected-customer)/checkout.tsx`:
- State: `currentStep` (1, 2, 3)
- Render `CheckoutStepper` at top
- Conditionally render `AddressStep`, `ReviewStep`, or `PaymentStep`
- On step 3 completion → show `OrderConfirmation`
- Wrap in `AnimatedPage`

- [ ] **Step 7: Verify full checkout flow**

Test: Cart → Checkout → Step 1 (select address) → Step 2 (review) → Step 3 (Stripe redirect) → Confirmation. Verify dark mode throughout.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/components/checkout/ apps/web/src/routes/\(protected-customer\)/checkout.tsx
git commit -m "style: redesign checkout as 3-step wizard with stepper, warm theme"
```

---

### Task 13: Redesign Order Tracking Page

**Files:**
- Modify: `apps/web/src/routes/(protected-customer)/orders/$orderId.tsx`
- Modify: `apps/web/src/components/order/OrderTimeline.tsx`
- Modify: `apps/web/src/components/order/OrderStatusBadge.tsx`
- Modify: `apps/web/src/components/order/DeliveryMap.tsx`

- [ ] **Step 1: Read all current files**

- [ ] **Step 2: Redesign OrderStatusBadge → OrderStatusChip**

Rename to `OrderStatusChip.tsx`. Use HeroUI `Chip` with color based on status:
- `PENDING` → warning color
- `CONFIRMED`, `PREPARING` → accent/primary
- `READY`, `PICKED_UP` → secondary
- `DELIVERED` → success
- `CANCELLED`, `REJECTED` → danger

- [ ] **Step 3: Redesign OrderTimeline**

Custom vertical stepper:
- 4 steps: Bestätigt → In Zubereitung → Unterwegs → Geliefert
- Each step: 24px circle (success=done, accent=active, default=pending) + title + timestamp + description
- Connecting lines: 2px wide, success color for done segments, border color for pending
- Active step: subtle pulse animation via `@keyframes pulse` or Framer Motion

- [ ] **Step 4: Update DeliveryMap**

Ensure the Leaflet map uses warm-toned tiles or standard tiles with the correct markers. The `MapBase` component should already handle this. Add "Verbindung verloren" overlay when GPS is stale (>60s).

- [ ] **Step 5: Rewrite the order tracking route**

Layout:
- Header bar: order number + `OrderStatusChip`
- `OrderTimeline`
- `DeliveryMap` (conditionally, when driver is assigned)
- `Disclosure` for order details (items, totals, address)
- Wrap in `AnimatedPage`

- [ ] **Step 6: Verify and commit**

```bash
git add apps/web/src/routes/\(protected-customer\)/orders/\$orderId.tsx apps/web/src/components/order/
git commit -m "style: redesign order tracking with timeline, status chips, warm theme"
```

---

### Task 14: Redesign Order History Page

**Files:**
- Modify: `apps/web/src/routes/(protected-customer)/orders/index.tsx`
- Modify: `apps/web/src/components/order/OrderCard.tsx`

- [ ] **Step 1: Read current files**

- [ ] **Step 2: Redesign OrderCard**

Each order as a `Card`:
- Header: order number (font-semibold) + date (text-xs, text-muted)
- Body: restaurant name, item count summary
- Footer: total (`PriceDisplay`, font-bold) + `OrderStatusChip`
- Click navigates to `/orders/$orderId`
- Warm surface bg, border, hover lift

- [ ] **Step 3: Update orders index page**

- Heading: "Meine Bestellungen"
- List of `OrderCard` components
- Loading: `LoadingSkeleton type="card" count={4}`
- Empty: `EmptyState` title="Noch keine Bestellungen" description="Bestelle etwas Leckeres!"
- `AnimatedPage` wrapper

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/\(protected-customer\)/orders/index.tsx apps/web/src/components/order/OrderCard.tsx
git commit -m "style: redesign order history page with warm order cards"
```

---

### Task 15: Redesign Profile Page

**Files:**
- Modify: `apps/web/src/routes/(protected-customer)/profile/index.tsx`

- [ ] **Step 1: Read current file**

- [ ] **Step 2: Redesign profile page**

Layout:
- `AnimatedPage` wrapper
- User info `Card`: `Avatar` + name + email (read-only)
- **Adressen** section: list of address `Card` items with edit/delete buttons, "Als Standard setzen" action, "Neue Adresse" outline button
- **Darstellung** section: `Switch` for dark mode with "Dunkler Modus" label
- **Abmelden** section: danger `Button` "Abmelden" with `ConfirmDialog` confirmation
- Max width 640px centered

- [ ] **Step 3: Verify and commit**

```bash
git add apps/web/src/routes/\(protected-customer\)/profile/index.tsx
git commit -m "style: redesign profile page with address management and theme toggle"
```

---

### Task 16: Redesign Auth Pages

**Files:**
- Modify: `apps/web/src/routes/auth/login.tsx`
- Modify: `apps/web/src/routes/auth/register/user.tsx`
- Modify: `apps/web/src/routes/auth/register/delivery.tsx`
- Modify: `apps/web/src/routes/auth/register/restaurant.tsx`

- [ ] **Step 1: Read all auth page files**

- [ ] **Step 2: Redesign login page**

Centered `Card` (max-w-[420px]) on warm background:
- Logo text "bestellando" in accent color
- "Willkommen zurück" heading
- Email `Input`, Password `Input` (with type toggle)
- "Anmelden" full-width `Button` (bg-accent)
- "Noch kein Konto? Registrieren" `Link`
- `AnimatedPage` wrapper

- [ ] **Step 3: Redesign user registration page**

Same centered card layout:
- "Konto erstellen" heading
- First name + Last name `Input` (side by side, `grid grid-cols-2 gap-3`)
- Email `Input`, Password `Input`
- "Registrieren" full-width primary `Button`
- "Bereits ein Konto? Anmelden" `Link`

- [ ] **Step 4: Redesign delivery registration page**

Same card layout:
- "Als Fahrer registrieren" heading
- Name `Input`, Phone `Input`
- Vehicle type `Select` with `ListBoxItem`: Fahrrad, Roller, Auto
- "Registrieren" primary `Button`

- [ ] **Step 5: Redesign restaurant registration page**

Same card layout:
- "Restaurant registrieren" heading
- Restaurant name, type `Select`, phone, address fields
- "Registrieren" primary `Button`

- [ ] **Step 6: Verify all auth flows and commit**

```bash
git add apps/web/src/routes/auth/
git commit -m "style: redesign auth pages — login, registration with centered warm cards"
```

---

### Task 17: Redesign Restaurant Dashboard (Order-First)

**Files:**
- Modify: `apps/web/src/routes/(protected-restaurant)/dashboard/route.tsx`
- Modify: `apps/web/src/routes/(protected-restaurant)/dashboard/index.tsx`
- Modify: `apps/web/src/components/dashboard/DashboardSidebar.tsx`
- Modify: `apps/web/src/components/dashboard/IncomingOrderCard.tsx`

- [ ] **Step 1: Read all dashboard files**

Read: `dashboard/route.tsx`, `dashboard/index.tsx`, `DashboardSidebar.tsx`, `IncomingOrderCard.tsx`

- [ ] **Step 2: Redesign DashboardSidebar**

Compact icon sidebar (56px wide, dark bg):
- Icons: clipboard (orders), utensils (menu), clock (hours), gear (settings)
- Use `@gravity-ui/icons` equivalents: `ListCheck`, `CookieStar` or similar, `Clock`, `Gear`
- Active icon: `bg-accent text-white rounded-lg`
- Inactive: `text-zinc-500 hover:text-white`
- Render as vertical nav on desktop, horizontal bottom bar on mobile (below lg breakpoint)
- Each icon links to its dashboard sub-route

- [ ] **Step 3: Update dashboard layout route**

`dashboard/route.tsx`:
```tsx
<div className="flex min-h-screen bg-background">
  <DashboardSidebar />
  <div className="flex-1 flex flex-col">
    <DashboardTopbar />
    <main className="flex-1 overflow-y-auto">
      <Outlet />
    </main>
  </div>
</div>
```

Create a `DashboardTopbar` inline or as component:
- Restaurant name (heading)
- Online/offline `Switch` with label
- Notification bell `Button` with `Badge`

- [ ] **Step 4: Redesign IncomingOrderCard**

Order card with left border indicating status:
- New: `border-l-4 border-l-accent` + pulse shadow animation
- Preparing: `border-l-4 border-l-warning`
- Ready: `border-l-4 border-l-success`
- Header: order ID + status label + timestamp
- Body: item list
- Footer: total (`PriceDisplay`) + action buttons
- New order buttons: "Annehmen" (success) + "Ablehnen" (danger)
- Preparing: "Bereit ✓" (secondary)
- Ready: "Abgeholt ✓" (success)

- [ ] **Step 5: Rewrite dashboard index (orders view)**

The default dashboard page — order feed:
- Heading: "Bestellungen"
- Live feed of `IncomingOrderCard` components, newest first
- Empty state when no orders
- Fetches orders via `useApiQuery`
- WebSocket subscription for real-time new orders (via `useSocketEvent`)

- [ ] **Step 6: Verify and commit**

```bash
git add apps/web/src/routes/\(protected-restaurant\)/dashboard/ apps/web/src/components/dashboard/DashboardSidebar.tsx apps/web/src/components/dashboard/IncomingOrderCard.tsx
git commit -m "style: redesign dashboard — order-first layout, icon sidebar, pulsing order cards"
```

---

### Task 18: Redesign Dashboard Sub-Pages (Menu, Hours, Settings)

**Files:**
- Modify: `apps/web/src/routes/(protected-restaurant)/dashboard/menu/index.tsx`
- Modify: `apps/web/src/routes/(protected-restaurant)/dashboard/opening-hours/index.tsx`
- Modify: `apps/web/src/routes/(protected-restaurant)/dashboard/settings/index.tsx`
- Modify: `apps/web/src/components/dashboard/MenuProductRow.tsx`
- Modify: `apps/web/src/components/dashboard/ProductFormModal.tsx`
- Modify: `apps/web/src/components/dashboard/OpeningHoursEditor.tsx`
- Modify: `apps/web/src/components/dashboard/RestaurantSettingsForm.tsx`

- [ ] **Step 1: Read all files**

- [ ] **Step 2: Redesign MenuProductRow**

Table row style:
- Product name (font-medium)
- Price (`PriceDisplay`)
- Availability `Switch`
- Edit `Button` (ghost, small)
- Delete `Button` (ghost, danger, small) with `ConfirmDialog`

- [ ] **Step 3: Redesign ProductFormModal**

`Modal` + `ModalDialog`:
- Title: "Neues Gericht" or "Gericht bearbeiten"
- Name `Input`, Description `TextArea`, Price `NumberField`
- Category `Select` with `ListBoxItem`
- Availability `Switch`
- "Speichern" primary `Button`, "Abbrechen" outline `Button`

- [ ] **Step 4: Update menu page**

- Heading: "Speisekarte"
- "Neues Gericht" primary `Button` (opens `ProductFormModal`)
- `Table` with `MenuProductRow` for each product
- Loading/empty states

- [ ] **Step 5: Redesign OpeningHoursEditor**

7 rows (Montag–Sonntag):
- Day name (font-medium, w-28)
- Open time `Input` (type="time", w-28)
- Close time `Input` (type="time", w-28)
- "Geschlossen" `Switch`
- Row layout: `flex items-center gap-3`

- [ ] **Step 6: Update opening hours page**

- Heading: "Öffnungszeiten"
- `OpeningHoursEditor`
- "Speichern" primary `Button`

- [ ] **Step 7: Redesign RestaurantSettingsForm**

- Restaurant name `Input`
- Description `TextArea`
- Cuisine type `Select`
- Delivery fee `NumberField` (with € suffix)
- Minimum order `NumberField` (with € suffix)
- "Speichern" primary `Button`

- [ ] **Step 8: Update settings page**

- Heading: "Einstellungen"
- `RestaurantSettingsForm`
- Wrap in max-w-[640px]

- [ ] **Step 9: Verify all dashboard sub-pages and commit**

```bash
git add apps/web/src/routes/\(protected-restaurant\)/dashboard/ apps/web/src/components/dashboard/
git commit -m "style: redesign dashboard sub-pages — menu, hours, settings with warm theme"
```

---

### Task 19: Redesign Delivery Person Views

**Files:**
- Modify: `apps/web/src/routes/(protected-delivery)/deliveries/index.tsx`
- Modify: `apps/web/src/routes/(protected-delivery)/deliveries/$deliveryId.tsx`
- Modify: `apps/web/src/components/delivery/DeliveryCard.tsx`
- Modify: `apps/web/src/components/delivery/ActiveDeliveryView.tsx`
- Modify: `apps/web/src/components/delivery/DeliveryActionBar.tsx`

- [ ] **Step 1: Read all delivery files**

- [ ] **Step 2: Redesign DeliveryCard**

`Card` for available deliveries:
- Restaurant name, pickup address
- Delivery address, distance
- Order total (`PriceDisplay`, font-bold, text-accent)
- "Annehmen" primary `Button`
- Warm surface bg, border, rounded-xl

- [ ] **Step 3: Redesign ActiveDeliveryView**

- Leaflet map showing route (restaurant → customer)
- GPS sharing indicator: pulsing green dot + "GPS aktiv"
- Use `navigator.geolocation.watchPosition()` for position streaming

- [ ] **Step 4: Redesign DeliveryActionBar**

Fixed bottom bar:
- Before pickup: "Abgeholt" primary `Button` (full width)
- After pickup: "Geliefert" success `Button` (full width)
- Surface bg, top border, shadow

- [ ] **Step 5: Update delivery routes**

Available deliveries page:
- Heading: "Verfügbare Lieferungen"
- Grid/list of `DeliveryCard` components
- Empty state: "Keine Lieferungen verfügbar"

Active delivery page:
- `ActiveDeliveryView` with `DeliveryActionBar`
- `AnimatedPage` wrapper

- [ ] **Step 6: Verify and commit**

```bash
git add apps/web/src/routes/\(protected-delivery\)/ apps/web/src/components/delivery/
git commit -m "style: redesign delivery views — available list, active delivery with warm theme"
```

---

### Task 20: Final Polish and Cleanup

**Files:**
- Modify: `apps/web/src/kit/footer.tsx`
- Modify: `apps/web/src/components/shared/EmptyState.tsx`
- Modify: `apps/web/src/components/shared/LoadingSkeleton.tsx`
- Modify: `apps/web/src/components/shared/ConfirmDialog.tsx`
- Delete: `apps/web/src/routes/(protected-customer)/list-restaurants.tsx` (if exists)
- Delete: `apps/web/src/routes/(protected-customer)/protected.tsx` (if exists)
- Delete: `apps/web/src/routes/(protected-restaurant)/manage-restaurant.tsx` (if exists)
- Delete: `apps/web/src/components/dashboard/StatCard.tsx` (replaced by order-first design)

- [ ] **Step 1: Update footer**

Simple warm footer:
- "bestellando" logo text in accent
- Copyright line in text-muted
- Center aligned, py-8, border-t border-border

- [ ] **Step 2: Refresh EmptyState**

Ensure it uses:
- `bg-surface rounded-xl border border-border p-8 text-center`
- Icon in text-muted
- Title in text-foreground font-semibold
- Description in text-muted text-sm
- Optional action `Button` in accent

- [ ] **Step 3: Refresh LoadingSkeleton**

Ensure Skeleton components use surface bg with proper dark mode contrast. Verify `type="card"` renders rounded-xl cards with shimmer.

- [ ] **Step 4: Update ConfirmDialog**

Ensure it uses `ModalDialog` (not ModalContent), accent/danger `Button` variants.

- [ ] **Step 5: Delete deprecated route files**

Remove any old route files that were replaced:
```bash
rm -f apps/web/src/routes/\(protected-customer\)/list-restaurants.tsx
rm -f apps/web/src/routes/\(protected-customer\)/protected.tsx
rm -f apps/web/src/routes/\(protected-restaurant\)/manage-restaurant.tsx
```

- [ ] **Step 6: Run type check**

Run: `pnpm check-types`
Expected: No type errors.

- [ ] **Step 7: Run dev server and visual smoke test**

Run: `pnpm dev --filter=web`

Test each page in both light and dark mode:
- Landing page
- Restaurant browsing
- Restaurant detail (desktop split view + mobile stacked)
- Checkout wizard (3 steps)
- Order history and tracking
- Profile
- Dashboard (orders, menu, hours, settings)
- Auth pages (login, register)
- Delivery views

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "style: final polish — footer, shared components, cleanup deprecated files"
```
