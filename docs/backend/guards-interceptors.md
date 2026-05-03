# Guards & Interceptors

## JwtAuthGuard

Pfad: `apps/api/src/auth/guard/jwt.guard.ts`

Globaler Guard, der auf jedem Request den `Authorization: Bearer ...`-Header erwartet und über die `JwtStrategy` validiert.

```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard("bearer") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

Registriert global im `AuthModule`:

```ts
{
  provide: APP_GUARD,
  useClass: JwtAuthGuard,
}
```

## JwtStrategy

Pfad: `apps/api/src/auth/strategy/jwt.service.ts`

Passport-Strategie, die den Bearer-Token gegen Appwrite prüft:

```ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "bearer") {
  constructor(
    private readonly appwriteService: AppwriteService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async validate(jwt: string): Promise<UserContext> {
    const client = this.appwriteService.createClientWithJwt(jwt);
    let account;
    try {
      account = await client.account.get();
    } catch {
      throw new UnauthorizedException("Invalid JWT");
    }
    return {
      id: account.$id,
      appwrite: account,
      jwt,
      client,
    };
  }
}
```

Das zurückgegebene Objekt wird als `request.user` gesetzt.

## AccessInterceptor

Pfad: `apps/api/src/auth/interceptor/access.interceptor.ts`

**Zentraler** Interceptor, der vor jedem Handler läuft und 4 Aufgaben erfüllt:

1. **`ActorContextService` setzen** mit `{ user, meta, username }` aus dem Request
2. **`@Public`** prüfen — wenn ja, alle weiteren Checks skippen
3. **`@Cooldown`** prüfen — Rate-Limiting per `(userId, endpoint)` in einer In-Memory-Map
4. **`@RequireUserType`** prüfen — `userService.getUserType()` aufrufen und mit Decorator-Liste vergleichen

```ts
@Injectable()
export class AccessInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
    private readonly actorContextService: ActorContextService,
    private readonly cooldownService: CooldownService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    // 1. ActorContext setzen
    if (request.user) {
      this.actorContextService.set({
        user: { id: request.user.id, email: request.user.appwrite?.email },
        meta: {
          ip: request.ip ?? "",
          userAgent: request.headers["user-agent"],
        },
        username: request.user.appwrite?.name,
      });
    }

    // 2. Public-Check
    const isPublic = this.reflector.get<boolean>("isPublic", handler);
    if (isPublic) return next.handle();

    // 3. Cooldown-Check
    const cooldown = this.reflector.get<number>("cooldown", handler);
    if (cooldown && request.user) {
      const ok = this.cooldownService.check(request.user.id, request.url, cooldown);
      if (!ok) throw new BadRequestException("Please wait before retrying");
    }

    // 4. UserType-Check
    const requireTypes = this.reflector.get<UserType[]>("requireUserType", handler);
    if (requireTypes?.length) {
      const userType = await this.userService.getUserType();
      if (!requireTypes.includes(userType)) {
        throw new ForbiddenException(`Requires one of: ${requireTypes.join(", ")}`);
      }
    }

    return next.handle();
  }
}
```

Registriert global:

```ts
{
  provide: APP_INTERCEPTOR,
  useClass: AccessInterceptor,
}
```

> **Wichtige Reihenfolge**: ActorContext muss **vor** dem UserType-Check gesetzt werden, weil `getUserType()` aus dem Context die User-ID liest.

## ValidationPipe (global)

In `main.ts`:

```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,                    // entfernt unbekannte Felder
  forbidNonWhitelisted: true,         // wirft 400, wenn unbekannt
  transform: true,                    // konvertiert query-Strings zu Number etc.
}));
```

`whitelist: true` ist ein Stolperstein: Wenn ein Feld nicht in der DTO-Klasse mit `class-validator`-Decoratoren markiert ist, wird es **silent verworfen**.

> Genau das war der Bug bei `notes`/`specialInstructions` im Checkout — das Frontend sendete `notes`, aber die DTO erwartete `specialInstructions`. Das Feld wurde verworfen → leere Spezialanweisungen.

## CORS

```ts
app.enableCors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
});
```

Notwendig, damit das Browser-Frontend mit der API redet.

## URI-Versioning

```ts
app.setGlobalPrefix("v1");
app.enableVersioning({ type: VersioningType.URI });
```

Resultat: alle Endpunkte unter `/v1/...`. Ermöglicht zukünftiges paralleles `/v2/`-API.
