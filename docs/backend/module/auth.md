# Auth-Modul

Pfad: `apps/api/src/auth/`

Verantwortlich für **Authentifizierung** und **Autorisierung** in der API.

## Datei-Übersicht

```
auth/
├── auth.module.ts
├── decorator/
│   ├── public.decorator.ts        # @Public()
│   ├── user-type.decorator.ts     # @RequireUserType([...])
│   └── cooldown.decorator.ts      # @Cooldown(...)
├── guard/
│   └── jwt.guard.ts                # JwtAuthGuard
├── interceptor/
│   └── access.interceptor.ts       # ActorContext-Setter + Decorator-Enforcer
├── interface/
│   └── user-request.interface.ts   # UserRequest = Request & { user: ... }
├── service/
│   ├── actor-context.service.ts    # REQUEST-scoped Context
│   ├── appwrite.service.ts         # Admin-Client + per-User-Client
│   └── cooldown.service.ts         # Rate-Limiting
└── strategy/
    └── jwt.service.ts              # Passport-Strategie (validate JWT against Appwrite)
```

## Auth-Flow im Detail

### 1. Frontend holt JWT

Im Frontend ([@repo/lib/appwrite.ts](../../packages/lib/src/appwrite.ts)):

```ts
const { jwt } = await appwriteAccount.createJWT();
```

Appwrite gibt einen JWT mit ~15 Minuten Lebensdauer zurück.

### 2. Request mit Bearer-Header

Frontend ruft `authenticatedFetch(...)` auf:

```http
GET /v1/order/mine HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1...
```

### 3. JwtStrategy validiert den Token

`apps/api/src/auth/strategy/jwt.service.ts`:

```ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "bearer") {
  async validate(jwt: string): Promise<UserContext> {
    const client = this.appwriteService.createClientWithJwt(jwt);
    const account = await client.account.get();  // verifiziert JWT bei Appwrite
    return {
      id: account.$id,
      appwrite: account,
      jwt,
      client,  // per-User-Client für Folge-Requests
    };
  }
}
```

Der `client` wird für **per-Nutzer-Operationen** verwendet (z. B. damit Appwrite-RLS greift). Daneben gibt es einen Admin-Client für Server-Operationen, die keine User-Identität brauchen.

### 4. AccessInterceptor

`apps/api/src/auth/interceptor/access.interceptor.ts` läuft **vor jedem Controller-Handler**:

1. **Setzt `ActorContextService`** mit `{ user, meta, username }`
2. **Liest die Decorators** des aufgerufenen Handlers via `Reflector`
3. **Prüft `@Public()`**: Wenn vorhanden, alles erlaubt
4. **Prüft `@Cooldown(...)`**: Wenn vorhanden, Rate-Limit prüfen
5. **Prüft `@RequireUserType([...])`**: Wenn vorhanden, `userService.getUserType()` aufrufen und abgleichen

> **Reihenfolge entscheidend**: `ActorContextService.set()` muss vor `getUserType()` laufen, weil letzteres aus dem Context liest.

### 5. Service nutzt den ActorContext

In jedem Service:

```ts
const userId = this.actorContextService.get().user.id;
```

Das ist immer die ID der/s aktuellen Nutzer:in.

## Decorators

### `@Public()`

[apps/api/src/auth/decorator/public.decorator.ts](../../apps/api/src/auth/decorator/public.decorator.ts)

```ts
export const Public = () => SetMetadata("isPublic", true);
```

Markiert einen Endpoint als ohne JWT erreichbar:

```ts
@Public()
@Post("register")
async register(@Body() dto: RegisterDto) { ... }
```

### `@RequireUserType([...])`

[apps/api/src/auth/decorator/user-type.decorator.ts](../../apps/api/src/auth/decorator/user-type.decorator.ts)

```ts
export const RequireUserType = (types: UserType[]) =>
  SetMetadata("requireUserType", types);
```

Erlaubt den Endpoint nur für die genannten Rollen:

