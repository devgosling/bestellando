import { redirect } from "@tanstack/react-router";
import { appwriteAccount, authenticatedFetch } from "@repo/lib";
import type { UserContext } from "../routes/__root";
import {
  setUserContextImperative,
  updateUserContextImperative,
} from "./auth-store";

// Cache the role fetch to prevent duplicate API calls during
// beforeLoad re-runs caused by context updates.
let roleFetchInFlight: Promise<string> | null = null;
let cachedRole: string | null = null;

export async function ensureAuthenticated(
  context: { userContext?: UserContext },
  pathname: string,
  requiredRole: string,
) {
  let loggedIn = context.userContext !== undefined;
  let userRole = context.userContext?.userRole ?? cachedRole;

  // Try to restore session if context is empty
  if (!loggedIn) {
    try {
      const appwriteUser = await appwriteAccount.get();
      loggedIn = true;
      updateUserContextImperative({ appwriteUser });
    } catch {
      loggedIn = false;
      cachedRole = null;
      setUserContextImperative(undefined);
    }
  }

  if (!loggedIn) {
    throw redirect({
      to: "/auth/login",
      search: { redirectUrl: pathname },
    });
  }

  // Fetch role once, dedup concurrent calls
  if (!userRole) {
    if (!roleFetchInFlight) {
      roleFetchInFlight = authenticatedFetch("/v1/user/data", undefined, false)
        .then((res: { role: string }) => {
          cachedRole = res.role;
          return res.role;
        })
        .catch(() => {
          return "" as string;
        })
        .finally(() => {
          roleFetchInFlight = null;
        });
    }
    userRole = await roleFetchInFlight;
    if (userRole) {
      updateUserContextImperative({ userRole: userRole as UserContext["userRole"] });
    }
  }

  if (userRole !== requiredRole) {
    throw redirect({ to: "/" });
  }
}

export function clearCachedRole() {
  cachedRole = null;
}
