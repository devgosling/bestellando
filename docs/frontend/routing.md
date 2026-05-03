# Routing (TanStack Router)

Bestellando nutzt **TanStack Router** mit **File-basiertem Routing**.

## Funktionsweise

- Jede Datei in `apps/web/src/routes/*.tsx` wird zu einer Route
- Der `@tanstack/router-vite-plugin` generiert daraus `apps/web/src/routeTree.gen.ts`
- Type-Safety: Route-Params, Search-Params, Loader-Returns sind alles getypt
- `Route.useParams()`, `Route.useSearch()` geben dir die Params type-safe zurück

## Datei-Konventionen

| Pattern | Bedeutung |
|---------|-----------|
| `index.tsx` | Default-Route (`/`) |
| `$param.tsx` | Dynamic Param (`/:param`) |
| `(group)/` | Layout-Group (kein URL-Segment, gruppierter Auth-Schutz) |
| `route.tsx` | Layout für eine Gruppe / einen Sub-Tree |
| `__root.tsx` | Root-Layout (App-weit) |

## Datei-Struktur

```
src/routes/
├── __root.tsx                            # Root-Layout, Providers
├── index.tsx                             # /  (Startseite)
├── map.tsx                               # /map
│
├── auth/
│   ├── route.tsx                         # /auth/* Layout
│   ├── login.tsx                         # /auth/login
│   └── register/
│       ├── user.tsx                      # /auth/register/user
│       ├── restaurant.tsx                # /auth/register/restaurant
│       └── delivery.tsx                  # /auth/register/delivery
│
├── (protected-customer)/                 # Kein URL-Segment, nur Logik-Gruppe
│   ├── route.tsx                         # ensureAuthenticated("CUSTOMER")
│   ├── cart.tsx                          # /cart
│   ├── checkout.tsx                      # /checkout
│   ├── orders/
│   │   ├── index.tsx                     # /orders
│   │   └── $orderId.tsx                  # /orders/:orderId
│   ├── profile/index.tsx                 # /profile
│   └── restaurants/
│       ├── index.tsx                     # /restaurants
│       └── $restaurantId.tsx             # /restaurants/:restaurantId
│
├── (protected-restaurant)/
│   ├── route.tsx                         # ensureAuthenticated("RESTAURANT")
│   └── dashboard/
│       ├── route.tsx                     # /dashboard/* Layout (Sidebar)
│       ├── index.tsx                     # /dashboard
│       ├── orders/index.tsx              # /dashboard/orders
│       ├── menu/index.tsx                # /dashboard/menu
│       ├── opening-hours/index.tsx       # /dashboard/opening-hours
│       ├── delivery-zones/index.tsx      # /dashboard/delivery-zones
│       └── settings/index.tsx            # /dashboard/settings
│
└── (protected-delivery)/
    ├── route.tsx                         # ensureAuthenticated("DELIVERY_PERSON")
    └── deliveries/
        ├── index.tsx                     # /deliveries
        └── $deliveryId.tsx               # /deliveries/:deliveryId
```

## Route-Definition (Beispiel)

```tsx
// src/routes/(protected-customer)/orders/$orderId.tsx
import { createFileRoute } from "@tanstack/react-router";

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  // ...
  return <div>...</div>;
}

export const Route = createFileRoute(
  "/(protected-customer)/orders/$orderId",
)({
  component: OrderDetailPage,
  staticData: { showHeader: true, showFooter: true },
});
```

`staticData` ist ein freies Objekt, das wir nutzen, um z. B. Header/Footer-Sichtbarkeit pro Route zu steuern.

## Route-Guards

Geschützte Route-Gruppen (`(protected-*)`) haben eine `route.tsx` mit einem `beforeLoad`:

```tsx
// src/routes/(protected-customer)/route.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ensureAuthenticated } from "../../providers/route-guard";

export const Route = createFileRoute("/(protected-customer)")({
  beforeLoad: async ({ location }) => {
    await ensureAuthenticated(location, "CUSTOMER");
  },
  component: () => <Outlet />,
});
```

`ensureAuthenticated()` aus [providers/route-guard.ts](../../apps/web/src/providers/route-guard.ts):

```ts
export async function ensureAuthenticated(
  location: ParsedLocation,
  expectedRole?: UserType,
) {
  // 1. Prüft ob Appwrite-Session existiert
  const account = await appwriteAccount.get().catch(() => null);
  if (!account) {
    throw redirect({ to: "/auth/login", search: { redirect: location.pathname } });
  }

  // 2. Prüft Rolle (cached für die Lifetime der Router-Instanz)
  if (expectedRole) {
    const role = await getCachedUserRole();
    if (role !== expectedRole) {
      throw redirect({ to: "/" });
    }
  }
}
```

## Such-Parameter (Search-Params)

TanStack Router behandelt Query-Strings type-safe via Zod-Schemas:

```tsx
import { z } from "zod";

const searchSchema = z.object({
  paid: z.boolean().optional(),
  cancelled: z.boolean().optional(),
});

export const Route = createFileRoute("/orders/$orderId")({
  validateSearch: searchSchema,
});

// im Component
const { paid, cancelled } = Route.useSearch();
```

## Navigation

```tsx
import { Link, useNavigate } from "@tanstack/react-router";

// Deklarativ
<Link to="/restaurants/$restaurantId" params={{ restaurantId: "abc" }}>
  Zum Restaurant
</Link>

// Imperativ
const navigate = useNavigate();
navigate({ to: "/cart" });
```

## Code-Splitting

Jede Route ist automatisch gesplittet — nur das aktuelle Bundle + Children werden geladen.

## RouteTree generieren

Bei laufendem Vite-Dev-Server passiert das automatisch. Falls nicht:

```bash
cd apps/web
npx @tanstack/router-cli generate
```

## Kit-Layout-Komponenten

In `src/kit/`:

- `header.tsx` — globaler Header (sichtbar je nach `staticData.showHeader`)
- `footer.tsx` — globaler Footer
- `subheading.tsx` — wiederverwendbare Sub-Heading
- `twopart-page.tsx` — 2-Spalten-Page-Layout (Sidebar + Content)
- `router-context.ts` — Custom-Context, z. B. mit dem `queryClient`
