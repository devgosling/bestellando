import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
  Scope,
  UnauthorizedException,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { CLS_ID, ClsService } from "nestjs-cls";
import { IS_PUBLIC_KEY } from "../decorator/public.decorator";
import { JwtUser } from "../interface/user-request.interface";
import { Reflector } from "@nestjs/core";
import { CooldownService } from "../service/cooldown.service";
import { COOLDOWN_KEY } from "../decorator/cooldown.decorator";
import { ActorContextService } from "../service/actor-context.service";

@Injectable({ scope: Scope.REQUEST })
export class AccessInterceptor implements NestInterceptor {
  constructor(
    private readonly clsService: ClsService,
    private readonly cooldownService: CooldownService,
    private readonly actorContextService: ActorContextService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const http = context.switchToHttp();
    const response = http.getResponse();
    const request = http.getRequest();

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const cooldownSeconds = this.reflector.get<number>(
      COOLDOWN_KEY,
      context.getHandler(),
    );

    if (isPublic && request.headers["stripe-signature"]) {
      // Allow Stripe webhooks to be public, but only if they have the stripe-signature header, which is required for Stripe webhook signature verification
      return next.handle();
    }

    const user = request.user as JwtUser;

    if (!user && !isPublic) {
      throw new UnauthorizedException();
    }

    if (user && cooldownSeconds) {
      this.cooldownService.checkCooldown(
        user.id,
        request.route.method,
        request.route.path,
        cooldownSeconds,
      );
    }

    request.meta = {
      ipAddress:
        request.headers["x-real-ip"] ??
        request.connection.remoteAddress ??
        "Unknown",
      userAgent: request.headers["user-agent"] ?? "Unknown",
    };

    if (user) {
      this.actorContextService.set({
        user,
        meta: request.meta,
        username:
          request.user.appwrite.name ||
          request.user.appwrite.email ||
          "Unknown",
      });
    }

    this.clsService.enter();
    this.clsService.set(CLS_ID, crypto.randomUUID());

    if (request.method === "POST") {
      response.status(200);
    }

    return next.handle().pipe(
      tap(async (data) => {
        await data;

        response.setHeader("trace-id", this.clsService.getId());
      }),
    );
  }
}
