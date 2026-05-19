import { createContext, useContext } from "react";

export const AdminDashboardContext = createContext(null);

export function useAdminDashboard() {
  const context = useContext(AdminDashboardContext);
  if (!context) {
    throw new Error("useAdminDashboard must be used within an AdminDashboardProvider");
  }
  return context;
}
