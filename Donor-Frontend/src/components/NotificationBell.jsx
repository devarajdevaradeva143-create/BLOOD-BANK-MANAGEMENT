import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Award,
  Bell,
  CheckCircle2,
  Droplet,
  Info,
  Trash2,
  User,
} from "lucide-react";
import { useDonorAuth } from "../context/DonorAuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import {
  deleteNotification,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../lib/api";

function normalizeList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.notifications)) return res.notifications;
  return [];
}

function normalizeUnread(res) {
  const value = res?.unread ?? res?.count ?? 0;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? Math.floor(num) : 0;
}

function getId(n) {
  return n?.notificationId ?? n?.id;
}

function formatTime(createdAt) {
  try {
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString();
  } catch {
    return "";
  }
}

function iconForType(type) {
  const value = String(type || "").toLowerCase();
  if (
    value.includes("donat") ||
    value.includes("blood") ||
    value.includes("request") ||
    value.includes("emergency") ||
    value.includes("urgent")
  ) {
    if (value.includes("emergency") || value.includes("urgent") || value.includes("request"))
      return AlertCircle;
    return Droplet;
  }
  if (value.includes("award") || value.includes("cert")) return Award;
  if (value.includes("eligib")) return CheckCircle2;
  if (value.includes("profile")) return User;
  if (value.includes("info") || value.includes("system")) return Info;
  return Bell;
}

export default function NotificationBell({ onNavigate } = {}) {
  const { isAuthenticated } = useDonorAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const rootRef = useRef(null);
  const openRef = useRef(false);
  openRef.current = open;

  const fetchUnread = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnread(normalizeUnread(res));
    } catch {
      // silent fail — backend may be unreachable
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    try {
      const res = await listNotifications({ limit: 8 });
      setItems(normalizeList(res));
    } catch {
      // silent fail — backend may be unreachable
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnread(0);
      setItems([]);
      setOpen(false);
      return;
    }
    fetchUnread();
    fetchRecent();
    const id = setInterval(fetchUnread, 60000);
    const onFocus = () => {
      fetchUnread();
      fetchRecent();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, fetchUnread, fetchRecent]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open ]);

  const close = useCallback(() => {
    setOpen(false);
    if (typeof onNavigate === "function") {
      try {
        onNavigate();
      } catch {
        // ignore
      }
    }
  }, [onNavigate]);

  const handleItemClick = useCallback(
    async (n) => {
      const id = getId(n);
      if (id && !n?.read) {
        try {
          await markNotificationRead(id);
        } catch {
          // silent fail
        }
        setItems((prev) =>
          prev.map((x) => (getId(x) === id ? { ...x, read: true } : x))
        );
        setUnread((prev) => Math.max(0, prev - 1));
      }
      const link = n?.link;
      setOpen(false);
      if (typeof onNavigate === "function") {
        try {
          onNavigate();
        } catch {
          // ignore
        }
      }
      if (typeof link === "string" && link.startsWith("/")) {
        navigate(link);
      }
    },
    [navigate, onNavigate]
  );

  const handleMarkAll = useCallback(async () => {
    try {
      await markAllNotificationsRead();
    } catch {
      // silent fail
    }
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
  }, []);

  const handleDelete = useCallback(
    async (n) => {
      const id = getId(n);
      if (!id) return;
      const wasUnread = !n?.read;
      setItems((prev) => prev.filter((x) => getId(x) !== id));
      if (wasUnread) setUnread((prev) => Math.max(0, prev - 1));
      try {
        await deleteNotification(id);
      } catch {
        fetchRecent();
        fetchUnread();
      }
    },
    [fetchRecent, fetchUnread]
  );

  if (!isAuthenticated) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) fetchRecent();
        }}
        aria-label={t("nav.notifications")}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl sm:w-96 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {t("nav.notifications")}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                {t("nav.markAllRead")}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {t("nav.noNotifications")}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((n, i) => {
                  const Icon = iconForType(n?.type);
                  const key = getId(n) ?? i;
                  return (
                    <li
                      key={key}
                      className={
                        n?.read
                          ? undefined
                          : "bg-red-50/50 dark:bg-red-950/20"
                      }
                    >
                      <div className="flex items-start gap-1 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800">
                        <button
                          type="button"
                          onClick={() => handleItemClick(n)}
                          className="flex min-w-0 flex-1 items-start gap-3 text-left"
                        >
                          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                              {n?.title || ""}
                            </span>
                            {n?.body && (
                              <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                                {n.body}
                              </span>
                            )}
                            {n?.createdAt && (
                              <span className="mt-1 block text-[11px] text-slate-400 dark:text-slate-500">
                                {formatTime(n.createdAt)}
                              </span>
                            )}
                          </span>
                          {!n?.read && (
                            <span
                              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-600"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(n);
                          }}
                          aria-label={t("nav.deleteNotification")}
                          title={t("nav.deleteNotification")}
                          className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-100 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link
            to="/notifications"
            onClick={close}
            className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-slate-800 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            {t("nav.viewAll")}
          </Link>
        </div>
      )}
    </div>
  );
}
