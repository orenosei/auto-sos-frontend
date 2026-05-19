import React, { useEffect, useState } from "react";
import { AppContext } from "./internalAppContext";
import { mockNotifications } from "../data/mockData";
import { loginCompany, loginUser, registerCompany, registerUser } from "../api/auth";
import { toUiUser } from "../api/mappers";
import { getNotifications, markNotificationRead } from "../api/notifications";

export function AppProvider({ children }) {
  const storageKey = "auto-sos.auth";

  const [currentRole, setCurrentRoleState] = useState(() => {
    try {
      if (typeof window === "undefined") return "user";
      const raw = localStorage.getItem(storageKey);
      if (!raw) return "user";
      const parsed = JSON.parse(raw);
      return parsed?.role ?? "user";
    } catch (err) {
      console.warn(err);
      return "user";
    }
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      if (typeof window === "undefined") return null;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.user ?? null;
    } catch (err) {
      console.warn(err);
      return null;
    }
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    try {
      if (typeof window === "undefined") return false;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!parsed?.user;
    } catch (err) {
      console.warn(err);
      return false;
    }
  });
  const [notifications, setNotifications] = useState(mockNotifications);
  const [emergencyOpen, setEmergencyOpen] = useState(false);

  // initial state is read via lazy initializers above

  // Poll notifications when logged in
  useEffect(() => {
    let mounted = true;
    let timer = null;

    const load = async () => {
      if (!isLoggedIn || !currentUser) return;
      try {
        const recipientType = currentRole === 'company' ? 'company' : 'user';
        const data = await getNotifications(recipientType, currentUser.id);
        if (!mounted) return;
        setNotifications(() => {
          // map to local shape { id, title, message, read, createdAt }
          const mapped = (data ?? []).map((n) => ({
            id: String(n.notification_id),
            title: n.title,
            message: n.message,
            read: !!n.is_read,
            createdAt: n.created_at,
            requestId: n.request_id,
            type: n.notification_type,
          }));
          return mapped;
        });
      } catch (err) {
        console.warn(err);
      }
    };

    if (isLoggedIn) {
      load();
      timer = setInterval(load, 5000);
    }

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [isLoggedIn, currentUser, currentRole]);

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

    const res = await loginUser(identifier, password);
    if (role === "admin" && res.role !== "admin" && res.data?.user_role !== "admin") {
      throw new Error("Tài khoản này không có quyền quản trị");
    }
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
    // Optionally mark on server (best-effort)
    notifications.forEach((n) => {
      if (!n.read) markNotificationRead(n.id).catch(() => {});
    });
  };

  const markRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    markNotificationRead(id).catch(() => {});
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

// `useApp` hook moved to `src/context/useApp.js` to keep this file exporting only components
