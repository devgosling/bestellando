import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy as BearerStrategy } from "passport-http-bearer";
import { AppwriteService } from "../service/appwrite.service";
import { JwtUser } from "../interface/user-request.interface";
import { Account } from "node-appwrite";

@Injectable()
export class JwtStrategy extends PassportStrategy(BearerStrategy, "jwt") {
  constructor(private readonly appwriteService: AppwriteService) {
    super();
  }

  async validate(token: string): Promise<JwtUser> {
    try {
      const client = this.appwriteService.createUserClient(token);
      const account = new Account(client);

      const user = await account.get();

      return {
        id: user.$id,
        appwrite: user,
      };
    } catch {
      throw new UnauthorizedException("Invalid JWT");
    }
  }
}
