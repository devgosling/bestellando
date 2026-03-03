import { appwriteClient } from "@repo/lib/appwrite";

export function useAuth() {
	const account = appwriteClient;

	const login = async (email: string, password: string) => {
		await account.createEmailPasswordSession({
			email,
			password,
		});
	};

	const logout = async () => {
		await account.deleteSession({
			sessionId: "current",
		});
	};

	return { login, logout };
}
