import { Link } from "react-router-dom";
import { Droplet } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export default function NotFoundPage() {
  const { t } = useLanguage();

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="animate-slide-up w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/40">
          <Droplet
            className="h-8 w-8 text-brand-600 dark:text-brand-400"
            aria-hidden="true"
          />
        </div>
        <p className="text-7xl font-extrabold tracking-tight text-brand-600 dark:text-brand-400">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          {t("notfound.title")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
          {t("notfound.text")}
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
        >
          {t("notfound.backHome")}
        </Link>
      </div>
    </section>
  );
}
