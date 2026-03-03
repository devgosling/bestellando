import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	Outlet,
} from "@tanstack/react-router";
import type { Models } from "appwrite";
import type { ThemeContextType } from "@repo/contexts";

export interface UserContext {
	appwriteUser: Models.User;
}

const RootLayout = () => {
	return <Outlet />;
};

export interface RouterContext {
	userContext?: UserContext;
	theme: ThemeContextType;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});
