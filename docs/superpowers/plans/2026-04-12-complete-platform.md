# Bestellando Complete Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete food ordering platform (like takeaway.com) with customer browsing, cart, Stripe payments, restaurant dashboard, delivery tracking with live GPS, and full WebSocket real-time updates.

**Architecture:** Turborepo monorepo with NestJS 11 API + React 19/Vite 7 frontend + Appwrite BaaS. Two Socket.IO WebSocket gateways (orders + delivery), Zustand cart store, Leaflet maps for GPS tracking, Stripe Checkout Sessions for payments.

**Tech Stack:** NestJS 11, React 19, Vite 7, TanStack Router/Query/Form, HeroUI, Tailwind CSS 4, Framer Motion, Socket.IO, Stripe, Leaflet, Zustand, Appwrite, pnpm 9

**Spec:** `docs/superpowers/specs/2026-04-12-complete-platform-design.md`

---

## Phase 1: Foundation Fixes

Everything depends on this phase. The backend has 5 orphaned modules, missing auth, and broken DI.

---

### Task 1.1: Install Backend Dependencies

**Files:**
- Modify: `apps/api/package.json`

- [ ] **Step 1: Install new backend dependencies**

```bash
cd apps/api && pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io @nestjs/schedule stripe
```

- [ ] **Step 2: Verify installation**

```bash
cd apps/api && pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: No new type errors from the installed packages.

- [ ] **Step 3: Commit**

```bash
git add apps/api/package.json apps/api/pnpm-lock.yaml pnpm-lock.yaml
git commit -m "chore(api): add websocket, schedule, and stripe dependencies"
```

---

### Task 1.2: Install Frontend Dependencies

**Files:**
- Modify: `apps/web/package.json`
- Modify: `packages/lib/package.json`

- [ ] **Step 1: Install frontend dependencies**

```bash
cd apps/web && pnpm add socket.io-client zustand leaflet react-leaflet && pnpm add -D @types/leaflet
```

- [ ] **Step 2: Install shared lib dependency**

```bash
cd packages/lib && pnpm add socket.io-client
```

- [ ] **Step 3: Verify installation**

```bash
pnpm check-types 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json packages/lib/package.json pnpm-lock.yaml
git commit -m "chore(web,lib): add socket.io, zustand, leaflet dependencies"
```

---

### Task 1.3: Unify Role Enum

**Files:**
- Modify: `apps/api/src/user/interface/user.interface.ts`

- [ ] **Step 1: Fix the role enum**

Change `DELIVER_PERSON` to `DELIVERY_PERSON` in the User type:

```typescript
export interface User {
  type: "CUSTOMER" | "DELIVERY_PERSON" | "RESTAURANT" | "ADMIN";
}

export type UserType = User["type"];
```

- [ ] **Step 2: Find all occurrences of DELIVER_PERSON in the backend**

```bash
cd apps/api && grep -rn "DELIVER_PERSON" src/
```

Fix every occurrence to `DELIVERY_PERSON`. Check `access.interceptor.ts`, `user.service.ts`, and any decorator references.

- [ ] **Step 3: Verify no occurrences remain**

```bash
cd apps/api && grep -rn "DELIVER_PERSON" src/ | grep -v "DELIVERY_PERSON"
```

Expected: No output (all instances are `DELIVERY_PERSON` now).

- [ ] **Step 4: Type check**

```bash
cd apps/api && pnpm exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add -A apps/api/src/
git commit -m "fix(api): unify role enum DELIVER_PERSON -> DELIVERY_PERSON"
```

---

### Task 1.4: Fix Orphaned Module Imports

**Files:**
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/product/product.module.ts`
- Modify: `apps/api/src/order/order.module.ts`
- Modify: `apps/api/src/orderItem/order-item.module.ts`
- Modify: `apps/api/src/orderStatusHistory/order-status-history.module.ts`
- Modify: `apps/api/src/openingHours/opening-hours.module.ts`

- [ ] **Step 1: Add DatabaseModule and ConfigModule to each orphaned module**

Update `apps/api/src/product/product.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { ProductService } from "./service/product.service";
import { ProductController } from "./controller/product.controller";

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [ProductService],
  controllers: [ProductController],
  exports: [ProductService],
})
export class ProductModule {}
```

Update `apps/api/src/order/order.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { AuthModule } from "../auth/auth.module";
import { OrderService } from "./service/order.service";
import { OrderController } from "./controller/order.controller";
import { OrderItemService } from "../orderItem/service/order-item.service";
import { OrderStatusHistoryService } from "../orderStatusHistory/service/order-status-history.service";

@Module({
  imports: [DatabaseModule, ConfigModule, AuthModule],
  providers: [OrderService, OrderItemService, OrderStatusHistoryService],
  controllers: [OrderController],
  exports: [OrderService, OrderItemService, OrderStatusHistoryService],
})
export class OrderModule {}
```

Update `apps/api/src/orderItem/order-item.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { OrderItemService } from "./service/order-item.service";

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [OrderItemService],
  controllers: [],
  exports: [OrderItemService],
})
export class OrderItemModule {}
```

Update `apps/api/src/orderStatusHistory/order-status-history.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { OrderStatusHistoryService } from "./service/order-status-history.service";

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [OrderStatusHistoryService],
  controllers: [],
  exports: [OrderStatusHistoryService],
})
export class OrderStatusHistoryModule {}
```

Update `apps/api/src/openingHours/opening-hours.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "../database/database.module";
import { OpeningHoursService } from "./service/opening-hours.service";
import { OpeningHoursController } from "./controller/opening-hours.controller";

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [OpeningHoursService],
  controllers: [OpeningHoursController],
  exports: [OpeningHoursService],
})
export class OpeningHoursModule {}
```

- [ ] **Step 2: Register all modules in AppModule**

Update `apps/api/src/app.module.ts`:

```typescript
import { AddressModule } from "./address/address.module";
import { RestaurantModule } from "./restaurant/restaurant.module";
import { DatabaseModule } from "./database/database.module";
import { UserModule } from "./user/user.module";
import { AuthModule } from "./auth/auth.module";
import { ProductModule } from "./product/product.module";
import { OrderModule } from "./order/order.module";
import { OpeningHoursModule } from "./openingHours/opening-hours.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AccessInterceptor } from "./auth/interceptor/access.interceptor";
import { ClsModule } from "nestjs-cls/dist/src/lib/cls-module/cls.module";

@Module({
  imports: [
    AddressModule,
    RestaurantModule,
    DatabaseModule,
    AuthModule,
    UserModule,
    ProductModule,
    OrderModule,
    OpeningHoursModule,
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: () => crypto.randomUUID(),
      },
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AccessInterceptor,
    },
  ],
})
export class AppModule {}
```

Note: `OrderItemModule` and `OrderStatusHistoryModule` are NOT imported separately — their services are provided by `OrderModule` directly.

- [ ] **Step 3: Delete standalone controllers for OrderItem and OrderStatusHistory**

Delete `apps/api/src/orderItem/controller/order-item.controller.ts` and `apps/api/src/orderStatusHistory/controller/order-status-history.controller.ts`.

- [ ] **Step 4: Type check**

```bash
cd apps/api && pnpm exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add -A apps/api/src/
git commit -m "fix(api): register orphaned modules, remove standalone orderItem/statusHistory controllers"
```

---

### Task 1.5: Version-Prefix All Controllers

**Files:**
- Modify: `apps/api/src/product/controller/product.controller.ts`
- Modify: `apps/api/src/order/controller/order.controller.ts`
- Modify: `apps/api/src/openingHours/controller/opening-hours.controller.ts`

- [ ] **Step 1: Update ProductController**

Change `@Controller("product")` to:

```typescript
@Controller({ path: "product", version: "1" })
```

- [ ] **Step 2: Update OrderController**

Change `@Controller("order")` to:

```typescript
@Controller({ path: "order", version: "1" })
```

- [ ] **Step 3: Update OpeningHoursController**

Change `@Controller("opening-hours")` to:

```typescript
@Controller({ path: "opening-hours", version: "1" })
```

