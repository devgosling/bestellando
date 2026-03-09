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
import { appwriteAccount } from "@repo/lib";

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

  // Check for existing Appwrite session on mount
  useEffect(() => {
    appwriteAccount
      .get()
      .then((appwriteUser) => {
        setUserContext({ appwriteUser });
      })
      .catch(() => {
        // No active session — keep undefined
      });
  }, []);

  const value = useMemo(
    () => ({ userContext, setUserContext, updateUserContext }),
    [userContext, updateUserContext],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
