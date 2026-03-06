import {Injectable, Scope} from '@nestjs/common';
import {JwtUser, RequestMeta} from '../interface/user-request.interface';

export type ActorContext = {
    user: JwtUser;
    meta: RequestMeta;
    username: string;
}

@Injectable({scope: Scope.REQUEST})
export class ActorContextService {

    private actorContext: ActorContext;

    set(actorContext: ActorContext) {
        this.actorContext = actorContext;
    }

    get() {
        return this.actorContext;
    }

}