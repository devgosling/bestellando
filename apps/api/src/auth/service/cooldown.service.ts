import {HttpException, HttpStatus, Injectable} from '@nestjs/common';

@Injectable()
export class CooldownService {

    private readonly cooldowns = new Map<string, number>();

    public checkCooldown(userId: string, method: string, path: string, seconds: number) {
        const key = `${userId}:${method}:${path}`;
        const now = Date.now();
        const lastExecution = this.cooldowns.get(key);

        if (lastExecution) {
            const diff = (now - lastExecution) / 1000;
            if (diff < seconds) {
                const remaining = Math.ceil(seconds - diff);

                throw new HttpException("Please wait " + remaining + " seconds",
                    HttpStatus.TOO_MANY_REQUESTS);
            }
        }

        this.cooldowns.set(key, now);
    }

}