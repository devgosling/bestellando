import { Client, Account } from "appwrite";
 
export const createAppwriteClient = () : Account => {
    const client = new Client()
    .setEndpoint(import.meta.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || import.meta.env.VITE_APPWRITE_ENDPOINT!)
    .setProject(import.meta.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || import.meta.env.VITE_APPWRITE_PROJECT_ID!);

    return new Account(client);
}