import { applyDecorators, SetMetadata } from "@nestjs/common";
import { UserType } from "../../user/interface/user.interface";

export const USER_TYPE_KEY = "userTypeKey";
export const RequireUserType = (types: UserType[]) => {
  const metadata = SetMetadata(USER_TYPE_KEY, types);
  return applyDecorators(metadata);
};
