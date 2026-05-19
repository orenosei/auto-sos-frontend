import { createContext, useContext } from "react";

export const UserDashboardContext = createContext(null);

export function useUserDashboard() {
  const context = useContext(UserDashboardContext);
  if (!context) {
    throw new Error("useUserDashboard must be used within a UserDashboardProvider");
  }
  return context;
}
