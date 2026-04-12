# Bestellando Frontend Redesign — Design Spec

## Overview

Complete frontend UI/UX redesign for Bestellando, a food delivery platform. Replaces the current prototype-quality UI with a polished, production-ready design using HeroUI v3 (3.0.0-beta.8) components, Tailwind CSS 4, and Framer Motion. Supports light and dark mode.

**Design direction:** Warm & Inviting (Lieferando / Just Eat style) — deep orange-red accent, warm tones, friendly feel, community-oriented. Broad audience, all ages.

**Tech stack:** React 19, HeroUI v3 beta, Tailwind CSS 4, Framer Motion, TanStack Router (file-based), TanStack Query, Zustand (cart), Leaflet (maps).

---

## Design System

### Color Tokens

All colors are defined as CSS custom properties on `:root` (light) and `[data-theme="dark"]` (dark). Tailwind references these via `theme.extend.colors`.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-primary` | `#E63E11` | `#FF6B3A` | CTAs, active states, brand accent |
| `--color-secondary` | `#FF8B5A` | `#FF9B6E` | Highlights, hover states, badges |
| `--color-background` | `#FFF8F0` | `#121212` | Page backgrounds |
| `--color-surface` | `#FFFFFF` | `#1E1E1E` | Cards, modals, drawers |
| `--color-text` | `#2D2D2D` | `#F5F0EB` | Primary text |
| `--color-muted` | `#7A7A7A` | `#8A8A8A` | Secondary text, placeholders |
| `--color-border` | `#F0E8E0` | `#2A2A2A` | Borders, dividers |
| `--color-success` | `#2E7D32` | `#4CAF50` | Open status, confirmed, success |
| `--color-error` | `#D32F2F` | `#EF5350` | Errors, rejected, destructive |
| `--color-warning` | `#F9A825` | `#FFD54F` | Warnings, pending states |

**Dark mode rationale:** Primary shifts from `#E63E11` → `#FF6B3A` to maintain WCAG AA contrast ratio (4.5:1) against dark backgrounds. Success/error colors are lightened for the same reason.

### Typography

System font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.

| Role | Size | Weight | Tailwind class |
|------|------|--------|---------------|
| Page heading | 32px | 800 | `text-3xl font-extrabold` |
| Section heading | 24px | 700 | `text-2xl font-bold` |
| Card title | 16px | 600 | `text-base font-semibold` |
| Body | 14px | 400 | `text-sm` |
| Caption/meta | 12px | 400 | `text-xs` |
| Badge/tag | 11px | 600 | `text-[11px] font-semibold` |

### Spacing & Layout

- 8px grid system for all spacing
- Card border radius: 12px (`rounded-xl`)
- Button border radius: 8px (`rounded-lg`)
- Chip/badge border radius: 9999px (`rounded-full`)
- Card shadow: `0 2px 8px rgba(0,0,0,0.08)` (light), `0 2px 8px rgba(0,0,0,0.3)` (dark)
- Hover shadow: `0 8px 24px rgba(0,0,0,0.12)` (light), `0 8px 24px rgba(0,0,0,0.4)` (dark)
- Hover transition: `150ms ease` on transform and shadow
- Card hover: `translateY(-2px)` + elevated shadow
- Max content width: 1280px centered

### Animation

Framer Motion for page transitions and interactive elements:
- Page enter: `fadeIn + slideUp` (opacity 0→1, y 12→0, 200ms ease-out)
- Card hover: CSS transition (no Framer — keep performant)
- Modal/drawer: Framer `AnimatePresence` with slide + fade
- Cart badge: scale pulse on item add (200ms spring)
- Order status change: subtle highlight flash (background pulse)
- Skeleton loading: HeroUI `Skeleton` component with shimmer

---

## Dark Mode Implementation

### Strategy

- **Detection:** Respect `prefers-color-scheme: dark` on first visit
- **Manual toggle:** Theme switcher in header (sun/moon icon) and profile page
- **Persistence:** Store preference in `localStorage` key `bestellando-theme`
- **Tailwind:** Use `darkMode: 'class'` strategy — apply `dark` class on `<html>`
- **CSS custom properties:** All color tokens switch via `[data-theme="dark"]` selector
- **Existing infrastructure:** Extend `@repo/contexts/ThemeProvider` and `@repo/hooks/useTheme` that already exist in the codebase