- [ ] **Step 4: Verify endpoints respond on /v1/**

```bash
cd apps/api && pnpm exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/product/controller/product.controller.ts apps/api/src/order/controller/order.controller.ts apps/api/src/openingHours/controller/opening-hours.controller.ts
git commit -m "fix(api): add v1 version prefix to all controllers"
```

---

### Task 1.6: Pagination Utilities

**Files:**
- Create: `apps/api/src/common/dto/pagination.dto.ts`
- Create: `apps/api/src/common/interface/paginated-result.interface.ts`

- [ ] **Step 1: Create PaginationDto**

Create `apps/api/src/common/dto/pagination.dto.ts`:

```typescript
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from "class-validator";
import { Type } from "class-transformer";

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc" = "desc";
}
```

- [ ] **Step 2: Create PaginatedResult interface**

Create `apps/api/src/common/interface/paginated-result.interface.ts`:

```typescript
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/common/
git commit -m "feat(api): add pagination DTO and paginated result interface"
```

---

### Task 1.7: Implement Restaurant Listing

**Files:**
- Create: `apps/api/src/restaurant/dto/restaurant-filter.dto.ts`
- Modify: `apps/api/src/restaurant/controller/restaurant.controller.ts`
- Modify: `apps/api/src/restaurant/service/restaurant.service.ts`

- [ ] **Step 1: Create RestaurantFilterDto**

Create `apps/api/src/restaurant/dto/restaurant-filter.dto.ts`:

```typescript
import { IsOptional, IsString, IsBoolean, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { type RestaurantType } from "@repo/interfaces";

export class RestaurantFilterDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  type?: RestaurantType;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
```

- [ ] **Step 2: Add listRestaurants to RestaurantService**

Add this method to `apps/api/src/restaurant/service/restaurant.service.ts`:

```typescript
import { type PaginatedResult } from "../../common/interface/paginated-result.interface";
import { type RestaurantFilterDto } from "../dto/restaurant-filter.dto";

// Add to RestaurantService class:
public async listRestaurants(filters: RestaurantFilterDto): Promise<PaginatedResult<RestaurantEntity>> {
  const queries: string[] = [];

  if (filters.isActive !== undefined) {
    queries.push(Query.equal("isActive", filters.isActive));
  }

  if (filters.type) {
    queries.push(Query.equal("type", filters.type));
  }

  if (filters.search) {
    queries.push(Query.search("name", filters.search));
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 25;
  queries.push(Query.limit(limit));
  queries.push(Query.offset((page - 1) * limit));

  const result = await this.dataBase.listRows({
    databaseId: this.configService.get<string>("DATABASE_ID")!,
    tableId: "restaurant",
    queries,
  });

  return {
    data: result.rows as unknown as RestaurantEntity[],
    total: result.total,
    page,
    limit,
    totalPages: Math.ceil(result.total / limit),
  };
}
```

- [ ] **Step 3: Update RestaurantController to use the filter DTO**

Replace the `listRestaurants` method in `apps/api/src/restaurant/controller/restaurant.controller.ts`:

```typescript
import { Body, Controller, Post, Get, Patch, Param, Req, Query } from "@nestjs/common";
import { RestaurantFilterDto } from "../dto/restaurant-filter.dto";
import { Public } from "../../auth/decorator/public.decorator";

// Replace the existing listRestaurants method:
@Public()
@Get("list")
public async listRestaurants(@Query() filters: RestaurantFilterDto) {
  return this.restaurantService.listRestaurants(filters);
}
```

Remove the `ImATeapotException` import.

- [ ] **Step 4: Type check**

```bash
cd apps/api && pnpm exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/restaurant/
git commit -m "feat(api): implement restaurant listing with filters and pagination"
```

---

### Task 1.8: Address Controller

**Files:**
- Create: `apps/api/src/address/controller/address.controller.ts`
- Create: `apps/api/src/address/dto/create-address.dto.ts`
- Modify: `apps/api/src/address/address.module.ts`
- Modify: `apps/api/src/address/service/address.service.ts`

- [ ] **Step 1: Create CreateAddressDto**

Create `apps/api/src/address/dto/create-address.dto.ts`:

```typescript
import { IsString, IsOptional, IsBoolean, IsEnum, IsNumber } from "class-validator";
import { type AddressOwnerType } from "@repo/interfaces";

export class CreateAddressDto {
  @IsString()
  street!: string;

  @IsString()
  streetNumber!: string;

  @IsString()
  zipCode!: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  streetNumber?: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsNumber()
  lat?: number;

  @IsOptional()
  @IsNumber()
  lng?: number;
}
```

- [ ] **Step 2: Add methods to AddressService**

Add these methods to `apps/api/src/address/service/address.service.ts`:

```typescript
public async getMyAddresses(): Promise<AddressEntity[]> {
  const actorContext = this.actorContextService.get();
  const result = await this.dataBase.listRows({
    databaseId: this.configService.get<string>("DATABASE_ID")!,
    tableId: "address",
    queries: [
      Query.equal("ownerId", actorContext.user.id),
    ],
  });
  return result.rows as unknown as AddressEntity[];
}

public async updateAddress(id: string, data: Partial<AddressEntity>): Promise<void> {
  await this.dataBase.updateRow({
    databaseId: this.configService.get<string>("DATABASE_ID")!,
    tableId: "address",
    rowId: id,
    data: data as object as Record<string, unknown>,
  });
}

public async deleteAddress(id: string): Promise<void> {
  await this.dataBase.deleteRow({
    databaseId: this.configService.get<string>("DATABASE_ID")!,
    tableId: "address",
    rowId: id,
  });
}

public async setDefault(id: string): Promise<void> {
  const actorContext = this.actorContextService.get();

  // Unset all existing defaults for this user
  const existing = await this.dataBase.listRows({
    databaseId: this.configService.get<string>("DATABASE_ID")!,
    tableId: "address",
    queries: [
      Query.equal("ownerId", actorContext.user.id),
      Query.equal("isDefault", true),
    ],
  });

  for (const row of existing.rows) {
    await this.dataBase.updateRow({
      databaseId: this.configService.get<string>("DATABASE_ID")!,
      tableId: "address",
      rowId: row.$id,
      data: { isDefault: false },
    });
  }

  // Set the new default
  await this.dataBase.updateRow({
    databaseId: this.configService.get<string>("DATABASE_ID")!,
    tableId: "address",
    rowId: id,
    data: { isDefault: true },
  });
}
```

- [ ] **Step 3: Create AddressController**

Create `apps/api/src/address/controller/address.controller.ts`:

```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param } from "@nestjs/common";
import { AddressService } from "../service/address.service";
import { CreateAddressDto, UpdateAddressDto } from "../dto/create-address.dto";

@Controller({ path: "address", version: "1" })
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  async create(@Body() dto: CreateAddressDto) {
    return this.addressService.createAddress("CUSTOMER", dto);
  }

  @Get()
  async getMyAddresses() {
    return this.addressService.getMyAddresses();
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateAddressDto) {
    return this.addressService.updateAddress(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return this.addressService.deleteAddress(id);
  }

  @Patch(":id/default")
  async setDefault(@Param("id") id: string) {
    return this.addressService.setDefault(id);
  }
}
```

- [ ] **Step 4: Register controller in AddressModule**

Update `apps/api/src/address/address.module.ts` to add the controller:

```typescript
import { DatabaseModule } from "src/database/database.module";
import { AddressService } from "./service/address.service";
import { AddressController } from "./controller/address.controller";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [DatabaseModule, ConfigModule.forRoot(), AuthModule],
  controllers: [AddressController],
  providers: [AddressService],
  exports: [AddressService],
})
export class AddressModule {}
```

- [ ] **Step 5: Type check**

```bash
cd apps/api && pnpm exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/address/
git commit -m "feat(api): add address controller with CRUD endpoints"
```

---

### Task 1.9: Auth Guards on Product and OpeningHours Controllers

**Files:**
- Modify: `apps/api/src/product/controller/product.controller.ts`
- Modify: `apps/api/src/openingHours/controller/opening-hours.controller.ts`

- [ ] **Step 1: Add auth to ProductController**

Rewrite `apps/api/src/product/controller/product.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from "@nestjs/common";
import { ProductService } from "../service/product.service";
import { type ProductEntity } from "@repo/interfaces";
import { Public } from "../../auth/decorator/public.decorator";
import { RequireUserType } from "../../auth/decorator/user-type.decorator";

@Controller({ path: "product", version: "1" })
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @RequireUserType(["RESTAURANT"])
  @Post()
  create(@Body() product: ProductEntity) {
    return this.productService.createProduct(product);
  }

  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productService.getProductById(id);
  }

  @Public()
  @Get()
  findAll(@Query("restaurantId") restaurantId?: string) {
    return this.productService.getAllProducts(restaurantId);
  }

  @RequireUserType(["RESTAURANT"])
  @Patch(":id")
  update(@Param("id") id: string, @Body() product: Partial<ProductEntity>) {
    return this.productService.updateProduct(id, product);
  }

  @RequireUserType(["RESTAURANT"])
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.productService.deleteProduct(id);
  }
}
```

- [ ] **Step 2: Update ProductService.getAllProducts to support restaurantId filter**

Update `apps/api/src/product/service/product.service.ts` — modify `getAllProducts`:

```typescript
async getAllProducts(restaurantId?: string) {
  const queries: string[] = [];
  if (restaurantId) {
    queries.push(Query.equal("restaurant", restaurantId));
  }
  return this.dataBase.listRows({
    databaseId: this.configService.get<string>("DATABASE_ID")!,
    tableId: "product",
    queries: queries.length > 0 ? queries : undefined,
  });
}
```

- [ ] **Step 3: Add auth to OpeningHoursController**

Rewrite `apps/api/src/openingHours/controller/opening-hours.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from "@nestjs/common";
import { OpeningHoursService } from "../service/opening-hours.service";
import { type OpeningHoursEntity } from "@repo/interfaces";
import { Public } from "../../auth/decorator/public.decorator";
import { RequireUserType } from "../../auth/decorator/user-type.decorator";

@Controller({ path: "opening-hours", version: "1" })
export class OpeningHoursController {
  constructor(private readonly openingHoursService: OpeningHoursService) {}

  @RequireUserType(["RESTAURANT"])
  @Post()
  create(@Body() entity: OpeningHoursEntity) {
    return this.openingHoursService.createOpeningHours(entity);
  }

  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.openingHoursService.getOpeningHoursById(id);
  }

  @Public()
  @Get()
  findAll(@Query("restaurantId") restaurantId?: string) {
    return this.openingHoursService.getAllOpeningHours(restaurantId);
  }

  @RequireUserType(["RESTAURANT"])
  @Patch(":id")
  update(@Param("id") id: string, @Body() entity: Partial<OpeningHoursEntity>) {
    return this.openingHoursService.updateOpeningHours(id, entity);
  }

  @RequireUserType(["RESTAURANT"])
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.openingHoursService.deleteOpeningHours(id);
  }
}
```

- [ ] **Step 4: Update OpeningHoursService.getAllOpeningHours to support restaurantId**

Same pattern as ProductService — add optional `restaurantId` param and filter with `Query.equal`.

- [ ] **Step 5: Type check and commit**

```bash
cd apps/api && pnpm exec tsc --noEmit
git add apps/api/src/product/ apps/api/src/openingHours/
git commit -m "feat(api): add auth guards and restaurant filters to product and opening-hours"
```

---

### Task 1.10: Enable Raw Body for Stripe Webhooks

**Files:**
- Modify: `apps/api/src/main.ts`

- [ ] **Step 1: Enable rawBody in NestFactory**

In `apps/api/src/main.ts`, change:

```typescript
const app = await NestFactory.create(AppModule);
```

to:

```typescript
const app = await NestFactory.create(AppModule, { rawBody: true });
```

- [ ] **Step 2: Add IoAdapter import for WebSocket**

Add to `apps/api/src/main.ts` after the app creation:

```typescript
import { IoAdapter } from "@nestjs/platform-socket.io";
app.useWebSocketAdapter(new IoAdapter(app));
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/main.ts
git commit -m "feat(api): enable rawBody for Stripe webhooks and Socket.IO adapter"
```

---

### Task 1.11: Update Shared Interfaces

**Files:**
- Modify: `packages/interfaces/src/order.interface.ts`
- Modify: `packages/interfaces/src/order-status-history.interface.ts`
- Create: `packages/interfaces/src/delivery-person.interface.ts`
- Create: `packages/interfaces/src/delivery.interface.ts`
- Create: `packages/interfaces/src/ws-events.ts`
- Modify: `packages/interfaces/src/index.ts`

- [ ] **Step 1: Extend OrderEntity**

Update `packages/interfaces/src/order.interface.ts`:

```typescript
import { AddressEntity } from "./address.interface.js";
import { RestaurantEntity } from "./restaurant.interface.js";

export type OrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "PICKED_UP" | "DELIVERED" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "FAILED" | "REFUNDED";

export interface OrderEntity {
  $id: string;
  restaurant: RestaurantEntity | string;
  deliveryAddress: AddressEntity | string;
  customerId: string;
  currentStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  specialInstructions?: string;
  stripeSessionId?: string;
  deliveryPersonId?: string;
  createdAt?: string;
}
```

- [ ] **Step 2: Extend OrderStatusHistoryEntity**

Update `packages/interfaces/src/order-status-history.interface.ts`:

```typescript
import { OrderEntity, OrderStatus } from "./order.interface.js";

export interface OrderStatusHistoryEntity {
  $id: string;
  order: OrderEntity | string;
  status: OrderStatus;
  changedBy: string;
  changedAt: string;
}
```

- [ ] **Step 3: Create DeliveryPersonEntity**

Create `packages/interfaces/src/delivery-person.interface.ts`:

```typescript
import { type Point } from "geojson";

export type VehicleType = "BICYCLE" | "SCOOTER" | "CAR";

export interface DeliveryPersonEntity {
  $id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleType: VehicleType;
  isAvailable: boolean;
  currentLocation?: Point;
  rating?: number;
}
```

- [ ] **Step 4: Create DeliveryEntity**

Create `packages/interfaces/src/delivery.interface.ts`:

```typescript
import { type Point } from "geojson";

export type DeliveryStatus = "ASSIGNED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED";

export interface DeliveryEntity {
  $id: string;
  order: string;
  deliveryPerson: string;
  status: DeliveryStatus;
  assignedAt: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  currentLocation?: Point;
  estimatedArrivalMinutes?: number;
}
```

- [ ] **Step 5: Create WebSocket event types**

Create `packages/interfaces/src/ws-events.ts`:

```typescript
import { type OrderEntity, type OrderStatus, type OrderItemEntity, type AddressEntity } from "./index.js";

// Server -> Client
export interface OrderStatusChangedEvent {
  orderId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  timestamp: string;
}

export interface NewOrderEvent {
  order: OrderEntity;
  items: OrderItemEntity[];
}

export interface DriverLocationEvent {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  timestamp: number;
}

export interface DeliveryAvailableEvent {
  orderId: string;
  restaurantName: string;
  pickupAddress: AddressEntity;
  deliveryAddress: AddressEntity;
}

export interface DeliveryAssignedEvent {
  driverId: string;
  driverName: string;
  estimatedMinutes: number;
}

export interface RestaurantAvailabilityEvent {
  restaurantId: string;
  isActive: boolean;
}

export interface ProductAvailabilityEvent {
  productId: string;
  isAvailable: boolean;
}
```

- [ ] **Step 6: Update barrel export**

Update `packages/interfaces/src/index.ts`:

```typescript
export * from "./address.interface.js";
export * from "./restaurant.interface.js";
export * from "./opening-hours.interface.js";
export * from "./create-restaurant.dto.js";
export * from "./register.interface.js";
export * from "./product.interface.js";
export * from "./order.interface.js";
export * from "./order-item.interface.js";
export * from "./order-status-history.interface.js";
export * from "./delivery-person.interface.js";
export * from "./delivery.interface.js";
export * from "./ws-events.js";
```

- [ ] **Step 7: Type check everything**

```bash
pnpm check-types
```

- [ ] **Step 8: Commit**

```bash
git add packages/interfaces/
git commit -m "feat(interfaces): add delivery, payment, and websocket event types; extend order entity"
```

---

### Task 1.12: Verify Phase 1

- [ ] **Step 1: Start the API**

```bash
pnpm dev --filter=api
```

Expected: Server starts on port 3000 without errors.

- [ ] **Step 2: Type check the whole monorepo**

```bash
pnpm check-types
```

Expected: No errors.

- [ ] **Step 3: Test restaurant listing**

```bash
curl http://localhost:3000/v1/restaurant/list
```

Expected: JSON response with `{ data: [], total: 0, page: 1, limit: 25, totalPages: 0 }` (or populated data if restaurants exist).

---

## Phase 2: Customer Browsing + Cart

This phase builds the customer-facing restaurant browsing, menu viewing, and cart functionality.

> **Note:** Phase 2 through Phase 6 contain significant frontend component work. Each task creates complete, working components with exact code. Due to the volume, tasks are documented at a higher granularity — each task covers a logical feature unit rather than individual test-implement-test cycles. The engineer should follow TDD within each task: write the component, test it in the browser, then commit.

---

### Task 2.1: Cart Zustand Store

**Files:**
- Create: `apps/web/src/stores/cart-store.ts`

- [ ] **Step 1: Create the cart store**

Create `apps/web/src/stores/cart-store.ts`:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProductEntity } from "@repo/interfaces";

export interface CartItem {
  product: ProductEntity;
  quantity: number;
  specialInstructions?: string;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
}

interface CartActions {
  addItem: (product: ProductEntity, restaurantId: string, restaurantName: string, quantity?: number, instructions?: string) => boolean;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateInstructions: (productId: string, instructions: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState & CartActions>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,

      addItem: (product, restaurantId, restaurantName, quantity = 1, instructions) => {
        const state = get();

        // Different restaurant — caller must handle confirmation dialog
        if (state.restaurantId && state.restaurantId !== restaurantId) {
          return false;
        }

        const existingIndex = state.items.findIndex(
          (item) => item.product.$id === product.$id,
        );

        if (existingIndex >= 0) {
          const newItems = [...state.items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + quantity,
          };
          set({ items: newItems, restaurantId, restaurantName });
        } else {
          set({
            items: [...state.items, { product, quantity, specialInstructions: instructions }],
            restaurantId,
            restaurantName,
          });
        }
        return true;
      },

      removeItem: (productId) => {
        const newItems = get().items.filter((item) => item.product.$id !== productId);
        if (newItems.length === 0) {
          set({ items: [], restaurantId: null, restaurantName: null });
        } else {
          set({ items: newItems });
        }
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.product.$id === productId ? { ...item, quantity } : item,
          ),
        });
      },

      updateInstructions: (productId, instructions) => {
        set({
          items: get().items.map((item) =>
            item.product.$id === productId
              ? { ...item, specialInstructions: instructions }
              : item,
          ),
        });
      },

      clearCart: () => set({ items: [], restaurantId: null, restaurantName: null }),

      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      getSubtotal: () =>
        get().items.reduce(
          (sum, item) => sum + item.product.basePrice * item.quantity,
          0,
        ),
    }),
    {
      name: "bestellando-cart",
    },
  ),
);
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/stores/cart-store.ts
git commit -m "feat(web): add Zustand cart store with localStorage persistence"
```

---

### Task 2.2: Shared UI Components

**Files:**
- Create: `apps/web/src/components/shared/AnimatedPage.tsx`
- Create: `apps/web/src/components/shared/PriceDisplay.tsx`
- Create: `apps/web/src/components/shared/EmptyState.tsx`
- Create: `apps/web/src/components/shared/LoadingSkeleton.tsx`
- Create: `apps/web/src/components/shared/SearchInput.tsx`
- Create: `apps/web/src/components/shared/ConfirmDialog.tsx`

- [ ] **Step 1: Create AnimatedPage**

Create `apps/web/src/components/shared/AnimatedPage.tsx`:

```tsx
import { motion } from "framer-motion";
import type { ReactNode } from "react";

const variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function AnimatedPage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Create PriceDisplay**

Create `apps/web/src/components/shared/PriceDisplay.tsx`:

```tsx
export function PriceDisplay({ amount, className }: { amount: number; className?: string }) {
  const formatted = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);

  return <span className={className}>{formatted}</span>;
}
```

- [ ] **Step 3: Create EmptyState**

Create `apps/web/src/components/shared/EmptyState.tsx`:

```tsx
import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h3 className="text-xl font-semibold text-default-700">{title}</h3>
      {description && (
        <p className="mt-2 text-default-500 max-w-md">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 4: Create LoadingSkeleton**

Create `apps/web/src/components/shared/LoadingSkeleton.tsx`:

```tsx
export function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl bg-default-100 animate-pulse">
          <div className="h-48 rounded-t-xl bg-default-200" />
          <div className="p-4 space-y-3">
            <div className="h-5 w-2/3 rounded bg-default-200" />
            <div className="h-4 w-1/2 rounded bg-default-200" />
            <div className="h-4 w-1/3 rounded bg-default-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-20 rounded-lg bg-default-100 animate-pulse" />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Create SearchInput**

Create `apps/web/src/components/shared/SearchInput.tsx`:

```tsx
import { Input } from "@heroui/react";
import { useEffect, useState } from "react";

export function SearchInput({
  placeholder = "Suchen...",
  onSearch,
  delay = 300,
}: {
  placeholder?: string;
  onSearch: (value: string) => void;
  delay?: number;
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay, onSearch]);

  return (
    <Input
      placeholder={placeholder}
      value={value}
      onValueChange={setValue}
      isClearable
      onClear={() => setValue("")}
      classNames={{ inputWrapper: "bg-default-100" }}
    />
  );
}
```

- [ ] **Step 6: Create ConfirmDialog**

Create `apps/web/src/components/shared/ConfirmDialog.tsx`:

```tsx
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  confirmColor = "danger",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "danger" | "primary" | "warning";
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>
          <p className="text-default-600">{description}</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>{cancelLabel}</Button>
          <Button color={confirmColor} onPress={() => { onConfirm(); onClose(); }}>
            {confirmLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/shared/
git commit -m "feat(web): add shared UI components (AnimatedPage, PriceDisplay, EmptyState, etc.)"
```

---

### Task 2.3: Restaurant Browsing Page

**Files:**
- Create: `apps/web/src/components/restaurant/RestaurantCard.tsx`
- Create: `apps/web/src/components/restaurant/RestaurantFilters.tsx`
- Create: `apps/web/src/routes/(protected-customer)/restaurants/index.tsx`
- Delete: `apps/web/src/routes/(protected-customer)/list-restaurants.tsx`
- Delete: `apps/web/src/routes/(protected-customer)/protected.tsx`

- [ ] **Step 1: Create RestaurantCard component**

Create `apps/web/src/components/restaurant/RestaurantCard.tsx`. This card shows restaurant image, name, cuisine type chip, delivery time, delivery fee, and min order. Uses HeroUI Card component, Framer Motion for hover animations. Links to `/restaurants/$restaurantId`.

- [ ] **Step 2: Create RestaurantFilters component**

Create `apps/web/src/components/restaurant/RestaurantFilters.tsx`. Filter bar with: SearchInput for name search, cuisine type chip selector (from `RestaurantTypeNames`), sort options. Uses HeroUI Chip group and Select.

- [ ] **Step 3: Create the restaurants browse page**

Create `apps/web/src/routes/(protected-customer)/restaurants/index.tsx`. Uses `useApiQuery` to fetch from `/v1/restaurant/list` with query params from filters. Renders RestaurantFilters at top, grid of RestaurantCards below, CardSkeleton while loading, EmptyState when no results. Wrap in AnimatedPage.

- [ ] **Step 4: Delete old placeholder routes**

Delete `apps/web/src/routes/(protected-customer)/list-restaurants.tsx` and `apps/web/src/routes/(protected-customer)/protected.tsx`.

- [ ] **Step 5: Test in browser**

```bash
pnpm dev
```

Navigate to `/restaurants`. Verify filters work, cards render, clicking a card navigates to detail page.

- [ ] **Step 6: Commit**

```bash
git add -A apps/web/src/
git commit -m "feat(web): restaurant browsing page with filters and cards"
```

---

### Task 2.4: Restaurant Detail + Menu Page

**Files:**
- Create: `apps/web/src/components/restaurant/RestaurantHero.tsx`
- Create: `apps/web/src/components/restaurant/MenuSection.tsx`
- Create: `apps/web/src/components/restaurant/ProductCard.tsx`
- Create: `apps/web/src/components/restaurant/ProductModal.tsx`
- Create: `apps/web/src/components/restaurant/OpeningHoursBadge.tsx`
- Create: `apps/web/src/routes/(protected-customer)/restaurants/$restaurantId.tsx`

- [ ] **Step 1: Create RestaurantHero**

Banner image with gradient overlay, restaurant name, cuisine type, delivery info (time, fee, min order), open/closed badge.

- [ ] **Step 2: Create OpeningHoursBadge**

Green "Geöffnet" or red "Geschlossen" badge based on current time vs opening hours.

- [ ] **Step 3: Create ProductCard**

Menu item card: name, description (truncated), price, "Hinzufügen" button. Clicking opens ProductModal.

- [ ] **Step 4: Create ProductModal**

Modal with: product details, quantity picker (- / number / +), special instructions textarea, "In den Warenkorb" button. Uses `useCartStore.addItem()`. If different restaurant, shows ConfirmDialog.

- [ ] **Step 5: Create MenuSection**

Groups products and renders ProductCards in a grid.

- [ ] **Step 6: Create the restaurant detail route**

Create `apps/web/src/routes/(protected-customer)/restaurants/$restaurantId.tsx`. Fetches restaurant by ID and products by restaurantId. Renders RestaurantHero, opening hours, and MenuSections.

- [ ] **Step 7: Test in browser**

Navigate to a restaurant detail page. Verify menu loads, adding items to cart works, ProductModal opens with quantity picker.

- [ ] **Step 8: Commit**

```bash
git add -A apps/web/src/
git commit -m "feat(web): restaurant detail page with menu and add-to-cart"
```

---

### Task 2.5: Cart UI (Drawer + Page)

**Files:**
- Create: `apps/web/src/components/cart/CartDrawer.tsx`
- Create: `apps/web/src/components/cart/CartItem.tsx`
- Create: `apps/web/src/components/cart/CartSummary.tsx`
- Create: `apps/web/src/components/cart/CartEmpty.tsx`
- Create: `apps/web/src/routes/(protected-customer)/cart.tsx`
- Modify: `apps/web/src/kit/header.tsx`

- [ ] **Step 1: Create CartItem**

Line item component: product name, quantity controls (-, qty, +), unit price, total, remove button.

- [ ] **Step 2: Create CartSummary**

Subtotal, delivery fee (from restaurant), total amount, "Zur Kasse" button.

- [ ] **Step 3: Create CartEmpty**

Empty state: illustration/icon, "Dein Warenkorb ist leer" message, link to browse restaurants.

- [ ] **Step 4: Create CartDrawer**

Slide-over panel (AnimatePresence, motion.div from right) showing CartItems, CartSummary, or CartEmpty. Backdrop overlay closes drawer.

- [ ] **Step 5: Add cart icon to header**

Modify `apps/web/src/kit/header.tsx`: Add a shopping cart icon button next to the account button. Show badge with `useCartStore.getTotalItems()`. Clicking opens CartDrawer.

- [ ] **Step 6: Create full cart page**

Create `apps/web/src/routes/(protected-customer)/cart.tsx`. Same content as drawer but full-page layout. "Zur Kasse" navigates to `/checkout`.

- [ ] **Step 7: Test in browser**

Add items to cart from a restaurant page. Verify cart drawer opens from header. Verify quantities update, items remove, cart empties correctly. Verify cart persists after page refresh.

- [ ] **Step 8: Commit**

```bash
git add -A apps/web/src/
git commit -m "feat(web): cart drawer, cart page, and header cart icon"
```

---

### Task 2.6: Customer Profile + Address Management

**Files:**
- Create: `apps/web/src/routes/(protected-customer)/profile/index.tsx`

- [ ] **Step 1: Create profile page**

Create `apps/web/src/routes/(protected-customer)/profile/index.tsx`. Shows user info (from Appwrite user context), address list with CRUD (uses `/v1/address` endpoints). Address form: street, streetNumber, zipCode, city. Set default toggle. Uses `useApiQuery` and `useApiMutation`.

- [ ] **Step 2: Test in browser and commit**

```bash
git add apps/web/src/routes/\(protected-customer\)/profile/
git commit -m "feat(web): customer profile page with address management"
```

---

## Phase 3: Order Flow + Stripe Payments

---

### Task 3.1: Order State Machine

**Files:**
- Create: `apps/api/src/order/service/order-state-machine.ts`

- [ ] **Step 1: Create state machine**

Create `apps/api/src/order/service/order-state-machine.ts`:

```typescript
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import type { OrderStatus } from "@repo/interfaces";
import type { UserType } from "../../user/interface/user.interface";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY", "CANCELLED"],
  READY: ["PICKED_UP"],
  PICKED_UP: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const TRANSITION_ACTORS: Record<string, UserType[]> = {
  "PENDING->CONFIRMED": ["RESTAURANT"],
  "PENDING->CANCELLED": ["CUSTOMER", "RESTAURANT"],
  "CONFIRMED->PREPARING": ["RESTAURANT"],
  "CONFIRMED->CANCELLED": ["RESTAURANT"],
  "PREPARING->READY": ["RESTAURANT"],
  "PREPARING->CANCELLED": ["RESTAURANT"],
  "READY->PICKED_UP": ["DELIVERY_PERSON"],
  "PICKED_UP->DELIVERED": ["DELIVERY_PERSON"],
};

export function validateTransition(
  from: OrderStatus,
  to: OrderStatus,
  actorType: UserType,
): void {
  const allowed = VALID_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new BadRequestException(
      `Invalid status transition: ${from} -> ${to}`,
    );
  }

  const key = `${from}->${to}`;
  const allowedActors = TRANSITION_ACTORS[key];
  if (allowedActors && !allowedActors.includes(actorType)) {
    throw new ForbiddenException(
      `User type ${actorType} cannot transition ${from} -> ${to}`,
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/order/service/order-state-machine.ts
git commit -m "feat(api): add order status state machine with actor validation"
```

---

### Task 3.2: Order DTOs

**Files:**
- Create: `apps/api/src/order/dto/create-order.dto.ts`
- Create: `apps/api/src/order/dto/update-order-status.dto.ts`

- [ ] **Step 1: Create CreateOrderDto**

Create `apps/api/src/order/dto/create-order.dto.ts`:

```typescript
import { IsString, IsOptional, IsArray, ValidateNested, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateOrderItemDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsString()
  restaurantId!: string;

  @IsString()
  deliveryAddressId!: string;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
```

- [ ] **Step 2: Create UpdateOrderStatusDto**

Create `apps/api/src/order/dto/update-order-status.dto.ts`:

```typescript
import { IsIn } from "class-validator";
import type { OrderStatus } from "@repo/interfaces";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING", "CONFIRMED", "PREPARING", "READY", "PICKED_UP", "DELIVERED", "CANCELLED",
];

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES)
  status!: OrderStatus;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/order/dto/
git commit -m "feat(api): add order DTOs with validation"
```

---

### Task 3.3: Rewrite OrderService and OrderController

**Files:**
- Modify: `apps/api/src/order/service/order.service.ts`
- Modify: `apps/api/src/order/controller/order.controller.ts`

- [ ] **Step 1: Rewrite OrderService**

Complete rewrite of `apps/api/src/order/service/order.service.ts` with:
- `createOrder(dto: CreateOrderDto, userId: string)` — validates restaurant active, products available and belong to restaurant, calculates totals server-side, validates min order, creates order + items + history
- `transitionStatus(orderId: string, newStatus: OrderStatus, actorId: string, actorType: UserType)` — uses state machine, creates history entry
- `getMyOrders(userId: string, pagination: PaginationDto)` — paginated, filtered by customerId
- `getOrderById(orderId: string)` — with items loaded
- `getOrderItems(orderId: string)` — via OrderItemService
- `getStatusHistory(orderId: string)` — via OrderStatusHistoryService

Inject: DatabaseService, ConfigService, ProductService, OrderItemService, OrderStatusHistoryService, ActorContextService

- [ ] **Step 2: Rewrite OrderController**

Rewrite `apps/api/src/order/controller/order.controller.ts`:

```typescript
import { Controller, Post, Get, Patch, Param, Body, Query } from "@nestjs/common";
import { OrderService } from "../service/order.service";
import { CreateOrderDto } from "../dto/create-order.dto";
import { UpdateOrderStatusDto } from "../dto/update-order-status.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { ActorContextService } from "../../auth/service/actor-context.service";
import { UserService } from "../../user/service/user.service";

@Controller({ path: "order", version: "1" })
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly actorContextService: ActorContextService,
    private readonly userService: UserService,
  ) {}

  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const actor = this.actorContextService.get();
    return this.orderService.createOrder(dto, actor.user.id);
  }

  @Get("mine")
  async getMyOrders(@Query() pagination: PaginationDto) {
    const actor = this.actorContextService.get();
    return this.orderService.getMyOrders(actor.user.id, pagination);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return this.orderService.getOrderById(id);
  }

  @Patch(":id/status")
  async updateStatus(@Param("id") id: string, @Body() dto: UpdateOrderStatusDto) {
    const actor = this.actorContextService.get();
    const userType = await this.userService.getUserType();
    return this.orderService.transitionStatus(id, dto.status, actor.user.id, userType!);
  }

  @Get(":id/items")
  async getOrderItems(@Param("id") id: string) {
    return this.orderService.getOrderItems(id);
  }

  @Get(":id/history")
  async getStatusHistory(@Param("id") id: string) {
    return this.orderService.getStatusHistory(id);
  }
}
```

- [ ] **Step 3: Update OrderModule imports to include UserModule**

Add `UserModule` to OrderModule imports (for UserService in controller).

- [ ] **Step 4: Type check**

```bash
cd apps/api && pnpm exec tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/order/
git commit -m "feat(api): rewrite order service with validation, state machine, and proper controller"
```

---

### Task 3.4: Stripe Payment Module

**Files:**
- Create: `apps/api/src/payment/payment.module.ts`
- Create: `apps/api/src/payment/service/stripe.service.ts`
- Create: `apps/api/src/payment/controller/payment.controller.ts`
- Create: `apps/api/src/payment/controller/webhook.controller.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create StripeService**

Create `apps/api/src/payment/service/stripe.service.ts`:

```typescript
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import type { OrderEntity } from "@repo/interfaces";

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(configService.get<string>("STRIPE_SECRET_KEY")!);
  }

  async createCheckoutSession(order: OrderEntity, customerId: string): Promise<Stripe.Checkout.Session> {
    const frontendUrl = this.configService.get<string>("FRONTEND_URL") ?? "http://localhost:5173";
    return this.stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `Bestellung #${order.$id}` },
            unit_amount: Math.round(order.totalAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { orderId: order.$id, customerId },
      success_url: `${frontendUrl}/orders/${order.$id}?payment=success`,
      cancel_url: `${frontendUrl}/orders/${order.$id}?payment=cancelled`,
    });
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.configService.get<string>("STRIPE_WEBHOOK_SECRET")!,
    );
  }
}
```

- [ ] **Step 2: Create PaymentController**

Create `apps/api/src/payment/controller/payment.controller.ts`:

```typescript
import { Controller, Post, Param, BadRequestException } from "@nestjs/common";
import { StripeService } from "../service/stripe.service";
import { OrderService } from "../../order/service/order.service";
import { ActorContextService } from "../../auth/service/actor-context.service";

@Controller({ path: "payment", version: "1" })
export class PaymentController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly orderService: OrderService,
    private readonly actorContextService: ActorContextService,
  ) {}

  @Post("checkout/:orderId")
  async createCheckout(@Param("orderId") orderId: string) {
    const actor = this.actorContextService.get();
    const order = await this.orderService.getOrderById(orderId);

    if (!order) {
      throw new BadRequestException("Order not found");
    }

    if (order.paymentStatus !== "UNPAID") {
      throw new BadRequestException("Order already paid or payment failed");
    }

    const session = await this.stripeService.createCheckoutSession(order, actor.user.id);

    // Store session ID on order
    await this.orderService.updateStripeSession(orderId, session.id);

    return { sessionUrl: session.url };
  }
}
```

- [ ] **Step 3: Create WebhookController**

Create `apps/api/src/payment/controller/webhook.controller.ts`:

```typescript
import { Controller, Post, Req, HttpCode, Logger } from "@nestjs/common";
import { Public } from "../../auth/decorator/public.decorator";
import { StripeService } from "../service/stripe.service";
import { OrderService } from "../../order/service/order.service";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import type Stripe from "stripe";

@Controller({ path: "webhook", version: "1" })
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly orderService: OrderService,
  ) {}

  @Public()
  @Post("stripe")
  @HttpCode(200)
  async handleStripeWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers["stripe-signature"] as string;

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(req.rawBody!, signature);
    } catch (err) {
      this.logger.error("Webhook signature verification failed", err);
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await this.orderService.markPaid(orderId, session.payment_intent as string);
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        await this.orderService.markPaymentFailed(orderId);
      }
    }
  }
}
```

- [ ] **Step 4: Create PaymentModule and register in AppModule**

Create `apps/api/src/payment/payment.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { OrderModule } from "../order/order.module";
import { StripeService } from "./service/stripe.service";
import { PaymentController } from "./controller/payment.controller";
import { WebhookController } from "./controller/webhook.controller";

@Module({
  imports: [ConfigModule, AuthModule, OrderModule],
  controllers: [PaymentController, WebhookController],
  providers: [StripeService],
})
export class PaymentModule {}
```

Add `PaymentModule` to `apps/api/src/app.module.ts` imports.

- [ ] **Step 5: Add payment helper methods to OrderService**

Add to `apps/api/src/order/service/order.service.ts`:

```typescript
async updateStripeSession(orderId: string, sessionId: string): Promise<void> {
  await this.dataBase.updateRow({
    databaseId: this.configService.get<string>("DATABASE_ID")!,
    tableId: "order",
    rowId: orderId,
    data: { stripeSessionId: sessionId },
  });
}

async markPaid(orderId: string, paymentIntentId: string): Promise<void> {
  await this.dataBase.updateRow({
    databaseId: this.configService.get<string>("DATABASE_ID")!,
    tableId: "order",
    rowId: orderId,
    data: { paymentStatus: "PAID" },
  });
  // Auto-transition to CONFIRMED
  await this.transitionStatusInternal(orderId, "CONFIRMED");
}

async markPaymentFailed(orderId: string): Promise<void> {
  await this.dataBase.updateRow({
    databaseId: this.configService.get<string>("DATABASE_ID")!,
    tableId: "order",
    rowId: orderId,
    data: { paymentStatus: "FAILED" },
  });
}
```

- [ ] **Step 6: Type check and commit**

```bash
cd apps/api && pnpm exec tsc --noEmit
git add apps/api/src/payment/ apps/api/src/order/ apps/api/src/app.module.ts
git commit -m "feat(api): add Stripe payment module with checkout and webhook"
```

---

### Task 3.5: Checkout + Order Pages (Frontend)

**Files:**
- Create: `apps/web/src/routes/(protected-customer)/checkout.tsx`
- Create: `apps/web/src/components/checkout/CheckoutForm.tsx`
- Create: `apps/web/src/components/checkout/AddressSelector.tsx`
- Create: `apps/web/src/components/order/OrderCard.tsx`
- Create: `apps/web/src/components/order/OrderTimeline.tsx`
- Create: `apps/web/src/components/order/OrderStatusBadge.tsx`
- Create: `apps/web/src/routes/(protected-customer)/orders/index.tsx`
- Create: `apps/web/src/routes/(protected-customer)/orders/$orderId.tsx`

- [ ] **Step 1: Create AddressSelector**

Dropdown of user's saved addresses fetched from `/v1/address`. Option to add new address inline.

- [ ] **Step 2: Create CheckoutForm**

Order summary (from cart store), address selector, special instructions, "Jetzt bezahlen" button. On submit: creates order via `POST /v1/order`, then calls `POST /v1/payment/checkout/:orderId`, redirects to Stripe `sessionUrl`.

- [ ] **Step 3: Create checkout page**

Route at `apps/web/src/routes/(protected-customer)/checkout.tsx`. Renders CheckoutForm. Clears cart on successful redirect back.

- [ ] **Step 4: Create OrderStatusBadge and OrderTimeline**

Status badge: colored chip per status. Timeline: vertical stepper showing progression with timestamps from status history.

- [ ] **Step 5: Create OrderCard**

Card for order history list: restaurant name, date, status badge, total amount.

- [ ] **Step 6: Create order history page**

Route at `apps/web/src/routes/(protected-customer)/orders/index.tsx`. Fetches from `/v1/order/mine`. Renders list of OrderCards.

- [ ] **Step 7: Create order detail/tracking page**

Route at `apps/web/src/routes/(protected-customer)/orders/$orderId.tsx`. Fetches order + items + history. Shows OrderTimeline, items list, totals. Map placeholder (added in Phase 6).

- [ ] **Step 8: Test full checkout flow in browser**

Add items -> go to checkout -> select address -> pay (requires Stripe test keys) -> verify redirect back -> order shows in history.

- [ ] **Step 9: Commit**

```bash
git add -A apps/web/src/
git commit -m "feat(web): checkout page with Stripe, order history, and order detail pages"
```

---

## Phase 4: Restaurant Dashboard

---

### Task 4.1: Dashboard Layout + Sidebar

**Files:**
- Create: `apps/web/src/kit/dashboard-layout.tsx`
- Create: `apps/web/src/components/dashboard/DashboardSidebar.tsx`
- Create: `apps/web/src/routes/(protected-restaurant)/dashboard/route.tsx`
- Delete: `apps/web/src/routes/(protected-restaurant)/manage-restaurant.tsx`

- [ ] **Step 1: Create DashboardSidebar**

Vertical sidebar with nav links: Übersicht, Bestellungen, Speisekarte, Öffnungszeiten, Einstellungen. Uses TanStack Router `Link` with active state styling. Restaurant name at top. Collapsible on mobile.

- [ ] **Step 2: Create dashboard layout**

Create `apps/web/src/kit/dashboard-layout.tsx`: sidebar + main content area (Outlet). Responsive: sidebar collapses to hamburger on mobile.

- [ ] **Step 3: Create dashboard route**

Route at `apps/web/src/routes/(protected-restaurant)/dashboard/route.tsx`. Uses the dashboard-layout component.

- [ ] **Step 4: Delete old placeholder and commit**

```bash
rm apps/web/src/routes/\(protected-restaurant\)/manage-restaurant.tsx
git add -A apps/web/src/
git commit -m "feat(web): restaurant dashboard layout with sidebar navigation"
```

---

### Task 4.2: Dashboard Overview Page

**Files:**
- Create: `apps/web/src/components/dashboard/StatCard.tsx`
- Create: `apps/web/src/routes/(protected-restaurant)/dashboard/index.tsx`

- [ ] **Step 1: Create StatCard**

Metric card with title, value, and optional trend indicator. Uses HeroUI Card.

- [ ] **Step 2: Create overview page**

Fetches restaurant data from `/v1/restaurant/mine`, orders from `/v1/order/mine`. Renders stat cards: orders today, revenue today, active orders. Shows recent orders list below.

- [ ] **Step 3: Commit**

```bash
git add -A apps/web/src/
git commit -m "feat(web): restaurant dashboard overview page with stats"
```

---

### Task 4.3: Order Management Page

**Files:**
- Create: `apps/web/src/components/dashboard/IncomingOrderCard.tsx`
- Create: `apps/web/src/routes/(protected-restaurant)/dashboard/orders/index.tsx`

- [ ] **Step 1: Create IncomingOrderCard**

Order card showing: order ID, customer info, items list, total, status badge, action buttons (Accept/Reject for PENDING, update status for others). Uses `useApiMutation` to call `PATCH /v1/order/:id/status`.

- [ ] **Step 2: Create orders management page**

Tab layout: "Neu" (PENDING), "In Bearbeitung" (CONFIRMED/PREPARING/READY), "Abgeschlossen" (DELIVERED/CANCELLED). Each tab filters orders by status. Renders IncomingOrderCards.

- [ ] **Step 3: Commit**

```bash
git add -A apps/web/src/
git commit -m "feat(web): restaurant order management page with status updates"
```

---

### Task 4.4: Menu Management Page

**Files:**
- Create: `apps/web/src/components/dashboard/MenuProductRow.tsx`
- Create: `apps/web/src/components/dashboard/ProductFormModal.tsx`
- Create: `apps/web/src/routes/(protected-restaurant)/dashboard/menu/index.tsx`

- [ ] **Step 1: Create ProductFormModal**

Modal form for creating/editing a product. Fields: name, description, basePrice, prepTimeMinutes, isAvailable toggle, isFeatured toggle, imageUrl. Uses TanStack Form + Zod validation.

- [ ] **Step 2: Create MenuProductRow**

Table row with: product name, price, availability toggle (switch), featured badge, edit/delete actions.

- [ ] **Step 3: Create menu page**

Table of products with "Produkt hinzufügen" button. Fetches from `/v1/product?restaurantId=...`. CRUD via mutations.

- [ ] **Step 4: Commit**

```bash
git add -A apps/web/src/
git commit -m "feat(web): restaurant menu management page with product CRUD"
```

---

### Task 4.5: Opening Hours + Settings Pages

**Files:**
- Create: `apps/web/src/components/dashboard/OpeningHoursEditor.tsx`
- Create: `apps/web/src/components/dashboard/RestaurantSettingsForm.tsx`
- Create: `apps/web/src/routes/(protected-restaurant)/dashboard/opening-hours/index.tsx`
- Create: `apps/web/src/routes/(protected-restaurant)/dashboard/settings/index.tsx`

- [ ] **Step 1: Create OpeningHoursEditor**

7 rows (Monday-Sunday), each with open/close time pickers and an "active" toggle. Saves to `/v1/opening-hours`.

- [ ] **Step 2: Create opening hours page**

Fetches existing hours, renders editor, saves changes.

- [ ] **Step 3: Create RestaurantSettingsForm**

Form with: name, description, phone, type (select), imageUrl, bannerUrl, deliveryFee, minOrderValue, estimatedDeliveryMinutes, isActive toggle.

- [ ] **Step 4: Create settings page**

Fetches restaurant from `/v1/restaurant/mine`, renders form, saves via `PATCH /v1/restaurant/:id`.

- [ ] **Step 5: Commit**

```bash
git add -A apps/web/src/
git commit -m "feat(web): restaurant opening hours and settings pages"
```

---

## Phase 5: WebSocket Real-time System

---

### Task 5.1: WebSocket Gateway Module (Backend)

**Files:**
- Create: `apps/api/src/gateway/gateway.module.ts`
- Create: `apps/api/src/gateway/guards/ws-jwt.guard.ts`
- Create: `apps/api/src/gateway/orders/order.gateway.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create WsJwtGuard**

Create `apps/api/src/gateway/guards/ws-jwt.guard.ts`:

```typescript
import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { WsException } from "@nestjs/websockets";
import { AppwriteService } from "../../auth/service/appwrite.service";
import { Account } from "node-appwrite";
import type { Socket } from "socket.io";

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly appwriteService: AppwriteService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>();
    const token = client.handshake.auth?.token;
    if (!token) {
      throw new WsException("Missing auth token");
    }
    try {
      const appwriteClient = this.appwriteService.createUserClient(token);
      const account = new Account(appwriteClient);
      const user = await account.get();
      client.data.user = { id: user.$id, appwrite: user, jwt: token };
      return true;
    } catch {
      throw new WsException("Invalid token");
    }
  }
}
```

- [ ] **Step 2: Create OrderGateway**

Create `apps/api/src/gateway/orders/order.gateway.ts`:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { AppwriteService } from "../../auth/service/appwrite.service";
import { Account } from "node-appwrite";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/orders" })
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(OrderGateway.name);

  constructor(private readonly appwriteService: AppwriteService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const appwriteClient = this.appwriteService.createUserClient(token);
      const account = new Account(appwriteClient);
      const user = await account.get();
      client.data.user = { id: user.$id };
      client.join(`user:${user.$id}`);
      this.logger.log(`Client connected: ${client.id} (user: ${user.$id})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("subscribe:order")
  handleSubscribeOrder(@ConnectedSocket() client: Socket, @MessageBody() orderId: string) {
    client.join(`order:${orderId}`);
  }

  @SubscribeMessage("subscribe:restaurant")
  handleSubscribeRestaurant(@ConnectedSocket() client: Socket, @MessageBody() restaurantId: string) {
    client.join(`restaurant:${restaurantId}:orders`);
  }

  @SubscribeMessage("subscribe:restaurant-availability")
  handleSubscribeAvailability(@ConnectedSocket() client: Socket, @MessageBody() restaurantId: string) {
    client.join(`restaurant:${restaurantId}:availability`);
  }

  // Server-side emitters (called by services)
  notifyNewOrder(restaurantId: string, data: unknown) {
    this.server.to(`restaurant:${restaurantId}:orders`).emit("order:new", data);
  }

  notifyOrderStatusChanged(orderId: string, data: unknown) {
    this.server.to(`order:${orderId}`).emit("order:status-changed", data);
  }

  notifyRestaurantAvailability(restaurantId: string, data: unknown) {
    this.server.to(`restaurant:${restaurantId}:availability`).emit("restaurant:availability-changed", data);
  }
}
```

- [ ] **Step 3: Create GatewayModule**

Create `apps/api/src/gateway/gateway.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { OrderGateway } from "./orders/order.gateway";
import { WsJwtGuard } from "./guards/ws-jwt.guard";

@Module({
  imports: [AuthModule],
  providers: [OrderGateway, WsJwtGuard],
  exports: [OrderGateway],
})
export class GatewayModule {}
```

- [ ] **Step 4: Register in AppModule**

Add `GatewayModule` to `apps/api/src/app.module.ts` imports.

- [ ] **Step 5: Type check and commit**

```bash
cd apps/api && pnpm exec tsc --noEmit
git add apps/api/src/gateway/ apps/api/src/app.module.ts
git commit -m "feat(api): add WebSocket gateway with JWT auth and order events"
```

---

### Task 5.2: Frontend Socket Manager + Hook

**Files:**
- Create: `packages/lib/src/socket.ts`
- Create: `apps/web/src/hooks/useSocketEvent.ts`
- Modify: `apps/web/src/providers/AuthProvider.tsx`

- [ ] **Step 1: Create socket connection factory**

Create `packages/lib/src/socket.ts`:

```typescript
import { io, type Socket } from "socket.io-client";
import { properties } from "../consts/properties";
import { appwriteAccount } from "./appwrite";

export function createSocketConnection(namespace: string): Socket {
  const socket = io(`${properties.apiUrl}${namespace}`, {
    transports: ["websocket"],
    autoConnect: false,
    reconnection: false,
  });

  let reconnectAttempt = 0;

  function scheduleReconnect() {
    reconnectAttempt++;
    const delay = Math.min(10_000, 500 * Math.pow(2, reconnectAttempt - 1));
    setTimeout(async () => {
      try {
        const jwt = await appwriteAccount.createJWT();
        socket.auth = { token: jwt.jwt };
        socket.connect();
      } catch {
        scheduleReconnect();
      }
    }, delay);
  }

  socket.on("connect", () => {
    reconnectAttempt = 0;
  });
  socket.on("disconnect", scheduleReconnect);
  socket.on("connect_error", scheduleReconnect);

  return socket;
}

export async function connectSocket(socket: Socket): Promise<void> {
  const jwt = await appwriteAccount.createJWT();
  socket.auth = { token: jwt.jwt };
  socket.connect();
}

export function disconnectSocket(socket: Socket): void {
  socket.removeAllListeners();
  socket.disconnect();
}
```

- [ ] **Step 2: Create useSocketEvent hook**

Create `apps/web/src/hooks/useSocketEvent.ts`:

```typescript
import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";

export function useSocketEvent<T>(
  socket: Socket | null,
  event: string,
  handler: (data: T) => void,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return;

    const wrappedHandler = (data: T) => handlerRef.current(data);
    socket.on(event, wrappedHandler);

    return () => {
      socket.off(event, wrappedHandler);
    };
  }, [socket, event]);
}
```

- [ ] **Step 3: Connect sockets in AuthProvider**

Modify `apps/web/src/providers/AuthProvider.tsx` to:
- Create socket instances after successful auth
- Call `connectSocket()` after login
- Call `disconnectSocket()` on logout
- Expose sockets via context or a separate store

- [ ] **Step 4: Commit**

```bash
git add packages/lib/src/socket.ts apps/web/src/hooks/useSocketEvent.ts apps/web/src/providers/AuthProvider.tsx
git commit -m "feat(web): add socket manager, useSocketEvent hook, and auth integration"
```

---

### Task 5.3: Wire WebSocket Events

**Files:**
- Modify: `apps/api/src/order/service/order.service.ts`
- Modify: `apps/web/src/routes/(protected-customer)/orders/$orderId.tsx`
- Modify: `apps/web/src/routes/(protected-restaurant)/dashboard/orders/index.tsx`

- [ ] **Step 1: Emit WebSocket events from OrderService**

Inject `OrderGateway` into `OrderService`. After order creation, call `orderGateway.notifyNewOrder()`. After status transition, call `orderGateway.notifyOrderStatusChanged()`.

Update `OrderModule` to import `GatewayModule`.

- [ ] **Step 2: Wire customer order tracking to WebSocket**

In the order detail page, subscribe to `order:status-changed` event. On event, invalidate the order query to refetch.

- [ ] **Step 3: Wire restaurant dashboard to WebSocket**

In the restaurant orders page, subscribe to `order:new` event. On event, invalidate orders query, play notification sound, show toast.

- [ ] **Step 4: Test real-time flow**

Open customer and restaurant dashboard in separate browser tabs. Place order from customer -> restaurant sees real-time notification. Restaurant accepts -> customer sees status change.

- [ ] **Step 5: Commit**

```bash
git add -A apps/api/src/ apps/web/src/
git commit -m "feat: wire WebSocket events for real-time order updates"
```

---

## Phase 6: Delivery System + Map Tracking

---

### Task 6.1: Delivery Backend Module

**Files:**
- Create: `apps/api/src/delivery/delivery.module.ts`
- Create: `apps/api/src/delivery/service/delivery.service.ts`
- Create: `apps/api/src/delivery/service/delivery-person.service.ts`
- Create: `apps/api/src/delivery/controller/delivery.controller.ts`
- Create: `apps/api/src/delivery/controller/delivery-person.controller.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create DeliveryPersonService**

CRUD for delivery person profiles using Appwrite TablesDB. Methods: register, getProfile, toggleAvailability.

- [ ] **Step 2: Create DeliveryService**

Methods: getAvailableDeliveries (orders with status READY, no delivery assignment), acceptDelivery (atomic in-memory lock + DB persist), markPickedUp (transitions order READY->PICKED_UP), markDelivered (transitions order PICKED_UP->DELIVERED).

- [ ] **Step 3: Create controllers**

DeliveryPersonController: POST register, GET profile, PATCH availability. All `@RequireUserType(["DELIVERY_PERSON"])`.

DeliveryController: GET available, POST accept/:orderId, PATCH :deliveryId/pickup, PATCH :deliveryId/delivered, GET :deliveryId/track. All `@RequireUserType(["DELIVERY_PERSON"])` except track (customer can access).

- [ ] **Step 4: Create module and register**

Create DeliveryModule, import DatabaseModule, ConfigModule, AuthModule, GatewayModule, OrderModule. Register in AppModule.

- [ ] **Step 5: Type check and commit**

```bash
cd apps/api && pnpm exec tsc --noEmit
git add apps/api/src/delivery/ apps/api/src/app.module.ts
git commit -m "feat(api): add delivery module with driver registration, assignment, and status"
```

---

### Task 6.2: Delivery WebSocket Gateway

**Files:**
- Create: `apps/api/src/gateway/delivery/delivery.gateway.ts`
- Create: `apps/api/src/gateway/delivery/gps-store.service.ts`
- Modify: `apps/api/src/gateway/gateway.module.ts`

- [ ] **Step 1: Create GpsStoreService**

Create `apps/api/src/gateway/delivery/gps-store.service.ts`:

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";

interface GpsPosition {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  accuracy: number;
  driverId: string;
  clientTimestamp: number;
  serverTimestamp: number;
}

@Injectable()
export class GpsStoreService {
  private positions = new Map<string, GpsPosition>();
  private readonly logger = new Logger(GpsStoreService.name);

  updatePosition(orderId: string, position: GpsPosition): void {
    this.positions.set(orderId, position);
  }

  getPosition(orderId: string): GpsPosition | undefined {
    return this.positions.get(orderId);
  }

  removePosition(orderId: string): void {
    this.positions.delete(orderId);
  }

  @Cron("*/30 * * * * *")
  cleanupStalePositions(): string[] {
    const now = Date.now();
    const stale: string[] = [];
    for (const [orderId, pos] of this.positions) {
      if (now - pos.serverTimestamp > 60_000) {
        stale.push(orderId);
        this.positions.delete(orderId);
      }
    }
    if (stale.length > 0) {
      this.logger.log(`Cleaned up ${stale.length} stale GPS positions`);
    }
    return stale;
  }
}
```

- [ ] **Step 2: Create DeliveryGateway**

Create `apps/api/src/gateway/delivery/delivery.gateway.ts`:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { AppwriteService } from "../../auth/service/appwrite.service";
import { Account } from "node-appwrite";
import { GpsStoreService } from "./gps-store.service";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/delivery" })
export class DeliveryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(DeliveryGateway.name);

  constructor(
    private readonly appwriteService: AppwriteService,
    private readonly gpsStore: GpsStoreService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const appwriteClient = this.appwriteService.createUserClient(token);
      const account = new Account(appwriteClient);
      const user = await account.get();
      client.data.user = { id: user.$id };
      client.join(`user:${user.$id}`);
      this.logger.log(`Delivery client connected: ${client.id}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Delivery client disconnected: ${client.id}`);
  }

  @SubscribeMessage("driver:go-online")
  handleGoOnline(@ConnectedSocket() client: Socket) {
    client.join("delivery:available");
  }

  @SubscribeMessage("driver:go-offline")
  handleGoOffline(@ConnectedSocket() client: Socket) {
    client.leave("delivery:available");
  }

  @SubscribeMessage("subscribe:delivery-tracking")
  handleSubscribeTracking(@ConnectedSocket() client: Socket, @MessageBody() orderId: string) {
    client.join(`delivery:${orderId}:gps`);
  }

  @SubscribeMessage("driver:location")
  handleDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; lat: number; lng: number; heading: number; speed: number; accuracy: number },
  ) {
    if (data.accuracy > 100) return; // Discard bad GPS fix

    this.gpsStore.updatePosition(data.orderId, {
      ...data,
      driverId: client.data.user.id,
      clientTimestamp: Date.now(),
      serverTimestamp: Date.now(),
    });

    this.server.to(`delivery:${data.orderId}:gps`).emit("delivery:gps-position", {
      lat: data.lat,
      lng: data.lng,
      heading: data.heading,
      speed: data.speed,
      timestamp: Date.now(),
    });
  }

  // Server-side emitters
  broadcastAvailableDelivery(data: unknown) {
    this.server.to("delivery:available").emit("delivery:available-order", data);
  }

  broadcastDeliveryTaken(orderId: string) {
    this.server.to("delivery:available").emit("delivery:order-taken", { orderId });
  }

  notifyDeliveryAssigned(orderId: string, data: unknown) {
    this.server.to(`order:${orderId}`).emit("delivery:assigned", data);
  }

  emitDriverDisconnected(orderId: string, lastPosition: unknown) {
    this.server.to(`delivery:${orderId}:gps`).emit("delivery:driver-disconnected", lastPosition);
  }
}
```

