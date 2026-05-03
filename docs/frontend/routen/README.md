# Routen — Übersicht

Alle Routen unter `apps/web/src/routes/`.

## Inhalt

- [Öffentliche Routen](./public.md)
- [Customer-Routen](./customer.md)
- [Restaurant-Dashboard](./restaurant-dashboard.md)
- [Delivery-Routen](./delivery.md)

## Vollständige URL-Liste

| URL | Datei | Schutz |
|-----|-------|--------|
| `/` | `routes/index.tsx` | Public |
| `/map` | `routes/map.tsx` | Public |
| `/auth/login` | `routes/auth/login.tsx` | Public |
| `/auth/register/user` | `routes/auth/register/user.tsx` | Public |
| `/auth/register/restaurant` | `routes/auth/register/restaurant.tsx` | Public |
| `/auth/register/delivery` | `routes/auth/register/delivery.tsx` | Public |
| `/restaurants` | `routes/(protected-customer)/restaurants/index.tsx` | CUSTOMER |
| `/restaurants/:restaurantId` | `routes/(protected-customer)/restaurants/$restaurantId.tsx` | CUSTOMER |
| `/cart` | `routes/(protected-customer)/cart.tsx` | CUSTOMER |
| `/checkout` | `routes/(protected-customer)/checkout.tsx` | CUSTOMER |
| `/orders` | `routes/(protected-customer)/orders/index.tsx` | CUSTOMER |
| `/orders/:orderId` | `routes/(protected-customer)/orders/$orderId.tsx` | CUSTOMER |
| `/profile` | `routes/(protected-customer)/profile/index.tsx` | CUSTOMER |
| `/dashboard` | `routes/(protected-restaurant)/dashboard/index.tsx` | RESTAURANT |
| `/dashboard/orders` | `routes/(protected-restaurant)/dashboard/orders/index.tsx` | RESTAURANT |
| `/dashboard/menu` | `routes/(protected-restaurant)/dashboard/menu/index.tsx` | RESTAURANT |
| `/dashboard/opening-hours` | `routes/(protected-restaurant)/dashboard/opening-hours/index.tsx` | RESTAURANT |
| `/dashboard/delivery-zones` | `routes/(protected-restaurant)/dashboard/delivery-zones/index.tsx` | RESTAURANT |
| `/dashboard/settings` | `routes/(protected-restaurant)/dashboard/settings/index.tsx` | RESTAURANT |
| `/deliveries` | `routes/(protected-delivery)/deliveries/index.tsx` | DELIVERY_PERSON |
| `/deliveries/:deliveryId` | `routes/(protected-delivery)/deliveries/$deliveryId.tsx` | DELIVERY_PERSON |
