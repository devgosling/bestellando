import { Injectable } from "@nestjs/common";
import { ActorContextService } from "src/auth/service/actor-context.service";
import { AppwriteService } from "src/auth/service/appwrite.service";
import { UserType } from "../interface/user.interface";

@Injectable()
export class UserService {
  constructor(
    private readonly actorContextService: ActorContextService,
    private readonly appwriteService: AppwriteService,
  ) {}

  public async getUserType() : Promise<UserType | null> {
    const context = this.actorContextService.get();

    const appwriteUser = context?.user?.appwrite;
    if (!appwriteUser) {
      return null;
    }

    // TODO: Check user team memberships to determine user type
    // For now, we will just return "CUSTOMER" for all users
    return "CUSTOMER";
  }
}
