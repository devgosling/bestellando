import { appwriteAccount, appwriteClient } from "@repo/lib";

export function useAuth() {
	const account = appwriteAccount;

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
