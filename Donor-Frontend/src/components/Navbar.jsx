import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Droplet,
  Languages,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
  User,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useDonorAuth } from "../context/DonorAuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const { isAuthenticated, logout } = useDonorAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/login", { replace: true });
  };

  const links = [
    { to: "/", key: "nav.home", end: true },
    { to: "/about", key: "nav.about" },
    { to: "/donate", key: "nav.donate" },
    { to: "/benefits", key: "nav.benefits" },
    { to: "/faq", key: "nav.faq" },
    { to: "/contact", key: "nav.contact" },
  ];

  function linkClassName({ isActive }) {
    return `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300"
        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;
  }

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-800 dark:bg-slate-950/80">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8 ${
          pathname === "/" ? (lang === "ta" ? "nav-shift-ta" : "nav-shift-en") : ""
        }`}
      >
        <Link to="/" className="flex h-9 items-center gap-2.5" onClick={() => setOpen(false)}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm shadow-red-600/30">
            <Droplet className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Life Saver Blood Bank
            </p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs">
              {t("nav.tagline")}
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClassName}>
              {t(link.key)}
            </NavLink>
          ))}
        </div>

        <div className="flex h-10 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleLang}
            aria-label={lang === "en" ? t("nav.switchToTamil") : t("nav.switchToEnglish")}
            title={lang === "en" ? t("nav.switchToTamil") : t("nav.switchToEnglish")}
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <Languages className="h-4 w-4" aria-hidden="true" />
            {lang === "en" ? "Tamil" : "EN"}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t("nav.toggleTheme")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <NotificationBell />
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="hidden h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 lg:flex dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <User size={16} aria-hidden="true" />
                {t("nav.profile")}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 lg:flex dark:border-red-900 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <LogOut size={16} aria-hidden="true" />
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden h-10 items-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm shadow-red-600/30 transition hover:bg-red-700 lg:flex dark:bg-red-600 dark:hover:bg-red-700"
            >
              {t("nav.login")}
            </Link>
          )}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition duration-200 hover:bg-slate-50 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-950/95">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `block w-full ${linkClassName({ isActive })}`
                }
                onClick={() => setOpen(false)}
              >
                {t(link.key)}
              </NavLink>
            ))}
            {isAuthenticated && (
              <div className="flex items-center justify-between rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {t("nav.notifications")}
                </span>
                <NotificationBell onNavigate={() => setOpen(false)} />
              </div>
            )}
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-400"
                  onClick={() => setOpen(false)}
                >
                  <User size={16} aria-hidden="true" />
                  {t("nav.profile")}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:bg-slate-900 dark:text-red-400"
                >
                  <LogOut size={16} aria-hidden="true" />
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="mt-1 block w-full rounded-lg bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-red-700"
                onClick={() => setOpen(false)}
              >
                {t("nav.login")}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
