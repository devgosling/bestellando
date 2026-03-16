/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Scope,
  UnauthorizedException,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { CLS_ID, ClsService } from "nestjs-cls";
import { IS_PUBLIC_KEY } from "../decorator/public.decorator";
import { Reflector } from "@nestjs/core";
import { CooldownService } from "../service/cooldown.service";
import { COOLDOWN_KEY } from "../decorator/cooldown.decorator";
import { ActorContextService } from "../service/actor-context.service";
import { USER_TYPE_KEY } from "../decorator/user-type.decorator";
import { UserType } from "../../user/interface/user.interface";
import { UserService } from "../../user/service/user.service";

@Injectable({ scope: Scope.REQUEST })
export class AccessInterceptor implements NestInterceptor {
  constructor(
    private readonly clsService: ClsService,
    private readonly cooldownService: CooldownService,
    private readonly actorContextService: ActorContextService,
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const http = context.switchToHttp();
    const response = http.getResponse<any>();
    const request = http.getRequest<any>();

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredUserType = this.reflector.getAllAndOverride<UserType[]>(
      USER_TYPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const cooldownSeconds = this.reflector.get<number>(
      COOLDOWN_KEY,
      context.getHandler(),
    );

    if (isPublic && request.headers["stripe-signature"]) {
      // Allow Stripe webhooks to be public, but only if they have the stripe-signature header, which is required for Stripe webhook signature verification
      return next.handle();
    }

    const user = request.user;

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

    if (
      user &&
      requiredUserType &&
      !requiredUserType.includes(
        (await this.userService.getUserType()) || "CUSTOMER",
      )
    ) {
      throw new UnauthorizedException("Insufficient user type");
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