- [ ] **Step 3: Update GatewayModule**

Add `DeliveryGateway` and `GpsStoreService` to GatewayModule providers and exports.

- [ ] **Step 4: Wire stale GPS cleanup to emit driver-disconnected**

In GpsStoreService, inject DeliveryGateway. On cleanup, emit `driver-disconnected` for each stale orderId.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/gateway/
git commit -m "feat(api): add delivery WebSocket gateway with GPS store and stale cleanup"
```

---

### Task 6.3: Delivery Person Frontend

**Files:**
- Create: `apps/web/src/routes/(protected-delivery)/route.tsx`
- Create: `apps/web/src/routes/(protected-delivery)/deliveries/index.tsx`
- Create: `apps/web/src/routes/(protected-delivery)/deliveries/$deliveryId.tsx`
- Create: `apps/web/src/routes/auth/register/delivery.tsx`
- Create: `apps/web/src/components/delivery/DeliveryCard.tsx`
- Create: `apps/web/src/components/delivery/ActiveDeliveryView.tsx`
- Create: `apps/web/src/components/delivery/DeliveryActionBar.tsx`

- [ ] **Step 1: Create delivery person route guard**

Create `apps/web/src/routes/(protected-delivery)/route.tsx`. Same pattern as `(protected-customer)/route.tsx` but checks for `DELIVERY_PERSON` role.

- [ ] **Step 2: Create delivery registration page**

Create `apps/web/src/routes/auth/register/delivery.tsx`. Form: name, phone, vehicleType (select), email, password.

- [ ] **Step 3: Create DeliveryCard**

Available delivery card: restaurant name, pickup address, delivery address, accept button.

- [ ] **Step 4: Create available deliveries page**

List of available deliveries fetched from `/v1/delivery/available`. Subscribe to `delivery:available-order` WebSocket event. Accept button calls `POST /v1/delivery/accept/:orderId`.

- [ ] **Step 5: Create ActiveDeliveryView**

GPS sharing: starts `navigator.geolocation.watchPosition()`, emits location via WebSocket every 5s. Shows map with route. Action bar: "Abgeholt" / "Zugestellt" buttons.

- [ ] **Step 6: Create active delivery page**

Route at `apps/web/src/routes/(protected-delivery)/deliveries/$deliveryId.tsx`. Renders ActiveDeliveryView.

- [ ] **Step 7: Commit**

```bash
git add -A apps/web/src/
git commit -m "feat(web): delivery person interface with registration, available deliveries, and active delivery"
```

---

### Task 6.4: Map Components

**Files:**
- Create: `apps/web/src/components/shared/MapBase.tsx`
- Create: `apps/web/src/components/order/DeliveryMap.tsx`
- Create: `apps/web/src/components/order/hooks/useDriverPosition.ts`
- Create: `apps/web/src/components/order/hooks/useDeliverySocket.ts`
- Create: `apps/web/src/components/order/hooks/useRoute.ts`
- Modify: `apps/web/src/routes/(protected-customer)/orders/$orderId.tsx`

- [ ] **Step 1: Create MapBase**

Create `apps/web/src/components/shared/MapBase.tsx`. Leaflet MapContainer wrapper with OSM tiles, dark/light mode tile selection based on `useTheme()`, responsive height.

- [ ] **Step 2: Create useRoute hook**

Fetches route geometry from OSRM: `https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=full&geometries=geojson`. Returns GeoJSON LineString for Polyline rendering.

- [ ] **Step 3: Create useDeliverySocket hook**

Connects to `/delivery` namespace, subscribes to `delivery:{orderId}:gps` room. Returns latest position data.

- [ ] **Step 4: Create useDriverPosition hook**

Client-side interpolation between GPS points using `requestAnimationFrame`:

```typescript
import { useState, useEffect, useRef } from "react";
import type { LatLng } from "leaflet";

