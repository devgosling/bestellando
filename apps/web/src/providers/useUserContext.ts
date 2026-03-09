import { useContext } from "react";
import { AuthContext } from "./AuthProvider";

export function useUserContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useUserContext must be used within an AuthProvider");
  }
  return ctx;
}
