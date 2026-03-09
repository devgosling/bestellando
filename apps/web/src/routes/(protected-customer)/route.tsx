import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { router } from "../../main";
import { appwriteAccount, authenticatedFetch } from "@repo/lib";
import { patchUserContext } from "../../kit/router-context";

const ProtectedCustomerLayout = () => {
  return <Outlet />;
};

export const Route = createFileRoute("/(protected-customer)")({
  component: ProtectedCustomerLayout,
  beforeLoad: async (options) => {
    let loggedIn = options.context.userContext !== undefined;
    let userRole = options.context.userContext?.userRole;

    if (!loggedIn) {
      try {
        const appwriteUser = await appwriteAccount.get();
        loggedIn = true;

        router.update(patchUserContext(options, { appwriteUser }));
      } catch {
        loggedIn = false;

        router.update(patchUserContext(options, undefined));
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

    if (!userRole) {
      const { role } = await authenticatedFetch("/v1/user/data");
      userRole = role;
      router.update(patchUserContext(options, { userRole: role }));
    }

    if (userRole !== "CUSTOMER") {
      throw redirect({
        to: "/",
      });
    }
  },
});
