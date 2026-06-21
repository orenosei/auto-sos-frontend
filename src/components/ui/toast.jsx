import React, { useCallback, useMemo, useRef, useState } from "react";
import * as RadixToast from "@radix-ui/react-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  MessageSquareText,
  ShieldAlert,
  X,
  XCircle,
} from "lucide-react";
import { ToastContext } from "./internalToastContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";

const toastStyles = {
  success: {
    icon: CheckCircle2,
    iconClass: "bg-emerald-100 text-emerald-600",
    progressClass: "bg-emerald-500",
  },
  error: {
    icon: XCircle,
    iconClass: "bg-red-100 text-red-600",
    progressClass: "bg-red-500",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "bg-amber-100 text-amber-600",
    progressClass: "bg-amber-500",
  },
  info: {
    icon: Info,
    iconClass: "bg-pink-100 text-pink-600",
    progressClass: "bg-pink-500",
  },
};

const defaultTitles = {
  success: "Thành công",
  error: "Đã xảy ra lỗi",
  warning: "Cần chú ý",
  info: "Thông báo",
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const dialogResolverRef = useRef(null);

  const push = useCallback((payload) => {
    const normalized =
      typeof payload === "string" ? { description: payload } : payload ?? {};
    const type = normalized.type || "info";
    const id = `${Date.now()}${Math.random().toString(36).slice(2, 9)}`;
    const toast = {
      id,
      title: normalized.title || defaultTitles[type] || defaultTitles.info,
      description: normalized.description,
      type,
      duration: normalized.duration ?? 4500,
    };
    setToasts((current) => [...current, toast]);
    return id;
  }, []);

  const remove = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const closeDialog = useCallback((result) => {
    const resolve = dialogResolverRef.current;
    dialogResolverRef.current = null;
    setDialog(null);
    resolve?.(result);
  }, []);

  const openDialog = useCallback((options) => {
    if (dialogResolverRef.current) {
      dialogResolverRef.current(null);
    }

    return new Promise((resolve) => {
      dialogResolverRef.current = resolve;
      setDialog(options);
    });
  }, []);

  const confirm = useCallback(
    (options) =>
      openDialog({
        mode: "confirm",
        title: "Xác nhận thao tác",
        description: "",
        confirmText: "Xác nhận",
        cancelText: "Hủy",
        tone: "danger",
        ...(typeof options === "string" ? { description: options } : options),
      }),
    [openDialog]
  );

  const prompt = useCallback(
    (options) =>
      openDialog({
        mode: "prompt",
        title: "Nhập thông tin",
        description: "",
        confirmText: "Tiếp tục",
        cancelText: "Hủy",
        placeholder: "",
        defaultValue: "",
        required: false,
        ...(typeof options === "string" ? { description: options } : options),
      }),
    [openDialog]
  );

  const notify = useMemo(
    () => ({
      push,
      remove,
      confirm,
      prompt,
      success: (description, title = defaultTitles.success) =>
        push({ title, description, type: "success" }),
      error: (description, title = defaultTitles.error) =>
        push({ title, description, type: "error" }),
      warning: (description, title = defaultTitles.warning) =>
        push({ title, description, type: "warning" }),
      info: (description, title = defaultTitles.info) =>
        push({ title, description, type: "info" }),
    }),
    [confirm, prompt, push, remove]
  );

  return (
    <ToastContext.Provider value={notify}>
      <RadixToast.Provider swipeDirection="right">
        {children}

        {toasts.map((toast) => {
          const style = toastStyles[toast.type] || toastStyles.info;
          const Icon = style.icon;

          return (
            <RadixToast.Root
              key={toast.id}
              open
              duration={toast.duration}
              onOpenChange={(open) => {
                if (!open) remove(toast.id);
              }}
              className="relative w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-900/10 data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full"
            >
              <div className="flex items-start gap-3 p-4 pr-11">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.iconClass}`}>
                  <Icon size={20} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <RadixToast.Title className="text-sm font-bold text-gray-900">
                    {toast.title}
                  </RadixToast.Title>
                  {toast.description && (
                    <RadixToast.Description className="mt-1 whitespace-pre-line text-xs leading-5 text-gray-600">
                      {toast.description}
                    </RadixToast.Description>
                  )}
                </div>
                <RadixToast.Close
                  className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Đóng thông báo"
                >
                  <X size={15} />
                </RadixToast.Close>
              </div>
              <div className={`h-1 ${style.progressClass}`} />
            </RadixToast.Root>
          );
        })}

        <RadixToast.Viewport className="fixed bottom-4 right-4 z-[120] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 outline-none" />
      </RadixToast.Provider>

      <NotificationDialog dialog={dialog} onClose={closeDialog} />
    </ToastContext.Provider>
  );
}

function NotificationDialog({ dialog, onClose }) {
  const [value, setValue] = useState("");
  const isPrompt = dialog?.mode === "prompt";
  const isDanger = dialog?.tone === "danger";
  const canSubmit = !isPrompt || !dialog?.required || value.trim().length > 0;

  React.useEffect(() => {
    setValue(dialog?.defaultValue ?? "");
  }, [dialog]);

  return (
    <Dialog
      open={Boolean(dialog)}
      onOpenChange={(open) => {
        if (!open) onClose(isPrompt ? null : false);
      }}
    >
      <DialogContent
        className="overflow-hidden rounded-3xl border-0 bg-white p-0 shadow-2xl sm:max-w-md"
        onPointerDownOutside={(event) => {
          if (dialog?.disableOutsideClose) event.preventDefault();
        }}
      >
        <div className="p-6">
          <DialogHeader className="text-left">
            <div
              className={`mb-2 flex h-12 w-12 items-center justify-center rounded-2xl ${
                isDanger ? "bg-red-100 text-red-600" : "bg-pink-100 text-pink-600"
              }`}
            >
              {isPrompt ? <MessageSquareText size={23} /> : <ShieldAlert size={23} />}
            </div>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {dialog?.title}
            </DialogTitle>
            {dialog?.description && (
              <DialogDescription className="whitespace-pre-line text-sm leading-6 text-gray-600">
                {dialog.description}
              </DialogDescription>
            )}
          </DialogHeader>

          {isPrompt && (
            <textarea
              autoFocus
              rows={4}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={dialog?.placeholder}
              className="mt-5 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 transition focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-100"
            />
          )}
        </div>

        <DialogFooter className="border-t border-gray-100 bg-gray-50/80 px-6 py-4 sm:justify-end">
          <button
            type="button"
            onClick={() => onClose(isPrompt ? null : false)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
          >
            {dialog?.cancelText}
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => onClose(isPrompt ? value : true)}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50 ${
              isDanger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-linear-to-r from-pink-500 to-pink-400 hover:shadow-pink-200"
            }`}
          >
            {dialog?.confirmText}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ToastProvider;
