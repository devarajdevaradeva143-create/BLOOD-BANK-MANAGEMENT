import { Link } from "react-router-dom";
import {
  ClipboardList,
  Stethoscope,
  Droplet,
  Armchair,
  Sofa,
  Bell,
  ArrowRight,
} from "lucide-react";
import { PROCESS_STEPS } from "../../data/constants";
import { useLanguage } from "../../i18n/LanguageContext";

const ICONS = {
  "clipboard-list": ClipboardList,
  stethoscope: Stethoscope,
  droplet: Droplet,
  armchair: Armchair || Sofa,
  bell: Bell,
};

export default function ProcessTimeline() {
  const { t } = useLanguage();
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute left-6 top-0 h-full w-0.5 bg-gradient-to-b from-brand-600 via-brand-400 to-brand-100 dark:from-brand-600 dark:via-brand-700 dark:to-brand-900/40 md:left-1/2 md:-translate-x-1/2"
          />

          <ol className="flex flex-col gap-12">
            {PROCESS_STEPS.map((item, index) => {
              const Icon = ICONS[item.icon] || Droplet;
              const isLeft = index % 2 === 0;

              return (
                <li
                  key={item.id}
                  className="relative animate-slide-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div
                    className={`relative flex items-start gap-4 pl-16 md:w-1/2 md:pl-0 ${
                      isLeft
                        ? "md:pr-12 md:text-right md:items-end"
                        : "md:ml-auto md:pl-12"
                    }`}
                  >
                    <div
                      className={`absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-full border-2 border-brand-600 bg-white text-brand-600 shadow-md dark:bg-slate-900 dark:text-brand-400 md:left-auto md:right-[-1.5rem] ${
                        isLeft ? "md:left-auto md:right-[-1.5rem]" : "md:left-[-1.5rem]"
                      }`}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>

                    <span className="absolute -top-8 left-0 text-xs font-bold uppercase tracking-widest text-brand-500 dark:text-brand-400 md:left-auto md:right-0">
                      {t("process.step.label", { n: item.step })}
                    </span>

                    <div
                      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 ${
                        isLeft ? "" : ""
                      }`}
                    >
                      <div
                        className={`flex items-center gap-3 ${
                          isLeft ? "md:flex-row-reverse md:justify-end" : ""
                        }`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
                          {item.step}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {t(`process.step.${item.id}.title`)}
                        </h3>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                        {t(`process.step.${item.id}.desc`)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center dark:border-brand-900/50 dark:bg-brand-950/40 sm:flex-row sm:justify-between sm:text-left animate-fade-in">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("process.cta.title")}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              {t("process.cta.text")}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/eligibility"
              className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 dark:border-brand-700 dark:bg-slate-900 dark:text-brand-400 dark:hover:bg-brand-900/40"
            >
              {t("process.cta.checkEligibility")}
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              {t("process.cta.register")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
