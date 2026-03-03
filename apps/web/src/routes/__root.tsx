import { useEffect, type ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import type { Models } from "appwrite";
import type { ThemeContextType } from "@repo/contexts";
import { useAuth } from "@repo/hooks";

export interface UserContext {
	appwriteUser: Models.User;
}

const AuthGate = ({ children }: { children: ReactNode }) => {
	const { user, loading } = useAuth();
	const navigate = useNavigate();

	/*const { matches } = useRouterState({
		select: (state) => ({ matches: state.matches }),
	});*/

	const isPublicRoute = true; // TODO: determine based on route meta or similar
	useEffect(() => {
		if (!loading && !user && !isPublicRoute) {
			navigate({ to: "/login", replace: true });
		}
	}, [loading, user, isPublicRoute, navigate]);

	if (loading && !user) {
		return (
			<div className="min-h-screen flex align-items-center justify-content-center surface-ground">
				<span
					className="pi pi-spin pi-spinner text-2xl"
					aria-label="loading"
				/>
			</div>
		);
	}

	if (!user && !isPublicRoute) {
		return null;
	}

	return <>{children}</>;
};

const RootLayout = () => {
	return (
		<AuthGate>
			<Outlet />
		</AuthGate>
	);
};

export interface RouterContext {
	userContext?: UserContext;
	theme: ThemeContextType;
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});
