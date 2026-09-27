import { Droplets, HeartHandshake, FlaskConical, Activity } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

const FACTS = [
  {
    id: "three-lives",
    icon: HeartHandshake,
  },
  {
    id: "no-manufacture",
    icon: FlaskConical,
  },
  {
    id: "constant-demand",
    icon: Activity,
  },
];

export default function ImportanceSection() {
  const { t } = useLanguage();
  return (
    <section className="bg-white py-16 dark:bg-slate-900 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="animate-fade-in">
            <span className="inline-flex items-center rounded-full bg-brand-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
              {t("about.importance.badge")}
            </span>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {t("about.importance.title")}
            </h2>
            <div className="mt-4 h-1 w-12 rounded-full bg-brand-600" />
            <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-600 dark:text-slate-400">
              <p>{t("about.importance.p1")}</p>
              <p>{t("about.importance.p2")}</p>
              <p>{t("about.importance.p3")}</p>
            </div>
          </div>

          <div className="animate-slide-up">
            <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-sm dark:border-slate-700 dark:from-slate-950 dark:to-slate-900 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
                  <Droplets className="h-8 w-8" />
                </div>
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
                  <HeartHandshake className="h-8 w-8" />
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {FACTS.map((fact) => {
                  const Icon = fact.icon;
                  return (
                    <div
                      key={fact.id}
                      className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                    >
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                          {t(`about.fact.${fact.id}.title`)}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                          {t(`about.fact.${fact.id}.desc`)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
