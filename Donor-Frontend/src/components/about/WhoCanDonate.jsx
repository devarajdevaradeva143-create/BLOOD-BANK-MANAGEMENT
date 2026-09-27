import { Link } from "react-router-dom";
import { Check, ClipboardCheck, ArrowRight } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

const CRITERIA = [
  {
    id: "age",
  },
  {
    id: "weight",
  },
  {
    id: "haemoglobin",
  },
  {
    id: "interval",
  },
  {
    id: "health",
  },
];

export default function WhoCanDonate() {
  const { t } = useLanguage();
  return (
    <section className="bg-white py-16 dark:bg-slate-900 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="animate-fade-in">
            <span className="inline-flex items-center rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {t("about.who.badge")}
            </span>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {t("about.who.title")}
            </h2>
            <div className="mt-4 h-1 w-12 rounded-full bg-brand-600" />
            <p className="mt-6 text-base leading-relaxed text-gray-600 dark:text-slate-400">
              {t("about.who.text")}
            </p>

            <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-6 dark:border-brand-900/50 dark:bg-brand-950/40">
              <div className="flex items-start gap-3">
                <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {t("about.who.ctaTitle")}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                    {t("about.who.ctaText")}
                  </p>
                  <Link
                    to="/eligibility"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                  >
                    {t("about.who.ctaButton")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <ul className="animate-slide-up grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {CRITERIA.map((item, index) => (
              <li
                key={item.id}
                className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    {t(`about.criterion.${item.id}.label`)}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {t(`about.criterion.${item.id}.value`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
