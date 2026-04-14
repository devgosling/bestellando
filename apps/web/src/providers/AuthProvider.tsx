import {
  createContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type { UserContext } from "../routes/__root";
import { registerAuthSetters, unregisterAuthSetters } from "./auth-store";
import {
  appwriteAccount,
  authenticatedFetch,
  connectSockets,
  disconnectSockets,
} from "@repo/lib";

interface AuthContextValue {
  userContext: UserContext | undefined;
  setUserContext: (userContext: UserContext | undefined) => void;
  updateUserContext: (patch: Partial<UserContext>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
export { AuthContext };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userContext, setUserContext] = useState<UserContext | undefined>(
    undefined,
  );

  const updateUserContext = useCallback((patch: Partial<UserContext>) => {
    setUserContext(
      (prev) =>
        ({
          ...prev,
          ...patch,
        }) as UserContext,
    );
  }, []);

  useEffect(() => {
    registerAuthSetters(setUserContext, updateUserContext);
    return () => {
      unregisterAuthSetters();
    };
  }, [updateUserContext]);

  // Check for existing Appwrite session on mount and fetch role
  useEffect(() => {
    appwriteAccount
      .get()
      .then(async (appwriteUser) => {
        setUserContext({ appwriteUser });
        connectSockets().catch(() => {});
        try {
          const data = (await authenticatedFetch(
            "/v1/user/data",
            undefined,
            false,
          )) as { role?: UserContext["userRole"] };
          if (data?.role) {
            setUserContext({ appwriteUser, userRole: data.role });
          }
        } catch {
          // Role fetch failed — leave userRole undefined
        }
      })
      .catch(() => {
        // No active session — keep undefined
        disconnectSockets();
      });

    return () => {
      disconnectSockets();
    };
  }, []);

  const value = useMemo(
    () => ({ userContext, setUserContext, updateUserContext }),
    [userContext, updateUserContext],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
