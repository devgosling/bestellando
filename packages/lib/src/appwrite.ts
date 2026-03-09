import { Account, Client } from "appwrite";
import { properties } from "../consts/properties";

export const appwriteClient = new Client();

appwriteClient
  .setEndpoint(properties.appwrite.url)
  .setProject(properties.appwrite.project);

export const appwriteAccount = new Account(appwriteClient);
export { ID } from "appwrite";