```ts
@RequireUserType(["RESTAURANT"])
@Get("mine")
async getMyRestaurant() { ... }
```

Mehrere Rollen möglich: `@RequireUserType(["RESTAURANT", "ADMIN"])`.

### `@Cooldown(milliseconds)`

[apps/api/src/auth/decorator/cooldown.decorator.ts](../../apps/api/src/auth/decorator/cooldown.decorator.ts)

```ts
export const Cooldown = (ms: number) => SetMetadata("cooldown", ms);
```

Verhindert, dass derselbe User den Endpoint zu schnell erneut aufruft (per User + Endpoint memoisiert).

```ts
@Cooldown(1000)  // 1 Sekunde Cooldown
@Post()
async create() { ... }
```

## Services

### `AppwriteService`

[apps/api/src/auth/service/appwrite.service.ts](../../apps/api/src/auth/service/appwrite.service.ts)

Liefert **zwei** Arten von Appwrite-Clients:

1. **Admin-Client** (mit `APPWRITE_API_KEY`) — für Server-Operationen ohne Nutzer-Identität
2. **Per-User-Client** (mit JWT) — respektiert Appwrite-Permissions

```ts
const adminClient = appwriteService.getAdminClient();
const userClient = appwriteService.createClientWithJwt(jwt);
```

### `ActorContextService`

[apps/api/src/auth/service/actor-context.service.ts](../../apps/api/src/auth/service/actor-context.service.ts)

REQUEST-scoped Service, der den aktuellen Actor speichert. Aufgebaut auf `nestjs-cls`.

```ts
@Injectable({ scope: Scope.REQUEST })
export class ActorContextService {
  set(ctx: ActorContext): void { ... }
  get(): ActorContext { ... }
}
```

`ActorContext` enthält:

```ts
type ActorContext = {
  user: { id: string; email?: string };  // aus JWT
  meta: { ip: string; userAgent?: string };
  username?: string;
};
```

### `CooldownService`

[apps/api/src/auth/service/cooldown.service.ts](../../apps/api/src/auth/service/cooldown.service.ts)

In-Memory-Map `(userId+endpoint) → lastCallTimestamp`. Bei Treffer innerhalb des Cooldowns: `BadRequestException("Please wait before retrying")`.

> Kein Redis o. Ä. — gut genug für eine Single-Instance-API. Bei horizontaler Skalierung müsste das ersetzt werden.

## Guards

### `JwtAuthGuard`

[apps/api/src/auth/guard/jwt.guard.ts](../../apps/api/src/auth/guard/jwt.guard.ts)

```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard("bearer") {
  canActivate(ctx) {
    const isPublic = this.reflector.get("isPublic", ctx.getHandler());
    if (isPublic) return true;
    return super.canActivate(ctx);
  }
}
```

Globaler Guard, der bei `@Public()` einfach durchlässt.

## Konfiguration

`auth.module.ts` registriert:
- `JwtStrategy` als Provider
- `JwtAuthGuard` als globalen Guard (via `APP_GUARD`)
- `AccessInterceptor` als globalen Interceptor (via `APP_INTERCEPTOR`)
- Exportiert: `AppwriteService`, `ActorContextService`

## Beispiel-Nutzung

```ts
@Controller({ path: "restaurant", version: "1" })
export class RestaurantController {
  constructor(
    private readonly restaurantService: RestaurantService,
    private readonly actorContextService: ActorContextService,
  ) {}

  @Public()
  @Get()
  list() { return this.restaurantService.listAll(); }

  @RequireUserType(["RESTAURANT"])
  @Get("mine")
  myRestaurant() {
    const userId = this.actorContextService.get().user.id;
    return this.restaurantService.getRestaurantFromUser(userId);
  }

  @Cooldown(2000)
  @RequireUserType(["RESTAURANT"])
  @Post()
  create(@Body() dto: CreateRestaurantDto) { ... }
}
```
