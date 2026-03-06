import { Injectable } from "@nestjs/common";
import { ActorContextService } from "src/auth/service/actor-context.service";
import { AppwriteService } from "src/auth/service/appwrite.service";

@Injectable()
export class UserService {
  constructor(
    private readonly actorContextService: ActorContextService,
    private readonly appwriteService: AppwriteService,
  ) {}

  public async getUserType() {
    const context = this.actorContextService.get();

    const appwriteUser = context?.user?.appwrite;
    if (!appwriteUser) {
      return null;
    }
  }
}
