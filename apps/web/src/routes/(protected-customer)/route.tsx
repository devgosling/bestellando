import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { router } from "../../main";
import { appwriteAccount } from "@repo/lib";

const ProtectedCustomerLayout = () => {
	return <Outlet />;
};

export const Route = createFileRoute("/(protected-customer)")({
	component: ProtectedCustomerLayout,
	validateSearch: (
		search: Record<string, string>,
	): { redirectUrl: string } => {
		return {
			redirectUrl: search.redirectUrl ? String(search.redirectUrl) : "/",
		};
	},
	beforeLoad: async (options) => {
		let loggedIn = options.context.userContext !== undefined;

		if (!loggedIn) {
			try {
				await appwriteAccount.get();
				loggedIn = true;
			} catch {
				loggedIn = false;

				router.update({
					context: {
						userContext: undefined,
						queryClient: options.context.queryClient,
						theme: options.context.theme,
					},
				});

				if (loggedIn) {
					throw redirect({
						to: options.search.redirectUrl,
					});
				}
			}
		}

		if (!loggedIn && !options.location.pathname.includes("/login")) {
			throw redirect({
				to: "/login",
				search: {
					redirectUrl: location.pathname,
				},
			});
		}
	},
});
