# DTOs & Validierung

Bestellando nutzt **`class-validator`** + **`class-transformer`** für DTO-Validierung.

## Pattern

DTO-Klassen mit Decoratoren markieren:

```ts
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from "class-validator";
import { Type } from "class-transformer";

export class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modifierOptionIds?: string[];

  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

export class CreateOrderDto {
  @IsString()
  restaurantId: string;

  @IsString()
  deliveryAddressId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  specialInstructions?: string;
}
```

## Globale ValidationPipe

```ts
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
})
```

| Option | Verhalten |
|--------|-----------|
| `whitelist: true` | Felder ohne Decorator werden entfernt |
| `forbidNonWhitelisted: true` | wirft 400 statt zu strippen |
| `transform: true` | Query-Strings → richtiger Typ; DTOs werden Klassen-Instanzen |

## ⚠️ Whitelist-Stolperstein

Wenn ein Feld im DTO **nicht** dekoriert ist (z. B. weil vergessen), wird es bei `whitelist: true` **silent entfernt**. Das Backend sieht das Feld nie.

Beispiel-Bug:

```ts
// Frontend sendet:
{ items: [...], notes: "Bitte ohne Zwiebeln" }

// Backend-DTO erwartet:
class CreateOrderDto {
  items: ...;
  specialInstructions?: string;  // ← anderer Name!
}

// Resultat: notes wird verworfen, specialInstructions bleibt undefined
```

**Lösung**: Frontend und Backend müssen identische Feldnamen verwenden. Geteilte Typen via `@repo/interfaces`.

## Häufig genutzte Validatoren

| Decorator | Zweck |
|-----------|-------|
| `@IsString()` | String |
| `@IsNumber()` | Number |
| `@IsBoolean()` | Boolean |
| `@IsArray()` | Array |
| `@IsObject()` | Object |
| `@IsOptional()` | optional |
| `@IsEmail()` | Email-Format |
| `@IsUrl()` | URL |
| `@IsUUID()` | UUID |
| `@IsEnum(EnumType)` | enum |
| `@Min(n)` / `@Max(n)` | Number-Grenzen |
| `@MinLength(n)` / `@MaxLength(n)` | String-Länge |
| `@Matches(regex)` | Regex |
| `@ValidateNested({ each: true })` + `@Type(() => Class)` | nested DTOs |

## Beispiel: nested DTOs

`OrderItemDto` ist nested in `CreateOrderDto.items`. Damit class-validator die innere Validierung durchführt, brauchst du **beide**:

```ts
@IsArray()
@ValidateNested({ each: true })
@Type(() => OrderItemDto)         // ← class-transformer braucht das, um Plain-Object zu Klasse zu machen
items: OrderItemDto[];
```

## DTO-Verzeichnis

| DTO | Pfad |
|-----|------|
| `CreateOrderDto` | `apps/api/src/order/dto/create-order.dto.ts` |
| `UpdateOrderStatusDto` | `apps/api/src/order/dto/update-order-status.dto.ts` |
| `RestaurantFilterDto` | `apps/api/src/restaurant/dto/restaurant-filter.dto.ts` |
| `ModifierOptionDto` | `apps/api/src/modifierOption/dto/modifier-option.dto.ts` |
| `PaginationDto` | `apps/api/src/common/dto/pagination.dto.ts` |
| `RegisterDto` (Customer/Restaurant/Delivery) | aus `@repo/interfaces` |
| `CreateRestaurantDto` | aus `@repo/interfaces` |
| `CreateAddressDto` | inline in Controller |

## Shared DTOs via `@repo/interfaces`

Manche DTOs sind im Shared-Paket `@repo/interfaces` definiert (z. B. `CreateRestaurantDto`), damit Frontend und Backend dieselbe Form sehen. Diese Klassen tragen die `class-validator`-Decoratoren — funktioniert nur, wenn auch das Frontend `class-validator` als Dep hat (oder rein TypeScript-Typen exportiert).

> Stand: Frontend nutzt **Zod-Schemas** für Form-Validierung, Backend `class-validator`. Die Typen werden geteilt; die Validierungs-Engines sind separat.

## Custom Pipes

Aktuell keine Custom-Pipes im Bestellando-Code. Standard-Pipes von NestJS reichen aus.
