import { Client, Models } from "node-appwrite";

export interface UserRequest extends Request {
  user: JwtUser;
  meta: RequestMeta;
}

export interface JwtUser {
  id: string;
  appwrite: Models.User;
  jwt: string;
  client: Client;
}

export interface RequestMeta {
  userAgent: string;
  ipAddress: string;
}
