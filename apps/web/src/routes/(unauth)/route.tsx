import { createFileRoute, Outlet, redirect, useRouteContext } from "@tanstack/react-router";
import { router } from "../../main";
import { appwriteAccount } from "@repo/lib";
import { useContext } from "react";

const UnauthLayout = () => {
	return <Outlet />;
};

export const Route = createFileRoute("/(unauth)")({
	component: UnauthLayout,
	beforeLoad: async (options) => {
		let loggedIn = options.context.userContext !== undefined;

		if (!loggedIn) {
			try {
				await appwriteAccount.get();
				loggedIn = true;

				router.update({
					context: {
						...options.context,
						userContext: ,
					},
				})
			} catch {
				router.update({
					context: {
						...options.context,
						userContext: undefined,
					},
				})
			}

		if (loggedIn) {
			throw redirect({
				to: "/",
			})
		}
	},
});
