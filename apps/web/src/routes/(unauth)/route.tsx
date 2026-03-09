import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { router } from "../../main";
import { appwriteAccount } from "@repo/lib";

const UnauthLayout = () => {
  return <Outlet />;
};

export const Route = createFileRoute("/(unauth)")({
  component: UnauthLayout,
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
              ...options.context.userContext,
              appwriteUser,
            },
          },
        });
      } catch {
        router.update({
          ...options,
          context: {
            ...options.context,
            userContext: undefined,
          },
        });
      }
    }

    if (loggedIn) {
      throw redirect({
        to: "/",
      });
    }
  },
});
