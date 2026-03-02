import { createAppwriteClient } from "@repo/appwrite/appwrite";
import { useEffect, useState } from "react";

export function useAuth() {
	const account = createAppwriteClient();

	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		account
			.get()
			.then(setUser)
			.catch(() => setUser(null))
			.finally(() => setLoading(false));
	}, []);

	const login = async (email: string, password: string) => {
		await account.createEmailPasswordSession({
			email,
			password,
		});
		const user = await account.get();
		setUser(user);
	};

	const logout = async () => {
		await account.deleteSession({
			sessionId: "current",
		});
		setUser(null);
	};

	const getJWT = async (): Promise<string> => {
		const jwt = await account.createJWT();
		return jwt.jwt;
	};

	return { user, loading, login, logout, getJWT };
}
