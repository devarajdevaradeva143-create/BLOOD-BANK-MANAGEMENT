import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useToast } from "../context/ToastContext";

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const styles = {
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
  info: "text-blue-600 dark:text-blue-400",
};

export default function Toast() {
  const { toasts, dismissToast } = useToast();

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed right-4 top-20 z-[60] flex w-80 flex-col gap-2"
    >
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            role="status"
            className="animate-toast-in flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            <Icon
              className={`mt-0.5 h-5 w-5 shrink-0 ${styles[toast.type]}`}
              aria-hidden="true"
            />
            <p className="flex-1 text-sm font-medium text-gray-800 dark:text-slate-100">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
