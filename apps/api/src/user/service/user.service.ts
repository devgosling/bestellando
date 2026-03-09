import { Injectable } from "@nestjs/common";
import { ActorContextService } from "src/auth/service/actor-context.service";
import { UserType } from "../interface/user.interface";
import sdk, { Teams } from "node-appwrite";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class UserService {
  constructor(
    private readonly actorContextService: ActorContextService,
    private readonly configService: ConfigService,
  ) {}

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
            userMembership.roles.includes("DELIVER_PERSON")
          ) {
            return "DELIVER_PERSON";
          }
        }
      } catch (error) {
        console.error(`Error getting memberships for team ${team.$id}:`, error);
      }
    }

    return "CUSTOMER";
  }
}