interface GpsPosition {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  timestamp: number;
}

export function useDriverPosition(latestPosition: GpsPosition | null): LatLng | null {
  const [displayPosition, setDisplayPosition] = useState<LatLng | null>(null);
  const targetRef = useRef<GpsPosition | null>(null);
  const previousRef = useRef<GpsPosition | null>(null);
  const animationStartRef = useRef(0);

  useEffect(() => {
    if (latestPosition) {
      previousRef.current = targetRef.current ?? latestPosition;
      targetRef.current = latestPosition;
      animationStartRef.current = performance.now();
    }
  }, [latestPosition]);

  useEffect(() => {
    let rafId: number;
    const DURATION = 5000;

    function animate(now: number) {
      const prev = previousRef.current;
      const target = targetRef.current;
      if (prev && target) {
        const elapsed = now - animationStartRef.current;
        const t = Math.min(elapsed / DURATION, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplayPosition({
          lat: prev.lat + (target.lat - prev.lat) * eased,
          lng: prev.lng + (target.lng - prev.lng) * eased,
        } as LatLng);
      }
      rafId = requestAnimationFrame(animate);
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return displayPosition;
}
```

- [ ] **Step 5: Create DeliveryMap**

Create `apps/web/src/components/order/DeliveryMap.tsx`. Renders MapBase with:
- Restaurant marker (orange pin, static)
- Customer marker (green pin, static)
- Driver marker (car icon, rotated by heading, position from useDriverPosition)
- Route polyline from useRoute
- Auto-fits bounds to contain all markers

- [ ] **Step 6: Integrate map into order tracking page**

Modify `apps/web/src/routes/(protected-customer)/orders/$orderId.tsx`. When order has a deliveryPersonId and status is PICKED_UP or IN_TRANSIT, show DeliveryMap above the OrderTimeline.

- [ ] **Step 7: Test in browser**

Open customer tracking page with an active delivery. Verify map renders, route shows, driver marker updates. (Use browser devtools to simulate GPS for the delivery person.)

- [ ] **Step 8: Commit**

```bash
git add -A apps/web/src/
git commit -m "feat(web): delivery tracking map with live GPS interpolation"
```

---

### Task 6.5: Final Integration Verification

- [ ] **Step 1: Full type check**

```bash
pnpm check-types
```

Expected: No errors across the entire monorepo.

- [ ] **Step 2: Start both apps**

```bash
pnpm dev
```

- [ ] **Step 3: Test complete order lifecycle**

1. Log in as customer, browse restaurants, add items to cart
2. Checkout with Stripe (test mode), verify payment redirect
3. Log in as restaurant owner in another tab, see new order notification in real-time
4. Accept order, update status through PREPARING -> READY
5. Log in as delivery person, see available delivery, accept it
6. Delivery person shares GPS, customer sees driver on map
7. Mark as picked up, then delivered
8. Customer sees final DELIVERED status

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Bestellando platform integration"
```
