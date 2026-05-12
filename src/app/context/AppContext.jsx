import React, { createContext, useContext, useEffect, useState } from "react";
import { mockNotifications } from "../data/mockData";
import { loginCompany, loginUser, registerCompany, registerUser } from "../api/auth";
import { toUiUser } from "../api/mappers";

const AppContext = createContext(undefined);

export function AppProvider({ children }) {
  const [currentRole, setCurrentRoleState] = useState("user");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  const storageKey = "auto-sos.auth";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.role && parsed?.user) {
        setCurrentRoleState(parsed.role);
        setCurrentUser(parsed.user);
        setIsLoggedIn(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const setCurrentRole = (role) => {
    setCurrentRoleState(role);
    setCurrentUser((prev) => (prev ? { ...prev, role } : prev));
  };

  const updateCurrentUser = (patch) => {
    setCurrentUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...(patch ?? {}) };
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ role: currentRole, user: next })
        );
      } catch {
        // ignore
      }
      return next;
    });
  };

  const login = async (role, identifier, password) => {
    if (role === "company") {
      const res = await loginCompany(identifier, password);
      const ui = toUiUser("company", res.data);
      setCurrentRoleState("company");
      setCurrentUser(ui);
      setIsLoggedIn(true);
      localStorage.setItem(storageKey, JSON.stringify({ role: "company", user: ui }));
      return;
    }

    // Backend hiện chỉ có login cho users/companies; admin tạm thời dùng users login.
    const res = await loginUser(identifier, password);
    const effectiveRole = role === "admin" ? "admin" : "user";
    const ui = toUiUser(effectiveRole, res.data);
    setCurrentRoleState(effectiveRole);
    setCurrentUser(ui);
    setIsLoggedIn(true);
    localStorage.setItem(storageKey, JSON.stringify({ role: effectiveRole, user: ui }));
  };

  const register = async (role, payload) => {
    if (role === "admin") {
      throw new Error("Hiện chưa hỗ trợ đăng ký tài khoản admin");
    }

    if (role === "company") {
      const res = await registerCompany(payload);
      const ui = toUiUser("company", res.data);
      setCurrentRoleState("company");
      setCurrentUser(ui);
      setIsLoggedIn(true);
      localStorage.setItem(storageKey, JSON.stringify({ role: "company", user: ui }));
      return;
    }

    const res = await registerUser(payload);
    const ui = toUiUser("user", res.data);
    setCurrentRoleState("user");
    setCurrentUser(ui);
    setIsLoggedIn(true);
    localStorage.setItem(storageKey, JSON.stringify({ role: "user", user: ui }));
  };

  const loginDemo = (role) => {
    const demo = {
      id: role === "company" ? "1" : role === "admin" ? "0" : "1",
      name: role === "company" ? "Demo Company" : role === "admin" ? "Demo Admin" : "Demo User",
      email: "",
      phone: "",
      role,
      avatar: role.slice(0, 1).toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    setCurrentRoleState(role);
    setCurrentUser(demo);
    setIsLoggedIn(true);
    localStorage.setItem(storageKey, JSON.stringify({ role, user: demo }));
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        updateCurrentUser,
        currentUser,
        isLoggedIn,
        setIsLoggedIn,
        login,
        register,
        loginDemo,
        logout,
        notifications,
        markAllRead,
        markRead,
        unreadCount,
        emergencyOpen,
        setEmergencyOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}