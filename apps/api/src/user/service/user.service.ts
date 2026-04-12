import { Injectable, BadRequestException } from "@nestjs/common";
import { ActorContextService } from "../../auth/service/actor-context.service";
import { UserType } from "../interface/user.interface";
import sdk, { Account, Client, Teams, Users } from "node-appwrite";
import { ConfigService } from "@nestjs/config";
import { RegisterDTO } from "@repo/interfaces";
import { AppwriteService } from "src/auth/service/appwrite.service";

@Injectable()
export class UserService {
  private readonly users: Users;

  constructor(
    private readonly actorContextService: ActorContextService,
    private readonly configService: ConfigService,
    private readonly appwriteService: AppwriteService,
  ) {
    this.users = new Users(this.appwriteService.getSDKClient());
  }

  public async getUserType(): Promise<UserType | null> {
    const context = this.actorContextService.get();

    const appwriteUser = context?.user?.appwrite;
    if (!appwriteUser) {
      return null;
    }

    const teams = new Teams(context.user.client);
    const userTeams = await teams.list();

    for (const team of userTeams.teams) {
      if (team.$id === this.configService.get<string>("ADMIN_TEAM_ID")) {
        return "ADMIN";
      }

      try {
        const memberships = await teams.listMemberships({
          teamId: team.$id,
          queries: [sdk.Query.equal("userId", appwriteUser.$id)],
        });

        // Find the current user's membership in this team
        const userMembership = memberships.memberships.find(
          (m) => m.userId === appwriteUser.$id,
        );

        if (
          userMembership &&
          userMembership.roles &&
          userMembership.roles.length > 0
        ) {
          // Check roles to determine user type
          if (
            userMembership.roles.includes("restaurant") ||
            userMembership.roles.includes("RESTAURANT")
          ) {
            return "RESTAURANT";
          }
          if (
            userMembership.roles.includes("delivery_person") ||
            userMembership.roles.includes("DELIVERY_PERSON")
          ) {
            return "DELIVERY_PERSON";
          }
        }
      } catch (error) {
        console.error(`Error getting memberships for team ${team.$id}:`, error);
      }
    }

    return "CUSTOMER";
  }

  public async registerUser(data: RegisterDTO) {
    let user;
    try {
      user = await this.users.create({
        userId: sdk.ID.unique(),
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password,
      });
    } catch (error: any) {
      if (error?.type === "user_already_exists") {
        throw new BadRequestException("Ein Benutzer mit dieser E-Mail existiert bereits.");
      }
      throw error;
    }

    const jwt = await this.users.createJWT({ userId: user.$id });

    this.actorContextService.set({
      ...this.actorContextService.get(),
      user: {
        id: user.$id,
        appwrite: user,
        jwt: jwt.jwt,
        client: this.appwriteService.createUserClient(jwt.jwt),
      },
    })

    return { success: true };
  };
}
