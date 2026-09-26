import { Link } from "react-router-dom";
import { Siren, Phone, UserPlus } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

export default function EmergencyCta() {
  const { t } = useLanguage();
  return (
    <section className="bg-gradient-to-r from-brand-600 to-brand-700 py-16 text-white md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
              <Siren className="h-4 w-4" />
              {t("home.emergency.badge")}
            </div>
            <h2 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
              {t("home.emergency.title")}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-brand-100 sm:text-lg">
              {t("home.emergency.text")}
            </p>
          </div>

          <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center animate-slide-up">
            <a
              href="tel:104"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-4 text-base font-bold text-brand-700 shadow-lg transition hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600"
            >
              <Phone className="h-5 w-5" />
              {t("home.emergency.call")}
            </a>
            <Link
              to="/donate"
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/70 px-8 py-4 text-base font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-600"
            >
              <UserPlus className="h-5 w-5" />
              {t("home.emergency.becomeDonor")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
