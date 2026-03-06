import { Models } from "node-appwrite";

export interface UserRequest extends Request {
  user: JwtUser;
  meta: RequestMeta;
}

export interface JwtUser {
  id: string;
  appwrite: Models.User;
}

export interface RequestMeta {
  userAgent: string;
  ipAddress: string;
}
