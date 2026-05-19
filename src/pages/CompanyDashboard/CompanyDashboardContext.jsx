import { createContext, useContext } from "react";

export const CompanyDashboardContext = createContext(null);

export function useCompanyDashboard() {
  const context = useContext(CompanyDashboardContext);
  if (!context) {
    throw new Error("useCompanyDashboard must be used within a CompanyDashboardProvider");
  }
  return context;
}
