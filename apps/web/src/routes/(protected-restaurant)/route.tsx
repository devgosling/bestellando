import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { appwriteAccount, authenticatedFetch } from "@repo/lib";
import {
  setUserContextImperative,
  updateUserContextImperative,
} from "../../providers/auth-store";

const ProtectedRestaurantLayout = () => {
  return <Outlet />;
};

export const Route = createFileRoute("/(protected-restaurant)")({
  component: ProtectedRestaurantLayout,
  beforeLoad: async (options) => {
    let loggedIn = options.context.userContext !== undefined;
    let userRole = options.context.userContext?.userRole;

    if (!loggedIn) {
      try {
        const appwriteUser = await appwriteAccount.get();
        loggedIn = true;
        updateUserContextImperative({ appwriteUser });
      } catch {
        loggedIn = false;
        setUserContextImperative(undefined);
      }
    }

    if (!loggedIn && !options.location.pathname.includes("/login")) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirectUrl: location.pathname,
        },
      });
    }

    if (!userRole) {
      const { role } = await authenticatedFetch("/v1/user/data");
      userRole = role;
      updateUserContextImperative({ userRole: role });
    }

    if (userRole !== "RESTAURANT") {
      throw redirect({
        to: "/",
      });
    }
  },
  staticData: {
    showHeader: true,
    showFooter: true,
  },
});
