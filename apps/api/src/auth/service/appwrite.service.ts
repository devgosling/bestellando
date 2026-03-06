import { Injectable } from "@nestjs/common";
import { Client } from "node-appwrite";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppwriteService {
  constructor(private readonly configService: ConfigService) {}

  createUserClient(jwt: string) {
    return new Client()
      .setEndpoint(<string>this.configService.get("APPWRITE_ENDPOINT"))
      .setProject(<string>this.configService.get("APPWRITE_PROJECT"))
      .setJWT(jwt);
  }

  getSDKClient(): Client {
    return new Client()
      .setEndpoint(<string>this.configService.get("APPWRITE_ENDPOINT"))
      .setProject(<string>this.configService.get("APPWRITE_PROJECT"))
      .setKey(<string>this.configService.get("APPWRITE_API_KEY"));
  }
}
