import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, HelpCircle, ArrowRight } from "lucide-react";
import { FAQS } from "../../data/constants";
import { useLanguage } from "../../i18n/LanguageContext";

export default function FaqAccordion() {
  const { t } = useLanguage();
  const [openId, setOpenId] = useState(FAQS[0]?.id ?? null);

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center animate-fade-in">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-400">
            <HelpCircle className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {t("faq.section.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-slate-400">
            {t("faq.section.subtitle")}
          </p>
          <div className="mx-auto mt-4 h-1 w-12 rounded-full bg-brand-600" />
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map((item, index) => {
            const isOpen = openId === item.id;
            const panelId = `faq-panel-${item.id}`;
            const buttonId = `faq-button-${item.id}`;

            return (
              <div
                key={item.id}
                className="animate-slide-up overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <h3>
                  <button
                    type="button"
                    id={buttonId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(item.id)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                  >
                    <span className="text-sm font-semibold text-gray-900 sm:text-base dark:text-white">
                      {t(`faq.${item.id}.q`)}
                    </span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                        isOpen
                          ? "bg-brand-600 text-white"
                          : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                      aria-hidden="true"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="px-6 pb-5"
                >
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                    {t(`faq.${item.id}.a`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-brand-100 bg-brand-50 p-8 text-center dark:border-brand-900/50 dark:bg-brand-950/40 animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {t("faq.contact.title")}
          </h3>
          <p className="max-w-md text-sm text-gray-600 dark:text-slate-400">
            {t("faq.contact.text")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
            >
              {t("faq.contact.button")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="tel:104"
              className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 dark:border-brand-700 dark:bg-slate-900 dark:text-brand-400 dark:hover:bg-brand-900/40"
            >
              {t("faq.contact.emergency")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
