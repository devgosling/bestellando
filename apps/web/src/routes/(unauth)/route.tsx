import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { router } from "../../main";
import { appwriteAccount } from "@repo/lib";
import { patchUserContext } from "../../kit/router-context";

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

        router.update(patchUserContext(options, { appwriteUser }));
      } catch {
        router.update(patchUserContext(options, undefined));
      }
    }

    if (loggedIn) {
      throw redirect({
        to: "/",
      });
    }
  },
});
