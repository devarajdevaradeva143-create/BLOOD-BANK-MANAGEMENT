import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

const SAFETY_ITEMS = [
  {
    id: "sterile",
  },
  {
    id: "trained-staff",
  },
  {
    id: "testing",
  },
  {
    id: "recovery",
  },
];

export default function SafetySection() {
  const { t } = useLanguage();
  return (
    <section className="bg-gray-50 py-16 dark:bg-slate-950 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("about.safety.badge")}
          </span>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {t("about.safety.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-slate-400">
            {t("about.safety.subtitle")}
          </p>
          <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-brand-600" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {SAFETY_ITEMS.map((item, index) => (
            <div
              key={item.id}
              className="animate-slide-up flex gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
                <CheckCircle2 className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {t(`about.safety.${item.id}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                  {t(`about.safety.${item.id}.desc`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
