import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { router } from "../../main";
import { appwriteAccount, appwriteClient } from "@repo/lib";

const ProtectedCustomerLayout = () => {
	return <Outlet />;
};

export const Route = createFileRoute("/(protected-customer)")({
	component: ProtectedCustomerLayout,
	beforeLoad: async (options) => {
		let loggedIn = options.context.userContext !== undefined;

		

		if (!loggedIn) {
			try {
				const appwriteUser = await appwriteAccount.get();
				loggedIn = true;

				router.update({
					...options,
					context: {
						...options.context,
						userContext: {
							appwriteUser
						}
					}
				});
			} catch {
				loggedIn = false;

				router.update({
					...options,
					context: {
						...options.context,
						userContext: undefined,
					},
				});

				
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
