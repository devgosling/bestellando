# `@repo/interfaces`

Pfad: `packages/interfaces/`

Single Source of Truth für **TypeScript-Typen** zwischen Backend und Frontend.

## Build

```bash
pnpm --filter @repo/interfaces build
```

Output: `packages/interfaces/dist/`. **Wichtig**: Nach jeder Änderung neu bauen — andere Pakete importieren aus `dist/`, nicht direkt aus `src/`.

## Inhalt

```
packages/interfaces/src/
├── index.ts                            # Re-export aller Typen
├── address.interface.ts                # AddressEntity
├── create-restaurant.dto.ts            # CreateRestaurantDto
├── delivery.interface.ts               # DeliveryEntity, DeliveryStatus
├── delivery-person.interface.ts        # DeliveryPersonEntity, VehicleType
├── delivery-zone.interface.ts          # DeliveryZoneEntity
├── modifier-option.interface.ts        # ModifierOptionEntity
├── opening-hours.interface.ts          # OpeningHoursEntity
├── order.interface.ts                  # OrderEntity, OrderStatus, PaymentStatus
├── order-item.interface.ts             # OrderItemEntity
├── order-status-history.interface.ts   # OrderStatusHistoryEntity
├── product.interface.ts                # ProductEntity
├── register.interface.ts               # RegisterDto
├── restaurant.interface.ts             # RestaurantEntity
└── ws-events.ts                        # WS-Event-Payloads
```

## Wichtige Typen

### `OrderEntity`

```ts
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "PICKED_UP"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PAID" | "REFUNDED";

export interface OrderEntity {
  $id: string;
  $createdAt?: string;
  customer: string | { $id: string; name?: string };
  restaurant: string | RestaurantEntity;
  deliveryAddress: string | AddressEntity;
  currentStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  specialInstructions?: string;
}
```

### `RestaurantEntity`

```ts
export interface RestaurantEntity {
  $id: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  isFeatured?: boolean;
  ownerId: string;
  address: string | AddressEntity;
  deliveryFee: number;
  minOrderValue: number;
  rating?: number;
  phone?: string;
  imageUrl?: string;
}
```

### `AddressEntity`

```ts
export interface AddressEntity {
  $id: string;
  userId?: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  label?: string;
  coordinates: [number, number];   // [lng, lat] (Appwrite Point)
}
```

### `ProductEntity`

```ts
export interface ProductEntity {
  $id: string;
  restaurant: string | RestaurantEntity;
  name: string;
  description?: string;
  basePrice: number;
  imageUrl?: string;
  categoryName?: string;
  isAvailable: boolean;
  isFeatured?: boolean;
}
```

### `ModifierOptionEntity`

```ts
export interface ModifierOptionEntity {
  $id: string;
  Product: string | ProductEntity;     // ⚠️ Großes P!
  name: string;
  priceDelta: number;
  groupName?: string;
  isRequired?: boolean;
  isMultiple?: boolean;
  isAvailable: boolean;
}
```

### `DeliveryEntity`

```ts
export type DeliveryStatus =
  | "PENDING_ASSIGNMENT"
  | "ASSIGNED"
  | "PICKED_UP"
  | "DELIVERED";

export interface DeliveryEntity {
  $id: string;
  order: string | OrderEntity;
  deliveryPerson: string | DeliveryPersonEntity;
  status: DeliveryStatus;
  assignedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  proofImageId?: string;
}
```

### WebSocket-Events (`ws-events.ts`)

```ts
export interface DriverLocationEvent {
  orderId: string;
  lat: number;
  lng: number;
  heading?: number;
  timestamp?: number;
}

export interface DeliveryAssignedEvent {
  orderId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicleType: "BICYCLE" | "SCOOTER" | "CAR";
  estimatedMinutes: number;
}

export interface OrderStatusChangedEvent {
  orderId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  timestamp: string;
}
```

## Verwendung

### Backend (`apps/api`)

```ts
import type { OrderStatus } from "@repo/interfaces";

const validStatuses: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING"];
```

### Frontend (`apps/web`)

```ts
import type { OrderEntity, OrderStatus } from "@repo/interfaces";

const { data } = useApiQuery<OrderEntity>({ ... });
```

## DTOs

Manche Files exportieren **DTO-Klassen** (mit `class-validator`-Decoratoren):

- `RegisterDto`
- `CreateRestaurantDto`

Diese werden **vom Backend** zur Validierung genutzt. Im Frontend bleiben sie reine Typen.

## Tipps

- **Keine Branch-Logic in Interfaces** — diese sind reine Typen
- **Beim Hinzufügen neuer Felder**: zuerst hier definieren, dann API/Web anpassen
- **Optional-Felder kennzeichnen** — wenn DB-Feld optional ist, im Typ auch
- **Union-Types statt Magic Strings** — z. B. `OrderStatus` statt `string`
