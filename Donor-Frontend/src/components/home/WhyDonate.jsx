import { HeartPulse, Stethoscope, Users } from "lucide-react";
import { WHY_DONATE } from "../../data/constants";
import { useLanguage } from "../../i18n/LanguageContext";

const ICONS = {
  "heart-pulse": HeartPulse,
  stethoscope: Stethoscope,
  users: Users,
};

export default function WhyDonate() {
  const { t } = useLanguage();
  return (
    <section className="bg-white py-16 dark:bg-slate-900 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center animate-fade-in">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {t("home.why.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-slate-400">
            {t("home.why.subtitle")}
          </p>
          <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-brand-600" />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {WHY_DONATE.map((item, index) => {
            const Icon = ICONS[item.icon] ?? HeartPulse;
            return (
              <div
                key={item.id}
                className="animate-slide-up group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900/40 dark:group-hover:bg-brand-600">
                  <Icon className="h-7 w-7 text-brand-600 transition-colors group-hover:text-white dark:text-brand-400" />
                </div>
                <h3 className="mt-6 text-lg font-bold text-gray-900 dark:text-white">
                  {t(`home.why.${item.id}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400 sm:text-base">
                  {t(`home.why.${item.id}.desc`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
