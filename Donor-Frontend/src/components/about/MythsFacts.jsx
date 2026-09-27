import { Fragment } from "react";
import { X, Check } from "lucide-react";
import { MYTHS_AND_FACTS } from "../../data/constants";
import { useLanguage } from "../../i18n/LanguageContext";

export default function MythsFacts() {
  const { t } = useLanguage();
  return (
    <section className="bg-gray-50 py-16 dark:bg-slate-950 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center animate-fade-in">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {t("about.myths.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-slate-400">
            {t("about.myths.subtitle")}
          </p>
          <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-brand-600" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {MYTHS_AND_FACTS.map((item, index) => (
            <Fragment key={item.id}>
              <div
                className="animate-slide-up rounded-2xl border border-brand-100 bg-brand-50 p-6 shadow-sm dark:border-brand-900/50 dark:bg-brand-950/40"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white">
                    <X className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">
                    {t("about.myths.mythBadge")}
                  </span>
                </div>
                <p className="mt-4 text-sm font-medium leading-relaxed text-gray-700 dark:text-slate-300 sm:text-base">
                  {t(`about.myth.${item.id}.myth`)}
                </p>
              </div>

              <div
                className="animate-slide-up rounded-2xl border border-green-100 bg-green-50 p-6 shadow-sm dark:border-green-900/50 dark:bg-green-950/40"
                style={{ animationDelay: `${index * 60 + 40}ms` }}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
                    {t("about.myths.factBadge")}
                  </span>
                </div>
                <p className="mt-4 text-sm font-medium leading-relaxed text-gray-700 dark:text-slate-300 sm:text-base">
                  {t(`about.myth.${item.id}.fact`)}
                </p>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
