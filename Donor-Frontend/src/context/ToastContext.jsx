import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

const MAX_TOASTS = 4;
const DISMISS_MS = 3500;
let toastCounter = 0;

function createId() {
  toastCounter += 1;
  return `toast-${Date.now().toString(36)}-${toastCounter.toString(36)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const pushToast = useCallback(
    (type, message) => {
      const id = createId();
      setToasts((prev) => {
        const next = [...prev, { id, type, message }];
        while (next.length > MAX_TOASTS) {
          const dropped = next.shift();
          if (timersRef.current[dropped.id]) {
            clearTimeout(timersRef.current[dropped.id]);
            delete timersRef.current[dropped.id];
          }
        }
        return next;
      });
      timersRef.current[id] = setTimeout(() => dismissToast(id), DISMISS_MS);
    },
    [dismissToast]
  );

  const toast = {
    success: (message) => pushToast("success", message),
    error: (message) => pushToast("error", message),
    info: (message) => pushToast("info", message),
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
