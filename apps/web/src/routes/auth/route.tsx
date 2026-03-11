import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { appwriteAccount } from "@repo/lib";
import {
  setUserContextImperative,
  updateUserContextImperative,
} from "../../providers/auth-store";

const UnauthLayout = () => {
  return <Outlet />;
};

export const Route = createFileRoute("/auth")({
  component: UnauthLayout,
  beforeLoad: async (options) => {
    let loggedIn = options.context.userContext !== undefined;

    if (!loggedIn) {
      try {
        const appwriteUser = await appwriteAccount.get();
        loggedIn = true;

        updateUserContextImperative({ appwriteUser });
      } catch {
        setUserContextImperative(undefined);
      }
    }

    if (loggedIn) {
      throw redirect({
        to: "/",
      });
    }
  },
});
