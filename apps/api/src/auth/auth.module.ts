/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { JwtStrategy } from './strategy/jwt.service';
import { ActorContextService } from './service/actor-context.service';
import { AppwriteService } from './service/appwrite.service';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { CooldownService } from './service/cooldown.service';

@Module({
    imports: [
        ConfigModule.forRoot(),
        PassportModule
    ],
    controllers: [],
    providers: [JwtStrategy, ActorContextService, AppwriteService, CooldownService],
})
export class AuthModule {}
