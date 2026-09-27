import { Droplet, Mail, Phone } from "lucide-react";
import { CONTACT_INFO } from "../data/constants";
import { useLanguage } from "../i18n/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
                <Droplet className="h-5 w-5 text-white" aria-hidden="true" />
              </span>
              <span className="text-lg font-bold text-white">
                Life Saver Blood Bank Management in Tamil Nadu
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              {t("footer.brandTagline")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t("footer.emergency")}
            </h3>
            <p className="mt-4 text-sm text-slate-400">
              {t("footer.helpline")}
            </p>
            <a
              href="tel:104"
              className="mt-2 inline-flex items-center gap-2 text-3xl font-extrabold text-brand-500 transition-colors hover:text-brand-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              <Phone className="h-6 w-6" aria-hidden="true" />
              {CONTACT_INFO.emergency}
            </a>
            <p className="mt-3 text-xs text-slate-500">
              {t("footer.available247")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t("footer.email")}
            </h3>
            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="mt-4 inline-flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              <Mail
                className="h-4 w-4 shrink-0 text-brand-500"
                aria-hidden="true"
              />
              {CONTACT_INFO.email}
            </a>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              {t("footer.hours")}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              {CONTACT_INFO.address}
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 text-center text-sm text-slate-500 sm:text-left">
          <p>{t("footer.copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
