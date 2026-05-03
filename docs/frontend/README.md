# Frontend (`apps/web`) — Übersicht

Das Frontend ist eine **React-19**-Anwendung, gebaut mit **Vite 7** und **TanStack Router** (file-basiertes Routing).

## Bootstrap-Flow

1. `index.html` — leerer Container `<div id="root">`
2. `src/main.tsx` — `ReactDOM.createRoot(...).render(<App />)`
3. `src/App.tsx` — Provider-Stack (Theme, Query, Auth) + `<RouterProvider />`
4. `src/routeTree.gen.ts` — Auto-generiert von `@tanstack/router-vite-plugin`
5. Routes laden dynamisch (Code-Splitting per Route-File)

## Inhalt

- [Routing (TanStack Router)](./routing.md)
- [Auth-Flow](./auth-flow.md)
- [Komponenten](./komponenten/README.md)
  - [Shared Components](./komponenten/shared.md)
  - [Cart Components](./komponenten/cart.md)
  - [Checkout Components](./komponenten/checkout.md)
  - [Restaurant Components](./komponenten/restaurant.md)
  - [Order Components](./komponenten/order.md)
  - [Delivery Components](./komponenten/delivery.md)
  - [Dashboard Components](./komponenten/dashboard.md)
- [Routen](./routen/README.md)
- [Hooks](./hooks.md)
- [Stores (Zustand)](./stores.md)
- [Theming](./theming.md)

## Tech-Stack-Highlights

- **React 19** mit Suspense
- **Vite 7** als Build-Tool / Dev-Server
- **TanStack Router** — File-Routing mit Type-Safety
- **TanStack Query** — Server-State / Caching
- **TanStack Form** + **Zod** — Auth-Form-Validierung
- **Zustand** — Client-State (nur Cart)
- **HeroUI v3** + **Tailwind v4** — UI / Styling
- **Leaflet / react-leaflet** — Karten
- **socket.io-client** — Echtzeit
- **Appwrite SDK (Web)** — Auth + Storage-Direct-Uploads

## Provider-Architektur

```tsx
// App.tsx (vereinfacht)
<ThemeProvider>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </QueryClientProvider>
</ThemeProvider>
```

| Provider | Zweck |
|----------|-------|
| `ThemeProvider` | Dark/Light/System-Theme via Tailwind-Class |
| `QueryClientProvider` | TanStack Query-Cache |
| `AuthProvider` | Lädt eagerly Account + UserType |

## Build-Output

- `pnpm --filter web build` produziert `apps/web/dist/`
- Statische Files (HTML, JS, CSS, Assets)
- Deployment z. B. zu Vercel, Netlify, Cloudflare Pages

## Wichtige Globale Verhaltensregeln

1. **HeroUI v3 Compound-Pattern einhalten** — naive v2-Style-Usage bricht silently
2. **Niemals direkt `fetch()`** — immer `authenticatedFetch` aus `@repo/lib` (sorgt für JWT + Auto-Logout)
3. **Niemals Daten direkt in Components fetchen** — `useApiQuery` / `useApiMutation` benutzen
4. **TanStack Query Keys konsistent** halten (`["restaurant", id]`, `["order", orderId]`, ...)
5. **Markdown-Links zu lokalen Dateien** — wenn man Komponenten referenziert, IDE-clickable
