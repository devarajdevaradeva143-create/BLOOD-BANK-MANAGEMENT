import { Link } from "react-router-dom";
import { ClipboardList, Stethoscope, Droplet, ArrowRight } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

const STEPS = [
  {
    id: "register",
    step: "01",
    icon: ClipboardList,
  },
  {
    id: "screen",
    step: "02",
    icon: Stethoscope,
  },
  {
    id: "donate",
    step: "03",
    icon: Droplet,
  },
];

export default function HowItWorksTeaser() {
  const { t } = useLanguage();
  return (
    <section className="bg-gray-50 py-16 dark:bg-slate-950 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {t("home.how.title")}
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-slate-400">
              {t("home.how.subtitle")}
            </p>
            <div className="mt-4 h-1 w-12 rounded-full bg-brand-600" />
          </div>
          <Link
            to="/process"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {t("home.how.viewFull")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                to="/process"
                className="animate-slide-up group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold tracking-widest text-brand-600 dark:text-brand-400">
                    {item.step}
                  </span>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900/40 dark:text-brand-400 dark:group-hover:bg-brand-600 dark:group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
                  {t(`home.how.step.${item.id}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                  {t(`home.how.step.${item.id}.desc`)}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
