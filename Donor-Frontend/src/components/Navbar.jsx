import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Droplet,
  Languages,
  LogIn,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  X,
  User,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useDonorAuth } from "../context/DonorAuthContext";
import { useLanguage } from "../i18n/LanguageContext";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useLanguage();
  const { isAuthenticated, logout } = useDonorAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/login", { replace: true });
  };

  const links = [
    { to: "/", label: t("nav.home") },
    { to: "/about", label: t("nav.about") },
    { to: "/donate", label: t("nav.donate") },
    { to: "/benefits", label: t("nav.benefits") },
    { to: "/faq", label: t("nav.faq") },
    { to: "/contact", label: t("nav.contact") },
  ];

  const linkClass = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
      isActive
        ? "bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    }`;

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <Droplet className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold text-gray-900 dark:text-white">
              Life Saver Blood Bank
            </span>
            <span className="hidden text-[11px] font-medium text-gray-500 dark:text-slate-400 lg:block">
              {t("nav.tagline")}
            </span>
          </span>
        </Link>

        <nav
          aria-label={t("nav.mainNav")}
          className="hidden items-center gap-1 lg:flex"
        >
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={linkClass}
              end={link.to === "/"}
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/admin/approvals" className={linkClass}>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Admin
            </span>
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleLang}
            aria-label={
              lang === "en" ? t("nav.switchToTamil") : t("nav.switchToEnglish")
            }
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

          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="hidden items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white md:inline-flex"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                {t("nav.profile")}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white md:inline-flex"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="hidden items-center justify-center gap-1.5 rounded-lg border border-brand-600 px-4 py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-brand-500 dark:text-brand-400 dark:hover:bg-brand-600 dark:hover:text-white dark:focus-visible:ring-offset-slate-950 md:inline-flex"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              {t("nav.login")}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
          >
            {menuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="absolute inset-x-0 top-16 border-b border-gray-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <nav
            aria-label={t("nav.mobileNav")}
            className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={linkClass}
                end={link.to === "/"}
                onClick={closeMenu}
              >
                {link.label}
              </NavLink>
            ))}
            <NavLink
              to="/admin/approvals"
              className={linkClass}
              onClick={closeMenu}
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Admin
              </span>
            </NavLink>
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <User className="h-4 w-4" aria-hidden="true" />
                  {t("nav.profile")}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {t("nav.logout")}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={closeMenu}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-brand-600 px-4 py-2.5 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-600 hover:text-white dark:border-brand-500 dark:text-brand-400 dark:hover:bg-brand-600 dark:hover:text-white"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                {t("nav.login")}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