### HeroUI Integration

HeroUI v3 supports theming via its provider. Configure `HeroUIProvider` with custom theme tokens that map to our CSS custom properties. HeroUI components will inherit the active theme automatically.

---

## HeroUI v3 Component Mapping

The project uses `@heroui/react` 3.0.0-beta.8. Below are the correct v3 component names used throughout this spec. Note: v3 renamed several components from v2.

### Core Components Used

| Purpose | HeroUI v3 Component | Notes |
|---------|---------------------|-------|
| Buttons | `Button`, `ButtonGroup` | Primary/secondary/outline variants |
| Cards | `Card`, `CardHeader`, `CardContent`, `CardFooter` | NOT CardBody (v2 name) |
| Modals | `Modal`, `ModalDialog`, `ModalHeader`, `ModalBody`, `ModalFooter` | NOT ModalContent (v2 name) |
| Inputs | `Input`, `InputGroup`, `TextArea` | TextArea NOT Textarea |
| Select | `Select`, `ListBoxItem` | NOT SelectItem (v2 name) |
| Tabs | `Tabs`, `TabList`, `Tab`, `TabPanel` | For category navigation |
| Chips | `Chip` | Category pills, status badges |
| Badge | `Badge` | Cart count, notification count |
| Avatar | `Avatar` | User profile, restaurant logo |
| Skeleton | `Skeleton` | Loading states |
| Spinner | `Spinner` | Button loading states |
| Switch | `Switch` | Online/offline toggle |
| Separator | `Separator` | Section dividers (NOT Divider) |
| Tooltip | `Tooltip` | Icon button labels |
| Popover | `Popover`, `PopoverTrigger`, `PopoverContent` | Filter dropdowns |
| Alert | `Alert` | Success/error notifications |
| Table | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableColumn` | Order history, dashboard tables |
| Dropdown | `Dropdown`, `DropdownTrigger`, `DropdownMenu`, `DropdownItem` | Context menus |
| Breadcrumbs | `Breadcrumbs`, `BreadcrumbsItem` | Dashboard navigation |
| Link | `Link` | Navigation links |
| Autocomplete | `Autocomplete` | Address search |
| Toast | `ToastProvider`, `Toast` | Notifications |
| AlertDialog | `AlertDialog` | Confirm destructive actions |
| Progress | via custom stepper | Checkout wizard (no built-in stepper) |
| NumberField | `NumberField` | Quantity pickers |
| Disclosure | `Disclosure` | FAQ/collapsible sections |

### Components NOT in HeroUI v3 (custom-built)

| Component | Implementation |
|-----------|---------------|
| Bottom Tab Bar | Custom with Tailwind + Framer Motion |
| Checkout Stepper | Custom progress bar component |
| Order Timeline | Custom vertical stepper |
| Delivery Map | Leaflet + react-leaflet |
| Cart Drawer | Custom slide-over with Framer Motion AnimatePresence |
| Price Display | Custom formatted EUR component |

---

## Screen Designs

### 1. Landing Page — Compact Header + Immediate Content

**Layout:** Small hero area (NOT full viewport) with search, then immediately into restaurant browsing content. App-like feel, gets users to restaurants fast.

**Header:**
- Logo "bestellando" in brand primary color (left)
- Nav links: "Restaurants", "So funktioniert's" (center/right)
- Theme toggle (sun/moon icon)
- "Anmelden" (outline button) + "Registrieren" (primary button)
- On mobile: hamburger for nav links, keep theme toggle + auth buttons visible

**Hero area (compact, ~200px height):**
- Left: headline "Hunger? Bestell dir was Gutes.", subtitle, address search bar (HeroUI `Autocomplete` with location icon)
- Right: warm food illustration or emoji collage (decorative, not critical)
- Search bar: `InputGroup` with address input + "Suchen" primary button

**Category chips (scrollable row):**
- Horizontal scroll row of `Chip` components with emoji + label
- Categories: Pizza, Burger, Sushi, Döner, Asiatisch, Salat, Mexikanisch, Indisch
- Active chip: filled primary style; inactive: bordered

**Restaurant grid:**
- 3 columns desktop, 2 columns tablet, 1 column mobile
- Each card: `Card` with image area (restaurant photo or food emoji placeholder), restaurant name, star rating (primary color), delivery time estimate, minimum order `Chip`
- Card hover: lift + shadow elevation
- Loading state: `Skeleton` grid

**Bottom Tab Bar (mobile only, always visible):**
- 5 tabs: Home (house), Suche (search), Bestellungen (clipboard), Warenkorb (cart + `Badge` count), Profil (user)
- Active tab: primary color icon + label
- Inactive: muted color
- Fixed to bottom, 56px height, surface background, top border
- Cart badge: primary background, white text, scale animation on change

### 2. Restaurant Browsing Page

**Layout:** Same header + bottom tabs. Filter bar + restaurant grid.

**Filter bar:**
- `Input` with search icon for restaurant name search (debounced 300ms)
- `Select` for cuisine type filter
- `Chip` group for: "Geöffnet", "Kostenlose Lieferung", "Beste Bewertung"
- Sort `Select`: "Empfohlen", "Lieferzeit", "Bewertung", "Mindestbestellwert"

**Restaurant grid:** Same card design as landing page, paginated or infinite scroll.

### 3. Restaurant Detail — Split View (Desktop) / Stacked (Mobile)

**Desktop layout (≥1024px):**
- Left column (60%): restaurant info + menu
- Right column (40%): sticky cart sidebar

**Mobile layout (<1024px):**
- Full-width stacked: banner → category chips → menu items
- Sticky bottom cart bar: shows item count, total, "Zur Kasse →" button (appears when cart has items)

**Restaurant banner:**
- Gradient background (primary shades) with restaurant name, rating (stars + count), delivery time, minimum order, open/closed `Chip`
- Collapsible on scroll (mobile): shrinks to compact bar with name + rating

**Menu category navigation:**
- Desktop: `TabList` with horizontal tabs (Beliebt, Pizza, Pasta, Salate, Desserts, Getränke)
- Mobile: horizontal scrollable `Chip` row
- Sticky below banner on scroll
- Active category: primary underline (tabs) or filled chip

**Menu items:**
- Each item: flex row with name (semibold), description (muted, truncated), price (primary, bold), "+" `Button` (primary, circular, 28px)
- Optional: small thumbnail image on right
- Tap item → `Modal` with `ModalDialog`: larger image, full description, quantity `NumberField`, special instructions `TextArea`, "In den Warenkorb" primary button

**Cart sidebar (desktop):**
- Header: "Warenkorb" with cart icon
- Item list: quantity badge (primary bg on surface), item name, item total
- Each item: +/- quantity controls, remove button
- `Separator` between items and totals
- Subtotal, delivery fee, total (bold, larger)
- "Zur Kasse →" full-width primary `Button`
- Empty state: `EmptyState` with illustration + "Füge Gerichte hinzu"

**Cart bar (mobile):**
- Fixed bottom bar (above tab bar), surface background, top shadow
- Shows: item count `Badge`, total price, "Zur Kasse →" `Button`
- Slides up with Framer Motion when first item added
- Tap to expand into full cart drawer (slide-up sheet)

### 4. Checkout — Multi-Step Wizard

**Layout:** Clean page with progress bar at top, single content area, back/next buttons.

**Progress bar (custom component):**
- 3 steps: Adresse → Überprüfen → Bezahlen
- Each step: numbered circle + label
- Done steps: success green circle with checkmark
- Active step: primary circle
- Future steps: muted/border circle
- Lines between steps: green (done) or muted (pending)

**Step 1 — Adresse:**
- Saved addresses as selectable `Card` list (radio-style, selected = primary border)
- Each address card: name, street, city, zip
- "Neue Adresse hinzufügen" outline `Button`
- "Weiter" primary `Button`

**Step 2 — Überprüfen:**
- Order summary `Card`: item list with quantities and prices
- `Separator`
- Subtotal, delivery fee, total (primary color, bold)
- "Anmerkungen" `TextArea` for special instructions
- "← Zurück" outline `Button` + "Weiter zur Zahlung →" primary `Button`

**Step 3 — Bezahlen:**
- Redirect to Stripe Checkout (external)
- Loading state while creating session: `Spinner` + "Weiterleitung zu Stripe..."

**Confirmation page (after Stripe return):**
- Success animation (confetti burst via canvas, 2 seconds)
- Green checkmark circle
- "Bestellung bestätigt!" heading
- Order number, estimated delivery time
- "Bestellung verfolgen" primary `Button` → order tracking page
- "Zurück zur Startseite" link

### 5. Order Tracking — Live Status

**Layout:** Single page with order info, timeline, and map.

**Header bar:**
- "Bestellung #1234" heading
- Status `Chip`: colored by state (warning=pending, primary=preparing, secondary=on the way, success=delivered)

**Order timeline (custom vertical stepper):**
- Steps: Bestätigt → In Zubereitung → Unterwegs → Geliefert
- Each step: colored dot (success=done, primary=active, muted=pending), title, timestamp, description
- Connecting lines between dots: success (done) or muted (pending)
- Active step pulses subtly

**Delivery map (when driver assigned):**
- Leaflet map with three markers: restaurant (pin), driver (scooter), customer (house)
- Route polyline from OSRM
- Driver marker animates smoothly (GPS interpolation with requestAnimationFrame, ease-out cubic)
- Map auto-centers to show all markers with padding
- "Verbindung verloren" overlay if no GPS update for 60s

**Order details (collapsible `Disclosure`):**
- Item list, totals, delivery address, restaurant info

**Real-time updates:** WebSocket subscription to `order:{orderId}` room. Status changes update timeline + chip without page refresh.

### 6. Order History

**Layout:** List of past orders.

- Each order: `Card` with order number, restaurant name, date, total, status `Chip`
- Tap → order detail page (same as tracking, but completed state)
- Empty state: `EmptyState` with "Noch keine Bestellungen"
- Paginated with "Mehr laden" `Button`

### 7. Profile Page

**Layout:** User info + settings.

- Avatar, name, email (read-only from Appwrite)
- **Adressen** section: list of saved addresses with edit/delete, set default, add new
- **Theme** toggle: light/dark `Switch`
- **Abmelden** destructive `Button` with `AlertDialog` confirmation

### 8. Restaurant Dashboard — Order-First

**Layout:** Compact icon sidebar (56px, dark background) + main content area.

**Sidebar icons (vertical):**
- Orders (clipboard) — active: primary background
- Menu (utensils)
- Opening Hours (clock)
- Settings (gear)
- Active icon: primary bg with white icon
- Inactive: muted icon, hover → white
- On mobile: icons move to a horizontal bottom bar

**Top bar:**
- Restaurant name (heading)
- Online/offline `Switch` with colored label ("Online" green / "Offline" muted)
- Notification bell with `Badge` count

**Orders view (default, dominates screen):**
- Live feed of orders, newest first
- Each order `Card`:
  - Left border color indicates status: primary (new), secondary (preparing), success (ready)
  - New orders pulse with subtle box-shadow animation
  - Header: order ID + "Neue Bestellung" label + timestamp ("vor 30 Sek.")
  - Body: item list (quantity + name per line)
  - Footer: total price (primary, bold) + action buttons
- New order actions: "Annehmen" (success `Button`) + "Ablehnen" (error `Button`)
- Preparing order actions: "Bereit" (secondary `Button`)
- Ready order actions: "Abgeholt" (success `Button`)
- Sound notification on new order (browser Audio API)
- Real-time: WebSocket subscription to `restaurant:{restaurantId}:orders`

**Menu management view:**
- Product list as `Table` rows: name, price, availability `Switch`, edit `Button`, delete `Button`
- "Neues Gericht" primary `Button` → `Modal` with product form
- Product form: name `Input`, description `TextArea`, price `NumberField`, category `Select`, availability `Switch`

**Opening hours view:**
- Day-of-week editor: 7 rows (Montag–Sonntag)
- Each row: day name, open time `Input`, close time `Input`, closed `Switch`
- "Speichern" primary `Button`

**Settings view:**
- Restaurant name, description `TextArea`, cuisine type `Select`
- Delivery fee `NumberField`, minimum order `NumberField`
- "Speichern" primary `Button`

### 9. Auth Pages

**Login page:**
- Centered `Card` (max-width 420px) on warm background
- Logo, "Willkommen zurück" heading
- Email `Input`, Password `Input` (with show/hide toggle)
- "Anmelden" full-width primary `Button`
- "Noch kein Konto? Registrieren" `Link`

**Registration page:**
- Same centered `Card` layout
- First name + Last name `Input` (side by side)
- Email `Input`, Password `Input`
- Account type `Select`: "Kunde", "Restaurant"
- "Registrieren" full-width primary `Button`
- "Bereits ein Konto? Anmelden" `Link`

**Delivery person registration:**
- Name `Input`, Phone `Input`, Vehicle type `Select` (Fahrrad, Roller, Auto)
- "Als Fahrer registrieren" primary `Button`

### 10. Delivery Person Views

**Available deliveries:**
- List of `Card` items: restaurant name, pickup address, delivery address, order total, distance estimate
- "Annehmen" primary `Button` per card

**Active delivery:**
- Leaflet map with route (restaurant → customer)
- Action bar at bottom: "Abgeholt" `Button` → "Geliefert" `Button`
- GPS sharing active indicator (pulsing dot)
- Auto-shares position via `navigator.geolocation.watchPosition()` every 5s (15s when stationary)

---

## Responsive Breakpoints

| Breakpoint | Width | Layout changes |
|------------|-------|---------------|
| Mobile | < 640px | Single column, bottom tab bar, stacked restaurant detail, cart as bottom sheet |
| Tablet | 640–1023px | 2-column restaurant grid, bottom tab bar, stacked restaurant detail |
| Desktop | ≥ 1024px | 3-column grid, header nav (no tab bar), split-view restaurant detail with cart sidebar, dashboard sidebar |

---

## Accessibility

- All interactive elements have visible focus rings (2px primary outline, 2px offset)
- Color contrast: WCAG AA minimum (4.5:1 for text, 3:1 for large text)
- Dark mode primary (#FF6B3A on #121212) = 5.2:1 ratio
- All images have alt text
- Modal focus trap (HeroUI handles this)
- Keyboard navigation for all flows
- `aria-live="polite"` on order status updates and cart count changes
- Screen reader announcements for toast notifications

---

## Loading & Error States

**Loading:** HeroUI `Skeleton` components matching the shape of the content they replace. Restaurant grid shows 6 skeleton cards. Menu shows 4 skeleton rows. Cart shows skeleton summary.

**Empty states:** Custom `EmptyState` component with illustration placeholder, title, description, optional action button.

**Error states:** `Alert` component (error variant) with retry `Button`. Network errors show a top banner: "Verbindung unterbrochen — wird erneut versucht..."

**Optimistic updates:** Cart operations (add/remove/quantity) update instantly via Zustand, with rollback on API error.

---

## File Structure (Frontend)

```
apps/web/src/
├── styles/
│   └── theme.css                    # CSS custom properties for light/dark tokens
├── components/
│   ├── shared/
│   │   ├── AnimatedPage.tsx          # Framer Motion page wrapper
│   │   ├── EmptyState.tsx            # Empty state with illustration
│   │   ├── LoadingSkeleton.tsx       # Skeleton grid/list presets
│   │   ├── PriceDisplay.tsx          # Formatted EUR price
│   │   ├── SearchInput.tsx           # Debounced search with icon
│   │   ├── ConfirmDialog.tsx         # AlertDialog wrapper
│   │   ├── ThemeToggle.tsx           # Sun/moon toggle button
│   │   └── BottomTabBar.tsx          # Mobile navigation
│   ├── restaurant/
│   │   ├── RestaurantCard.tsx        # Browse grid card
│   │   ├── RestaurantFilters.tsx     # Filter bar
│   │   ├── RestaurantHero.tsx        # Detail page banner
│   │   ├── MenuSection.tsx           # Menu category section
│   │   ├── ProductCard.tsx           # Menu item row
│   │   ├── ProductModal.tsx          # Item detail modal
│   │   └── OpeningHoursBadge.tsx     # Open/closed indicator
│   ├── cart/
│   │   ├── CartSidebar.tsx           # Desktop sticky cart
│   │   ├── CartBottomBar.tsx         # Mobile cart bar
│   │   ├── CartDrawer.tsx            # Mobile cart sheet
│   │   ├── CartItem.tsx              # Single cart item row
│   │   ├── CartSummary.tsx           # Totals display
│   │   └── CartEmpty.tsx             # Empty cart state
│   ├── checkout/
│   │   ├── CheckoutStepper.tsx       # Progress bar
│   │   ├── AddressStep.tsx           # Step 1
│   │   ├── ReviewStep.tsx            # Step 2
│   │   ├── PaymentStep.tsx           # Step 3 (Stripe redirect)
│   │   ├── OrderConfirmation.tsx     # Success with confetti
│   │   └── AddressSelector.tsx       # Saved address picker
│   ├── order/
│   │   ├── OrderCard.tsx             # Order history card
│   │   ├── OrderTimeline.tsx         # Vertical status stepper
│   │   ├── OrderStatusChip.tsx       # Colored status chip
│   │   ├── DeliveryMap.tsx           # Leaflet tracking map
│   │   └── hooks/
│   │       ├── useDriverPosition.ts  # GPS interpolation
│   │       ├── useDeliverySocket.ts  # WebSocket subscription
│   │       └── useRoute.ts           # OSRM route fetching
│   ├── dashboard/
│   │   ├── DashboardSidebar.tsx      # Icon sidebar
│   │   ├── DashboardTopbar.tsx       # Restaurant name + online toggle
│   │   ├── IncomingOrderCard.tsx     # Order card with actions
│   │   ├── MenuProductRow.tsx        # Product table row
│   │   ├── ProductFormModal.tsx      # Create/edit product
│   │   ├── OpeningHoursEditor.tsx    # Day-of-week editor
│   │   └── RestaurantSettingsForm.tsx # Profile/delivery config
│   └── delivery/
│       ├── DeliveryCard.tsx          # Available delivery card
│       ├── ActiveDeliveryView.tsx    # Active delivery with GPS
│       ├── DeliveryActionBar.tsx     # Pickup/delivered buttons
│       └── NavigationMap.tsx         # Route to destination
├── routes/
│   ├── index.tsx                     # Landing page
│   ├── auth/
│   │   ├── login.tsx
│   │   └── register/
│   │       ├── user.tsx
│   │       └── delivery.tsx
│   ├── (protected-customer)/
│   │   ├── restaurants/
│   │   │   ├── index.tsx             # Browse restaurants
│   │   │   └── $restaurantId.tsx     # Restaurant detail
│   │   ├── cart.tsx                   # Full cart page
│   │   ├── checkout.tsx              # Checkout wizard
│   │   ├── orders/
│   │   │   ├── index.tsx             # Order history
│   │   │   └── $orderId.tsx          # Order tracking
│   │   └── profile/
│   │       └── index.tsx             # Profile + addresses
│   ├── (protected-restaurant)/
│   │   └── dashboard/
│   │       ├── route.tsx             # Dashboard layout
│   │       ├── index.tsx             # Orders view (default)
│   │       ├── menu/
│   │       │   └── index.tsx         # Menu management
│   │       ├── opening-hours/
│   │       │   └── index.tsx         # Hours editor
│   │       └── settings/
│   │           └── index.tsx         # Restaurant settings
│   └── (protected-delivery)/
│       ├── route.tsx                 # Delivery auth guard
│       └── deliveries/
│           ├── index.tsx             # Available deliveries
│           └── $deliveryId.tsx       # Active delivery
└── stores/
    └── cart-store.ts                 # Zustand with persist
```

---

## Pages to Delete (replaced by redesign)

- `apps/web/src/routes/(protected-customer)/list-restaurants.tsx` → replaced by `restaurants/index.tsx`
- `apps/web/src/routes/(protected-customer)/protected.tsx` → replaced by restaurants browse
- `apps/web/src/routes/(protected-restaurant)/manage-restaurant.tsx` → replaced by `dashboard/`

---

## Key Interactions

### Cart — Single Restaurant Enforcement
When adding an item from a different restaurant than the current cart, show `AlertDialog`: "Du hast bereits Artikel von {currentRestaurant} im Warenkorb. Warenkorb leeren und bei {newRestaurant} bestellen?" — "Leeren & hinzufügen" (primary) / "Abbrechen" (outline).

### Order Sound Notification (Dashboard)
Play a notification sound when a new order arrives via WebSocket. Use browser `Audio` API with a short chime. Respect browser autoplay policy — only play after first user interaction on the page.

### Theme Toggle
Animated sun/moon icon transition. Applies `dark` class to `<html>` and sets `data-theme="dark"`. Saves to `localStorage`. On first visit, reads `prefers-color-scheme`.
