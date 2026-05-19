import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import * as RadixToast from "@radix-ui/react-toast";

const ToastContext = createContext(undefined);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((payload) => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 9);
    const t = { id, title: payload.title, description: payload.description, type: payload.type || "info" };
    setToasts((s) => [...s, t]);
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts((s) => s.filter((t) => t.id !== id));
  }, []);

  const ctx = useMemo(() => ({ push, remove }), [push, remove]);

  return (
    <ToastContext.Provider value={ctx}>
      <RadixToast.Provider swipeDirection="right">
        {children}

        {toasts.map((t) => (
          <RadixToast.Root
            key={t.id}
            open={true}
            onOpenChange={(open) => {
              if (!open) remove(t.id);
            }}
            className="max-w-md w-full bg-white border border-gray-100 rounded-xl shadow-lg p-3 flex flex-col gap-1"
          >
            {t.title && (
              <RadixToast.Title className="text-sm font-semibold text-gray-900">{t.title}</RadixToast.Title>
            )}
            {t.description && (
              <RadixToast.Description className="text-xs text-gray-600">{t.description}</RadixToast.Description>
            )}
          </RadixToast.Root>
        ))}

        <RadixToast.Viewport className="fixed bottom-4 right-4 w-full max-w-sm z-50" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default ToastProvider;
