import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import PageHeader from "../components/PageHeader";
import { useLanguage } from "../i18n/LanguageContext";
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../lib/api";

const PAGE_SIZE = 10;
const FETCH_LIMIT = 20;

function normalizeList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.notifications)) return res.notifications;
  return [];
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

export default function NotificationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listNotifications({ limit: FETCH_LIMIT });
      setItems(normalizeList(res));
    } catch {
      // silent fail — backend may be unreachable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const onFocus = () => {
      fetchAll();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchAll]);

  const handleMarkAll = useCallback(async () => {
    try {
      await markAllNotificationsRead();
    } catch {
      // silent fail
    }
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
  }, []);

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
      }
      const link = n?.link;
      if (typeof link === "string" && link.startsWith("/")) {
        navigate(link);
      }
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (n) => {
      const id = getId(n);
      if (!id) return;
      if (!window.confirm(t("nav.deleteConfirm"))) return;
      setItems((prev) => prev.filter((x) => getId(x) !== id));
      try {
        await deleteNotification(id);
      } catch {
        fetchAll();
      }
    },
    [fetchAll, t]
  );

  const unreadCount = useMemo(
    () => items.filter((n) => !n?.read).length,
    [items]
  );

  const filtered = useMemo(
    () => (filter === "unread" ? items.filter((n) => !n?.read) : items),
    [items, filter]
  );

  const visible = filtered.slice(0, visibleCount);

  const tabClass = (active) =>
    `rounded-xl px-4 py-2 text-sm font-semibold transition ${
      active
        ? "bg-red-600 text-white shadow-sm shadow-red-600/30"
        : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
    } border border-slate-200 dark:border-slate-800`;

  return (
    <div>
      <PageHeader title={t("nav.notifications")} icon={<Bell className="w-8 h-8" />} />
      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilter("all");
                  setVisibleCount(PAGE_SIZE);
                }}
                aria-pressed={filter === "all"}
                className={tabClass(filter === "all")}
              >
                {t("nav.filterAll")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter("unread");
                  setVisibleCount(PAGE_SIZE);
                }}
                aria-pressed={filter === "unread"}
                className={tabClass(filter === "unread")}
              >
                {t("nav.filterUnread")}
                {unreadCount > 0 ? ` (${unreadCount})` : ""}
              </button>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                {t("nav.markAllRead")}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col gap-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="mt-3 h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="mt-2 h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                <Bell className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="mt-4 text-base font-bold text-gray-900 dark:text-white">
                {t("nav.notificationsEmpty")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visible.map((n, i) => {
                const Icon = iconForType(n?.type);
                const key = getId(n) ?? i;
                return (
                  <article
                    key={key}
                    className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${
                      n?.read ? "" : "border-red-200 dark:border-red-900"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => handleItemClick(n)}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
                        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-bold text-gray-900 sm:text-base dark:text-white">
                              {n?.title || ""}
                            </span>
                            {!n?.read && (
                              <span
                                className="h-2 w-2 shrink-0 rounded-full bg-red-600"
                                aria-hidden="true"
                              />
                            )}
                          </span>
                          {n?.body && (
                            <span className="mt-1 block text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                              {n.body}
                            </span>
                          )}
                          {n?.createdAt && (
                            <span className="mt-2 block text-xs text-gray-400 dark:text-slate-500">
                              {formatTime(n.createdAt)}
                            </span>
                          )}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(n);
                        }}
                        aria-label={t("nav.deleteNotification")}
                        title={t("nav.deleteNotification")}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-100 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/60 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && visibleCount < filtered.length && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {t("nav.loadMore")}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
