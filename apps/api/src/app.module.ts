import { CooldownService } from './auth/service/cooldown.service';
import { ActorContextService } from './auth/service/actor-context.service';
import { AppwriteService } from './auth/service/appwrite.service';
import { AuthModule } from './auth/auth.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    AuthModule,],
  controllers: [],
  providers: [



  ],
})
export class AppModule { }
