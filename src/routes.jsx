import { createBrowserRouter } from "react-router-dom";
import Root from "./components/Root";
import Home from "./pages/Home";
import FindServices from "./pages/FindServices";
import UserDashboard from "./pages/UserDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Community from "./pages/Community";
import Login from "./pages/Login";
import UserProfile from "./pages/UserProfile";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "find-services", Component: FindServices },
      { path: "dashboard", Component: UserDashboard },
      { path: "profile", Component: UserProfile },
      { path: "company", Component: CompanyDashboard },
      { path: "admin", Component: AdminDashboard },
      { path: "community", Component: Community },
      { path: "login", Component: Login },
    ],
  },
]);
