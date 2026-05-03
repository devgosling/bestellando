# Decorators

NestJS-Decorators, die Bestellando bereitstellt.

## `@Public()`

Pfad: `apps/api/src/auth/decorator/public.decorator.ts`

Markiert einen Endpoint als ohne JWT erreichbar.

```ts
import { Public } from "../auth/decorator/public.decorator";

@Public()
@Get()
list() { ... }
```

Implementierung:

```ts
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

Wird vom `JwtAuthGuard` ausgewertet.

## `@RequireUserType([...])`

Pfad: `apps/api/src/auth/decorator/user-type.decorator.ts`

Erlaubt den Endpoint nur für die genannten User-Rollen.

```ts
@RequireUserType(["RESTAURANT"])
@Get("mine")
myRestaurant() { ... }

@RequireUserType(["RESTAURANT", "ADMIN"])
@Patch(":id")
update() { ... }
```

Implementierung:

```ts
export const REQUIRE_USER_TYPE_KEY = "requireUserType";
export const RequireUserType = (types: UserType[]) =>
  SetMetadata(REQUIRE_USER_TYPE_KEY, types);
```

Wird vom `AccessInterceptor` ausgewertet, der `userService.getUserType()` aufruft.

## `@Cooldown(ms)`

Pfad: `apps/api/src/auth/decorator/cooldown.decorator.ts`

Begrenzt, wie schnell ein User denselben Endpoint erneut aufrufen darf.

```ts
@Cooldown(2000)  // 2 Sekunden
@Post("register")
register() { ... }
```

Implementierung:

```ts
export const COOLDOWN_KEY = "cooldown";
export const Cooldown = (ms: number) => SetMetadata(COOLDOWN_KEY, ms);
```

Der `AccessInterceptor` prüft `(userId, endpoint) → lastCallTimestamp` im `CooldownService`. Bei Treffer:

```
BadRequestException("Please wait before retrying")
```

## Standard-NestJS-Decorators

Diese sind nicht eigene, aber für Bestellando wichtig:

| Decorator | Zweck |
|-----------|-------|
| `@Controller({ path, version })` | Route-Prefix |
| `@Get` / `@Post` / `@Patch` / `@Delete` | HTTP-Method |
| `@Param("id")` | URL-Param |
| `@Query("name")` | Query-Param |
| `@Body()` | Request-Body |
| `@Headers("x-...")` | Headers |
| `@Req()` / `@Res()` | Express Request/Response |
| `@UploadedFile()` | Multer-Upload |
| `@WebSocketGateway()` | WS-Gateway |
| `@SubscribeMessage()` | WS-Event-Handler |
| `@WebSocketServer()` | Server-Inject |

## Beispiel: vollständige Controller-Definition

```ts
@Controller({ path: "restaurant", version: "1" })
export class RestaurantController {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly actorContextService: ActorContextService,
  ) {}

  @Public()
  @Get()
  list(@Query() filter: RestaurantFilterDto) {
    return this.restaurantService.listAll(filter);
  }

  @Public()
  @Get(":id")
  getById(@Param("id") id: string) {
    return this.restaurantService.getById(id);
  }

  @RequireUserType(["RESTAURANT"])
  @Get("mine")
  mine() {
    const userId = this.actorContextService.get().user.id;
    return this.restaurantService.getRestaurantFromUser(userId);
  }

  @Cooldown(2000)
  @Public()
  @Post("register")
  register(@Body() dto: RegisterRestaurantDto) {
    return this.restaurantService.register(dto);
  }

  @RequireUserType(["RESTAURANT"])
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateRestaurantDto) {
    return this.restaurantService.update(id, dto);
  }
}
```
