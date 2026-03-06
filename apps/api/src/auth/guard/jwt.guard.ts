import {ExecutionContext, Injectable, Logger} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {IS_PUBLIC_KEY} from '../decorator/public.decorator';
import {AuthGuard} from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard(['jwt']) {
    private readonly logger: Logger;

    constructor(private readonly reflector: Reflector) {
        super();
    }

    async canActivate(context: ExecutionContext) {
         
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            try {
                await super.canActivate(context);
            } catch {
                // do nothing, endpoint is publicly allowed, but try to use user session
            }
            return true;
        }
        const canActivate = await super.canActivate(context);
        return !!canActivate;
    }
}