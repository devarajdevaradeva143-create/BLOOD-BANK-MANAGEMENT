import { Link } from "react-router-dom";
import {
  ClipboardCheck,
  Activity,
  Droplets,
  Award,
  History,
  Bell,
  Medal,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";
import { BENEFITS } from "../../data/constants";
import { useLanguage } from "../../i18n/LanguageContext";

const ICONS = {
  "clipboard-check": ClipboardCheck,
  activity: Activity,
  droplets: Droplets,
  award: Award,
  history: History,
  bell: Bell,
  medal: Medal,
};

export default function BenefitsGrid() {
  const { t } = useLanguage();
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center animate-fade-in">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {t("benefits.grid.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-slate-400">
            {t("benefits.grid.subtitle")}
          </p>
          <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-brand-600" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((item, index) => {
            const Icon = ICONS[item.icon] || HeartHandshake;
            return (
              <article
                key={item.id}
                className="animate-slide-up group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900/40 dark:text-brand-400 dark:group-hover:bg-brand-600 dark:group-hover:text-white">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                  {t(`benefit.${item.id}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                  {t(`benefit.${item.id}.desc`)}
                </p>
              </article>
            );
          })}

          <div className="animate-slide-up flex flex-col items-start justify-between rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white shadow-sm sm:col-span-2 lg:col-span-1"
            style={{ animationDelay: `${BENEFITS.length * 70}ms` }}
          >
            <div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <HeartHandshake className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold">
                {t("benefits.highlight.title")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-100">
                {t("benefits.highlight.text")}
              </p>
            </div>
            <Link
              to="/register"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition-colors hover:bg-brand-50"
            >
              {t("benefits.highlight.cta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-slate-800 dark:bg-slate-950 animate-fade-in sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("benefits.cta.title")}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              {t("benefits.cta.text")}
            </p>
          </div>
          <Link
            to="/process"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t("benefits.cta.button")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
